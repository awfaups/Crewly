# AI 成员自定义大模型 - 架构设计

## 类型设计

新增：

```ts
ModelProvider =
  | "OpenAI"
  | "Anthropic"
  | "DeepSeek"
  | "通义千问"
  | "智谱 AI"
  | "Ollama"
  | "自定义"

ModelConfig {
  provider
  model
  endpointHint?
}
```

`Member` 增加可选字段：

```ts
modelConfig?: ModelConfig
```

## 表单设计

`MemberFormState` 增加：

```ts
modelProvider
modelName
endpointHint
```

## 数据兼容

读取 localStorage 时，对所有 `kind === "ai"` 且缺少 `modelConfig` 的成员补齐默认值：

```ts
provider: "OpenAI"
model: "gpt-5"
endpointHint: "演示配置，密钥由后端安全管理"
```

人类成员不补模型配置。

## UI 展示

- 创建弹窗中增加“大模型配置”分区。
- 右侧 AI 成员卡片增加模型提供商、模型名称、接入说明。
- 提示不在本地保存密钥。
