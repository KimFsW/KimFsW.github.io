"""Shared domain vocabulary.

Design doc refs: 3.5 (severity levels), 4.3 (event lifecycle),
5.3 (envelope enumerations). Pure stdlib, framework-free.
"""
from __future__ import annotations

from enum import Enum


class Severity(str, Enum):
    """Risk severity; maps to APNs interruption levels (design doc 3.5)."""

    L1 = "L1"  # notice -> Active push
    L2 = "L2"  # high risk -> Time Sensitive, acknowledgement required
    L3 = "L3"  # urgent -> multi-contact push + SMS/call escalation


class RiskEventType(str, Enum):
    """MVP scope from design doc 0 (first version)."""

    FALL_SUSPECTED = "FALL_SUSPECTED"
    FALL_WITH_PROLONGED_INACTIVITY = "FALL_WITH_PROLONGED_INACTIVITY"
    DANGER_ZONE_ENTRY = "DANGER_ZONE_ENTRY"
    CAMERA_OFFLINE = "CAMERA_OFFLINE"
    CAMERA_OCCLUDED = "CAMERA_OCCLUDED"
    FRAME_FROZEN = "FRAME_FROZEN"


class EventStatus(str, Enum):
    """Lifecycle states from design doc 4.3."""

    CANDIDATE = "CANDIDATE"
    VERIFIED = "VERIFIED"
    CREATED = "CREATED"
    NOTIFIED = "NOTIFIED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"
    FALSE_POSITIVE = "FALSE_POSITIVE"
    ESCALATED = "ESCALATED"


class AcknowledgementAction(str, Enum):
    """Guardian actions available in the alert UI (design doc 3.4)."""

    NO_DANGER = "NO_DANGER"
    CONFIRM_RISK = "CONFIRM_RISK"
    HANDLING = "HANDLING"
    FALSE_ALARM = "FALSE_ALARM"


class PrivacyMode(str, Enum):
    """Evidence privacy modes from design doc 7.3."""

    NONE = "NONE"
    KEYPOINTS_ONLY = "KEYPOINTS_ONLY"
    BLURRED_VIDEO = "BLURRED_VIDEO"
    FULL_VIDEO = "FULL_VIDEO"
