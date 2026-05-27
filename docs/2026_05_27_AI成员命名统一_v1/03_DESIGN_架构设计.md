# AI 成员命名统一 - 架构设计

## 变更策略

本次采用展示层命名迁移：

- 中文文案：旧称 -> `AI 成员`
- 普通中文称谓：旧称 -> `成员`
- 文档目录：旧称目录 -> `AI成员...`

## 保留项

以下内部标识暂不迁移：

- `AITeammateManager`
- `TeammateMemoryConfig`
- `TeammateSkillConfig`
- `ai-teammates`

原因：这些是代码内部实现名，本轮改动目标是产品命名统一。后续若要彻底领域模型重命名，应单独做一次低风险重构。
