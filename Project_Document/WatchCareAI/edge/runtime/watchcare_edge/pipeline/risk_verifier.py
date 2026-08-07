"""RiskVerifier: second-stage review and inactivity timing (design doc 4.1).

A candidate only becomes a VerifiedRisk after the person stays inactive for
min_inactivity_ms - this is what turns "someone fell" into "someone fell and
did not get back up" (FALL_WITH_PROLONGED_INACTIVITY, severity L3). The
threshold is user-configurable (proposal 6.1 P0).
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from watchcare_edge.domain.models import (
    RiskCandidate,
    TemporalFeatures,
    VerifiedRisk,
)


@dataclass(frozen=True)
class VerificationRule:
    min_inactivity_ms: int = 20_000


class RiskVerifier:
    def __init__(self, rule: VerificationRule = VerificationRule()) -> None:
        self._rule = rule

    def verify(
        self,
        candidate: RiskCandidate,
        features: TemporalFeatures,
        verified_at_ms: int,
    ) -> Optional[VerifiedRisk]:
        if features.inactivity_ms < self._rule.min_inactivity_ms:
            return None
        return VerifiedRisk(
            candidate=candidate,
            verified_at_ms=verified_at_ms,
            inactivity_ms=features.inactivity_ms,
        )
