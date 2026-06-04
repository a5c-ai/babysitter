import SwiftUI

struct TextDeltaRow: View {
  let text: String

  var body: some View {
    Text(text).lineLimit(8).font(.caption2)
  }
}
