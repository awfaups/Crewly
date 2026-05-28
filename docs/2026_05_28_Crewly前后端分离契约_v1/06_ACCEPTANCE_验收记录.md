# Crewly 前后端分离契约 - 验收记录

## 验收项

- [x] 新增 `shared/api-contracts.ts`。
- [x] 新增前端 API client。
- [x] 新增前端数据源模式开关。
- [x] 后端新增消息创建接口。
- [x] 后端新增任务创建接口。
- [x] 后端新增审批决策接口。

## 自动验证

- 已通过：`npm run lint`
- 已通过：`npm run build`
- 已通过：`npm run build:api`
- 已通过：`GET /health`
- 已通过：`GET /api/status`
