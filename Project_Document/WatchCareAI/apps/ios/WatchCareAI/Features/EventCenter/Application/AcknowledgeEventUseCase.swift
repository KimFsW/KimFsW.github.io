import Foundation

/// Use case: acknowledge or dismiss an alert; drives the cloud-side event
/// state machine (design doc 4.3).
public struct AcknowledgeEventUseCase: Sendable {
    private let repository: any EventRepository

    public init(repository: any EventRepository) {
        self.repository = repository
    }

    public func callAsFunction(
        eventID: EventID,
        action: AcknowledgementAction
    ) async throws -> RiskEvent {
        try await repository.acknowledge(eventID: eventID, action: action)
    }
}
