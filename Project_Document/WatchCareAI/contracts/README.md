# contracts/ 接口契约

iOS、云端、边缘三方共享的接口定义，受版本管理（设计方案 5.2 / 5.3 / 9.3）。
任何一方改接口都必须先改这里，CI 做兼容性检查。

| 文件 | 作用 |
|---|---|
| `schemas/risk-event-envelope.schema.json` | 风险事件信封的 JSON Schema：三方数据格式的唯一事实来源 |
| `mqtt/topics.md` | 边缘 ↔ 云端 MQTT 主题、QoS、mTLS 与幂等约束 |
| `openapi/openapi.yaml` | iOS ↔ 云端 REST 接口定义（登录、设备、区域、事件、确认、隐私） |

关键规则：所有载荷必须携带 `schemaVersion`；事件消费必须按 `idempotencyKey` 幂等；
二进制证据不走 MQTT，走预签名 HTTPS。
