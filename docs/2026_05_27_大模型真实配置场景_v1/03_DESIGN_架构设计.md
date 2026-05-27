# 大模型真实配置场景 - 架构设计

## 类型设计

`ModelConfig` 扩展为：

```ts
{
  provider
  model
  baseUrl
  authType
  apiKeyRef
  organizationId?
  projectId?
  environment
  temperature
  maxTokens
  timeoutSeconds
  capabilities
  endpointHint?
}
```

## 安全设计

- `apiKeyRef` 只保存密钥引用名，例如 `OPENAI_API_KEY`。
- `authType` 只保存认证类型，不保存凭据值。
- `endpointHint` 用于说明后端代理或部署备注。

## 兼容设计

历史数据可能只有：

```ts
{
  provider
  model
  endpointHint
}
```

读取时使用默认配置补齐缺失字段，并保留已有 provider/model/endpointHint。

## UI 设计

- 新建 AI 成员弹窗中的大模型配置改为多字段表单。
- 能力开关使用 checkbox。
- 数值参数使用 number input。
- 右侧 AI 成员卡片展示 provider、model、Base URL、认证方式、密钥引用、运行环境、参数和能力。
