"""FastAPI composition root (design doc 5.1).

Requires runtime deps (fastapi, pydantic, uvicorn). Domain modules stay
stdlib-only so they can be tested without installing anything.

Run: uvicorn app.main:build_app --factory --port 8000
"""
from __future__ import annotations

from fastapi import FastAPI

from app.alerts.apns import SandboxApnsSender
from app.alerts.domain import Contact
from app.alerts.service import AlertService
from app.events.repository import InMemoryEventRepository
from app.events.router import build_events_router
from app.events.service import EventService
from app.shared_kernel.domain_events import DomainEventBus


def build_app() -> FastAPI:
    bus = DomainEventBus()
    repository = InMemoryEventRepository()  # TODO(sprint-2): PostgreSQL + Alembic
    event_service = EventService(repository, bus)

    # Demo contact plan; real data comes from the contacts module (stub for now).
    contacts = [
        Contact(contact_id="contact_primary", name="Primary Guardian",
                priority=1, push_token="DEV_PUSH_TOKEN"),
        Contact(contact_id="contact_backup", name="Backup Contact",
                priority=2, push_token="DEV_PUSH_TOKEN_2",
                phone_number="+85300000000"),
    ]
    alert_service = AlertService(bus, SandboxApnsSender(), contacts)

    app = FastAPI(title="WatchCare AI API", version="0.1.0")
    app.state.event_service = event_service
    app.state.alert_service = alert_service
    app.include_router(build_events_router(event_service))

    @app.get("/healthz")
    def healthz() -> dict:
        return {"status": "ok", "version": "0.1.0"}

    return app
