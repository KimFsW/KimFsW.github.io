import SwiftUI

/// Event center list (design doc 3.4): severity, reasons in text form,
/// lifecycle status, and acknowledgement actions on open alerts.
struct EventListView: View {
    @State var viewModel: EventListViewModel

    var body: some View {
        NavigationStack {
            Group {
                switch viewModel.state {
                case .idle, .loading:
                    ProgressView()
                case .failed(let message):
                    ContentUnavailableView(
                        "加载失败",
                        systemImage: "wifi.exclamationmark",
                        description: Text(message)
                    )
                case .loaded:
                    eventList
                }
            }
            .navigationTitle("风险事件")
        }
        .task { await viewModel.refresh() }
    }

    private var eventList: some View {
        List(viewModel.events) { event in
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text("[\(event.severity.rawValue)]")
                        .bold()
                        .foregroundStyle(event.severity == .l3 ? Color.red : Color.orange)
                    Text(event.type.rawValue)
                        .font(.subheadline)
                    Spacer()
                    Text(event.status.rawValue)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Text(event.reasons.joined(separator: ", "))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                if event.status == .notified || event.status == .escalated {
                    HStack {
                        Button("确认风险") {
                            Task {
                                await viewModel.acknowledge(
                                    eventID: event.id, action: .confirmRisk
                                )
                            }
                        }
                        Button("误报") {
                            Task {
                                await viewModel.acknowledge(
                                    eventID: event.id, action: .falseAlarm
                                )
                            }
                        }
                    }
                    .buttonStyle(.bordered)
                }
            }
            .padding(.vertical, 4)
        }
    }
}

#Preview {
    EventListView(viewModel: AppDIContainer.preview.makeEventListViewModel())
}
