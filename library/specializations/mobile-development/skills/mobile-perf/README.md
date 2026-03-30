# Mobile Performance Profiling Skill

## Overview

The Mobile Performance Profiling skill provides comprehensive capabilities for mobile app performance analysis and optimization across platforms.

## Key Capabilities

- **Xcode Instruments**: Time Profiler, Allocations, Core Animation
- **Android Profiler**: CPU, Memory, Network profiling
- **React Native**: Flipper, Hermes profiling
- **Flutter DevTools**: Performance overlay, timeline
- **Metrics**: Startup time, frame rate, memory

## Quick Start

### iOS Profiling

```bash
xcrun xctrace record --template "Time Profiler" --attach "MyApp"
```

### Android Profiling

```bash
adb shell am profile start com.example.myapp /data/local/tmp/profile.trace
```

## Process Integration

| Process | Usage |
|---------|-------|
| `mobile-performance-optimization.js` | Performance tuning |
| `mobile-testing-strategy.js` | Performance testing |

## File Structure

```
skills/mobile-perf/
├── SKILL.md     # Detailed specification
└── README.md    # This file
```

## Version

- Current: 1.0.0
- Status: Active
