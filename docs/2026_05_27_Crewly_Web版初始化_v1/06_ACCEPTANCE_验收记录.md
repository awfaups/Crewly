# Crewly Web版初始化 - 验收记录

## 验收标准

- 项目可以本地安装依赖并启动。
- 页面第一屏是 Crewly workspace，不是营销页。
- 页面展示 AI members、channels、tasks、sessions、approvals。
- 任务和 AI session 之间有明确关系。
- 审批卡有 pending/approved/denied 状态表达。
- 产品原型能体现 Helio 式工作台交互：左侧导航、中间工作流、右侧上下文。
- Crewly 使用自有名称、文案、示例数据和视觉风格。
- 代码通过可行的 lint/build 检查。
- README 说明项目定位、运行方式和后续路线。

## 当前状态

已完成第一版实现。

## 验收命令

```bash
npm run lint
npm run build
```

## 验收结果

通过。

- `npm run lint`：通过。
- `npm run build`：通过。
- 浏览器检查：`http://localhost:3000` 可访问，首屏为 Crewly 中文工作台。
- 桌面视口：三栏结构正常展示，频道、任务看板、Agent Session 和审批卡可见。
- 移动视口：内容按纵向堆叠展示，核心中文内容可读。
