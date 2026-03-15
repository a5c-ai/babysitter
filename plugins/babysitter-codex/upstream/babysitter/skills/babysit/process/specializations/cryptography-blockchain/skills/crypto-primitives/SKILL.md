---
name: crypto-primitives
description: Implementation and secure usage of cryptographic primitives including ECDSA, BLS, Schnorr signatures, key derivation, secret sharing, and constant-time operations. Provides guidance for secure cryptographic implementations in blockchain applications.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Cryptographic Primitives Skill

Expert implementation and usage of cryptographic primitives for blockchain and security applications.

## Capabilities

- **Digital Signatures**: ECDSA, BLS, Schnorr signature implementation and verification
- **Key Derivation**: BIP-32/39/44 hierarchical deterministic key generation
- **Threshold Cryptography**: Shamir secret sharing, threshold signatures
- **Hash Functions**: Secure usage of Keccak, Poseidon, MiMC, Pedersen
- **Commitments**: Pedersen commitments, hash commitments
- **Secure Randomness**: CSPRNG usage, VRF integration
- **Constant-Time Operations**: Side-channel resistant implementations

## Signature Schemes

### ECDSA (secp256k1)

Standard Ethereum signature scheme:

```javascript
import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';

// Sign message
const messageHash = keccak_256(message);
const signature = secp256k1.sign(messageHash, privateKey);

// Verify signature
const isValid = secp256k1.verify(signature, messageHash, publicKey);

// Recover public key from signature (Ethereum style)
const recoveredPubKey = signature.recoverPublicKey(messageHash);
```

### BLS Signatures (BLS12-381)

Aggregatable signatures for validator sets:

```javascript
import { bls12_381 } from '@noble/curves/bls12-381';

// Sign with BLS
const signature = bls12_381.sign(message, privateKey);

// Verify
const isValid = bls12_381.verify(signature, message, publicKey);

// Aggregate signatures
const aggregatedSig = bls12_381.aggregateSignatures([sig1, sig2, sig3]);
const aggregatedPubKeys = bls12_381.aggregatePublicKeys([pk1, pk2, pk3]);
const isValidAgg = bls12_381.verify(aggregatedSig, message, aggregatedPubKeys);
```

### Schnorr Signatures

BIP-340 compliant Schnorr signatures:

```javascript
import { schnorr } from '@noble/curves/secp256k1';

// Sign (returns 64-byte signature)
const signature = schnorr.sign(messageHash, privateKey);

// Verify
const isValid = schnorr.verify(signature, messageHash, publicKey);
```

## Key Derivation

### BIP-32 HD Wallet

```javascript
import { HDKey } from '@scure/bip32';
import { mnemonicToSeedSync } from '@scure/bip39';

// From mnemonic to seed
const seed = mnemonicToSeedSync(mnemonic);

// Create HD wallet
const hdkey = HDKey.fromMasterSeed(seed);

// Derive path (BIP-44 for Ethereum)
// m/44'/60'/0'/0/0
const child = hdkey
  .derive("m/44'/60'/0'/0")
  .deriveChild(0);

const privateKey = child.privateKey;
const publicKey = child.publicKey;
```

### BIP-39 Mnemonic

```javascript
import { generateMnemonic, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

// Generate new mnemonic (128 bits = 12 words, 256 bits = 24 words)
const mnemonic = generateMnemonic(wordlist, 256);

// Validate mnemonic
const isValid = validateMnemonic(mnemonic, wordlist);
```

## Secret Sharing

### Shamir's Secret Sharing

```javascript
import { split, combine } from 'shamir-secret-sharing';

// Split secret into 5 shares, requiring 3 to reconstruct
const shares = await split(secretBytes, 5, 3);

// Reconstruct with any 3 shares
const reconstructed = await combine([shares[0], shares[2], shares[4]]);
```

### Feldman VSS (Verifiable Secret Sharing)

```javascript
// Commitments allow verification without revealing secret
const { shares, commitments } = feldmanVSS.split(secret, n, t);

// Verify a share
const isValidShare = feldmanVSS.verifyShare(share, commitments);
```

## Hash Functions

### Ethereum-Specific

```javascript
import { keccak_256 } from '@noble/hashes/sha3';

// Ethereum address from public key
const publicKeyHash = keccak_256(publicKey.slice(1)); // Remove 0x04 prefix
const address = '0x' + publicKeyHash.slice(-20).toString('hex');
```

### ZK-Friendly Hashes

```javascript
// Poseidon hash (used in ZK circuits)
import { poseidon } from '@iden3/js-crypto';

const hash = poseidon([input1, input2, input3]);

// MiMC hash
import { mimcSponge } from 'circomlib';

const hash = mimcSponge.multiHash([input1, input2], key, numOutputs);
```

## Commitments

### Pedersen Commitment

```javascript
// commit(m, r) = g^m * h^r
// Hiding: cannot determine m from commitment
// Binding: cannot find m', r' where commit(m, r) = commit(m', r')

function pedersenCommit(m, r, g, h) {
  return g.multiply(m).add(h.multiply(r));
}

// Verify commitment
function verifyCommitment(commitment, m, r, g, h) {
  const expected = pedersenCommit(m, r, g, h);
  return commitment.equals(expected);
}
```

### Hash Commitment

```javascript
// Simple commit-reveal scheme
function commit(value, nonce) {
  return keccak256(abi.encodePacked(value, nonce));
}

function reveal(commitment, value, nonce) {
  return commitment === keccak256(abi.encodePacked(value, nonce));
}
```

## Constant-Time Operations

### Critical for Security

```javascript
// BAD: Timing attack vulnerable
function compareInsecure(a, b) {
  return a === b; // Short-circuits on first mismatch
}

// GOOD: Constant-time comparison
function compareSecure(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}
```

### Library Functions

```javascript
import { timingSafeEqual } from 'crypto';

// Use built-in constant-time comparison
const isEqual = timingSafeEqual(Buffer.from(a), Buffer.from(b));
```

## Secure Randomness

### CSPRNG Usage

```javascript
import { randomBytes } from '@noble/hashes/utils';

// Generate secure random bytes
const privateKey = randomBytes(32);

// For browser environments
const array = new Uint8Array(32);
crypto.getRandomValues(array);
```

### Chainlink VRF (On-chain)

```solidity
// Request randomness on-chain
function requestRandomness() external returns (uint256 requestId) {
    return COORDINATOR.requestRandomWords(
        keyHash,
        subscriptionId,
        requestConfirmations,
        callbackGasLimit,
        numWords
    );
}

function fulfillRandomWords(uint256, uint256[] memory randomWords) internal override {
    // Use randomWords[0] for provably fair randomness
}
```

## Process Integration

This skill integrates with:

- `cryptographic-protocol-implementation.js` - Full protocol design
- `hd-wallet-implementation.js` - Wallet key management
- `multi-signature-wallet.js` - Multi-sig schemes
- `threshold-signature-scheme.js` - TSS implementation
- `zk-circuit-development.js` - ZK-friendly primitives

## Security Guidelines

### DO

- Use audited cryptographic libraries (noble-curves, libsodium)
- Use constant-time operations for secret comparisons
- Securely generate and handle entropy
- Clear sensitive data from memory after use
- Use appropriate key lengths (256-bit for AES, secp256k1)

### DON'T

- Implement cryptographic algorithms from scratch
- Use Math.random() for security-critical operations
- Store private keys in plain text
- Reuse nonces in signature schemes
- Log or expose secret material

## Recommended Libraries

| Library | Purpose | URL |
|---------|---------|-----|
| **@noble/curves** | Elliptic curves (secp256k1, ed25519, BLS12-381) | [noble-curves](https://github.com/paulmillr/noble-curves) |
| **@noble/hashes** | Hash functions (SHA, Keccak, BLAKE) | [noble-hashes](https://github.com/paulmillr/noble-hashes) |
| **@scure/bip32** | HD key derivation | [scure-bip32](https://github.com/paulmillr/scure-bip32) |
| **@scure/bip39** | Mnemonic generation | [scure-bip39](https://github.com/paulmillr/scure-bip39) |
| **libsodium** | General-purpose crypto | [libsodium.js](https://github.com/nicktomlin/libsodium.js) |
| **circomlibjs** | ZK-friendly crypto | [circomlibjs](https://github.com/iden3/circomlibjs) |

## See Also

- `agents/crypto-engineer/AGENT.md` - Cryptographic implementation expert
- `skills/zk-circuits/SKILL.md` - Zero-knowledge circuits
- `references.md` - External cryptographic references
