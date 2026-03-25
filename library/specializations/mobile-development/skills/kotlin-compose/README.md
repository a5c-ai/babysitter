# Kotlin/Jetpack Compose Development Skill

## Overview

The Kotlin/Jetpack Compose Development skill provides expert capabilities for native Android development using Kotlin and Jetpack Compose. It enables developers to build modern, performant Android applications using declarative UI, modern architecture components, and Kotlin coroutines.

## Key Capabilities

- **Jetpack Compose**: Material Design 3 composables, custom layouts, previews
- **State Management**: remember, StateFlow, state hoisting patterns
- **Navigation**: Compose Navigation, type-safe arguments, deep linking
- **ViewModel Integration**: Hilt injection, StateFlow, SavedStateHandle
- **Kotlin Coroutines**: Flow, structured concurrency, error handling
- **Dependency Injection**: Hilt modules, scopes, ViewModelComponent
- **Gradle Build**: Kotlin DSL, version catalogs, build variants
- **Testing**: JUnit 5, Compose UI tests, MockK

## Quick Start

### Prerequisites

- Android Studio Hedgehog or later
- Android SDK 34+
- Kotlin 1.9+

### Create New Project

In Android Studio: File > New > Project > Empty Activity (Compose)

### Build and Run

```bash
# Build debug APK
./gradlew assembleDebug

# Run tests
./gradlew testDebugUnitTest

# Install on device
./gradlew installDebug
```

## Process Integration

This skill is used by the following processes:

| Process | Usage |
|---------|-------|
| `jetpack-compose-ui.js` | Compose UI development |
| `android-room-database.js` | Room persistence |
| `firebase-cloud-messaging.js` | FCM integration |
| `android-playstore-publishing.js` | Play Store submission |

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Android Studio | Hedgehog+ | IDE |
| Kotlin | 1.9+ | Language |
| Compose BOM | 2024.01.00+ | UI framework |
| Hilt | 2.50+ | Dependency injection |

## File Structure

```
skills/kotlin-compose/
├── SKILL.md     # Detailed skill specification
└── README.md    # This file
```

## Related Skills

- `android-room` - Room database integration
- `firebase-mobile` - Firebase services
- `google-play-console` - Play Store publishing

## Version

- Current: 1.0.0
- Status: Active
