# watchcare_edge 主包

| 文件/目录 | 作用 |
|---|---|
| `main.py` | 命令行入口：`--mode simulate`（垂直切片）/ `--mode pipeline`（真实管线，Sprint 3） |
| `domain/` | 领域层：帧、检测、轨迹、姿态、风险、事件信封；纯标准库（见内层 README） |
| `pipeline/` | 设计方案 4.1 节的 15 个管线模块（见内层 README） |
| `simulator/` | 事件模拟器：垂直切片的起点，不需要真实摄像头（见内层 README） |
