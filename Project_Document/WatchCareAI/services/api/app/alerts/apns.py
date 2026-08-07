"""APNs sender port + development implementation.

The production client (HTTP/2, token-based auth, sandbox/prod environments)
lives in services/notification. The port is frozen here so the vertical
slice runs end to end without Apple credentials.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Protocol

from app.alerts.domain import InterruptionLevel


class ApnsSender(Protocol):
    def send_push(
        self,
        *,
        device_token: str,
        title: str,
        body: str,
        interruption_level: InterruptionLevel,
        payload: Optional[Dict[str, object]] = None,
    ) -> str:
        """Send one push notification; returns the provider message id."""
        ...


@dataclass(frozen=True)
class SentPush:
    message_id: str
    device_token: str
    title: str
    body: str
    interruption_level: InterruptionLevel


@dataclass
class SandboxApnsSender:
    """Dev stand-in: records messages instead of sending them."""

    sent: List[SentPush] = field(default_factory=list)

    def send_push(
        self,
        *,
        device_token: str,
        title: str,
        body: str,
        interruption_level: InterruptionLevel,
        payload: Optional[Dict[str, object]] = None,
    ) -> str:
        message_id = str(uuid.uuid4())
        self.sent.append(
            SentPush(message_id, device_token, title, body, interruption_level)
        )
        return message_id
