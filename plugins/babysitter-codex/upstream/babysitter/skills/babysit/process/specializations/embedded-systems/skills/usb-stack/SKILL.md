---
name: usb-stack
description: USB device and host stack implementation expertise
category: Communication Protocols
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# USB Stack Skill

## Overview

This skill provides USB device and host stack implementation expertise for embedded systems, covering descriptor generation, device class implementation, and protocol debugging.

## Capabilities

### USB Descriptor Generation
- Device descriptor configuration
- Configuration descriptors
- Interface descriptors
- Endpoint descriptors
- String descriptors
- BOS descriptors (USB 3.x)

### Device Class Implementation
- CDC (Communications Device Class)
- HID (Human Interface Device)
- MSC (Mass Storage Class)
- DFU (Device Firmware Upgrade)
- Audio class
- Video class
- Custom class implementation

### USB Stack Configuration
- TinyUSB configuration
- STM32 USB stack setup
- NXP USB stack integration
- Zephyr USB subsystem
- Endpoint buffer management

### Enumeration and Debugging
- Enumeration sequence debugging
- Protocol analysis
- USB analyzer integration
- Descriptor validation
- Compliance testing

### Advanced Features
- Composite device configuration
- USB power delivery
- High-speed/full-speed selection
- Isochronous transfers
- Interrupt transfers
- Bulk transfers

### DFU Implementation
- DFU bootloader design
- Runtime DFU mode
- Detach and download
- Upload capability
- Manifest phase handling

## Target Processes

- `device-driver-development.js` - USB driver implementation
- `bootloader-implementation.js` - USB DFU bootloader
- `hw-sw-interface-specification.js` - USB interface specification

## Dependencies

- TinyUSB or vendor USB stack
- USB protocol analyzers
- usb-tools (lsusb, usbmon)

## Usage Context

This skill is invoked when tasks require:
- USB device implementation
- Device class development
- USB bootloader creation
- Protocol debugging
- Descriptor optimization

## Device Class Examples

### CDC Virtual COM Port
```c
tusb_desc_interface_t cdc_interface = {
    .bLength            = sizeof(tusb_desc_interface_t),
    .bDescriptorType    = TUSB_DESC_INTERFACE,
    .bInterfaceNumber   = 0,
    .bAlternateSetting  = 0,
    .bNumEndpoints      = 2,
    .bInterfaceClass    = TUSB_CLASS_CDC,
    .bInterfaceSubClass = CDC_COMM_SUBCLASS_ACM,
    .bInterfaceProtocol = CDC_COMM_PROTOCOL_NONE,
    .iInterface         = 0
};
```

### HID Report Descriptor
```c
uint8_t const hid_report_desc[] = {
    HID_USAGE_PAGE(HID_USAGE_PAGE_DESKTOP),
    HID_USAGE(HID_USAGE_DESKTOP_MOUSE),
    HID_COLLECTION(HID_COLLECTION_APPLICATION),
        HID_USAGE(HID_USAGE_DESKTOP_POINTER),
        HID_COLLECTION(HID_COLLECTION_PHYSICAL),
            // ... buttons and axes
        HID_COLLECTION_END,
    HID_COLLECTION_END
};
```

## Configuration

```yaml
usb:
  vid: 0x1234
  pid: 0x5678
  device_class: cdc | hid | msc | dfu | composite
  speed: full | high
  endpoints:
    - ep1_in: bulk, 64
    - ep1_out: bulk, 64
```
