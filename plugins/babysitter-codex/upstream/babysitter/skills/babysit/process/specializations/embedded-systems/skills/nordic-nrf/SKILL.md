---
name: nordic-nrf
description: Nordic Semiconductor nRF5x/nRF Connect SDK expertise
category: Vendor-Specific
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Nordic nRF Skill

## Overview

This skill provides expert-level support for Nordic Semiconductor nRF5x series and nRF Connect SDK development, with deep expertise in Bluetooth Low Energy, power optimization, and wireless protocols.

## Capabilities

### nRF Connect SDK
- SDK configuration and setup
- West workspace management
- Board definition customization
- Application architecture patterns
- Multi-image builds

### Bluetooth Low Energy
- SoftDevice configuration (legacy nRF5 SDK)
- Zephyr BLE stack configuration
- GATT service generation
- Connection parameter optimization
- Advertising configuration
- Pairing and bonding
- Bluetooth Mesh implementation

### Power Profiling
- Nordic Power Profiler Kit 2 integration
- Current measurement analysis
- Sleep mode optimization
- Radio duty cycle analysis
- Battery life estimation
- Power consumption logging

### Debugging and Logging
- nRF logging subsystem configuration
- RTT (Real-Time Transfer) debugging
- J-Link integration
- nRF Command Line Tools
- Core dump analysis

### Thread/Matter Support
- OpenThread configuration
- Thread network setup
- Matter device implementation
- Border router setup
- Multiprotocol configuration

### Peripheral Configuration
- GPIO and GPIOTE configuration
- Timer and counter setup
- PWM configuration
- SPI/I2C/UART drivers
- ADC (SAADC) configuration
- NFC configuration

## Target Processes

- `bsp-development.js` - nRF BSP implementation
- `low-power-design.js` - Ultra-low-power nRF design
- `power-consumption-profiling.js` - Power analysis
- `ota-firmware-update.js` - nRF DFU implementation

## Dependencies

- nRF Connect SDK
- nRF Command Line Tools
- Segger J-Link software
- Nordic Power Profiler Kit 2 (optional)

## Usage Context

This skill is invoked when tasks require:
- nRF5x/nRF52/nRF53/nRF91 development
- BLE application implementation
- Ultra-low-power optimization
- Thread/Matter development
- Power profiling analysis

## Family Support

| Series | Features |
|--------|----------|
| nRF51 | Legacy BLE (deprecated) |
| nRF52810/832/833 | BLE 5.0, low-cost |
| nRF52820 | BLE 5.2, Thread |
| nRF52840 | BLE 5.0, Thread, Zigbee, USB |
| nRF5340 | Dual-core, BLE 5.2 |
| nRF9160 | LTE-M/NB-IoT cellular |

## Example Configurations

### BLE Advertising
```c
static struct bt_le_adv_param adv_param = BT_LE_ADV_PARAM_INIT(
    BT_LE_ADV_OPT_CONNECTABLE | BT_LE_ADV_OPT_USE_NAME,
    BT_GAP_ADV_FAST_INT_MIN_2,
    BT_GAP_ADV_FAST_INT_MAX_2,
    NULL);

bt_le_adv_start(&adv_param, ad, ARRAY_SIZE(ad), NULL, 0);
```

### Power Configuration (prj.conf)
```kconfig
CONFIG_PM=y
CONFIG_PM_DEVICE=y
CONFIG_BT_CTLR_TX_PWR_MINUS_8=y
CONFIG_BT_CTLR_ADV_EXT=n
```
