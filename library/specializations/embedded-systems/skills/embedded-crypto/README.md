# Embedded Cryptographic Operations Skill

## Overview

The Embedded Crypto skill provides expert capabilities for implementing cryptographic operations in embedded systems. It covers hardware crypto accelerators, secure key storage, TrustZone configuration, and security best practices.

## Quick Start

### Prerequisites

1. MCU with crypto capabilities (AES, SHA, TRNG)
2. Crypto library (mbedTLS, wolfSSL, or vendor HAL)
3. Security requirements documented

### Basic Usage

```javascript
// In a babysitter process
const cryptoConfig = await ctx.task(configureCrypto, {
  mcu: 'STM32L5',
  features: {
    aes: { mode: 'gcm', keySize: 128 },
    sha: { algorithm: 'sha256' },
    trng: { enabled: true },
    trustzone: { enabled: true }
  },
  library: 'mbedtls'
});

console.log(`Hardware acceleration: ${cryptoConfig.implementation.hwAcceleration}`);
console.log(`TrustZone: ${cryptoConfig.cryptoCapabilities.trustzone}`);
```

## Features

### Hardware Crypto

- **AES acceleration**: CBC, CTR, GCM modes
- **SHA acceleration**: SHA-256, SHA-384, SHA-512
- **ECC acceleration**: ECDSA, ECDH (device dependent)
- **TRNG**: True random number generation

### Secure Key Storage

- **OTP fuses**: One-time programmable storage
- **TrustZone**: Secure world key isolation
- **Secure elements**: External HSM integration
- **Key derivation**: Session key generation

### TrustZone (ARMv8-M)

- **SAU configuration**: Security attribution
- **Secure APIs**: NSC function exports
- **Memory isolation**: Secure/non-secure separation
- **Peripheral protection**: Secure peripheral access

## Use Cases

### 1. Initialize Hardware Crypto

Set up hardware crypto acceleration:

```javascript
const result = await ctx.task(initHardwareCrypto, {
  mcu: 'STM32L562',
  peripherals: ['aes', 'sha256', 'trng'],
  dmaEnabled: true
});
```

### 2. Configure TrustZone

Set up secure/non-secure memory regions:

```javascript
const result = await ctx.task(configureTrustZone, {
  mcu: 'STM32L552',
  secureRegions: [
    { start: 0x08000000, size: 0x20000, type: 'flash' },
    { start: 0x20000000, size: 0x8000, type: 'ram' }
  ],
  nscRegion: { start: 0x0801F000, size: 0x1000 },
  securePeripherals: ['CRYP', 'RNG', 'FLASH']
});
```

### 3. Implement Secure Key Storage

Configure secure key storage:

```javascript
const result = await ctx.task(configureKeyStorage, {
  keys: [
    { name: 'device_key', algorithm: 'aes-128', location: 'otp' },
    { name: 'session_key', algorithm: 'aes-256', location: 'trustzone' },
    { name: 'signing_key', algorithm: 'ecdsa-p256', location: 'secure_flash' }
  ],
  derivation: {
    enabled: true,
    algorithm: 'hkdf-sha256'
  }
});
```

### 4. Generate Secure API

Create TrustZone secure functions:

```javascript
const result = await ctx.task(generateSecureAPI, {
  functions: [
    { name: 'secure_encrypt', params: ['data', 'length'], returns: 'int32_t' },
    { name: 'secure_sign', params: ['hash', 'signature'], returns: 'int32_t' },
    { name: 'secure_get_random', params: ['buffer', 'length'], returns: 'int32_t' }
  ],
  nscRegion: 0x0801F000,
  validation: true
});
```

## Configuration

### Crypto Configuration

```json
{
  "crypto": {
    "library": "mbedtls",
    "hwAcceleration": true,
    "algorithms": {
      "symmetric": ["aes-128-gcm", "aes-256-gcm"],
      "hash": ["sha256", "sha384"],
      "asymmetric": ["ecdsa-p256", "ecdh-p256"],
      "kdf": ["hkdf-sha256"]
    }
  },
  "trng": {
    "enabled": true,
    "healthTests": true,
    "reseedInterval": 1000
  },
  "keyStorage": {
    "primary": "trustzone",
    "backup": "encrypted_flash"
  }
}
```

### TrustZone Configuration

```json
{
  "trustzone": {
    "enabled": true,
    "sau": {
      "regions": [
        { "id": 0, "start": "0x00020000", "end": "0x0007FFFF", "secure": false },
        { "id": 1, "start": "0x20008000", "end": "0x2001FFFF", "secure": false },
        { "id": 2, "start": "0x0001F000", "end": "0x0001FFFF", "nsc": true }
      ]
    },
    "securePeripherals": ["CRYP", "RNG", "PKA", "FLASH_SEC"]
  }
}
```

## Output Format

### Crypto Assessment

```json
{
  "cryptoCapabilities": {
    "hardware": {
      "aes": { "supported": true, "modes": ["ecb", "cbc", "ctr", "gcm"] },
      "sha": { "supported": true, "algorithms": ["sha256", "sha384"] },
      "ecc": { "supported": true, "curves": ["p256"] },
      "trng": { "supported": true, "throughput": "40kbps" }
    },
    "trustzone": true,
    "secureElement": false
  },
  "recommendations": [
    "Enable AES-GCM hardware acceleration",
    "Use TrustZone for key isolation",
    "Implement TRNG health monitoring"
  ]
}
```

## Integration

### Library Integration

| Library | Features |
|---------|----------|
| mbedTLS | TLS, X.509, crypto primitives |
| wolfSSL | FIPS certified, small footprint |
| tinycrypt | Minimal, no malloc |
| Vendor HAL | Direct HW access |

### Process Integration

The Embedded Crypto skill integrates with:

- `secure-boot-implementation.js` - Boot verification
- `ota-firmware-update.js` - Update encryption
- `functional-safety-certification.js` - Security compliance

### Agent Integration

Works with:
- `embedded-security-expert` - Security architecture review

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| AES wrong output | Incorrect mode/IV | Verify algorithm parameters |
| TRNG not ready | Insufficient entropy | Wait for DRDY flag |
| TrustZone fault | Invalid NS access | Check SAU configuration |
| Signature fail | Key mismatch | Verify key pair |

### Security Checklist

- [ ] Hardware crypto enabled and tested
- [ ] TRNG health tests passing
- [ ] Keys stored in secure location
- [ ] TrustZone correctly configured
- [ ] Side-channel mitigations in place
- [ ] Crypto library up to date

## Security Best Practices

1. **Use hardware acceleration** - Better performance and security
2. **Isolate keys** - Use TrustZone or secure elements
3. **Validate inputs** - Check pointers from non-secure world
4. **Clear sensitive data** - Zeroize after use
5. **Test thoroughly** - Verify all crypto operations

## References

- [ARM TrustZone Documentation](https://developer.arm.com/ip-products/security-ip/trustzone)
- [mbedTLS Documentation](https://tls.mbed.org/api/)
- [PSA Crypto API](https://arm-software.github.io/psa-api/crypto/)
- NIST SP 800-90A (DRBG)
- NIST SP 800-56A (Key Agreement)

## See Also

- [SKILL.md](./SKILL.md) - Full skill definition
- [Secure Boot Implementation Process](../../secure-boot-implementation.js)
- [OTA Firmware Update Process](../../ota-firmware-update.js)
