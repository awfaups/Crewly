# AI 队友与频道创建 - 架构设计

## 数据状态

`PersistedWorkspaceState` 从仅持久化任务、审批、消息和 Session，扩展为：

```ts
{
  approvals: Approval[]
  channels: Channel[]
  members: Member[]
  messages: Message[]
  sessions: AgentSession[]
  tasks: Task[]
}
```

## 兼容策略

旧 localStorage 中不存在 `channels` 和 `members` 时，读取阶段使用 seed 数据补齐。

## 表单模型

频道：

```ts
ChannelFormState {
  name
  topic
}
```

AI 队友：

```ts
MemberFormState {
  name
  role
  avatar
}
```

## 行为设计

### 创建频道

- 打开频道表单。
- 校验频道名称非空。
- 创建 `Channel`，`unread` 默认为 0。
- 自动切换到新频道。
- 写入一条欢迎消息，避免新频道空白。

### 创建 AI 队友

- 打开 AI 队友表单。
- 校验名称非空。
- 创建 `Member`，`kind` 固定为 `ai`，`presence` 默认为 `online`。
- 自动选中新 AI 队友。
- 任务表单负责人下拉使用动态成员列表。

## UI 边界

- 弹窗固定在视口内，内容较少，不需要额外滚动。
- 侧栏列表仍在侧栏内部滚动。
- 顶部统计从动态成员计算。
