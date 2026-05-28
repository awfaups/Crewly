# Crewly 技能市场管理闭环 - 架构设计

## 类型设计

`SkillCatalogItem` 增加市场元信息：

- `source`
- `version`
- `author`
- `updatedAt`
- `compatibility`

新增 `WorkspaceSkillInstall`：

- `id`
- `installedAt`
- `installedVersion`

## 状态流

1. `skillCatalog` 代表 Skill 市场可用 skill。
2. `workspaceSkillInstalls` 代表 Crewly 已安装 skill。
3. `crewlySkillCatalog` 根据安装记录派生。
4. AI 成员配置只读取 `crewlySkillCatalog`。
5. 卸载时移除 `workspaceSkillInstalls` 中对应记录，并清理所有 AI 成员的 `installedSkills`。

## 组件变化

- `SkillLibraryModule`：展示市场元信息、状态、卸载入口。
- `SkillMarketplaceInstallDialog`：安装时展示元信息。
- `SkillUninstallDialog`：卸载前展示影响成员。

## 兼容

旧版本 `workspaceSkillIds` 会被迁移为 `workspaceSkillInstalls`。
