import SwiftUI

struct ToolCallRow: View {
  let title: String
  let summary: String

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text(title).font(.caption).bold()
      Text(summary).font(.caption2).lineLimit(1)
    }
  }
}
