"""Event persistence ports (design doc 6.3 dependency inversion).

The domain defines the interface; PostgreSQL and in-memory implementations
live outside the domain and can be swapped freely.
"""
from __future__ import annotations

import threading
from typing import Dict, List, Optional, Protocol, Tuple

from app.events.domain import RiskEvent
from app.shared_kernel.types import EventStatus


class EventRepository(Protocol):
    def save(self, event: RiskEvent) -> None:
        ...

    def get(self, event_id: str) -> Optional[RiskEvent]:
        ...

    def get_by_idempotency_key(self, key: str) -> Optional[RiskEvent]:
        ...

    def list(
        self,
        *,
        after_cursor: Optional[str] = None,
        limit: int = 50,
        status: Optional[EventStatus] = None,
    ) -> Tuple[List[RiskEvent], Optional[str]]:
        ...


class InMemoryEventRepository:
    """Dev/test implementation. The PostgreSQL implementation lands with
    Alembic migrations in sprint 2; it must satisfy the same protocol."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._by_id: Dict[str, RiskEvent] = {}
        self._id_by_idempotency_key: Dict[str, str] = {}
        self._insertion_order: List[str] = []

    def save(self, event: RiskEvent) -> None:
        with self._lock:
            if event.event_id not in self._by_id:
                self._insertion_order.append(event.event_id)
            self._by_id[event.event_id] = event
            self._id_by_idempotency_key[event.idempotency_key] = event.event_id

    def get(self, event_id: str) -> Optional[RiskEvent]:
        return self._by_id.get(event_id)

    def get_by_idempotency_key(self, key: str) -> Optional[RiskEvent]:
        event_id = self._id_by_idempotency_key.get(key)
        return self._by_id.get(event_id) if event_id else None

    def list(
        self,
        *,
        after_cursor: Optional[str] = None,
        limit: int = 50,
        status: Optional[EventStatus] = None,
    ) -> Tuple[List[RiskEvent], Optional[str]]:
        events = [self._by_id[eid] for eid in reversed(self._insertion_order)]
        if status is not None:
            events = [e for e in events if e.status == status]
        start = int(after_cursor) if after_cursor else 0
        page = events[start:start + limit]
        next_cursor = str(start + limit) if start + limit < len(events) else None
        return page, next_cursor
