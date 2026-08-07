"""Events module: risk event aggregate, lifecycle, ingest and acknowledgement.

Owns: Event entity, EventRepository, EventService, event HTTP boundary.
Does NOT own: APNs connections, camera protocols, auth, model training.
"""
