import SwiftUI

struct CostChip: View {
  let totalUsd: Double

  var body: some View {
    Text(totalUsd.formatted(.currency(code: "USD")))
      .font(.caption2)
      .padding(.horizontal, 6)
      .padding(.vertical, 2)
      .background(.blue.opacity(0.15))
      .clipShape(Capsule())
  }
}
