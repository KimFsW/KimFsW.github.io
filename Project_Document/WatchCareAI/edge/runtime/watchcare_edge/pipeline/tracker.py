"""AnonymousTracker: anonymous multi-person tracking (design doc 4.1).

Track ids are temporary and rotate; the system never resolves identity
and never runs face recognition (design doc 7.3).
"""
from __future__ import annotations

import itertools
from typing import List, Sequence

from watchcare_edge.domain.models import PersonDetection, PersonTrack


class AnonymousTracker:
    """TODO(sprint-3): IoU/Kalman association with occlusion grace period.
    Until then each detection becomes a fresh anonymous track so downstream
    modules can be developed against stable shapes."""

    def __init__(self) -> None:
        self._counter = itertools.count(1)

    def update(
        self, detections: Sequence[PersonDetection], timestamp_ms: int
    ) -> List[PersonTrack]:
        return [
            PersonTrack(
                track_id=f"track_{next(self._counter)}",
                box=detection.box,
                last_seen_ms=timestamp_ms,
            )
            for detection in detections
        ]
