# Crewly 前后端分离契约 - 共识确认

## 架构共识

- 单仓 monorepo。
- 前端和后端逻辑分离、独立运行。
- 共享类型放入 `shared/`。
- 前端通过 `NEXT_PUBLIC_CREWLY_DATA_SOURCE` 控制 local / remote。

## 接口共识

本轮优先补齐最关键的写入接口：

- 创建消息
- 创建任务
- 审批决策

## 兼容共识

没有配置远程 API 时，前端继续使用 localStorage demo。
