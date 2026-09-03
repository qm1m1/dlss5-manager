using DLSS5Manager.DLLManager;
using DLSS5Manager.GameScanner;
using DLSS5Manager.GameScanner.Models;
using DLSS5Manager.GPU;

var builder = WebApplication.CreateBuilder(args);

// 允许前端 dev server 跨域访问（虽然 vite 已配置代理，这里作为双保险）
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

app.UseCors();

// 健康检查接口，用于确认后端已启动
app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

// 游戏扫描接口：调用 GameFinder 扫描 Steam / Epic / GOG，返回 JSON 给前端
app.MapGet("/api/games", () =>
{
    var scanner = new ScannerManager();
    var dlssScanner = new DlssScanner();
    var engineDetector = new EngineDetector();
    var games = scanner.ScanAll();

    var dtos = games.Select(game =>
    {
        var components = dlssScanner.Scan(game.InstallDirectory);
        return new GameDto
        {
            Id = game.Id,
            Name = game.Name,
            Path = game.InstallDirectory,
            Launcher = game.Launcher,
            Engine = engineDetector.Detect(game.InstallDirectory),
            DlssVersion = DlssScanner.GetPrimary(components, DlssScanner.SuperResolution)?.Version
                          ?? "未检测到",
            DlssGVersion = DlssScanner.GetPrimary(components, DlssScanner.FrameGeneration)?.Version,
            DlssDVersion = DlssScanner.GetPrimary(components, DlssScanner.RayReconstruction)?.Version,
            DlssNrVersion = DlssScanner.GetPrimary(components, DlssScanner.NeuralRendering)?.Version,
            DlssComponents = components,
            CoverImage = game.CoverImage,
            Icon = game.Icon
        };
    });

    return Results.Ok(dtos);
});

// GPU 检测接口：返回显卡型号、显存、驱动版本和 DLSS5 支持情况
app.MapGet("/api/gpu", () =>
{
    var scanner = new GpuScanner();
    return Results.Ok(scanner.Scan());
});

// GPU 实时状态接口：使用率、显存占用、温度、功耗、频率等
app.MapGet("/api/gpu/status", () =>
{
    var reader = new GpuStatusReader();
    return Results.Ok(reader.GetStatus());
});

// ===== DLL 管理接口 =====

// 检测指定游戏目录里所有 DLSS DLL 所在的文件夹
app.MapGet("/api/dll/locations", (string gamePath) =>
{
    var manager = new DllManager();
    return Results.Ok(manager.DetectLocations(gamePath));
});

// 备份指定类型的 DLL
app.MapPost("/api/dll/backup", (DllBackupRequest request) =>
{
    var manager = new DllManager();
    return Results.Ok(manager.Backup(request.GamePath, request.Type));
});

// 替换指定类型的 DLL 为版本库中的目标版本
app.MapPost("/api/dll/replace", (DllReplaceRequest request) =>
{
    var manager = new DllManager();
    return Results.Ok(manager.Replace(request.GamePath, request.Type, request.Version));
});

// 从最新备份恢复指定类型的 DLL
app.MapPost("/api/dll/restore", (DllRestoreRequest request) =>
{
    var manager = new DllManager();
    return Results.Ok(manager.Restore(request.GamePath, request.Type));
});

// 列出指定游戏目录的所有备份记录
app.MapGet("/api/dll/backups", (string gamePath) =>
{
    var manager = new DllManager();
    return Results.Ok(manager.ListBackups(gamePath));
});

// 列出版本库中可用的 DLSS 版本
app.MapGet("/api/dll/versions", () =>
{
    var manager = new DllManager();
    return Results.Ok(manager.ListAvailableVersions());
});

// ===== DLSS 版本库接口 =====

// 列出版本库中已收集到的各版本 DLL
app.MapGet("/api/library", () =>
{
    var library = new DlssLibrary();
    return Results.Ok(library.GetLibrary());
});

// 从所有已安装游戏收集 DLSS DLL 进版本库
app.MapPost("/api/library/collect", () =>
{
    var scanner = new ScannerManager();
    var gameDirectories = scanner.ScanAll().Select(game => game.InstallDirectory);
    var library = new DlssLibrary();
    return Results.Ok(library.CollectFromGames(gameDirectories));
});

// 后端固定监听 5000 端口，前端 vite 会把 /api 请求代理到这里
app.Run("http://localhost:5000");

// DLL 管理接口的请求体
record DllBackupRequest(string GamePath, string Type);
record DllReplaceRequest(string GamePath, string Type, string Version);
record DllRestoreRequest(string GamePath, string Type);
