"""Risk event aggregate + lifecycle state machine (design doc 4.3).

The cloud-side lifecycle starts at CREATED: CANDIDATE and VERIFIED happen on
the edge node. The full machine is defined here anyway so edge replay tools
and tests share one source of truth.

Every transition is recorded with actor / time / reason / trace id, as
required by design doc 4.3 ("所有状态变化必须记录").
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, FrozenSet, List, Mapping, Optional

from app.shared_kernel.types import (
    AcknowledgementAction,
    EventStatus,
    RiskEventType,
    Severity,
)

_ALLOWED_TRANSITIONS: Dict[EventStatus, FrozenSet[EventStatus]] = {
    EventStatus.CANDIDATE: frozenset({EventStatus.VERIFIED}),
    EventStatus.VERIFIED: frozenset({EventStatus.CREATED}),
    EventStatus.CREATED: frozenset({EventStatus.NOTIFIED}),
    EventStatus.NOTIFIED: frozenset(
        {EventStatus.ACKNOWLEDGED, EventStatus.FALSE_POSITIVE, EventStatus.ESCALATED}
    ),
    EventStatus.ACKNOWLEDGED: frozenset({EventStatus.RESOLVED}),
    EventStatus.ESCALATED: frozenset(
        {EventStatus.ACKNOWLEDGED, EventStatus.FALSE_POSITIVE}
    ),
    EventStatus.RESOLVED: frozenset(),
    EventStatus.FALSE_POSITIVE: frozenset(),
}

_ACK_OUTCOMES: Dict[AcknowledgementAction, EventStatus] = {
    AcknowledgementAction.NO_DANGER: EventStatus.ACKNOWLEDGED,
    AcknowledgementAction.CONFIRM_RISK: EventStatus.ACKNOWLEDGED,
    AcknowledgementAction.HANDLING: EventStatus.ACKNOWLEDGED,
    AcknowledgementAction.FALSE_ALARM: EventStatus.FALSE_POSITIVE,
}


class InvalidTransitionError(ValueError):
    """Raised when a status change violates the lifecycle in design doc 4.3."""


@dataclass(frozen=True)
class StateTransitionRecord:
    """Audit record for one status change (design doc 4.3)."""

    from_status: EventStatus
    to_status: EventStatus
    actor: str
    reason: str
    occurred_at: datetime
    trace_id: str = ""
    version: str = ""


def _parse_instant(raw: str) -> datetime:
    text = raw.strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    instant = datetime.fromisoformat(text)
    if instant.tzinfo is None:
        instant = instant.replace(tzinfo=timezone.utc)
    return instant


@dataclass
class RiskEvent:
    """Aggregate root for a risk event. Mirrors the contracts envelope."""

    event_id: str
    edge_id: str
    camera_id: str
    care_subject_id: str
    type: RiskEventType
    severity: Severity
    occurred_at: datetime
    confidence: float
    reasons: List[str]
    idempotency_key: str
    schema_version: str = "1.0"
    evidence: Dict[str, object] = field(default_factory=dict)
    model_versions: Dict[str, str] = field(default_factory=dict)
    status: EventStatus = EventStatus.CREATED
    history: List[StateTransitionRecord] = field(default_factory=list)

    @classmethod
    def from_envelope(cls, envelope: Mapping[str, object]) -> "RiskEvent":
        """Build an aggregate from a contracts/schemas/risk-event-envelope payload."""
        raw_occurred = envelope["occurredAt"]
        occurred_at = (
            raw_occurred if isinstance(raw_occurred, datetime)
            else _parse_instant(str(raw_occurred))
        )
        return cls(
            event_id=str(envelope["eventId"]),
            edge_id=str(envelope["edgeId"]),
            camera_id=str(envelope["cameraId"]),
            care_subject_id=str(envelope["careSubjectId"]),
            type=RiskEventType(str(envelope["type"])),
            severity=Severity(str(envelope["severity"])),
            occurred_at=occurred_at,
            confidence=float(envelope["confidence"]),  # type: ignore[arg-type]
            reasons=[str(r) for r in envelope.get("reasons", [])],  # type: ignore[union-attr]
            idempotency_key=str(envelope["idempotencyKey"]),
            schema_version=str(envelope.get("schemaVersion", "1.0")),
            evidence=dict(envelope.get("evidence", {})),  # type: ignore[arg-type]
            model_versions=dict(envelope.get("model", {})),  # type: ignore[arg-type]
        )

    def transition(
        self,
        to: EventStatus,
        *,
        actor: str,
        reason: str,
        at: Optional[datetime] = None,
        trace_id: str = "",
        version: str = "",
    ) -> StateTransitionRecord:
        at = at or datetime.now(timezone.utc)
        allowed = _ALLOWED_TRANSITIONS.get(self.status, frozenset())
        if to not in allowed:
            raise InvalidTransitionError(
                f"event {self.event_id}: {self.status.value} -> {to.value} is not allowed"
            )
        record = StateTransitionRecord(
            from_status=self.status,
            to_status=to,
            actor=actor,
            reason=reason,
            occurred_at=at,
            trace_id=trace_id,
            version=version,
        )
        self.status = to
        self.history.append(record)
        return record

    def acknowledge(
        self,
        action: AcknowledgementAction,
        *,
        actor: str,
        reason: str = "",
        at: Optional[datetime] = None,
        trace_id: str = "",
    ) -> StateTransitionRecord:
        return self.transition(
            _ACK_OUTCOMES[action],
            actor=actor,
            reason=reason or action.value,
            at=at,
            trace_id=trace_id,
        )

    @property
    def last_transition_at(self) -> Optional[datetime]:
        return self.history[-1].occurred_at if self.history else None
