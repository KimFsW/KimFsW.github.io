# worker（占位）

后台任务 Worker（设计方案 2.5）。计划职责：

- 报警升级计时（NOTIFIED 超时 → ESCALATED，当前由 `EventService.escalate_overdue` 提供领域逻辑，Worker 只做周期触发）；
- 事件证据到期删除（家庭版默认 7 天，设计方案 7.3）；
- 账号级数据删除任务执行（privacy deletion-requests）；
- MQTT 断连重放与死信处理。

与 API 共享 `app/` 领域代码，但独立部署、独立扩缩。
