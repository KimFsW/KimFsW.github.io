"""Alert orchestration policy (design doc 3.5).

Severity mapping:
  L1 -> primary contact only, Active push, no ack required
  L2 -> primary contact, Time Sensitive push, acknowledgement required
  L3 -> all contacts Time Sensitive push + SMS escalation for backup contacts

Critical Alerts (breaking the mute switch) need a separate Apple entitlement
and are intentionally NOT part of the MVP mapping.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional, Sequence

from app.shared_kernel.types import Severity


class NotificationChannel(str, Enum):
    PUSH = "PUSH"
    SMS = "SMS"
    CALL = "CALL"


class InterruptionLevel(str, Enum):
    ACTIVE = "ACTIVE"
    TIME_SENSITIVE = "TIME_SENSITIVE"


@dataclass(frozen=True)
class Contact:
    """One entry of the escalation plan (design doc 3.1 ContactPlan)."""

    contact_id: str
    name: str
    priority: int  # 1 = primary guardian; higher numbers are backups
    push_token: Optional[str] = None
    phone_number: Optional[str] = None


@dataclass(frozen=True)
class NotificationTask:
    task_id: str
    event_id: str
    contact_id: str
    channel: NotificationChannel
    interruption_level: InterruptionLevel
    requires_ack: bool
    title: str
    body: str


def build_notification_plan(
    *,
    event_id: str,
    severity: Severity,
    event_type: str,
    reason_summary: str,
    contacts: Sequence[Contact],
) -> List[NotificationTask]:
    ordered = sorted(contacts, key=lambda c: c.priority)
    primary = ordered[0] if ordered else None
    tasks: List[NotificationTask] = []

    def push(contact: Contact, level: InterruptionLevel, requires_ack: bool) -> NotificationTask:
        return NotificationTask(
            task_id=str(uuid.uuid4()),
            event_id=event_id,
            contact_id=contact.contact_id,
            channel=NotificationChannel.PUSH,
            interruption_level=level,
            requires_ack=requires_ack,
            title=f"[{severity.value}] {event_type}",
            body=reason_summary,
        )

    if severity == Severity.L1:
        if primary is not None:
            tasks.append(push(primary, InterruptionLevel.ACTIVE, requires_ack=False))
    elif severity == Severity.L2:
        if primary is not None:
            tasks.append(push(primary, InterruptionLevel.TIME_SENSITIVE, requires_ack=True))
    else:  # L3
        for contact in ordered:
            tasks.append(push(contact, InterruptionLevel.TIME_SENSITIVE, requires_ack=True))
        for backup in ordered[1:]:
            if backup.phone_number:
                tasks.append(
                    NotificationTask(
                        task_id=str(uuid.uuid4()),
                        event_id=event_id,
                        contact_id=backup.contact_id,
                        channel=NotificationChannel.SMS,
                        interruption_level=InterruptionLevel.TIME_SENSITIVE,
                        requires_ack=True,
                        title=f"[L3] {event_type}",
                        body=reason_summary,
                    )
                )
    return tasks
