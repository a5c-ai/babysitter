# Documentation Generator Skill

## Overview

The Documentation Generator skill creates comprehensive documentation for migrated systems. It generates API docs, architecture diagrams, and operational runbooks.

## Quick Start

### Prerequisites

- Source specifications
- Documentation templates
- Diagram tools

### Basic Usage

1. **Generate API docs**
   ```bash
   # From OpenAPI
   npx redoc-cli build openapi.yaml
   ```

2. **Create architecture docs**
   - Generate diagrams
   - Document components
   - Map relationships

3. **Build runbooks**
   - Document procedures
   - Add troubleshooting
   - Include checklists

## Features

### Documentation Types

| Type | Purpose | Format |
|------|---------|--------|
| API Reference | Developer reference | HTML/PDF |
| Architecture | System overview | Markdown + Diagrams |
| Runbooks | Operations | Markdown |
| Guides | User guidance | HTML |

### Diagram Types

- C4 Model diagrams
- Sequence diagrams
- Data flow diagrams
- Deployment diagrams

## Configuration

```json
{
  "input": {
    "openapi": "./api/openapi.yaml",
    "architecture": "./docs/architecture.md",
    "templates": "./templates/"
  },
  "output": {
    "format": ["html", "pdf"],
    "directory": "./documentation"
  },
  "diagrams": {
    "tool": "mermaid",
    "include": ["architecture", "sequence", "deployment"]
  }
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [Backstage](https://backstage.io/)
- [MkDocs](https://www.mkdocs.org/)
