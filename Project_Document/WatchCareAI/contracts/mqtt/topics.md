# MQTT 主题约定（边缘 ↔ 云端）

对应设计方案 5.2 节。所有主题使用 QoS 1，TLS 双向认证，每个边缘节点独立证书。

## 主题列表

| 方向 | 主题 | 载荷 | 说明 |
|---|---|---|---|
| edge → cloud | `watchcare/v1/edges/{edgeId}/telemetry` | TelemetryPayload | CPU、温度、磁盘、摄像头状态心跳 |
| edge → cloud | `watchcare/v1/edges/{edgeId}/events` | RiskEventEnvelope | 风险事件，见 `contracts/schemas/risk-event-envelope.schema.json` |
| cloud → edge | `watchcare/v1/edges/{edgeId}/commands` | CommandPayload | 重启、重连摄像头、切换模型等指令 |
| edge → cloud | `watchcare/v1/edges/{edgeId}/command-results` | CommandResultPayload | 指令执行结果（按 commandId 关联） |
| edge → cloud | `watchcare/v1/edges/{edgeId}/model-status` | ModelStatusPayload | 当前模型版本、校验哈希、切换结果 |

## 硬约束

1. 每条消息必须包含唯一事件 ID 与幂等键（信封中的 `eventId` / `idempotencyKey`）；
2. 云端消费端必须幂等：同一 `idempotencyKey` 重复投递不产生第二条事件；
3. 视频短片、关键帧等二进制证据**不经过 MQTT**，走预签名 HTTPS 地址直传对象存储；
4. 本地开发允许明文 1883 端口（见 `infra/docker/mosquitto/mosquitto.conf`），
   生产环境只允许 8883 mTLS，证书由设备配对流程签发；
5. 主题结构带 `v1` 版本段，破坏性变更必须开 `v2` 并保留旧版本消费窗口。

## 载荷版本

所有载荷均为 JSON，顶层必须携带 `schemaVersion` 字段。
事件载荷直接复用 `contracts/schemas/risk-event-envelope.schema.json`；
telemetry / command / model-status 的 Schema 在垂直切片完成后补充到 `contracts/schemas/`。
