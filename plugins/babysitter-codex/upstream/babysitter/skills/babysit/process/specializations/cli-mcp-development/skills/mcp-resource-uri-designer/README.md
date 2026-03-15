# MCP Resource URI Designer Skill

Design and implement MCP resource URI schemes and templates for structured resource access.

## Overview

This skill helps design and implement URI schemes for MCP resources, creating consistent patterns for resource identification and access.

## When to Use

- Designing URI schemes for MCP resources
- Creating URI template patterns
- Implementing resource hierarchies
- Documenting resource APIs

## Quick Start

```json
{
  "domain": "database",
  "resources": [
    {
      "pattern": "db://{database}/tables/{table}",
      "name": "Database Table",
      "mimeType": "application/json"
    }
  ]
}
```

## Features

- URI scheme design
- Template pattern generation
- Parsing utilities
- Content type mapping
- Documentation generation

## Integration with Processes

| Process | Integration |
|---------|-------------|
| mcp-resource-provider | URI scheme design |
| mcp-server-bootstrap | Resource registration |
| mcp-tool-documentation | URI documentation |
