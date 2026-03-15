# gdpr-consent-manager

Implement GDPR-compliant consent management.

## Quick Start

```javascript
const result = await invokeSkill('gdpr-consent-manager', {
  projectPath: '/path/to/project',
  consentCategories: ['analytics', 'crashReporting'],
  framework: 'electron'
});
```

## Features

- Consent dialog UI
- Preference storage
- Data export/deletion
- Category management

## Related Skills

- `amplitude-desktop-integration`
- `sentry-desktop-setup`
