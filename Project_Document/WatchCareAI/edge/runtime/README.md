# edge/runtime 边缘运行时

家庭边缘节点的 Python 原型（设计方案 2.4；产品阶段收敛为 C++20 主进程）。

## 运行

```powershell
cd edge/runtime

# 16 个标准库测试：区域引擎 / 离线队列 / 跌倒规则链
python -m unittest discover -s tests -v

# 垂直切片：生成一条 L3 模拟事件信封（打印到终端）
python -m watchcare_edge.main --mode simulate --count 1

# 接云端后：POST 到 API 的 ingest 开发旁路
python -m watchcare_edge.main --mode simulate --api-url http://localhost:8000 --count 3
```

| 文件/目录 | 作用 |
|---|---|
| `pyproject.toml` | 包定义；摄像头/推理/MQTT 为可选 extras |
| `watchcare_edge/` | 主包：domain（领域）/ pipeline（15 个管线模块）/ simulator（事件模拟器）/ main.py（入口） |
| `tests/` | 16 个标准库测试 |
