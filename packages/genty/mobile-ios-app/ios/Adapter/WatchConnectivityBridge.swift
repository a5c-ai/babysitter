import Foundation
import WatchConnectivity

@objc(WatchConnectivityBridge)
final class WatchConnectivityBridge: RCTEventEmitter, WCSessionDelegate {
  private let session = WCSession.isSupported() ? WCSession.default : nil

  override init() {
    super.init()
    session?.delegate = self
    session?.activate()
  }

  override func supportedEvents() -> [String]! {
    ["watchMessage"]
  }

  @objc
  func sendToWatch(_ payload: String, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    guard let session, session.isPaired, session.isWatchAppInstalled else {
      resolve(nil)
      return
    }
    session.sendMessage(["payload": payload], replyHandler: nil) { error in
      reject("watch_send_failed", error.localizedDescription, error)
    }
    resolve(nil)
  }

  func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
    guard let payload = message["payload"] as? String else { return }
    sendEvent(withName: "watchMessage", body: ["payload": payload])
  }
}
