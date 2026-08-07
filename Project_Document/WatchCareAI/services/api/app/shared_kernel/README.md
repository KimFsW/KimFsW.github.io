# app/shared_kernel 共享内核

唯一允许被所有模块自由导入的包；它自己不导入任何业务模块。

| 文件 | 作用 |
|---|---|
| `types.py` | 共享词汇：`Severity`（L1/L2/L3）、`RiskEventType`、`EventStatus`、`AcknowledgementAction`、`PrivacyMode` |
| `domain_events.py` | 进程内领域事件总线 + 事件定义：`RiskEventCreated`（events 发布）、`AlertDispatched`（alerts 发布）。生产环境可换成 outbox 表 + Worker，模块内部不用改 |
