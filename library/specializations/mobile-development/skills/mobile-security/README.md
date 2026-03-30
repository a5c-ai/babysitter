# Mobile Security Skill

## Overview

The Mobile Security skill provides comprehensive security implementation capabilities for iOS and Android applications. It enables automated security auditing, secure storage implementation, certificate pinning, biometric authentication, and OWASP MASVS compliance checking.

## Purpose

Mobile applications handle sensitive user data and require robust security measures. This skill bridges the gap between security requirements and implementation, enabling:

- **Secure Data Storage**: Proper use of Keychain (iOS) and Keystore (Android)
- **Network Security**: Certificate pinning and transport security configuration
- **Authentication**: Biometric and secure authentication implementation
- **Compliance**: OWASP MASVS Level 1 and Level 2 compliance

## Use Cases

### 1. Security Audit
Analyze existing mobile application code for security vulnerabilities against OWASP Mobile Top 10.

### 2. Secure Storage Implementation
Implement proper secure storage patterns for credentials, tokens, and sensitive data.

### 3. Certificate Pinning Setup
Configure certificate pinning to prevent man-in-the-middle attacks.

### 4. Biometric Authentication
Implement Face ID, Touch ID, or Android Biometric authentication flows.

### 5. Security Hardening
Add jailbreak/root detection, code obfuscation, and anti-tampering measures.

## Processes That Use This Skill

- **Mobile Security Implementation** (`mobile-security-implementation.js`)
- **iOS App Store Submission** (`ios-appstore-submission.js`) - security review
- **Android Play Store Publishing** (`android-playstore-publishing.js`) - data safety

## Installation

### iOS Dependencies

```ruby
# Podfile
pod 'TrustKit'           # Certificate pinning
pod 'KeychainAccess'     # Keychain wrapper
```

### Android Dependencies

```groovy
// build.gradle (app)
dependencies {
    implementation 'androidx.security:security-crypto:1.1.0-alpha06'
    implementation 'androidx.biometric:biometric:1.1.0'
}
```

### Security Testing Tools

```bash
# Install OWASP testing tools
pip install objection
brew install frida-tools

# Mobile Security Framework
pip install mobsf
```

## Configuration

### Environment Variables

```bash
# Certificate hashes for pinning
export CERT_PIN_HASH_PRIMARY="sha256/AAAA..."
export CERT_PIN_HASH_BACKUP="sha256/BBBB..."

# Security testing configuration
export OWASP_MASVS_LEVEL="L2"
```

### iOS Info.plist Configuration

```xml
<!-- App Transport Security -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>api.example.com</key>
        <dict>
            <key>NSExceptionRequiresForwardSecrecy</key>
            <true/>
            <key>NSRequiresCertificateTransparency</key>
            <true/>
        </dict>
    </dict>
</dict>
```

### Android Network Security Config

```xml
<!-- res/xml/network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">api.example.com</domain>
        <pin-set expiration="2027-01-01">
            <pin digest="SHA-256">AAAA...</pin>
            <pin digest="SHA-256">BBBB...</pin>
        </pin-set>
    </domain-config>
</network-security-config>
```

## Capabilities

| Capability | iOS | Android | Description |
|------------|-----|---------|-------------|
| Secure Storage | Keychain | EncryptedSharedPreferences | Encrypted credential storage |
| Certificate Pinning | TrustKit, URLSession | OkHttp, Network Security Config | MITM prevention |
| Biometric Auth | Face ID, Touch ID | BiometricPrompt | Secure authentication |
| Jailbreak/Root Detection | Various checks | SafetyNet, Play Integrity | Device integrity |
| Code Obfuscation | Swiftshield | ProGuard/R8 | Code protection |
| Anti-Tampering | Various | Various | Integrity verification |

## Example Workflows

### Implementing Secure Token Storage

```swift
// iOS - Store authentication token securely
import KeychainAccess

let keychain = Keychain(service: "com.example.app")
    .accessibility(.whenUnlockedThisDeviceOnly)

// Store token
try keychain.set(authToken, key: "auth_token")

// Retrieve token
let token = try keychain.get("auth_token")

// Remove token on logout
try keychain.remove("auth_token")
```

```kotlin
// Android - Store authentication token securely
val masterKey = MasterKey.Builder(context)
    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
    .build()

val securePrefs = EncryptedSharedPreferences.create(
    context, "secure_prefs", masterKey,
    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
)

// Store token
securePrefs.edit().putString("auth_token", authToken).apply()

// Retrieve token
val token = securePrefs.getString("auth_token", null)
```

### Running Security Audit

```bash
# Use MobSF for automated security testing
mobsf --analyze /path/to/app.ipa
mobsf --analyze /path/to/app.apk

# Generate OWASP MASVS compliance report
python owasp_masvs_checker.py --project /path/to/project --level L2
```

## Integration with Other Skills

- **push-notifications**: Secure token handling for push credentials
- **deep-linking**: Validate deep link parameters for security
- **firebase-mobile**: Secure Firebase configuration

## Troubleshooting

### Common Issues

1. **Keychain Access Denied**: Check entitlements and keychain access groups
2. **Certificate Pinning Failures**: Verify pin hashes, check for proxy interference
3. **Biometric Not Available**: Handle devices without biometric hardware
4. **EncryptedSharedPreferences Crash**: Ensure MasterKey compatibility with device

### Debug Commands

```bash
# iOS - Check Keychain items (debug builds)
security dump-keychain

# Android - Check encrypted prefs
adb shell run-as com.example.app cat /data/data/com.example.app/shared_prefs/secure_prefs.xml

# Test certificate pinning
curl --pinnedpubkey "sha256//AAAA..." https://api.example.com
```

## References

- [OWASP Mobile Security Testing Guide](https://owasp.org/www-project-mobile-security-testing-guide/)
- [OWASP MASVS](https://mas.owasp.org/MASVS/)
- [iOS Keychain Services](https://developer.apple.com/documentation/security/keychain_services)
- [Android EncryptedSharedPreferences](https://developer.android.com/reference/androidx/security/crypto/EncryptedSharedPreferences)
- [TrustKit](https://github.com/datatheorem/TrustKit)
- [owasp-mobile-security-checker](https://claude-plugins.dev/skills/@Harishwarrior/flutter-claude-skills/owasp-mobile-security-checker)
