# app/alerts 报警模块

分级报警编排（设计方案 3.5）：订阅 `RiskEventCreated`，按严重等级生成通知计划。

| 文件 | 作用 |
|---|---|
| `domain.py` | `Contact`、`NotificationTask` 与 `build_notification_plan`：L1 普通推送主联系人；L2 Time Sensitive 需确认；L3 全员推送 + 备用联系人短信 |
| `apns.py` | `ApnsSender` 发送端口 + `SandboxApnsSender`（开发期记录代替真推送） |
| `service.py` | `AlertService`：执行通知计划、调用发送端口、回发 `AlertDispatched` 让事件状态推进到 NOTIFIED |

不直接修改事件表、不接触摄像头数据；短信/电话网关在 `services/notification` 实现。
