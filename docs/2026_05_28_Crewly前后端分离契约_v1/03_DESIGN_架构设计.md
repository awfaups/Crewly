# Crewly 前后端分离契约 - 架构设计

## 目录

- `shared/api-contracts.ts`：前后端共享 DTO。
- `src/lib/api-client.ts`：前端 API client。
- `src/lib/data-source.ts`：前端数据源模式解析。
- `server/http/routes.ts`：后端读写接口。

## 新增接口

- `POST /api/channels/:channelId/messages`
- `POST /api/workspaces/:workspaceId/tasks`
- `PATCH /api/approvals/:approvalId`

## 前端开关

- `NEXT_PUBLIC_CREWLY_DATA_SOURCE=local | remote`
- `NEXT_PUBLIC_CREWLY_API_URL=http://127.0.0.1:4000`

当前 UI 只展示数据源状态，不强制改写现有 localStorage 交互。
