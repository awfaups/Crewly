# Crewly

Crewly 是一个 AI-native team workspace。第一版先实现中文 Web 工作台，让人类成员和 AI 成员在同一界面中围绕频道、任务、Agent Session 和审批协作。

## 当前版本

- Next.js App Router
- TypeScript
- Tailwind CSS
- lucide-react 图标
- 本地 mock data
- 中文三栏工作台界面
- localStorage 本地持久化
- 任务、审批、消息和 Agent Session 的前端交互闭环
- 会话支持发送图片和文件附件
- 任务创建、编辑、归档和消息转任务
- AI 成员创建和频道创建
- AI 成员支持自定义大模型配置
- AI 成员支持编辑配置和停用
- AI 成员在侧栏、消息、任务和详情中显示 AI 标识
- AI 成员拥有独立管理模块
- 每个 AI 成员拥有独立记忆、独立技能启用清单和技能调用策略
- Crewly 技能市场支持从 Skill 市场安装、查看版本信息、卸载并清理成员启用关系
- 已安装技能可在当前任务中模拟调用，并写入 Agent Session 与审批流
- 运行轨迹模块集中展示所有 Agent Session 和事件
- 审批队列模块集中处理待审批请求

## 本地运行

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看界面。

## GitHub Pages

仓库已配置 GitHub Actions 自动部署到 GitHub Pages：

- 部署地址：[https://awfaups.github.io/Crewly/](https://awfaups.github.io/Crewly/)
- 触发方式：推送到 `main` 分支，或手动运行 `Deploy Crewly to GitHub Pages` workflow。
- 构建产物：`npm run build` 静态导出到 `out/`。

## 验证命令

```bash
npm run lint
npm run build
npm run build:api
```

## 后端开发

第一阶段后端已经加入 Fastify + PostgreSQL + Drizzle 基础设施。前端当前仍默认使用本地 demo 数据，后端先提供健康检查和核心资源读取 API 骨架。

```bash
cp .env.example .env
npm run dev:api
```

默认 API 地址：

- 健康检查：`http://127.0.0.1:4000/health`
- API 状态：`http://127.0.0.1:4000/api/status`

前端数据源默认仍是本地演示。需要切到远程 API 时设置：

```bash
NEXT_PUBLIC_CREWLY_DATA_SOURCE=remote
NEXT_PUBLIC_CREWLY_API_URL=http://127.0.0.1:4000
```

当前前端已具备 API client 和数据源开关，后续会逐步把消息、任务、审批等操作接到远程 API。

数据库迁移：

```bash
npm run db:generate
npm run db:migrate
```

`.env` 中只填写本地或部署环境的 `DATABASE_URL`，不要提交真实连接串或密钥。

## 主要结构

```text
src/app
  App Router 页面和全局样式

src/features/workspace
  Crewly 工作台界面

src/lib
  领域类型和 mock data

server
  Fastify API、Drizzle schema 和数据库连接

drizzle
  PostgreSQL 迁移 SQL

docs/2026_05_27_Crewly_Web版初始化_v1
  6A 工作流文档、验收记录和后续 TODO
```

## MVP 范围

当前版本只验证产品结构和交互：

- 左侧工作区、频道、AI 成员和快捷入口
- 中间频道消息流、任务卡、审批卡和输入框
- 右侧任务详情、AI 成员、Agent Session timeline 和审批操作
- 审批按钮可在前端状态中反馈通过/拒绝
- 任务状态可在右侧详情中流转
- 消息输入框可向当前频道新增消息
- 消息可携带图片或文件附件，图片显示预览，文件提供下载入口
- 刷新页面后保留任务、审批、消息和 Session 状态
- 可一键重置演示数据
- 可从频道消息一键创建任务
- 可编辑任务标题、描述、负责人、优先级、标签和截止时间
- 可归档任务并从看板隐藏
- 可创建新的协作频道并自动切换
- 可创建新的 AI 成员并用于任务负责人选择
- 新建 AI 成员可配置模型提供商、模型名称、Base URL、认证方式、密钥引用名、运行环境、参数和能力开关
- 模型配置不保存 API Key 明文，只保存如 `OPENAI_API_KEY` 这类密钥引用名
- 可编辑 AI 成员资料和模型配置，可停用不再使用的 AI 成员
- AI 成员姓名旁显示 `AI` 徽标，便于和人类成员区分
- 可通过独立的 AI 成员管理模块集中查看、创建、编辑和停用 AI 成员
- 可为每个 AI 成员单独配置记忆范围、保留天数、启用技能和调用策略
- 可在 Crewly 技能市场从 Skill 市场安装 skill，并查看来源、作者、版本、更新时间和兼容范围
- 可卸载 Crewly 已安装 skill，卸载时提示受影响 AI 成员，并自动清理成员启用关系
- 可在 AI 成员编辑弹窗中启用或停用 Crewly 已安装技能
- 可在右侧 AI 成员详情中调用已启用技能，低风险技能直接写入模拟结果，高风险或需审批技能生成审批卡
- 可进入运行轨迹模块查看所有 Agent Session、事件、工具调用和等待审批状态
- 可进入审批队列模块集中通过或拒绝审批请求

暂不包含真实登录、模型调用、GitHub 集成、执行容器或 WebSocket。后端 API 已有第一阶段骨架，但前端尚未切换到远程数据源。

## 后续路线

- 接入真实账户和 workspace 数据
- 将 mock task/session/approval 替换为 API 数据
- 增加数据库 seed 和写入 API
- 增加实时消息和 Agent runtime event stream
- 增加任务状态流转和审批审计记录
- 扩展移动端体验和可访问性检查
