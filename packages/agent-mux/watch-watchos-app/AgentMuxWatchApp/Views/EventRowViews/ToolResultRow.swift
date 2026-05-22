import SwiftUI

struct ToolResultRow: View {
  let summary: String

  var body: some View {
    Text(summary).font(.caption2).lineLimit(2)
  }
}
