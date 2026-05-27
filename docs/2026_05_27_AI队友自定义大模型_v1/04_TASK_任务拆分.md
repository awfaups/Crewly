# AI 队友自定义大模型 - 任务拆分

## T1 文档初始化

- 输出：本目录 6A 文档。
- 验证：文档覆盖范围、假设和验收口径。

## T2 类型扩展

- 输入：`src/lib/types.ts`。
- 输出：新增模型配置类型，`Member` 支持 `modelConfig`。
- 验证：TypeScript 通过。

## T3 表单扩展

- 输入：`MemberFormDialog`。
- 输出：提供商、模型名称、接入说明字段。
- 验证：创建弹窗显示字段。

## T4 保存与兼容

- 输入：`saveMemberForm` 和 `normalizeWorkspaceState`。
- 输出：新 AI 队友保存模型配置，旧数据自动补齐默认配置。
- 验证：刷新后配置保留。

## T5 展示接入

- 输入：`ContextPanel` AI 队友卡片。
- 输出：显示模型提供商、模型名称和接入说明。
- 验证：选中新 AI 队友后右侧可见配置。

## T6 验证与收尾

- 输出：README、验收文档、最终报告。
- 验证：lint/build 和浏览器主流程。
