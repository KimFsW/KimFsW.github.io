"""In-process domain event bus.

Modules never call each other across boundaries (design doc 5.1):
`events` publishes RiskEventCreated; `alerts` subscribes and orchestrates
notifications, then publishes AlertDispatched so `events` can advance the
lifecycle to NOTIFIED. In production this can be swapped for an
outbox table + worker without touching module internals.
"""
from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from typing import Callable, DefaultDict, List, Tuple


@dataclass(frozen=True)
class RiskEventCreated:
    """Published by the events module right after a new event is stored."""

    event_id: str
    event_type: str
    severity: str
    care_subject_id: str
    occurred_at: datetime
    reason_summary: str


@dataclass(frozen=True)
class AlertDispatched:
    """Published by the alerts module after a notification plan was executed."""

    event_id: str
    channels: Tuple[str, ...]
    dispatched_at: datetime


class DomainEventBus:
    """Synchronous pub/sub. Handlers run in publish order, exceptions propagate."""

    def __init__(self) -> None:
        self._handlers: DefaultDict[type, List[Callable[[object], None]]] = defaultdict(list)

    def subscribe(self, event_type: type, handler: Callable[[object], None]) -> None:
        self._handlers[event_type].append(handler)

    def publish(self, event: object) -> None:
        for handler in list(self._handlers.get(type(event), [])):
            handler(event)
