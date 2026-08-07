"""Stdlib-only tests for the event lifecycle and ingest idempotency.

Run from services/api:  python -m unittest discover -s tests -v
"""
from __future__ import annotations

import sys
import unittest
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.alerts.apns import SandboxApnsSender
from app.alerts.domain import Contact
from app.alerts.service import AlertService
from app.events.domain import InvalidTransitionError, RiskEvent
from app.events.repository import InMemoryEventRepository
from app.events.service import EventService
from app.shared_kernel.domain_events import DomainEventBus
from app.shared_kernel.types import (
    AcknowledgementAction,
    EventStatus,
    Severity,
)


def make_envelope(**overrides) -> dict:
    now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
    envelope = {
        "schemaVersion": "1.0",
        "eventId": str(uuid.uuid4()),
        "edgeId": "edge_01",
        "cameraId": "camera_01",
        "careSubjectId": "subject_01",
        "type": "FALL_WITH_PROLONGED_INACTIVITY",
        "severity": "L3",
        "occurredAt": datetime.now(timezone.utc).isoformat(),
        "confidence": 0.94,
        "reasons": ["RAPID_VERTICAL_DROP", "TORSO_HORIZONTAL",
                    "NO_RECOVERY_FOR_25_SECONDS"],
        "evidence": {"keyFrameId": "frame_01", "clipId": "clip_01",
                     "privacyMode": "BLURRED_VIDEO"},
        "model": {"detectorVersion": "person-1.3.0", "poseVersion": "pose-1.1.0",
                  "riskModelVersion": "fall-0.8.0", "ruleVersion": "rules-1.2.0"},
        "idempotencyKey": f"edge_01:camera_01:{now_ms}",
    }
    envelope.update(overrides)
    return envelope


class StateMachineTest(unittest.TestCase):
    def test_happy_path_created_to_resolved(self) -> None:
        event = RiskEvent.from_envelope(make_envelope())
        event.transition(EventStatus.NOTIFIED, actor="alerts", reason="push sent")
        event.acknowledge(AcknowledgementAction.CONFIRM_RISK, actor="guardian_1")
        event.transition(EventStatus.RESOLVED, actor="guardian_1", reason="handled")
        self.assertEqual(event.status, EventStatus.RESOLVED)
        self.assertEqual(len(event.history), 3)
        self.assertEqual(event.history[0].from_status, EventStatus.CREATED)

    def test_false_alarm_goes_to_false_positive(self) -> None:
        event = RiskEvent.from_envelope(make_envelope())
        event.transition(EventStatus.NOTIFIED, actor="alerts", reason="push sent")
        event.acknowledge(AcknowledgementAction.FALSE_ALARM, actor="guardian_1")
        self.assertEqual(event.status, EventStatus.FALSE_POSITIVE)

    def test_invalid_transition_is_rejected(self) -> None:
        event = RiskEvent.from_envelope(make_envelope())
        with self.assertRaises(InvalidTransitionError):
            event.transition(EventStatus.RESOLVED, actor="x", reason="skip")
        self.assertEqual(event.status, EventStatus.CREATED)

    def test_escalated_event_can_still_be_acknowledged(self) -> None:
        event = RiskEvent.from_envelope(make_envelope())
        event.transition(EventStatus.NOTIFIED, actor="alerts", reason="push sent")
        event.transition(EventStatus.ESCALATED, actor="system", reason="timeout")
        event.acknowledge(AcknowledgementAction.HANDLING, actor="guardian_2")
        self.assertEqual(event.status, EventStatus.ACKNOWLEDGED)


class IngestAndEscalationTest(unittest.TestCase):
    def setUp(self) -> None:
        self.bus = DomainEventBus()
        self.repo = InMemoryEventRepository()
        self.events = EventService(self.repo, self.bus)
        self.sender = SandboxApnsSender()
        contacts = [
            Contact("c1", "Primary", 1, push_token="tok1"),
            Contact("c2", "Backup", 2, push_token="tok2",
                    phone_number="+85300000000"),
        ]
        self.alerts = AlertService(self.bus, self.sender, contacts)

    def test_ingest_publishes_and_marks_notified(self) -> None:
        event, created = self.events.ingest_envelope(make_envelope())
        self.assertTrue(created)
        self.assertEqual(event.status, EventStatus.NOTIFIED)
        self.assertEqual(len(self.sender.sent), 2)  # L3 pushes to both contacts

    def test_ingest_is_idempotent(self) -> None:
        envelope = make_envelope()
        first, created_first = self.events.ingest_envelope(envelope)
        second, created_second = self.events.ingest_envelope(envelope)
        self.assertTrue(created_first)
        self.assertFalse(created_second)
        self.assertIs(first, second)
        self.assertEqual(len(self.sender.sent), 2)  # no duplicate notifications

    def test_overdue_event_escalates(self) -> None:
        event, _ = self.events.ingest_envelope(make_envelope())
        future = datetime.now(timezone.utc) + timedelta(minutes=10)
        overdue = self.events.escalate_overdue(
            now=future, timeout=timedelta(minutes=5)
        )
        self.assertEqual([e.event_id for e in overdue], [event.event_id])
        self.assertEqual(event.status, EventStatus.ESCALATED)

    def test_acknowledged_event_does_not_escalate(self) -> None:
        event, _ = self.events.ingest_envelope(make_envelope())
        self.events.acknowledge(
            event.event_id, AcknowledgementAction.NO_DANGER, actor="guardian_1"
        )
        future = datetime.now(timezone.utc) + timedelta(minutes=10)
        overdue = self.events.escalate_overdue(
            now=future, timeout=timedelta(minutes=5)
        )
        self.assertEqual(overdue, [])

    def test_l1_only_pushes_primary_contact(self) -> None:
        envelope = make_envelope(severity="L1", type="DANGER_ZONE_ENTRY",
                                 idempotencyKey="edge_01:camera_01:l1-test")
        self.events.ingest_envelope(envelope)
        self.assertEqual(len(self.sender.sent), 1)
        self.assertEqual(self.sender.sent[0].device_token, "tok1")


if __name__ == "__main__":
    unittest.main()
