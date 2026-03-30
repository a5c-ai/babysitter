# Accessibility Verifier Agent

Accessibility verification agent that ensures pixel-perfect implementations maintain WCAG compliance and usability standards.

## Overview

This agent verifies that UI implementations meet accessibility requirements, checking contrast ratios, semantic structure, keyboard navigation, and screen reader compatibility.

## WCAG Compliance Levels

| Level | Description | Common Criteria |
|-------|-------------|-----------------|
| A | Minimum | Alt text, keyboard access, no traps |
| AA | Recommended | 4.5:1 contrast, resize text, focus visible |
| AAA | Enhanced | 7:1 contrast, extended audio description |

## Checks Performed

### Contrast Analysis
- Text contrast (4.5:1 for normal, 3:1 for large text)
- UI component borders (3:1)
- Focus indicator contrast

### Semantic Structure
- Heading hierarchy (h1 → h2 → h3)
- Landmark regions (nav, main, footer)
- List markup

### Keyboard Navigation
- Tab order logic
- Focus visibility
- Keyboard traps

### Screen Reader
- ARIA labels and roles
- Alt text for images
- Form labels

## Usage

This agent is called as an optional phase when `includeAccessibility: true`.

### Example Input

```json
{
  "targetUrl": "http://localhost:3000",
  "screenshotPath": "artifacts/screenshot.png",
  "wcagLevel": "AA",
  "checkCategories": {
    "contrast": true,
    "semantics": true,
    "keyboard": true,
    "screenReader": true,
    "motion": true
  }
}
```

### Example Output

```json
{
  "overallStatus": "warning",
  "wcagLevel": "AA",
  "contrastResults": {
    "status": "pass",
    "issues": []
  },
  "semanticResults": {
    "status": "warning",
    "headingHierarchy": {
      "valid": false,
      "issues": ["Missing h1 on page"]
    }
  },
  "keyboardResults": {
    "status": "pass"
  },
  "summary": {
    "totalIssues": 1,
    "critical": 0,
    "major": 1,
    "minor": 0
  },
  "complianceStatement": "Partial WCAG AA compliance - 1 issue to address"
}
```

## Related

- [pixel-perfect-implementation.js](../../pixel-perfect-implementation.js) - Main process
- [responsive-verifier](../responsive-verifier/) - Responsive agent
- [wcag-accessibility-auditor](../wcag-accessibility-auditor/) - Full WCAG auditor
