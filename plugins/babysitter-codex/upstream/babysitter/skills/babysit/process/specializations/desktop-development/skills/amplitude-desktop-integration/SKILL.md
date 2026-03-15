---
name: amplitude-desktop-integration
description: Integrate Amplitude analytics with privacy controls for desktop applications
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [analytics, amplitude, tracking, privacy, desktop]
---

# amplitude-desktop-integration

Integrate Amplitude analytics into desktop applications with privacy controls and event tracking.

## Capabilities

- Configure Amplitude SDK
- Implement event tracking
- Set up user identification
- Configure privacy controls
- Implement offline caching
- Set up A/B testing

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "apiKey": { "type": "string" },
    "privacyMode": { "enum": ["full", "minimal", "opt-in"] }
  },
  "required": ["projectPath"]
}
```

## Integration

```javascript
import * as amplitude from '@amplitude/analytics-browser';

amplitude.init('YOUR_API_KEY', undefined, {
  defaultTracking: {
    sessions: true,
    pageViews: false, // Desktop apps don't have pages
    formInteractions: false,
    fileDownloads: false
  },
  optOut: !userConsentedToAnalytics()
});

// Track events
amplitude.track('Feature Used', {
  featureName: 'Export',
  fileFormat: 'PDF'
});
```

## Privacy Controls

- Opt-in/opt-out management
- Data minimization
- User ID anonymization
- GDPR compliance helpers

## Related Skills

- `sentry-desktop-setup`
- `gdpr-consent-manager`
