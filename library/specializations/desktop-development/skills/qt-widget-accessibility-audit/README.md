# qt-widget-accessibility-audit

Audit Qt Widget applications for accessibility compliance.

## Overview

This skill audits Qt applications for accessibility compliance, checking QAccessible implementations, keyboard navigation, screen reader compatibility, and WCAG guidelines.

## Quick Start

```javascript
const result = await invokeSkill('qt-widget-accessibility-audit', {
  projectPath: '/path/to/qt-project',
  auditLevel: 'wcag-aa',
  targetPlatform: 'windows',
  checkCategories: ['keyboard', 'screen-reader', 'visual', 'focus', 'labels']
});
```

## Features

### Check Categories

| Category | Checks |
|----------|--------|
| keyboard | Focus policy, tab order, key handlers |
| screen-reader | Accessible names, roles, descriptions |
| visual | Color contrast, text scaling |
| focus | Focus indicators, focus trapping |
| labels | Form labels, button text |

### WCAG Levels

- **WCAG A**: Basic accessibility
- **WCAG AA**: Standard compliance (recommended)
- **WCAG AAA**: Enhanced accessibility

## Output

```json
{
  "complianceLevel": "wcag-aa",
  "score": 85,
  "issues": [
    {
      "severity": "major",
      "category": "labels",
      "wcagCriteria": "1.1.1",
      "description": "Icon button missing accessible name",
      "widget": "saveButton",
      "recommendation": "Add setAccessibleName()"
    }
  ]
}
```

## Related Skills

- `accessibility-test-runner`
- `qt-qml-component-generator`

## Related Agents

- `accessibility-compliance-auditor`
- `qt-cpp-specialist`
