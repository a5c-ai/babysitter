# React Native Development Skill

## Overview

The React Native Development skill provides deep integration with the React Native ecosystem for building cross-platform mobile applications. It enables developers to leverage React Native CLI, Expo, and the broader JavaScript/TypeScript mobile development ecosystem.

## Key Capabilities

- **React Native CLI Operations**: Project initialization, Metro bundler configuration, native builds
- **Expo CLI Operations**: Managed workflow, EAS Build, over-the-air updates
- **Component Generation**: TypeScript components, custom hooks, navigation screens
- **State Management**: Redux Toolkit, Zustand, RTK Query integration
- **Navigation**: React Navigation with type-safe routing
- **Performance**: Hermes engine, FlatList optimization, bundle analysis
- **Testing**: Jest, React Native Testing Library, Detox E2E
- **Debugging**: Flipper, Reactotron, React DevTools

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Create New Project

```bash
# React Native CLI
npx react-native init MyApp --template react-native-template-typescript

# Expo
npx create-expo-app MyApp --template expo-template-blank-typescript
```

### Run Development

```bash
# Start Metro bundler
npx react-native start

# Run on iOS
npx react-native run-ios

# Run on Android
npx react-native run-android
```

## Process Integration

This skill is used by the following processes:

| Process | Usage |
|---------|-------|
| `react-native-app-setup.js` | Project scaffolding and configuration |
| `cross-platform-ui-library.js` | Shared component development |
| `mobile-testing-strategy.js` | Test implementation |
| `mobile-performance-optimization.js` | Performance tuning |

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| React Native | 0.73+ | Framework |
| TypeScript | 5.0+ | Type safety |
| Metro | Latest | Bundler |

## File Structure

```
skills/react-native-dev/
├── SKILL.md     # Detailed skill specification
└── README.md    # This file
```

## Related Skills

- `flutter-dart` - Alternative cross-platform framework
- `mobile-testing` - Testing frameworks
- `mobile-perf` - Performance profiling

## Version

- Current: 1.0.0
- Status: Active
