# Configuration Migrator Skill

## Overview

The Configuration Migrator skill converts configuration files between formats and versions. It handles environment variable extraction and ensures secrets are properly managed.

## Quick Start

### Prerequisites

- Configuration files to migrate
- Target format specification
- Environment variable strategy

### Basic Usage

1. **Analyze current config**
   - Identify format
   - Find secrets
   - Map structure

2. **Convert format**
   ```bash
   # YAML to JSON
   yq eval -o=json config.yaml > config.json
   ```

3. **Extract variables**
   - Create .env template
   - Document variables
   - Update references

## Features

### Format Conversions

| From | To | Tool |
|------|-----|------|
| XML | YAML | yq/custom |
| Properties | YAML | yq |
| INI | JSON | custom |
| YAML | JSON | yq |

### Secret Handling

- Detect hardcoded secrets
- Extract to secure storage
- Create references
- Document rotation

## Configuration

```json
{
  "source": {
    "format": "xml",
    "path": "./config/app-config.xml"
  },
  "target": {
    "format": "yaml",
    "path": "./config/app-config.yaml"
  },
  "extractSecrets": true,
  "envFileOutput": "./.env.template"
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
