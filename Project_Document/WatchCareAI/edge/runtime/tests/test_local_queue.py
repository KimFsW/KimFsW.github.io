"""Tests for the SQLite offline outbox (design doc 4.1 LocalQueue)."""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from watchcare_edge.pipeline.local_queue import LocalEventQueue


def envelope(event_id: str, key: str) -> dict:
    return {"eventId": event_id, "idempotencyKey": key, "type": "FALL_SUSPECTED"}


class LocalEventQueueTest(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.db_path = Path(self._tmp.name) / "outbox.db"
        self.queue = LocalEventQueue(self.db_path)

    def tearDown(self) -> None:
        self.queue.close()
        self._tmp.cleanup()

    def test_enqueue_and_pending_order(self) -> None:
        self.assertTrue(self.queue.enqueue(envelope("e1", "k1")))
        self.assertTrue(self.queue.enqueue(envelope("e2", "k2")))
        pending = self.queue.pending()
        self.assertEqual([p["eventId"] for p in pending], ["e1", "e2"])
        self.assertEqual(self.queue.pending_count(), 2)

    def test_duplicate_idempotency_key_is_rejected(self) -> None:
        self.assertTrue(self.queue.enqueue(envelope("e1", "k1")))
        # Same key, different event id (e.g. a retry with a regenerated uuid).
        self.assertFalse(self.queue.enqueue(envelope("e1b", "k1")))
        self.assertEqual(self.queue.pending_count(), 1)

    def test_mark_sent_removes_from_pending(self) -> None:
        self.queue.enqueue(envelope("e1", "k1"))
        self.queue.mark_sent("e1")
        self.assertEqual(self.queue.pending(), [])
        self.assertEqual(self.queue.pending_count(), 0)

    def test_queue_survives_restart(self) -> None:
        self.queue.enqueue(envelope("e1", "k1"))
        self.queue.close()
        reopened = LocalEventQueue(self.db_path)
        try:
            self.assertEqual(reopened.pending_count(), 1)
        finally:
            reopened.close()


if __name__ == "__main__":
    unittest.main()
