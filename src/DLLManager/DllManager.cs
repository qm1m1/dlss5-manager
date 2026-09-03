using System.Security.Cryptography;
using System.Text.Json;
using DLSS5Manager.DLLManager.Models;

namespace DLSS5Manager.DLLManager;

/// <summary>
/// DLL 管理核心服务：检测 DLL 所在文件夹、备份、替换、恢复与文件校验。
/// 所有写操作遵循「备份原文件 → 复制新 DLL → Hash 验证」的安全流程，
/// 任何一个环节失败都不会破坏游戏原文件。
/// </summary>
public sealed class DllManager
{
    private readonly string _projectRoot;
    private readonly string _dlssLibraryRoot;
    private readonly string _backupRoot;
    private readonly DlssScanner _scanner = new();

    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

    /// <param name="projectRoot">
    /// 项目根目录（包含 resources/ 与 data/ 的目录）。缺省时从运行时路径自动向上查找。
    /// </param>
    public DllManager(string? projectRoot = null)
    {
        _projectRoot = projectRoot ?? FindProjectRoot();
        _dlssLibraryRoot = Path.Combine(_projectRoot, "resources", "DLSS");
        _backupRoot = Path.Combine(_projectRoot, "data", "backups");
    }

    /// <summary>检测一个游戏目录里所有 DLSS DLL 所在的文件夹（按文件夹归组）。</summary>
    public List<DllLocationGroup> DetectLocations(string gameDirectory)
    {
        if (string.IsNullOrWhiteSpace(gameDirectory) || !Directory.Exists(gameDirectory))
            return new List<DllLocationGroup>();

        return _scanner.Scan(gameDirectory)
            .GroupBy(
                component => Path.GetDirectoryName(component.Path) ?? "",
                StringComparer.OrdinalIgnoreCase)
            .Select(group => new DllLocationGroup
            {
                FolderPath = group.Key,
                IsPrimary = group.Any(component => component.IsPrimary),
                Components = group.ToArray()
            })
            .OrderBy(group => group.FolderPath, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    /// <summary>备份指定类型的「主 DLL」到 data/backups 目录。</summary>
    public DllOperationResult Backup(string gameDirectory, string type)
    {
        if (!EnsureGameDirectory(gameDirectory, out var error))
            return DllOperationResult.Fail(error);

        var target = FindPrimary(gameDirectory, type);
        if (target == null)
            return DllOperationResult.Fail($"未检测到 {type} 类型的主 DLL");

        return BackupComponent(gameDirectory, target);
    }

    /// <summary>
    /// 用版本库中的 DLL 替换游戏里的主 DLL。
    /// 版本库目录约定为 resources/DLSS/{version}/{fileName}，例如 resources/DLSS/3.7/nvngx_dlss.dll。
    /// </summary>
    public DllOperationResult Replace(string gameDirectory, string type, string version)
    {
        if (!EnsureGameDirectory(gameDirectory, out var error))
            return DllOperationResult.Fail(error);

        if (string.IsNullOrWhiteSpace(version))
            return DllOperationResult.Fail("请指定目标版本");

        var target = FindPrimary(gameDirectory, type);
        if (target == null)
            return DllOperationResult.Fail($"未检测到 {type} 类型的主 DLL");

        var libraryFile = Path.Combine(_dlssLibraryRoot, version, target.FileName);
        if (!File.Exists(libraryFile))
            return DllOperationResult.Fail(
                $"版本库中不存在 {version} 版本的 {target.FileName}（{libraryFile}）");

        var librarySha256 = CalculateSha256(libraryFile);

        // 流程：备份原文件 -> 复制新 DLL -> Hash 验证
        var backup = BackupComponent(gameDirectory, target);
        if (!backup.Success)
            return DllOperationResult.Fail($"替换中止，备份失败：{backup.Message}");

        try
        {
            File.Copy(libraryFile, target.Path, overwrite: true);

            var finalSha256 = CalculateSha256(target.Path);
            if (!string.Equals(finalSha256, librarySha256, StringComparison.OrdinalIgnoreCase))
                return DllOperationResult.Fail(
                    $"替换后 Hash 校验失败：预期 {librarySha256}，实际 {finalSha256}");

            return DllOperationResult.Ok(
                $"已替换 {target.FileName} 为 {version} 版本", finalSha256);
        }
        catch (Exception ex) when (IsFileSystemException(ex))
        {
            return DllOperationResult.Fail($"替换失败：{ex.Message}");
        }
    }

    /// <summary>从最新备份恢复指定类型的主 DLL 到原路径。</summary>
    public DllOperationResult Restore(string gameDirectory, string type)
    {
        if (!EnsureGameDirectory(gameDirectory, out var error))
            return DllOperationResult.Fail(error);

        var latest = FindLatestBackup(gameDirectory, type);
        if (latest == null)
            return DllOperationResult.Fail($"没有找到 {type} 类型的备份记录");

        var backupFile = Path.Combine(latest.Value.Directory, latest.Value.Manifest.FileName);
        if (!File.Exists(backupFile))
            return DllOperationResult.Fail($"备份文件不存在：{backupFile}");

        var originalPath = latest.Value.Manifest.OriginalPath;
        if (!File.Exists(originalPath))
            return DllOperationResult.Fail($"原 DLL 文件已不存在：{originalPath}");

        try
        {
            File.Copy(backupFile, originalPath, overwrite: true);

            var restoredSha256 = CalculateSha256(originalPath);
            if (!string.Equals(restoredSha256, latest.Value.Manifest.Sha256, StringComparison.OrdinalIgnoreCase))
                return DllOperationResult.Fail(
                    $"恢复后 Hash 校验失败：预期 {latest.Value.Manifest.Sha256}，实际 {restoredSha256}");

            return DllOperationResult.Ok($"已恢复 {latest.Value.Manifest.FileName}", restoredSha256);
        }
        catch (Exception ex) when (IsFileSystemException(ex))
        {
            return DllOperationResult.Fail($"恢复失败：{ex.Message}");
        }
    }

    /// <summary>列出指定游戏目录的所有备份记录（按时间倒序）。</summary>
    public List<BackupRecord> ListBackups(string gameDirectory)
    {
        var records = new List<BackupRecord>();
        var gameBackupRoot = GetGameBackupRoot(gameDirectory);
        if (!Directory.Exists(gameBackupRoot))
            return records;

        foreach (var typeDirectory in Directory.EnumerateDirectories(gameBackupRoot))
        {
            foreach (var backupDirectory in Directory.EnumerateDirectories(typeDirectory))
            {
                var manifestPath = Path.Combine(backupDirectory, "manifest.json");
                if (!File.Exists(manifestPath))
                    continue;

                try
                {
                    var manifest = JsonSerializer.Deserialize<BackupManifest>(
                        File.ReadAllText(manifestPath), JsonOptions);
                    if (manifest == null)
                        continue;

                    records.Add(new BackupRecord
                    {
                        Id = Path.GetFileName(backupDirectory),
                        GamePath = manifest.GamePath,
                        Type = manifest.Type,
                        FileName = manifest.FileName,
                        OriginalPath = manifest.OriginalPath,
                        Version = manifest.Version,
                        Sha256 = manifest.Sha256,
                        BackupPath = Path.Combine(backupDirectory, manifest.FileName),
                        BackupTime = manifest.BackupTime
                    });
                }
                catch (Exception ex) when (ex is IOException
                                           or JsonException
                                           or UnauthorizedAccessException)
                {
                    // 单个损坏的备份记录不应中断整个列表
                }
            }
        }

        return records
            .OrderByDescending(record => record.BackupTime)
            .ToList();
    }

    /// <summary>列出版本库（resources/DLSS）中已存在的版本目录名。</summary>
    public List<string> ListAvailableVersions()
    {
        if (!Directory.Exists(_dlssLibraryRoot))
            return new List<string>();

        return Directory.EnumerateDirectories(_dlssLibraryRoot)
            .Select(Path.GetFileName)
            .OfType<string>()
            .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    // ===== 私有辅助 =====

    private DllOperationResult BackupComponent(string gameDirectory, DlssComponent target)
    {
        try
        {
            var backupDirectory = CreateBackupDirectory(gameDirectory, target.Type);
            var backupFile = Path.Combine(backupDirectory, target.FileName);

            File.Copy(target.Path, backupFile, overwrite: true);

            var manifest = new BackupManifest
            {
                GamePath = Path.GetFullPath(gameDirectory),
                Type = target.Type,
                FileName = target.FileName,
                OriginalPath = target.Path,
                Version = target.Version,
                Sha256 = target.Sha256,
                BackupTime = DateTime.Now
            };
            File.WriteAllText(
                Path.Combine(backupDirectory, "manifest.json"),
                JsonSerializer.Serialize(manifest, JsonOptions));

            return DllOperationResult.Ok(
                $"已备份 {target.FileName} 到 {backupDirectory}", target.Sha256);
        }
        catch (Exception ex) when (IsFileSystemException(ex))
        {
            return DllOperationResult.Fail($"备份失败：{ex.Message}");
        }
    }

    private DlssComponent? FindPrimary(string gameDirectory, string type) =>
        DlssScanner.GetPrimary(_scanner.Scan(gameDirectory), type);

    private string CreateBackupDirectory(string gameDirectory, string type)
    {
        var backupDirectory = Path.Combine(
            GetGameBackupRoot(gameDirectory),
            type,
            DateTime.Now.ToString("yyyyMMdd_HHmmss"));
        Directory.CreateDirectory(backupDirectory);
        return backupDirectory;
    }

    private string GetGameBackupRoot(string gameDirectory)
    {
        var gameName = Path.GetFileName(gameDirectory.TrimEnd(
            Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar));
        if (string.IsNullOrWhiteSpace(gameName))
            gameName = "_unknown";
        return Path.Combine(_backupRoot, gameName);
    }

    private (BackupManifest Manifest, string Directory)? FindLatestBackup(
        string gameDirectory, string type)
    {
        var typeBackupRoot = Path.Combine(GetGameBackupRoot(gameDirectory), type);
        if (!Directory.Exists(typeBackupRoot))
            return null;

        // 时间戳目录名按字典序即按时间序，倒序取最新。
        var latest = Directory.EnumerateDirectories(typeBackupRoot)
            .OrderByDescending(Path.GetFileName)
            .FirstOrDefault();
        if (latest == null)
            return null;

        var manifestPath = Path.Combine(latest, "manifest.json");
        if (!File.Exists(manifestPath))
            return null;

        try
        {
            var manifest = JsonSerializer.Deserialize<BackupManifest>(
                File.ReadAllText(manifestPath), JsonOptions);
            return manifest == null ? null : (manifest, latest);
        }
        catch (Exception ex) when (ex is IOException
                                   or JsonException
                                   or UnauthorizedAccessException)
        {
            return null;
        }
    }

    private static bool EnsureGameDirectory(string gameDirectory, out string error)
    {
        if (string.IsNullOrWhiteSpace(gameDirectory) || !Directory.Exists(gameDirectory))
        {
            error = "游戏目录不存在";
            return false;
        }

        error = "";
        return true;
    }

    private static string CalculateSha256(string path)
    {
        using var stream = new FileStream(
            path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete);
        return Convert.ToHexString(SHA256.HashData(stream));
    }

    private static bool IsFileSystemException(Exception ex) =>
        ex is IOException
        or UnauthorizedAccessException
        or System.Security.SecurityException
        or NotSupportedException
        or ArgumentException;

    private static string FindProjectRoot()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory != null)
        {
            if (Directory.Exists(Path.Combine(directory.FullName, "resources")) &&
                Directory.Exists(Path.Combine(directory.FullName, "data")))
                return directory.FullName;

            directory = directory.Parent;
        }

        return AppContext.BaseDirectory;
    }

    /// <summary>备份清单：记录备份文件的原始位置与校验信息，供恢复时使用。</summary>
    private sealed class BackupManifest
    {
        public string GamePath { get; set; } = "";
        public string Type { get; set; } = "";
        public string FileName { get; set; } = "";
        public string OriginalPath { get; set; } = "";
        public string Version { get; set; } = "";
        public string Sha256 { get; set; } = "";
        public DateTime BackupTime { get; set; }
    }
}
