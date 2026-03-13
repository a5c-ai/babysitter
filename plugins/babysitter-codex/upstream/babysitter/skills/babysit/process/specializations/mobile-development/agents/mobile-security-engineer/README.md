# Mobile Security Engineer Agent

## Overview

The Mobile Security Engineer agent is an autonomous security specialist focused on mobile application security across iOS and Android platforms. It implements secure architectures, conducts security audits, and ensures compliance with industry standards like OWASP MASVS.

## Purpose

Mobile applications face unique security challenges including device compromise, network attacks, and reverse engineering. This agent automates security implementation and auditing, enabling:

- **Secure Architecture Design**: Build apps with security-first principles
- **OWASP Compliance**: Implement MASVS Level 1 and Level 2 controls
- **Vulnerability Remediation**: Identify and fix security issues
- **Security Hardening**: Protect against advanced threats

## Capabilities

| Capability | Description |
|------------|-------------|
| Threat Modeling | Identify and prioritize security threats |
| Secure Storage | Implement Keychain/Keystore integration |
| Certificate Pinning | Prevent MITM attacks |
| Biometric Auth | Secure biometric authentication |
| Code Obfuscation | Protect against reverse engineering |
| MASVS Audit | Check compliance with OWASP standards |

## Required Skills

This agent requires the following skills to function:

1. **mobile-security**: Core security implementation capabilities

## Processes That Use This Agent

- **Mobile Security Implementation** (`mobile-security-implementation.js`)
- **iOS App Store Submission** (`ios-appstore-submission.js`) - security review
- **Android Play Store Publishing** (`android-playstore-publishing.js`) - data safety

## Workflow

### Phase 1: Threat Assessment

```
Input: Application description, data sensitivity
Output: Threat model, security requirements

Steps:
1. Identify sensitive data and assets
2. Enumerate potential threats
3. Assess risk levels
4. Define required security controls
5. Document threat model
```

### Phase 2: Security Audit

```
Input: Project codebase
Output: Vulnerability report, compliance status

Steps:
1. Scan codebase for security issues
2. Check OWASP MASVS compliance
3. Review authentication implementation
4. Analyze data storage patterns
5. Assess network security
```

### Phase 3: Security Implementation

```
Input: Security requirements, gaps identified
Output: Implemented security controls

Steps:
1. Implement secure storage
2. Configure certificate pinning
3. Add biometric authentication
4. Implement security hardening
5. Test security controls
```

### Phase 4: Compliance Verification

```
Input: Implemented controls
Output: Compliance report

Steps:
1. Re-audit against MASVS
2. Verify all controls working
3. Generate compliance report
4. Document remaining gaps
5. Create remediation roadmap
```

## Input Specification

```json
{
  "task": "security_implementation",
  "platform": "ios",
  "securityLevel": "L2",
  "projectPath": "/path/to/ios/project",
  "existingFeatures": [
    "user_authentication",
    "payment_processing",
    "user_profile"
  ],
  "complianceRequirements": ["OWASP_MASVS"],
  "threatModel": {
    "assets": ["user_credentials", "payment_data"],
    "threats": ["mitm", "device_theft", "malware"]
  }
}
```

## Output Specification

```json
{
  "success": true,
  "securityImplementation": {
    "secureStorage": {
      "implementation": "Keychain with biometric protection",
      "coverage": ["auth_tokens", "user_credentials"]
    },
    "networkSecurity": {
      "certificatePinning": true,
      "transportSecurity": "TLS 1.3"
    },
    "authentication": {
      "biometricEnabled": true,
      "mfaSupported": true
    }
  },
  "complianceReport": {
    "masvs_level": "L2",
    "score": "90%",
    "passed": 45,
    "failed": 5,
    "gaps": [...]
  },
  "vulnerabilities": [
    {
      "severity": "HIGH",
      "description": "Sensitive data in debug logs",
      "remediation": "Remove debug logging"
    }
  ]
}
```

## Decision Logic

### Security Level Selection

| Data Type | Recommended Level |
|-----------|-------------------|
| Consumer non-sensitive | L1 |
| Financial data | L2 |
| Healthcare/PII | L2 |
| Government/Defense | L2 + additional controls |

### Storage Selection

| Data Type | iOS | Android |
|-----------|-----|---------|
| Credentials | Keychain (kSecAttrAccessibleWhenUnlockedThisDeviceOnly) | EncryptedSharedPreferences |
| Tokens | Keychain with biometric | Keystore-backed storage |
| User Data | Encrypted Core Data | Encrypted Room DB |

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Keychain access denied | Missing entitlements | Add Keychain entitlement |
| Certificate pin mismatch | Wrong certificate hash | Update pin configuration |
| Biometric unavailable | No enrolled biometrics | Implement fallback auth |

### Recovery Strategy

```
1. Log security error details (without sensitive data)
2. Fail securely (deny access, clear sensitive data)
3. Notify user appropriately
4. Attempt recovery if safe
5. Report incident to monitoring
```

## Integration

### With Other Agents

```
mobile-security-engineer
    |
    +-- ios-native-expert (iOS implementation)
    +-- android-native-expert (Android implementation)
    +-- mobile-devops (CI/CD security)
    +-- mobile-qa-expert (security testing)
```

### With Skills

```
mobile-security-engineer
    |
    +-- mobile-security (core security)
    +-- push-notifications (secure token handling)
    +-- deep-linking (link validation)
```

## Usage Example

### Direct Agent Call

```javascript
const task = defineTask({
  name: 'implement-security',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: 'Implement mobile security controls',
      agent: {
        name: 'mobile-security-engineer',
        prompt: {
          role: 'Senior Mobile Security Engineer',
          task: 'Implement OWASP MASVS L2 security controls',
          context: {
            platform: 'ios',
            projectPath: '/path/to/project',
            securityLevel: 'L2'
          },
          instructions: [
            'Audit current security posture',
            'Implement secure credential storage using Keychain',
            'Configure certificate pinning with TrustKit',
            'Add biometric authentication with fallback',
            'Implement jailbreak detection',
            'Generate compliance report'
          ]
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

## Best Practices

1. **Never store secrets in code** - Use environment variables or secure vaults
2. **Validate all inputs** - Especially from deep links and notifications
3. **Use hardware-backed storage** - Keychain/Keystore with device binding
4. **Implement rate limiting** - Prevent brute force attacks
5. **Log security events** - For incident response and auditing
6. **Regular dependency updates** - Keep security libraries current

## Related Resources

- Skills: `mobile-security/SKILL.md`
- Process: `mobile-security-implementation.js`
- [OWASP MASVS](https://mas.owasp.org/MASVS/)
- [OWASP Mobile Security Testing Guide](https://owasp.org/www-project-mobile-security-testing-guide/)
- [Security Penetration Specialist (Senaiverse)](https://github.com/senaiverse/claude-code-reactnative-expo-agent-system)
