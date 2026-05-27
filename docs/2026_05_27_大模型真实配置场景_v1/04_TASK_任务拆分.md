# 大模型真实配置场景 - 任务拆分

## T1 文档初始化

- 输出：本目录 6A 文档。
- 验证：范围和安全边界明确。

## T2 类型扩展

- 输入：`src/lib/types.ts`。
- 输出：模型认证、环境、能力和完整配置类型。
- 验证：TypeScript 通过。

## T3 表单升级

- 输入：`MemberFormDialog`。
- 输出：真实配置字段和能力开关。
- 验证：浏览器可填写并提交。

## T4 保存与迁移

- 输入：`saveMemberForm`、`normalizeMembers`。
- 输出：保存新版配置，旧配置补齐。
- 验证：刷新后保留配置。

## T5 展示升级

- 输入：`ModelConfigSummary`。
- 输出：右侧展示关键配置和能力。
- 验证：选中 AI 成员后可见配置。

## T6 验证与部署

- 输出：README、验收记录、最终报告。
- 验证：lint/build、浏览器验证、GitHub Pages 部署。
