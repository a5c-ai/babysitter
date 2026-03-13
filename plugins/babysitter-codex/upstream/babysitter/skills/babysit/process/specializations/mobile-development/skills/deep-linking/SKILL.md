---
name: deep-linking
description: Universal links and deep linking skill for implementing iOS Universal Links, Android App Links, custom URL schemes, and deferred deep linking across mobile platforms.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Deep Linking Skill

Comprehensive deep linking implementation for iOS and Android, including Universal Links, App Links, custom URL schemes, and deferred deep linking.

## Overview

This skill provides capabilities for implementing deep linking across mobile platforms, enabling users to navigate directly to specific content within your app from external sources like web links, notifications, emails, and other apps.

## Capabilities

### iOS Universal Links
- Configure apple-app-site-association (AASA) file
- Set up Associated Domains entitlement
- Implement NSUserActivity handling
- Validate Universal Links configuration
- Handle fallback to App Store

### Android App Links
- Configure assetlinks.json (Digital Asset Links)
- Set up intent filters for App Links
- Implement deep link handling
- Verify App Links configuration
- Handle fallback to Play Store

### Custom URL Schemes
- Register custom URL schemes
- Handle URL scheme callbacks
- Parse URL parameters
- Implement scheme validation
- Cross-app communication

### Deferred Deep Linking
- Configure Branch.io or Firebase Dynamic Links
- Handle first-open attribution
- Pass deep link data through install
- Track deep link conversions
- Implement fallback flows

### Deep Link Routing
- Design URL structure and routing
- Implement in-app navigation
- Handle authentication requirements
- Manage deep link state persistence
- Track deep link analytics

## Prerequisites

### iOS Development
```bash
# Enable Associated Domains capability in Xcode
# Signing & Capabilities > + Capability > Associated Domains

# Add domain: applinks:example.com
```

### Android Development
```groovy
// No additional dependencies for basic App Links
// For Firebase Dynamic Links:
dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-dynamic-links'
}

// For Branch.io:
dependencies {
    implementation 'io.branch.sdk.android:library:5.+'
}
```

### Web Server Requirements
```bash
# iOS: Host AASA file at
# https://example.com/.well-known/apple-app-site-association

# Android: Host assetlinks.json at
# https://example.com/.well-known/assetlinks.json
```

## Usage Patterns

### Apple App Site Association (AASA) File
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.com.example.app",
        "paths": [
          "/products/*",
          "/users/*",
          "/orders/*",
          "NOT /admin/*"
        ]
      }
    ]
  },
  "webcredentials": {
    "apps": ["TEAMID.com.example.app"]
  }
}
```

### iOS Universal Links Implementation (SwiftUI)
```swift
import SwiftUI

@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .onOpenURL { url in
                    handleDeepLink(url)
                }
        }
    }

    func handleDeepLink(_ url: URL) {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: true),
              let host = components.host else {
            return
        }

        let path = components.path
        let queryItems = components.queryItems ?? []

        // Route based on path
        switch (host, path) {
        case ("example.com", let p) where p.hasPrefix("/products/"):
            let productId = String(p.dropFirst("/products/".count))
            DeepLinkRouter.shared.navigateTo(.product(id: productId))

        case ("example.com", let p) where p.hasPrefix("/users/"):
            let userId = String(p.dropFirst("/users/".count))
            DeepLinkRouter.shared.navigateTo(.profile(userId: userId))

        case ("example.com", "/orders"):
            DeepLinkRouter.shared.navigateTo(.orders)

        default:
            DeepLinkRouter.shared.navigateTo(.home)
        }
    }
}

// Deep Link Router
class DeepLinkRouter: ObservableObject {
    static let shared = DeepLinkRouter()

    @Published var currentDestination: Destination = .home

    enum Destination: Equatable {
        case home
        case product(id: String)
        case profile(userId: String)
        case orders
    }

    func navigateTo(_ destination: Destination) {
        DispatchQueue.main.async {
            self.currentDestination = destination
        }
    }
}
```

### iOS Universal Links (UIKit)
```swift
import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        guard userActivity.activityType == NSUserActivityTypeBrowsingWeb,
              let url = userActivity.webpageURL else {
            return
        }

        handleUniversalLink(url)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        guard let url = URLContexts.first?.url else { return }
        handleCustomScheme(url)
    }

    private func handleUniversalLink(_ url: URL) {
        // Route to appropriate view controller
        let router = DeepLinkRouter.shared
        router.route(url: url)
    }

    private func handleCustomScheme(_ url: URL) {
        // Handle myapp:// scheme
        guard url.scheme == "myapp" else { return }
        let router = DeepLinkRouter.shared
        router.route(url: url)
    }
}
```

### Android assetlinks.json
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.example.app",
      "sha256_cert_fingerprints": [
        "AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99"
      ]
    }
  }
]
```

### Android App Links Implementation (Kotlin)
```kotlin
// AndroidManifest.xml
/*
<activity android:name=".MainActivity"
    android:exported="true">
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="https"
              android:host="example.com"
              android:pathPrefix="/products" />
        <data android:scheme="https"
              android:host="example.com"
              android:pathPrefix="/users" />
    </intent-filter>

    <!-- Custom URL scheme -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="myapp" />
    </intent-filter>
</activity>
*/

// MainActivity.kt
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Handle deep link on cold start
        handleIntent(intent)

        setContent {
            MyApp()
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // Handle deep link when app is already running
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        val action = intent?.action
        val data = intent?.data

        if (action == Intent.ACTION_VIEW && data != null) {
            handleDeepLink(data)
        }
    }

    private fun handleDeepLink(uri: Uri) {
        val path = uri.path ?: return
        val host = uri.host

        when {
            path.startsWith("/products/") -> {
                val productId = path.removePrefix("/products/")
                navigateToProduct(productId)
            }
            path.startsWith("/users/") -> {
                val userId = path.removePrefix("/users/")
                navigateToProfile(userId)
            }
            path == "/orders" -> {
                navigateToOrders()
            }
            else -> {
                navigateToHome()
            }
        }
    }
}
```

### Jetpack Compose Navigation with Deep Links
```kotlin
import androidx.navigation.compose.*
import androidx.navigation.navDeepLink

@Composable
fun AppNavigation() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = "home") {
        composable("home") {
            HomeScreen()
        }

        composable(
            route = "product/{productId}",
            deepLinks = listOf(
                navDeepLink {
                    uriPattern = "https://example.com/products/{productId}"
                },
                navDeepLink {
                    uriPattern = "myapp://product/{productId}"
                }
            )
        ) { backStackEntry ->
            val productId = backStackEntry.arguments?.getString("productId")
            ProductScreen(productId = productId)
        }

        composable(
            route = "profile/{userId}",
            deepLinks = listOf(
                navDeepLink {
                    uriPattern = "https://example.com/users/{userId}"
                }
            )
        ) { backStackEntry ->
            val userId = backStackEntry.arguments?.getString("userId")
            ProfileScreen(userId = userId)
        }
    }
}
```

### React Native Deep Linking
```javascript
// App.js
import { Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

const linking = {
  prefixes: ['https://example.com', 'myapp://'],
  config: {
    screens: {
      Home: '',
      Product: 'products/:productId',
      Profile: 'users/:userId',
      Orders: 'orders',
    },
  },
};

function App() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Product" component={ProductScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Orders" component={OrdersScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Handle deep link manually
useEffect(() => {
  const handleDeepLink = (event) => {
    const url = event.url;
    // Parse and navigate
  };

  Linking.addEventListener('url', handleDeepLink);

  // Check for initial URL (cold start)
  Linking.getInitialURL().then((url) => {
    if (url) {
      handleDeepLink({ url });
    }
  });

  return () => {
    Linking.removeEventListener('url', handleDeepLink);
  };
}, []);
```

## Integration with Babysitter SDK

### Task Definition Example
```javascript
const deepLinkTask = defineTask({
  name: 'deep-link-setup',
  description: 'Configure deep linking for mobile app',

  inputs: {
    platform: { type: 'string', required: true, enum: ['ios', 'android', 'both'] },
    domain: { type: 'string', required: true },
    paths: { type: 'array', items: { type: 'string' }, required: true },
    customScheme: { type: 'string' },
    projectPath: { type: 'string', required: true }
  },

  outputs: {
    aasaFile: { type: 'string' },
    assetlinksFile: { type: 'string' },
    appConfiguration: { type: 'object' },
    verificationSteps: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Configure deep links for ${inputs.domain}`,
      skill: {
        name: 'deep-linking',
        context: {
          operation: 'configure',
          platform: inputs.platform,
          domain: inputs.domain,
          paths: inputs.paths,
          customScheme: inputs.customScheme,
          projectPath: inputs.projectPath
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

## Verification Commands

### iOS Universal Links Verification
```bash
# Validate AASA file
curl -I https://example.com/.well-known/apple-app-site-association

# Check AASA content
curl https://example.com/.well-known/apple-app-site-association | jq

# Use Apple's CDN validator
curl "https://app-site-association.cdn-apple.com/a/v1/example.com"

# Test on device (Console.app)
# Filter by "swcd" to see Universal Links debugging
```

### Android App Links Verification
```bash
# Validate assetlinks.json
curl -I https://example.com/.well-known/assetlinks.json

# Check content
curl https://example.com/.well-known/assetlinks.json | jq

# Verify on device
adb shell pm get-app-links com.example.app

# Reset verification state
adb shell pm set-app-links --package com.example.app 0 all
adb shell pm verify-app-links --re-verify com.example.app
```

## Best Practices

1. **Validate Server Configuration**: Ensure AASA and assetlinks.json are properly served
2. **Handle All States**: Deep links should work in foreground, background, and cold start
3. **Implement Fallbacks**: Redirect to web or app store if app not installed
4. **Secure Deep Links**: Validate deep link parameters before acting on them
5. **Track Analytics**: Log deep link sources and conversions
6. **Test Thoroughly**: Test all paths and edge cases before deployment

## References

- [Apple Universal Links](https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app)
- [Android App Links](https://developer.android.com/training/app-links)
- [AASA Validator](https://branch.io/resources/aasa-validator/)
- [Asset Links Generator](https://developers.google.com/digital-asset-links/tools/generator)
- [Branch.io Deep Linking](https://docs.branch.io/deep-linking/)
- [Firebase Dynamic Links](https://firebase.google.com/docs/dynamic-links)
