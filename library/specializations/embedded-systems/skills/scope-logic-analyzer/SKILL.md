---
name: scope-logic-analyzer
description: Test equipment integration for signal analysis (oscilloscope and logic analyzer)
category: Hardware Debugging
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Oscilloscope/Logic Analyzer Skill

## Overview

This skill provides test equipment integration for signal analysis, enabling automated measurements, protocol decoding, and timing verification using oscilloscopes and logic analyzers.

## Capabilities

### Oscilloscope Operations
- Channel configuration
- Trigger setup and management
- Measurement automation
- Waveform capture and export
- Math and FFT operations
- Cursor measurements
- Mask testing

### Logic Analyzer Operations
- Digital channel configuration
- Protocol decoder setup
- Trigger configuration
- Capture depth management
- State vs timing mode
- Parallel bus capture

### Signal Measurements
- Rise/fall time measurement
- Frequency and period
- Duty cycle analysis
- Amplitude measurements
- Pulse width measurement
- Signal integrity metrics
- Eye diagram analysis

### Protocol Decoding
- I2C protocol decoding
- SPI protocol decoding
- UART/RS-232 decoding
- CAN/LIN decoding
- Custom protocol definitions

### Timing Analysis
- Setup and hold time verification
- Propagation delay measurement
- Clock jitter analysis
- Timing margin verification
- Glitch detection

### FFT and Frequency Analysis
- Spectrum analysis
- Harmonic analysis
- THD calculation
- EMI pre-compliance
- Noise floor analysis

### Instrument Integration
- Keysight/Agilent instruments
- Tektronix oscilloscopes
- Rigol oscilloscopes
- Saleae Logic analyzers
- Sigrok/PulseView
- SCPI command automation

## Target Processes

- `signal-integrity-testing.js` - Signal quality validation
- `hardware-bring-up.js` - Initial signal verification
- `real-time-performance-validation.js` - Timing validation

## Dependencies

- Oscilloscope software/drivers
- Logic analyzer software (Saleae Logic, Sigrok)
- VISA/SCPI libraries
- Protocol decoder plugins

## Usage Context

This skill is invoked when tasks require:
- Signal integrity verification
- Timing analysis and validation
- Protocol debugging
- Hardware validation
- EMI pre-compliance testing

## Measurement Examples

### Rise Time Measurement
```python
scope.channel[1].enabled = True
scope.channel[1].scale = 1.0  # V/div
scope.trigger.source = "CH1"
scope.trigger.level = 1.65  # V
scope.trigger.slope = "RISE"

measurement = scope.measure.rise_time("CH1")
print(f"Rise time: {measurement * 1e9:.2f} ns")
```

### Logic Analyzer Capture
```python
analyzer.set_sample_rate(24e6)  # 24 MHz
analyzer.set_capture_depth(10e6)  # 10M samples
analyzer.add_decoder("i2c", sda=0, scl=1)
analyzer.trigger.add_condition("i2c_start")
analyzer.start_capture()
```

## Configuration

```yaml
equipment:
  oscilloscope:
    type: keysight | tektronix | rigol
    connection: visa | usb | ethernet
    address: "TCPIP::192.168.1.100::INSTR"
  logic_analyzer:
    type: saleae | sigrok
    sample_rate: 24MHz
    channels: 8
```
