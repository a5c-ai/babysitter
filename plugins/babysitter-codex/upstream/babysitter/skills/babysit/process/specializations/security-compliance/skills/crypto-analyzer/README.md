# Crypto Analyzer

Cryptographic implementation analysis and validation skill for ensuring proper encryption, key management, and certificate security.

## Overview

This skill analyzes cryptographic implementations across code, TLS configurations, and certificates to identify weak algorithms, insufficient key sizes, and improper implementations. It provides remediation guidance aligned with NIST, FIPS, and industry compliance frameworks.

## Key Features

- **Algorithm Analysis**: Identify deprecated and weak algorithms
- **Key Size Validation**: Verify cryptographic key strength
- **Certificate Review**: Check validity and chain integrity
- **TLS Assessment**: Analyze protocol and cipher configurations
- **Compliance Mapping**: Map findings to NIST, FIPS, PCI-DSS
- **Quantum Readiness**: Assess post-quantum migration needs

## Algorithm Status

### Symmetric Encryption
| Status | Algorithms |
|--------|------------|
| Approved | AES-256-GCM, ChaCha20-Poly1305 |
| Caution | AES-CBC (needs HMAC) |
| Deprecated | 3DES |
| Prohibited | DES, RC4 |

### Asymmetric/Signing
| Algorithm | Minimum | Recommended |
|-----------|---------|-------------|
| RSA | 2048-bit | 3072-bit+ |
| ECDSA | P-256 | P-384 |
| Ed25519 | Approved | Recommended |

### Hash Functions
| Status | Algorithms |
|--------|------------|
| Approved | SHA-256, SHA-384, SHA-512, SHA-3 |
| Deprecated | SHA-1 (signatures) |
| Prohibited | MD5 |

## Analysis Types

- Code review for crypto patterns
- TLS endpoint configuration
- Certificate chain validation
- Implementation compliance check

## Usage

```javascript
skill: {
  name: 'crypto-analyzer',
  context: {
    analysisType: 'code-review',
    targetPath: './src',
    languages: ['Java', 'Python'],
    complianceFrameworks: ['NIST', 'PCI-DSS']
  }
}
```

## Related Processes

- Cryptography and Key Management Process
- Security Code Review
- TLS Configuration Hardening
