---
name: stm32-hal
description: STMicroelectronics STM32 HAL and Low-Level driver expertise
category: Vendor-Specific
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# STM32 HAL/LL Skill

## Overview

This skill provides expert-level support for STMicroelectronics STM32 microcontrollers, including HAL driver usage, Low-Level (LL) driver optimization, and STM32CubeMX integration.

## Capabilities

### STM32CubeMX Integration
- Configuration file interpretation
- Code generation customization
- Pin and peripheral assignment
- Clock tree configuration
- Middleware integration

### HAL Driver Usage
- HAL initialization and configuration
- Callback registration and handling
- DMA integration with HAL
- Interrupt mode operations
- Polling mode operations
- HAL timeout handling

### Low-Level (LL) Drivers
- LL driver optimization
- Direct register access patterns
- HAL to LL migration
- Mixed HAL/LL usage
- Performance-critical implementations

### Clock Configuration
- Clock tree setup and optimization
- PLL configuration
- Peripheral clock gating
- Clock source selection
- HSE/HSI/LSE/LSI configuration

### DMA Configuration
- DMA stream/channel selection
- Circular and normal modes
- Double buffer configuration
- DMA interrupt handling
- Memory-to-memory transfers

### Peripheral Configuration
- GPIO configuration and modes
- Timer configuration (PWM, input capture)
- ADC/DAC setup and calibration
- Communication peripherals (UART, SPI, I2C)
- USB device/host configuration

### Power Management
- Sleep and stop mode entry
- Standby mode configuration
- Low-power run mode
- Wake-up source configuration
- Voltage scaling

## Target Processes

- `bsp-development.js` - STM32 BSP implementation
- `device-driver-development.js` - STM32 driver development
- `dma-optimization.js` - DMA configuration and tuning
- `low-power-design.js` - STM32 power optimization
- `hardware-bring-up.js` - STM32 board bring-up

## Dependencies

- STM32CubeMX
- STM32 HAL/LL libraries
- STM32CubeIDE (optional)
- Device-specific firmware package

## Usage Context

This skill is invoked when tasks require:
- STM32 peripheral configuration
- HAL/LL driver implementation
- Clock tree optimization
- DMA setup and tuning
- Power mode configuration

## Family Support

- STM32F0, F1, F2, F3, F4, F7
- STM32G0, G4
- STM32H5, H7
- STM32L0, L1, L4, L4+, L5
- STM32U5
- STM32WB, WL

## Example Configurations

### UART with DMA
```c
huart1.Instance = USART1;
huart1.Init.BaudRate = 115200;
huart1.Init.WordLength = UART_WORDLENGTH_8B;
huart1.Init.StopBits = UART_STOPBITS_1;
huart1.Init.Parity = UART_PARITY_NONE;
huart1.Init.Mode = UART_MODE_TX_RX;
huart1.Init.HwFlowCtl = UART_HWCONTROL_NONE;
HAL_UART_Init(&huart1);
HAL_UART_Receive_DMA(&huart1, rx_buffer, RX_SIZE);
```

### LL GPIO Toggle
```c
LL_GPIO_SetOutputPin(GPIOA, LL_GPIO_PIN_5);
LL_GPIO_ResetOutputPin(GPIOA, LL_GPIO_PIN_5);
LL_GPIO_TogglePin(GPIOA, LL_GPIO_PIN_5);
```
