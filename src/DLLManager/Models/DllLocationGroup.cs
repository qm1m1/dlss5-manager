namespace DLSS5Manager.DLLManager.Models;

/// <summary>
/// 一个文件夹内检测到的 DLSS DLL 分组，用于「检测 DLL 所在文件夹」能力。
/// 一个游戏目录里可能存在多份同名 DLL（例如主目录 + 备份目录），按文件夹归组便于前端展示。
/// </summary>
public sealed class DllLocationGroup
{
    /// <summary>该文件夹的绝对路径</summary>
    public string FolderPath { get; init; } = "";

    /// <summary>该文件夹是否包含游戏真正加载的主 DLL（IsPrimary）</summary>
    public bool IsPrimary { get; init; }

    /// <summary>该文件夹下的 DLSS DLL 列表</summary>
    public IReadOnlyList<DlssComponent> Components { get; init; } = Array.Empty<DlssComponent>();
}
