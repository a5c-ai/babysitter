# Power Optimization Expert Agent

## Overview

The Power Optimization Expert agent provides specialized guidance for designing ultra-low-power embedded systems. With deep expertise in battery-powered devices, this agent helps optimize power consumption, estimate battery life, and implement efficient power state machines.

## Quick Start

### Basic Consultation

```javascript
// In a babysitter process
const analysis = await ctx.task(powerOptimizationConsult, {
  context: {
    device: 'IoT sensor node',
    mcu: 'STM32L476',
    battery: 'AA x 2 (3000mAh)',
    targetLife: '3 years'
  },
  questions: [
    'What sleep mode should I use?',
    'How can I reduce average current?',
    'What is the expected battery life?'
  ]
});
```

## Expertise Areas

### Power Management

- **Sleep modes**: Stop, Standby, Shutdown selection
- **Wake sources**: RTC, GPIO, peripheral interrupts
- **Clock management**: Dynamic frequency scaling
- **Voltage scaling**: Operating point optimization

### Component Optimization

- **MCU configuration**: Register-level power settings
- **Peripheral gating**: Clock and power domain control
- **Sensor power**: Duty cycling and load switching
- **Radio optimization**: TX power, connection intervals

### System Design

- **Power state machines**: State definition and transitions
- **Battery selection**: Chemistry, capacity, discharge curves
- **Energy harvesting**: Solar, thermal, vibration sources
- **Power supplies**: LDO vs switching, efficiency curves

## Use Cases

### 1. Power Architecture Review

Review and optimize power architecture:

```javascript
const review = await ctx.task(reviewPowerArchitecture, {
  device: 'wearable fitness tracker',
  currentDesign: {
    mcu: 'nRF52832',
    sensors: ['accelerometer', 'heart_rate', 'temperature'],
    radio: 'BLE',
    display: 'OLED 128x64',
    battery: 'LiPo 150mAh'
  },
  requirements: {
    targetBatteryLife: '7 days',
    features: ['continuous HR', 'step counting', 'notifications']
  }
});

// Output includes:
// - Current consumption analysis
// - Bottleneck identification
// - Optimization recommendations
// - Projected battery life improvements
```

### 2. Battery Life Estimation

Calculate detailed battery life projections:

```javascript
const estimate = await ctx.task(estimateBatteryLife, {
  battery: {
    type: 'CR2032',
    nominalCapacity: 230,
    operatingTemp: 25
  },
  dutyCycle: {
    activeMode: { current: 15, duration: 100, frequency: 360 }, // per hour
    sleepMode: { current: 0.003 } // 3uA
  },
  derating: 0.85
});

// Output:
// - Estimated life in years/months/days
// - Sensitivity analysis
// - Recommendations for improvement
```

### 3. Sleep Mode Optimization

Get optimal sleep mode configuration:

```javascript
const sleepConfig = await ctx.task(optimizeSleepMode, {
  mcu: 'STM32WB55',
  requirements: {
    wakeupLatency: '<1ms',
    retainRAM: true,
    maintainBLE: false,
    rtcRequired: true
  },
  constraints: {
    maxSleepCurrent: 5 // uA
  }
});

// Output:
// - Recommended sleep mode
// - Register configuration
// - Wake-up sequence code
// - Expected current consumption
```

### 4. Peripheral Power Audit

Audit peripheral power consumption:

```javascript
const audit = await ctx.task(auditPeripheralPower, {
  peripherals: [
    { name: 'SPI Flash', part: 'W25Q64', mode: 'standby' },
    { name: 'Accelerometer', part: 'LIS2DH12', mode: '100Hz' },
    { name: 'BLE Radio', part: 'nRF52', mode: 'advertising' }
  ]
});

// Output:
// - Power consumption per peripheral
// - Optimization recommendations
// - Priority ranking by savings
```

## Interaction Patterns

### Consultation Request

```json
{
  "agent": "power-optimization-expert",
  "prompt": {
    "role": "Low-Power Design Engineer",
    "task": "Analyze power consumption and recommend optimizations",
    "context": {
      "deviceType": "environmental sensor",
      "mcu": "STM32L072",
      "battery": "CR123A (1500mAh)",
      "samplingInterval": "5 minutes",
      "dataTransmission": "LoRaWAN hourly"
    },
    "instructions": [
      "Analyze duty cycle and power states",
      "Identify optimization opportunities",
      "Recommend sleep mode configuration",
      "Estimate achievable battery life"
    ]
  }
}
```

### Response Format

```json
{
  "analysis": {
    "currentAverageCurrent_uA": 125,
    "estimatedLife_years": 1.4,
    "powerBreakdown": [...]
  },
  "recommendations": [
    {
      "priority": 1,
      "category": "sleep_mode",
      "description": "Switch to Stop mode 2",
      "expectedSavings_uA": 80,
      "implementation": "..."
    }
  ],
  "optimizedProjection": {
    "targetCurrent_uA": 25,
    "projectedLife_years": 6.8
  }
}
```

## Decision Guidance

### Sleep Mode Selection Guide

| Requirement | Recommended Mode | Typical Current |
|-------------|------------------|-----------------|
| Fast wake-up (<100us) | Sleep/WFI | 1-5 mA |
| Moderate wake-up (<1ms) | Stop Mode | 2-20 uA |
| RAM retention needed | Stop Mode 2 | 1-5 uA |
| Lowest power, slow wake | Standby | 0.3-2 uA |
| Minimum power | Shutdown | 10-100 nA |

### Optimization Priority

1. **Reduce active time** - Greatest impact
2. **Optimize sleep current** - Continuous savings
3. **Lower peak current** - Battery health
4. **Minimize transitions** - Transition energy

## Best Practices

### Measurement
- Measure actual consumption, don't rely on datasheets
- Profile under realistic operating conditions
- Account for temperature variations
- Include all current paths (not just MCU)

### Design
- Design power state machine before implementation
- Use hardware timers for all wake-ups
- Gate all unused peripherals
- Consider energy per operation, not just power

### Implementation
- Test sleep modes early in development
- Verify all wake-up sources
- Validate power consumption at each milestone
- Document all power-related configuration

## Integration

### Process Integration

The Power Optimization Expert integrates with:

- `power-consumption-profiling.js` - Measurement guidance
- `low-power-design.js` - Design optimization
- `dma-optimization.js` - Efficient data transfer

### Skill Integration

Works with:
- `power-profiler` - Measurement and analysis
- `embedded-docs` - Power documentation

## References

- ARM Cortex-M Low Power Application Note
- STM32 Low-Power Modes Reference
- Nordic Power Optimization Guide
- TI MSP430 Ultra-Low-Power Design

## See Also

- [AGENT.md](./AGENT.md) - Full agent definition
- [Power Profiler Skill](../../skills/power-profiler/)
- [Power Consumption Profiling Process](../../power-consumption-profiling.js)
- [Low Power Design Process](../../low-power-design.js)
