---
name: push-notifications
description: Multi-platform push notification skill for implementing APNs (iOS), FCM (Android), and cross-platform notification systems with rich media, deep linking, and background processing capabilities.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Push Notifications Skill

Comprehensive push notification implementation for iOS (APNs) and Android (FCM), including rich notifications, deep linking, and background processing.

## Overview

This skill provides capabilities for implementing push notifications across iOS and Android platforms, covering certificate/key configuration, notification payload design, rich media attachments, deep linking, and background notification handling.

## Capabilities

### APNs Configuration (iOS)
- Configure APNs certificates and keys (.p8, .p12)
- Set up App ID and push entitlements
- Configure development vs production environments
- Implement UNUserNotificationCenter delegate
- Handle notification permission requests

### FCM Configuration (Android)
- Set up Firebase project and google-services.json
- Configure notification channels (Android 8.0+)
- Implement FirebaseMessagingService
- Handle FCM token registration
- Configure notification priority and visibility

### Rich Notifications
- Design notification payloads with custom data
- Implement image and media attachments
- Configure notification actions and categories
- Create interactive notification buttons
- Handle notification grouping and threading

### Deep Linking
- Implement notification-to-screen navigation
- Configure universal links from notifications
- Handle app state (foreground, background, terminated)
- Pass custom data through deep links
- Track notification tap attribution

### Background Processing
- Handle silent/background notifications
- Implement content-available processing
- Configure background fetch capabilities
- Manage notification state persistence
- Handle notification delivery reports

## Prerequisites

### iOS Development
```bash
# Ensure push notification entitlement is enabled
# In Xcode: Signing & Capabilities > + Capability > Push Notifications

# APNs Key (.p8) from Apple Developer Portal
# Or APNs Certificate (.p12) - less preferred
```

### Android Development
```groovy
// build.gradle (project)
classpath 'com.google.gms:google-services:4.4.0'

// build.gradle (app)
plugins {
    id 'com.google.gms.google-services'
}

dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

### Server Requirements
```bash
# Node.js server for sending notifications
npm install firebase-admin @parse/node-apn
```

## Usage Patterns

### iOS Push Registration (SwiftUI)
```swift
import SwiftUI
import UserNotifications

@main
struct MyApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        registerForPushNotifications()
        return true
    }

    func registerForPushNotifications() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            guard granted else { return }
            DispatchQueue.main.async {
                UIApplication.shared.registerForRemoteNotifications()
            }
        }
    }

    func application(_ application: UIApplication,
                     didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        print("APNs Token: \(token)")
        // Send token to your server
    }

    func application(_ application: UIApplication,
                     didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("Failed to register for notifications: \(error)")
    }

    // Handle notification when app is in foreground
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound, .badge])
    }

    // Handle notification tap
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        let userInfo = response.notification.request.content.userInfo
        handleNotificationTap(userInfo: userInfo)
        completionHandler()
    }

    func handleNotificationTap(userInfo: [AnyHashable: Any]) {
        if let deepLink = userInfo["deep_link"] as? String {
            // Navigate to deep link destination
            NotificationCenter.default.post(name: .handleDeepLink, object: nil, userInfo: ["url": deepLink])
        }
    }
}

extension Notification.Name {
    static let handleDeepLink = Notification.Name("handleDeepLink")
}
```

### Android FCM Implementation (Kotlin)
```kotlin
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat

class MyFirebaseMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // Send token to your server
        sendTokenToServer(token)
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        // Handle data payload
        remoteMessage.data.isNotEmpty().let {
            handleDataPayload(remoteMessage.data)
        }

        // Handle notification payload (when app in foreground)
        remoteMessage.notification?.let {
            showNotification(it.title, it.body, remoteMessage.data)
        }
    }

    private fun handleDataPayload(data: Map<String, String>) {
        val deepLink = data["deep_link"]
        val customData = data["custom_data"]
        // Process data payload
    }

    private fun showNotification(title: String?, body: String?, data: Map<String, String>) {
        val channelId = "default_channel"
        createNotificationChannel(channelId)

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            data.forEach { (key, value) -> putExtra(key, value) }
        }

        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }

    private fun createNotificationChannel(channelId: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Default Notifications",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Default notification channel"
                enableLights(true)
                enableVibration(true)
            }

            val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun sendTokenToServer(token: String) {
        // API call to register token with backend
    }
}
```

### Rich Notification with Image (iOS)
```swift
import UserNotifications

class NotificationService: UNNotificationServiceExtension {

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?

    override func didReceive(_ request: UNNotificationRequest,
                            withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.contentHandler = contentHandler
        bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)

        if let bestAttemptContent = bestAttemptContent {
            // Handle rich media attachment
            if let imageURLString = request.content.userInfo["image_url"] as? String,
               let imageURL = URL(string: imageURLString) {
                downloadImage(from: imageURL) { attachment in
                    if let attachment = attachment {
                        bestAttemptContent.attachments = [attachment]
                    }
                    contentHandler(bestAttemptContent)
                }
            } else {
                contentHandler(bestAttemptContent)
            }
        }
    }

    private func downloadImage(from url: URL, completion: @escaping (UNNotificationAttachment?) -> Void) {
        let task = URLSession.shared.downloadTask(with: url) { localURL, _, error in
            guard let localURL = localURL, error == nil else {
                completion(nil)
                return
            }

            let tmpDirectory = FileManager.default.temporaryDirectory
            let tmpFile = tmpDirectory.appendingPathComponent(url.lastPathComponent)

            try? FileManager.default.moveItem(at: localURL, to: tmpFile)

            if let attachment = try? UNNotificationAttachment(identifier: "", url: tmpFile, options: nil) {
                completion(attachment)
            } else {
                completion(nil)
            }
        }
        task.resume()
    }

    override func serviceExtensionTimeWillExpire() {
        if let contentHandler = contentHandler, let bestAttemptContent = bestAttemptContent {
            contentHandler(bestAttemptContent)
        }
    }
}
```

### Server-Side Notification Sending (Node.js)
```javascript
// Using Firebase Admin SDK for FCM
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function sendPushNotification(token, title, body, data) {
  const message = {
    notification: {
      title,
      body
    },
    data: {
      deep_link: data.deepLink || '',
      custom_data: JSON.stringify(data.custom || {})
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'default_channel',
        imageUrl: data.imageUrl
      }
    },
    apns: {
      payload: {
        aps: {
          'mutable-content': 1,
          sound: 'default'
        }
      },
      fcmOptions: {
        imageUrl: data.imageUrl
      }
    },
    token
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Using node-apn for direct APNs
const apn = require('@parse/node-apn');

const apnProvider = new apn.Provider({
  token: {
    key: './AuthKey_XXXXXXXXXX.p8',
    keyId: 'XXXXXXXXXX',
    teamId: 'YYYYYYYYYY'
  },
  production: false // true for production
});

async function sendAPNsNotification(deviceToken, title, body, data) {
  const notification = new apn.Notification();

  notification.expiry = Math.floor(Date.now() / 1000) + 3600;
  notification.badge = 1;
  notification.sound = 'default';
  notification.alert = { title, body };
  notification.payload = { deep_link: data.deepLink, ...data.custom };
  notification.topic = 'com.example.app';
  notification.mutableContent = true;

  if (data.imageUrl) {
    notification.payload.image_url = data.imageUrl;
  }

  try {
    const result = await apnProvider.send(notification, deviceToken);
    console.log('APNs result:', result);
    return result;
  } catch (error) {
    console.error('APNs error:', error);
    throw error;
  }
}
```

## Integration with Babysitter SDK

### Task Definition Example
```javascript
const pushNotificationTask = defineTask({
  name: 'push-notification-setup',
  description: 'Configure push notifications for mobile app',

  inputs: {
    platform: { type: 'string', required: true, enum: ['ios', 'android', 'both'] },
    projectPath: { type: 'string', required: true },
    features: {
      type: 'array',
      items: { type: 'string', enum: ['rich_media', 'deep_linking', 'silent_push', 'notification_actions'] }
    }
  },

  outputs: {
    configuredPlatforms: { type: 'array' },
    tokenRegistrationCode: { type: 'string' },
    serverIntegrationGuide: { type: 'string' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Configure push notifications for ${inputs.platform}`,
      skill: {
        name: 'push-notifications',
        context: {
          operation: 'configure',
          platform: inputs.platform,
          projectPath: inputs.projectPath,
          features: inputs.features
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## Notification Payload Reference

### APNs Payload Structure
```json
{
  "aps": {
    "alert": {
      "title": "New Message",
      "subtitle": "From John",
      "body": "Hey, how are you?"
    },
    "badge": 1,
    "sound": "default",
    "mutable-content": 1,
    "category": "MESSAGE_CATEGORY",
    "thread-id": "conversation-123"
  },
  "deep_link": "myapp://messages/123",
  "image_url": "https://example.com/image.jpg",
  "custom_data": {
    "message_id": "msg-456",
    "sender_id": "user-789"
  }
}
```

### FCM Payload Structure
```json
{
  "message": {
    "token": "device_fcm_token",
    "notification": {
      "title": "New Message",
      "body": "Hey, how are you?",
      "image": "https://example.com/image.jpg"
    },
    "data": {
      "deep_link": "myapp://messages/123",
      "message_id": "msg-456",
      "sender_id": "user-789"
    },
    "android": {
      "priority": "high",
      "notification": {
        "channel_id": "messages",
        "tag": "message-123",
        "click_action": "OPEN_MESSAGE"
      }
    },
    "apns": {
      "payload": {
        "aps": {
          "mutable-content": 1,
          "category": "MESSAGE_CATEGORY"
        }
      }
    }
  }
}
```

## Best Practices

1. **Request Permission Appropriately**: Ask for notification permission at the right moment
2. **Use Notification Channels**: Create meaningful channels for Android 8.0+
3. **Handle All App States**: Test notifications in foreground, background, and terminated states
4. **Implement Token Refresh**: Handle FCM token refresh and APNs token changes
5. **Design Clear Deep Links**: Create consistent deep linking scheme
6. **Test Rich Media**: Verify image downloads and display
7. **Monitor Delivery**: Track notification delivery and tap rates

## References

- [Apple Push Notification Service](https://developer.apple.com/documentation/usernotifications)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [APNs Provider API](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server)
- [FCM HTTP v1 API](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages)
