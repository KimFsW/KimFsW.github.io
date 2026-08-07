"""Edge-side domain model (design doc 4.1/4.2).

All coordinates are normalized floats in [0, 1] (design doc 3.3) so zone
rules survive phone screen sizes, video resolutions and rotation.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, List, Mapping, Optional, Tuple


class ZoneType(str, Enum):
    DANGER = "DANGER"
    BED = "BED"
    IGNORE = "IGNORE"


class Severity(str, Enum):
    L1 = "L1"
    L2 = "L2"
    L3 = "L3"


class RiskEventType(str, Enum):
    FALL_SUSPECTED = "FALL_SUSPECTED"
    FALL_WITH_PROLONGED_INACTIVITY = "FALL_WITH_PROLONGED_INACTIVITY"
    DANGER_ZONE_ENTRY = "DANGER_ZONE_ENTRY"
    CAMERA_OFFLINE = "CAMERA_OFFLINE"
    CAMERA_OCCLUDED = "CAMERA_OCCLUDED"
    FRAME_FROZEN = "FRAME_FROZEN"


@dataclass(frozen=True)
class Point2D:
    """Normalized image coordinate, x/y in [0, 1] (design doc 3.3)."""

    x: float
    y: float

    def __post_init__(self) -> None:
        if not (0.0 <= self.x <= 1.0) or not (0.0 <= self.y <= 1.0):
            raise ValueError(f"normalized coordinates must be within [0,1]: {self}")


@dataclass(frozen=True)
class BoundingBox:
    x: float
    y: float
    w: float
    h: float

    @staticmethod
    def _clamp(value: float) -> float:
        return min(max(value, 0.0), 1.0)

    @property
    def center(self) -> Point2D:
        return Point2D(self._clamp(self.x + self.w / 2.0),
                       self._clamp(self.y + self.h / 2.0))

    @property
    def bottom_center(self) -> Point2D:
        # Feet position best approximates where a person stands or lies.
        return Point2D(self._clamp(self.x + self.w / 2.0),
                       self._clamp(self.y + self.h))


@dataclass(frozen=True)
class VideoFrame:
    frame_id: str
    source_id: str
    timestamp_ms: int
    width: int
    height: int
    # Pixels are owned by the camera adapter; the domain carries only a
    # reference so AI modules never touch decoder internals (design doc 4.2).
    pixel_ref: str = ""


@dataclass(frozen=True)
class PersonDetection:
    detection_id: str
    box: BoundingBox
    confidence: float


@dataclass(frozen=True)
class PoseObservation:
    track_id: str
    keypoints: Dict[str, Point2D]
    torso_angle_deg: float  # 0 = upright, 90 = horizontal
    timestamp_ms: int


@dataclass(frozen=True)
class PersonTrack:
    # Anonymous rotating id only; no face recognition, no identity (doc 7.3).
    track_id: str
    box: BoundingBox
    last_seen_ms: int
    age_ms: int = 0


@dataclass(frozen=True)
class TemporalFeatures:
    """Windowed motion features consumed by the fall rules."""

    track_id: str
    window_ms: int
    max_vertical_drop: float   # normalized frame height within the window
    drop_duration_ms: int
    torso_angle_deg: float
    inactivity_ms: int         # time without meaningful movement


@dataclass(frozen=True)
class RiskCandidate:
    candidate_id: str
    track_id: str
    kind: str
    confidence: float
    reasons: Tuple[str, ...]
    detected_at_ms: int


@dataclass(frozen=True)
class VerifiedRisk:
    candidate: RiskCandidate
    verified_at_ms: int
    inactivity_ms: int


def build_event_envelope(
    *,
    edge_id: str,
    camera_id: str,
    care_subject_id: str,
    event_type: RiskEventType,
    severity: Severity,
    confidence: float,
    reasons: List[str],
    evidence: Optional[Mapping[str, object]] = None,
    model_versions: Optional[Mapping[str, str]] = None,
    occurred_at: Optional[datetime] = None,
) -> Dict[str, object]:
    """Assemble a contracts/schemas/risk-event-envelope payload (doc 5.3)."""
    occurred_at = occurred_at or datetime.now(timezone.utc)
    epoch_ms = int(occurred_at.timestamp() * 1000)
    return {
        "schemaVersion": "1.0",
        "eventId": str(uuid.uuid4()),
        "edgeId": edge_id,
        "cameraId": camera_id,
        "careSubjectId": care_subject_id,
        "type": event_type.value,
        "severity": severity.value,
        "occurredAt": occurred_at.isoformat(),
        "confidence": round(confidence, 4),
        "reasons": list(reasons),
        "evidence": dict(
            evidence
            or {"keyFrameId": None, "clipId": None, "privacyMode": "NONE"}
        ),
        "model": dict(
            model_versions
            or {
                "detectorVersion": "person-sim",
                "poseVersion": "pose-sim",
                "riskModelVersion": "fall-rules-0.1.0",
                "ruleVersion": "rules-0.1.0",
            }
        ),
        # Format: {edgeId}:{cameraId}:{epochMillis}; cloud ingest dedupes on it.
        "idempotencyKey": f"{edge_id}:{camera_id}:{epoch_ms}",
    }
