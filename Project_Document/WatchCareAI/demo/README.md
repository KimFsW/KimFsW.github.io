# 守望 AI 垂直切片演示

把两套单元测试（29 个用例）背后的领域逻辑演成一个看得懂的故事，
纯标准库，不需要安装任何依赖（Python 3.9+）。

```powershell
cd Project_Document\WatchCareAI\demo

python demo.py            # 交互模式：由你决定如何处置报警
python demo.py --auto     # 自动播放全部三种结局（确认风险 / 误报 / 超时升级）
python demo.py --fast     # 去掉停顿，快速播放
```

演示的五个场景对应系统中的真实代码路径：

| 场景 | 用到的代码 |
|---|---|
| 1. 边缘节点发现疑似跌倒 | `edge/.../fall_candidate.py`、`risk_verifier.py`、`simulator/event_simulator.py` |
| 2. 云端幂等入库 | `services/api/app/events/service.py`（`ingest_envelope`） |
| 3. 报警编排 | `services/api/app/alerts/`（通知计划 + APNs 沙盒） |
| 4. 监护人处置 | `EventService.acknowledge` / `escalate_overdue` |
| 5. 状态流转审计 | `events/domain.py` 状态机与 `StateTransitionRecord` |

演示结束时打印的"附录"解释了 29 个测试用例各自守护的规则。
