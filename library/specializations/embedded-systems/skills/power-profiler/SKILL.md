---
name: power-profiler
description: Power consumption measurement and analysis expertise for embedded systems. Integrates with power analyzer tools to measure, profile, and optimize power consumption in battery-powered and energy-efficient designs.
allowed-tools: Read, Grep, Write, Edit, Bash, Glob, WebFetch, WebSearch
---

# Power Profiler Skill

Expert skill for power consumption measurement, analysis, and optimization in embedded systems. Provides integration with power analyzer tools and deep expertise in low-power design techniques.

## Overview

The Power Profiler skill enables comprehensive power analysis for embedded systems, supporting:
- Power analyzer tool integration (Otii Arc, Nordic PPK2, Joulescope)
- Current measurement configuration and calibration
- Power mode transition analysis
- Battery life estimation calculations
- Power profile comparison and trending
- Peripheral power contribution analysis
- Sleep mode leakage identification
- Energy-per-operation measurements

## Capabilities

### 1. Power Measurement Configuration

Configure and calibrate power measurement hardware:

```javascript
// Example: Configure Otii Arc power analyzer
const powerConfig = {
  analyzer: 'otii-arc',
  sampleRate: 4000,        // Hz
  currentRange: 'auto',     // auto, low (uA), high (mA)
  voltageOutput: 3.3,       // Supply voltage
  triggerMode: 'gpio',      // gpio, serial, manual
  triggerPin: 'GPI1'
};
```

### 2. Power State Analysis

Analyze power consumption across different operating states:

```markdown
## Power State Profile

| State | Current (avg) | Duration | Energy |
|-------|---------------|----------|--------|
| Active | 15.2 mA | 50 ms | 760 uJ |
| Processing | 45.3 mA | 10 ms | 453 uJ |
| Radio TX | 120 mA | 5 ms | 600 uJ |
| Sleep | 2.5 uA | 935 ms | 2.3 uJ |
| **Total Cycle** | - | 1000 ms | **1815.3 uJ** |

Average Current: 1.815 mA
Battery Life (1000 mAh): 551 hours (23 days)
```

### 3. Power Mode Transition Analysis

Identify and analyze power state transitions:

- Wake-up latency measurement
- Sleep entry timing
- Transition energy overhead
- Unexpected wake-up detection
- Power state sequence verification

### 4. Peripheral Power Contribution

Break down power consumption by peripheral:

```markdown
## Peripheral Power Breakdown

| Peripheral | Active Current | Sleep Current | Contribution |
|------------|----------------|---------------|--------------|
| MCU Core | 8.5 mA | 1.2 uA | 35% |
| Radio (BLE) | 6.2 mA | 0.5 uA | 25% |
| Sensors | 3.8 mA | 0.8 uA | 16% |
| Display | 4.2 mA | 0.1 uA | 17% |
| Other | 1.5 mA | 0.4 uA | 7% |
```

### 5. Battery Life Estimation

Calculate expected battery life for various usage scenarios:

```javascript
// Battery life estimation parameters
const batteryEstimate = {
  batteryCapacity: 230,     // mAh (CR2032)
  dutyCycle: {
    activePeriod: 100,      // ms
    sleepPeriod: 9900,      // ms
    transmitCount: 1        // per cycle
  },
  currentProfile: {
    active: 15.0,           // mA
    sleep: 2.5,             // uA
    transmit: 120.0         // mA
  },
  derating: 0.85            // 85% capacity utilization
};

// Calculated: 2.3 years battery life
```

## Process Integration

This skill integrates with the following processes:

| Process | Integration Point |
|---------|-------------------|
| `power-consumption-profiling.js` | Primary execution - all phases |
| `low-power-design.js` | Measurement and validation phases |
| `real-time-performance-validation.js` | Power budget verification |

## Tool Integration

### Supported Power Analyzers

| Tool | Features | Connection |
|------|----------|------------|
| **Otii Arc** | High precision, automation API | USB, REST API |
| **Nordic PPK2** | Source/ampere meter modes | USB, nRF Connect |
| **Joulescope** | Real-time streaming, triggers | USB, Python API |
| **Keysight N6705C** | Multi-channel, high accuracy | GPIB, USB, LAN |
| **Qoitech Otii** | Cloud integration, sharing | USB, Otii Desktop |

### Data Export Formats

- CSV time-series data
- JSON power profiles
- PNG/SVG visualizations
- Interactive HTML reports
- Otii project files (.otii)
- Joulescope capture files (.jls)

## Workflow

### 1. Setup Measurement Environment

```bash
# Verify power analyzer connection
otii-cli device list

# Configure measurement parameters
otii-cli project create \
  --name "power-profile-$(date +%Y%m%d)" \
  --voltage 3.3 \
  --current-range auto
```

### 2. Capture Power Profile

```bash
# Start recording with GPIO trigger
otii-cli recording start \
  --trigger gpio:GPI1:rising \
  --duration 10s

# Or use serial trigger
otii-cli recording start \
  --trigger serial:START \
  --stop-trigger serial:STOP
```

### 3. Analyze Results

```bash
# Export measurement data
otii-cli recording export \
  --format csv \
  --output power-data.csv

# Generate statistics
otii-cli statistics \
  --markers state:active,state:sleep \
  --output stats.json
```

### 4. Generate Report

The skill generates comprehensive power analysis reports including:

- Executive summary with key metrics
- State-by-state power breakdown
- Transition timing analysis
- Battery life projections
- Optimization recommendations
- Comparison with targets/baselines

## Output Schema

```json
{
  "summary": {
    "averageCurrent_mA": 1.815,
    "peakCurrent_mA": 120.0,
    "sleepCurrent_uA": 2.5,
    "estimatedBatteryLife_hours": 551
  },
  "powerStates": [
    {
      "name": "active",
      "current_mA": 15.2,
      "duration_ms": 50,
      "energy_uJ": 760
    }
  ],
  "transitions": [
    {
      "from": "sleep",
      "to": "active",
      "latency_us": 125,
      "energy_uJ": 1.2
    }
  ],
  "peripheralBreakdown": {
    "mcu": { "active_mA": 8.5, "sleep_uA": 1.2 },
    "radio": { "active_mA": 6.2, "sleep_uA": 0.5 }
  },
  "recommendations": [
    "Reduce radio TX power by 3dB to save 15% energy",
    "Enable peripheral clock gating during sleep"
  ],
  "artifacts": [
    "power-profile.csv",
    "power-report.html",
    "waveform.png"
  ]
}
```

## Best Practices

### Measurement Setup
- Use kelvin sense connections for accurate voltage measurement
- Minimize wire length between analyzer and DUT
- Ensure stable power supply to analyzer
- Allow thermal stabilization before measurement

### Calibration
- Zero-offset calibration before each session
- Verify measurement accuracy with known load
- Document measurement uncertainty

### Analysis
- Use markers to identify power states
- Compare against power budget requirements
- Track power metrics across firmware versions
- Document measurement conditions

## References

- Nordic PPK2 User Guide
- Joulescope User Guide
- Otii Arc Documentation
- "Power Management for Internet of Things" - ARM
- Low-Power Design Methodology Manual

## MCP Server Integration

Compatible MCP servers for enhanced functionality:

| Server | Purpose |
|--------|---------|
| `embedded-debugger-mcp` | Coordinate debug probes with power measurement |
| `serial-mcp-server` | Serial trigger synchronization |
| `tinymcp` | Device state monitoring |

## See Also

- `low-power-design.js` - Low-power design implementation process
- `power-consumption-profiling.js` - Full power profiling workflow
- AG-006: Power Optimization Expert agent
