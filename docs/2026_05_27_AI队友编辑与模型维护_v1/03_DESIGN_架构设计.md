# AI 队友编辑与模型维护 - 架构设计

## 数据模型

`Member` 增加：

```ts
archived?: boolean
```

停用 AI 队友时设置 `archived: true`。

## 表单模式

新增：

```ts
MemberFormMode = "create" | "edit"
```

编辑时将 `Member.modelConfig` 映射回 `MemberFormState`。

## 行为设计

### 编辑

- 右侧 AI 队友卡片点击“编辑配置”。
- 弹窗预填当前成员资料和模型配置。
- 保存后更新 `workspaceState.members`。
- 如果当前选中该成员，右侧立即刷新。

### 停用

- 右侧点击“停用”。
- 设置 `archived: true`。
- 侧栏 AI 队友列表隐藏停用成员。
- 新建任务负责人候选隐藏停用成员。
- 如果当前选中成员被停用，自动切换到第一个未停用 AI 队友。

## 兼容策略

读取旧数据时：

- AI 队友缺少 `modelConfig` 时补齐默认模型配置。
- 缺少 `archived` 时按 false 处理。
