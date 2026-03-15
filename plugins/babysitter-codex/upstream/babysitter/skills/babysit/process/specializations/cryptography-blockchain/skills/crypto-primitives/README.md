# Cryptographic Primitives Skill

## Overview

The Cryptographic Primitives skill provides secure implementation guidance and best practices for cryptographic operations in blockchain applications. It covers digital signatures, key derivation, secret sharing, hash functions, and secure coding practices.

## Use Cases

### Wallet Development
- Implement HD wallet key derivation (BIP-32/39/44)
- Generate and manage mnemonics securely
- Handle private key storage and encryption

### Signature Schemes
- Implement ECDSA for Ethereum transactions
- Add BLS signatures for validator aggregation
- Integrate Schnorr signatures for efficiency

### Multi-Party Cryptography
- Implement Shamir secret sharing for key backup
- Set up threshold signature schemes
- Design secure multi-sig protocols

### Zero-Knowledge Applications
- Use ZK-friendly hash functions (Poseidon, MiMC)
- Implement Pedersen commitments
- Design privacy-preserving protocols

## Quick Start

### 1. Install Noble Cryptography Suite

```bash
npm install @noble/curves @noble/hashes @scure/bip32 @scure/bip39
```

### 2. Generate HD Wallet

```javascript
import { generateMnemonic, mnemonicToSeedSync } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { HDKey } from '@scure/bip32';

// Generate 24-word mnemonic
const mnemonic = generateMnemonic(wordlist, 256);

// Derive Ethereum account
const seed = mnemonicToSeedSync(mnemonic);
const hdkey = HDKey.fromMasterSeed(seed);
const account = hdkey.derive("m/44'/60'/0'/0/0");

console.log('Address:', computeAddress(account.publicKey));
```

### 3. Sign and Verify Message

```javascript
import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';

// Sign
const messageHash = keccak_256(message);
const signature = secp256k1.sign(messageHash, privateKey);

// Verify
const isValid = secp256k1.verify(signature, messageHash, publicKey);
```

## Integration with Processes

This skill supports:

| Process | Usage |
|---------|-------|
| `cryptographic-protocol-implementation.js` | Protocol design |
| `hd-wallet-implementation.js` | Key management |
| `multi-signature-wallet.js` | Multi-sig logic |
| `threshold-signature-scheme.js` | TSS schemes |
| `zk-circuit-development.js` | ZK primitives |

## Security Checklist

- [ ] Using audited cryptographic libraries
- [ ] Private keys never logged or exposed
- [ ] Constant-time comparison for secrets
- [ ] CSPRNG for all random generation
- [ ] Memory cleared after sensitive operations
- [ ] No custom cryptographic implementations
- [ ] Appropriate key lengths and algorithms

## Common Patterns

### Ethereum Address from Private Key

```javascript
import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';
import { bytesToHex } from '@noble/hashes/utils';

function privateKeyToAddress(privateKey) {
  // Get public key (uncompressed)
  const publicKey = secp256k1.getPublicKey(privateKey, false);

  // Remove 0x04 prefix and hash
  const hash = keccak_256(publicKey.slice(1));

  // Take last 20 bytes
  return '0x' + bytesToHex(hash.slice(-20));
}
```

### EIP-712 Typed Data Signing

```javascript
import { signTypedData } from 'viem';

const signature = await signTypedData({
  domain: {
    name: 'MyDApp',
    version: '1',
    chainId: 1,
    verifyingContract: '0x...'
  },
  types: {
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ]
  },
  primaryType: 'Permit',
  message: { owner, spender, value, nonce, deadline }
});
```

### Secure Key Storage

```javascript
import { scrypt } from '@noble/hashes/scrypt';
import { xchacha20poly1305 } from '@noble/ciphers/chacha';
import { randomBytes } from '@noble/hashes/utils';

function encryptPrivateKey(privateKey, password) {
  const salt = randomBytes(32);
  const nonce = randomBytes(24);

  // Derive encryption key from password
  const key = scrypt(password, salt, { N: 2**18, r: 8, p: 1, dkLen: 32 });

  // Encrypt
  const cipher = xchacha20poly1305(key, nonce);
  const encrypted = cipher.encrypt(privateKey);

  return { salt, nonce, encrypted };
}
```

## Output Schema

When used in process tasks:

```json
{
  "operation": "sign|verify|derive|encrypt|hash",
  "algorithm": "ecdsa-secp256k1|bls12-381|schnorr|...",
  "success": true,
  "result": {
    "signature": "0x...",
    "publicKey": "0x...",
    "address": "0x...",
    "hash": "0x..."
  },
  "securityNotes": [
    "Used constant-time comparison",
    "Key material cleared from memory"
  ]
}
```

## Resources

- [Noble Cryptography](https://paulmillr.com/noble/)
- [BIP-32 Specification](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)
- [BIP-39 Mnemonic Code](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [ECDSA Security](https://cryptobook.nakov.com/digital-signatures/ecdsa-sign-verify-messages)
