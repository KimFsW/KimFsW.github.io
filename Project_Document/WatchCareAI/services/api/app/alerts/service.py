"""Alert application service: reacts to RiskEventCreated and fans out pushes."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Sequence, Set

from app.alerts.apns import ApnsSender
from app.alerts.domain import (
    Contact,
    NotificationChannel,
    NotificationTask,
    build_notification_plan,
)
from app.shared_kernel.domain_events import (
    AlertDispatched,
    DomainEventBus,
    RiskEventCreated,
)
from app.shared_kernel.types import Severity


class AlertService:
    """Subscribes to the bus at construction; no direct coupling to events."""

    def __init__(
        self,
        bus: DomainEventBus,
        sender: ApnsSender,
        contacts: Sequence[Contact],
    ) -> None:
        self._bus = bus
        self._sender = sender
        self._contacts = list(contacts)
        self.tasks: List[NotificationTask] = []
        bus.subscribe(RiskEventCreated, self._on_event_created)

    def _on_event_created(self, message: RiskEventCreated) -> None:
        plan = build_notification_plan(
            event_id=message.event_id,
            severity=Severity(message.severity),
            event_type=message.event_type,
            reason_summary=message.reason_summary,
            contacts=self._contacts,
        )
        self.tasks.extend(plan)
        channels: Set[str] = set()
        for task in plan:
            channels.add(task.channel.value)
            if task.channel != NotificationChannel.PUSH:
                # SMS / CALL gateways are implemented in services/notification.
                continue
            contact = next(
                (c for c in self._contacts if c.contact_id == task.contact_id), None
            )
            if contact is None or not contact.push_token:
                continue
            self._sender.send_push(
                device_token=contact.push_token,
                title=task.title,
                body=task.body,
                interruption_level=task.interruption_level,
                payload={"eventId": message.event_id},
            )
        self._bus.publish(
            AlertDispatched(
                event_id=message.event_id,
                channels=tuple(sorted(channels)),
                dispatched_at=datetime.now(timezone.utc),
            )
        )
