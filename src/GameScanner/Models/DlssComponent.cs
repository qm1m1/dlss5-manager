namespace DLSS5Manager.GameScanner.Models
{
    /// <summary>
    /// A DLSS runtime found inside a game installation.
    /// Version alone is not a unique identity, so the path and SHA-256 are retained.
    /// </summary>
    public sealed class DlssComponent
    {
        public string Type { get; init; } = "";
        public string FileName { get; init; } = "";
        public string Path { get; init; } = "";
        public string Version { get; init; } = "未知";
        public string Sha256 { get; init; } = "";
        public long Size { get; init; }
        public bool IsPrimary { get; set; }
    }
}
