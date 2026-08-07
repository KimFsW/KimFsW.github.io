import Foundation

/// Previews, UI tests and simulator-first development (design doc 8.3):
/// lets the whole UI run before any cloud or camera exists.
struct MockEventRepository: EventRepository {
    var stored: [RiskEvent] = [
        RiskEvent(
            id: "evt_mock_1",
            type: .fallWithProlongedInactivity,
            severity: .l3,
            status: .notified,
            occurredAt: Date(),
            confidence: 0.94,
            reasons: ["RAPID_VERTICAL_DROP", "TORSO_HORIZONTAL",
                      "NO_RECOVERY_FOR_25_SECONDS"]
        ),
        RiskEvent(
            id: "evt_mock_2",
            type: .dangerZoneEntry,
            severity: .l1,
            status: .resolved,
            occurredAt: Date().addingTimeInterval(-3600),
            confidence: 0.88,
            reasons: ["ENTERED_DANGER_ZONE"]
        ),
    ]

    func fetchEvents(after cursor: String?, limit: Int) async throws -> EventPage {
        EventPage(items: stored, nextCursor: nil)
    }

    func acknowledge(
        eventID: EventID,
        action: AcknowledgementAction
    ) async throws -> RiskEvent {
        guard let event = stored.first(where: { $0.id == eventID }) else {
            throw CocoaError(.coderValueNotFound)
        }
        // Mirrors the cloud mapping: FALSE_ALARM -> FALSE_POSITIVE, else ACKNOWLEDGED.
        return RiskEvent(
            id: event.id,
            type: event.type,
            severity: event.severity,
            status: action == .falseAlarm ? .falsePositive : .acknowledged,
            occurredAt: event.occurredAt,
            confidence: event.confidence,
            reasons: event.reasons
        )
    }
}
