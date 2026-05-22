import Foundation
import WatchConnectivity

final class WatchPhoneChannel: NSObject, ObservableObject, WCSessionDelegate {
  @Published private(set) var reachable = false
  var onMessage: ((Data) -> Void)?
  private let session = WCSession.isSupported() ? WCSession.default : nil

  override init() {
    super.init()
    session?.delegate = self
    session?.activate()
  }

  func send(_ data: Data) {
    guard let session else { return }
    if session.isReachable {
      session.sendMessageData(data, replyHandler: nil)
    } else {
      session.transferUserInfo(["payload": data])
    }
  }

  func sessionReachabilityDidChange(_ session: WCSession) {
    reachable = session.isReachable
  }

  func session(_ session: WCSession, didReceiveMessageData messageData: Data) {
    onMessage?(messageData)
  }
}
