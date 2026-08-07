"""Pydantic DTOs for the HTTP boundary.

The domain layer stays dataclass-based and dependency-free; these models
exist only for request validation and OpenAPI generation. They mirror
contracts/schemas/risk-event-envelope.schema.json.
"""
from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field

from app.events.domain import RiskEvent


class EvidenceRefDTO(BaseModel):
    keyFrameId: Optional[str] = None
    clipId: Optional[str] = None
    privacyMode: str = "NONE"


class ModelVersionsDTO(BaseModel):
    detectorVersion: str = ""
    poseVersion: str = ""
    riskModelVersion: str = ""
    ruleVersion: str = ""


class RiskEventEnvelopeDTO(BaseModel):
    """Inbound envelope; field names match the contracts JSON Schema exactly."""

    schemaVersion: str = "1.0"
    eventId: str
    edgeId: str
    cameraId: str
    careSubjectId: str
    type: str
    severity: str
    occurredAt: datetime
    confidence: float = Field(ge=0.0, le=1.0)
    reasons: List[str] = Field(min_length=1)
    evidence: EvidenceRefDTO = EvidenceRefDTO()
    model: ModelVersionsDTO = ModelVersionsDTO()
    idempotencyKey: str


class AcknowledgementRequestDTO(BaseModel):
    action: str
    actorId: str
    reason: str = ""


class StateTransitionDTO(BaseModel):
    fromStatus: str
    toStatus: str
    actor: str
    reason: str
    occurredAt: datetime


class RiskEventResponseDTO(BaseModel):
    eventId: str
    type: str
    severity: str
    status: str
    occurredAt: datetime
    confidence: float
    reasons: List[str]
    evidence: Dict[str, object]
    model: Dict[str, str]
    history: List[StateTransitionDTO]

    @classmethod
    def from_domain(cls, event: RiskEvent) -> "RiskEventResponseDTO":
        return cls(
            eventId=event.event_id,
            type=event.type.value,
            severity=event.severity.value,
            status=event.status.value,
            occurredAt=event.occurred_at,
            confidence=event.confidence,
            reasons=event.reasons,
            evidence=event.evidence,
            model=event.model_versions,
            history=[
                StateTransitionDTO(
                    fromStatus=h.from_status.value,
                    toStatus=h.to_status.value,
                    actor=h.actor,
                    reason=h.reason,
                    occurredAt=h.occurred_at,
                )
                for h in event.history
            ],
        )
