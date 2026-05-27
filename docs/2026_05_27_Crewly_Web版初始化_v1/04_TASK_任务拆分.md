# Crewly Web版初始化 - 任务拆分

## T1 初始化项目

输入：

- 空 GitHub 仓库
- 目标技术栈：Next.js + TypeScript + Tailwind

输出：

- 可运行 Web 项目
- 基础 lint/build 脚本
- README

验证：

- `npm run lint`
- `npm run build`
- 本地开发服务器可访问

## T2 建立领域类型和 mock data

输入：

- Crewly MVP 领域模型

输出：

- `src/lib/types.ts`
- `src/lib/mock-data.ts`

验证：

- TypeScript 类型检查通过
- 页面可消费 mock 数据

## T3 构建主工作台布局

输入：

- mock workspace、channels、teammates、tasks、sessions

输出：

- 侧边导航
- 顶部状态栏
- 主内容区域
- 右侧上下文面板

验证：

- 桌面布局清晰
- 移动端不出现明显重叠

## T4 构建频道和消息时间线

输入：

- channel messages
- runtime summaries

输出：

- 频道列表
- 消息时间线
- 消息 composer 静态控件

验证：

- 人类和 AI 消息区分清楚
- 任务卡、审批卡可嵌入消息流

## T5 构建任务看板

输入：

- task list

输出：

- 按状态分组的任务 board
- 任务卡展示 assignee、priority、label、due date

验证：

- 状态流转语义可见
- AI assignee 可读

## T6 构建 Agent Session 面板

输入：

- runtime events

输出：

- AI 思考、工具调用、结果、审批请求 timeline
- session 状态 badge

验证：

- 用户能理解 AI 正在做什么
- 审批请求不会被普通消息淹没

## T7 构建 Approval 控件

输入：

- approval mock data

输出：

- pending / approved / denied 状态
- approve / deny 按钮

验证：

- 审批动作在前端状态中可反馈

## T8 文档和验收

输入：

- 实现结果

输出：

- README 使用说明
- 验收记录
- 最终报告
- TODO

验证：

- 文档和代码一致

