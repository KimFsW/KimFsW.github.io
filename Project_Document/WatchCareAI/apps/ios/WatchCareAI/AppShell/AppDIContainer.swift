import Foundation

/// Composition root (design doc 3.1 AppShell): owns long-lived dependencies
/// and chooses between API and mock implementations.
@Observable
final class AppDIContainer {
    let eventRepository: any EventRepository

    init(eventRepository: any EventRepository) {
        self.eventRepository = eventRepository
    }

    static func live(apiBaseURL: URL) -> AppDIContainer {
        AppDIContainer(eventRepository: APIEventRepository(baseURL: apiBaseURL))
    }

    /// SwiftUI previews and simulator-first development without a cloud.
    static var preview: AppDIContainer {
        AppDIContainer(eventRepository: MockEventRepository())
    }

    func makeEventListViewModel() -> EventListViewModel {
        EventListViewModel(
            fetchEvents: FetchEventsUseCase(repository: eventRepository),
            acknowledge: AcknowledgeEventUseCase(repository: eventRepository)
        )
    }
}
