# 交互闭环与本地持久化 - 共识确认

## 已确认

- 当前项目继续保持中文界面。
- 当前项目继续以静态前端 demo 为主。
- 本轮用 `localStorage` 作为本地持久化，不引入后端依赖。
- 交互闭环优先服务演示：让用户能看到任务、审批、消息、Session 之间的联动。
- localStorage 数据结构应接近未来 API 返回结构，减少后续迁移成本。

## 关键决策

- 状态源从直接引用 mock 常量改为 React state。
- 页面首次加载时优先读取 localStorage；没有本地数据时使用 mock seed。
- 每次任务、审批、消息或 Session 变化后写入 localStorage。
- 重置按钮清空 localStorage 并恢复 seed 数据。
- 审批结果触发联动：
  - 通过：任务推进到 `review` 或 `done`，Session 进入 `completed`。
  - 拒绝：任务回到 `doing`，Session 进入 `running`，并追加一条结果事件。

## 风险

- localStorage 只适合单浏览器演示，不能代表多人协作。
- 本轮不处理复杂冲突和权限校验。
- 本轮不抽象复杂状态库，避免过早引入架构成本。
