# Crewly

Crewly 是一个 AI-native team workspace。第一版先实现中文 Web 工作台，让人类成员和 AI 队友在同一界面中围绕频道、任务、Agent Session 和审批协作。

## 当前版本

- Next.js App Router
- TypeScript
- Tailwind CSS
- lucide-react 图标
- 本地 mock data
- 中文三栏工作台界面

## 本地运行

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看界面。

## GitHub Pages

仓库已配置 GitHub Actions 自动部署到 GitHub Pages：

- 部署地址：[https://awfaups.github.io/Crewly/](https://awfaups.github.io/Crewly/)
- 触发方式：推送到 `main` 分支，或手动运行 `Deploy Crewly to GitHub Pages` workflow。
- 构建产物：`npm run build` 静态导出到 `out/`。

## 验证命令

```bash
npm run lint
npm run build
```

## 主要结构

```text
src/app
  App Router 页面和全局样式

src/features/workspace
  Crewly 工作台界面

src/lib
  领域类型和 mock data

docs/2026_05_27_Crewly_Web版初始化_v1
  6A 工作流文档、验收记录和后续 TODO
```

## MVP 范围

当前版本只验证产品结构和交互：

- 左侧工作区、频道、AI 队友和快捷入口
- 中间频道消息流、任务卡、审批卡和输入框
- 右侧任务详情、AI 队友、Agent Session timeline 和审批操作
- 审批按钮可在前端状态中反馈通过/拒绝

暂不包含真实登录、后端 API、模型调用、GitHub 集成、执行容器或 WebSocket。

## 后续路线

- 接入真实账户和 workspace 数据
- 将 mock task/session/approval 替换为 API 数据
- 增加实时消息和 Agent runtime event stream
- 增加任务状态流转和审批审计记录
- 扩展移动端体验和可访问性检查
