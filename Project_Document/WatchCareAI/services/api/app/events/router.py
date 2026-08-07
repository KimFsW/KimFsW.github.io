"""HTTP boundary of the events module (design doc 5.2 REST table)."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException, Response, status

from app.events.domain import InvalidTransitionError
from app.events.schemas import (
    AcknowledgementRequestDTO,
    RiskEventEnvelopeDTO,
    RiskEventResponseDTO,
)
from app.events.service import EventService
from app.shared_kernel.types import AcknowledgementAction


def build_events_router(service: EventService) -> APIRouter:
    router = APIRouter(prefix="/v1/events", tags=["events"])

    @router.post("/ingest", status_code=status.HTTP_201_CREATED)
    def ingest(envelope: RiskEventEnvelopeDTO, response: Response) -> dict:
        # Dev bypass for the vertical slice. Production ingest is the MQTT
        # consumer (contracts/mqtt/topics.md) calling the same service method.
        event, created = service.ingest_envelope(envelope.model_dump(mode="python"))
        if not created:
            response.status_code = status.HTTP_200_OK
        return {
            "eventId": event.event_id,
            "created": created,
            "status": event.status.value,
        }

    @router.get("")
    def list_events(cursor: Optional[str] = None, limit: int = 50) -> dict:
        events, next_cursor = service.list_events(after_cursor=cursor, limit=limit)
        return {
            "items": [RiskEventResponseDTO.from_domain(e) for e in events],
            "nextCursor": next_cursor,
        }

    @router.get("/{event_id}")
    def get_event(event_id: str) -> RiskEventResponseDTO:
        try:
            return RiskEventResponseDTO.from_domain(service.get_event(event_id))
        except KeyError:
            raise HTTPException(status_code=404, detail="event not found")

    @router.post("/{event_id}/acknowledgements")
    def acknowledge(
        event_id: str, request: AcknowledgementRequestDTO
    ) -> RiskEventResponseDTO:
        try:
            action = AcknowledgementAction(request.action)
        except ValueError:
            raise HTTPException(
                status_code=422, detail=f"unknown action: {request.action}"
            )
        try:
            event = service.acknowledge(
                event_id, action, actor=request.actorId, reason=request.reason
            )
        except KeyError:
            raise HTTPException(status_code=404, detail="event not found")
        except InvalidTransitionError as exc:
            raise HTTPException(status_code=409, detail=str(exc))
        return RiskEventResponseDTO.from_domain(event)

    return router
