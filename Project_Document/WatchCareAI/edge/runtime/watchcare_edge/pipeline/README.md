# pipeline/ AI 分析管线

设计方案 4.1 节的 15 个模块，每个一个文件。数据流：

```
CameraAdapter → StreamSupervisor → FrameSampler → PersonDetector
→ AnonymousTracker → PoseEstimator → TemporalAnalyzer
→ ZoneEngine / FallCandidateEngine → RiskVerifier
→ EvidenceRecorder → EventPublisher（断网先入 LocalQueue）
```

| 文件 | 作用 | 状态 |
|---|---|---|
| `camera_adapter.py` | RTSP/ONVIF 解码适配 | 占位 |
| `stream_supervisor.py` | 心跳与断流判定（30s 阈值） | 已实现 |
| `frame_sampler.py` | 动态抽帧（目标 fps 控制） | 已实现 |
| `person_detector.py` | 人体检测 | 占位 |
| `tracker.py` | 匿名多目标跟踪 | 占位 |
| `pose_estimator.py` | 骨架关键点 | 占位 |
| `temporal_analyzer.py` | 时序特征窗口 | 占位 |
| `zone_engine.py` | 区域进入/停留/离开（射线法多边形 + 停留计时） | 已实现 + 8 测试 |
| `fall_candidate.py` | 跌倒候选规则（急坠 + 躯干水平） | 已实现 + 测试 |
| `risk_verifier.py` | 二阶段复核（静止计时） | 已实现 + 测试 |
| `evidence_recorder.py` | 环形缓存 + 事件短片截取 | 部分实现 |
| `event_publisher.py` | stdout / HTTP 发布端；MQTT 待接 | 已实现（HTTP/stdout） |
| `local_queue.py` | SQLite 断网离线队列（幂等键唯一约束） | 已实现 + 4 测试 |
| `model_manager.py` | 模型下载/校验/切换/回滚 | 占位 |
| `health_monitor.py` | CPU/温度/磁盘遥测 | 占位 |
