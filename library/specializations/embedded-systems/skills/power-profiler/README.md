# Power Profiler Skill

## Overview

The Power Profiler skill provides expert capabilities for measuring, analyzing, and optimizing power consumption in embedded systems. It integrates with popular power analyzer tools and provides comprehensive analysis for battery-powered and energy-efficient designs.

## Quick Start

### Prerequisites

1. Power analyzer hardware (Otii Arc, Nordic PPK2, Joulescope, or similar)
2. Device under test (DUT) connected to power analyzer
3. Trigger mechanism (GPIO, serial, or manual)

### Basic Usage

```javascript
// In a babysitter process
const powerAnalysis = await ctx.task(powerProfileTask, {
  analyzer: 'otii-arc',
  voltage: 3.3,
  duration: 10000,  // 10 seconds
  triggers: {
    start: 'gpio:GPI1:rising',
    stop: 'gpio:GPI1:falling'
  }
});

console.log(`Average current: ${powerAnalysis.summary.averageCurrent_mA} mA`);
console.log(`Estimated battery life: ${powerAnalysis.summary.estimatedBatteryLife_hours} hours`);
```

## Features

### Power Measurement

- **Multi-tool support**: Otii Arc, Nordic PPK2, Joulescope, Keysight
- **High-precision measurement**: uA to A range with automatic ranging
- **Trigger-based capture**: GPIO, serial, manual, or time-based triggers
- **Real-time streaming**: Live power consumption visualization

### Analysis Capabilities

- **State-based analysis**: Identify and measure distinct power states
- **Transition analysis**: Measure wake-up latency and transition overhead
- **Peripheral breakdown**: Attribute power to individual peripherals
- **Battery life estimation**: Project battery life for various scenarios

### Reporting

- **Automated reports**: Generate HTML/PDF power analysis reports
- **Data export**: CSV, JSON, and tool-native formats
- **Visualization**: Power waveforms, pie charts, trend graphs
- **Baseline comparison**: Compare against targets or previous measurements

## Use Cases

### 1. Power Budget Verification

Verify that firmware meets power budget requirements:

```javascript
const result = await ctx.task(verifyPowerBudget, {
  budget: {
    sleepCurrent_uA: 5.0,
    activeCurrent_mA: 20.0,
    transmitCurrent_mA: 100.0
  },
  tolerance: 0.1  // 10% tolerance
});
```

### 2. Battery Life Estimation

Calculate expected battery life for a product:

```javascript
const estimate = await ctx.task(estimateBatteryLife, {
  battery: {
    type: 'CR2032',
    capacity_mAh: 230,
    derating: 0.85
  },
  usageProfile: {
    measurementsPerDay: 288,  // Every 5 minutes
    transmissionsPerDay: 24   // Once per hour
  }
});
```

### 3. Power Optimization Validation

Validate power optimization changes:

```javascript
const comparison = await ctx.task(comparePowerProfiles, {
  baseline: 'power-profile-v1.0.json',
  current: 'power-profile-v1.1.json',
  expectedImprovement: 0.15  // 15% improvement target
});
```

### 4. Sleep Mode Verification

Verify sleep mode current consumption:

```javascript
const sleepAnalysis = await ctx.task(analyzeSleepMode, {
  duration: 60000,  // 60 second measurement
  expectedCurrent_uA: 2.5,
  maxLeakage_uA: 1.0
});
```

## Configuration

### Analyzer Configuration

```json
{
  "analyzer": {
    "type": "otii-arc",
    "connection": "usb",
    "serialNumber": "optional-specific-device"
  },
  "measurement": {
    "voltage": 3.3,
    "currentRange": "auto",
    "sampleRate": 4000
  },
  "triggers": {
    "start": {
      "type": "gpio",
      "pin": "GPI1",
      "edge": "rising"
    },
    "stop": {
      "type": "duration",
      "value": 10000
    }
  }
}
```

### State Detection Configuration

```json
{
  "stateDetection": {
    "method": "threshold",
    "states": [
      {
        "name": "sleep",
        "currentRange": [0, 0.01]
      },
      {
        "name": "idle",
        "currentRange": [0.01, 5]
      },
      {
        "name": "active",
        "currentRange": [5, 50]
      },
      {
        "name": "transmit",
        "currentRange": [50, 200]
      }
    ],
    "minimumDuration_ms": 1
  }
}
```

## Output Format

### Summary Report

```json
{
  "summary": {
    "measurementDuration_ms": 10000,
    "averageCurrent_mA": 1.815,
    "peakCurrent_mA": 120.0,
    "minimumCurrent_uA": 2.5,
    "totalEnergy_mJ": 59.9,
    "estimatedBatteryLife_hours": 551
  },
  "powerStates": [...],
  "transitions": [...],
  "recommendations": [...],
  "artifacts": [...]
}
```

## Integration

### Process Integration

The Power Profiler skill integrates with these embedded systems processes:

- `power-consumption-profiling.js` - Primary power profiling workflow
- `low-power-design.js` - Low-power design implementation
- `real-time-performance-validation.js` - Timing and power validation

### Agent Integration

Works with:
- `power-optimization-expert` - Expert guidance on power optimization
- `embedded-test-engineer` - Automated power testing workflows

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| High noise in measurements | Ground loops | Use isolated power supply |
| Current range overflow | Unexpected peak current | Increase current range or use auto |
| Missed triggers | Signal timing | Adjust trigger sensitivity/delay |
| Inconsistent measurements | Temperature variation | Allow thermal stabilization |

### Verification Checklist

- [ ] Power analyzer firmware is up to date
- [ ] Correct voltage setting for DUT
- [ ] Proper kelvin sense connections
- [ ] Trigger mechanism verified working
- [ ] Known load test passed

## References

- [Otii Arc Documentation](https://www.qoitech.com/docs/)
- [Nordic PPK2 User Guide](https://infocenter.nordicsemi.com/topic/ug_ppk2/UG/ppk/PPK_user_guide_Intro.html)
- [Joulescope User Guide](https://www.joulescope.com/docs/)
- ARM Power Management for IoT Application Note

## See Also

- [SKILL.md](./SKILL.md) - Full skill definition
- [Power Consumption Profiling Process](../../power-consumption-profiling.js)
- [Low Power Design Process](../../low-power-design.js)
