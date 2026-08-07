"""FallCandidateEngine: rule-based fall candidate generation.

Design doc section 12 rule 9: a single-frame model result must never fire
the top alert. These heuristics only produce CANDIDATEs for the
RiskVerifier; the learned temporal model lands in sprint 3 via ml/export.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import List, Optional

from watchcare_edge.domain.models import RiskCandidate, TemporalFeatures


@dataclass(frozen=True)
class FallRuleThresholds:
    min_vertical_drop: float = 0.35    # normalized frame height
    max_drop_duration_ms: int = 800
    min_torso_angle_deg: float = 60.0  # near-horizontal torso


class FallCandidateEngine:
    def __init__(
        self, thresholds: FallRuleThresholds = FallRuleThresholds()
    ) -> None:
        self._thresholds = thresholds

    def evaluate(
        self, features: TemporalFeatures, detected_at_ms: int
    ) -> Optional[RiskCandidate]:
        reasons: List[str] = []
        if (
            features.max_vertical_drop >= self._thresholds.min_vertical_drop
            and features.drop_duration_ms <= self._thresholds.max_drop_duration_ms
        ):
            reasons.append("RAPID_VERTICAL_DROP")
        if features.torso_angle_deg >= self._thresholds.min_torso_angle_deg:
            reasons.append("TORSO_HORIZONTAL")
        if not reasons:
            return None
        confidence = min(0.5 + 0.25 * len(reasons), 0.99)
        return RiskCandidate(
            candidate_id=str(uuid.uuid4()),
            track_id=features.track_id,
            kind="FALL_SUSPECTED",
            confidence=confidence,
            reasons=tuple(reasons),
            detected_at_ms=detected_at_ms,
        )
