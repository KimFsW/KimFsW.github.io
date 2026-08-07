"""Zones module (stub).

Responsibility: risk zone configuration with optimistic versioning
(design doc 3.3). Coordinates are normalized floats in [0,1]; validation
must reject degenerate polygons (< 3 points) and out-of-range values.
Owns endpoint: PUT /v1/cameras/{id}/zones. Zone changes are pushed to the
edge node via the commands MQTT topic.
"""
