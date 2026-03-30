---
name: configuration-migrator
description: Migrate configuration files between formats and versions with environment variable extraction
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Configuration Migrator Skill

Migrates configuration files between different formats and versions, handles environment variable extraction, and manages secret detection.

## Purpose

Enable configuration migration for:
- Config format conversion
- Environment variable extraction
- Secret detection and handling
- Schema validation
- Template generation

## Capabilities

### 1. Config Format Conversion
- XML to YAML/JSON
- Properties to YAML
- INI to JSON
- TOML conversion
- ENV file handling

### 2. Environment Variable Extraction
- Identify environment-specific values
- Extract to env files
- Create variable references
- Document variables

### 3. Secret Detection
- Find hardcoded secrets
- Identify credentials
- Detect API keys
- Flag sensitive data

### 4. Schema Validation
- Validate against schemas
- Check required fields
- Verify data types
- Ensure compatibility

### 5. Default Value Handling
- Preserve defaults
- Document required overrides
- Create sensible defaults
- Handle missing values

### 6. Template Generation
- Create config templates
- Generate example files
- Document all options
- Support multiple environments

## Tool Integrations

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| yq | YAML processing | CLI |
| jq | JSON processing | CLI |
| dotenv | ENV file handling | Library |
| git-secrets | Secret detection | CLI |
| Config validators | Schema validation | CLI |

## Output Schema

```json
{
  "migrationId": "string",
  "timestamp": "ISO8601",
  "source": {
    "format": "string",
    "path": "string"
  },
  "target": {
    "format": "string",
    "path": "string"
  },
  "conversions": [
    {
      "sourceKey": "string",
      "targetKey": "string",
      "transformation": "string"
    }
  ],
  "extracted": {
    "envVariables": [],
    "secrets": []
  },
  "validation": {
    "valid": "boolean",
    "errors": [],
    "warnings": []
  }
}
```

## Integration with Migration Processes

- **configuration-migration**: Primary tool
- **framework-upgrade**: Config version updates
- **cloud-migration**: Cloud config adaptation

## Related Skills

- `compliance-validator`: Secret compliance

## Related Agents

- `configuration-centralization-agent`: Config modernization
