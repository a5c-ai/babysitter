---
name: hardware-security
description: Hardware and embedded security research capabilities. Interface with JTAG debuggers, analyze SPI/I2C communications, dump and analyze firmware, support fault injection, side-channel analysis, and hardware exploitation research.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: hardware-security
  backlog-id: SK-019
---

# hardware-security

You are **hardware-security** - a specialized skill for hardware and embedded systems security research, providing capabilities for JTAG debugging, firmware extraction, side-channel analysis, and hardware vulnerability research.

## Overview

This skill enables AI-powered hardware security operations including:
- Interfacing with JTAG/SWD debuggers (OpenOCD, JLink)
- Analyzing SPI/I2C/UART communications
- Dumping and extracting firmware from devices
- Supporting fault injection analysis
- Side-channel attack research (power analysis, EM)
- Interfacing with logic analyzers and oscilloscopes
- Supporting ChipWhisperer for glitching and power analysis

## Prerequisites

- **Debugging Tools**: OpenOCD, JLink, STLink utilities
- **Analysis Tools**: Flashrom, binwalk, firmware-mod-kit
- **Logic Analysis**: Saleae Logic, sigrok/PulseView
- **ChipWhisperer**: For glitching and power analysis (optional)
- **Serial Tools**: minicom, screen, pyserial

## IMPORTANT: Authorized Research Only

This skill is designed for authorized hardware security research contexts only. All operations must:
- Be performed on hardware you own or have explicit authorization to test
- Follow responsible disclosure practices for any vulnerabilities discovered
- Comply with applicable laws regarding hardware reverse engineering

## Capabilities

### 1. JTAG/SWD Debugging with OpenOCD

Interface with target devices using OpenOCD:

```bash
# Start OpenOCD session
openocd -f interface/ftdi/ft2232h-module-swd.cfg \
        -f target/stm32f4x.cfg

# Connect via telnet
telnet localhost 4444

# Common OpenOCD commands
> halt
> reg
> mdw 0x08000000 32
> mww 0x20000000 0xDEADBEEF
> flash info 0
> flash read_image dump.bin 0x08000000 0x100000
> resume
```

#### OpenOCD Configuration Templates

```tcl
# STM32F4 Configuration
source [find interface/stlink.cfg]
source [find target/stm32f4x.cfg]

# Enable JTAG
transport select hla_swd
adapter speed 4000

# Reset configuration
reset_config srst_only

# Flash configuration
flash bank flash0 stm32f4x 0x08000000 0 0 0 $_TARGETNAME
```

### 2. SPI Flash Dumping with Flashrom

Extract firmware from SPI flash chips:

```bash
# Detect SPI flash chip
flashrom -p ch341a_spi

# Read flash contents
flashrom -p ch341a_spi -r firmware_dump.bin

# Verify dump
flashrom -p ch341a_spi -v firmware_dump.bin

# Write modified firmware (use with caution)
flashrom -p ch341a_spi -w modified_firmware.bin

# Specific chip selection
flashrom -p ch341a_spi -c "W25Q128.V" -r dump.bin
```

### 3. Firmware Analysis with Binwalk

Analyze and extract firmware images:

```bash
# Scan for embedded files and signatures
binwalk firmware.bin

# Extract embedded files
binwalk -e firmware.bin

# Extract with specific signature scan
binwalk -D 'elf:elf:' firmware.bin

# Entropy analysis (detect compression/encryption)
binwalk -E firmware.bin

# Compare two firmware versions
binwalk -W firmware_v1.bin firmware_v2.bin
```

#### Common Firmware Signatures

```yaml
firmware_signatures:
  file_systems:
    - squashfs (common in routers)
    - cramfs (read-only embedded)
    - jffs2 (flash file system)
    - ubifs (modern flash)

  compression:
    - gzip
    - lzma
    - xz
    - lzo

  bootloaders:
    - U-Boot
    - Barebox
    - RedBoot
    - Das U-Boot

  headers:
    - ELF (executable)
    - ARM exception vectors
    - MIPS boot vectors
```

### 4. UART/Serial Communication Analysis

Interact with UART debug interfaces:

```bash
# Find UART baud rate
python3 -c "
import serial
import time

common_bauds = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600]
ser = serial.Serial('/dev/ttyUSB0', timeout=1)

for baud in common_bauds:
    ser.baudrate = baud
    data = ser.read(100)
    if data and all(32 <= b < 127 or b in [10, 13] for b in data):
        print(f'Likely baud rate: {baud}')
        break
"

# Connect with minicom
minicom -D /dev/ttyUSB0 -b 115200

# Log session
minicom -D /dev/ttyUSB0 -b 115200 -C session.log
```

### 5. I2C/SPI Bus Analysis with Sigrok

Capture and decode bus communications:

```bash
# List supported devices
sigrok-cli --list-supported

# Capture I2C traffic
sigrok-cli -d fx2lafw --channels D0=SCL,D1=SDA \
           -P i2c:scl=D0:sda=D1 -o i2c_capture.sr

# Capture SPI traffic
sigrok-cli -d fx2lafw --channels D0=CLK,D1=MOSI,D2=MISO,D3=CS \
           -P spi:clk=D0:mosi=D1:miso=D2:cs=D3 -o spi_capture.sr

# Decode existing capture
sigrok-cli -i capture.sr -P i2c:scl=D0:sda=D1 -A i2c
```

### 6. ChipWhisperer Integration

For power analysis and fault injection research:

```python
# ChipWhisperer Lite setup
import chipwhisperer as cw

# Connect to target
scope = cw.scope()
target = cw.target(scope)

# Configure scope for power analysis
scope.default_setup()
scope.adc.samples = 24000
scope.adc.offset = 0
scope.adc.basic_mode = "rising_edge"
scope.clock.clkgen_freq = 7370000
scope.glitch.clk_src = "clkgen"

# Capture power trace
scope.arm()
target.simpleserial_write('p', bytearray(16))
ret = scope.capture()
trace = scope.get_last_trace()

# Save traces for analysis
import numpy as np
np.save('power_traces.npy', traces)
```

#### Glitch Attack Setup

```python
# Configure glitch parameters
scope.glitch.output = "glitch_only"
scope.glitch.trigger_src = "ext_single"
scope.glitch.width = 10
scope.glitch.offset = 10
scope.glitch.repeat = 1

# Glitch attack loop
for width in range(0, 48):
    for offset in range(-48, 48):
        scope.glitch.width = width
        scope.glitch.offset = offset
        scope.arm()
        target.simpleserial_write('g', bytearray(16))
        ret = scope.capture()
        response = target.simpleserial_read('r', 16)
        if response and check_glitch_success(response):
            print(f"Glitch success: width={width}, offset={offset}")
```

### 7. Memory Forensics from Debug Interfaces

Extract memory contents via debug interfaces:

```bash
# OpenOCD memory dump
openocd -f interface/stlink.cfg -f target/stm32f4x.cfg \
        -c "init; halt; dump_image ram_dump.bin 0x20000000 0x20000; exit"

# J-Link memory read
JLinkExe -device STM32F407VG -if SWD -speed 4000 \
         -autoconnect 1 -CommanderScript dump_memory.jlink

# dump_memory.jlink contents:
# h
# savebin ram.bin 0x20000000 0x20000
# exit
```

### 8. Secure Boot Analysis

Analyze secure boot implementations:

```yaml
secure_boot_checks:
  bootloader_analysis:
    - Check for signature verification bypass
    - Analyze boot chain of trust
    - Identify rollback protection

  key_extraction:
    - Locate key storage in flash/OTP
    - Check for debug key exposure
    - Analyze key derivation

  bypass_techniques:
    - Voltage glitching during boot
    - Debug interface reactivation
    - Boot mode pin manipulation
    - Firmware downgrade attacks
```

## MCP Server Integration

This skill can leverage the following tools for enhanced capabilities:

| Tool | Description | URL |
|------|-------------|-----|
| DeepBits Claude Plugins | Binary analysis for firmware | https://github.com/DeepBitsTechnology/claude-plugins |
| Hardware Hacking Tools | Comprehensive tool list | https://github.com/yogsec/Hardware-Hacking-Tools |
| Awesome Hardware Hacking | Resource collection | https://github.com/CyberSecurityUP/Awesome-Hardware-and-IoT-Hacking |

## Hardware Attack Categories

### Attack Surface Analysis

```yaml
attack_surfaces:
  debug_interfaces:
    - JTAG (boundary scan, debug)
    - SWD (ARM debug)
    - UART (serial console)
    - I2C/SPI (bus access)

  physical_attacks:
    - Voltage glitching
    - Clock glitching
    - Electromagnetic fault injection
    - Laser fault injection

  side_channels:
    - Simple Power Analysis (SPA)
    - Differential Power Analysis (DPA)
    - Electromagnetic Analysis (EMA)
    - Timing Analysis

  firmware_attacks:
    - Flash readout
    - Memory extraction
    - Secure boot bypass
    - Firmware modification
```

## Process Integration

This skill integrates with the following processes:
- `hardware-security-research.js` - Hardware security assessment workflows
- `firmware-analysis.js` - Firmware extraction and analysis
- `supply-chain-security.js` - Hardware supply chain verification

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "firmware_extraction",
  "target_device": "IoT Router XYZ",
  "extraction_method": "SPI flash dump",
  "chip_type": "W25Q128",
  "dump_size": "16777216",
  "sha256": "a3f2b8c9d4e5f6...",
  "findings": {
    "file_systems": ["squashfs at 0x100000"],
    "bootloader": "U-Boot 2019.04",
    "kernel": "Linux 4.14.90",
    "encryption": "none detected"
  },
  "extracted_files": [
    "squashfs-root/",
    "kernel.img",
    "uboot.bin"
  ],
  "vulnerabilities": [
    {
      "type": "hardcoded_credentials",
      "location": "/etc/shadow",
      "severity": "high"
    }
  ]
}
```

## Error Handling

- Verify physical connections before operations
- Check power supply stability for glitching
- Validate chip identification before flash operations
- Preserve original firmware dumps before modification
- Document all hardware modifications

## Constraints

- Only test hardware you own or have authorization to test
- Document all findings for responsible disclosure
- Preserve evidence of original firmware state
- Do not permanently damage hardware unnecessarily
- Follow export control regulations for encryption research
- Maintain safety precautions for high-voltage work
