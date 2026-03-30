---
name: freertos-integration
description: Expert skill for FreeRTOS configuration, debugging, and optimization
category: RTOS
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# FreeRTOS Integration Skill

## Overview

This skill provides expert-level support for FreeRTOS configuration, integration, debugging, and optimization. It covers all aspects of FreeRTOS development from initial setup to performance tuning.

## Capabilities

### Configuration Management
- Generate optimal FreeRTOSConfig.h settings
- Configure kernel tick rate and timing
- Memory allocation scheme selection (heap_1 through heap_5)
- Tickless idle mode configuration
- Software timer configuration

### Task Management
- Task creation and priority analysis
- Stack size calculation and optimization
- Task timing analysis and WCET estimation
- Priority assignment strategies
- Task notification configuration

### Synchronization Primitives
- Queue configuration and sizing
- Semaphore and mutex configuration
- Event group setup
- Stream and message buffer configuration
- Deadlock prevention strategies

### Debugging Support
- Kernel-aware debugging interpretation
- Stack overflow detection configuration
- Runtime statistics collection
- Task state monitoring
- Trace facility configuration (Tracealyzer, SystemView)

### Optimization
- Stack usage analysis and right-sizing
- Memory pool optimization
- Context switch overhead reduction
- Interrupt-safe API usage
- Co-routine configuration (legacy)

## Target Processes

- `rtos-integration.js` - FreeRTOS integration and setup
- `real-time-performance-validation.js` - RTOS performance testing
- `low-power-design.js` - Tickless idle and power optimization
- `execution-speed-profiling.js` - Task timing analysis

## Dependencies

- FreeRTOS kernel source
- Kernel-aware debugger plugins (optional)
- Trace tools (Tracealyzer, SystemView - optional)

## Usage Context

This skill is invoked when tasks require:
- Initial FreeRTOS project setup
- Configuration optimization for specific requirements
- Task design and priority assignment
- Synchronization primitive selection
- Performance analysis and tuning

## Configuration Templates

### Minimal Configuration
```c
#define configUSE_PREEMPTION            1
#define configUSE_IDLE_HOOK             0
#define configUSE_TICK_HOOK             0
#define configCPU_CLOCK_HZ              SystemCoreClock
#define configTICK_RATE_HZ              1000
#define configMAX_PRIORITIES            5
#define configMINIMAL_STACK_SIZE        128
#define configTOTAL_HEAP_SIZE           (10 * 1024)
```

### Low-Power Configuration
```c
#define configUSE_TICKLESS_IDLE         1
#define configEXPECTED_IDLE_TIME_BEFORE_SLEEP  2
#define configPRE_SLEEP_PROCESSING(x)   preSleepProcessing(x)
#define configPOST_SLEEP_PROCESSING(x)  postSleepProcessing(x)
```
