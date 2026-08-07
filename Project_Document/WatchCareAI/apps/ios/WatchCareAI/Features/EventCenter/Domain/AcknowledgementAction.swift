import Foundation

/// Guardian actions available on an alert (design doc 3.4).
public enum AcknowledgementAction: String, Codable, Sendable, CaseIterable {
    case noDanger = "NO_DANGER"
    case confirmRisk = "CONFIRM_RISK"
    case handling = "HANDLING"
    case falseAlarm = "FALSE_ALARM"
}
