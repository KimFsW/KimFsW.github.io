# WatchCareAI 代码框架（守望 AI）

本目录是「守望 AI（WatchCare AI）」项目的工程代码骨架，依据
《守望 AI（WatchCare AI）软件设计及编写方案》v1.0（2026-08-03）生成：

- 总体架构：**边缘计算节点 + 模块化云端单体 + 原生 iOS App**（方案 1.1 节）
- 仓库形态：Monorepo（方案 9.1 节）
- 首个工程目标：**"模拟事件 → 云端 → APNs → iOS 确认"端到端垂直切片**（方案 8.3 节）

## 目录结构与设计方案对照

| 目录 | 对应方案章节 | 职责 |
|---|---|---|
| `contracts/` | 5.2 / 5.3 | iOS、云端、边缘三方共享的接口契约（OpenAPI / MQTT 主题 / 事件信封 JSON Schema） |
| `services/api/` | 5.1 | 云端模块化单体（FastAPI），事件、报警、设备、隐私等业务模块 |
| `services/worker/` | 2.5 | 后台任务 Worker（升级计时、数据到期清理等），当前为占位 |
| `services/notification/` | 0.1 | 通知服务（APNs / 短信 / 电话网关适配），当前为占位 |
| `edge/` | 4.1 / 4.2 | 家庭边缘节点：摄像头接入、AI 分析管线、事件模拟器 |
| `apps/ios/` | 3.1 | iOS 监护人 App（Swift 6 + SwiftUI + Clean Architecture + MVVM） |
| `ml/` | 2.4 | 训练、评估、导出（PyTorch → ONNX / Core ML） |
| `infra/docker/` | 9.1 | 本地开发环境编排（PostgreSQL / Redis / Mosquitto / MinIO / API） |
| `docs/adr/` | 11.1 | 架构决策记录 |

## 快速开始（仅需 Python 标准库）

领域层不依赖任何第三方包，克隆后即可验证核心逻辑：

```powershell
# 云端：事件状态机、幂等入库、报警编排、超时升级
cd services/api
python -m unittest discover -s tests -v

# 边缘：区域引擎（多边形包含）、断网离线队列
cd ../../edge/runtime
python -m unittest discover -s tests -v

# 垂直切片第一步：边缘模拟器生成一条 L3 跌倒事件信封（打印到 stdout）
python -m watchcare_edge.main --mode simulate --count 1
```

## 完整垂直切片运行方式（需要依赖）

```powershell
# 1. 启动基础设施（PostgreSQL / Redis / Mosquitto / MinIO）
cd infra/docker && docker compose up -d

# 2. 启动云端 API（Python 3.12+，安装 fastapi/uvicorn/pydantic）
cd services/api
pip install -e ".[dev]"
uvicorn app.main:build_app --factory --port 8000

# 3. 边缘模拟器把模拟事件 POST 到云端（触发 alerts 模块的报警编排）
cd edge/runtime
python -m watchcare_edge.main --mode simulate --api-url http://localhost:8000 --count 3

# 4. iOS App 通过 GET /v1/events 轮询或 APNs 接收报警，POST acknowledgements 确认
```

## 框架中"已实现"与"占位"的边界

已实现（有测试覆盖，可运行）：

- 事件生命周期状态机（方案 4.3 节，含全部迁移审计字段）
- 事件幂等入库（`idempotencyKey` 去重）
- 报警编排策略 L1/L2/L3 → 通知渠道映射（方案 3.5 节）
- 超时未确认自动升级（ESCALATED）
- 边缘区域引擎（归一化坐标 + 射线法多边形判定 + 停留计时）
- 边缘断网离线队列（SQLite，`idempotencyKey` 唯一约束）

占位（结构就绪，待填实现）：

- FastAPI HTTP 装配层（`app/main.py` / 各 router，依赖 pydantic）
- 摄像头适配器、人体检测、姿态估计等 AI 模块（接口已按方案 4.2 节冻结）
- iOS 端 EventCenter 之外的 12 个功能模块（职责见 `apps/ios/README.md`）
- MQTT 发布端（生产用 paho-mqtt + 双向 TLS，见 `contracts/mqtt/topics.md`）

## 下一步任务清单（对齐方案 8.1 阶段门 G1/G2）

1. 在部署机上安装 Python 3.12 与依赖，跑通 `uvicorn` 启动与 `/v1/events/ingest`；
2. 用 Mosquitto + 自签证书打通边缘 → 云端 MQTT mTLS 通道；
3. 在 Mac 上创建 Xcode 工程，把 `apps/ios/WatchCareAI/` 源码加入 target；
4. 接入 APNs 沙盒环境，替换 `SandboxApnsSender`；
5. 按 `contracts/schemas/` 为 MQTT 消息增加 CI Schema 校验（方案 9.3 节）。
