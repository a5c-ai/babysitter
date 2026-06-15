import SwiftUI

struct RunsListView: View {
  @EnvironmentObject var store: WatchStore

  var body: some View {
    List(store.runs) { run in
      NavigationLink(destination: RunDetailView(run: run)) {
        VStack(alignment: .leading, spacing: 4) {
          Text(run.agent).font(.headline)
          HStack {
            ConnectionBadge(status: store.connectionState)
            CostChip(totalUsd: run.costUsd)
            if run.hasPendingHook {
              Text("Hook").font(.caption2).foregroundStyle(.yellow)
            }
          }
          Text(run.status).font(.caption2)
        }
      }
    }
  }
}
