---
name: mobile-security
description: Mobile application security skill for implementing OWASP MASVS compliance, secure storage, certificate pinning, biometric authentication, and security hardening across iOS and Android platforms.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Mobile Security Skill

Comprehensive mobile application security implementation for iOS and Android platforms, covering OWASP Mobile Security guidelines, secure storage, authentication, and security hardening.

## Overview

This skill provides capabilities for implementing mobile security best practices, including secure data storage, network security, authentication mechanisms, and compliance with OWASP Mobile Application Security Verification Standard (MASVS).

## Capabilities

### Secure Storage Implementation
- Configure iOS Keychain Services for sensitive data
- Set up Android Keystore for cryptographic operations
- Implement encrypted SharedPreferences/UserDefaults
- Manage secure key generation and storage
- Handle secure credential management

### Certificate Pinning
- Implement TrustKit for iOS certificate pinning
- Configure OkHttp CertificatePinner for Android
- Set up Network Security Config (Android)
- Configure App Transport Security (iOS)
- Validate and rotate pinned certificates

### Biometric Authentication
- Implement Face ID and Touch ID for iOS
- Configure Fingerprint/BiometricPrompt for Android
- Handle fallback authentication mechanisms
- Manage biometric enrollment states
- Secure biometric-protected keychain/keystore items

### Security Hardening
- Implement jailbreak/root detection
- Configure code obfuscation (ProGuard/R8, Swiftshield)
- Set up anti-tampering mechanisms
- Implement runtime integrity checks
- Configure secure debugging settings

### OWASP MASVS Compliance
- Audit against MASVS Level 1 and Level 2
- Generate compliance checklists
- Identify security vulnerabilities
- Recommend remediation strategies
- Document security controls

## Prerequisites

### iOS Development
```bash
# TrustKit for certificate pinning
pod 'TrustKit'

# Keychain wrapper
pod 'KeychainAccess'
```

### Android Development
```groovy
// build.gradle
dependencies {
    implementation 'androidx.security:security-crypto:1.1.0-alpha06'
    implementation 'androidx.biometric:biometric:1.1.0'
}
```

### Security Tools
```bash
# OWASP Mobile Security Testing Guide tools
pip install objection
brew install frida-tools
```

## Usage Patterns

### iOS Keychain Storage
```swift
import Security

class KeychainManager {
    static func save(key: String, data: Data) -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]

        SecItemDelete(query as CFDictionary)
        let status = SecItemAdd(query as CFDictionary, nil)
        return status == errSecSuccess
    }

    static func load(key: String) -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        return status == errSecSuccess ? result as? Data : nil
    }
}
```

### Android EncryptedSharedPreferences
```kotlin
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class SecureStorage(context: Context) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sharedPreferences = EncryptedSharedPreferences.create(
        context,
        "secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveToken(token: String) {
        sharedPreferences.edit().putString("auth_token", token).apply()
    }

    fun getToken(): String? {
        return sharedPreferences.getString("auth_token", null)
    }
}
```

### Certificate Pinning (iOS - TrustKit)
```swift
import TrustKit

class NetworkSecurityManager {
    static func configurePinning() {
        let trustKitConfig: [String: Any] = [
            kTSKSwizzleNetworkDelegates: false,
            kTSKPinnedDomains: [
                "api.example.com": [
                    kTSKEnforcePinning: true,
                    kTSKIncludeSubdomains: true,
                    kTSKExpirationDate: "2027-01-01",
                    kTSKPublicKeyHashes: [
                        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
                        "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB="
                    ]
                ]
            ]
        ]
        TrustKit.initSharedInstance(withConfiguration: trustKitConfig)
    }
}
```

### Certificate Pinning (Android - OkHttp)
```kotlin
import okhttp3.CertificatePinner
import okhttp3.OkHttpClient

val certificatePinner = CertificatePinner.Builder()
    .add("api.example.com", "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
    .add("api.example.com", "sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=")
    .build()

val client = OkHttpClient.Builder()
    .certificatePinner(certificatePinner)
    .build()
```

### Biometric Authentication (iOS)
```swift
import LocalAuthentication

class BiometricAuth {
    func authenticate(completion: @escaping (Bool, Error?) -> Void) {
        let context = LAContext()
        var error: NSError?

        if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
            context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: "Authenticate to access secure data"
            ) { success, error in
                DispatchQueue.main.async {
                    completion(success, error)
                }
            }
        } else {
            completion(false, error)
        }
    }
}
```

### Biometric Authentication (Android)
```kotlin
import androidx.biometric.BiometricPrompt
import androidx.fragment.app.FragmentActivity

class BiometricAuth(private val activity: FragmentActivity) {
    fun authenticate(onSuccess: () -> Unit, onError: (String) -> Unit) {
        val executor = ContextCompat.getMainExecutor(activity)

        val biometricPrompt = BiometricPrompt(activity, executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    onSuccess()
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    onError(errString.toString())
                }
            })

        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Biometric Authentication")
            .setSubtitle("Authenticate to access secure data")
            .setNegativeButtonText("Cancel")
            .build()

        biometricPrompt.authenticate(promptInfo)
    }
}
```

## Integration with Babysitter SDK

### Task Definition Example
```javascript
const mobileSecurityTask = defineTask({
  name: 'mobile-security-implementation',
  description: 'Implement mobile security controls',

  inputs: {
    platform: { type: 'string', required: true, enum: ['ios', 'android', 'both'] },
    securityLevel: { type: 'string', required: true, enum: ['L1', 'L2'] },
    features: { type: 'array', items: { type: 'string' } },
    projectPath: { type: 'string', required: true }
  },

  outputs: {
    implementedControls: { type: 'array' },
    complianceReport: { type: 'object' },
    securityAuditPath: { type: 'string' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Implement ${inputs.securityLevel} security for ${inputs.platform}`,
      skill: {
        name: 'mobile-security',
        context: {
          operation: 'implement_security',
          platform: inputs.platform,
          securityLevel: inputs.securityLevel,
          features: inputs.features,
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

## MCP Server Integration

### Using owasp-mobile-security-checker
```json
{
  "mcpServers": {
    "owasp-mobile": {
      "command": "npx",
      "args": ["owasp-mobile-security-checker"],
      "env": {
        "PROJECT_PATH": "/path/to/mobile/project"
      }
    }
  }
}
```

### Available MCP Tools
- `owasp_scan_ios` - Scan iOS project for OWASP vulnerabilities
- `owasp_scan_android` - Scan Android project for OWASP vulnerabilities
- `check_keychain_usage` - Validate iOS Keychain implementation
- `check_keystore_usage` - Validate Android Keystore implementation
- `validate_certificate_pinning` - Check certificate pinning configuration
- `audit_biometric_auth` - Audit biometric authentication implementation

## OWASP MASVS Checklist

### Storage (MASVS-STORAGE)
- [ ] Sensitive data not stored in plaintext
- [ ] Sensitive data not in app logs
- [ ] Sensitive data not shared with third parties
- [ ] Keyboard cache disabled for sensitive inputs
- [ ] Clipboard disabled for sensitive data
- [ ] Sensitive data excluded from backups

### Cryptography (MASVS-CRYPTO)
- [ ] Strong cryptographic algorithms used
- [ ] Cryptographic keys properly managed
- [ ] Random number generation secure
- [ ] No deprecated crypto functions

### Authentication (MASVS-AUTH)
- [ ] Biometric authentication properly implemented
- [ ] Session management secure
- [ ] Password policies enforced
- [ ] Multi-factor authentication available

### Network (MASVS-NETWORK)
- [ ] TLS used for all connections
- [ ] Certificate pinning implemented
- [ ] Certificate validation not bypassed
- [ ] ATS/Network Security Config properly configured

### Platform (MASVS-PLATFORM)
- [ ] WebView properly configured
- [ ] Deep links validated
- [ ] IPC mechanisms secured
- [ ] Screenshots prevented for sensitive screens

### Code Quality (MASVS-CODE)
- [ ] Code obfuscation enabled
- [ ] Debugging disabled in release
- [ ] Root/jailbreak detection implemented
- [ ] Anti-tampering measures in place

## Best Practices

1. **Defense in Depth**: Layer multiple security controls
2. **Secure by Default**: Default to most secure configuration
3. **Least Privilege**: Request only necessary permissions
4. **Data Minimization**: Store only essential sensitive data
5. **Regular Audits**: Continuously assess security posture
6. **Key Rotation**: Implement certificate and key rotation plans

## References

- [OWASP Mobile Security Testing Guide](https://owasp.org/www-project-mobile-security-testing-guide/)
- [OWASP MASVS](https://mas.owasp.org/MASVS/)
- [Apple Security Documentation](https://developer.apple.com/documentation/security)
- [Android Security Best Practices](https://developer.android.com/topic/security/best-practices)
- [TrustKit iOS](https://github.com/datatheorem/TrustKit)
- [owasp-mobile-security-checker](https://claude-plugins.dev/skills/@Harishwarrior/flutter-claude-skills/owasp-mobile-security-checker)
