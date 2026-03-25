# Documentation Accessibility Skill

Documentation accessibility validation and remediation.

## Overview

This skill provides comprehensive accessibility auditing for documentation, including WCAG 2.1 compliance checking, alt text validation, heading structure analysis, color contrast verification, and keyboard navigation testing.

## When to Use

- Auditing documentation for accessibility compliance
- Validating image alt text
- Checking heading hierarchy
- Verifying color contrast ratios
- Testing keyboard navigation

## Quick Start

### Run Accessibility Audit

```json
{
  "inputPath": "./docs/_build/html",
  "action": "audit",
  "standard": "AA"
}
```

### Validate Images

```json
{
  "inputPath": "./docs",
  "action": "validate-images"
}
```

### Check Headings

```json
{
  "inputPath": "./docs",
  "action": "check-headings"
}
```

## Key Features

### 1. WCAG Compliance
- Level A, AA, AAA checks
- Perceivable, Operable, Understandable
- Full guideline coverage

### 2. Image Accessibility
- Alt text presence
- Descriptive quality
- Decorative handling

### 3. Heading Structure
- Hierarchy validation
- Skip detection
- Multiple H1 check

### 4. Color Contrast
- 4.5:1 for normal text
- 3:1 for large text
- Fix suggestions

### 5. Keyboard Navigation
- Focus visibility
- Tab order
- Skip links

## Audit Report

```json
{
  "summary": {
    "total": 156,
    "passed": 142,
    "failed": 14,
    "score": 91
  },
  "issues": [
    {
      "id": "img-alt-missing",
      "wcag": "1.1.1",
      "impact": "critical",
      "location": "docs/guide.md:42"
    }
  ]
}
```

## WCAG Levels

| Level | Requirement |
|-------|-------------|
| A | Essential accessibility |
| AA | Standard compliance (recommended) |
| AAA | Enhanced accessibility |

## Common Issues

| Issue | WCAG | Fix |
|-------|------|-----|
| Missing alt text | 1.1.1 | Add descriptive alt |
| Low contrast | 1.4.3 | Darken text color |
| Skipped heading | 1.3.1 | Fix hierarchy |
| No focus style | 2.4.7 | Add outline/ring |

## CLI Commands

```bash
# axe-core
npx axe ./docs/_build/html

# pa11y
npx pa11y https://docs.example.com

# Lighthouse
npx lighthouse https://docs.example.com --only-categories=accessibility
```

## Process Integration

| Process | Usage |
|---------|-------|
| `docs-testing.js` | Accessibility checks |
| `docs-audit.js` | Compliance audit |
| `style-guide-enforcement.js` | Alt text standards |

## Dependencies

- axe-core
- pa11y
- lighthouse
- puppeteer

## References

- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core](https://github.com/dequelabs/axe-core)
- [pa11y](https://pa11y.org/)
- [WebAIM](https://webaim.org/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-019
**Category:** Quality Assurance
**Status:** Active
