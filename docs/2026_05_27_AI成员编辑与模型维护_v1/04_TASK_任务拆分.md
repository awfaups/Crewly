# AI 成员编辑与模型维护 - 任务拆分

## T1 文档初始化

- 输出：6A 文档。
- 验证：范围、设计和验收口径明确。

## T2 类型扩展

- 输入：`src/lib/types.ts`。
- 输出：`Member.archived`。
- 验证：TypeScript 通过。

## T3 表单复用

- 输入：`MemberFormDialog`。
- 输出：支持 create/edit 模式，支持预填和不同提交文案。
- 验证：编辑弹窗能打开并显示现有配置。

## T4 编辑保存

- 输入：`workspaceState.members`。
- 输出：保存更新成员资料与模型配置。
- 验证：右侧和侧栏同步更新。

## T5 停用

- 输入：当前 AI 成员。
- 输出：标记 archived 并切换选中成员。
- 验证：侧栏和任务负责人候选隐藏。

## T6 验证与收尾

- 输出：README、验收记录、最终报告。
- 验证：lint/build、浏览器主流程、部署。
