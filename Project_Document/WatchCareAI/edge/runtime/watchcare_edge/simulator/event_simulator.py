"""Event simulator: the first half of the vertical slice (design doc 8.3).

Runs the real rule chain (TemporalFeatures -> FallCandidateEngine ->
RiskVerifier) with fall-like features and wraps the result into a contracts
envelope, so cloud, alerts and iOS can be built before any camera exists.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List

from watchcare_edge.domain.models import (
    RiskEventType,
    Severity,
    TemporalFeatures,
    build_event_envelope,
)
from watchcare_edge.pipeline.fall_candidate import FallCandidateEngine
from watchcare_edge.pipeline.risk_verifier import RiskVerifier


def build_simulated_envelope(
    *,
    edge_id: str = "edge_sim_01",
    camera_id: str = "camera_sim_01",
    care_subject_id: str = "subject_sim_01",
    inactivity_s: int = 25,
) -> Dict[str, object]:
    """Simulate: rapid drop + horizontal torso + no recovery for N seconds."""
    features = TemporalFeatures(
        track_id="track_sim_1",
        window_ms=5_000,
        max_vertical_drop=0.52,
        drop_duration_ms=420,
        torso_angle_deg=78.0,
        inactivity_ms=inactivity_s * 1000,
    )
    now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
    candidate = FallCandidateEngine().evaluate(features, detected_at_ms=now_ms)
    if candidate is None:
        raise RuntimeError("simulated features should always produce a candidate")
    verified = RiskVerifier().verify(candidate, features, verified_at_ms=now_ms)
    if verified is None:
        raise RuntimeError("simulated features should always verify")

    reasons: List[str] = list(candidate.reasons)
    reasons.append(f"NO_RECOVERY_FOR_{inactivity_s}_SECONDS")
    return build_event_envelope(
        edge_id=edge_id,
        camera_id=camera_id,
        care_subject_id=care_subject_id,
        event_type=RiskEventType.FALL_WITH_PROLONGED_INACTIVITY,
        severity=Severity.L3,
        confidence=0.94,
        reasons=reasons,
        evidence={
            "keyFrameId": "frame_sim_01",
            "clipId": "clip_sim_01",
            "privacyMode": "BLURRED_VIDEO",
        },
        occurred_at=datetime.now(timezone.utc),
    )
