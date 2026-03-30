# Room Database Skill

## Overview

The Room Database skill provides expert capabilities for Android Room persistence library. It enables developers to implement robust local data storage with compile-time verification, reactive queries, and seamless integration with modern Android architecture.

## Key Capabilities

- **Entity Design**: @Entity, primary keys, foreign keys, indices
- **Type Converters**: Custom type serialization
- **DAO Implementation**: @Query, @Insert, @Update, @Delete
- **Reactive Queries**: Flow and LiveData support
- **Migrations**: Auto-migrations and manual migration paths
- **Hilt Integration**: Dependency injection for database components
- **Repository Pattern**: Clean architecture data layer
- **Paging 3**: PagingSource integration

## Quick Start

### Prerequisites

- Android Studio
- Room 2.6+
- KSP or KAPT

### Gradle Setup

```kotlin
plugins {
    id("com.google.devtools.ksp")
}

dependencies {
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    ksp("androidx.room:room-compiler:2.6.1")
}
```

## Process Integration

This skill is used by the following processes:

| Process | Usage |
|---------|-------|
| `android-room-database.js` | Room implementation |
| `offline-first-architecture.js` | Offline strategies |
| `mobile-security-implementation.js` | Secure storage |

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Room | 2.6+ | Database |
| KSP | Latest | Code generation |
| Kotlin | 1.9+ | Language |
| Coroutines | Latest | Async support |

## File Structure

```
skills/android-room/
├── SKILL.md     # Detailed skill specification
└── README.md    # This file
```

## Related Skills

- `kotlin-compose` - Android UI
- `offline-storage` - Cross-platform patterns
- `mobile-security` - Encrypted storage

## Version

- Current: 1.0.0
- Status: Active
