# AI 队友独立管理模块 - 架构设计

## 状态设计

新增本地 UI 状态：

```ts
WorkspaceModule = "workspace" | "ai-teammates"
activeModule
```

`workspace` 显示现有频道工作台。

`ai-teammates` 显示新的 AI 队友管理模块。

## 组件设计

新增：

- `ModuleNav`
- `AITeammateManager`
- `TeammateStat`

## 交互设计

- 顶部模块导航可在“工作台”和“AI 队友”之间切换。
- 左侧快捷入口增加“AI 队友管理”。
- AI 管理模块复用现有 `openCreateMemberForm`、`openEditMemberForm`、`archiveMember`。
- 点击某个 AI 队友会同步选中右侧详情。

## 布局设计

- 主区域仍固定满屏。
- AI 管理模块内部滚动。
- 保持模块内信息密度，避免营销页式布局。
