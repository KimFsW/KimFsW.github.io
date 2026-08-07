"""PersonDetector: human detection over sampled frames (design doc 4.1).

Production options: YOLO via ONNX Runtime, or Apple Vision on Mac nodes.
The stub returns no detections so pipeline wiring can be exercised first.
"""
from __future__ import annotations

from typing import List

from watchcare_edge.domain.models import PersonDetection, VideoFrame


class PersonDetector:
    def detect(self, frame: VideoFrame) -> List[PersonDetection]:
        # TODO(sprint-3): ONNX session over the letterboxed frame, NMS,
        # confidence threshold from the active rule pack.
        return []
