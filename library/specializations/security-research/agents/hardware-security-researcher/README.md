# Hardware Security Researcher Agent

## Overview

The `hardware-security-researcher` agent embodies the expertise of a Senior Hardware Security Researcher with deep knowledge of embedded systems, side-channel analysis, fault injection, and IoT security. It provides expert guidance on hardware security assessments, debug interface analysis, and hardware-based attacks.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Senior Hardware Security Researcher |
| **Experience** | 6+ years in hardware security |
| **Background** | Embedded systems, hardware CTF, IoT audits |
| **Specializations** | Side-channel, fault injection, firmware |
| **Philosophy** | "Hardware is software's trust anchor" |

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Debug Interfaces** | JTAG, SWD, UART, SPI, I2C exploitation |
| **Side-Channel** | Power analysis, EM analysis, timing |
| **Fault Injection** | Voltage glitching, clock glitching, EMFI |
| **Secure Boot** | Boot chain analysis, bypass techniques |
| **Firmware** | Extraction, analysis, modification |
| **IoT Security** | Full-stack IoT assessment |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(hardwareResearcherTask, {
  agentName: 'hardware-security-researcher',
  prompt: {
    role: 'Senior Hardware Security Researcher',
    task: 'Assess embedded device for hardware vulnerabilities',
    context: {
      device: 'Smart Lock Model XYZ',
      components: {
        mcu: 'STM32F4',
        flash: 'W25Q128',
        connectivity: 'BLE'
      },
      debugInterfaces: await scanDebugPorts(),
      firmwareDump: '/evidence/firmware.bin'
    },
    instructions: [
      'Analyze debug interface accessibility',
      'Assess secure boot implementation',
      'Identify side-channel attack feasibility',
      'Review firmware for hardcoded secrets',
      'Provide attack path and remediation'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# Hardware security assessment
/agent hardware-security-researcher assess-device \
  --device "IoT Camera" \
  --components mcu:stm32f4,flash:w25q128 \
  --scope full

# Debug interface analysis
/agent hardware-security-researcher debug-analysis \
  --interface jtag \
  --target stm32f4 \
  --check-protection

# Side-channel feasibility
/agent hardware-security-researcher sidechannel-feasibility \
  --target aes-encryption \
  --equipment chipwhisperer

# Secure boot analysis
/agent hardware-security-researcher secureboot-analysis \
  --firmware /path/to/firmware.bin \
  --bootloader /path/to/bootloader.bin
```

## Common Tasks

### 1. Full Hardware Security Assessment

```bash
/agent hardware-security-researcher comprehensive-assessment \
  --device "Smart Device XYZ" \
  --scope debug,firmware,sidechannel,faultinjection \
  --time-budget "10 days" \
  --output-format json
```

Output includes:
- Hardware component analysis
- Debug interface accessibility
- Firmware extraction results
- Side-channel feasibility
- Recommended attack paths
- Remediation guidance

### 2. Debug Interface Analysis

```bash
/agent hardware-security-researcher analyze-debug \
  --target-board /path/to/board_image.jpg \
  --suspected-pins "J1,J5,TP3-TP6" \
  --mcu-type arm-cortex-m \
  --tools openocd,jlink
```

Provides:
- Pin identification methodology
- Protection status assessment
- Access capabilities
- Exploitation guidance

### 3. Glitch Attack Planning

```bash
/agent hardware-security-researcher plan-glitch-attack \
  --target secure-boot \
  --mcu stm32f4 \
  --equipment chipwhisperer-lite \
  --goal bypass-verification
```

Provides:
- Target identification
- Parameter search strategy
- Expected success indicators
- Safety considerations

### 4. Firmware Security Review

```bash
/agent hardware-security-researcher firmware-review \
  --firmware /path/to/firmware.bin \
  --architecture arm \
  --check hardcoded-secrets,crypto-weaknesses,debug-symbols
```

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `hardware-security-research.js` | Full assessment lifecycle |
| `firmware-analysis.js` | Hardware-assisted extraction |
| `supply-chain-security.js` | Hardware verification |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const hardwareAssessmentTask = defineTask({
  name: 'hardware-security-assessment',
  description: 'Comprehensive hardware security assessment',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: `Hardware Assessment - ${inputs.deviceName}`,
      agent: {
        name: 'hardware-security-researcher',
        prompt: {
          role: 'Senior Hardware Security Researcher',
          task: 'Perform comprehensive hardware security assessment',
          context: {
            device: inputs.deviceName,
            components: inputs.componentList,
            firmwarePath: inputs.firmwarePath,
            debugFindings: inputs.debugScanResults,
            scope: inputs.assessmentScope
          },
          instructions: [
            'Analyze debug interface accessibility and protection',
            'Extract and analyze firmware if possible',
            'Assess side-channel attack feasibility',
            'Evaluate fault injection vulnerability',
            'Identify secure boot weaknesses',
            'Document attack paths with PoC details',
            'Provide design-level remediation'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['findings', 'attackPaths', 'recommendations'],
          properties: {
            findings: { type: 'array' },
            attackPaths: { type: 'array' },
            recommendations: { type: 'object' }
          }
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

## Hardware Security Framework

### Assessment Methodology

| Phase | Activities |
|-------|------------|
| **Reconnaissance** | Physical inspection, component ID |
| **Interface Analysis** | Debug ports, communication buses |
| **Firmware Analysis** | Extraction, static/dynamic analysis |
| **Side-Channel** | Power/EM analysis feasibility |
| **Fault Injection** | Glitch targets and attacks |
| **Reporting** | Findings, PoC, remediation |

### Attack Categories

| Category | Techniques |
|----------|------------|
| **Non-invasive** | Debug interfaces, firmware updates |
| **Semi-invasive** | Glitching, side-channel |
| **Invasive** | Decapsulation, microprobing |

## Knowledge Base

### Common Hardware Vulnerabilities

| Category | Examples |
|----------|----------|
| **Debug** | Unprotected JTAG/SWD, UART shell |
| **Boot** | Unsigned firmware, weak verification |
| **Storage** | Unencrypted flash, key exposure |
| **Crypto** | Side-channel leakage, weak RNG |
| **Physical** | Glitch susceptibility, tamper response |

### Equipment Reference

| Category | Equipment |
|----------|-----------|
| **Debug** | JLink, OpenOCD, Bus Pirate |
| **Side-Channel** | ChipWhisperer, oscilloscope |
| **Glitching** | ChipWhisperer, custom circuits |
| **Logic Analysis** | Saleae Logic, Sigrok |
| **Soldering** | Reflow station, microscope |

## Interaction Guidelines

### What to Expect

- **Systematic analysis** of hardware attack surface
- **Practical attack paths** with equipment lists
- **Evidence-based findings** with proof-of-concept
- **Design-level remediation** for long-term fixes

### Best Practices

1. Provide component identification (MCU, flash type)
2. Share board images and pinout documentation
3. Include any firmware dumps or update files
4. Specify available equipment and time budget

## Related Resources

- [hardware-security skill](../skills/hardware-security/) - Hardware tools
- [firmware-analysis skill](../skills/firmware-analysis/) - Firmware extraction
- [incident-forensics skill](../skills/incident-forensics/) - Device forensics

## References

- [ChipWhisperer Documentation](https://chipwhisperer.readthedocs.io/)
- [OpenOCD Manual](http://openocd.org/documentation/)
- [Hardware Hacking Handbook](https://nostarch.com/hardwarehacking)
- [The Art of PCB Reverse Engineering](https://hackaday.com/tag/pcb-reverse-engineering/)
- [Fault Attack Wiki](https://wiki.newae.com/Fault_Injection)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-015
**Category:** Hardware Security
**Status:** Active
