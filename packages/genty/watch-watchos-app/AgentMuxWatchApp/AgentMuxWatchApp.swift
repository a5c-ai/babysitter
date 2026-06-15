import SwiftUI

@main
struct AgentMuxWatchApp: App {
  @StateObject private var store = WatchStore()
  @WKApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

  var body: some Scene {
    WindowGroup {
      ContentView()
        .environmentObject(store)
    }
  }
}
