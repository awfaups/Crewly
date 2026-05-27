# 会话附件发送 - 架构设计

## 数据结构

新增附件模型：

```ts
type Attachment = {
  id: string
  name: string
  size: number
  type: string
  url: string
}
```

`Message` 增加：

```ts
attachments?: Attachment[]
```

## 交互设计

- Composer 增加附件按钮。
- 文件选择后显示待发送附件列表。
- 图片显示缩略图。
- 文件显示文件名和大小。
- 点击移除按钮可以从待发送列表删除。
- 发送成功后清空输入和待发送附件。

## 渲染设计

- 消息正文下方展示附件。
- 图片使用 `<img>` 预览。
- 文件使用下载链接。

## 持久化

附件作为 message 的一部分进入 localStorage。

## 限制

- 单文件 2MB。
- 存储失败时不阻断页面，但附件可能无法保留。
