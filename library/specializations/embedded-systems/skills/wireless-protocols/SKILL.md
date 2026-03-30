---
name: wireless-protocols
description: Embedded wireless protocol implementation (LoRa, Zigbee, Thread, Matter)
category: Communication Protocols
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Wireless Protocols Skill

## Overview

This skill provides wireless protocol implementation expertise for embedded IoT devices, covering LoRa/LoRaWAN, Zigbee, Thread, and Matter protocols.

## Capabilities

### LoRa/LoRaWAN
- LoRaWAN stack configuration
- Class A/B/C device implementation
- OTAA and ABP activation
- ADR (Adaptive Data Rate) configuration
- Channel plan configuration
- Downlink handling
- MAC command processing

### Zigbee
- Coordinator/router/end device setup
- Zigbee Cluster Library (ZCL)
- Network formation and joining
- Binding and reporting configuration
- OTA upgrade support
- Green Power device support

### Thread
- OpenThread configuration
- Network dataset management
- Commissioner and joiner roles
- Border router setup
- SRP (Service Registration Protocol)
- DNS-SD integration

### Matter
- Matter device implementation
- Device type configuration
- Cluster implementation
- Commissioning flow
- Multi-admin support
- OTA provider/requestor

### RF Configuration
- Antenna matching analysis
- TX power configuration
- Frequency selection
- Channel hopping setup
- Interference mitigation
- RSSI/LQI monitoring

### Certification Preparation
- RF testing requirements
- Protocol compliance testing
- Interoperability testing
- Documentation preparation

## Target Processes

- `device-driver-development.js` - Wireless driver implementation
- `low-power-design.js` - Low-power wireless optimization
- `functional-safety-certification.js` - Wireless certification

## Dependencies

- LoRaWAN stack (LoRaMac-node, LMIC)
- Zigbee SDK (Silicon Labs, NXP)
- OpenThread
- Matter SDK (connectedhomeip)

## Usage Context

This skill is invoked when tasks require:
- LoRaWAN device implementation
- Zigbee network development
- Thread/Matter device creation
- Wireless protocol optimization
- RF certification preparation

## Protocol Comparison

| Protocol | Range | Data Rate | Power | Mesh |
|----------|-------|-----------|-------|------|
| LoRaWAN | 15km | 0.3-50 kbps | Low | No |
| Zigbee | 100m | 250 kbps | Low | Yes |
| Thread | 100m | 250 kbps | Low | Yes |
| Matter | 100m | Varies | Low | Via Thread |

## Configuration Examples

### LoRaWAN OTAA
```c
static uint8_t DevEui[] = { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };
static uint8_t AppEui[] = { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };
static uint8_t AppKey[] = { 0x00, ..., 0x00 };  // 16 bytes

MibRequestConfirm_t mibReq;
mibReq.Type = MIB_DEV_EUI;
mibReq.Param.DevEui = DevEui;
LoRaMacMibSetRequestConfirm(&mibReq);
```

### Thread Network Configuration
```c
otOperationalDataset dataset;
otDatasetCreateNewNetwork(instance, &dataset);
dataset.mChannel = 15;
dataset.mPanId = 0x1234;
otDatasetSetActive(instance, &dataset);
```

### Matter Device Type
```cpp
const EmberAfCluster clusters[] = {
    OnOff::Id,
    LevelControl::Id,
    Descriptor::Id,
    Identify::Id
};
```
