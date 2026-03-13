---
name: embedded-crypto
description: Embedded cryptographic operations and secure element integration. Expert skill for hardware crypto accelerators, secure key storage, TrustZone configuration, and side-channel attack mitigation.
allowed-tools: Read, Grep, Write, Edit, Bash, Glob, WebFetch, WebSearch
---

# Embedded Cryptographic Operations Skill

Expert skill for cryptographic operations in embedded systems. Provides expertise in hardware crypto accelerators, secure key storage, TrustZone configuration, and security best practices.

## Overview

The Embedded Crypto skill enables secure cryptographic implementation in embedded systems:
- Hardware crypto accelerator usage
- AES/SHA/ECC implementation
- Secure key storage configuration
- TrustZone configuration (Cortex-M33/M55)
- Secure boot chain implementation
- Certificate management
- Random number generation (TRNG)
- Side-channel attack mitigation

## Capabilities

### 1. Hardware Crypto Accelerator Integration

Leverage hardware acceleration for cryptographic operations:

```c
/**
 * @brief Initialize hardware crypto accelerator
 *
 * Enables clock and configures the crypto peripheral for
 * accelerated AES, SHA, and random number generation.
 *
 * @return CRYPTO_OK on success
 */
crypto_status_t crypto_hw_init(void)
{
    // Enable peripheral clock
    RCC->AHB2ENR |= RCC_AHB2ENR_CRYPTEN;

    // Enable AES, SHA, and RNG modules
    CRYP->CR = CRYP_CR_ALGODIR | CRYP_CR_ALGOMODE_AES_CBC;

    // Configure for interrupt or DMA mode
    CRYP->CR |= CRYP_CR_CRYPEN;

    return CRYPTO_OK;
}

/**
 * @brief Hardware-accelerated AES-128 CBC encryption
 *
 * @param[in]  key        128-bit encryption key
 * @param[in]  iv         128-bit initialization vector
 * @param[in]  plaintext  Data to encrypt
 * @param[out] ciphertext Encrypted output
 * @param[in]  length     Data length (must be multiple of 16)
 *
 * @return CRYPTO_OK on success
 */
crypto_status_t crypto_aes128_cbc_encrypt(
    const uint8_t key[16],
    const uint8_t iv[16],
    const uint8_t *plaintext,
    uint8_t *ciphertext,
    size_t length
);
```

### 2. Secure Key Storage

Configure secure key storage mechanisms:

```c
/**
 * @brief Key storage locations and protection levels
 */
typedef enum {
    KEY_STORAGE_RAM,          // Volatile, cleared on reset
    KEY_STORAGE_OTP,          // One-time programmable fuses
    KEY_STORAGE_SECURE_FLASH, // Encrypted flash with RDP
    KEY_STORAGE_TRUSTZONE,    // TrustZone secure region
    KEY_STORAGE_HSM,          // External secure element
} key_storage_t;

/**
 * @brief Key attributes for secure storage
 */
typedef struct {
    uint32_t id;              // Key identifier
    key_storage_t location;   // Storage location
    uint32_t algorithm;       // Key algorithm (AES, ECC, etc.)
    uint16_t bits;            // Key size in bits
    uint32_t usage;           // Allowed operations (encrypt, sign, etc.)
    uint32_t lifetime;        // Persistent or volatile
    uint8_t exportable;       // Can key be exported
} key_attributes_t;

/**
 * @brief Import key into secure storage
 *
 * @param[in]  attributes  Key attributes
 * @param[in]  data        Key material
 * @param[in]  length      Key length
 * @param[out] key_id      Assigned key ID
 *
 * @return CRYPTO_OK on success
 */
crypto_status_t secure_key_import(
    const key_attributes_t *attributes,
    const uint8_t *data,
    size_t length,
    uint32_t *key_id
);
```

### 3. TrustZone Configuration (ARMv8-M)

Configure TrustZone for secure/non-secure separation:

```c
/**
 * @brief TrustZone memory region configuration
 *
 * Memory Map with TrustZone:
 *
 * Address Range       | Security | Purpose
 * --------------------|----------|------------------
 * 0x00000000-0x0001FFFF | Secure  | Secure bootloader
 * 0x00020000-0x0007FFFF | NS      | Non-secure app
 * 0x10000000-0x1000FFFF | Secure  | Secure code/data
 * 0x20000000-0x20007FFF | Secure  | Secure RAM
 * 0x20008000-0x2001FFFF | NS      | Non-secure RAM
 * 0x40000000-0x4FFFFFFF | NS-call | Peripherals (SAU)
 */

/**
 * @brief Configure SAU regions for TrustZone
 */
void sau_configure(void)
{
    // Region 0: Non-secure flash (application)
    SAU->RNR = 0;
    SAU->RBAR = 0x00020000U;  // Base address
    SAU->RLAR = 0x0007FFFFU | SAU_RLAR_ENABLE_Msk;  // Non-secure

    // Region 1: Non-secure RAM
    SAU->RNR = 1;
    SAU->RBAR = 0x20008000U;
    SAU->RLAR = 0x2001FFFFU | SAU_RLAR_ENABLE_Msk;

    // Region 2: Non-secure callable (NSC) for secure API
    SAU->RNR = 2;
    SAU->RBAR = 0x0001F000U;
    SAU->RLAR = 0x0001FFFFU | SAU_RLAR_NSC_Msk | SAU_RLAR_ENABLE_Msk;

    // Enable SAU
    SAU->CTRL = SAU_CTRL_ENABLE_Msk;
}

/**
 * @brief Secure function exposed to non-secure world
 *
 * @note Function must be in NSC region
 */
__attribute__((cmse_nonsecure_entry))
int32_t secure_encrypt(uint8_t *data, size_t length)
{
    // Validate non-secure pointer
    if (cmse_check_address_range(data, length, CMSE_AU_NONSECURE) == NULL) {
        return CRYPTO_ERR_INVALID_PARAM;
    }

    // Perform encryption in secure world
    return crypto_aes128_encrypt_internal(data, length);
}
```

### 4. True Random Number Generation

Implement secure random number generation:

```c
/**
 * @brief Initialize hardware TRNG
 *
 * Configures the true random number generator with
 * health tests and conditioning.
 *
 * @return CRYPTO_OK on success, error if health test fails
 */
crypto_status_t trng_init(void)
{
    // Enable RNG clock
    RCC->AHB2ENR |= RCC_AHB2ENR_RNGEN;

    // Configure health tests
    RNG->CR |= RNG_CR_CED;  // Clock error detection
    RNG->CR |= RNG_CR_RNG_CONFIG3;  // Conditioning

    // Enable RNG
    RNG->CR |= RNG_CR_RNGEN;

    // Wait for first random number and verify
    if (!trng_health_test()) {
        return CRYPTO_ERR_HEALTH_TEST;
    }

    return CRYPTO_OK;
}

/**
 * @brief Generate cryptographically secure random bytes
 *
 * @param[out] output  Buffer to fill with random data
 * @param[in]  length  Number of random bytes to generate
 *
 * @return CRYPTO_OK on success
 *
 * @note Blocks until sufficient entropy available
 */
crypto_status_t trng_generate(uint8_t *output, size_t length);
```

### 5. Certificate Management

Handle X.509 certificates for device identity:

```c
/**
 * @brief Device certificate chain
 *
 * Chain structure:
 * 1. Device certificate (leaf)
 * 2. Intermediate CA certificate
 * 3. Root CA certificate (optional, often trusted by peer)
 */
typedef struct {
    uint8_t *device_cert;
    size_t device_cert_len;
    uint8_t *intermediate_cert;
    size_t intermediate_cert_len;
    uint8_t *root_cert;
    size_t root_cert_len;
} cert_chain_t;

/**
 * @brief Verify certificate chain validity
 *
 * @param[in] chain     Certificate chain to verify
 * @param[in] trusted   Trusted root certificates
 *
 * @return CRYPTO_OK if valid, error code otherwise
 */
crypto_status_t cert_verify_chain(
    const cert_chain_t *chain,
    const cert_store_t *trusted
);

/**
 * @brief Extract public key from certificate
 *
 * @param[in]  cert      DER-encoded certificate
 * @param[in]  cert_len  Certificate length
 * @param[out] pubkey    Extracted public key
 *
 * @return CRYPTO_OK on success
 */
crypto_status_t cert_get_public_key(
    const uint8_t *cert,
    size_t cert_len,
    public_key_t *pubkey
);
```

### 6. Side-Channel Attack Mitigation

Implement countermeasures against side-channel attacks:

```c
/**
 * @brief Side-channel resistant comparison
 *
 * Compares two buffers in constant time to prevent
 * timing attacks.
 *
 * @param[in] a       First buffer
 * @param[in] b       Second buffer
 * @param[in] length  Number of bytes to compare
 *
 * @return 0 if equal, non-zero otherwise
 */
int crypto_compare_constant_time(
    const uint8_t *a,
    const uint8_t *b,
    size_t length
)
{
    uint8_t result = 0;
    for (size_t i = 0; i < length; i++) {
        result |= a[i] ^ b[i];
    }
    return result;
}

/**
 * @brief AES with masking countermeasure
 *
 * Applies random masking to intermediate values
 * to protect against DPA attacks.
 */
typedef struct {
    uint8_t key_masked[16];
    uint8_t mask[16];
    uint8_t state_mask[16];
} aes_masked_ctx_t;

/**
 * @brief Initialize AES with random mask
 */
crypto_status_t aes_masked_init(
    aes_masked_ctx_t *ctx,
    const uint8_t key[16]
)
{
    // Generate random mask
    trng_generate(ctx->mask, 16);

    // XOR key with mask
    for (int i = 0; i < 16; i++) {
        ctx->key_masked[i] = key[i] ^ ctx->mask[i];
    }

    return CRYPTO_OK;
}
```

## Process Integration

This skill integrates with the following processes:

| Process | Integration Point |
|---------|-------------------|
| `secure-boot-implementation.js` | Crypto verification and signing |
| `functional-safety-certification.js` | Security certification aspects |
| `ota-firmware-update.js` | Update encryption and signing |

## Workflow

### 1. Security Requirements Analysis

```markdown
## Security Requirements Checklist

- [ ] Identify assets to protect (keys, data, code)
- [ ] Determine threat model (local, network, physical)
- [ ] Select appropriate algorithms (AES-128/256, ECC P-256)
- [ ] Define key management strategy
- [ ] Plan for side-channel resistance
- [ ] Identify certification requirements (PSA, SESIP, CC)
```

### 2. Hardware Capability Assessment

```bash
# Check for crypto accelerator
grep -i "crypto\|aes\|sha\|rng" device_datasheet.pdf

# Verify TrustZone support (Cortex-M33/M55)
arm-none-eabi-gcc -mcpu=cortex-m33 -print-multi-lib | grep cmse
```

### 3. Implementation

```c
// Initialize crypto subsystem
crypto_hw_init();
trng_init();

// Import device key
key_attributes_t attr = {
    .algorithm = KEY_ALG_AES,
    .bits = 128,
    .usage = KEY_USAGE_ENCRYPT | KEY_USAGE_DECRYPT,
    .location = KEY_STORAGE_TRUSTZONE
};
secure_key_import(&attr, device_key, 16, &key_id);

// Configure TrustZone (if available)
sau_configure();
```

### 4. Security Testing

```bash
# Run static analysis for crypto issues
cppcheck --enable=security src/crypto/

# Check for timing vulnerabilities
python tools/timing_analysis.py build/firmware.elf

# Verify random number quality
python tools/rng_test_suite.py
```

## Output Schema

```json
{
  "cryptoCapabilities": {
    "hardware": {
      "aes": true,
      "sha": true,
      "ecc": false,
      "trng": true
    },
    "trustzone": true,
    "secureElement": false
  },
  "keyManagement": {
    "storageLocations": ["otp", "trustzone"],
    "algorithms": ["aes-128-gcm", "ecdsa-p256"],
    "keyCount": 5
  },
  "implementation": {
    "library": "mbedtls",
    "hwAcceleration": true,
    "sideChannelProtection": true
  },
  "compliance": {
    "psaLevel": 1,
    "certifications": ["PSA Certified Level 1"]
  },
  "artifacts": [
    "src/crypto/crypto_hal.c",
    "src/crypto/trustzone_config.c",
    "src/crypto/key_storage.c",
    "docs/security-architecture.md"
  ]
}
```

## Security Best Practices

### Key Management
- Never store keys in plaintext in flash
- Use OTP fuses for root keys
- Implement key derivation for session keys
- Zeroize keys after use

### Algorithm Selection
- Use AES-GCM for authenticated encryption
- Use ECDSA P-256 for signatures
- Use SHA-256 minimum for hashing
- Avoid deprecated algorithms (DES, MD5, SHA-1)

### Implementation
- Use vetted crypto libraries (mbedTLS, wolfSSL)
- Enable hardware acceleration when available
- Implement constant-time operations
- Clear sensitive data from memory

### Testing
- Verify TRNG output quality
- Test for timing vulnerabilities
- Validate certificate handling
- Audit crypto configurations

## References

- ARM TrustZone for ARMv8-M
- mbedTLS Documentation: https://tls.mbed.org/
- wolfSSL Manual: https://www.wolfssl.com/docs/
- PSA Certified: https://www.psacertified.org/
- NIST Cryptographic Standards

## See Also

- `secure-boot-implementation.js` - Secure boot process
- `ota-firmware-update.js` - Secure updates
- SK-015: OTA Update skill
- AG-005: Embedded Security Expert agent
