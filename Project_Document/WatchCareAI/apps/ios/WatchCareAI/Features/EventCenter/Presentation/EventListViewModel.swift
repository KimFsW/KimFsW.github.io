import Foundation

@Observable
@MainActor
final class EventListViewModel {
    enum LoadState: Equatable {
        case idle
        case loading
        case loaded
        case failed(String)
    }

    private(set) var events: [RiskEvent] = []
    private(set) var state: LoadState = .idle

    private let fetchEvents: FetchEventsUseCase
    private let acknowledgeEvent: AcknowledgeEventUseCase

    init(fetchEvents: FetchEventsUseCase,
         acknowledge: AcknowledgeEventUseCase) {
        self.fetchEvents = fetchEvents
        self.acknowledgeEvent = acknowledge
    }

    func refresh() async {
        state = .loading
        do {
            let page = try await fetchEvents()
            events = page.items
            state = .loaded
        } catch {
            state = .failed(error.localizedDescription)
        }
    }

    func acknowledge(eventID: EventID, action: AcknowledgementAction) async {
        do {
            let updated = try await acknowledgeEvent(eventID: eventID, action: action)
            if let index = events.firstIndex(where: { $0.id == eventID }) {
                events[index] = updated
            }
        } catch {
            state = .failed(error.localizedDescription)
        }
    }
}
