# iOS Persistence Skill

## Overview

The iOS Persistence skill provides specialized capabilities for iOS local data persistence solutions including Apple's Core Data framework and Realm database. It enables robust data modeling, migrations, iCloud sync, and performance optimization.

## Key Capabilities

- **Core Data**: Entity modeling, NSManagedObject, fetch requests, predicates
- **Migrations**: Lightweight and custom migrations, version management
- **CloudKit Integration**: NSPersistentCloudKitContainer, sync conflict resolution
- **Realm Swift**: Object schemas, live queries, Realm Sync
- **Performance**: Background contexts, batch operations, faulting
- **Repository Pattern**: Clean architecture data access

## Quick Start

### Prerequisites

- Xcode 15+
- Swift 5.9+
- iOS 17+ (for latest features)

### Core Data Setup

1. Add Core Data model to Xcode project
2. Create PersistenceController singleton
3. Generate NSManagedObject subclasses
4. Implement repository pattern

### Realm Setup

```bash
# Add via Swift Package Manager
# Package URL: https://github.com/realm/realm-swift
```

## Process Integration

This skill is used by the following processes:

| Process | Usage |
|---------|-------|
| `ios-core-data-implementation.js` | Core Data setup |
| `offline-first-architecture.js` | Offline data strategies |
| `mobile-security-implementation.js` | Secure storage |

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Xcode | 15+ | IDE |
| Swift | 5.9+ | Language |
| Core Data | Built-in | Apple persistence |
| Realm | 10.45+ | Alternative database |

## File Structure

```
skills/ios-persistence/
├── SKILL.md     # Detailed skill specification
└── README.md    # This file
```

## Related Skills

- `swift-swiftui` - iOS app development
- `mobile-security` - Secure storage
- `offline-storage` - Cross-platform patterns

## Version

- Current: 1.0.0
- Status: Active
