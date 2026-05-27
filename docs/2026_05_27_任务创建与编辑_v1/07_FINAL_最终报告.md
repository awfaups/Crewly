# 任务创建与编辑 - 最终报告

## 当前状态

任务创建与编辑能力已完成。

## 实现范围

- `Task` 增加 `archived` 字段。
- 任务看板默认隐藏归档任务。
- 侧栏增加“新建任务”入口。
- 右侧任务详情增加“编辑”和“归档”操作。
- 新建任务时自动创建对应 Agent Session。
- 编辑任务时同步更新任务和对应 Session 标题。
- 消息卡增加“转为任务”入口。
- 消息转任务后会创建任务、创建 Session，并回写 `linkedTaskId`。

## 关键文件

- `src/lib/types.ts`
- `src/features/workspace/crewly-workspace.tsx`
- `README.md`

## 验证结果

已通过：

- `npm run lint`
- `npm run build`

## 已知限制

- 表单和工作台仍在同一个组件文件中，后续应拆分。
- 归档任务暂不提供恢复入口。
- 任务字段仍是 demo 级文本输入，未接真实后端校验。

## 后续建议

- 拆分 `TaskFormDialog`、`TaskBoard`、`ContextPanel`。
- 增加归档任务视图和恢复操作。
- 将任务表单字段映射为未来 API schema。
