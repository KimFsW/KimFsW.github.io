"""CameraAdapter: hides RTSP/ONVIF/USB differences behind one frame stream.

Production: FFmpeg or OpenCV decode per camera, with credentials read from
the edge node's encrypted store (never from the cloud, design doc 7.1).
Stubbed for the vertical slice - the simulator needs no real video.
"""
from __future__ import annotations

from typing import AsyncIterator

from watchcare_edge.domain.models import VideoFrame


class RtspCameraAdapter:
    """TODO(sprint-3): FFmpeg decode loop, TCP transport, keyframe-aligned start."""

    def __init__(self, rtsp_url: str, *, transport: str = "tcp") -> None:
        self._rtsp_url = rtsp_url
        self._transport = transport

    async def frames(self) -> AsyncIterator[VideoFrame]:
        raise NotImplementedError(
            "RTSP decode lands with edge/camera-adapters in sprint 3"
        )
        yield  # pragma: no cover - keeps this an async generator
