# Crewly 技能市场管理闭环 - 任务拆分

## T1 扩展类型和 mock 数据

- 文件：`src/lib/types.ts`
- 文件：`src/lib/mock-data.ts`
- 输出：Skill 市场元信息和工作区安装记录类型。

## T2 改造安装状态

- 文件：`src/features/workspace/crewly-workspace.tsx`
- 输出：`workspaceSkillInstalls`、旧数据迁移、安装记录写入。

## T3 增加卸载闭环

- 文件：`src/features/workspace/crewly-workspace.tsx`
- 输出：卸载按钮、影响成员弹窗、卸载后成员启用清理。

## T4 验证

- lint
- build
- 页面行为测试：安装、卸载、成员启用清理。
