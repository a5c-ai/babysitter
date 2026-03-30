---
name: interactive-api-console
description: Build interactive API try-it-out consoles for documentation
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Interactive API Console Skill

## Overview

This skill builds interactive API explorers and try-it-out consoles that embed directly into documentation, enabling developers to test API calls without leaving the docs.

## Capabilities

- Embed API explorer in documentation pages
- Auto-generate request examples from OpenAPI specs
- Support authentication injection (API keys, OAuth tokens)
- Enable code snippet generation in multiple languages
- Implement request/response visualization
- Support environment switching (sandbox, production)
- Configure mock responses for unauthenticated users
- Track API console usage analytics

## Target Processes

- API Documentation System
- Developer Portal Implementation
- Developer Experience Optimization

## Integration Points

- Swagger UI for OpenAPI exploration
- Redoc for beautiful API reference
- Stoplight Elements for embedded consoles
- RapiDoc for customizable explorers
- Custom React components

## Input Requirements

- OpenAPI specification
- Authentication configuration
- Environment definitions (sandbox, prod)
- Code generation language preferences
- Branding requirements

## Output Artifacts

- Embedded API console components
- Authentication flow integration
- Code snippet templates
- Environment switcher configuration
- Analytics tracking setup
- Custom theme configuration

## Usage Example

```yaml
skill:
  name: interactive-api-console
  context:
    apiSpec: ./openapi.yaml
    tool: stoplight-elements
    environments:
      - name: sandbox
        baseUrl: https://api.sandbox.example.com
      - name: production
        baseUrl: https://api.example.com
    codeLanguages:
      - curl
      - javascript
      - python
    authMethods:
      - apiKey
      - oauth2
```

## Best Practices

1. Provide sandbox environments for safe testing
2. Pre-populate examples with realistic data
3. Show full request/response including headers
4. Support copy-to-clipboard for all code
5. Maintain state across documentation pages
6. Implement proper error visualization
