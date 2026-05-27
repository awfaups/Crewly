# AI 队友标识 - 架构设计

## 组件设计

新增两个展示组件：

```tsx
MemberKindBadge
MemberName
```

`MemberName` 负责显示成员名，并在 `member.kind === "ai"` 时渲染 `MemberKindBadge`。

## 接入位置

- 侧栏 AI 队友列表。
- 频道消息作者。
- 任务看板负责人。
- 右侧 AI 队友详情。
- 任务表单负责人下拉暂不处理，因为原生 `option` 不适合放复杂徽标。

## 样式

- 徽标内容为 `AI`。
- 小尺寸、圆角、浅色背景。
- 不影响文字截断。
