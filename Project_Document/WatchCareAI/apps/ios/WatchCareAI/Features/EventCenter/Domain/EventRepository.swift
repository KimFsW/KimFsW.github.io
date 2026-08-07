import Foundation

public struct EventPage: Sendable {
    public let items: [RiskEvent]
    public let nextCursor: String?
}

/// Domain port (design doc 6.3 dependency inversion). Implementations live
/// in Data/: APIEventRepository (network), a SwiftData offline cache
/// (sprint 4) and MockEventRepository (previews/tests).
public protocol EventRepository: Sendable {
    func fetchEvents(
        after cursor: String?,
        limit: Int
    ) async throws -> EventPage

    func acknowledge(
        eventID: EventID,
        action: AcknowledgementAction
    ) async throws -> RiskEvent
}
