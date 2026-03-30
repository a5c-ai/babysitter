# Push Notifications Skill

## Overview

The Push Notifications skill provides comprehensive push notification implementation capabilities for iOS (APNs) and Android (FCM). It enables automated setup of notification infrastructure, rich notification design, deep linking integration, and background notification handling.

## Purpose

Push notifications are critical for user engagement in mobile applications. This skill automates the complex setup process and provides patterns for:

- **Platform Configuration**: APNs certificates/keys and FCM setup
- **Rich Notifications**: Images, actions, and interactive elements
- **Deep Linking**: Navigate users to specific app screens
- **Background Processing**: Handle silent notifications and content updates

## Use Cases

### 1. Initial Push Setup
Configure APNs and FCM from scratch for a new mobile application.

### 2. Rich Notification Implementation
Add image attachments, action buttons, and custom UI to notifications.

### 3. Deep Link Integration
Implement notification-to-screen navigation with custom data passing.

### 4. Silent Push Processing
Handle background data sync triggered by silent notifications.

### 5. Cross-Platform Notifications
Send notifications to both iOS and Android from a unified backend.

## Processes That Use This Skill

- **iOS Push Notifications** (`ios-push-notifications.js`)
- **Firebase Cloud Messaging** (`firebase-cloud-messaging.js`)
- **Firebase Backend Integration** (`firebase-backend-integration.js`)

## Installation

### iOS Setup

1. Enable Push Notifications capability in Xcode
2. Generate APNs Key (.p8) from Apple Developer Portal
3. Configure App ID with push notification entitlement

```bash
# Required Xcode capability
# Signing & Capabilities > + Capability > Push Notifications

# For Notification Service Extension (rich media)
# File > New > Target > Notification Service Extension
```

### Android Setup

1. Create Firebase project
2. Download `google-services.json`
3. Add Firebase dependencies

```groovy
// build.gradle (project level)
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}

// build.gradle (app level)
plugins {
    id 'com.google.gms.google-services'
}

dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

### Server Dependencies

```bash
# Firebase Admin SDK (recommended for both platforms)
npm install firebase-admin

# Direct APNs (iOS only)
npm install @parse/node-apn
```

## Configuration

### Environment Variables

```bash
# Firebase
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"

# APNs (if using direct APNs)
export APNS_KEY_ID="XXXXXXXXXX"
export APNS_TEAM_ID="YYYYYYYYYY"
export APNS_KEY_PATH="/path/to/AuthKey.p8"
export APNS_BUNDLE_ID="com.example.app"
```

### Android Notification Channels

```xml
<!-- AndroidManifest.xml -->
<meta-data
    android:name="com.google.firebase.messaging.default_notification_channel_id"
    android:value="default_channel" />

<meta-data
    android:name="com.google.firebase.messaging.default_notification_icon"
    android:resource="@drawable/ic_notification" />

<meta-data
    android:name="com.google.firebase.messaging.default_notification_color"
    android:resource="@color/notification_color" />
```

## Capabilities

| Capability | iOS | Android | Description |
|------------|-----|---------|-------------|
| Basic Push | APNs | FCM | Standard text notifications |
| Rich Media | Notification Service Extension | BigPictureStyle | Image attachments |
| Actions | UNNotificationAction | NotificationCompat.Action | Interactive buttons |
| Deep Linking | URL Schemes, Universal Links | Intent, App Links | Screen navigation |
| Silent Push | content-available | data-only messages | Background processing |
| Grouping | thread-id | Group notifications | Message threading |
| Badges | badge | setNumber() | App icon badges |

## Example Workflows

### Requesting Notification Permission (iOS)

```swift
import UserNotifications

func requestNotificationPermission() async -> Bool {
    let center = UNUserNotificationCenter.current()

    do {
        let granted = try await center.requestAuthorization(options: [.alert, .sound, .badge])
        if granted {
            await MainActor.run {
                UIApplication.shared.registerForRemoteNotifications()
            }
        }
        return granted
    } catch {
        print("Permission request failed: \(error)")
        return false
    }
}
```

### Checking Permission Status (Android)

```kotlin
import android.Manifest
import android.os.Build
import androidx.activity.result.contract.ActivityResultContracts

// In Activity or Fragment
private val requestPermissionLauncher = registerForActivityResult(
    ActivityResultContracts.RequestPermission()
) { isGranted: Boolean ->
    if (isGranted) {
        // Permission granted, FCM will auto-register
    } else {
        // Handle permission denied
    }
}

fun checkNotificationPermission() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
    }
}
```

### Sending Test Notification (Node.js)

```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(require('./service-account.json'))
});

// Send to specific device
async function sendTestNotification(token) {
  const message = {
    notification: {
      title: 'Test Notification',
      body: 'This is a test push notification'
    },
    token: token
  };

  const response = await admin.messaging().send(message);
  console.log('Message sent:', response);
}

// Send to topic
async function sendTopicNotification(topic) {
  const message = {
    notification: {
      title: 'Breaking News',
      body: 'New article published!'
    },
    topic: topic
  };

  const response = await admin.messaging().send(message);
  console.log('Topic message sent:', response);
}
```

## Integration with Other Skills

- **deep-linking**: Handle notification deep links
- **firebase-mobile**: Firebase project setup and configuration
- **mobile-analytics**: Track notification engagement

## Troubleshooting

### Common Issues

1. **APNs Token Not Received**: Check push entitlement and provisioning profile
2. **FCM Token Null**: Ensure google-services.json is properly configured
3. **Notifications Not Appearing**: Check notification channel importance (Android)
4. **Rich Media Not Loading**: Verify Notification Service Extension setup (iOS)

### Debug Commands

```bash
# iOS - Check push notification entitlement
codesign -d --entitlements :- /path/to/app.app

# Android - Check FCM token
adb logcat | grep "FCM"

# Test APNs connectivity
curl -v https://api.push.apple.com

# Send test FCM notification
curl -X POST -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{"message":{"token":"DEVICE_TOKEN","notification":{"title":"Test","body":"Hello"}}}' \
  "https://fcm.googleapis.com/v1/projects/PROJECT_ID/messages:send"
```

## References

- [Apple Push Notification Service Guide](https://developer.apple.com/documentation/usernotifications)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [FCM HTTP v1 API](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages)
- [APNs Provider API](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server)
- [Notification Service Extension](https://developer.apple.com/documentation/usernotifications/unnotificationserviceextension)
