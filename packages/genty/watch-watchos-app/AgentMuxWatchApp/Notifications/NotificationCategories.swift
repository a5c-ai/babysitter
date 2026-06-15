import UserNotifications

enum NotificationCategories {
  static func register() {
    let allow = UNNotificationAction(identifier: "ALLOW_HOOK", title: "Allow")
    let deny = UNNotificationAction(identifier: "DENY_HOOK", title: "Deny", options: [.destructive])
    let open = UNNotificationAction(identifier: "OPEN_HOOK", title: "Open", options: [.foreground])
    let category = UNNotificationCategory(identifier: "HOOK_REQUEST", actions: [allow, deny, open], intentIdentifiers: [])
    UNUserNotificationCenter.current().setNotificationCategories([category])
  }
}
