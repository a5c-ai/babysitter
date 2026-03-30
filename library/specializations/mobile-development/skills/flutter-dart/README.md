# Flutter/Dart Development Skill

## Overview

The Flutter/Dart Development skill provides specialized capabilities for building cross-platform mobile applications using the Flutter framework and Dart programming language. It enables developers to leverage Flutter's widget-based architecture, state management solutions, and comprehensive tooling.

## Key Capabilities

- **Flutter CLI Operations**: Project creation, builds, hot reload, diagnostics
- **Dart Language Features**: Null safety, async patterns, extensions, sealed classes
- **Widget Development**: Custom widgets, InheritedWidget, CustomPainter
- **State Management**: BLoC, Provider, Riverpod patterns
- **Navigation**: GoRouter, AutoRoute with type-safe routing
- **Code Generation**: Freezed, JsonSerializable, build_runner
- **Testing**: Unit tests, widget tests, integration tests, golden tests
- **Performance**: DevTools profiling, const optimization, lazy loading

## Quick Start

### Prerequisites

- Flutter SDK 3.16+
- Dart SDK 3.2+
- Android Studio or VS Code with Flutter extension

### Create New Project

```bash
# Create Flutter project
flutter create --org com.example my_app

# Add common dependencies
flutter pub add flutter_bloc go_router
flutter pub add --dev build_runner freezed freezed_annotation
```

### Run Development

```bash
# Run on connected device
flutter run

# Run with hot reload
flutter run --hot

# Run on specific device
flutter devices
flutter run -d <device_id>
```

## Process Integration

This skill is used by the following processes:

| Process | Usage |
|---------|-------|
| `flutter-app-scaffolding.js` | Project setup and architecture |
| `cross-platform-ui-library.js` | Shared widget development |
| `mobile-testing-strategy.js` | Test implementation |
| `mobile-performance-optimization.js` | Performance tuning |

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Flutter SDK | 3.16+ | Framework |
| Dart SDK | 3.2+ | Language |
| flutter_bloc | Latest | State management |
| go_router | Latest | Navigation |

## File Structure

```
skills/flutter-dart/
├── SKILL.md     # Detailed skill specification
└── README.md    # This file
```

## Related Skills

- `react-native-dev` - Alternative cross-platform framework
- `mobile-testing` - Testing frameworks
- `kotlin-compose` - Native Android development

## Version

- Current: 1.0.0
- Status: Active
