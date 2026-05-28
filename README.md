# Crewly

Crewly 是一个 AI-native team workspace。第一版先实现中文 Web 工作台，让人类成员和 AI 成员在同一界面中围绕频道、任务、Agent Session 和审批协作。

## 当前版本

- Next.js App Router
- TypeScript
- Tailwind CSS
- lucide-react 图标
- 本地 mock data
- 中文三栏工作台界面
- localStorage 本地持久化
- 任务、审批、消息和 Agent Session 的前端交互闭环
- 会话支持发送图片和文件附件
- 任务创建、编辑、归档和消息转任务
- AI 成员创建和频道创建
- AI 成员支持自定义大模型配置
- AI 成员支持编辑配置和停用
- AI 成员在侧栏、消息、任务和详情中显示 AI 标识
- AI 成员拥有独立管理模块
- 每个 AI 成员拥有独立记忆、独立技能安装清单和技能调用策略
- 技能库支持查看技能分类、风险、权限和成员安装情况
- 已安装技能可在当前任务中模拟调用，并写入 Agent Session 与审批流

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

- 左侧工作区、频道、AI 成员和快捷入口
- 中间频道消息流、任务卡、审批卡和输入框
- 右侧任务详情、AI 成员、Agent Session timeline 和审批操作
- 审批按钮可在前端状态中反馈通过/拒绝
- 任务状态可在右侧详情中流转
- 消息输入框可向当前频道新增消息
- 消息可携带图片或文件附件，图片显示预览，文件提供下载入口
- 刷新页面后保留任务、审批、消息和 Session 状态
- 可一键重置演示数据
- 可从频道消息一键创建任务
- 可编辑任务标题、描述、负责人、优先级、标签和截止时间
- 可归档任务并从看板隐藏
- 可创建新的协作频道并自动切换
- 可创建新的 AI 成员并用于任务负责人选择
- 新建 AI 成员可配置模型提供商、模型名称、Base URL、认证方式、密钥引用名、运行环境、参数和能力开关
- 模型配置不保存 API Key 明文，只保存如 `OPENAI_API_KEY` 这类密钥引用名
- 可编辑 AI 成员资料和模型配置，可停用不再使用的 AI 成员
- AI 成员姓名旁显示 `AI` 徽标，便于和人类成员区分
- 可通过独立的 AI 成员管理模块集中查看、创建、编辑和停用 AI 成员
- 可为每个 AI 成员单独配置记忆范围、保留天数、已安装技能和调用策略
- 可在技能库查看技能分类、风险等级、权限范围、适用场景和已安装成员
- 可在 AI 成员编辑弹窗中通过复选框安装或卸载技能
- 可在右侧 AI 成员详情中调用已安装技能，低风险技能直接写入模拟结果，高风险或需审批技能生成审批卡

暂不包含真实登录、后端 API、模型调用、GitHub 集成、执行容器或 WebSocket。

## 后续路线

- 接入真实账户和 workspace 数据
- 将 mock task/session/approval 替换为 API 数据
- 增加实时消息和 Agent runtime event stream
- 增加任务状态流转和审批审计记录
- 扩展移动端体验和可访问性检查
