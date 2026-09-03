# DLSS5-Manager 产品方案设计文档 (V1.0)

## 一、项目定位
DLSS5-Manager 是一个 Windows 平台的 DLSS 管理、升级、配置与兼容分析工具。
目标是提供类似 DLSS Swapper 的 DLL 管理能力，并进一步扩展版本管理、兼容性分析、性能测试等功能。

## 核心价值
1. 自动发现用户游戏中的 DLSS 文件。
2. 管理不同版本 DLSS DLL。
3. 安全替换、备份和恢复。
4. 提供游戏兼容性分析。
5. 帮助用户优化 DLSS 设置。

## 最终产品目标
一个集 DLSS版本管理、游戏扫描、DLL管理、兼容性分析、性能优化 于一体的专业 Windows 游戏优化工具。

---

## 本地开发 / 启动

### 技术栈
- 前端：React + Vite + Tailwind CSS（源码在 `src/UI/`）
- 后端：ASP.NET Core Web API + GameFinder（源码在 `src/GameScanner/`）

### 前置条件
- Windows（后端依赖 GameFinder 读取注册表，仅支持 Windows）
- Git
- Node.js 18+（推荐 20 LTS）
- .NET 8 SDK（注意是 SDK，不是 Runtime）

### 启动步骤

```bash
# 1. 拉代码
git clone https://github.com/qm1m1/dlss5-manager.git
cd dlss5-manager

# 2. 启动前端（终端 A）
npm install
npm run dev
# 前端运行在 http://localhost:3000

# 3. 启动后端（另开终端 B）
cd src/GameScanner
dotnet restore
dotnet run
# 后端运行在 http://localhost:5000
```

浏览器打开 http://localhost:3000，前端会通过 Vite 代理把 `/api` 请求转发到后端的 5000 端口。

### 注意事项
1. 前后端需同时启动，否则前端扫描会报「扫描失败」。
2. 后端仅支持 Windows（GameFinder 依赖注册表）。
3. 国内网络：`npm install` 慢时先设镜像 `npm config set registry https://registry.npmmirror.com`。
4. `.dotnet/`、`.nuget/`、`node_modules/` 均为本地生成目录，已加入 `.gitignore`。
