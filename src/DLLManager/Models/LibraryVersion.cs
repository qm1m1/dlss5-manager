namespace DLSS5Manager.DLLManager.Models;

/// <summary>DLSS 版本库中的一个版本目录及其下的 DLL 文件列表。</summary>
public sealed class LibraryVersion
{
    /// <summary>归一化后的版本号，作为版本库目录名，例如 "3.10.1" / "3.7"</summary>
    public string Version { get; init; } = "";

    /// <summary>该版本目录下的 DLL 文件</summary>
    public IReadOnlyList<LibraryDllInfo> Files { get; init; } = Array.Empty<LibraryDllInfo>();
}
