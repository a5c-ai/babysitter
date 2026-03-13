# Link Validation Skill

Comprehensive link checking and validation for documentation.

## Overview

This skill provides thorough link validation for documentation including internal cross-references, external URLs, anchor fragments, redirect detection, and link rot monitoring with archive.org fallback suggestions.

## When to Use

- Validating all documentation links
- Checking for broken external URLs
- Verifying anchor references
- Detecting and fixing redirects
- Monitoring link health over time

## Quick Start

### Validate All Links

```json
{
  "inputPath": "./docs",
  "action": "validate",
  "checkExternal": true
}
```

### Fix Redirects

```json
{
  "inputPath": "./docs",
  "action": "fix-redirects"
}
```

## Key Features

### 1. Internal Links
- File existence checks
- Anchor validation
- Case sensitivity

### 2. External Links
- HTTP status checking
- Retry with backoff
- Timeout handling

### 3. Redirect Detection
- 301/302 detection
- Auto-fix suggestions
- Chain following

### 4. Link Monitoring
- Scheduled checks
- Historical tracking
- Trend analysis

### 5. Archive.org
- Fallback suggestions
- Wayback API integration

## Validation Report

```json
{
  "summary": {
    "total": 342,
    "valid": 325,
    "broken": 12,
    "redirected": 5
  },
  "issues": [
    {
      "type": "broken",
      "url": "https://example.com/old",
      "status": 404,
      "source": {
        "file": "docs/guide.md",
        "line": 42
      }
    }
  ]
}
```

## Configuration

```json
{
  "options": {
    "checkExternal": true,
    "timeout": 30000,
    "retries": 3,
    "concurrency": 10
  },
  "blocked": {
    "domains": ["twitter.com"]
  }
}
```

## CLI Commands

```bash
# linkinator
npx linkinator ./docs --recurse

# lychee (fast, Rust-based)
lychee './docs/**/*.md'

# markdown-link-check
npx markdown-link-check docs/guide.md
```

## CI/CD Integration

```yaml
- name: Check links
  uses: lycheeverse/lychee-action@v1
  with:
    args: './docs/**/*.md'
```

## Process Integration

| Process | Usage |
|---------|-------|
| `docs-testing.js` | CI validation |
| `docs-audit.js` | Health monitoring |
| `docs-pr-workflow.js` | PR checks |

## Dependencies

- linkinator
- lychee
- markdown-link-check

## References

- [linkinator](https://github.com/JustinBeckwith/linkinator)
- [lychee](https://github.com/lycheeverse/lychee)
- [Archive.org API](https://archive.org/help/wayback_api.php)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-009
**Category:** Quality Assurance
**Status:** Active
