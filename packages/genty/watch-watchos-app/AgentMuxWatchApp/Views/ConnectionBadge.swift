import SwiftUI

struct ConnectionBadge: View {
  let status: String

  var body: some View {
    Label(status, systemImage: status == "phone" ? "iphone" : "wifi")
      .font(.caption2)
      .foregroundStyle(status == "phone" ? .green : .orange)
  }
}
