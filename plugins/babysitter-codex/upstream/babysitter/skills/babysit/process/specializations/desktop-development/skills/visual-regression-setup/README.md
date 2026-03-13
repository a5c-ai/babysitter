# visual-regression-setup

Configure visual regression testing for desktop apps.

## Quick Start

```javascript
const result = await invokeSkill('visual-regression-setup', {
  projectPath: '/path/to/project',
  provider: 'percy',
  framework: 'playwright'
});
```

## Features

- Percy/Chromatic integration
- Screenshot comparison
- Threshold configuration
- CI/CD integration

## Related Skills

- `playwright-electron-config`
- `desktop-ui-testing` process
