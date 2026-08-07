import Foundation

/// Severity levels mapping to APNs interruption levels (design doc 3.5).
public enum Severity: String, Codable, Sendable {
    case l1 = "L1"
    case l2 = "L2"
    case l3 = "L3"
}

public enum RiskEventType: String, Codable, Sendable {
    case fallSuspected = "FALL_SUSPECTED"
    case fallWithProlongedInactivity = "FALL_WITH_PROLONGED_INACTIVITY"
    case dangerZoneEntry = "DANGER_ZONE_ENTRY"
    case cameraOffline = "CAMERA_OFFLINE"
    case cameraOccluded = "CAMERA_OCCLUDED"
    case frameFrozen = "FRAME_FROZEN"
}

/// Cloud-side lifecycle states (design doc 4.3).
public enum EventStatus: String, Codable, Sendable {
    case created = "CREATED"
    case notified = "NOTIFIED"
    case acknowledged = "ACKNOWLEDGED"
    case resolved = "RESOLVED"
    case falsePositive = "FALSE_POSITIVE"
    case escalated = "ESCALATED"
}

/// Mirrors contracts/schemas/risk-event-envelope.schema.json plus lifecycle
/// status. The UI must render reasons as human-readable text and never show
/// only a confidence score (design doc 3.4).
public struct RiskEvent: Identifiable, Decodable, Sendable {
    public let id: String
    public let type: RiskEventType
    public let severity: Severity
    public let status: EventStatus
    public let occurredAt: Date
    public let confidence: Double
    public let reasons: [String]

    enum CodingKeys: String, CodingKey {
        case id = "eventId"
        case type, severity, status, occurredAt, confidence, reasons
    }
}

public typealias EventID = String
