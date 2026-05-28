# Crewly 技能市场安装语义修正 - 优化设计

## 状态设计

在工作区持久化状态中增加 `workspaceSkillIds`，表示已经安装到 Crewly 的技能 ID。

## 数据流

1. `skillCatalog` 继续表示外部 Skill 市场可用 skill。
2. `workspaceSkillIds` 表示 Crewly 已安装 skill。
3. `crewlySkillCatalog` 由 `skillCatalog` 和 `workspaceSkillIds` 派生。
4. AI 成员配置、右侧调用面板、AI 成员管理卡片只读取 `crewlySkillCatalog`。

## UI 设计

- “技能市场”模块展示 Crewly 已安装技能。
- 顶部入口改为“从 Skill 市场安装”。
- 安装弹窗只选择 skill 并安装到 Crewly，不再选择 AI 成员。
- AI 成员配置内文案改为“启用 Crewly 技能”。

## 兼容策略

旧数据没有 `workspaceSkillIds` 时，默认安装前三个示例技能，并过滤不存在于 catalog 的无效 ID。
