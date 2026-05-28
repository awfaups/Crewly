# AI 成员技能市场 - 架构设计

## 数据模型

新增 `SkillCatalogItem`：

```ts
type SkillCatalogItem = {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  riskLevel: SkillRiskLevel;
  permissions: string[];
  useCases: string[];
};
```

继续复用 `InstalledSkill`，安装结果保存在 `Member.skillConfig.installedSkills`。

## 模块

- `SkillLibraryModule`：展示技能库和安装统计。
- `SkillInstallCheckbox`：AI 成员表单中的技能安装控件。
- `SkillBadges`：展示已安装技能摘要。

## 数据流

1. 静态 `skillCatalog` 提供技能库。
2. AI 成员表单读取当前成员 `installedSkills`。
3. 用户勾选/取消技能。
4. 保存时把勾选项转为 `InstalledSkill[]`。
5. localStorage 持久化整个 workspace state。

## 兼容策略

- 已有自定义技能如果不在 `skillCatalog` 中，仍作为“自定义技能”保留。
- 旧数据缺少技能配置时补默认技能。
