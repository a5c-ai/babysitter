import SwiftUI

struct RichNotification: View {
  let toolName: String
  let preview: String

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Text(toolName).font(.headline)
      Text(preview).font(.caption2).lineLimit(3)
    }
  }
}
