# Contrast Checker Skill

Validate color contrast ratios for WCAG accessibility compliance.

## Overview

This skill calculates color contrast ratios and validates them against WCAG 2.1 guidelines, helping ensure text readability for all users.

## Key Features

- **WCAG Calculation**: Precise contrast ratio computation
- **Multi-Level Validation**: AA and AAA compliance checks
- **Text Size Awareness**: Normal vs large text requirements
- **Alternative Suggestions**: Passing color recommendations
- **Batch Processing**: Check multiple pairs at once

## When to Use

- Validating color palette accessibility
- Checking text/background combinations
- Design system color audits
- Fixing contrast failures

## WCAG Requirements

| Level | Normal Text | Large Text |
|-------|-------------|------------|
| AA | 4.5:1 | 3:1 |
| AAA | 7:1 | 4.5:1 |

**Large text**: 18pt+ or 14pt+ bold

## Related Components

- **Skills**: color-palette-generator, accessibility-report
- **Agents**: color-contrast-analyzer, wcag-accessibility-auditor
- **Processes**: accessibility-audit.js, design-system.js
