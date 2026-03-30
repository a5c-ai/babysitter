---
name: arm-cortex-m
description: Deep expertise in ARM Cortex-M architecture and peripherals
category: Microcontroller Architecture
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# ARM Cortex-M Skill

## Overview

This skill provides deep expertise in ARM Cortex-M architecture, including core configuration, peripheral programming, and low-level optimization for the most widely used embedded processor family.

## Capabilities

### CMSIS Integration
- CMSIS-Core configuration and usage
- CMSIS-Driver integration
- CMSIS-DSP library utilization
- CMSIS-RTOS abstraction
- Device header file management

### NVIC Configuration
- Interrupt priority configuration
- Priority grouping setup
- Vector table relocation
- Interrupt enable/disable patterns
- Nested interrupt handling

### Memory Protection Unit (MPU)
- MPU region setup and configuration
- Memory attribute configuration
- Protection scheme design
- Stack overflow protection
- Peripheral isolation

### System Timers
- SysTick timer configuration
- DWT cycle counter usage
- Timer-based profiling
- Timestamp generation
- Delay implementations

### Fault Handling
- HardFault analysis and debugging
- BusFault configuration
- UsageFault detection
- MemManage fault handling
- Fault register interpretation

### Low-Level Optimization
- ARM assembly for critical sections
- Bit-banding operations
- Atomic operations (LDREX/STREX)
- Barrier instructions (DSB, DMB, ISB)
- Compiler intrinsics

### Power Management
- WFI/WFE instruction usage
- Sleep mode entry/exit
- Wake-up source configuration
- Low-power mode selection
- Power domain management

## Target Processes

- `bsp-development.js` - BSP with Cortex-M support
- `isr-design.js` - Interrupt architecture design
- `memory-architecture-planning.js` - Memory layout with MPU
- `real-time-architecture-design.js` - Real-time Cortex-M design
- `bootloader-implementation.js` - Cortex-M bootloader

## Dependencies

- ARM CMSIS headers
- Cortex-M technical reference manual
- Device-specific headers

## Usage Context

This skill is invoked when tasks require:
- Cortex-M core configuration
- Interrupt system design
- MPU setup and protection
- Fault debugging and analysis
- Low-level performance optimization

## Architecture Support

| Core | Features |
|------|----------|
| Cortex-M0/M0+ | Minimal, low-power |
| Cortex-M3 | Full Thumb-2, MPU optional |
| Cortex-M4 | DSP, optional FPU |
| Cortex-M7 | Cache, dual-issue |
| Cortex-M23 | TrustZone-M, security |
| Cortex-M33 | TrustZone-M, DSP |
| Cortex-M55 | MVE (Helium), ML |

## Example Configurations

### NVIC Priority
```c
NVIC_SetPriorityGrouping(3);  // 4 bits preemption, 0 bits sub
NVIC_SetPriority(USART1_IRQn, NVIC_EncodePriority(3, 2, 0));
NVIC_EnableIRQ(USART1_IRQn);
```

### MPU Region
```c
MPU->RNR = 0;  // Region 0
MPU->RBAR = 0x20000000;  // Base address
MPU->RASR = MPU_RASR_ENABLE_Msk |
            (0x0F << MPU_RASR_SIZE_Pos) |  // 64KB
            MPU_RASR_C_Msk | MPU_RASR_S_Msk;
```
