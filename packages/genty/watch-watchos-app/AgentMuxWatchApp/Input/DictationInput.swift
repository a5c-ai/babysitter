import Foundation

enum DictationInput {
  static func submit(_ value: String, using handler: (String) -> Void) {
    handler(value)
  }
}
