# 任务创建与编辑 - 架构设计

## 数据模型

`Task` 增加：

```ts
archived?: boolean
```

表单模型：

```ts
TaskFormValues {
  title
  summary
  priority
  label
  due
  assigneeId
}
```

## 主要行为

### 新建任务

- 打开任务表单。
- 默认频道为当前频道。
- 默认状态为 `todo`。
- 创建对应 `AgentSession`。
- 选中新任务。

### 编辑任务

- 从右侧当前任务进入编辑。
- 保存后更新 `tasks`。
- 对应 Session title 同步为任务标题。

### 消息转任务

- 在消息卡片上显示“转任务”按钮。
- 创建任务和 Session。
- 给消息写入 `linkedTaskId`。

### 归档任务

- 将 `archived` 置为 true。
- 看板不再展示归档任务。
- 如果当前选中任务被归档，切换到第一个未归档任务。

## 持久化

继续复用 `crewly.workspace.v1`。
