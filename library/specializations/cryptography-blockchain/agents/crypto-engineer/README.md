# Cryptographic Engineer Agent

## Overview

The Cryptographic Engineer agent provides senior-level expertise in implementing secure cryptographic systems for blockchain applications. This agent specializes in digital signatures, key management, threshold cryptography, and side-channel resistant implementations.

## When to Use This Agent

Use this agent for tasks requiring:

- **Key Management**: HD wallet implementation, key derivation, secure storage
- **Signature Schemes**: ECDSA, BLS, Schnorr, multi-signatures
- **Threshold Cryptography**: Secret sharing, distributed key generation, TSS
- **Security Review**: Cryptographic code audit, side-channel analysis
- **Protocol Design**: Custom cryptographic protocol specification

## Capabilities

### Implementation
- BIP-32/39/44 HD wallet derivation
- ECDSA signing and verification (secp256k1)
- BLS signature aggregation (BLS12-381)
- Schnorr signatures (BIP-340)
- Shamir secret sharing
- Threshold ECDSA/BLS

### Security Analysis
- Constant-time operation verification
- Side-channel vulnerability detection
- Entropy quality assessment
- Key material handling review

### Design
- Cryptographic protocol specification
- Threat model documentation
- Security architecture review

## Agent Interaction

### Assigning Tasks

When using this agent in orchestration:

```javascript
const task = defineTask({
  name: 'implement-hd-wallet',
  kind: 'agent',
  agent: {
    name: 'crypto-engineer',
    prompt: {
      role: 'Senior Cryptographic Engineer',
      task: 'Implement BIP-44 HD wallet for Ethereum',
      context: {
        framework: 'TypeScript',
        library: '@noble/curves',
        requirements: [
          'Support 12/24 word mnemonics',
          'Standard derivation path m/44\'/60\'/0\'/0/n',
          'Passphrase support'
        ]
      },
      instructions: [
        'Use @noble/curves for secp256k1',
        'Use @scure/bip32 and @scure/bip39',
        'Implement constant-time comparison',
        'Clear sensitive memory after use',
        'Include comprehensive tests'
      ],
      outputFormat: 'Implementation with security notes'
    }
  }
});
```

### Expected Output

```json
{
  "status": "completed",
  "deliverables": {
    "code": [
      "src/wallet/hdwallet.ts",
      "src/wallet/mnemonic.ts"
    ],
    "tests": [
      "tests/wallet/hdwallet.test.ts"
    ]
  },
  "securityAnalysis": {
    "threatsCovered": [
      "Memory exposure",
      "Timing attacks",
      "Weak entropy"
    ],
    "recommendations": [
      "Consider HSM integration for production",
      "Add rate limiting for derivation"
    ]
  }
}
```

## Process Integration

This agent is the primary assignee for:

| Process | Agent Role |
|---------|------------|
| `cryptographic-protocol-implementation.js` | Lead implementer |
| `hd-wallet-implementation.js` | Full implementation |
| `multi-signature-wallet.js` | Signature scheme design |
| `threshold-signature-scheme.js` | TSS protocol lead |

## Security Principles

The agent follows these security principles:

1. **Library-First**: Always use audited libraries
2. **Defense in Depth**: Multiple security layers
3. **Fail Secure**: Secure defaults, fail closed
4. **Minimal Exposure**: Limit key material lifetime
5. **Constant Time**: Side-channel resistant operations

## Common Use Cases

### 1. HD Wallet Implementation
```
Task: Implement secure HD wallet
Input: BIP standards, derivation paths
Output: Wallet module with tests
```

### 2. Multi-Signature Scheme
```
Task: Design 2-of-3 multi-sig
Input: Participants, threshold
Output: Protocol spec, implementation
```

### 3. Key Backup System
```
Task: Implement Shamir secret sharing backup
Input: Shares count, threshold
Output: Split/combine implementation
```

### 4. Cryptographic Code Review
```
Task: Review signing implementation
Input: Code path, threat model
Output: Security findings, fixes
```

## Related Resources

- [SKILL.md: crypto-primitives](../skills/crypto-primitives/SKILL.md)
- [Process: hd-wallet-implementation](../hd-wallet-implementation.js)
- [Process: threshold-signature-scheme](../threshold-signature-scheme.js)
- [Noble Cryptography](https://paulmillr.com/noble/)
