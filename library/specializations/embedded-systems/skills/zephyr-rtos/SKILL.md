---
name: zephyr-rtos
description: Specialized skill for Zephyr RTOS development and configuration
category: RTOS
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Zephyr RTOS Skill

## Overview

This skill provides specialized support for Zephyr RTOS development, including device tree configuration, Kconfig management, and integration with Zephyr's extensive subsystems.

## Capabilities

### Build System
- West build system operation and configuration
- CMake integration and customization
- Multi-image builds (MCUboot + app)
- Sysbuild configuration
- Custom board definitions

### Device Tree
- Device tree overlay generation
- Binding creation and modification
- Node property configuration
- Pinctrl and GPIO configuration
- Compatible string management

### Kconfig Management
- Kconfig option configuration
- Fragment file organization
- Configuration dependency analysis
- Board-specific defconfig
- Application-specific prj.conf

### Networking Stack
- TCP/IP stack configuration
- Socket API setup
- Network interface configuration
- MQTT, CoAP, LwM2M protocols
- Network shell commands

### Bluetooth Stack
- Bluetooth LE configuration
- GATT service definition
- Bluetooth Mesh setup
- Connection management
- Advertising configuration

### Power Management
- Power management framework configuration
- Device power states
- System power states
- Policy configuration

### Logging and Shell
- Logging backend configuration
- Log level management
- Shell command registration
- RTT and UART backends

### Secure Boot
- MCUboot integration
- Signed image generation
- Upgrade slot configuration
- Hardware security integration

## Target Processes

- `rtos-integration.js` - Zephyr RTOS setup and integration
- `secure-boot-implementation.js` - MCUboot and secure boot
- `ota-firmware-update.js` - Firmware update with MCUboot
- `low-power-design.js` - Zephyr power management

## Dependencies

- Zephyr SDK
- West meta-tool
- Device tree compiler (dtc)
- CMake and Ninja

## Usage Context

This skill is invoked when tasks require:
- Zephyr project setup and configuration
- Device tree customization
- Networking or Bluetooth stack setup
- Power management implementation
- Secure boot with MCUboot

## Example Configurations

### Basic Project Structure
```
app/
  CMakeLists.txt
  prj.conf
  boards/
    my_board.overlay
  src/
    main.c
```

### Device Tree Overlay
```dts
&i2c0 {
    status = "okay";
    clock-frequency = <I2C_BITRATE_FAST>;

    sensor@48 {
        compatible = "ti,tmp102";
        reg = <0x48>;
    };
};
```

### Kconfig Fragment
```kconfig
CONFIG_BT=y
CONFIG_BT_PERIPHERAL=y
CONFIG_BT_DEVICE_NAME="My Device"
CONFIG_BT_GATT_DYNAMIC_DB=y
```
