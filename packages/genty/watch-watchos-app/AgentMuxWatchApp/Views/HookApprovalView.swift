import SwiftUI

struct HookApprovalView: View {
  @EnvironmentObject var store: WatchStore
  let request: WatchHookRequest

  var body: some View {
    VStack(spacing: 10) {
      Text(request.toolName).font(.headline)
      Text(request.preview).font(.caption2).lineLimit(3)
      Text("\(request.secondsRemaining)s").font(.caption2)
      HStack {
        Button("Allow") { store.resolveHook() }.tint(.green)
        Button("Deny") { store.resolveHook() }.tint(.red)
      }
      Button("See more") {}
    }
  }
}
