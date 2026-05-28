# Crewly 后端基础设施 - 任务拆分

## T1 依赖和脚本

- 增加 Fastify、CORS、Drizzle、postgres、tsx、drizzle-kit。
- 增加 `dev:api`、`build:api`、`db:generate`、`db:migrate`。

## T2 数据库 schema

- 建立核心资源表。
- 生成 Drizzle SQL migration。

## T3 API 骨架

- Fastify app。
- 健康检查。
- 核心读取路由。
- 数据库未配置降级响应。

## T4 文档和验证

- README 增加后端说明。
- 执行 lint、前端 build、后端 build、健康检查。
