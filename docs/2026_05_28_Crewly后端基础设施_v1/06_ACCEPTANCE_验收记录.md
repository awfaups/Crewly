# Crewly 后端基础设施 - 验收记录

## 验收项

- [x] Fastify 后端入口可启动。
- [x] `/health` 返回服务状态。
- [x] 数据库未配置时核心 API 返回明确 503。
- [x] Drizzle schema 覆盖核心资源。
- [x] 迁移 SQL 已生成。

## 自动验证

- 已通过：`npm run lint`
- 已通过：`npm run build`
- 已通过：`npm run build:api`
- 已通过：`npm run db:generate`
- 已通过：`curl /health`
- 已通过：`curl /api/workspaces` 未配置数据库返回 503
