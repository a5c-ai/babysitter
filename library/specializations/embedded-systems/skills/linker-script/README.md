# Linker Script Skill

## Overview

The Linker Script skill provides expert capabilities for creating and optimizing GNU linker scripts for embedded systems. It handles memory layout definition, section placement, multi-image linking, and advanced features like MPU region configuration.

## Quick Start

### Prerequisites

1. MCU datasheet or reference manual with memory map
2. GNU toolchain (arm-none-eabi-gcc or similar)
3. Project memory requirements analysis

### Basic Usage

```javascript
// In a babysitter process
const linkerConfig = await ctx.task(generateLinkerScript, {
  mcu: 'STM32F407VG',
  memoryMap: {
    flash: { origin: 0x08000000, length: 1048576 },
    ram: { origin: 0x20000000, length: 131072 },
    ccmram: { origin: 0x10000000, length: 65536 }
  },
  features: {
    bootloader: true,
    bootloaderSize: 32768,
    mpuSupport: true,
    otaSupport: true
  }
});

console.log(`Generated: ${linkerConfig.artifacts.join(', ')}`);
```

## Features

### Memory Layout Definition

- **Multi-region support**: Flash, RAM, CCMRAM, backup SRAM
- **Partition schemes**: Bootloader, application, OTA staging, configuration
- **Attribute specification**: Read, write, execute permissions

### Section Management

- **Standard sections**: .text, .rodata, .data, .bss
- **Custom sections**: RAM functions, DMA buffers, shared data
- **Alignment control**: Per-section and MPU-compatible alignment
- **KEEP directives**: Prevent garbage collection of critical sections

### Advanced Features

- **Multi-image linking**: Separate bootloader and application
- **Symbol export/import**: Inter-image communication
- **Overlay support**: Memory bank switching
- **Checksum placement**: Firmware validation support

## Use Cases

### 1. Basic Application Linker Script

Generate a standard linker script for a single application:

```javascript
const result = await ctx.task(generateBasicLinker, {
  mcu: 'STM32F103C8',
  stackSize: 4096,
  heapSize: 8192
});
```

### 2. Bootloader + Application

Generate linked scripts for bootloader and application:

```javascript
const result = await ctx.task(generateBootAppLinker, {
  mcu: 'STM32F407VG',
  bootloader: {
    size: 32768,
    sharedDataSize: 256
  },
  application: {
    startOffset: 32768
  }
});
```

### 3. OTA-Capable Layout

Generate a layout supporting over-the-air updates:

```javascript
const result = await ctx.task(generateOTALinker, {
  mcu: 'STM32L476RG',
  scheme: 'ab-swap',  // or 'ab-overwrite', 'single-bank'
  slots: {
    active: { size: 256 * 1024 },
    staging: { size: 256 * 1024 }
  }
});
```

### 4. MPU-Protected Regions

Generate linker script with MPU-aligned regions:

```javascript
const result = await ctx.task(generateMPULinker, {
  mcu: 'STM32F407VG',
  mpuRegions: [
    { name: 'stack', size: 4096, permissions: 'rw' },
    { name: 'heap', size: 8192, permissions: 'rw' },
    { name: 'peripheral', start: 0x40000000, size: 0x10000000, permissions: 'rw-device' }
  ]
});
```

## Configuration

### MCU Memory Specification

```json
{
  "mcu": {
    "family": "STM32F4",
    "model": "STM32F407VG",
    "memory": {
      "flash": {
        "origin": "0x08000000",
        "length": 1048576,
        "pageSize": 16384
      },
      "ram": {
        "origin": "0x20000000",
        "length": 131072
      },
      "ccmram": {
        "origin": "0x10000000",
        "length": 65536,
        "attributes": "rwx"
      },
      "bkpsram": {
        "origin": "0x40024000",
        "length": 4096
      }
    }
  }
}
```

### Partition Configuration

```json
{
  "partitions": {
    "bootloader": {
      "region": "flash",
      "offset": 0,
      "size": 32768
    },
    "application": {
      "region": "flash",
      "offset": 32768,
      "size": 491520
    },
    "config": {
      "region": "flash",
      "offset": 524288,
      "size": 8192,
      "attributes": "read-only"
    },
    "ota_staging": {
      "region": "flash",
      "offset": 532480,
      "size": 491520
    }
  }
}
```

## Output Files

### Generated Artifacts

| File | Description |
|------|-------------|
| `memory.ld` | Memory region definitions |
| `sections.ld` | Section definitions |
| `application.ld` | Main application linker script |
| `bootloader.ld` | Bootloader linker script |
| `memory-map.md` | Human-readable memory map documentation |

### Memory Map Documentation

```markdown
# Memory Map: STM32F407VG

## Flash Layout (1024 KB)

| Region | Start | End | Size | Usage |
|--------|-------|-----|------|-------|
| Bootloader | 0x08000000 | 0x08007FFF | 32 KB | Secure boot |
| Application | 0x08008000 | 0x0807FFFF | 480 KB | Main firmware |
| Config | 0x08080000 | 0x08081FFF | 8 KB | Settings |
| OTA Staging | 0x08082000 | 0x080FFFFF | 504 KB | Update image |

## RAM Layout (128 KB)

| Region | Start | End | Size | Usage |
|--------|-------|-----|------|-------|
| Data/BSS | 0x20000000 | 0x2001BFFF | 112 KB | Variables |
| Heap | 0x2001C000 | 0x2001DFFF | 8 KB | Dynamic memory |
| Stack | 0x2001E000 | 0x2001FFFF | 8 KB | Call stack |
```

## Integration

### Build System Integration

**CMake:**
```cmake
set(LINKER_SCRIPT ${CMAKE_SOURCE_DIR}/linker/application.ld)
target_link_options(${PROJECT_NAME} PRIVATE
    -T${LINKER_SCRIPT}
    -Wl,-Map=${PROJECT_NAME}.map
    -Wl,--gc-sections
)
```

**Makefile:**
```makefile
LDFLAGS += -T linker/application.ld
LDFLAGS += -Wl,-Map=$(BUILD_DIR)/$(TARGET).map
LDFLAGS += -Wl,--gc-sections
```

### Process Integration

The Linker Script skill integrates with these embedded systems processes:

- `memory-architecture-planning.js` - Memory layout design
- `bootloader-implementation.js` - Boot/app separation
- `bsp-development.js` - BSP configuration
- `code-size-optimization.js` - Size analysis

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Region overflow | Section too large | Increase region size or optimize code |
| Alignment error | MPU region misaligned | Ensure power-of-2 alignment |
| Missing symbol | Section garbage collected | Add KEEP() directive |
| Stack collision | Heap/stack overlap | Increase RAM or reduce allocations |

### Validation Commands

```bash
# Check binary sizes
arm-none-eabi-size firmware.elf

# Verify section placement
arm-none-eabi-objdump -h firmware.elf

# Analyze map file
grep "LOAD" build/firmware.map
grep ".text" build/firmware.map

# Check for overflow
arm-none-eabi-nm --size-sort firmware.elf | tail -20
```

## Best Practices

1. **Start with vendor templates** - Use STM32CubeMX or vendor-provided linker scripts as baseline
2. **Document all changes** - Comment magic numbers and custom sections
3. **Add overflow checks** - Use ASSERT to catch memory overflow at link time
4. **Align for MPU** - Plan regions with MPU constraints in mind
5. **Reserve space** - Leave headroom for future growth

## References

- [GNU LD Manual](https://sourceware.org/binutils/docs/ld/)
- [ARM Compiler Linker Reference](https://developer.arm.com/documentation)
- STM32 Linker Script Application Notes
- Zephyr Project Memory Configuration

## See Also

- [SKILL.md](./SKILL.md) - Full skill definition
- [Memory Architecture Planning Process](../../memory-architecture-planning.js)
- [Bootloader Implementation Process](../../bootloader-implementation.js)
