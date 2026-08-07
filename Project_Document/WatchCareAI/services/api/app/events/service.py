"""Event application service: idempotent ingest, acknowledgement, escalation."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import List, Mapping, Optional, Tuple

from app.events.domain import RiskEvent
from app.events.repository import EventRepository
from app.shared_kernel.domain_events import (
    AlertDispatched,
    DomainEventBus,
    RiskEventCreated,
)
from app.shared_kernel.types import AcknowledgementAction, EventStatus

DEFAULT_ESCALATION_TIMEOUT = timedelta(minutes=5)


class EventService:
    """Use cases of the events module. Wired to the bus at construction."""

    def __init__(self, repository: EventRepository, bus: DomainEventBus) -> None:
        self._repository = repository
        self._bus = bus
        bus.subscribe(AlertDispatched, self._on_alert_dispatched)

    def ingest_envelope(
        self,
        envelope: Mapping[str, object],
        *,
        actor: str = "edge",
    ) -> Tuple[RiskEvent, bool]:
        """Idempotent ingest (design doc 5.2: server must support idempotency).

        Returns (event, created_new). A duplicate idempotencyKey returns the
        previously stored event with created_new=False and publishes nothing.
        """
        key = str(envelope["idempotencyKey"])
        existing = self._repository.get_by_idempotency_key(key)
        if existing is not None:
            return existing, False
        event = RiskEvent.from_envelope(envelope)
        self._repository.save(event)
        self._bus.publish(
            RiskEventCreated(
                event_id=event.event_id,
                event_type=event.type.value,
                severity=event.severity.value,
                care_subject_id=event.care_subject_id,
                occurred_at=event.occurred_at,
                reason_summary=", ".join(event.reasons),
            )
        )
        return event, True

    def get_event(self, event_id: str) -> RiskEvent:
        return self._require(event_id)

    def list_events(
        self,
        *,
        after_cursor: Optional[str] = None,
        limit: int = 50,
        status: Optional[EventStatus] = None,
    ) -> Tuple[List[RiskEvent], Optional[str]]:
        return self._repository.list(after_cursor=after_cursor, limit=limit, status=status)

    def acknowledge(
        self,
        event_id: str,
        action: AcknowledgementAction,
        *,
        actor: str,
        reason: str = "",
        at: Optional[datetime] = None,
    ) -> RiskEvent:
        event = self._require(event_id)
        event.acknowledge(action, actor=actor, reason=reason, at=at)
        self._repository.save(event)
        return event

    def resolve(self, event_id: str, *, actor: str, reason: str = "resolved") -> RiskEvent:
        event = self._require(event_id)
        event.transition(EventStatus.RESOLVED, actor=actor, reason=reason)
        self._repository.save(event)
        return event

    def escalate_overdue(
        self,
        *,
        now: Optional[datetime] = None,
        timeout: timedelta = DEFAULT_ESCALATION_TIMEOUT,
    ) -> List[RiskEvent]:
        """NOTIFIED events with no ack past the timeout become ESCALATED (4.3)."""
        now = now or datetime.now(timezone.utc)
        overdue: List[RiskEvent] = []
        notified, _ = self._repository.list(status=EventStatus.NOTIFIED, limit=1000)
        for event in notified:
            notified_at = event.last_transition_at
            if notified_at is not None and now - notified_at >= timeout:
                event.transition(
                    EventStatus.ESCALATED,
                    actor="system",
                    reason="acknowledgement timeout",
                    at=now,
                )
                self._repository.save(event)
                overdue.append(event)
        return overdue

    def _on_alert_dispatched(self, message: AlertDispatched) -> None:
        event = self._repository.get(message.event_id)
        if event is None or event.status != EventStatus.CREATED:
            return
        event.transition(
            EventStatus.NOTIFIED,
            actor="alerts",
            reason="dispatched via " + ",".join(message.channels),
            at=message.dispatched_at,
        )
        self._repository.save(event)

    def _require(self, event_id: str) -> RiskEvent:
        event = self._repository.get(event_id)
        if event is None:
            raise KeyError(f"unknown event: {event_id}")
        return event
