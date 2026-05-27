# Crewly Web版初始化 - 需求对齐

## 背景

Crewly 是一个 AI-native team workspace。目标是让 AI 成员像真实成员一样加入团队频道、认领任务、开启工作会话，并把进度、结果和需要审批的动作同步回同一个工作流。

当前 GitHub 仓库 `awfaups/Crewly` 为空仓库，需要先建立项目方向、MVP 边界、架构基线和后续实现计划。

## 产品定位

英文一句话：

> Crewly lets AI members work inside your team's real channels, tasks, and review flow.

中文一句话：

> Crewly 让 AI 成员进入真实团队工作流，和人一起沟通、执行任务、提交结果。

## MVP 范围

第一阶段优先构建 Web 版可演示闭环：

- Workspace 首页和基础导航
- Channels / DM 的消息时间线
- AI Members 列表和基础资料
- Tasks 看板与任务详情
- Agent Session 时间线，展示用户消息、AI 回复、工具调用和审批请求
- Approval Card，人类可批准或拒绝关键动作
- 静态/模拟数据驱动，先验证产品结构和交互

## 原型参照

产品原型与核心交互参照 Helio 的公开产品形态：

- 第一屏即团队工作台，不做营销落地页。
- 人类成员和 AI 成员共享频道、任务和会话上下文。
- 左侧提供 workspace 导航、频道、DM 和 AI member 入口。
- 中间以频道消息流或任务工作区为主操作面。
- 任务看板与频道上下文互相映射，任务卡可回到所属频道。
- Agent Session 展示 AI 执行过程，包括用户输入、思考状态、工具调用、结果和审批请求。
- 高风险动作通过 Approval Card 明确交给人类确认。

参照范围仅限产品机制、信息架构和交互范式。不得复制 Helio 的品牌、商标、图标、文案、图片、代码或私有资产。

## 暂不纳入 MVP

- 真实云端代码执行容器
- 真实终端 PTY
- GitHub PR 自动创建
- Slack/Linear/Gmail/Zoom 集成
- 计费系统
- 插件市场
- 多租户企业权限细节
- 真实邮件和会议机器人

## 关键假设

- 本项目先做 Web app，不做 Electron 桌面端。
- 第一版以产品原型和前端可运行体验为主。
- AI runtime 后续独立成 `crewly-runtime` 或 worker 服务。
- 代码执行、文件系统、审批、安全审计会作为后续后端能力逐步接入。
- 当前不提交任何密钥或真实模型凭据。

## 目标用户

- 小型技术团队
- 创业团队
- 需要多个 AI agent 协同完成研发/运营任务的团队
- 希望把 AI 工作纳入任务、频道和审阅流程的人

## 验收目标

- 用户打开 Web app 后能理解 Crewly 是什么。
- 第一屏不是营销落地页，而是实际 workspace。
- 用户能看到频道、任务、AI 成员、会话和审批之间的关系。
- 项目骨架可本地运行、可扩展、可继续接入后端。
