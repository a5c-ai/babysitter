---
name: gdpr-consent-manager
description: Implement GDPR-compliant consent management for desktop applications
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [privacy, gdpr, consent, compliance, desktop]
---

# gdpr-consent-manager

Implement GDPR-compliant consent management for desktop applications with user preferences and data handling.

## Capabilities

- Generate consent dialog UI
- Store consent preferences
- Implement consent checking
- Handle data export requests
- Implement data deletion
- Configure consent categories

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "consentCategories": { "type": "array" },
    "framework": { "enum": ["electron", "wpf", "qt", "swiftui"] }
  },
  "required": ["projectPath"]
}
```

## Consent Categories

```javascript
const consentCategories = {
  necessary: {
    title: 'Necessary',
    description: 'Required for basic functionality',
    required: true
  },
  analytics: {
    title: 'Analytics',
    description: 'Help us improve the app',
    required: false
  },
  crashReporting: {
    title: 'Crash Reporting',
    description: 'Help us fix bugs',
    required: false
  }
};
```

## Consent Storage

```javascript
const Store = require('electron-store');
const consentStore = new Store({ name: 'consent' });

function getConsent(category) {
  return consentStore.get(`consent.${category}`, null);
}

function setConsent(category, granted) {
  consentStore.set(`consent.${category}`, granted);
  consentStore.set(`consent.timestamp`, Date.now());
}
```

## Related Skills

- `amplitude-desktop-integration`
- `sentry-desktop-setup`
