# infra/docker 本地开发编排

```powershell
cd infra/docker
docker compose up -d
docker compose logs -f api
docker compose down
```

| 文件 | 作用 |
|---|---|
| `docker-compose.yml` | postgres:17（业务数据）、redis:7（缓存/任务状态）、eclipse-mosquitto:2（边缘 MQTT）、minio（S3 兼容证据存储）、api（自 `services/api/Dockerfile` 构建） |
| `mosquitto/mosquitto.conf` | 本地明文 1883；生产改 8883 + 每节点独立客户端证书（见 `contracts/mqtt/topics.md`） |

密码均为开发默认值，禁止用于任何真实环境。
