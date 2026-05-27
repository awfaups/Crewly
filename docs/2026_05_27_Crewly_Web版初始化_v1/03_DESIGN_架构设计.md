# Crewly Web版初始化 - 架构设计

## 总体架构

第一版采用前端优先架构：

```text
Crewly Web
  -> App Shell
  -> Workspace Dashboard
  -> Channels
  -> Tasks
  -> AI Teammates
  -> Sessions
  -> Approvals
  -> Mock Domain Data
```

后续演进为完整系统：

```text
Web App
  -> API Service
  -> Realtime Gateway
  -> Task Service
  -> Agent Runtime Orchestrator
  -> Filesystem / Artifact Service
  -> Approval Service
  -> Vault / Credential Service
```

## 领域模型

```text
Workspace
User
Member
AiTeammate
Channel
Message
Task
AgentSession
RuntimeEvent
Approval
Attachment
Credential
```

## 前端模块边界

```text
src/app
  Next.js routes and app shell

src/components
  Reusable UI components

src/features/workspace
  Workspace overview and navigation

src/features/channels
  Channel timeline and composer

src/features/tasks
  Task board and task detail

src/features/teammates
  AI teammate cards and profile panels

src/features/sessions
  Agent session timeline and runtime events

src/features/approvals
  Approval card rendering and decision controls

src/lib
  Mock data, types, helpers
```

## 核心页面

- `/`：Crewly workspace 主界面
- 后续可扩展：
  - `/channels/[id]`
  - `/tasks`
  - `/sessions/[id]`
  - `/teammates/[id]`
  - `/settings`

第一版可以先使用单页应用式布局，在首页中集成主要工作区体验。

## 数据流

MVP 使用 mock data：

```text
mock workspace
mock channels
mock messages
mock tasks
mock AI teammates
mock runtime events
mock approvals
```

后续替换为：

```text
REST/GraphQL for CRUD
WebSocket/SSE for realtime messages
Agent runtime event stream
```

## UI 风格

- 工作台优先，不做营销 landing page
- 信息密度适中，适合日常团队使用
- 色彩克制，不做单一紫蓝/深蓝主题
- 使用真实产品式控件：tabs、buttons、badges、task board、timeline
- 使用 lucide-react 图标
- 移动端保证无文本溢出，但第一优先级是桌面团队工作台

## 风险

- 如果过早接真实 agent runtime，会拉长交付周期。
- 如果 UI 过于营销化，会偏离产品核心。
- 如果模型、审批、任务、频道对象边界不清，后续后端会难以演进。

