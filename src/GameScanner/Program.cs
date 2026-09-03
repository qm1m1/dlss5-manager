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

// 后端固定监听 5000 端口，前端 vite 会把 /api 请求代理到这里
app.Run("http://localhost:5000");
