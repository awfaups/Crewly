# 会话附件发送 - 任务拆分

## T1 类型扩展

- 增加 `Attachment` 类型。
- `Message` 支持 `attachments`。

## T2 Composer 附件选择

- 增加文件 input。
- 读取 File 为 data URL。
- 增加待发送附件列表。

## T3 消息发送

- `sendMessage` 接收文本和附件。
- 有附件时允许空文本发送。

## T4 附件渲染

- 图片预览。
- 文件卡片。
- 下载链接。

## T5 验证和文档

- lint/build。
- 浏览器检查。
- 更新 README 和验收文档。
