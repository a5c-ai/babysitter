import Foundation

enum QuickReplies {
  static func load() -> [String] {
    let defaults = UserDefaults(suiteName: "group.ai.a5c.amux")
    return defaults?.stringArray(forKey: "quickReplies") ?? ["Proceed", "Need input", "Looks good"]
  }
}
