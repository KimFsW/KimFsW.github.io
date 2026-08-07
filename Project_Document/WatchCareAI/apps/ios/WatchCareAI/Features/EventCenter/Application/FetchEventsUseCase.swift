import Foundation

/// Use case: load one page of risk events for the event center.
public struct FetchEventsUseCase: Sendable {
    private let repository: any EventRepository

    public init(repository: any EventRepository) {
        self.repository = repository
    }

    public func callAsFunction(
        after cursor: String? = nil,
        limit: Int = 50
    ) async throws -> EventPage {
        try await repository.fetchEvents(after: cursor, limit: limit)
    }
}
