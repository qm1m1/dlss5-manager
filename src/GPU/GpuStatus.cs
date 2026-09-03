namespace DLSS5Manager.GPU;

/// <summary>GPU 实时运行状态</summary>
public class GpuStatus
{
    public string Name { get; set; } = string.Empty;
    public int? UtilizationPct { get; set; }
    public long? MemoryUsedMb { get; set; }
    public long? MemoryTotalMb { get; set; }
    public int? TemperatureC { get; set; }
    public double? PowerWatts { get; set; }
    public int? CoreClockMhz { get; set; }
    public int? FanPct { get; set; }
}
