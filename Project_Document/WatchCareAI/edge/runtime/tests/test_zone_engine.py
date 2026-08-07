"""Tests for the zone engine (design doc 3.3 / 4.1).

Run from edge/runtime:  python -m unittest discover -s tests -v
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from watchcare_edge.domain.models import Point2D, ZoneType
from watchcare_edge.pipeline.zone_engine import (
    Zone,
    ZoneEngine,
    ZoneRule,
    ZoneSignalKind,
    point_in_polygon,
)

# Balcony zone from design doc 3.3, normalized coordinates.
SQUARE = (
    Point2D(0.52, 0.20),
    Point2D(0.91, 0.20),
    Point2D(0.93, 0.88),
    Point2D(0.50, 0.87),
)


class PointInPolygonTest(unittest.TestCase):
    def test_inside(self) -> None:
        self.assertTrue(point_in_polygon(Point2D(0.7, 0.5), SQUARE))

    def test_outside(self) -> None:
        self.assertFalse(point_in_polygon(Point2D(0.1, 0.5), SQUARE))

    def test_boundary_counts_as_inside(self) -> None:
        self.assertTrue(point_in_polygon(Point2D(0.52, 0.5), SQUARE))

    def test_zone_requires_at_least_three_points(self) -> None:
        with self.assertRaises(ValueError):
            Zone(
                zone_id="bad", camera_id="cam", type=ZoneType.DANGER,
                name="bad", points=(Point2D(0.1, 0.1), Point2D(0.2, 0.2)),
            )

    def test_point_must_be_normalized(self) -> None:
        with self.assertRaises(ValueError):
            Point2D(1.5, 0.5)


class ZoneEngineTest(unittest.TestCase):
    def setUp(self) -> None:
        self.zone = Zone(
            zone_id="zone_01", camera_id="camera_01", type=ZoneType.DANGER,
            name="balcony", points=SQUARE, rule=ZoneRule(trigger_after_ms=1000),
        )
        self.engine = ZoneEngine()

    def kinds(self, signals):
        return [s.kind for s in signals]

    def test_enter_stay_leave_sequence(self) -> None:
        self.assertEqual(
            self.engine.update("t1", Point2D(0.1, 0.1), [self.zone], at_ms=0), [])
        entered = self.engine.update("t1", Point2D(0.7, 0.5), [self.zone], at_ms=100)
        self.assertEqual(self.kinds(entered), [ZoneSignalKind.ENTER])
        # Still inside but the dwell threshold (1000ms) has not passed yet.
        self.assertEqual(
            self.engine.update("t1", Point2D(0.7, 0.5), [self.zone], at_ms=900), [])
        stayed = self.engine.update("t1", Point2D(0.7, 0.5), [self.zone], at_ms=1200)
        self.assertEqual(self.kinds(stayed), [ZoneSignalKind.STAY])
        # STAY fires only once per visit.
        self.assertEqual(
            self.engine.update("t1", Point2D(0.7, 0.5), [self.zone], at_ms=2000), [])
        left = self.engine.update("t1", Point2D(0.1, 0.1), [self.zone], at_ms=2500)
        self.assertEqual(self.kinds(left), [ZoneSignalKind.LEAVE])

    def test_reentry_after_leave_resets_dwell_timer(self) -> None:
        self.engine.update("t1", Point2D(0.7, 0.5), [self.zone], at_ms=100)
        self.engine.update("t1", Point2D(0.1, 0.1), [self.zone], at_ms=200)
        reentered = self.engine.update("t1", Point2D(0.7, 0.5), [self.zone], at_ms=300)
        self.assertEqual(self.kinds(reentered), [ZoneSignalKind.ENTER])
        stayed = self.engine.update("t1", Point2D(0.7, 0.5), [self.zone], at_ms=1400)
        self.assertEqual(self.kinds(stayed), [ZoneSignalKind.STAY])

    def test_ignore_zones_produce_no_signals(self) -> None:
        ignore = Zone(
            zone_id="zone_ig", camera_id="camera_01", type=ZoneType.IGNORE,
            name="sofa", points=SQUARE,
        )
        signals = self.engine.update("t1", Point2D(0.7, 0.5), [ignore], at_ms=0)
        self.assertEqual(signals, [])


if __name__ == "__main__":
    unittest.main()
