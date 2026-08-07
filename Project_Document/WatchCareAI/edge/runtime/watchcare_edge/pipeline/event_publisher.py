"""EventPublisher / EventSink implementations (design doc 4.1).

StdoutEventSink for local development; HttpEventSink posts to the cloud
ingest bypass during the vertical slice; MqttEventSink is the production
path (paho-mqtt + mTLS, contracts/mqtt/topics.md).
"""
from __future__ import annotations

import json
import urllib.request
from typing import Dict

from watchcare_edge.domain.interfaces import PublishResult


class StdoutEventSink:
    def publish(self, envelope: Dict[str, object]) -> PublishResult:
        print(json.dumps(envelope, ensure_ascii=False, indent=2))
        return PublishResult(ok=True)


class HttpEventSink:
    """Vertical-slice transport: POST {api_url}/v1/events/ingest."""

    def __init__(self, api_url: str, timeout_s: float = 5.0) -> None:
        self._endpoint = api_url.rstrip("/") + "/v1/events/ingest"
        self._timeout_s = timeout_s

    def publish(self, envelope: Dict[str, object]) -> PublishResult:
        body = json.dumps(envelope).encode("utf-8")
        request = urllib.request.Request(
            self._endpoint,
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=self._timeout_s) as resp:
                return PublishResult(ok=200 <= resp.status < 300)
        except Exception as exc:  # report, never crash the capture loop
            return PublishResult(ok=False, error=str(exc))


class MqttEventSink:
    """TODO(sprint-2): paho-mqtt, per-edge client certificates, QoS 1,
    topic watchcare/v1/edges/{edgeId}/events (contracts/mqtt/topics.md)."""

    def __init__(self, edge_id: str) -> None:
        self._edge_id = edge_id

    def publish(self, envelope: Dict[str, object]) -> PublishResult:
        return PublishResult(ok=False, error="MQTT sink not implemented yet")
