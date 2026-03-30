# Deep Linking Skill

## Overview

The Deep Linking skill provides comprehensive deep link implementation capabilities for iOS and Android platforms. It enables configuration of Universal Links (iOS), App Links (Android), custom URL schemes, and deferred deep linking to navigate users directly to specific content within your app.

## Purpose

Deep linking is essential for modern mobile apps, enabling seamless user journeys from external sources like:

- **Marketing Campaigns**: Email, SMS, social media links
- **Push Notifications**: Navigate to relevant content
- **Web-to-App**: Continue sessions from web to mobile
- **Cross-App**: Share content between applications

## Use Cases

### 1. Universal Links Setup
Configure iOS Universal Links with AASA file and Associated Domains.

### 2. Android App Links Configuration
Set up Android App Links with assetlinks.json and intent filters.

### 3. Custom URL Scheme Implementation
Register and handle custom URL schemes (myapp://).

### 4. Deferred Deep Linking
Pass deep link data through app installation using Branch.io or Firebase.

### 5. Deep Link Routing
Design URL structure and implement in-app navigation routing.

## Processes That Use This Skill

- **Firebase Cloud Messaging** (`firebase-cloud-messaging.js`) - notification deep links
- **iOS Push Notifications** (`ios-push-notifications.js`) - notification deep links
- **REST API Integration** (`rest-api-integration.js`) - share links

## Installation

### iOS Requirements

```bash
# Enable Associated Domains in Xcode
# Signing & Capabilities > + Capability > Associated Domains
# Add: applinks:example.com
```

### Android Requirements

```xml
<!-- AndroidManifest.xml - App Links intent filter -->
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https"
          android:host="example.com"
          android:pathPrefix="/products" />
</intent-filter>
```

### Server Requirements

Host verification files at:
- iOS: `https://example.com/.well-known/apple-app-site-association`
- Android: `https://example.com/.well-known/assetlinks.json`

## Configuration

### AASA File (iOS)

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.com.example.app",
        "paths": ["/products/*", "/users/*", "/orders/*"]
      }
    ]
  }
}
```

### assetlinks.json (Android)

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.example.app",
    "sha256_cert_fingerprints": ["AA:BB:CC:..."]
  }
}]
```

## Capabilities

| Capability | iOS | Android | Description |
|------------|-----|---------|-------------|
| Universal/App Links | AASA | assetlinks.json | Verified domain links |
| Custom Schemes | URL Types | Intent Filter | myapp:// links |
| Path Routing | paths array | pathPrefix | URL path matching |
| Query Parameters | URLComponents | Uri.getQueryParameter | Parameter extraction |
| Deferred Links | Branch/Firebase | Branch/Firebase | Through-install links |

## Example Workflows

### Validating AASA Configuration

```bash
# Check AASA file is accessible
curl -I https://example.com/.well-known/apple-app-site-association

# Verify content type (should be application/json)
curl -v https://example.com/.well-known/apple-app-site-association

# Use Apple's CDN validator
curl "https://app-site-association.cdn-apple.com/a/v1/example.com"
```

### Validating assetlinks.json Configuration

```bash
# Check assetlinks.json is accessible
curl -I https://example.com/.well-known/assetlinks.json

# Get app signing certificate fingerprint
keytool -list -v -keystore release.keystore | grep SHA256

# Verify on device
adb shell pm get-app-links com.example.app
```

### Testing Deep Links

```bash
# iOS Simulator
xcrun simctl openurl booted "https://example.com/products/123"
xcrun simctl openurl booted "myapp://product/123"

# Android Emulator
adb shell am start -W -a android.intent.action.VIEW -d "https://example.com/products/123" com.example.app
adb shell am start -W -a android.intent.action.VIEW -d "myapp://product/123" com.example.app
```

## URL Structure Design

### Recommended Pattern

```
https://example.com/{resource}/{id}
https://example.com/{resource}/{id}/{action}

Examples:
https://example.com/products/12345
https://example.com/users/john/profile
https://example.com/orders/67890/track
```

### Custom Scheme Pattern

```
myapp://{resource}/{id}
myapp://{resource}?param1=value1&param2=value2

Examples:
myapp://product/12345
myapp://search?query=shoes&category=footwear
```

## Integration with Other Skills

- **push-notifications**: Handle notification deep links
- **mobile-analytics**: Track deep link attribution
- **firebase-mobile**: Firebase Dynamic Links setup

## Troubleshooting

### Common Issues

1. **AASA Not Loading**: Check Content-Type header, ensure no redirects
2. **App Links Not Verifying**: Verify SHA256 fingerprint matches release signing
3. **Links Opening in Browser**: Check entitlements and manifest configuration
4. **Deep Link Not Routing**: Verify URL parsing and navigation logic

### Debug Commands

```bash
# iOS - Check Associated Domains entitlement
codesign -d --entitlements :- MyApp.app

# iOS - View swcd logs in Console.app
# Filter by subsystem: com.apple.swcd

# Android - Check app link verification status
adb shell pm get-app-links com.example.app

# Android - Force re-verification
adb shell pm verify-app-links --re-verify com.example.app
```

## Server Configuration

### Nginx

```nginx
location /.well-known/apple-app-site-association {
    default_type application/json;
}

location /.well-known/assetlinks.json {
    default_type application/json;
}
```

### Apache

```apache
<Location "/.well-known/apple-app-site-association">
    Header set Content-Type "application/json"
</Location>

<Location "/.well-known/assetlinks.json">
    Header set Content-Type "application/json"
</Location>
```

## References

- [Apple Universal Links Documentation](https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app)
- [Android App Links Guide](https://developer.android.com/training/app-links)
- [AASA Validator (Branch)](https://branch.io/resources/aasa-validator/)
- [Digital Asset Links Generator](https://developers.google.com/digital-asset-links/tools/generator)
- [Branch.io Documentation](https://docs.branch.io/)
- [Firebase Dynamic Links](https://firebase.google.com/docs/dynamic-links)
