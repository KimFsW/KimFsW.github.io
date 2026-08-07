"""Alerts module: notification orchestration and escalation.

Subscribes to RiskEventCreated, builds the notification plan per severity
(design doc 3.5), dispatches pushes via the ApnsSender port, and publishes
AlertDispatched. Never touches the events tables or camera data directly.
"""
