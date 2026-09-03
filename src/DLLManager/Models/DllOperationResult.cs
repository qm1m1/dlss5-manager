namespace DLSS5Manager.DLLManager.Models;

/// <summary>DLL 备份 / 替换 / 恢复等操作的结果。</summary>
public sealed class DllOperationResult
{
    /// <summary>操作是否成功</summary>
    public bool Success { get; init; }

    /// <summary>面向用户的结果描述</summary>
    public string Message { get; init; } = "";

    /// <summary>操作完成后的文件 SHA-256（校验通过时返回）</summary>
    public string? Sha256 { get; init; }

    public static DllOperationResult Ok(string message, string? sha256 = null) =>
        new() { Success = true, Message = message, Sha256 = sha256 };

    public static DllOperationResult Fail(string message) =>
        new() { Success = false, Message = message };
}
