# Swift/SwiftUI Development Skill

## Overview

The Swift/SwiftUI Development skill provides expert capabilities for native iOS development using Apple's modern frameworks. It enables developers to build performant, accessible, and visually appealing iOS applications using SwiftUI's declarative syntax and Swift's powerful language features.

## Key Capabilities

- **SwiftUI Views**: Declarative UI, ViewBuilder, custom modifiers
- **State Management**: @State, @Binding, @StateObject, @EnvironmentObject
- **Navigation**: NavigationStack, deep linking, programmatic routing
- **Combine Framework**: Publishers, operators, reactive data flow
- **Swift Package Manager**: Dependency management, local packages
- **Xcode Build System**: xcodebuild, schemes, code signing
- **Testing**: XCTest, XCUITest, performance testing
- **Instruments**: Performance profiling, memory analysis

## Quick Start

### Prerequisites

- Xcode 15+
- macOS 14+ (Sonoma)
- Apple Developer account (for device deployment)

### Create New Project

```bash
# Create via Xcode or use swift package init for packages
# Xcode: File > New > Project > iOS App
```

### Build and Run

```bash
# Build for simulator
xcodebuild -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 15 Pro' build

# Run tests
xcodebuild test -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 15 Pro'
```

## Process Integration

This skill is used by the following processes:

| Process | Usage |
|---------|-------|
| `swiftui-app-development.js` | SwiftUI app architecture |
| `ios-core-data-implementation.js` | Core Data integration |
| `ios-push-notifications.js` | APNs configuration |
| `ios-appstore-submission.js` | App Store submission |
| `mobile-accessibility-implementation.js` | VoiceOver support |

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Xcode | 15+ | IDE and build tools |
| Swift | 5.9+ | Language |
| macOS | 14+ | Development platform |

## File Structure

```
skills/swift-swiftui/
├── SKILL.md     # Detailed skill specification
└── README.md    # This file
```

## Related Skills

- `ios-persistence` - Core Data and Realm
- `push-notifications` - APNs configuration
- `app-store-connect` - App Store submission

## Version

- Current: 1.0.0
- Status: Active
