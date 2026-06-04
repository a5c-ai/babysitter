import Foundation

struct WatchRunProjection: Identifiable, Equatable {
  let id: String
  let agent: String
  let status: String
  let costUsd: Double
  let hasPendingHook: Bool
}

enum WatchProjections {
  static func merge(_ current: [WatchRunProjection], incoming: [WatchRunProjection]) -> [WatchRunProjection] {
    Dictionary(uniqueKeysWithValues: (current + incoming).map { ($0.id, $0) }).values.sorted { $0.id < $1.id }
  }
}
