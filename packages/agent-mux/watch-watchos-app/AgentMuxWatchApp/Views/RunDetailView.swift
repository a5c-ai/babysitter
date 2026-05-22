import SwiftUI

struct RunDetailView: View {
  @EnvironmentObject var store: WatchStore
  let run: WatchRunProjection

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 8) {
        Text(run.agent).font(.headline)
        ForEach(store.selectedRunEvents.nodes) { node in
          Text(node.summary).font(.caption2)
        }
      }
    }
    .toolbar {
      ToolbarItemGroup(placement: .bottomBar) {
        Button("Dictate") {}
        Button("Quick") {}
        Button("Stop") {}
      }
    }
  }
}
