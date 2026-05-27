# Crewly Web版初始化 - 共识确认

## 已确认

- 产品名：Crewly
- 产品类型：AI-native team workspace
- 核心对象：AI teammate、channel、task、session、approval
- 当前仓库：`https://github.com/awfaups/Crewly`
- 初始实现方向：Web 版
- 初始交付重点：可运行 MVP 骨架和核心工作流演示

## 产品原则

- AI 是团队成员，不是侧边栏插件。
- 所有重要动作都回到同一条团队时间线。
- AI 可以推进工作，但人类保留最终审阅和发布权。
- 执行轨迹必须可读，包括思考状态、工具调用、结果和审批。
- 第一版保持范围克制，先证明工作流，再扩展集成。
- 产品原型和交互可参照 Helio 的公开工作方式：频道、任务、AI teammate、session、approval 在同一工作台内联动。
- 参照 Helio 时只借鉴工作流结构和交互范式，不复制品牌、视觉资产、文案或代码。

## 建议技术方向

- 前端框架：Next.js + React + TypeScript
- 样式：Tailwind CSS
- 组件：自建轻量组件，必要时引入 lucide-react 图标
- 状态：第一版使用本地 mock data 和 React state
- 后端：先预留 API 边界，后续再接入数据库和 runtime

## 待用户确认

- 是否同意先做静态/模拟数据 MVP，而不是一开始接真实后端。
- 是否同意用 Next.js + TypeScript + Tailwind 初始化项目。
- 是否第一版优先做英文界面，中文文档保留。
- 是否确认 Crewly 的产品原型与交互以 Helio 的公开体验为主要参照。
