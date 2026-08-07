"""Edge-side event lifecycle (design doc 4.3): CANDIDATE -> VERIFIED -> CREATED.

The cloud continues the same machine from CREATED. Both sides keep their own
copy because they are separate deployables with separate dependencies
(design doc 2.5: split code, deps and tests).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, FrozenSet, List


class EdgeEventStatus(str, Enum):
    CANDIDATE = "CANDIDATE"
    VERIFIED = "VERIFIED"
    CREATED = "CREATED"      # handed to the EventSink successfully
    NOTIFIED = "NOTIFIED"    # acknowledged by the cloud ingest consumer


_ALLOWED: Dict[EdgeEventStatus, FrozenSet[EdgeEventStatus]] = {
    EdgeEventStatus.CANDIDATE: frozenset({EdgeEventStatus.VERIFIED}),
    EdgeEventStatus.VERIFIED: frozenset({EdgeEventStatus.CREATED}),
    EdgeEventStatus.CREATED: frozenset({EdgeEventStatus.NOTIFIED}),
    EdgeEventStatus.NOTIFIED: frozenset(),
}


class InvalidEdgeTransition(ValueError):
    """Raised when the edge lifecycle is violated."""


@dataclass
class EdgeEventLifecycle:
    event_id: str
    status: EdgeEventStatus = EdgeEventStatus.CANDIDATE
    trail: List[str] = field(default_factory=list)

    def transition(self, to: EdgeEventStatus) -> None:
        if to not in _ALLOWED.get(self.status, frozenset()):
            raise InvalidEdgeTransition(f"{self.status.value} -> {to.value}")
        self.trail.append(f"{self.status.value}->{to.value}")
        self.status = to
