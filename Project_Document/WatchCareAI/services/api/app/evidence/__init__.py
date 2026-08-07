"""Evidence module (stub).

Responsibility: encrypted object storage of key frames and event clips,
short-lived pre-signed download URLs, per-event deletion
(DELETE /v1/evidence/{id}), retention scheduler (family default 7 days,
design doc 7.3). Evidence upload failure must never drop event metadata
(design doc 6.2 rule 10).
"""
