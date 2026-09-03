namespace DLSS5Manager.GPU;

/// <summary>单块显卡的检测结果</summary>
public class GpuInfo
{
    /// <summary>显卡型号，例如 "NVIDIA GeForce RTX 5080"</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>厂商：NVIDIA / AMD / Intel / Unknown</summary>
    public string Vendor { get; set; } = "Unknown";

    /// <summary>显存（GB）；读不到时为 null</summary>
    public double? VramGb { get; set; }

    /// <summary>驱动版本（Windows 驱动版本号）</summary>
    public string? DriverVersion { get; set; }

    /// <summary>是否支持 DLSS5：true（GeForce RTX 50 系列）/ false（其它）</summary>
    public bool? SupportsDlss5 { get; set; }

    /// <summary>驱动版本是否已达到 DLSS5 要求；null = 无法判断</summary>
    public bool? DriverReadyForDlss5 { get; set; }
}
