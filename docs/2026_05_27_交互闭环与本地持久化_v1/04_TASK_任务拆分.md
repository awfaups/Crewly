# 交互闭环与本地持久化 - 任务拆分

## T1 状态源改造

输入：

- 当前 mock 数据。
- 当前 `CrewlyWorkspace`。

输出：

- `tasksState`
- `messagesState`
- `approvalsState`
- `sessionsState`

验证：

- 页面渲染不退化。

## T2 localStorage 持久化

输入：

- 四类 state。

输出：

- 初始化加载本地数据。
- 状态变化自动保存。
- 重置演示数据。

验证：

- 刷新后状态保留。
- 重置后恢复 seed。

## T3 任务状态流转

输入：

- `TaskStatus` 状态序列。

输出：

- 右侧任务详情状态操作。
- 任务看板分组同步。

验证：

- 状态切换后卡片移动到对应分组。

## T4 审批联动

输入：

- approval、task、session 关系。

输出：

- 审批结果影响任务和 Session。
- Session 追加结果事件。

验证：

- 通过/拒绝后右侧详情和 timeline 同步变化。

## T5 消息输入

输入：

- 当前频道。

输出：

- 真实输入框。
- 发送后新增当前频道消息。

验证：

- 新消息出现在当前频道，切换频道不丢失。

## T6 文档与验证

输入：

- 实现结果。

输出：

- README 更新。
- 验收记录。
- 最终报告。

验证：

- `npm run lint`
- `npm run build`
- 浏览器交互检查。
