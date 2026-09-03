using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using Microsoft.Win32;

namespace DLSS5Manager.GPU;

/// <summary>
/// GPU 检测：优先使用 nvidia-smi（NVIDIA 驱动自带、最准确、无需注册表权限），
/// 不可用时回退到注册表方案（AMD / Intel 通用）。
/// 显存使用 64 位字段 HardwareInformation.qwMemorySize，
/// 避免 WMI AdapterRAM 是 32 位、超过 4GB 会截断的问题。
/// </summary>
public class GpuScanner
{
    // 显示适配器在注册表中的固定设备类 GUID
    private const string DisplayAdapterClassGuid =
        @"{4d36e968-e325-11ce-bfc1-08002be10318}";

    // DLSS5 支持规则（依据 NVIDIA 官方 2026-09 公告）：
    // DLSS 5 仅支持 GeForce RTX 50 系列（RTX 5090/5080/5070 Ti/5070/5060 Ti/5060/5050，
    // 含对应笔记本 GPU）；RTX 40/30/20 系列因硬件限制不支持。

    // DLSS5 所需的最低 GeForce Game Ready 驱动版本。
    // 依据：NVIDIA 官方公告，需安装北京时间 2026-09-04 中午 12:00 发布的新版 Game Ready 驱动。
    // 官方页面未公布具体版本号：610.47 是已知最早内置 DLSS5（神经渲染配置）的 Game Ready 驱动，
    // 这里作为保守下限；9 月 4 日正式驱动发布后，如版本号更高，请改此常量。
    private static readonly Version Dlss5MinDriverVersion = new(610, 47);

    /// <summary>扫描本机显卡：优先 nvidia-smi，失败后回退注册表，绝不抛异常</summary>
    public List<GpuInfo> Scan()
    {
        var viaNvidiaSmi = ScanWithNvidiaSmi();
        if (viaNvidiaSmi.Count > 0)
            return viaNvidiaSmi;

        try
        {
            return ScanRegistry();
        }
        catch (Exception)
        {
            // 注册表权限不足等原因：返回空列表，避免接口 500
            return new List<GpuInfo>();
        }
    }

    /// <summary>方式一：调用 nvidia-smi（NVIDIA 驱动自带，无需额外权限）</summary>
    private static List<GpuInfo> ScanWithNvidiaSmi()
    {
        var gpus = new List<GpuInfo>();
        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = "nvidia-smi",
                Arguments =
                    "--query-gpu=name,memory.total,driver_version " +
                    "--format=csv,noheader,nounits",
                UseShellExecute = false,
                RedirectStandardOutput = true,
                CreateNoWindow = true,
            };
            using var process = Process.Start(startInfo);
            if (process == null)
                return gpus;

            var output = process.StandardOutput.ReadToEnd();
            process.WaitForExit(5000);

            foreach (var line in output.Split('\n', StringSplitOptions.RemoveEmptyEntries))
            {
                var parts = line.Split(',').Select(p => p.Trim()).ToArray();
                if (parts.Length < 3)
                    continue;

                var gpu = new GpuInfo
                {
                    Name = parts[0],
                    Vendor = "NVIDIA",
                    DriverVersion = parts[2],
                    // nvidia-smi 的 memory.total 单位是 MiB，换算成 GB
                    VramGb = double.TryParse(parts[1], out var miB)
                        ? Math.Round(miB / 1024.0, 1)
                        : null,
                };
                gpu.SupportsDlss5 = CheckDlss5Support(gpu);
                gpu.DriverReadyForDlss5 = CheckDriverReady(gpu);
                gpus.Add(gpu);
            }
        }
        catch (Exception)
        {
            // 非 NVIDIA 机器或没有 nvidia-smi：返回空，交给注册表方案
        }
        return gpus;
    }

    /// <summary>方式二：读注册表枚举所有显卡（AMD / Intel / NVIDIA 通用）</summary>
    private static List<GpuInfo> ScanRegistry()
    {
        var gpus = new List<GpuInfo>();

        using var baseKey = Registry.LocalMachine.OpenSubKey(
            @"SYSTEM\CurrentControlSet\Control\Class\" + DisplayAdapterClassGuid);
        if (baseKey == null)
            return gpus;

        foreach (var subKeyName in baseKey.GetSubKeyNames())
        {
            using var subKey = baseKey.OpenSubKey(subKeyName);
            if (subKey == null)
                continue;

            var name = subKey.GetValue("DriverDesc") as string;
            if (string.IsNullOrWhiteSpace(name) || IsVirtualAdapter(name))
                continue;

            var gpu = new GpuInfo
            {
                Name = name,
                Vendor = DetectVendor(name),
                DriverVersion = subKey.GetValue("DriverVersion") as string,
                VramGb = ReadVramGb(subKey),
            };
            gpu.SupportsDlss5 = CheckDlss5Support(gpu);
            gpu.DriverReadyForDlss5 = CheckDriverReady(gpu);
            gpus.Add(gpu);
        }
        return gpus;
    }

    /// <summary>读取 64 位显存值（字节 -> GB）</summary>
    private static double? ReadVramGb(RegistryKey subKey)
    {
        var raw = subKey.GetValue("HardwareInformation.qwMemorySize");
        if (raw is ulong qword)
            return Math.Round(qword / 1024.0 / 1024.0 / 1024.0, 1);
        if (raw is long signed)
            return Math.Round(signed / 1024.0 / 1024.0 / 1024.0, 1);
        return null;
    }

    private static string DetectVendor(string name)
    {
        if (name.Contains("NVIDIA") || name.Contains("GeForce") || name.Contains("RTX"))
            return "NVIDIA";
        if (name.Contains("AMD") || name.Contains("Radeon"))
            return "AMD";
        if (name.Contains("Intel"))
            return "Intel";
        return "Unknown";
    }

    private static bool IsVirtualAdapter(string name)
    {
        string[] markers =
        {
            "Remote", "Virtual", "Basic Display", "Microsoft", "Mirror", "Indirect",
        };
        return markers.Any(name.Contains);
    }

    /// <summary>
    /// DLSS5 支持判断：用 "GeForce RTX 50" 前缀匹配整条 RTX 50 系产品线，
    /// 同时避免误匹配专业卡（如 RTX 5000 Ada 不带 GeForce 前缀）。
    /// </summary>
    private static bool? CheckDlss5Support(GpuInfo gpu)
    {
        if (gpu.Vendor != "NVIDIA")
            return false;

        return gpu.Name.Contains("GeForce RTX 50", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// 驱动检查：nvidia-smi 返回的版本形如 "591.91"（两段式）可直接比较；
    /// 注册表返回的是 Windows 驱动号（如 31.0.15.xxxx），格式不同，返回 null（无法判断）。
    /// </summary>
    private static bool? CheckDriverReady(GpuInfo gpu)
    {
        if (gpu.Vendor != "NVIDIA" || string.IsNullOrWhiteSpace(gpu.DriverVersion))
            return null;

        if (!Version.TryParse(gpu.DriverVersion, out var current))
            return null;

        // nvidia-smi 版本是两段式；Build >= 0 说明是注册表的四段式 Windows 驱动号，无法比较
        if (current.Build >= 0)
            return null;

        return current >= Dlss5MinDriverVersion;
    }
}
