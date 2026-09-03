namespace DLSS5Manager.DLLManager.Models;

/// <summary>一条 DLL 备份记录，用于前端展示备份列表与执行恢复。</summary>
public sealed class BackupRecord
{
    /// <summary>备份批次标识（时间戳目录名）</summary>
    public string Id { get; init; } = "";

    /// <summary>备份时的游戏目录</summary>
    public string GamePath { get; init; } = "";

    /// <summary>DLSS 组件类型：SuperResolution / FrameGeneration / RayReconstruction / NeuralRendering</summary>
    public string Type { get; init; } = "";

    /// <summary>DLL 文件名，例如 nvngx_dlss.dll</summary>
    public string FileName { get; init; } = "";

    /// <summary>备份前 DLL 在游戏目录里的完整路径</summary>
    public string OriginalPath { get; init; } = "";

    /// <summary>备份前 DLL 的版本号</summary>
    public string Version { get; init; } = "";

    /// <summary>备份前 DLL 的 SHA-256</summary>
    public string Sha256 { get; init; } = "";

    /// <summary>备份文件在磁盘上的完整路径</summary>
    public string BackupPath { get; init; } = "";

    /// <summary>备份时间</summary>
    public DateTime BackupTime { get; init; }
}
