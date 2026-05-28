# Crewly 技能市场安装语义修正 - 验收记录

## 验收项

- [x] 技能市场顶部入口为“从 Skill 市场安装”。
- [x] 安装弹窗标题为“安装到 Crewly 技能市场”。
- [x] 安装弹窗不再选择 AI 成员。
- [x] Crewly 技能市场只展示已安装到 Crewly 的技能。
- [x] AI 成员配置只从 Crewly 已安装技能中启用。

## 自动验证

- 已通过：`npm run lint`
- 已通过：`npm run build`
- 已通过：临时 Playwright 测试覆盖从 Skill 市场安装到 Crewly，以及 AI 成员配置只启用 Crewly 已安装技能。
