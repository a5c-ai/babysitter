# Technical Writing Lint Skill

Automated technical writing style and quality enforcement.

## Overview

This skill provides comprehensive documentation quality analysis using Vale, alex.js, write-good, and custom rules. It enforces style guide compliance, checks for inclusive language, and provides readability analysis.

## When to Use

- Enforcing style guide standards (Google, Microsoft)
- Checking for inclusive language
- Analyzing content readability
- Ensuring terminology consistency
- Running documentation quality gates in CI/CD

## Quick Start

### Basic Linting

```json
{
  "inputPath": "./docs",
  "action": "lint",
  "styleGuide": "google"
}
```

### Readability Analysis

```json
{
  "inputPath": "./docs/quickstart.md",
  "action": "readability",
  "minReadability": 60
}
```

### Terminology Check

```json
{
  "inputPath": "./docs",
  "action": "terminology",
  "glossaryPath": "./glossary.yml"
}
```

## Key Features

### 1. Vale Linting
- Google/Microsoft style guides
- Custom rule creation
- Package ecosystem

### 2. Inclusive Language
- alex.js integration
- Bias detection
- Suggested alternatives

### 3. Readability Metrics
- Flesch-Kincaid score
- Gunning Fog index
- Sentence complexity analysis

### 4. Terminology Management
- Glossary validation
- Consistency checking
- Prohibited term detection

## Vale Configuration

Create `.vale.ini`:

```ini
StylesPath = .vale/styles
MinAlertLevel = suggestion
Packages = Google

[*.md]
BasedOnStyles = Vale, Google
```

Install and sync:

```bash
vale sync
vale docs/
```

## Common Rules

| Rule | Style Guide | Description |
|------|-------------|-------------|
| Google.Passive | Google | Avoid passive voice |
| Google.We | Google | Avoid first person plural |
| Microsoft.Contractions | Microsoft | Avoid contractions |
| write-good.Weasel | write-good | Flag weasel words |
| alex.Profanity | alex | Inclusive language |

## Readability Targets

| Audience | Flesch-Kincaid | Gunning Fog |
|----------|----------------|-------------|
| General | 60-70 | 8-10 |
| Technical | 50-60 | 10-12 |
| Expert | 40-50 | 12-14 |

## CLI Commands

```bash
# Lint with Vale
vale docs/

# Check inclusive language
npx alex docs/

# Write-good analysis
npx write-good docs/**/*.md
```

## Process Integration

| Process | Usage |
|---------|-------|
| `style-guide-enforcement.js` | Enforce writing standards |
| `docs-testing.js` | Quality gates in CI |
| `docs-audit.js` | Content quality review |
| `terminology-management.js` | Glossary validation |

## Dependencies

- Vale CLI
- alex
- write-good
- proselint

## References

- [Vale](https://vale.sh/)
- [alex.js](https://alexjs.com/)
- [Google Style Guide](https://developers.google.com/style)
- [Microsoft Style Guide](https://docs.microsoft.com/en-us/style-guide/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-007
**Category:** Quality Assurance
**Status:** Active
