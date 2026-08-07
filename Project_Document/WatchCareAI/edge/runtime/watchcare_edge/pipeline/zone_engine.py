"""ZoneEngine: enter / stay / leave detection on normalized polygons.

Zone coordinates are normalized floats (design doc 3.3); the polygon test is
ray-casting with boundary counts as inside. Emits ENTER once, STAY once
after rule.trigger_after_ms, and LEAVE on exit, per track per zone.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Optional, Sequence, Tuple

from watchcare_edge.domain.models import Point2D, ZoneType


@dataclass(frozen=True)
class ZoneRule:
    trigger_after_ms: int = 1000
    severity: str = "L2"


@dataclass(frozen=True)
class Zone:
    """Matches the payload of PUT /v1/cameras/{id}/zones (design doc 3.3)."""

    zone_id: str
    camera_id: str
    type: ZoneType
    name: str
    points: Tuple[Point2D, ...]
    rule: ZoneRule = ZoneRule()
    version: int = 1

    def __post_init__(self) -> None:
        if len(self.points) < 3:
            raise ValueError("a zone polygon needs at least 3 points")


class ZoneSignalKind(str, Enum):
    ENTER = "ENTER"
    STAY = "STAY"
    LEAVE = "LEAVE"


@dataclass(frozen=True)
class ZoneSignal:
    zone_id: str
    track_id: str
    kind: ZoneSignalKind
    at_ms: int


def point_in_polygon(point: Point2D, polygon: Sequence[Point2D]) -> bool:
    """Ray-casting over normalized coordinates; boundary counts as inside."""
    x, y = point.x, point.y
    inside = False
    count = len(polygon)
    for i in range(count):
        a, b = polygon[i], polygon[(i + 1) % count]
        cross = (x - a.x) * (b.y - a.y) - (y - a.y) * (b.x - a.x)
        on_segment = (
            abs(cross) < 1e-12
            and min(a.x, b.x) - 1e-12 <= x <= max(a.x, b.x) + 1e-12
            and min(a.y, b.y) - 1e-12 <= y <= max(a.y, b.y) + 1e-12
        )
        if on_segment:
            return True
        if (a.y > y) != (b.y > y):
            x_intersect = (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x
            if x < x_intersect:
                inside = not inside
    return inside


class ZoneEngine:
    """Stateful per-(track, zone) presence tracker."""

    def __init__(self) -> None:
        # (track_id, zone_id) -> enter timestamp ms; None = STAY already sent
        self._inside_since: Dict[Tuple[str, str], Optional[int]] = {}

    def update(
        self,
        track_id: str,
        position: Point2D,
        zones: Sequence[Zone],
        at_ms: int,
    ) -> List[ZoneSignal]:
        signals: List[ZoneSignal] = []
        for zone in zones:
            if zone.type == ZoneType.IGNORE:
                continue
            key = (track_id, zone.zone_id)
            inside = point_in_polygon(position, zone.points)
            was_inside = key in self._inside_since
            if inside and not was_inside:
                self._inside_since[key] = at_ms
                signals.append(
                    ZoneSignal(zone.zone_id, track_id, ZoneSignalKind.ENTER, at_ms)
                )
            elif inside and was_inside:
                since = self._inside_since[key]
                if since is not None and at_ms - since >= zone.rule.trigger_after_ms:
                    self._inside_since[key] = None
                    signals.append(
                        ZoneSignal(zone.zone_id, track_id, ZoneSignalKind.STAY, at_ms)
                    )
            elif not inside and was_inside:
                del self._inside_since[key]
                signals.append(
                    ZoneSignal(zone.zone_id, track_id, ZoneSignalKind.LEAVE, at_ms)
                )
        return signals
