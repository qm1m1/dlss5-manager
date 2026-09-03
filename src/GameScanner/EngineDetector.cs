using System.Text.RegularExpressions;

namespace DLSS5Manager.GameScanner
{
    /// <summary>
    /// 根据游戏目录里的文件名特征识别游戏引擎。
    /// 检测只看文件名、不读文件内容，命中即返回，避免无谓的全量扫描。
    ///
    /// 规则主体来自 SteamDB 的 FileDetectionRuleSets（rules.ini，MIT 协议），
    /// 并针对「本地已安装的打包游戏」补充了 Unreal 的打包特征
    /// （如 *-Win64-Shipping.exe、Content/Paks/、.ucas/.utoc），
    /// 因为 SteamDB 的部分 UE 规则（Engine/Shaders/ 等）只存在于开发期目录。
    /// </summary>
    public sealed class EngineDetector
    {
        private const RegexOptions Options =
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled;

        private sealed record EngineRule(string Name, Regex[] Patterns);

        // 按优先级从高到低排列：一款游戏命中多个引擎时，返回靠前的那一个。
        // 前几个是本地装机率最高、也最容易误判的引擎，需要优先命中。
        private static readonly EngineRule[] EngineRules =
        {
            new("Unreal", Patterns(
                @"\.uasset$",
                @"\.upk$",
                @"\.ucas$",
                @"\.utoc$",
                @"(?:^|/)Engine/(?:Shaders/Binaries/|Binaries/ThirdParty/)",
                @"(?:^|/)Binaries/Win(?:64|32)/",
                @"(?:^|/)[^/]+-Win(?:64|32)-Shipping\.exe$",
                @"(?:^|/)Content/Paks/")),

            new("Unity", Patterns(
                @"(?:^|/)Unity(?:Engine|Player)\.dll$",
                @"(?:^|/)globalgamemanagers(?:\.assets)?$",
                @"(?:^|/)il2cpp_data/Metadata/global-metadata\.dat$")),

            // —— 以下为热门专有引擎（SteamDB 规则 + 额外调研补充）——
            new("RAGE", Patterns(
                @"\.rpf$")),

            new("ForzaTech", Patterns(
                @"\.carbin$",
                @"\.modelbin$",
                @"\.materialbin$",
                @"(?:^|/)GameDB\.slt$")),

            new("Apex Engine", Patterns(
                @"\.rpak$",
                @"\.starpak$")),

            new("Frostbite", Patterns(
                @"(?:^|/)Runtime_Win64_retail\.BuildSettings$",
                @"(?:^|/)Engine\.BuildInfo[^/]*\.dll$")),

            new("CryEngine", Patterns(
                @"(?:^|/)cry3dengine\.dll$",
                @"(?:^|/)CryRenderD3D1[12]\.dll$",
                @"(?:^|/)CryRenderVulkan\.dll$")),

            new("REDengine", Patterns(
                @"\.redscripts$",
                @"\.w2scripts$")),

            new("RE Engine", Patterns(
                @"(?:^|/)re_chunk_000\.pak$")),

            new("Source 2", Patterns(
                @"(?:^|/)gameinfo\.gi$")),

            new("Source", Patterns(
                @"(?:^|/)gameinfo\.txt$",
                @"(?:^|/)(?:vphysics|bsppack)\.dll$")),

            new("GoldSrc", Patterns(
                @"(?:^|Bin/)vgui\.dll$")),

            new("Godot", Patterns(
                @"(?:^|/)project\.godot$",
                @"(?:^|/)GodotSharp\.dll$",
                @"\.pck$")),

            new("Ubisoft Anvil", Patterns(
                @"(?:^|/)(?:datapc(?:64|_boot)?|gamedatapc_00)\.forge$")),

            new("Snowdrop", Patterns(
                @"\.sdfdata$")),

            new("Glacier", Patterns(
                @"\.rpkg$")),

            new("IW Engine", Patterns(
                @"(?:^|/)code_post_gfx\.ff$",
                @"(?:^|/)common(?:_zm|_mp)?\.ff$",
                @"\.iwd$")),

            new("Real Virtuality", Patterns(
                @"\.pbo$",
                @"\.bisign$")),

            new("Prism3D", Patterns(
                @"(?:^|/)base\.scs$",
                @"(?:^|/)p3shared\.dll$")),

            new("Clausewitz", Patterns(
                @"(?:^|/)common/defines\.(?:lua|txt)$",
                @"(?:^|/)common/defines/00_defines\.txt$")),

            new("Chrome Engine", Patterns(
                @"(?:^|/)ChromeEngine[0-9]\.dll$",
                @"(?:^|/)engine(?:_pc)?\.rpack$")),

            new("Essence Engine", Patterns(
                @"\.sga$")),

            new("Warscape", Patterns(
                @"(?:^|/)startpos\.esf$")),

            new("X-Ray", Patterns(
                @"(?:^|/)xrGame\.dll$")),

            new("Creation", Patterns(
                @"\.bsa$",
                @"\.esm$",
                @"\.esp$")),

            new("id Tech", Patterns(
                @"\.pk4$",
                @"(?:^|/)glquake(?:$|/)",
                @"(?:^|/)baseq2(?:$|/)",
                @"\.streamdb$",
                @"\.mega2$",
                @"\.texdb$",
                @"\.streamed$")),

            new("RPG Maker", Patterns(
                @"(?:^|/)rgss\d*e?\.dll$",
                @"(?:^|/)RPG_RT\.ini$",
                @"\.rgss(?:ad|2a|3a)$")),

            new("Ren'Py", Patterns(
                @"(?:^|/)renpy/",
                @"\.rpyb$")),

            new("MonoGame", Patterns(
                @"monogame")),

            new("XNA", Patterns(
                @"\.xnb$")),

            new("OGRE", Patterns(
                @"(?:^|/)OgreMain(?:_x64)?\.dll$")),

            new("LithTech", Patterns(
                @"(?:^|/)default\.archcfg$")),

            new("Liquid Engine", Patterns(
                @"(?:^|/)PCTouchHelper\.dll$")),

            new("GameMaker", Patterns(
                @"(?:^|/)audiogroup1\.dat$",
                @"(?:^|/)libYoYoGamepad")),
        };

        private static Regex[] Patterns(params string[] patterns) =>
            patterns.Select(p => new Regex(p, Options)).ToArray();

        public string Detect(string gameDirectory)
        {
            if (string.IsNullOrWhiteSpace(gameDirectory) || !Directory.Exists(gameDirectory))
                return "未知";

            var options = new EnumerationOptions
            {
                RecurseSubdirectories = true,
                IgnoreInaccessible = true,
                ReturnSpecialDirectories = false,
                AttributesToSkip = FileAttributes.ReparsePoint
            };

            try
            {
                foreach (var path in Directory.EnumerateFiles(gameDirectory, "*", options))
                {
                    // SteamDB 的正则统一在「正斜杠相对路径」上运行。
                    var relative = Path.GetRelativePath(gameDirectory, path).Replace('\\', '/');

                    foreach (var rule in EngineRules)
                    {
                        foreach (var pattern in rule.Patterns)
                        {
                            if (pattern.IsMatch(relative))
                                return rule.Name;
                        }
                    }
                }
            }
            catch (Exception ex) when (ex is IOException
                                       or UnauthorizedAccessException
                                       or System.Security.SecurityException)
            {
                // 目录不可访问时按「未知」处理，不中断整个扫描。
            }

            return "未知";
        }
    }
}
