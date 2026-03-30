# Firebase Mobile Skill

## Overview

The Firebase Mobile skill provides Firebase backend services integration for mobile applications, enabling authentication, real-time databases, storage, and other cloud services.

## Key Capabilities

- **Authentication**: Email, OAuth, phone, custom tokens
- **Firestore**: Real-time database with offline support
- **Storage**: File uploads with progress tracking
- **Cloud Functions**: Serverless backend logic
- **Remote Config**: Feature flags and A/B testing
- **Performance**: Automatic and custom monitoring

## Quick Start

### Firebase CLI Setup

```bash
npm install -g firebase-tools
firebase login
firebase init
```

## Process Integration

| Process | Usage |
|---------|-------|
| `firebase-backend-integration.js` | Firebase services |
| `firebase-cloud-messaging.js` | Push notifications |
| `mobile-analytics-setup.js` | Analytics |

## File Structure

```
skills/firebase-mobile/
├── SKILL.md     # Detailed specification
└── README.md    # This file
```

## Version

- Current: 1.0.0
- Status: Active
