# DLSS5-Manager

一个 Windows 平台的 DLSS 管理工具，用于自动发现、备份、替换游戏中的 DLSS DLL，并提供版本库管理、GPU 状态分析、性能测试等功能。

## 现有功能

| 模块 | 说明 |
| --- | --- |
| 我的游戏 | 扫描 Steam / Epic / GOG 已安装的游戏，自动识别其中的 DLSS DLL 版本（超分辨率 / 帧生成 / 光线重建 / 神经渲染）、游戏引擎，并给出推荐版本 |
| DLSS 版本库 | 一键从所有已安装游戏收集各版本 DLL 到本地版本库，并提供官方 / 可信来源的最新 DLSS 组件下载链接 |
| DLL 管理 | 对单个游戏目录进行 DLL 位置检测、备份、替换、恢复，保留完整备份历史 |
| GPU 分析 | 实时读取显卡型号、显存、驱动版本，以及使用率、显存占用、温度、功耗、频率、风扇等状态 |
| 性能测试 | 运行 10 秒 WebGL 渲染压力测试，输出实时 / 平均 / 最低帧率与评级 |
| 系统设置 | 中英文切换、深色模式、启动自动扫描、驱动更新提醒、自动备份策略等 |

## 技术栈

- 前端：React 19 + TypeScript + Vite + Tailwind CSS（源码在 `src/UI/`）
- 后端：ASP.NET Core (.NET 8) Minimal API + GameFinder（源码在 `src/GameScanner/`、`src/DLLManager/`、`src/GPU/`）

## 快速启动

### 方式一：一键重启脚本（推荐）

双击项目根目录的 `restart-dev.cmd`，或手动运行：

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\restart-dev.ps1
```

脚本会自动完成以下工作：

1. 停止本项目之前启动的前后端进程；
2. 释放并检查 `3000`（前端）、`5000`（后端）端口；
3. 后台启动前端 `npm run dev` 与后端 `dotnet run`；
4. 把进程 PID 写入 `.dev/processes.json`，运行日志写入 `.dev/logs/`。

启动成功后：

- 前端：http://localhost:3000
- 后端：http://localhost:5000

> 若脚本报「端口被项目外进程占用」，说明 3000 或 5000 端口被其它程序占用，先手动关闭占用进程再重试。

### 方式二：手动启动

```bash
# 1. 拉代码
git clone https://github.com/qm1m1/dlss5-manager.git
cd dlss5-manager

# 2. 安装前端依赖并启动（终端 A）
npm install
npm run dev
# 前端运行在 http://localhost:3000

# 3. 启动后端（另开终端 B）
cd src/GameScanner
dotnet restore
dotnet run
# 后端运行在 http://localhost:5000
```

浏览器打开 http://localhost:3000，前端通过 Vite 代理把 `/api` 请求转发到后端 5000 端口。

## 前置条件

- Windows（后端依赖 GameFinder 读取注册表，仅支持 Windows）
- Git
- Node.js 18+（推荐 20 LTS）
- .NET 8 SDK（注意是 SDK，不是 Runtime）

## 注意事项

1. 前后端需同时启动，否则前端扫描会报「扫描失败」。
2. 后端仅支持 Windows（GameFinder 依赖注册表）。
3. 国内网络：`npm install` 慢时先设镜像 `npm config set registry https://registry.npmmirror.com`。
4. `.dotnet/`、`.nuget/`、`node_modules/`、`.dev/` 均为本地生成目录，已加入 `.gitignore`。

## 后端接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 健康检查 |
| GET | `/api/games` | 扫描并返回已安装游戏及其 DLSS 信息 |
| GET | `/api/gpu` | 返回显卡型号、显存、驱动、DLSS5 支持情况 |
| GET | `/api/gpu/status` | 返回 GPU 实时状态 |
| GET | `/api/dll/locations` | 检测指定游戏目录的 DLL 位置 |
| POST | `/api/dll/backup` | 备份指定类型的 DLL |
| POST | `/api/dll/replace` | 替换为版本库中的目标版本 |
| POST | `/api/dll/restore` | 从最新备份恢复 |
| GET | `/api/dll/backups` | 列出备份记录 |
| GET | `/api/dll/versions` | 列出版本库可用版本 |
| GET | `/api/library` | 列出版本库中已收集的 DLL |
| POST | `/api/library/collect` | 从所有已安装游戏收集 DLL 进版本库 |

## 开源代码说明

游戏目录内的 DLSS DLL 扫描采用了
[DLSS Swapper](https://github.com/beeradmoore/dlss-swapper)（GPL-3.0）的核心设计思路：
按已知运行库文件名递归发现文件，并读取 Windows PE 版本资源。当前实现为本项目独立编写，
同时记录 SHA-256、所有候选路径，并在存在多份 DLL 时标记一个主要候选项。
