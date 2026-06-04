import Foundation
import UserNotifications
import UIKit

@objc(PushHandler)
final class PushHandler: NSObject {
  @objc
  static func registerForRemoteNotifications() {
    DispatchQueue.main.async {
      UIApplication.shared.registerForRemoteNotifications()
    }
  }

  @objc
  static func handleRemoteNotification(_ userInfo: [AnyHashable: Any]) {
    NotificationCenter.default.post(name: NSNotification.Name("AgentMuxPushNotification"), object: nil, userInfo: userInfo)
  }
}
