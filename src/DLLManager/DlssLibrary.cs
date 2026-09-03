using System.Security.Cryptography;
using DLSS5Manager.DLLManager.Models;

namespace DLSS5Manager.DLLManager;

/// <summary>
/// DLSS 版本库服务：维护 resources/DLSS 目录下的各版本 DLL，
/// 提供「列出版本库内容」与「从已安装游戏收集 DLL 进库」两个能力。
/// 版本库目录约定为 resources/DLSS/{版本}/{fileName}，例如 resources/DLSS/3.10.1/nvngx_dlss.dll。
/// </summary>
public sealed class DlssLibrary
{
    private readonly string _libraryRoot;
    private readonly DlssScanner _scanner = new();

    /// <param name="projectRoot">项目根目录（包含 resources/ 与 data/ 的目录），缺省时自动向上查找。</param>
    public DlssLibrary(string? projectRoot = null)
    {
        _libraryRoot = Path.Combine(projectRoot ?? FindProjectRoot(), "resources", "DLSS");
    }

    /// <summary>列出当前版本库中所有版本目录及其 DLL 文件，按版本号升序。</summary>
    public List<LibraryVersion> GetLibrary()
    {
        var versions = new List<LibraryVersion>();
        if (!Directory.Exists(_libraryRoot))
            return versions;

        foreach (var versionDir in Directory.EnumerateDirectories(_libraryRoot))
        {
            var version = Path.GetFileName(versionDir);
            var files = new List<LibraryDllInfo>();
            foreach (var file in Directory.EnumerateFiles(versionDir, "nvngx_*.dll"))
            {
                var fileName = Path.GetFileName(file);
                var type = DlssScanner.GetTypeByFileName(fileName);
                if (type == null)
                    continue;

                files.Add(new LibraryDllInfo
                {
                    Type = type,
                    FileName = fileName,
                    Version = version,
                    Size = new FileInfo(file).Length,
                    Sha256 = CalculateSha256(file)
                });
            }

            if (files.Count == 0)
                continue;

            versions.Add(new LibraryVersion
            {
                Version = version,
                Files = files.OrderBy(file => file.Type, StringComparer.Ordinal).ToArray()
            });
        }

        versions.Sort((left, right) => CompareVersions(left.Version, right.Version));
        return versions;
    }

    /// <summary>
    /// 遍历一组游戏目录，把其中的 DLSS DLL 按归一化版本复制进版本库。
    /// 目标已存在且内容一致时跳过；内容不一致时保留已有文件并跳过（避免覆盖损坏）。
    /// </summary>
    public LibraryCollectResult CollectFromGames(IEnumerable<string> gameDirectories)
    {
        var items = new List<LibraryCollectItem>();
        var added = 0;
        var existing = 0;
        var skipped = 0;

        foreach (var gameDirectory in gameDirectories)
        {
            if (string.IsNullOrWhiteSpace(gameDirectory) || !Directory.Exists(gameDirectory))
                continue;

            foreach (var component in _scanner.Scan(gameDirectory))
            {
                var version = NormalizeVersion(component.Version);
                var status = CopyComponent(component, version);

                switch (status)
                {
                    case "Added": added++; break;
                    case "Existing": existing++; break;
                    default: skipped++; break;
                }

                items.Add(new LibraryCollectItem
                {
                    Version = version,
                    FileName = component.FileName,
                    Type = component.Type,
                    Source = gameDirectory,
                    Status = status
                });
            }
        }

        return new LibraryCollectResult
        {
            Added = added,
            Existing = existing,
            Skipped = skipped,
            Items = items
        };
    }

    /// <summary>把单个 DLL 复制进对应版本目录，返回 Added / Existing / Skipped。</summary>
    private string CopyComponent(DlssComponent component, string version)
    {
        try
        {
            var targetDirectory = Path.Combine(_libraryRoot, version);
            var targetFile = Path.Combine(targetDirectory, component.FileName);

            if (!File.Exists(targetFile))
            {
                Directory.CreateDirectory(targetDirectory);
                File.Copy(component.Path, targetFile, overwrite: false);
                return "Added";
            }

            return string.Equals(
                CalculateSha256(targetFile),
                component.Sha256,
                StringComparison.OrdinalIgnoreCase)
                ? "Existing"
                : "Skipped";
        }
        catch (Exception ex) when (ex is IOException
                                   or UnauthorizedAccessException
                                   or System.Security.SecurityException
                                   or NotSupportedException)
        {
            return "Skipped";
        }
    }

    /// <summary>
    /// 把 DLL 版本号归一化成版本目录名。
    /// NVIDIA 的版本资源常用逗号格式，且 major.minor 会编码成 major*100+minor
    /// （例如 3.10 记为 "310"），这里统一还原为 "major.minor.build" 三段式。
    /// </summary>
    internal static string NormalizeVersion(string? version)
    {
        if (string.IsNullOrWhiteSpace(version))
            return "unknown";

        var numbers = new List<int>();
        foreach (var segment in version.Replace(',', '.').Split('.', StringSplitOptions.RemoveEmptyEntries))
        {
            if (int.TryParse(segment.Trim(), out var number))
                numbers.Add(number);
            else
                break;
        }

        if (numbers.Count == 0)
            return "unknown";

        if (numbers[0] >= 100)
        {
            var minor = numbers[0] % 100;
            var major = numbers[0] / 100;
            numbers[0] = minor;
            numbers.Insert(0, major);
        }

        var majorVersion = numbers[0];
        var minorVersion = numbers.Count > 1 ? numbers[1] : 0;
        var build = numbers.Count > 2 ? numbers[2] : 0;

        return build > 0
            ? $"{majorVersion}.{minorVersion}.{build}"
            : $"{majorVersion}.{minorVersion}";
    }

    private static int CompareVersions(string left, string right)
    {
        if (Version.TryParse(left, out var leftVersion) &&
            Version.TryParse(right, out var rightVersion))
            return leftVersion.CompareTo(rightVersion);

        if (Version.TryParse(left, out _)) return -1;
        if (Version.TryParse(right, out _)) return 1;
        return string.Compare(left, right, StringComparison.OrdinalIgnoreCase);
    }

    private static string CalculateSha256(string path)
    {
        using var stream = new FileStream(
            path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete);
        return Convert.ToHexString(SHA256.HashData(stream));
    }

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
}
