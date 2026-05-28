# Crewly 技能市场安装语义修正 - 优化任务拆分

## T1 状态拆分

- 文件：`src/features/workspace/crewly-workspace.tsx`
- 增加 `workspaceSkillIds`。
- 增加旧数据归一化。

## T2 市场入口改造

- 文件：`src/features/workspace/crewly-workspace.tsx`
- 将“技能安装”改为“从 Skill 市场安装”。
- 安装结果写入 Crewly 工作区技能集合。

## T3 成员启用边界

- 文件：`src/features/workspace/crewly-workspace.tsx`
- AI 成员配置只展示 Crewly 已安装技能。
- 技能调用面板只允许调用 Crewly 已安装且成员已启用的技能。

## T4 验证

- 执行 lint、build。
- 使用页面行为测试覆盖安装入口和成员配置边界。
