# Edge 边缘节点（守望 AI）

对应设计方案第 4 节。家庭边缘节点负责持续分析，是系统中唯一接触原始视频的部分。

| 子目录 | 职责 |
|---|---|
| `runtime/` | 边缘运行时（Python 3.12 原型；产品阶段收敛为 C++20 主进程，方案 2.4） |
| `camera-adapters/` | RTSP / ONVIF / USB 摄像头适配层，屏蔽厂商差异 |
| `inference/` | ONNX Runtime / Core ML 推理封装与模型包管理 |
| `packaging/` | Docker 镜像、系统服务、断电重启与自动恢复 |

`runtime/watchcare_edge/` 内部分三层：

- `domain/` — 帧、检测、轨迹、姿态、候选风险、事件信封；纯标准库；
- `pipeline/` — 设计方案 4.1 节的 15 个模块，每个一个文件；
- `simulator/` — 垂直切片用的事件模拟器，不需要真实摄像头。
