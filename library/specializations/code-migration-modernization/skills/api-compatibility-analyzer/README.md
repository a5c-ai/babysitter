# API Compatibility Analyzer Skill

## Overview

The API Compatibility Analyzer skill detects breaking changes between API versions. It assesses consumer impact and recommends migration strategies.

## Quick Start

### Prerequisites

- OpenAPI specs for both versions
- Consumer inventory (optional)
- Comparison tooling

### Basic Usage

1. **Compare versions**
   ```bash
   # Using openapi-diff
   openapi-diff v1/openapi.yaml v2/openapi.yaml
   ```

2. **Review breaking changes**
   - Removed endpoints
   - Type changes
   - Required field additions

3. **Plan migration**
   - Assess impact
   - Design compatibility layer
   - Communicate to consumers

## Features

### Change Categories

| Category | Breaking | Example |
|----------|----------|---------|
| Endpoint removed | Yes | DELETE /users/{id} |
| Field removed | Yes | Remove `email` from response |
| Type changed | Yes | string -> integer |
| Field added (optional) | No | Add `nickname` |
| Endpoint added | No | POST /users/bulk |

### Impact Levels

- Critical: All consumers affected
- High: Many consumers affected
- Medium: Some consumers affected
- Low: Few consumers affected

## Configuration

```json
{
  "base": {
    "spec": "./api/v1/openapi.yaml"
  },
  "target": {
    "spec": "./api/v2/openapi.yaml"
  },
  "consumers": {
    "inventory": "./consumers.json"
  },
  "rules": {
    "allowFieldRemoval": false,
    "allowTypeChanges": false
  }
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [OpenAPI-diff](https://github.com/OpenAPITools/openapi-diff)
