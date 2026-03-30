# Key Management Orchestrator

Cryptographic key lifecycle management orchestration skill for secure key generation, rotation, distribution, and destruction.

## Overview

This skill orchestrates the complete cryptographic key lifecycle across key management systems including HashiCorp Vault, cloud provider KMS services, and hardware security modules. It ensures secure key handling, policy enforcement, and compliance with cryptographic standards.

## Key Features

- **Key Generation**: Create keys with proper entropy and algorithms
- **Rotation Management**: Automate and coordinate key rotations
- **Usage Tracking**: Monitor key operations and detect anomalies
- **Secure Destruction**: Verified key deletion with audit trails
- **HSM Integration**: Interface with hardware security modules
- **Compliance Auditing**: Generate audit reports and track violations

## Key Lifecycle Stages

1. Generation - Secure creation with proper entropy
2. Distribution - Secure transport to authorized systems
3. Activation - Enable for cryptographic operations
4. Use - Active cryptographic operations
5. Rotation - Scheduled replacement
6. Deactivation - Disable but retain
7. Destruction - Secure permanent deletion

## Key Types

| Type | Use Case | Typical Rotation |
|------|----------|------------------|
| Master Keys | KEKs | Annual |
| Data Keys | Encryption | Monthly |
| Signing Keys | Signatures | Annual |
| TLS Keys | Transport | Annual |
| API Keys | Auth | 90 days |

## Supported Systems

- HashiCorp Vault
- AWS KMS
- Azure Key Vault
- GCP Cloud KMS
- HSM (Thales Luna, AWS CloudHSM)

## Usage

```javascript
skill: {
  name: 'key-management-orchestrator',
  context: {
    operation: 'rotate',
    keyType: 'data',
    keyManagementSystem: 'vault',
    keyId: 'prod-encryption-key'
  }
}
```

## Related Processes

- Cryptography and Key Management Process
- Secrets Management
- Certificate Lifecycle Management
