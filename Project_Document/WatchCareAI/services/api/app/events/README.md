# app/events 事件模块

风险事件的聚合与生命周期管理（设计方案 4.3 / 5.2）。

| 文件 | 作用 |
|---|---|
| `domain.py` | `RiskEvent` 聚合根 + 状态机：CREATED→NOTIFIED→ACKNOWLEDGED→RESOLVED 等合法迁移表，非法迁移抛 `InvalidTransitionError`；每次迁移记录操作者/时间/原因（`StateTransitionRecord`） |
| `repository.py` | 仓储端口（协议）+ 内存实现；PostgreSQL 实现 Sprint 2 接入 |
| `service.py` | 应用服务：`ingest_envelope`（按 `idempotencyKey` 幂等）、`acknowledge`、`resolve`、`escalate_overdue`（超时未确认自动 ESCALATED）；订阅 `AlertDispatched` 把事件推进到 NOTIFIED |
| `schemas.py` | HTTP 边界的 Pydantic DTO，与 `contracts/` 信封 Schema 对齐 |
| `router.py` | REST 路由：ingest（开发旁路）、列表、详情、确认 |

不拥有：APNs 连接、摄像头协议、登录、模型训练（设计方案 3.1 职责边界）。
