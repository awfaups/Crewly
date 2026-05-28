# Crewly 后端基础设施 - 共识确认

## 技术选型

- API：Fastify
- 数据库：PostgreSQL
- ORM / migration：Drizzle
- 开发启动：tsx

## 第一阶段边界

- 以后端基础设施和 schema 为主。
- 前端继续使用 localStorage demo。
- API 暂时提供读取骨架和健康检查。

## 成功标准

- `npm run build:api` 通过。
- `npm run db:generate` 能生成迁移。
- `/health` 可访问。
- 数据库未配置时 API 返回明确 503。
