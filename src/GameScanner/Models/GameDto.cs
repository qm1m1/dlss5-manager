namespace DLSS5Manager.GameScanner.Models
{
    /// <summary>
    /// 返回给前端的游戏数据传输对象（DTO）。
    /// 字段命名与前端 types.ts 的 Game 接口一一对应，
    /// ASP.NET Core 序列化时会把 PascalCase 自动转成 camelCase。
    /// </summary>
    public class GameDto
    {
        public string Id { get; set; } = "";

        public string Name { get; set; } = "";

        public string Path { get; set; } = "";

        public string Launcher { get; set; } = "";

        public string Exe { get; set; } = "";

        public string Engine { get; set; } = "未知";

        public string Api { get; set; } = "未知";

        public string DlssVersion { get; set; } = "待检测";

        public string? DlssGVersion { get; set; }

        public string? DlssDVersion { get; set; }

        public int CompatibilityScore { get; set; }

        public string RecommendedVersion { get; set; } = "3.7.0";

        public string? Icon { get; set; }

        public string? CoverImage { get; set; }
    }
}
