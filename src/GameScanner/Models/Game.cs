using System.Collections.Generic;

namespace DLSS5Manager.GameScanner.Models
{
    public class Game
    {
        public string Id { get; set; } = "";
        public string Name { get; set; } = "";
        public string InstallDirectory { get; set; } = "";
        public string Launcher { get; set; } = "";
        public string? CoverImage { get; set; }
        public string? Icon { get; set; }
    }
}
