# Hardware Security Skill

## Overview

The `hardware-security` skill provides capabilities for hardware and embedded systems security research, including JTAG debugging, firmware extraction, side-channel analysis, and hardware vulnerability research.

## Quick Start

### Prerequisites

1. **Debugging Tools** - OpenOCD, JLink, STLink utilities
2. **Flash Tools** - Flashrom, binwalk
3. **Logic Analyzer** - Saleae Logic or compatible with sigrok
4. **Serial Adapter** - USB-to-UART adapter
5. **ChipWhisperer** - For advanced power analysis (optional)

### Installation

The skill is included in the babysitter-sdk. Install required tools:

```bash
# Install OpenOCD
sudo apt install openocd

# Install Flashrom
sudo apt install flashrom

# Install Binwalk
pip install binwalk

# Install Sigrok/PulseView
sudo apt install sigrok sigrok-cli pulseview

# Install ChipWhisperer (optional)
pip install chipwhisperer
```

## Usage

### Basic Operations

```bash
# Dump firmware via SPI flash
/skill hardware-security flash-dump --programmer ch341a_spi --output firmware.bin

# Analyze firmware image
/skill hardware-security analyze-firmware --input firmware.bin

# Connect to JTAG target
/skill hardware-security jtag-connect --interface stlink --target stm32f4x

# Capture UART traffic
/skill hardware-security uart-capture --port /dev/ttyUSB0 --baud 115200
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(hardwareSecurityTask, {
  operation: 'firmware-extraction',
  method: 'spi-flash',
  programmer: 'ch341a_spi',
  outputPath: './dumps/firmware.bin'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **JTAG/SWD Debugging** | OpenOCD, JLink interface control |
| **Flash Extraction** | SPI/NAND flash dumping |
| **Firmware Analysis** | Binwalk extraction and analysis |
| **Bus Analysis** | I2C, SPI, UART capture and decode |
| **Power Analysis** | ChipWhisperer integration |
| **Glitch Attacks** | Voltage/clock fault injection |

## Examples

### Example 1: Extract Firmware from Router

```bash
# 1. Identify flash chip
/skill hardware-security identify-chip --programmer ch341a_spi

# 2. Dump firmware
/skill hardware-security flash-dump \
  --programmer ch341a_spi \
  --chip W25Q128.V \
  --output router_firmware.bin

# 3. Analyze and extract
/skill hardware-security analyze-firmware \
  --input router_firmware.bin \
  --extract \
  --entropy-analysis
```

### Example 2: JTAG Memory Dump

```bash
# Connect and dump RAM
/skill hardware-security jtag-dump \
  --interface stlink \
  --target stm32f4x \
  --address 0x20000000 \
  --size 0x20000 \
  --output ram_dump.bin
```

### Example 3: UART Console Access

```bash
# Auto-detect baud rate
/skill hardware-security uart-detect --port /dev/ttyUSB0

# Connect to console
/skill hardware-security uart-connect \
  --port /dev/ttyUSB0 \
  --baud 115200 \
  --log session.log
```

### Example 4: Power Analysis Setup

```bash
# Configure ChipWhisperer for power trace capture
/skill hardware-security power-analysis-setup \
  --target stm32 \
  --samples 24000 \
  --clock 7370000

# Capture traces for AES analysis
/skill hardware-security capture-traces \
  --operation aes \
  --num-traces 1000 \
  --output aes_traces.npy
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENOCD_SCRIPTS` | OpenOCD scripts directory | System default |
| `FLASHROM_PROGRAMMER` | Default programmer | `ch341a_spi` |
| `UART_PORT` | Default UART port | `/dev/ttyUSB0` |
| `CW_PLATFORM` | ChipWhisperer platform | `CWLITEXMEGA` |

### Skill Configuration

```yaml
# .babysitter/skills/hardware-security.yaml
hardware-security:
  defaultProgrammer: ch341a_spi
  openocdInterface: stlink
  uartBaud: 115200
  firmwareOutputDir: ./firmware_dumps
  traceOutputDir: ./power_traces
  safetyChecks: true  # Verify before destructive operations
```

## Process Integration

### Processes Using This Skill

1. **hardware-security-research.js** - Hardware security assessment
2. **firmware-analysis.js** - Firmware extraction and analysis
3. **supply-chain-security.js** - Hardware supply chain verification

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const firmwareExtractionTask = defineTask({
  name: 'firmware-extraction',
  description: 'Extract and analyze firmware from target device',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Extract Firmware - ${inputs.deviceName}`,
      skill: {
        name: 'hardware-security',
        context: {
          operation: 'full-extraction',
          programmer: inputs.programmer,
          flashChip: inputs.chipType,
          analysis: ['binwalk', 'entropy', 'strings'],
          extractFilesystems: true
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## Hardware Tool Reference

### Supported Programmers

| Programmer | Interface | Chips Supported |
|------------|-----------|-----------------|
| ch341a_spi | SPI | 25xx series, W25Qxx |
| buspirate_spi | SPI | Various |
| stlink | SWD/JTAG | STM32 |
| jlink | SWD/JTAG | ARM Cortex-M/A |
| ft2232_spi | SPI | Various |

### Debug Interface Pinouts

```
JTAG 20-pin:
1-VTref  2-VTref  3-nTRST  4-GND   5-TDI
6-GND    7-TMS    8-GND    9-TCK   10-GND
11-RTCK  12-GND   13-TDO   14-GND  15-nSRST
16-GND   17-DBGRQ 18-GND   19-DBGACK 20-GND

SWD (ARM):
1-VTref  2-SWDIO  3-GND  4-SWCLK  5-GND  6-SWO(optional)
```

## Security Considerations

### Authorization Requirements

- Test only hardware you own or have explicit authorization to examine
- Obtain written permission for client hardware
- Document chain of custody for forensic work

### Safety Precautions

- Use ESD protection when handling boards
- Verify voltage levels before connecting
- Isolate destructive tools (flash write) with confirmation
- Maintain backups of original firmware

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `No flash chip detected` | Check connections, try slower speed |
| `JTAG connection refused` | Verify target power, check debug protection |
| `Garbled UART output` | Try different baud rates |
| `ChipWhisperer not found` | Check USB connection, reinstall drivers |

### Debug Mode

Enable verbose output for troubleshooting:

```bash
HARDWARE_DEBUG=true /skill hardware-security flash-dump --programmer ch341a_spi
```

## Related Skills

- **firmware-analysis** - Deep firmware analysis
- **embedded-crypto** - Embedded cryptography
- **binary-exploitation** - Binary exploitation techniques

## References

- [OpenOCD Documentation](http://openocd.org/documentation/)
- [Flashrom Supported Hardware](https://www.flashrom.org/Supported_hardware)
- [ChipWhisperer Documentation](https://chipwhisperer.readthedocs.io/)
- [Sigrok Protocol Decoders](https://sigrok.org/wiki/Protocol_decoders)
- [Hardware Hacking Handbook](https://nostarch.com/hardwarehacking)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-019
**Category:** Hardware Security
**Status:** Active
