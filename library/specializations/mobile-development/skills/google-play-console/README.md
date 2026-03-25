# Google Play Console Skill

## Overview

The Google Play Console skill provides comprehensive capabilities for Google Play Store publishing and management. It enables developers to interact with Google Play Developer API, manage store listings, configure release tracks, and handle the complete app lifecycle on the Play Store.

## Key Capabilities

- **API Authentication**: Service accounts, OAuth 2.0
- **Build Upload**: AAB files, bundletool validation
- **Release Tracks**: Internal, alpha, beta, production
- **Staged Rollouts**: Percentage rollouts, monitoring
- **Store Listing**: Metadata, screenshots, graphics
- **Data Safety**: Privacy declarations
- **In-App Products**: Subscriptions, managed products
- **Pre-launch Reports**: Automated testing results

## Quick Start

### Prerequisites

- Google Play Developer account
- Service account with API access
- Signed AAB file

### Service Account Setup

1. Create service account in Google Cloud Console
2. Link to Play Console in API access settings
3. Grant required permissions

### Upload via Fastlane

```bash
# Deploy to beta
bundle exec fastlane supply \
  --track beta \
  --aab ./app/build/outputs/bundle/release/app-release.aab \
  --json_key ./fastlane/play-store-key.json
```

## Process Integration

This skill is used by the following processes:

| Process | Usage |
|---------|-------|
| `android-playstore-publishing.js` | Play Store publishing |
| `beta-testing-setup.js` | Beta distribution |
| `app-store-optimization.js` | ASO optimization |
| `automated-release-management.js` | Release automation |

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Google Play Developer API | v3 | Publishing |
| bundletool | Latest | AAB validation |
| Fastlane | 2.x | Automation |

## File Structure

```
skills/google-play-console/
├── SKILL.md     # Detailed skill specification
└── README.md    # This file
```

## Related Skills

- `fastlane-cicd` - Build automation
- `kotlin-compose` - Android development
- `firebase-mobile` - Firebase integration

## Version

- Current: 1.0.0
- Status: Active
