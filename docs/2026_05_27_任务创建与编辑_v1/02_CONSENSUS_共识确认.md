# 任务创建与编辑 - 共识确认

## 决策

- 使用前端表单弹窗，不引入 UI 库。
- `Task` 增加 `archived?: boolean`。
- 任务看板默认隐藏归档任务。
- 新建任务时同时创建一个 `AgentSession`。
- 消息转任务时复用消息正文作为任务描述，并回写 `linkedTaskId`。
- 负责人从现有 members 中选择。

## 风险

- 表单状态仍在单个组件内，后续需要拆分组件降低维护成本。
- localStorage 中已有旧任务没有 `archived` 字段，需要按 falsy 兼容。
