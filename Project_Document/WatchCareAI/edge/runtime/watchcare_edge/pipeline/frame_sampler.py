"""FrameSampler: dynamic sampling and resolution control (design doc 4.1).

Keeps inference cost bounded on weak hardware. Motion-adaptive sampling
(raise fps while a person moves fast) is a sprint-3 refinement.
"""
from __future__ import annotations

from typing import Optional


class FrameSampler:
    def __init__(self, target_fps: float = 10.0) -> None:
        if target_fps <= 0:
            raise ValueError("target_fps must be positive")
        self._min_interval_ms = 1000.0 / target_fps
        self._last_emit_ms: Optional[float] = None

    def should_sample(self, timestamp_ms: float) -> bool:
        if self._last_emit_ms is None:
            self._last_emit_ms = timestamp_ms
            return True
        if timestamp_ms - self._last_emit_ms >= self._min_interval_ms:
            self._last_emit_ms = timestamp_ms
            return True
        return False
