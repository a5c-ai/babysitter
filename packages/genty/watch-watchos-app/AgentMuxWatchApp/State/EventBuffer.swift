import Foundation

struct WatchEventNode: Identifiable, Equatable {
  let id = UUID()
  let kind: String
  let summary: String
}

struct EventBuffer {
  private(set) var nodes: [WatchEventNode] = []

  mutating func append(_ node: WatchEventNode) {
    nodes.append(node)
    if nodes.count > 100 {
      nodes.removeFirst(nodes.count - 100)
    }
  }
}
