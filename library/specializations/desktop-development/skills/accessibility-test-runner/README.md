# accessibility-test-runner

Run accessibility audits with axe-core.

## Quick Start

```javascript
const result = await invokeSkill('accessibility-test-runner', {
  projectPath: '/path/to/project',
  wcagLevel: 'AA',
  testFramework: 'playwright'
});
```

## Features

- axe-core integration
- WCAG compliance testing
- Keyboard navigation tests
- Screen reader testing

## Related Skills

- `qt-widget-accessibility-audit`
- `desktop-accessibility` process
