import Combine
import Foundation

final class WatchStore: ObservableObject {
  @Published var connectionState = "phone"
  @Published var runs: [WatchRunProjection] = []
  @Published var selectedRunEvents = EventBuffer()
  @Published var pendingHook: WatchHookRequest?

  func apply(runs nextRuns: [WatchRunProjection]) {
    runs = WatchProjections.merge(runs, incoming: nextRuns)
  }

  func append(event: WatchEventNode) {
    selectedRunEvents.append(event)
  }

  func resolveHook() {
    pendingHook = nil
  }
}

struct WatchHookRequest: Identifiable {
  let id: String
  let toolName: String
  let preview: String
  let secondsRemaining: Int
}
