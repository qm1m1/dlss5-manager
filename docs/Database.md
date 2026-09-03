# 数据库设计 (SQLite)

## Games表
- `id` (主键)
- `name` (游戏名称)
- `path` (安装路径)
- `exe` (执行文件)
- `engine` (引擎信息)
- `api` (渲染API, 如 DirectX 12)

## DLSS表
- `id` (主键)
- `version` (版本号)
- `file` (文件名)
- `hash` (文件哈希)

## Backup表
- `id` (主键)
- `game_id` (关联Games表)
- `date` (备份日期)
- `files` (备份文件列表)

## Compatibility表
- `game` (游戏名称或ID)
- `version` (DLSS版本)
- `status` (兼容状态)
- `note` (备注与风险提示)
