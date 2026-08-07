# services/api 云端模块化单体

FastAPI 实现的云端主服务（设计方案 5.1）。模块间不直接互调，
通过 `shared_kernel` 的领域事件总线协作。

## 运行

```powershell
# 领域层测试（纯标准库，无需安装依赖）
cd services/api && python -m unittest discover -s tests -v

# HTTP 服务（需要 Python 3.12 + fastapi/uvicorn/pydantic）
pip install -e ".[dev]"
uvicorn app.main:build_app --factory --port 8000
```

## 文件与模块

| 文件/目录 | 作用 | 状态 |
|---|---|---|
| `pyproject.toml` | 包定义与依赖（fastapi / pydantic / uvicorn） | 完成 |
| `Dockerfile` | 容器镜像，供 `infra/docker` 编排 | 完成 |
| `app/main.py` | 组合根：装配事件总线、仓储、事件/报警服务与路由 | 完成（待装依赖） |
| `app/shared_kernel/` | 共享词汇 + 领域事件总线（见内层 README） | 已实现 + 测试 |
| `app/events/` | 事件模块：状态机、幂等入库、确认、超时升级（见内层 README） | 已实现 + 测试 |
| `app/alerts/` | 报警编排：L1/L2/L3 → 渠道映射（见内层 README） | 已实现 + 测试 |
| `app/identity/` | 登录、令牌刷新、设备绑定 | 占位 |
| `app/users/` | 监护人账号与档案 | 占位 |
| `app/care_subjects/` | 被照护对象档案与风险配置 | 占位 |
| `app/devices/` | 边缘节点注册、一次性配对、在线状态 | 占位 |
| `app/cameras/` | 摄像头元数据、快照/HLS 票据 | 占位 |
| `app/zones/` | 危险区域配置（归一化坐标 + 乐观锁版本） | 占位 |
| `app/evidence/` | 加密证据存储、预签名下载、到期删除 | 占位 |
| `app/contacts/` | 主/备用联系人与升级顺序 | 占位 |
| `app/consent/` | 授权记录、保存期、数据删除请求 | 占位 |
| `app/audit/` | 追加式审计日志 | 占位 |
| `app/model_registry/` | 模型包、版本、灰度与回滚 | 占位 |
| `app/telemetry/` | 边缘遥测接入与运行指标 | 占位 |
| `tests/` | 13 个标准库测试：状态机 / 幂等 / 报警策略 / 超时升级 | 已完成 |
