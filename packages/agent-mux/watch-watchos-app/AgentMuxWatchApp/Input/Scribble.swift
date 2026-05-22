import Foundation

enum ScribbleInput {
  static func submit(_ value: String, using handler: (String) -> Void) {
    handler(value)
  }
}
