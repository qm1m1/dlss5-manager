# 技术架构与核心模块设计

## 三、技术架构
- **开发平台**: Windows
- **核心技术**: C#, .NET 8, WPF, MVVM, Fluent UI
- **数据库**: SQLite, Entity Framework Core
- **系统接口**: Windows API, WMI, NVIDIA NVAPI

## 五、核心模块设计

### 1. Game Scanner 游戏扫描系统
- **功能**: 自动发现 Steam、Epic、GOG 等平台安装的游戏。
- **输出**: 游戏名称、安装路径、执行文件、引擎信息。

### 2. DLSS Scanner
- **扫描**: `nvngx_dlss.dll`, `nvngx_dlssg.dll`, `nvngx_dlssd.dll`, Streamline相关文件
- **读取**: DLL版本、文件信息、Hash。

### 3. DLL Manager
- **功能**: DLL备份, DLL替换, DLL恢复, 文件校验
- **流程**: 检测权限 -> 备份原文件 -> 复制新DLL -> Hash验证 -> 完成

### 4. DLSS Library
- **维护多个 DLSS 版本**: 例如 DLSS 3.5, DLSS 3.7, DLSS 4.x
- **保存**: 版本号、文件Hash、来源信息。

### 5. Compatibility Engine
- 建立游戏与DLSS版本兼容数据库。
- **输出**: 当前版本、推荐版本、兼容等级、风险提示。

### 6. GPU Analyzer
- **检测**: GPU型号、显存、驱动版本、DLSS支持情况。

### 7. Profile Manager
- **管理游戏配置**: DLSS Quality, Frame Generation, Ray Reconstruction, Preset设置。

### 8. Benchmark系统
- **升级前后测试**: FPS, 帧时间, 性能变化, 生成性能报告。
