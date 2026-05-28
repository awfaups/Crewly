# AI 成员技能调用审批闭环 - 架构设计

## 数据模型

复用现有模型：

- `SkillCatalogItem`：技能元数据和风险等级。
- `Member.skillConfig.installedSkills`：成员已安装技能。
- `AgentSession.events`：记录技能调用、等待审批和模拟结果。
- `Approval`：记录高风险调用审批。

## 核心函数

`invokeSkill(member, task, session, skill)`：

1. 判断技能是否已安装。
2. 计算是否需要审批：
   - 技能风险为高。
   - 或成员设置外部动作需审批。
3. 追加 `tool` 类型事件。
4. 需要审批时创建 `Approval` 并追加 `approval` 事件。
5. 不需要审批时追加 `result` 事件。

## 审批联动

现有 `decideApproval` 会更新审批状态和 Session。新增技能审批仍复用该函数，审批通过后任务进入待验收，拒绝后任务回到进行中。

## UI

- `SkillInvocationPanel`：显示可调用技能按钮。
- 高风险技能显示风险徽标。
- 点击按钮后使用当前任务和当前 Session 写入事件。
