# Fastlane/Mobile CI-CD Skill

## Overview

The Fastlane/Mobile CI-CD skill provides comprehensive automation for mobile app build, test, and deployment workflows. It enables seamless integration with CI platforms, automated code signing, beta distribution, and app store deployments.

## Key Capabilities

- **Fastlane Configuration**: Fastfile, lanes, plugins
- **iOS Code Signing**: Match, certificates, provisioning profiles
- **Build Automation**: gym (iOS), gradle (Android)
- **Testing**: scan, Firebase Test Lab integration
- **Beta Distribution**: TestFlight, Firebase App Distribution
- **App Store Deployment**: deliver, supply
- **CI Integration**: GitHub Actions, Bitrise, CircleCI

## Quick Start

### Prerequisites

- Ruby 3.0+
- Bundler
- Xcode (iOS) / Android SDK (Android)

### Initialize Fastlane

```bash
# Install fastlane
gem install fastlane

# Initialize in project
cd your-project
fastlane init
```

### Run Lanes

```bash
# iOS beta
bundle exec fastlane ios beta

# Android release
bundle exec fastlane android release
```

## Process Integration

This skill is used by the following processes:

| Process | Usage |
|---------|-------|
| `mobile-cicd-fastlane.js` | CI/CD setup |
| `automated-release-management.js` | Release automation |
| `ios-appstore-submission.js` | iOS deployment |
| `android-playstore-publishing.js` | Android deployment |
| `beta-testing-setup.js` | Beta distribution |

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Ruby | 3.0+ | Runtime |
| Fastlane | 2.x | Automation |
| Xcode | 15+ | iOS builds |
| Android SDK | 34+ | Android builds |

## File Structure

```
skills/fastlane-cicd/
├── SKILL.md     # Detailed skill specification
└── README.md    # This file
```

## Related Skills

- `app-store-connect` - App Store management
- `google-play-console` - Play Store management
- `mobile-testing` - Test automation

## Version

- Current: 1.0.0
- Status: Active
