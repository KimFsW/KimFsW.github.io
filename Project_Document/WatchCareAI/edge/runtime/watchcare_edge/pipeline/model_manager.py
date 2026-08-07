"""ModelManager: download, verify, switch and roll back models (doc 11.3).

Models are never overwritten in place: download -> hash verify -> shadow
run -> small-percentage rollout -> full release -> monitored rollback.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class ModelPackage:
    model_id: str
    version: str
    sha256: str
    min_hardware: str = ""
    rollback_version: str = ""


@dataclass(frozen=True)
class ActiveModel:
    package: ModelPackage


class ModelManager:
    """TODO(sprint-3): pull packages announced on the commands MQTT topic,
    verify hashes, activate atomically, report to the model-status topic."""

    def __init__(self) -> None:
        self._active: Optional[ActiveModel] = None

    @property
    def active(self) -> Optional[ActiveModel]:
        return self._active
