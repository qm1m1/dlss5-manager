using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Linq;

namespace DLSS5Manager.GPU;

/// <summary>
/// GPU 实时状态读取：调用 nvidia-smi 获取使用率、显存占用、温度、功耗、频率等指标。
/// 非 NVIDIA 或无 nvidia-smi 时返回空列表，不抛异常。
/// </summary>
public class GpuStatusReader
{
    public List<GpuStatus> GetStatus()
    {
        var list = new List<GpuStatus>();
        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = "nvidia-smi",
                Arguments =
                    "--query-gpu=name,utilization.gpu,memory.used,memory.total," +
                    "temperature.gpu,power.draw,clocks.sm,fan.speed " +
                    "--format=csv,noheader,nounits",
                UseShellExecute = false,
                RedirectStandardOutput = true,
                CreateNoWindow = true,
            };
            using var process = Process.Start(startInfo);
            if (process == null)
                return list;

            var output = process.StandardOutput.ReadToEnd();
            process.WaitForExit(5000);

            foreach (var line in output.Split('\n', StringSplitOptions.RemoveEmptyEntries))
            {
                var parts = line.Split(',').Select(p => p.Trim()).ToArray();
                if (parts.Length < 8)
                    continue;

                list.Add(new GpuStatus
                {
                    Name = parts[0],
                    UtilizationPct = ParseInt(parts[1]),
                    MemoryUsedMb = ParseLong(parts[2]),
                    MemoryTotalMb = ParseLong(parts[3]),
                    TemperatureC = ParseInt(parts[4]),
                    PowerWatts = ParseDouble(parts[5]),
                    CoreClockMhz = ParseInt(parts[6]),
                    FanPct = ParseInt(parts[7]),
                });
            }
        }
        catch (Exception)
        {
            // 非 NVIDIA 或没有 nvidia-smi：返回空
        }
        return list;
    }

    private static int? ParseInt(string s) =>
        int.TryParse(s, NumberStyles.Integer, CultureInfo.InvariantCulture, out var v) ? v : null;

    private static long? ParseLong(string s) =>
        long.TryParse(s, NumberStyles.Integer, CultureInfo.InvariantCulture, out var v) ? v : null;

    private static double? ParseDouble(string s) =>
        double.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out var v) ? v : null;
}
