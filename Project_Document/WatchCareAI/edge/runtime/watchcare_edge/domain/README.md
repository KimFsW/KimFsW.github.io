# domain/ 边缘领域层

纯标准库、框架无关；AI 引擎（YOLO / Vision / ONNX / Core ML）只能实现这里的协议，不得反向侵入（设计方案 4.2）。

| 文件 | 作用 |
|---|---|
| `models.py` | 值对象：`Point2D`（归一化坐标）、`BoundingBox`、`VideoFrame`、`PersonDetection`、`PoseObservation`、`PersonTrack`、`TemporalFeatures`、`RiskCandidate`、`VerifiedRisk`，以及 `build_event_envelope`（生成符合 contracts 的事件信封） |
| `interfaces.py` | AI 模块稳定接口：`VideoFrameSource`、`HumanDetector`、`PoseEstimator`、`TrackManager`、`RiskAnalyzer`、`RiskVerifier`、`EvidenceStore`、`EventSink` |
| `state_machine.py` | 边缘侧事件生命周期：CANDIDATE→VERIFIED→CREATED→NOTIFIED |
