# App Store Connect Skill

## Overview

The App Store Connect skill provides comprehensive capabilities for Apple App Store submission and management. It enables developers to interact with App Store Connect API, manage metadata, distribute via TestFlight, and handle app lifecycle management.

## Key Capabilities

- **API Authentication**: JWT tokens, API keys
- **Build Upload**: Transporter, altool, Fastlane
- **TestFlight**: Beta distribution, tester groups
- **Metadata**: App descriptions, keywords, screenshots
- **In-App Purchases**: Subscriptions, consumables
- **Submission**: App Review, release management
- **Compliance**: Privacy, export compliance

## Quick Start

### Prerequisites

- Apple Developer account
- App Store Connect access
- Xcode (for Transporter)

### API Key Setup

1. Go to App Store Connect > Users and Access > Keys
2. Generate new API key
3. Download AuthKey_XXXX.p8 file

### Upload Build

```bash
xcrun altool --upload-app \
  --file ./build/MyApp.ipa \
  --type ios \
  --apiKey XXXXXXXXXX \
  --apiIssuer xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## Process Integration

This skill is used by the following processes:

| Process | Usage |
|---------|-------|
| `ios-appstore-submission.js` | App Store submission |
| `beta-testing-setup.js` | TestFlight config |
| `app-store-optimization.js` | ASO metadata |
| `automated-release-management.js` | Release automation |

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Xcode | 15+ | Build tools |
| Transporter | Latest | Upload |
| Fastlane | 2.x | Automation |

## File Structure

```
skills/app-store-connect/
├── SKILL.md     # Detailed skill specification
└── README.md    # This file
```

## Related Skills

- `fastlane-cicd` - Build automation
- `swift-swiftui` - iOS development
- `mobile-security` - App security

## Version

- Current: 1.0.0
- Status: Active
