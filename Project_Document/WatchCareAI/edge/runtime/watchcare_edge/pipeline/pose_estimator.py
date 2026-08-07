"""PoseEstimator: body keypoints and torso orientation (design doc 4.1).

Reference on Apple nodes: Vision VNDetectHumanBodyPoseRequest (doc 4.2).
Cross-platform: 17-keypoint model exported to ONNX from ml/export.
"""
from __future__ import annotations

from typing import List, Sequence

from watchcare_edge.domain.models import (
    PersonDetection,
    PoseObservation,
    VideoFrame,
)


class PoseEstimator:
    def estimate(
        self, frame: VideoFrame, detections: Sequence[PersonDetection]
    ) -> List[PoseObservation]:
        # TODO(sprint-3): keypoint model per detection crop; torso angle
        # derived from shoulder/hip keypoints.
        return []
