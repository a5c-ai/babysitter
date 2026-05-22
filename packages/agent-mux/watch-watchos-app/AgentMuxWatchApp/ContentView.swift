import SwiftUI

struct ContentView: View {
  @EnvironmentObject var store: WatchStore

  var body: some View {
    NavigationStack {
      RunsListView()
    }
  }
}
