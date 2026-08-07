"""EvidenceRecorder: local ring buffer and event-window cutting.

Design doc 7.3: continuous raw video never leaves the home. Only short
event windows become evidence, and the family can disable upload entirely.
"""
from __future__ import annotations

from collections import deque
from typing import Deque

from watchcare_edge.domain.interfaces import EvidenceReference
from watchcare_edge.domain.models import VideoFrame


class EvidenceRecorder:
    def __init__(
        self, capacity: int = 300, privacy_mode: str = "BLURRED_VIDEO"
    ) -> None:
        self._buffer: Deque[VideoFrame] = deque(maxlen=capacity)
        self._privacy_mode = privacy_mode

    def record(self, frame: VideoFrame) -> None:
        self._buffer.append(frame)

    def create_evidence(self, event_window_ms: int) -> EvidenceReference:
        # TODO(sprint-3): encode the buffered window (H.264), blur per
        # privacy mode, upload via pre-signed URL from the evidence module.
        key_frame_id = self._buffer[-1].frame_id if self._buffer else None
        return EvidenceReference(
            key_frame_id=key_frame_id,
            clip_id=None,
            privacy_mode=self._privacy_mode,
        )
