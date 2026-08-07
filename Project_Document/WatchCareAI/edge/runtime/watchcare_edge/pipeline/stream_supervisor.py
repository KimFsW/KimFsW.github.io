"""StreamSupervisor: connection, reconnect and heartbeat (design doc 4.1).

Product goal (proposal 7.1): a disconnected camera must be detected and
reported within 30 seconds - "system silently dead" is the worst failure.
"""
from __future__ import annotations

import time
from dataclasses import dataclass
from enum import Enum
from typing import Optional


class StreamState(str, Enum):
    CONNECTED = "CONNECTED"
    RECONNECTING = "RECONNECTING"
    OFFLINE = "OFFLINE"


@dataclass
class StreamHealth:
    camera_id: str
    state: StreamState
    last_frame_ms: int
    reconnect_attempts: int = 0


class StreamSupervisor:
    def __init__(self, offline_after_ms: int = 30_000) -> None:
        self._offline_after_ms = offline_after_ms

    def evaluate(
        self, health: StreamHealth, now_ms: Optional[int] = None
    ) -> StreamHealth:
        now_ms = now_ms if now_ms is not None else int(time.time() * 1000)
        if now_ms - health.last_frame_ms > self._offline_after_ms:
            health.state = StreamState.OFFLINE
        return health
