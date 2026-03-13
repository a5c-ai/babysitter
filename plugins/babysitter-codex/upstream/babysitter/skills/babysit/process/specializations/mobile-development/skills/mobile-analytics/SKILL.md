---
name: Mobile Analytics
description: Mobile app analytics and crash reporting integration
version: 1.0.0
category: Analytics & Monitoring
slug: mobile-analytics
status: active
---

# Mobile Analytics Skill

## Overview

This skill provides comprehensive capabilities for mobile app analytics and crash reporting integration. It enables configuration of Firebase Analytics, Crashlytics, Mixpanel, Amplitude, and other analytics platforms.

## Allowed Tools

- `bash` - Execute Firebase CLI and SDK commands
- `read` - Analyze analytics configurations
- `write` - Generate analytics event schemas and configurations
- `edit` - Update analytics implementations
- `glob` - Search for analytics files
- `grep` - Search for event tracking patterns

## Capabilities

### Firebase Analytics

1. **Event Configuration**
   - Configure custom events
   - Set user properties
   - Implement screen tracking
   - Configure event parameters
   - Handle default events

2. **User Segmentation**
   - Configure audiences
   - Set user IDs
   - Implement user properties
   - Handle demographics

### Firebase Crashlytics

3. **Crash Reporting**
   - Configure crash reporting
   - Implement custom keys
   - Log non-fatal errors
   - Set user identifiers
   - Configure crash alerting

4. **Debug Tools**
   - Enable debug mode
   - Configure test crashes
   - Analyze stack traces
   - Handle dSYM uploads

### Third-Party Analytics

5. **Mixpanel/Amplitude**
   - Configure SDKs
   - Implement event tracking
   - Set user profiles
   - Handle funnels

6. **Segment**
   - Configure data routing
   - Implement destinations
   - Handle identity

### A/B Testing

7. **Remote Config**
   - Configure feature flags
   - Implement experiments
   - Handle rollout percentages
   - Analyze results

## Target Processes

- `mobile-analytics-setup.js` - Analytics implementation
- `firebase-backend-integration.js` - Firebase services
- `mobile-performance-optimization.js` - Performance monitoring

## Dependencies

- Firebase SDK
- Analytics platform SDKs
- Firebase CLI

## Usage Examples

### Firebase Analytics Setup (iOS)

```swift
// AppDelegate.swift
import FirebaseCore
import FirebaseAnalytics

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        FirebaseApp.configure()
        return true
    }
}

// Analytics Helper
struct AnalyticsManager {
    static func logEvent(_ name: String, parameters: [String: Any]? = nil) {
        Analytics.logEvent(name, parameters: parameters)
    }

    static func setUserId(_ userId: String) {
        Analytics.setUserID(userId)
    }

    static func setUserProperty(_ value: String?, forName name: String) {
        Analytics.setUserProperty(value, forName: name)
    }

    static func logScreenView(screenName: String, screenClass: String) {
        Analytics.logEvent(AnalyticsEventScreenView, parameters: [
            AnalyticsParameterScreenName: screenName,
            AnalyticsParameterScreenClass: screenClass
        ])
    }
}
```

### Firebase Analytics Setup (Android)

```kotlin
// AnalyticsManager.kt
class AnalyticsManager @Inject constructor(
    private val analytics: FirebaseAnalytics
) {
    fun logEvent(name: String, params: Map<String, Any>? = null) {
        analytics.logEvent(name, params?.toBundle())
    }

    fun setUserId(userId: String?) {
        analytics.setUserId(userId)
    }

    fun setUserProperty(name: String, value: String?) {
        analytics.setUserProperty(name, value)
    }

    fun logScreenView(screenName: String, screenClass: String) {
        analytics.logEvent(FirebaseAnalytics.Event.SCREEN_VIEW) {
            param(FirebaseAnalytics.Param.SCREEN_NAME, screenName)
            param(FirebaseAnalytics.Param.SCREEN_CLASS, screenClass)
        }
    }
}

private fun Map<String, Any>.toBundle(): Bundle {
    return Bundle().apply {
        this@toBundle.forEach { (key, value) ->
            when (value) {
                is String -> putString(key, value)
                is Int -> putInt(key, value)
                is Long -> putLong(key, value)
                is Double -> putDouble(key, value)
                is Boolean -> putBoolean(key, value)
            }
        }
    }
}
```

### Event Schema

```typescript
// analytics/events.ts
export const AnalyticsEvents = {
  // User Events
  USER_SIGNED_UP: 'user_signed_up',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',

  // Feature Events
  FEATURE_USED: 'feature_used',
  ITEM_VIEWED: 'item_viewed',
  ITEM_ADDED_TO_CART: 'item_added_to_cart',
  PURCHASE_COMPLETED: 'purchase_completed',

  // Engagement Events
  SHARE_CLICKED: 'share_clicked',
  NOTIFICATION_RECEIVED: 'notification_received',
  NOTIFICATION_OPENED: 'notification_opened',
} as const;

export interface EventParameters {
  user_signed_up: { method: 'email' | 'google' | 'apple' };
  item_viewed: { item_id: string; item_name: string; category: string };
  purchase_completed: { transaction_id: string; value: number; currency: string };
}
```

## Quality Gates

- Event naming conventions enforced
- Required parameters validated
- PII data excluded
- Consent management implemented

## Related Skills

- `firebase-mobile` - Firebase services
- `mobile-perf` - Performance monitoring

## Version History

- 1.0.0 - Initial release
