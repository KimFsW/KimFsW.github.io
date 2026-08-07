"""Devices module (stub).

Responsibility: edge node registry, one-time pairing sessions, camera
registry, online status projection built from edge telemetry.
Owns endpoints: GET /v1/devices, POST /v1/devices/pairings, POST /v1/push-tokens.
Must NOT store camera plaintext passwords (design doc 6.2 rule 6): camera
credentials stay encrypted on the edge node.
"""
