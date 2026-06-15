import SwiftUI

struct ThinkingRow: View {
  let summary: String

  var body: some View {
    DisclosureGroup("Thinking") {
      Text(summary).font(.caption2)
    }
  }
}
