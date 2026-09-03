namespace DLSS5Manager.DLLManager.Models;

/// <summary>DLSS 版本库中一个 DLL 文件的信息，用于前端展示版本库内容。</summary>
public sealed class LibraryDllInfo
{
    /// <summary>DLSS 组件类型：SuperResolution / FrameGeneration / RayReconstruction / NeuralRendering</summary>
    public string Type { get; init; } = "";

    /// <summary>DLL 文件名，例如 nvngx_dlss.dll</summary>
    public string FileName { get; init; } = "";

    /// <summary>该文件所在的版本目录名（归一化后的版本号）</summary>
    public string Version { get; init; } = "";

    /// <summary>文件大小（字节）</summary>
    public long Size { get; init; }

    /// <summary>文件 SHA-256</summary>
    public string Sha256 { get; init; } = "";
}
