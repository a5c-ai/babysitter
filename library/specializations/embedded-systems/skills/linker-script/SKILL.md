---
name: linker-script
description: GNU linker script generation and optimization for embedded systems. Expert skill for memory layout definition, section placement, multi-image linking, and memory protection configuration.
allowed-tools: Read, Grep, Write, Edit, Bash, Glob
---

# Linker Script Skill

Expert skill for GNU linker script generation and optimization for embedded systems. Provides deep expertise in memory layout definition, section placement, symbol management, and advanced linking scenarios.

## Overview

The Linker Script skill enables comprehensive linker script development for embedded systems, supporting:
- Memory region definition for MCU targets
- Section placement and alignment configuration
- Symbol generation for bootloader/application interfaces
- Multi-image linking (bootloader + application)
- Overlay and bank switching support
- Custom section creation and management
- Fill pattern and checksum placement
- MPU-aligned region configuration

## Capabilities

### 1. Memory Region Definition

Define memory regions based on MCU specifications:

```ld
/* Example: STM32F407 Memory Layout */
MEMORY
{
  /* Flash memory regions */
  FLASH_BOOT (rx)  : ORIGIN = 0x08000000, LENGTH = 32K   /* Bootloader */
  FLASH_APP  (rx)  : ORIGIN = 0x08008000, LENGTH = 480K  /* Application */
  FLASH_DATA (r)   : ORIGIN = 0x08080000, LENGTH = 128K  /* Config/OTA */

  /* RAM regions */
  RAM        (rwx) : ORIGIN = 0x20000000, LENGTH = 128K  /* Main SRAM */
  CCMRAM     (rwx) : ORIGIN = 0x10000000, LENGTH = 64K   /* Core-coupled RAM */
  BKPSRAM    (rw)  : ORIGIN = 0x40024000, LENGTH = 4K    /* Backup SRAM */
}
```

### 2. Section Placement Configuration

Configure section placement with alignment requirements:

```ld
SECTIONS
{
  /* Vector table at flash start */
  .isr_vector :
  {
    . = ALIGN(4);
    KEEP(*(.isr_vector))
    . = ALIGN(4);
  } > FLASH_APP

  /* Code sections */
  .text :
  {
    . = ALIGN(4);
    *(.text)
    *(.text*)
    *(.glue_7)         /* ARM/Thumb interworking */
    *(.glue_7t)
    *(.eh_frame)

    KEEP(*(.init))
    KEEP(*(.fini))

    . = ALIGN(4);
    _etext = .;
  } > FLASH_APP

  /* Read-only data */
  .rodata :
  {
    . = ALIGN(4);
    *(.rodata)
    *(.rodata*)
    . = ALIGN(4);
  } > FLASH_APP
}
```

### 3. Symbol Generation

Generate symbols for firmware interfaces:

```ld
/* Symbols for bootloader/application interface */
PROVIDE(_app_start = ORIGIN(FLASH_APP));
PROVIDE(_app_end = ORIGIN(FLASH_APP) + LENGTH(FLASH_APP));
PROVIDE(_app_checksum = _app_end - 4);

/* Stack and heap boundaries */
PROVIDE(_estack = ORIGIN(RAM) + LENGTH(RAM));
PROVIDE(_Min_Heap_Size = 0x2000);  /* 8KB heap */
PROVIDE(_Min_Stack_Size = 0x1000); /* 4KB stack */

/* RAM function execution */
PROVIDE(_siramfunc = LOADADDR(.ramfunc));
PROVIDE(_sramfunc = ADDR(.ramfunc));
PROVIDE(_eramfunc = ADDR(.ramfunc) + SIZEOF(.ramfunc));
```

### 4. Multi-Image Linking

Support bootloader and application as separate images:

```ld
/* Bootloader linker script excerpt */
MEMORY
{
  FLASH_BOOT (rx) : ORIGIN = 0x08000000, LENGTH = 32K
  RAM (rwx)       : ORIGIN = 0x20000000, LENGTH = 128K
}

/* Shared data region for boot-to-app communication */
.shared_data (NOLOAD) :
{
  . = ALIGN(4);
  _shared_data_start = .;
  KEEP(*(.shared_data))
  . = ALIGN(4);
  _shared_data_end = .;
} > RAM

/* Application header location (known to bootloader) */
_app_header_addr = 0x08008000;
```

### 5. MPU Region Configuration

Define MPU-aligned memory regions:

```ld
/* MPU-aligned regions (power of 2 sizes, aligned to size) */
.mpu_region_stack (NOLOAD) :
{
  . = ALIGN(1024);  /* MPU minimum region size */
  _mpu_stack_start = .;
  . = . + 4096;     /* 4KB stack region */
  _mpu_stack_end = .;
} > RAM

.mpu_region_heap (NOLOAD) :
{
  . = ALIGN(8192);  /* 8KB aligned */
  _mpu_heap_start = .;
  . = . + 8192;
  _mpu_heap_end = .;
} > RAM
```

### 6. Overlay Support

Configure overlay sections for memory-constrained systems:

```ld
OVERLAY : NOCROSSREFS
{
  .overlay_a { *(.overlay_a) }
  .overlay_b { *(.overlay_b) }
  .overlay_c { *(.overlay_c) }
} > RAM AT > FLASH_APP

/* Overlay management symbols */
_overlay_a_load = LOADADDR(.overlay_a);
_overlay_b_load = LOADADDR(.overlay_b);
_overlay_c_load = LOADADDR(.overlay_c);
```

### 7. Checksum Placement

Configure checksum/CRC placement for firmware validation:

```ld
/* Reserved space for firmware checksum */
.checksum :
{
  . = ALIGN(4);
  _firmware_checksum = .;
  LONG(0xFFFFFFFF);  /* Placeholder, filled post-build */
  . = ALIGN(4);
} > FLASH_APP

/* Image length for checksum calculation */
_firmware_length = _firmware_checksum - ORIGIN(FLASH_APP);
```

## Process Integration

This skill integrates with the following processes:

| Process | Integration Point |
|---------|-------------------|
| `memory-architecture-planning.js` | Memory map design and validation |
| `bootloader-implementation.js` | Boot/app interface definition |
| `bsp-development.js` | BSP memory configuration |
| `code-size-optimization.js` | Section optimization analysis |

## Workflow

### 1. Gather MCU Specifications

```bash
# Extract memory map from datasheet or reference manual
# Key information needed:
# - Flash base address and size
# - RAM regions (main SRAM, CCMRAM, backup SRAM)
# - Peripheral memory regions
# - MPU region requirements
```

### 2. Define Memory Requirements

```markdown
## Memory Requirements Analysis

| Component | Flash | RAM | Notes |
|-----------|-------|-----|-------|
| Bootloader | 32K | 8K | Fixed location |
| Application | 480K | 96K | Main firmware |
| Config data | 8K | - | Non-volatile settings |
| OTA staging | 120K | - | A/B update support |

Total Flash: 640K / 1024K (62.5% utilized)
Total RAM: 104K / 128K (81.3% utilized)
```

### 3. Generate Linker Script

The skill generates a complete linker script based on requirements:

```bash
# Output files:
# - memory.ld       - Memory region definitions (included by main)
# - sections.ld     - Section definitions (included by main)
# - application.ld  - Main application linker script
# - bootloader.ld   - Bootloader linker script (if needed)
```

### 4. Validate Memory Usage

```bash
# Analyze binary size
arm-none-eabi-size firmware.elf

# Detailed map file analysis
arm-none-eabi-nm -S --size-sort firmware.elf

# Generate memory usage report
python scripts/analyze_map.py build/firmware.map
```

## Output Schema

```json
{
  "linkerScript": {
    "mainScript": "application.ld",
    "includes": ["memory.ld", "sections.ld"],
    "bootloaderScript": "bootloader.ld"
  },
  "memoryMap": {
    "flash": {
      "total": 1048576,
      "regions": [
        { "name": "FLASH_BOOT", "origin": "0x08000000", "length": 32768 },
        { "name": "FLASH_APP", "origin": "0x08008000", "length": 491520 }
      ]
    },
    "ram": {
      "total": 131072,
      "regions": [
        { "name": "RAM", "origin": "0x20000000", "length": 131072 }
      ]
    }
  },
  "symbols": {
    "exportedToBootloader": ["_app_start", "_app_end", "_app_checksum"],
    "importedFromBootloader": ["_shared_data"],
    "stackHeap": ["_estack", "_Min_Heap_Size", "_Min_Stack_Size"]
  },
  "validation": {
    "flashUtilization": 0.625,
    "ramUtilization": 0.813,
    "mpuCompatible": true,
    "warnings": []
  },
  "artifacts": [
    "application.ld",
    "bootloader.ld",
    "memory.ld",
    "sections.ld",
    "memory-map.md"
  ]
}
```

## Common Patterns

### RAM Functions (Execute from RAM)

```ld
/* Functions copied to RAM for execution (e.g., flash programming) */
.ramfunc :
{
  . = ALIGN(4);
  _sramfunc = .;
  *(.ramfunc)
  *(.ramfunc*)
  . = ALIGN(4);
  _eramfunc = .;
} > RAM AT > FLASH_APP

_siramfunc = LOADADDR(.ramfunc);
```

### Initialized Data (.data section)

```ld
.data :
{
  . = ALIGN(4);
  _sdata = .;
  *(.data)
  *(.data*)
  . = ALIGN(4);
  _edata = .;
} > RAM AT > FLASH_APP

_sidata = LOADADDR(.data);
```

### Zero-Initialized Data (.bss section)

```ld
.bss (NOLOAD) :
{
  . = ALIGN(4);
  _sbss = .;
  __bss_start__ = _sbss;
  *(.bss)
  *(.bss*)
  *(COMMON)
  . = ALIGN(4);
  _ebss = .;
  __bss_end__ = _ebss;
} > RAM
```

### Stack and Heap

```ld
/* User heap and stack */
._user_heap_stack (NOLOAD) :
{
  . = ALIGN(8);
  PROVIDE(end = .);
  PROVIDE(_end = .);
  . = . + _Min_Heap_Size;
  . = . + _Min_Stack_Size;
  . = ALIGN(8);
} > RAM

/* Verify sufficient space */
ASSERT((_estack - _ebss) >= (_Min_Heap_Size + _Min_Stack_Size),
       "Insufficient RAM for heap and stack")
```

## Best Practices

### Memory Alignment
- Align vector table to power of 2 (typically 256 or 512 bytes)
- Align code sections to 4 bytes for ARM
- Align MPU regions to their size (power of 2)
- Align DMA buffers to cache line size

### Section Organization
- Keep interrupt vector table at fixed location
- Place frequently executed code in faster memory
- Group related functions to minimize cache misses
- Use KEEP() for sections that might be garbage collected

### Safety
- Add ASSERT statements to catch memory overflow
- Define symbols for runtime stack checking
- Reserve space for checksum/signature
- Document all magic numbers

## References

- GNU LD Manual: https://sourceware.org/binutils/docs/ld/
- ARM Cortex-M Linker Scripts Application Note
- STM32 Linker Configuration Examples
- Zephyr Memory Configuration Documentation

## See Also

- `memory-architecture-planning.js` - Memory planning process
- `bootloader-implementation.js` - Bootloader development
- SK-010: Memory Analysis skill
- AG-001: Firmware Architect agent
