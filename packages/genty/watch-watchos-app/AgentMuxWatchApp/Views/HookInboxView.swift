import SwiftUI

struct HookInboxView: View {
  @EnvironmentObject var store: WatchStore

  var body: some View {
    List {
      if let pendingHook = store.pendingHook {
        NavigationLink(destination: HookApprovalView(request: pendingHook)) {
          VStack(alignment: .leading, spacing: 2) {
            Text(pendingHook.toolName).font(.headline)
            Text(pendingHook.preview).font(.caption2).lineLimit(2)
          }
        }
      } else {
        Text("No pending hooks").font(.caption2)
      }
    }
  }
}
