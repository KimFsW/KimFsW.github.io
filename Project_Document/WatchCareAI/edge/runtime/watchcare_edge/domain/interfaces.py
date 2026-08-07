"""Stable AI module interfaces (design doc 4.2).

Implementations may swap YOLO / Vision / PoseNet / ONNX Runtime / Core ML;
these contracts must not change when they do.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import AsyncIterator, Dict, List, Optional, Protocol, Sequence

from watchcare_edge.domain.models import (
    PersonDetection,
    PersonTrack,
    PoseObservation,
    RiskCandidate,
    VerifiedRisk,
    VideoFrame,
)


class VideoFrameSource(Protocol):
    def frames(self) -> AsyncIterator[VideoFrame]:
        ...


class HumanDetector(Protocol):
    def detect(self, frame: VideoFrame) -> List[PersonDetection]:
        ...


class PoseEstimator(Protocol):
    def estimate(
        self, frame: VideoFrame, detections: Sequence[PersonDetection]
    ) -> List[PoseObservation]:
        ...


class TrackManager(Protocol):
    def update(
        self,
        detections: Sequence[PersonDetection],
        poses: Sequence[PoseObservation],
        timestamp_ms: int,
    ) -> List[PersonTrack]:
        ...


class RiskAnalyzer(Protocol):
    def evaluate(
        self,
        tracks: Sequence[PersonTrack],
        zones: Sequence[object],
        history: Sequence[object],
    ) -> List[RiskCandidate]:
        ...


class RiskVerifier(Protocol):
    def verify(
        self, candidate: RiskCandidate, recent_frames: Sequence[VideoFrame]
    ) -> Optional[VerifiedRisk]:
        ...


@dataclass(frozen=True)
class EvidenceReference:
    key_frame_id: Optional[str]
    clip_id: Optional[str]
    privacy_mode: str


class EvidenceStore(Protocol):
    def create_evidence(self, event_window_ms: int) -> EvidenceReference:
        ...


@dataclass(frozen=True)
class PublishResult:
    ok: bool
    error: str = ""


class EventSink(Protocol):
    def publish(self, envelope: Dict[str, object]) -> PublishResult:
        ...
