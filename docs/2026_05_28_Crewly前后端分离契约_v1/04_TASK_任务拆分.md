# Crewly 前后端分离契约 - 任务拆分

## T1 共享契约

- 增加 API DTO。
- 增加错误响应类型。

## T2 后端写入接口

- 创建消息。
- 创建任务并同步创建默认 Agent Session 和 runtime event。
- 审批通过/拒绝并同步任务状态和 runtime event。

## T3 前端数据源边界

- API client。
- data source mode。
- 顶部状态展示。

## T4 验证

- lint
- 前端 build
- 后端 build
- API 健康检查
