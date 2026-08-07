"""TemporalAnalyzer: motion time-series features per track (design doc 4.1).

Turns raw tracks/poses into the windowed features the fall rules consume:
vertical drop speed, torso orientation, and inactivity duration.
"""
from __future__ import annotations

from watchcare_edge.domain.models import TemporalFeatures


class TemporalAnalyzer:
    """TODO(sprint-3): sliding window buffers per track. The stub returns a
    neutral feature set so the rule chain can be unit-tested in isolation."""

    def summarize(self, track_id: str, window_ms: int) -> TemporalFeatures:
        return TemporalFeatures(
            track_id=track_id,
            window_ms=window_ms,
            max_vertical_drop=0.0,
            drop_duration_ms=0,
            torso_angle_deg=0.0,
            inactivity_ms=0,
        )
