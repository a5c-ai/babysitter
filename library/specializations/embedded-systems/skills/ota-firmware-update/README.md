# OTA Firmware Update Skill

## Overview

The OTA Firmware Update skill provides expert capabilities for implementing over-the-air firmware update systems in embedded devices. It covers the complete update lifecycle from image generation to deployment and rollback.

## Quick Start

### Prerequisites

1. MCUboot or compatible bootloader
2. Signing keys (ECDSA P-256 recommended)
3. Flash partitioning configured
4. Network connectivity for OTA

### Basic Usage

```javascript
// In a babysitter process
const otaResult = await ctx.task(generateUpdateImage, {
  firmware: 'build/firmware.bin',
  version: '1.2.0',
  signingKey: 'keys/signing-key.pem',
  options: {
    compression: 'lz4',
    generateDelta: true,
    baseVersions: ['1.1.0', '1.0.0']
  }
});

console.log(`Update image: ${otaResult.updateImage.file}`);
console.log(`Size: ${otaResult.updateImage.size} bytes`);
console.log(`Delta savings: ${otaResult.deltaPatches[0].savings}`);
```

## Features

### Image Generation

- **Full images**: Complete firmware images
- **Delta updates**: Differential patches for bandwidth savings
- **Compression**: LZ4, ZLIB, LZMA support
- **Encryption**: AES-128/256 for secure transport

### Security

- **Code signing**: ECDSA, RSA, Ed25519 signatures
- **Hash verification**: SHA-256/384/512 integrity checks
- **Anti-rollback**: Version number enforcement
- **Secure transport**: TLS-based download

### Deployment

- **A/B partitioning**: Safe swap-based updates
- **Rollback**: Automatic revert on failure
- **Progress tracking**: Real-time status reporting
- **Cloud integration**: AWS IoT, Azure IoT Hub

## Use Cases

### 1. Generate Signed Update Image

Create a signed firmware update image:

```javascript
const result = await ctx.task(signFirmwareImage, {
  input: 'build/firmware.bin',
  output: 'release/firmware-signed.bin',
  key: 'keys/signing-key.pem',
  version: '1.2.0',
  headerSize: 0x200,
  slotSize: 0x60000
});
```

### 2. Generate Delta Update

Create differential update patch:

```javascript
const result = await ctx.task(generateDeltaUpdate, {
  baseImage: 'releases/v1.1.0/firmware.bin',
  targetImage: 'build/firmware.bin',
  algorithm: 'bsdiff',
  output: 'patches/v1.1.0-to-v1.2.0.patch'
});

// Result: 95% size reduction (12KB vs 245KB)
```

### 3. Configure MCUboot

Set up MCUboot for A/B updates:

```javascript
const result = await ctx.task(configureMCUboot, {
  board: 'nrf52840dk_nrf52840',
  partitions: {
    bootloader: { size: 32768 },
    slotA: { size: 245760 },
    slotB: { size: 245760 },
    scratch: { size: 65536 }
  },
  signing: {
    keyFile: 'keys/signing-key.pem',
    algorithm: 'ecdsa-p256'
  }
});
```

### 4. Deploy to AWS IoT

Deploy update to fleet via AWS IoT Jobs:

```javascript
const result = await ctx.task(deployAWSIoT, {
  imageUrl: 's3://firmware/v1.2.0/firmware.bin',
  version: '1.2.0',
  targets: 'arn:aws:iot:us-east-1:123456:thinggroup/production',
  rolloutConfig: {
    maximumPerMinute: 100,
    exponentialRate: {
      baseRatePerMinute: 10,
      incrementFactor: 2,
      rateIncreaseCriteria: { numberOfSucceededThings: 100 }
    }
  }
});
```

## Configuration

### Partition Layout

```json
{
  "partitions": {
    "bootloader": {
      "offset": "0x08000000",
      "size": 32768,
      "type": "bootloader"
    },
    "primary": {
      "offset": "0x08008000",
      "size": 245760,
      "type": "application"
    },
    "secondary": {
      "offset": "0x08044000",
      "size": 245760,
      "type": "staging"
    },
    "scratch": {
      "offset": "0x08080000",
      "size": 65536,
      "type": "scratch"
    }
  }
}
```

### Signing Configuration

```json
{
  "signing": {
    "algorithm": "ecdsa-p256",
    "keyFile": "keys/signing-key.pem",
    "hashAlgorithm": "sha256"
  },
  "encryption": {
    "enabled": true,
    "algorithm": "aes-128-ctr",
    "keyFile": "keys/encryption-key.bin"
  },
  "antiRollback": {
    "enabled": true,
    "securityCounter": 5
  }
}
```

## Output Format

### Update Package

```json
{
  "updateImage": {
    "file": "firmware-v1.2.0-signed.bin",
    "size": 245760,
    "hash": "sha256:3b9d8a2f...",
    "signature": "base64:...",
    "version": "1.2.0"
  },
  "manifest": {
    "version": "1.2.0",
    "timestamp": "2026-01-24T10:30:00Z",
    "compatibility": {
      "minBootloader": "1.0.0",
      "hardware": ["rev-a", "rev-b"]
    }
  },
  "delta": {
    "available": true,
    "patches": [
      {
        "fromVersion": "1.1.0",
        "file": "v1.1.0-to-v1.2.0.patch",
        "size": 12340
      }
    ]
  }
}
```

## Integration

### Cloud Platforms

| Platform | Features |
|----------|----------|
| AWS IoT | Jobs, Device Defender, S3 storage |
| Azure IoT Hub | Device Update, ADU agent |
| Golioth | TinyMCP integration, OTA service |
| Particle | Fleet management, OTA updates |

### Process Integration

The OTA Firmware Update skill integrates with:

- `ota-firmware-update.js` - Full OTA workflow
- `secure-boot-implementation.js` - Secure boot chain
- `bootloader-implementation.js` - Bootloader setup

### Agent Integration

Works with:
- `embedded-security-expert` - Security review
- `bootloader-expert` - Bootloader configuration

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Signature verification failed | Wrong key or corrupted image | Verify key matches, re-sign |
| Update rejected | Version rollback | Increment version number |
| Flash write error | Power loss during update | Implement power-loss recovery |
| Rollback loop | App not confirming update | Add confirmation call |

### Verification Checklist

- [ ] Signing key generated and secured
- [ ] Partitions correctly sized
- [ ] MCUboot configured properly
- [ ] Test update on development device
- [ ] Rollback tested and working

## Security Best Practices

1. **Protect signing keys** - Use HSM or secure key storage
2. **Verify everything** - Check signature, hash, and version
3. **Use secure transport** - TLS 1.2+ with certificate pinning
4. **Implement anti-rollback** - Prevent downgrade attacks
5. **Test thoroughly** - Verify full update lifecycle

## References

- [MCUboot Documentation](https://docs.mcuboot.com/)
- [AWS IoT Jobs](https://docs.aws.amazon.com/iot/latest/developerguide/iot-jobs.html)
- [Azure Device Update](https://docs.microsoft.com/en-us/azure/iot-hub-device-update/)
- [Golioth OTA Guide](https://docs.golioth.io/firmware/ota/)
- TinyMCP MCP Server

## See Also

- [SKILL.md](./SKILL.md) - Full skill definition
- [OTA Firmware Update Process](../../ota-firmware-update.js)
- [Secure Boot Implementation](../../secure-boot-implementation.js)
