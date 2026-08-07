# inference（占位）

推理引擎封装：ONNX Runtime（通用）与 Core ML（Apple 节点）。
模型由 `ml/export/` 产出，包格式与校验规则见设计方案 11.3：
模型 ID、版本、文件哈希、IO 规格、训练数据版本、分层评估、已知失败场景、
最低硬件、推理耗时、回滚版本。
