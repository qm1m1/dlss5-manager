namespace DLSS5Manager.DLLManager.Models;

/// <summary>「从游戏收集 DLL 进版本库」操作的结果汇总。</summary>
public sealed class LibraryCollectResult
{
    /// <summary>新增进库的 DLL 数量</summary>
    public int Added { get; init; }

    /// <summary>已存在且内容一致、被跳过的 DLL 数量</summary>
    public int Existing { get; init; }

    /// <summary>因版本号相同但内容冲突、被跳过的 DLL 数量</summary>
    public int Skipped { get; init; }

    /// <summary>逐条收集明细，便于前端展示来源与状态</summary>
    public IReadOnlyList<LibraryCollectItem> Items { get; init; } = Array.Empty<LibraryCollectItem>();
}

/// <summary>单条 DLL 的收集结果明细。</summary>
public sealed class LibraryCollectItem
{
    public string Version { get; init; } = "";
    public string FileName { get; init; } = "";
    public string Type { get; init; } = "";

    /// <summary>该 DLL 来自哪个游戏目录</summary>
    public string Source { get; init; } = "";

    /// <summary>Added / Existing / Skipped</summary>
    public string Status { get; init; } = "";
}
