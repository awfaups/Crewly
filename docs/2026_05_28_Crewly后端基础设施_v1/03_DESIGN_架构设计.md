# Crewly 后端基础设施 - 架构设计

## 目录

- `server/index.ts`：后端启动入口。
- `server/env.ts`：环境变量读取。
- `server/http/app.ts`：Fastify app 构建。
- `server/http/routes.ts`：API 路由。
- `server/db/schema.ts`：Drizzle schema。
- `server/db/client.ts`：数据库连接。
- `drizzle/`：迁移 SQL。

## 数据模型

核心表：

- `workspaces`
- `members`
- `channels`
- `messages`
- `tasks`
- `agent_sessions`
- `runtime_events`
- `approvals`
- `skills`
- `workspace_skill_installs`

## API 骨架

- `GET /health`
- `GET /api/status`
- `GET /api/workspaces`
- `GET /api/workspaces/:workspaceId/members`
- `GET /api/workspaces/:workspaceId/channels`
- `GET /api/channels/:channelId/messages`
- `GET /api/workspaces/:workspaceId/tasks`
- `GET /api/tasks/:taskId/sessions`
- `GET /api/sessions/:sessionId/events`
- `GET /api/workspaces/:workspaceId/approvals`
- `GET /api/skills`
- `GET /api/workspaces/:workspaceId/skill-installs`
