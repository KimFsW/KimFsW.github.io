"""Tests for the severity -> notification plan mapping (design doc 3.5)."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.alerts.domain import (
    Contact,
    InterruptionLevel,
    NotificationChannel,
    build_notification_plan,
)
from app.shared_kernel.types import Severity

CONTACTS = [
    Contact("c1", "Primary", 1, push_token="tok1"),
    Contact("c2", "Backup", 2, push_token="tok2", phone_number="+85311111111"),
]


def plan(severity: Severity):
    return build_notification_plan(
        event_id="evt",
        severity=severity,
        event_type="FALL_SUSPECTED",
        reason_summary="RAPID_VERTICAL_DROP",
        contacts=CONTACTS,
    )


class NotificationPlanTest(unittest.TestCase):
    def test_l1_is_single_active_push(self) -> None:
        tasks = plan(Severity.L1)
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0].channel, NotificationChannel.PUSH)
        self.assertEqual(tasks[0].interruption_level, InterruptionLevel.ACTIVE)
        self.assertFalse(tasks[0].requires_ack)

    def test_l2_is_time_sensitive_and_requires_ack(self) -> None:
        tasks = plan(Severity.L2)
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0].interruption_level, InterruptionLevel.TIME_SENSITIVE)
        self.assertTrue(tasks[0].requires_ack)

    def test_l3_fans_out_and_escalates_by_sms(self) -> None:
        tasks = plan(Severity.L3)
        pushes = [t for t in tasks if t.channel == NotificationChannel.PUSH]
        sms = [t for t in tasks if t.channel == NotificationChannel.SMS]
        self.assertEqual(len(pushes), 2)       # all contacts
        self.assertEqual(len(sms), 1)          # backup contact only
        self.assertEqual(sms[0].contact_id, "c2")

    def test_l1_without_contacts_produces_no_tasks(self) -> None:
        tasks = build_notification_plan(
            event_id="evt", severity=Severity.L1, event_type="X",
            reason_summary="", contacts=[],
        )
        self.assertEqual(tasks, [])


if __name__ == "__main__":
    unittest.main()
