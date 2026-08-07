import SwiftUI

/// App entry point. The iOS app is a guardian terminal (design doc 0.2):
/// it never runs 24/7 video analysis in the background - the edge node does.
/// Even if the app is terminated, the cloud still reaches it via APNs.
@main
struct WatchCareAIApp: App {
    @State private var container = AppDIContainer.live(
        apiBaseURL: URL(string: "http://localhost:8000")!
    )

    var body: some Scene {
        WindowGroup {
            EventListView(viewModel: container.makeEventListViewModel())
                .task {
                    // TODO(sprint-2): UNUserNotificationCenter authorization,
                    // registerForRemoteNotifications, upload token via
                    // POST /v1/push-tokens.
                }
        }
    }
}
