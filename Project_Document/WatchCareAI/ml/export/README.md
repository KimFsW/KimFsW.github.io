# ml/export（占位）

模型导出：PyTorch → ONNX（通用边缘节点）与 Core ML（Apple 节点）。
导出产物进入 `edge/inference/`，包格式遵循设计方案 11.3：
模型 ID、版本、哈希、IO 规格、训练数据版本、分层评估结果、
已知失败场景、最低硬件、推理耗时、回滚版本。
