"""LocalQueue: SQLite-backed offline outbox (design doc 4.1).

When the WAN link is down, events persist locally and replay in order.
The idempotencyKey UNIQUE constraint makes replays safe against duplicates.
"""
from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Union


class LocalEventQueue:
    def __init__(self, db_path: Union[str, Path]) -> None:
        self._conn = sqlite3.connect(str(db_path))
        self._conn.execute(
            """
            CREATE TABLE IF NOT EXISTS outbox (
                event_id TEXT PRIMARY KEY,
                idempotency_key TEXT UNIQUE NOT NULL,
                payload TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'PENDING',
                last_error TEXT,
                created_at TEXT NOT NULL,
                sent_at TEXT
            )
            """
        )
        self._conn.commit()

    def enqueue(self, envelope: Dict[str, object]) -> bool:
        """Returns False when the idempotency key is already stored."""
        try:
            with self._conn:
                self._conn.execute(
                    "INSERT INTO outbox (event_id, idempotency_key, payload, created_at)"
                    " VALUES (?, ?, ?, ?)",
                    (
                        str(envelope["eventId"]),
                        str(envelope["idempotencyKey"]),
                        json.dumps(envelope, ensure_ascii=False),
                        datetime.now(timezone.utc).isoformat(),
                    ),
                )
            return True
        except sqlite3.IntegrityError:
            return False

    def pending(self, limit: int = 100) -> List[Dict[str, object]]:
        cursor = self._conn.execute(
            "SELECT payload FROM outbox WHERE status = 'PENDING'"
            " ORDER BY created_at ASC LIMIT ?",
            (limit,),
        )
        return [json.loads(row[0]) for row in cursor.fetchall()]

    def mark_sent(self, event_id: str) -> None:
        with self._conn:
            self._conn.execute(
                "UPDATE outbox SET status = 'SENT', sent_at = ? WHERE event_id = ?",
                (datetime.now(timezone.utc).isoformat(), event_id),
            )

    def mark_failed(self, event_id: str, error: str) -> None:
        with self._conn:
            self._conn.execute(
                "UPDATE outbox SET last_error = ? WHERE event_id = ?",
                (error, event_id),
            )

    def pending_count(self) -> int:
        cursor = self._conn.execute(
            "SELECT COUNT(*) FROM outbox WHERE status = 'PENDING'"
        )
        return int(cursor.fetchone()[0])

    def close(self) -> None:
        self._conn.close()
