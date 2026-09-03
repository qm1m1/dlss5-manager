using System.Diagnostics;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using DLSS5Manager.GameScanner.Models;

namespace DLSS5Manager.GameScanner
{
    /// <summary>
    /// Detects the redistributable DLSS runtimes shipped in a game directory.
    /// The design follows the small, reusable part of DLSS Swapper's scanner:
    /// locate known runtime filenames and read their Windows PE version resources.
    /// </summary>
    public sealed partial class DlssScanner
    {
        public const string SuperResolution = "SuperResolution";
        public const string FrameGeneration = "FrameGeneration";
        public const string RayReconstruction = "RayReconstruction";
        public const string NeuralRendering = "NeuralRendering";

        private static readonly IReadOnlyDictionary<string, string> KnownFiles =
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["nvngx_dlss.dll"] = SuperResolution,
                ["nvngx_dlssg.dll"] = FrameGeneration,
                ["nvngx_dlssd.dll"] = RayReconstruction,
                ["nvngx_dlssnr.dll"] = NeuralRendering
            };

        private static readonly HashSet<string> NonRuntimeDirectoryNames =
            new(StringComparer.OrdinalIgnoreCase)
            {
                "backup", "backups", "cache", "download", "downloads",
                "redist", "redistributable", "sdk"
            };

        public IReadOnlyList<DlssComponent> Scan(string gameDirectory)
        {
            if (string.IsNullOrWhiteSpace(gameDirectory) || !Directory.Exists(gameDirectory))
                return Array.Empty<DlssComponent>();

            var components = new List<DlssComponent>();
            var options = new EnumerationOptions
            {
                RecurseSubdirectories = true,
                IgnoreInaccessible = true,
                ReturnSpecialDirectories = false,
                AttributesToSkip = FileAttributes.ReparsePoint
            };

            try
            {
                // Filtering at enumeration time avoids inspecting every DLL in large games.
                foreach (var path in Directory.EnumerateFiles(gameDirectory, "nvngx_*.dll", options))
                {
                    var fileName = Path.GetFileName(path);
                    if (!KnownFiles.TryGetValue(fileName, out var type))
                        continue;

                    try
                    {
                        var file = new FileInfo(path);
                        components.Add(new DlssComponent
                        {
                            Type = type,
                            FileName = fileName,
                            Path = file.FullName,
                            Version = ReadVersion(file.FullName),
                            Sha256 = CalculateSha256(file.FullName),
                            Size = file.Length
                        });
                    }
                    catch (Exception ex) when (ex is IOException
                                               or UnauthorizedAccessException
                                               or System.Security.SecurityException)
                    {
                        // A locked or protected candidate must not abort the whole game scan.
                    }
                }
            }
            catch (Exception ex) when (ex is IOException
                                       or UnauthorizedAccessException
                                       or System.Security.SecurityException)
            {
                return Array.Empty<DlssComponent>();
            }

            MarkPrimaryComponents(gameDirectory, components);
            return components
                .OrderBy(component => component.Type, StringComparer.Ordinal)
                .ThenByDescending(component => component.IsPrimary)
                .ThenBy(component => component.Path, StringComparer.OrdinalIgnoreCase)
                .ToArray();
        }

        public static DlssComponent? GetPrimary(
            IEnumerable<DlssComponent> components,
            string type) => components.FirstOrDefault(component =>
                component.IsPrimary && string.Equals(component.Type, type, StringComparison.Ordinal));

        private static string ReadVersion(string path)
        {
            try
            {
                var info = FileVersionInfo.GetVersionInfo(path);
                // FileVersion 是标准的 "major.minor.build.revision" 点号格式；
                // ProductVersion 对 NVIDIA DLL 常是 "310,1,0,0" 这类逗号格式，故仅作回退。
                return NormalizeVersion(info.FileVersion)
                       ?? NormalizeVersion(info.ProductVersion)
                       ?? "未知";
            }
            catch (Exception ex) when (ex is ArgumentException
                                       or FileNotFoundException
                                       or System.ComponentModel.Win32Exception)
            {
                return "未知";
            }
        }

        private static string? NormalizeVersion(string? rawVersion)
        {
            if (string.IsNullOrWhiteSpace(rawVersion))
                return null;

            var match = VersionNumberRegex().Match(rawVersion);
            return match.Success ? match.Value : rawVersion.Trim();
        }

        private static string CalculateSha256(string path)
        {
            using var stream = new FileStream(
                path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete);
            return Convert.ToHexString(SHA256.HashData(stream));
        }

        private static void MarkPrimaryComponents(string gameDirectory, List<DlssComponent> components)
        {
            foreach (var group in components.GroupBy(component => component.Type, StringComparer.Ordinal))
            {
                var primary = group
                    .OrderBy(component => IsProbablyInactive(gameDirectory, component.Path))
                    .ThenBy(component => GetRelativeDepth(gameDirectory, component.Path))
                    .ThenBy(component => component.Path, StringComparer.OrdinalIgnoreCase)
                    .First();
                primary.IsPrimary = true;
            }
        }

        private static bool IsProbablyInactive(string gameDirectory, string filePath)
        {
            var relativePath = Path.GetRelativePath(gameDirectory, filePath);
            var segments = relativePath.Split(
                new[] { Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar },
                StringSplitOptions.RemoveEmptyEntries);
            return segments.Take(Math.Max(segments.Length - 1, 0))
                .Any(NonRuntimeDirectoryNames.Contains);
        }

        private static int GetRelativeDepth(string gameDirectory, string filePath) =>
            Path.GetRelativePath(gameDirectory, filePath)
                .Count(character => character is '\\' or '/');

        [GeneratedRegex(@"\d+(?:\.\d+){1,3}", RegexOptions.CultureInvariant)]
        private static partial Regex VersionNumberRegex();
    }
}
