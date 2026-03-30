---
name: key-management-orchestrator
description: Cryptographic key lifecycle management orchestration including generation, rotation, and destruction across key management systems
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - WebFetch
---

# Key Management Orchestrator Skill

## Purpose

Orchestrate cryptographic key lifecycle management across key management systems, including key generation, distribution, rotation, destruction, and compliance monitoring.

## Capabilities

### Key Generation
- Generate cryptographic keys with proper entropy
- Create keys with appropriate algorithms and sizes
- Generate keys within HSM boundaries
- Create key pairs for asymmetric operations
- Generate derived keys using approved KDFs
- Document key generation metadata

### Key Rotation Management
- Define and enforce rotation policies
- Schedule automatic key rotations
- Execute zero-downtime rotations
- Coordinate multi-system rotations
- Maintain key version history
- Handle rotation rollbacks

### Key Usage Tracking
- Monitor key usage patterns
- Track encryption/decryption operations
- Identify unused or orphaned keys
- Detect anomalous usage patterns
- Measure key usage against policies
- Generate usage audit reports

### Key Destruction
- Execute secure key destruction
- Verify destruction completeness
- Document destruction certificates
- Handle key material in backups
- Manage crypto-shredding operations
- Maintain destruction audit trails

### HSM Integration
- Interface with hardware security modules
- Manage HSM key hierarchies
- Handle HSM backup and recovery
- Monitor HSM health and capacity
- Coordinate multi-HSM deployments
- Validate FIPS compliance

### Key Operations Auditing
- Log all key lifecycle events
- Generate compliance audit reports
- Track key custodian changes
- Document key ceremonies
- Monitor policy violations
- Support forensic investigations

## Key Types Managed

| Key Type | Use Case | Rotation Period |
|----------|----------|-----------------|
| Master Keys | Key encryption keys | Annual |
| Data Keys | Data encryption | Monthly |
| Signing Keys | Code/document signing | Annual |
| TLS Keys | Transport security | Annual |
| API Keys | Service authentication | 90 days |
| Session Keys | Ephemeral encryption | Per-session |

## Key Lifecycle Stages

1. **Generation**: Secure key creation with proper entropy
2. **Distribution**: Secure key transport to authorized systems
3. **Activation**: Key enabled for cryptographic operations
4. **Use**: Active cryptographic operations
5. **Rotation**: Scheduled key replacement
6. **Deactivation**: Key disabled but retained
7. **Destruction**: Secure permanent deletion

## Integrations

- **HashiCorp Vault**: Secrets and key management
- **AWS KMS**: Cloud key management service
- **Azure Key Vault**: Microsoft key management
- **GCP Cloud KMS**: Google key management
- **Thales Luna HSM**: Hardware security modules
- **AWS CloudHSM**: Cloud-based HSM

## Target Processes

- Cryptography and Key Management Process
- Secrets Management
- Certificate Lifecycle Management
- Data Encryption Key Management

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": ["generate", "rotate", "destroy", "audit", "policy-check", "inventory"],
      "description": "Key management operation"
    },
    "keyType": {
      "type": "string",
      "enum": ["master", "data", "signing", "tls", "api", "session"],
      "description": "Type of cryptographic key"
    },
    "algorithm": {
      "type": "string",
      "enum": ["AES-256", "RSA-2048", "RSA-4096", "ECDSA-P256", "ECDSA-P384", "Ed25519"],
      "description": "Cryptographic algorithm"
    },
    "keyManagementSystem": {
      "type": "string",
      "enum": ["vault", "aws-kms", "azure-keyvault", "gcp-kms", "hsm"],
      "description": "Target key management system"
    },
    "keyId": {
      "type": "string",
      "description": "Key identifier for operations on existing keys"
    },
    "rotationPolicy": {
      "type": "object",
      "properties": {
        "maxAge": { "type": "string" },
        "autoRotate": { "type": "boolean" },
        "notifyBefore": { "type": "string" }
      }
    },
    "destructionVerification": {
      "type": "boolean",
      "description": "Require destruction verification"
    },
    "complianceFrameworks": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["NIST", "FIPS-140-3", "PCI-DSS", "HIPAA", "SOC2"]
      }
    }
  },
  "required": ["operation"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "operationId": {
      "type": "string"
    },
    "operation": {
      "type": "string"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    },
    "keyInfo": {
      "type": "object",
      "properties": {
        "keyId": { "type": "string" },
        "keyType": { "type": "string" },
        "algorithm": { "type": "string" },
        "keySize": { "type": "integer" },
        "createdAt": { "type": "string" },
        "expiresAt": { "type": "string" },
        "version": { "type": "integer" },
        "status": { "type": "string", "enum": ["active", "inactive", "pending-destruction", "destroyed"] }
      }
    },
    "rotationStatus": {
      "type": "object",
      "properties": {
        "previousVersion": { "type": "integer" },
        "newVersion": { "type": "integer" },
        "rotatedAt": { "type": "string" },
        "affectedSystems": { "type": "array" },
        "rollbackAvailable": { "type": "boolean" }
      }
    },
    "destructionCertificate": {
      "type": "object",
      "properties": {
        "keyId": { "type": "string" },
        "destroyedAt": { "type": "string" },
        "method": { "type": "string" },
        "verificationHash": { "type": "string" },
        "witness": { "type": "string" }
      }
    },
    "auditReport": {
      "type": "object",
      "properties": {
        "period": { "type": "object" },
        "keysInventoried": { "type": "integer" },
        "rotationsCompleted": { "type": "integer" },
        "policyViolations": { "type": "integer" },
        "unusedKeys": { "type": "array" },
        "expiringKeys": { "type": "array" }
      }
    },
    "complianceStatus": {
      "type": "object",
      "properties": {
        "framework": { "type": "string" },
        "compliant": { "type": "boolean" },
        "findings": { "type": "array" }
      }
    },
    "recommendations": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```

## Usage Example

```javascript
skill: {
  name: 'key-management-orchestrator',
  context: {
    operation: 'rotate',
    keyType: 'data',
    keyManagementSystem: 'vault',
    keyId: 'prod-encryption-key',
    rotationPolicy: {
      maxAge: '90d',
      autoRotate: true,
      notifyBefore: '7d'
    }
  }
}
```
