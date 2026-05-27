# 会话附件发送 - 验收记录

## 验收标准

- 图片可作为消息附件发送。
- 文件可作为消息附件发送。
- 图片消息显示预览。
- 文件消息显示名称、大小和下载入口。
- 附件刷新后仍保留。
- `npm run lint` 通过。
- `npm run build` 通过。

## 验收结果

通过。

- `npm run lint`：通过。
- `npm run build`：通过。
- 类型扩展：`Message` 已支持 `attachments`。
- Composer：已支持多附件选择、待发送附件预览和移除。
- 图片附件：已支持缩略图预览。
- 文件附件：已支持文件名、大小、类型和下载入口。
- 持久化：附件随消息进入 localStorage。
- 浏览器端到端文件注入：当前 Browser 自动化封装不暴露 `setInputFiles`，未完成自动化文件选择；实现已通过 TypeScript 和构建验证。
