# Mobile Testing Frameworks Skill

## Overview

The Mobile Testing Frameworks skill provides comprehensive expertise in mobile testing across platforms. It enables E2E testing with Detox and Maestro, native testing with XCUITest and Espresso, and cross-platform testing with Appium and device farms.

## Key Capabilities

- **Detox**: React Native E2E testing
- **Maestro**: YAML-based flow testing
- **XCUITest**: iOS native UI testing
- **Espresso**: Android native UI testing
- **Appium**: Cross-platform automation
- **Device Farms**: AWS Device Farm, Firebase Test Lab
- **Visual Testing**: Screenshot comparison
- **Performance Testing**: Launch time, memory

## Quick Start

### Prerequisites

- Node.js (Detox, Maestro)
- Xcode (XCUITest)
- Android Studio (Espresso)

### Run Detox Tests

```bash
# Build and test iOS
npx detox build --configuration ios.sim.debug
npx detox test --configuration ios.sim.debug

# Build and test Android
npx detox build --configuration android.emu.debug
npx detox test --configuration android.emu.debug
```

### Run Maestro Flows

```bash
maestro test flows/login.yaml
```

## Process Integration

This skill is used by the following processes:

| Process | Usage |
|---------|-------|
| `mobile-testing-strategy.js` | Testing strategy |
| `mobile-accessibility-implementation.js` | A11y testing |
| `mobile-security-implementation.js` | Security testing |

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Detox | 20+ | React Native E2E |
| Maestro | 1.x | Flow testing |
| Xcode | 15+ | XCUITest |
| Android Studio | Latest | Espresso |

## File Structure

```
skills/mobile-testing/
├── SKILL.md     # Detailed skill specification
└── README.md    # This file
```

## Related Skills

- `accessibility-testing` - A11y testing
- `mobile-perf` - Performance testing
- `fastlane-cicd` - CI integration

## Version

- Current: 1.0.0
- Status: Active
