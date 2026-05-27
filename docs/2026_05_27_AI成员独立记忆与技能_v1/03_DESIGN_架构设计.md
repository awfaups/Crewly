# AI 成员独立记忆与技能 - 架构设计

## 类型设计

`Member` 增加：

```ts
memoryConfig?: TeammateMemoryConfig
skillConfig?: TeammateSkillConfig
```

记忆配置：

```ts
TeammateMemoryConfig {
  enabled
  scope
  retentionDays
  notes
}
```

技能配置：

```ts
TeammateSkillConfig {
  invocationMode
  requireApprovalForExternalActions
  installedSkills
}
```

## 表单设计

`MemberFormState` 增加：

- `memoryEnabled`
- `memoryScope`
- `memoryRetentionDays`
- `memoryNotes`
- `skillInvocationMode`
- `skillApprovalRequired`
- `installedSkillsText`

## 兼容策略

读取旧成员数据时：

- 缺少 `memoryConfig` 的 AI 成员补默认记忆配置。
- 缺少 `skillConfig` 的 AI 成员补默认技能配置。

## UI 设计

- AI 成员表单增加“独立记忆”和“独立技能”分区。
- 管理模块卡片展示记忆状态、范围、技能数和调用策略。
- 右侧详情补充记忆和技能摘要。
