import Foundation

enum QuickReplies {
  static func load() -> [String] {
    let defaults = UserDefaults(suiteName: "group.ai.a5c.adapter")
    return defaults?.stringArray(forKey: "quickReplies") ?? ["Proceed", "Need input", "Looks good"]
  }
}
