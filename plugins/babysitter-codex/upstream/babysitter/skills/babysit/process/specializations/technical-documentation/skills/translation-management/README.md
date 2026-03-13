# Translation Management Skill

Integration with translation management systems and i18n workflows.

## Overview

This skill provides integration with translation management systems (TMS) like Crowdin, Transifex, and Weblate. It supports translation memory management, glossary synchronization, pseudo-localization, and automated localization pipelines.

## When to Use

- Setting up translation workflows
- Syncing content with TMS platforms
- Managing translation memory and glossaries
- Generating pseudo-localizations for testing
- Automating localization pipelines

## Quick Start

### Upload to Crowdin

```json
{
  "platform": "crowdin",
  "action": "upload",
  "sourcePath": "./docs/en"
}
```

### Download Translations

```json
{
  "platform": "crowdin",
  "action": "download",
  "targetLocales": ["es", "fr", "de"]
}
```

### Sync Glossary

```json
{
  "platform": "crowdin",
  "action": "sync-glossary",
  "glossaryPath": "./glossary.csv"
}
```

## Supported Platforms

| Platform | Upload | Download | TM | Glossary |
|----------|--------|----------|-----|----------|
| Crowdin | Yes | Yes | Yes | Yes |
| Transifex | Yes | Yes | Yes | Yes |
| Weblate | Yes | Yes | Yes | Yes |

## Key Features

### 1. TMS Integration
- API-based upload/download
- Progress tracking
- Build triggers

### 2. Translation Memory
- Fuzzy matching
- TMX import/export
- Consistency checks

### 3. Glossary Management
- Term definitions
- Do-not-translate flags
- Cross-platform sync

### 4. Pseudo-Localization
- Text expansion testing
- Accented characters
- UI overflow detection

## Configuration Examples

### Crowdin (crowdin.yml)

```yaml
project_id: 123456
api_token_env: CROWDIN_TOKEN
files:
  - source: /en/**/*.md
    translation: /%locale%/**/%original_file_name%
```

### Transifex (.tx/config)

```ini
[o:myorg:p:mydocs:r:documentation]
source_file = docs/en/**/*.md
file_filter = docs/<lang>/**/*.md
```

## CLI Commands

```bash
# Crowdin
crowdin upload sources
crowdin download

# Transifex
tx push -s
tx pull -a
```

## Process Integration

| Process | Usage |
|---------|-------|
| `docs-localization.js` | Translation workflows |
| `terminology-management.js` | Glossary sync |
| `content-strategy.js` | i18n planning |

## Dependencies

- @crowdin/crowdin-api-client
- transifex-api
- csv-parse

## References

- [Crowdin](https://crowdin.com/)
- [Transifex](https://www.transifex.com/)
- [Weblate](https://weblate.org/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-010
**Category:** Localization
**Status:** Active
