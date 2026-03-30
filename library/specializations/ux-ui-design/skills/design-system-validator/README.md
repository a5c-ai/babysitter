# Design System Validator Skill

Validate design system compliance and detect token usage violations.

## Overview

This skill scans codebases to ensure design system tokens and components are used correctly, helping maintain consistency and preventing style drift.

## Key Features

- **Token Validation**: Check color, spacing, typography tokens
- **Hard-Code Detection**: Find values that should use tokens
- **Compliance Scoring**: Quantitative compliance metrics
- **Violation Reports**: Detailed issue documentation
- **Linter Integration**: ESLint and Stylelint support

## When to Use

- CI/CD pipeline design system checks
- Pre-commit validation
- Design system adoption audits
- Identifying style inconsistencies

## Validation Rules

| Rule | Description |
|------|-------------|
| Token Colors | All colors must use tokens |
| Token Spacing | All margins/padding must use tokens |
| Token Typography | Font sizes/weights must use tokens |
| Naming Conventions | Component/class naming standards |

## Related Components

- **Skills**: component-inventory, design-token-transformer
- **Agents**: design-token-manager, design-documentation-agent
- **Processes**: design-system.js, component-library.js
