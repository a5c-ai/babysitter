---
name: crypto-analyzer
description: Cryptographic implementation analysis and validation for encryption algorithms, key sizes, and certificate management
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - WebFetch
---

# Crypto Analyzer Skill

## Purpose

Analyze and validate cryptographic implementations to ensure proper algorithm usage, key sizes, certificate validity, and compliance with cryptographic best practices and standards.

## Capabilities

### Encryption Implementation Analysis
- Analyze symmetric encryption usage (AES, ChaCha20)
- Review asymmetric encryption implementations (RSA, ECDSA)
- Check encryption mode selection (GCM, CBC, CTR)
- Validate initialization vector (IV) handling
- Verify padding schemes
- Identify insecure encryption patterns

### Algorithm Strength Validation
- Check algorithm deprecation status
- Validate against NIST recommendations
- Compare with FIPS 140-3 requirements
- Assess quantum resistance readiness
- Flag weak or deprecated algorithms
- Recommend algorithm upgrades

### Key Size Verification
- Validate RSA key lengths (minimum 2048-bit)
- Check ECC curve selections
- Verify symmetric key sizes
- Assess key derivation functions
- Check PBKDF2/scrypt/bcrypt parameters
- Validate key stretching implementations

### Deprecated Algorithm Detection
- Identify MD5 and SHA-1 usage
- Flag DES and 3DES usage
- Detect RC4 stream cipher
- Find weak random number generation
- Identify export-grade cryptography
- Flag custom/homegrown crypto

### Certificate Analysis
- Verify certificate validity periods
- Check certificate chain completeness
- Validate certificate key usage
- Detect wildcard certificate risks
- Check certificate transparency logs
- Monitor certificate expiration

### Cryptographic Recommendations
- Suggest algorithm replacements
- Recommend key size upgrades
- Provide implementation guidance
- Map to compliance requirements
- Generate migration plans
- Prioritize remediation efforts

## Algorithm Assessment

### Symmetric Encryption
| Algorithm | Status | Recommendation |
|-----------|--------|----------------|
| AES-256-GCM | Approved | Preferred |
| AES-128-GCM | Approved | Acceptable |
| ChaCha20-Poly1305 | Approved | Preferred for mobile |
| AES-CBC | Caution | Use with HMAC |
| 3DES | Deprecated | Replace immediately |
| DES | Prohibited | Critical risk |

### Asymmetric Encryption
| Algorithm | Min Key Size | Recommendation |
|-----------|-------------|----------------|
| RSA | 2048-bit | 3072+ preferred |
| ECDSA | P-256 | P-384 preferred |
| Ed25519 | N/A | Recommended |

### Hash Functions
| Algorithm | Status | Use Case |
|-----------|--------|----------|
| SHA-256/384/512 | Approved | General use |
| SHA-3 | Approved | High security |
| BLAKE2 | Approved | Performance |
| SHA-1 | Deprecated | Legacy only |
| MD5 | Prohibited | Never use |

## Integrations

- **OpenSSL**: Cryptographic library analysis
- **testssl.sh**: TLS configuration testing
- **SSL Labs API**: Certificate and TLS analysis
- **Cryptographic libraries**: Language-specific crypto review
- **HSM interfaces**: Hardware security module validation

## Target Processes

- Cryptography and Key Management Process
- Security Code Review
- TLS Configuration Hardening
- Certificate Lifecycle Management

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "analysisType": {
      "type": "string",
      "enum": ["code-review", "tls-config", "certificate", "implementation", "compliance"],
      "description": "Type of cryptographic analysis"
    },
    "targetPath": {
      "type": "string",
      "description": "Path to code or configuration to analyze"
    },
    "endpoints": {
      "type": "array",
      "items": { "type": "string" },
      "description": "TLS endpoints to analyze"
    },
    "certificates": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Certificate files or URLs to analyze"
    },
    "languages": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Programming languages to analyze"
    },
    "complianceFrameworks": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["NIST", "FIPS-140-3", "PCI-DSS", "HIPAA", "FedRAMP"]
      }
    },
    "includeQuantumAssessment": {
      "type": "boolean",
      "description": "Include post-quantum readiness assessment"
    }
  },
  "required": ["analysisType"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "analysisId": {
      "type": "string"
    },
    "analysisType": {
      "type": "string"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    },
    "summary": {
      "type": "object",
      "properties": {
        "totalFindings": { "type": "integer" },
        "critical": { "type": "integer" },
        "high": { "type": "integer" },
        "medium": { "type": "integer" },
        "low": { "type": "integer" }
      }
    },
    "algorithmFindings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "algorithm": { "type": "string" },
          "usage": { "type": "string" },
          "status": { "type": "string", "enum": ["approved", "caution", "deprecated", "prohibited"] },
          "location": { "type": "string" },
          "recommendation": { "type": "string" }
        }
      }
    },
    "keySizeFindings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "algorithm": { "type": "string" },
          "currentSize": { "type": "string" },
          "minimumRequired": { "type": "string" },
          "recommendation": { "type": "string" }
        }
      }
    },
    "certificateFindings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "subject": { "type": "string" },
          "issuer": { "type": "string" },
          "validFrom": { "type": "string" },
          "validTo": { "type": "string" },
          "keySize": { "type": "string" },
          "issues": { "type": "array" }
        }
      }
    },
    "tlsFindings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "endpoint": { "type": "string" },
          "protocols": { "type": "array" },
          "cipherSuites": { "type": "array" },
          "grade": { "type": "string" },
          "issues": { "type": "array" }
        }
      }
    },
    "complianceStatus": {
      "type": "object"
    },
    "quantumReadiness": {
      "type": "object",
      "properties": {
        "atRiskAlgorithms": { "type": "array" },
        "migrationPriority": { "type": "string" },
        "recommendations": { "type": "array" }
      }
    },
    "remediationPlan": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "finding": { "type": "string" },
          "action": { "type": "string" },
          "priority": { "type": "string" },
          "effort": { "type": "string" }
        }
      }
    }
  }
}
```

## Usage Example

```javascript
skill: {
  name: 'crypto-analyzer',
  context: {
    analysisType: 'code-review',
    targetPath: './src',
    languages: ['Java', 'Python'],
    complianceFrameworks: ['NIST', 'PCI-DSS'],
    includeQuantumAssessment: true
  }
}
```
