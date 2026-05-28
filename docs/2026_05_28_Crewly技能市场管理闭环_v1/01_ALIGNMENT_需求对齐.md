# Crewly 技能市场管理闭环 - 需求对齐

## 背景

Crewly 已支持从 Skill 市场安装 skill 到 Crewly 技能市场，但还缺少已安装技能的管理能力和市场元信息展示。

## 目标

- 已安装到 Crewly 的 skill 可查看来源、版本、作者、更新时间和兼容范围。
- 支持卸载 Crewly 已安装 skill。
- 卸载前展示影响哪些 AI 成员正在启用。
- 卸载后自动从 AI 成员启用列表中移除该 skill。
- 保持“安装”与“启用”的语义边界。

## 非目标

- 不接入真实远程 Skill 市场 API。
- 不实现真实 skill 包下载、执行沙箱或版本升级逻辑。
- 不保存真实密钥。

## 假设

- 当前 demo 继续使用静态 `skillCatalog` 作为 Skill 市场数据源。
- 本地持久化继续使用 `localStorage`。
