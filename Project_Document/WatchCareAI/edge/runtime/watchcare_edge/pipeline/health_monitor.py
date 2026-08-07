"""HealthMonitor: CPU, temperature, disk and camera telemetry (doc 4.1).

Feeds watchcare/v1/edges/{edgeId}/telemetry; drives the CAMERA_OFFLINE and
FRAME_FROZEN risk events so families never trust a silently dead system.
"""
from __future__ import annotations

import shutil
from dataclasses import asdict, dataclass
from typing import Dict


@dataclass(frozen=True)
class Telemetry:
    cpu_percent: float
    temperature_c: float
    disk_free_bytes: int
    cameras_online: int
    cameras_total: int

    def as_payload(self) -> Dict[str, object]:
        payload = asdict(self)
        payload["schemaVersion"] = "1.0"
        return payload


class HealthMonitor:
    def sample(self, cameras_online: int = 0, cameras_total: int = 0) -> Telemetry:
        # TODO(sprint-3): psutil + platform temperature sensors.
        return Telemetry(
            cpu_percent=0.0,
            temperature_c=0.0,
            disk_free_bytes=shutil.disk_usage(".").free,
            cameras_online=cameras_online,
            cameras_total=cameras_total,
        )
