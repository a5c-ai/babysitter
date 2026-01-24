# API Inventory Scanner Skill

## Overview

The API Inventory Scanner skill discovers and documents API endpoints. It extracts endpoint information from code, logs, and traffic to create comprehensive API inventories.

## Quick Start

### Prerequisites

- Access to codebase
- Optional: API logs/traffic
- Framework knowledge

### Basic Usage

1. **Scan code**
   - Parse route definitions
   - Extract controllers
   - Find annotations

2. **Analyze traffic**
   - Review access logs
   - Capture live traffic
   - Identify patterns

3. **Document APIs**
   - Create endpoint inventory
   - Document schemas
   - Map consumers

## Features

### Discovery Methods

| Method | Source | Coverage |
|--------|--------|----------|
| Code parsing | Source code | High |
| Traffic analysis | Logs | Real usage |
| Framework introspection | Runtime | Complete |
| Manual capture | Postman | Targeted |

### Output Formats

- OpenAPI 3.0 specification
- JSON inventory
- Markdown documentation
- Postman collection

## Configuration

```json
{
  "discovery": {
    "codeAnalysis": true,
    "logAnalysis": true,
    "trafficCapture": false
  },
  "sources": {
    "codePaths": ["./src/routes", "./src/controllers"],
    "logFiles": ["./logs/access.log"],
    "framework": "express"
  },
  "output": {
    "format": "openapi",
    "path": "./api-inventory.yaml"
  }
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
