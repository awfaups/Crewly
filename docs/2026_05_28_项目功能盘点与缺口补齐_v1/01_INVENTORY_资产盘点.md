# 项目功能盘点与缺口补齐 - 资产盘点

## 已核验资产

- `src/app/page.tsx`：应用入口。
- `src/features/workspace/crewly-workspace.tsx`：Crewly 工作台主要交互模块。
- `src/lib/types.ts`：领域类型。
- `src/lib/mock-data.ts`：本地 mock 数据。
- `README.md`：运行说明、部署说明和 MVP 范围。
- `docs/`：历次 6A/6AYH/PPW 文档。

## 当前架构事实

- 前端框架：Next.js App Router、React、TypeScript、Tailwind CSS。
- 状态存储：前端 React state + `localStorage`。
- 部署：GitHub Pages 静态导出。
- 后端、登录、真实模型调用、真实 skill 执行均未接入。

## 已发现缺口

- 侧栏已有“运行轨迹”和“审批队列”快捷入口，但此前没有独立模块。
- README 中技能市场描述仍停留在旧语义，需要更新为 Skill 市场安装到 Crewly、AI 成员启用 Crewly 技能。
