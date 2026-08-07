# simulator/ 事件模拟器

垂直切片（设计方案 8.3）的起点：在没有摄像头的情况下，
用跌倒特征的规则链真实产出一条 L3 事件信封，
驱动云端、报警与 iOS 的端到端联调。

| 文件 | 作用 |
|---|---|
| `event_simulator.py` | `build_simulated_envelope`：构造时序特征 → FallCandidateEngine → RiskVerifier → `build_event_envelope`；产出与 contracts Schema 一致的事件信封 |

真实摄像头接入后，模拟器保留为回归与演示工具。
