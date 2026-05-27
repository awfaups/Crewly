# 交互闭环与本地持久化 - 架构设计

## 现状

当前 `CrewlyWorkspace` 直接消费：

- `tasks`
- `approvals`
- `sessions`
- `messages`

其中只有 `approvals` 已进入本地 state，其余仍直接引用 mock 常量。

## 目标结构

```text
mock-data.ts
  -> seed 数据

crewly-workspace.tsx
  -> useState(tasks)
  -> useState(messages)
  -> useState(approvals)
  -> useState(sessions)
  -> useEffect(load localStorage)
  -> useEffect(save localStorage)
```

## 本地存储

使用单 key：

```text
crewly.workspace.v1
```

结构：

```ts
{
  tasks: Task[]
  messages: Message[]
  approvals: Approval[]
  sessions: AgentSession[]
}
```

## 状态联动

### 任务状态流转

状态顺序：

```text
todo -> doing -> review -> done -> todo
```

用户点击任务详情中的状态按钮后：

- 更新任务状态。
- 保持选中任务。
- 任务看板分组实时变化。

### 审批联动

用户点击审批：

- 更新 approval.status。
- 找到 approval.taskId 对应 task。
- 找到 task.sessionId 对应 session。
- 追加 runtime event。

通过：

```text
approval.pending -> approval.approved
task.doing/todo -> task.review
session.waiting_approval/running -> session.completed
```

拒绝：

```text
approval.pending -> approval.denied
task.review/todo -> task.doing
session.waiting_approval -> session.running
```

### 消息新增

Composer 使用 controlled input：

- 输入为空时不发送。
- 发送后追加当前频道 message。
- author 固定为当前人类用户 `lin`。
- 时间使用本地 `HH:mm`。

## UI 调整

- 右侧任务详情增加“推进状态”按钮。
- 顶部或侧栏增加“重置演示数据”按钮。
- 输入框从静态提示改为真实输入。
- 新增消息使用当前频道上下文。

## 错误处理

- localStorage JSON 解析失败时回退 seed 数据。
- 浏览器无 localStorage 时继续使用内存状态。
- 重置操作不弹阻断式确认，作为 demo 入口直接执行。
