import Foundation

/// REST implementation of the domain port (design doc 5.2).
struct APIEventRepository: EventRepository {
    let baseURL: URL
    private let session: URLSession = .shared

    func fetchEvents(after cursor: String?, limit: Int) async throws -> EventPage {
        var components = URLComponents(
            url: baseURL.appendingPathComponent("/v1/events"),
            resolvingAgainstBaseURL: false
        )!
        var query = [URLQueryItem(name: "limit", value: String(limit))]
        if let cursor {
            query.append(URLQueryItem(name: "cursor", value: cursor))
        }
        components.queryItems = query
        let (data, _) = try await session.data(from: components.url!)
        let page = try JSONDecoder.watchCare.decode(EventPageDTO.self, from: data)
        return EventPage(items: page.items, nextCursor: page.nextCursor)
    }

    func acknowledge(
        eventID: EventID,
        action: AcknowledgementAction
    ) async throws -> RiskEvent {
        let url = baseURL.appendingPathComponent(
            "/v1/events/\(eventID)/acknowledgements"
        )
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        // TODO(sprint-2): real actor id from the Identity module session.
        request.httpBody = try JSONEncoder().encode(
            AcknowledgementRequestDTO(action: action.rawValue, actorId: "ios-guardian")
        )
        let (data, _) = try await session.data(for: request)
        return try JSONDecoder.watchCare.decode(RiskEvent.self, from: data)
    }
}

private struct EventPageDTO: Decodable {
    let items: [RiskEvent]
    let nextCursor: String?
}

private struct AcknowledgementRequestDTO: Encodable {
    let action: String
    let actorId: String
}

extension JSONDecoder {
    static var watchCare: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }
}
