---
name: ota-firmware-update
description: Over-the-air firmware update implementation expertise for embedded systems. Expert skill for delta updates, image signing, update protocols, partition management, and rollback mechanisms.
allowed-tools: Read, Grep, Write, Edit, Bash, Glob, WebFetch, WebSearch
---

# OTA Firmware Update Skill

Expert skill for over-the-air firmware update implementation in embedded systems. Provides expertise in update image generation, signing, transport protocols, partition management, and rollback mechanisms.

## Overview

The OTA Firmware Update skill enables comprehensive firmware update capabilities:
- Delta update generation (diff algorithms)
- Image signing and encryption
- Update manifest generation
- MCUboot configuration
- A/B partition management
- Rollback mechanism implementation
- Cloud integration (AWS IoT, Azure IoT Hub)
- Update progress and status reporting

## Capabilities

### 1. Update Image Generation

Generate firmware update images with metadata:

```javascript
// Example: Update image generation configuration
const imageConfig = {
  type: 'full',  // or 'delta'
  input: 'build/firmware.bin',
  output: 'release/firmware-v1.2.0.update',
  version: {
    major: 1,
    minor: 2,
    patch: 0,
    build: 456
  },
  compression: 'lz4',  // none, lz4, zlib, lzma
  encryption: {
    algorithm: 'aes-128-ctr',
    keyFile: 'keys/update-key.bin'
  }
};
```

### 2. Image Signing

Sign firmware images for secure boot chain:

```bash
# Sign image with MCUboot imgtool
imgtool sign \
  --key keys/signing-key.pem \
  --align 4 \
  --version 1.2.0 \
  --header-size 0x200 \
  --slot-size 0x60000 \
  --pad-header \
  build/firmware.bin \
  release/firmware-v1.2.0-signed.bin

# Verify signature
imgtool verify \
  --key keys/signing-key.pub.pem \
  release/firmware-v1.2.0-signed.bin
```

### 3. Delta Update Generation

Generate differential updates to minimize transfer size:

```javascript
// Delta update configuration
const deltaConfig = {
  baseVersion: 'v1.1.0',
  baseImage: 'releases/firmware-v1.1.0.bin',
  targetImage: 'build/firmware.bin',
  algorithm: 'bsdiff',  // bsdiff, xdelta, vcdiff
  output: 'patches/v1.1.0-to-v1.2.0.patch',
  metadata: {
    sourceVersion: '1.1.0',
    targetVersion: '1.2.0',
    sourceHash: 'sha256:...',
    targetHash: 'sha256:...'
  }
};

// Size comparison
// Full image: 245,760 bytes
// Delta patch: 12,340 bytes (95% reduction)
```

### 4. Update Manifest Generation

Generate update manifest with metadata:

```json
{
  "version": "1.2.0",
  "build": 456,
  "timestamp": "2026-01-24T10:30:00Z",
  "images": [
    {
      "slot": "primary",
      "type": "application",
      "file": "firmware-v1.2.0-signed.bin",
      "size": 245760,
      "hash": {
        "algorithm": "sha256",
        "value": "3b9d8a2f..."
      },
      "signature": {
        "algorithm": "ecdsa-p256",
        "value": "base64..."
      }
    }
  ],
  "compatibility": {
    "minBootloaderVersion": "1.0.0",
    "hardwareRevision": ["rev-a", "rev-b"],
    "requiredBaseVersion": "1.1.0"
  },
  "delta": {
    "available": true,
    "baseVersions": ["1.1.0", "1.0.0"],
    "files": {
      "1.1.0": "patches/v1.1.0-to-v1.2.0.patch"
    }
  },
  "releaseNotes": "Bug fixes and performance improvements"
}
```

### 5. Partition Management (A/B Scheme)

Configure A/B partition scheme for safe updates:

```c
/**
 * @brief Flash partition layout for A/B updates
 *
 * Partition    | Start      | Size   | Purpose
 * -------------|------------|--------|------------------
 * Bootloader   | 0x08000000 | 32KB   | MCUboot bootloader
 * Slot A       | 0x08008000 | 240KB  | Primary application
 * Slot B       | 0x08044000 | 240KB  | Secondary/staging
 * Scratch      | 0x08080000 | 64KB   | Swap scratch area
 * Config       | 0x08090000 | 16KB   | Persistent config
 */

typedef struct {
    uint32_t magic;           // Partition magic number
    uint8_t  image_ok;        // Image confirmed working
    uint8_t  copy_done;       // Swap operation complete
    uint16_t swap_type;       // None, Test, Revert, Permanent
    uint32_t version;         // Firmware version
    uint32_t crc32;           // Image CRC
} partition_header_t;
```

### 6. MCUboot Integration

Configure MCUboot for secure firmware updates:

```ini
# MCUboot configuration (prj.conf for Zephyr)
CONFIG_BOOTLOADER_MCUBOOT=y
CONFIG_MCUBOOT_SIGNATURE_KEY_FILE="keys/signing-key.pem"
CONFIG_MCUBOOT_ENCRYPTION_KEY_FILE="keys/encryption-key.pem"
CONFIG_MCUBOOT_EXTRA_IMGTOOL_ARGS="--pad --confirm"

# Image configuration
CONFIG_MCUBOOT_IMGTOOL_SIGN_VERSION="1.2.0"
CONFIG_MCUBOOT_GENERATE_UNSIGNED_IMAGE=n
CONFIG_MCUBOOT_GENERATE_CONFIRMED_IMAGE=y

# Update settings
CONFIG_MCUBOOT_SWAP_USING_SCRATCH=y
CONFIG_IMG_MANAGER=y
CONFIG_STREAM_FLASH=y
```

### 7. Rollback Mechanism

Implement automatic rollback on update failure:

```c
/**
 * @brief Firmware update state machine
 */
typedef enum {
    UPDATE_STATE_IDLE,           // No update in progress
    UPDATE_STATE_DOWNLOADING,    // Receiving update image
    UPDATE_STATE_VERIFYING,      // Verifying signature/hash
    UPDATE_STATE_APPLYING,       // Writing to flash
    UPDATE_STATE_PENDING_REBOOT, // Ready to boot new image
    UPDATE_STATE_TESTING,        // Running new image (not confirmed)
    UPDATE_STATE_CONFIRMED,      // Update successful
    UPDATE_STATE_REVERTING,      // Rolling back to previous
    UPDATE_STATE_FAILED          // Update failed
} update_state_t;

/**
 * @brief Confirm update after successful boot
 *
 * Must be called after new firmware boots successfully.
 * Failure to confirm within timeout triggers automatic rollback.
 *
 * @param timeout_ms  Confirmation timeout in milliseconds
 * @return OTA_OK on success, error code otherwise
 */
ota_status_t ota_confirm_update(uint32_t timeout_ms);

/**
 * @brief Trigger manual rollback to previous version
 *
 * @return OTA_OK if rollback initiated, error otherwise
 */
ota_status_t ota_rollback(void);
```

### 8. Cloud Integration

Integrate with IoT cloud platforms:

```javascript
// AWS IoT Jobs integration
const jobDocument = {
  operation: 'firmware-update',
  version: '1.2.0',
  files: {
    firmware: {
      url: 'https://firmware.s3.amazonaws.com/v1.2.0/firmware.bin',
      fileType: 'binary',
      size: 245760,
      sha256: '3b9d8a2f...'
    }
  },
  autoReboot: true,
  confirmationRequired: true
};

// Azure IoT Hub device twin update
const desiredProperties = {
  firmware: {
    version: '1.2.0',
    downloadUrl: 'https://blob.azure.com/firmware/v1.2.0.bin',
    checksum: 'sha256:3b9d8a2f...',
    updateTime: '2026-01-24T12:00:00Z'
  }
};
```

## Process Integration

This skill integrates with the following processes:

| Process | Integration Point |
|---------|-------------------|
| `ota-firmware-update.js` | Primary OTA implementation |
| `secure-boot-implementation.js` | Secure update chain |
| `bootloader-implementation.js` | Bootloader integration |

## Workflow

### 1. Setup Update Infrastructure

```bash
# Generate signing keys
imgtool keygen -k keys/signing-key.pem -t ecdsa-p256

# Extract public key for device
imgtool getpub -k keys/signing-key.pem > keys/signing-key.pub.pem

# Generate encryption key (optional)
openssl rand -hex 16 > keys/encryption-key.bin
```

### 2. Build Update Image

```bash
# Build firmware
west build -b nrf52840dk_nrf52840 app

# Sign with MCUboot
west sign -t imgtool \
  -- --key keys/signing-key.pem \
  --version 1.2.0

# Generate manifest
ota-tools manifest generate \
  --image build/zephyr/zephyr.signed.bin \
  --output release/manifest.json
```

### 3. Deploy Update

```bash
# Upload to S3 (AWS)
aws s3 cp release/ s3://firmware-bucket/v1.2.0/ --recursive

# Create IoT Job
aws iot create-job \
  --job-id firmware-update-v1.2.0 \
  --targets arn:aws:iot:region:account:thinggroup/devices \
  --document file://job-document.json
```

### 4. Monitor Progress

```javascript
// Device-side progress reporting
const updateStatus = {
  state: 'downloading',
  progress: 45,
  version: '1.2.0',
  details: {
    bytesReceived: 110592,
    totalBytes: 245760,
    downloadSpeed: 12500  // bytes/sec
  }
};

// Report to cloud
mqtt.publish('$aws/things/device-id/jobs/job-id/update',
  JSON.stringify(updateStatus));
```

## Output Schema

```json
{
  "updateImage": {
    "file": "firmware-v1.2.0-signed.bin",
    "size": 245760,
    "hash": "sha256:3b9d8a2f...",
    "version": "1.2.0",
    "signed": true,
    "encrypted": false
  },
  "deltaPatches": [
    {
      "fromVersion": "1.1.0",
      "file": "patches/v1.1.0-to-v1.2.0.patch",
      "size": 12340,
      "savings": "95%"
    }
  ],
  "manifest": {
    "file": "manifest.json",
    "timestamp": "2026-01-24T10:30:00Z"
  },
  "deployment": {
    "platform": "aws-iot",
    "jobId": "firmware-update-v1.2.0",
    "targetDevices": 1500
  },
  "artifacts": [
    "firmware-v1.2.0-signed.bin",
    "manifest.json",
    "patches/v1.1.0-to-v1.2.0.patch"
  ]
}
```

## Security Considerations

### Key Management
- Store signing keys in secure HSM or key vault
- Use separate keys for development and production
- Implement key rotation policy
- Never embed private keys in firmware

### Image Verification
- Always verify signature before applying update
- Verify hash after download completes
- Use hardware crypto acceleration when available
- Implement anti-rollback protection

### Transport Security
- Use TLS 1.2+ for all update downloads
- Implement certificate pinning
- Verify server certificates
- Use unique device credentials

## Best Practices

### Update Design
- Support delta updates to reduce bandwidth
- Implement progress reporting
- Handle partial downloads (resume support)
- Test rollback thoroughly

### Reliability
- Never interrupt flash operations
- Use wear leveling for update counters
- Implement power-loss protection
- Verify update before confirming

### Testing
- Test on all hardware revisions
- Verify rollback scenarios
- Test with various network conditions
- Validate full update lifecycle

## References

- MCUboot Documentation: https://docs.mcuboot.com/
- AWS IoT Jobs Developer Guide
- Azure IoT Hub Device Update
- TinyMCP for device integration
- Memfault OTA Best Practices

## MCP Server Integration

Compatible MCP servers:

| Server | Purpose |
|--------|---------|
| `tinymcp` | Device control via Golioth |
| `esp-rainmaker-mcp` | ESP32 RainMaker integration |
| `aws-iot-mcp` | AWS IoT Jobs management |

## See Also

- `ota-firmware-update.js` - OTA implementation process
- `secure-boot-implementation.js` - Secure boot setup
- `bootloader-implementation.js` - Bootloader development
- SK-016: Cryptographic Operations skill
- AG-005: Embedded Security Expert agent
- AG-009: Bootloader Expert agent
