---
name: plugin-registry-manager
description: Manage SDK plugin discovery and registration
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Plugin Registry Manager Skill

## Overview

This skill manages SDK plugin ecosystems including discovery, registration, validation, and lifecycle management for extensible SDK architectures.

## Capabilities

- Design plugin interface contracts
- Implement plugin loading and registration
- Validate plugin compatibility versions
- Document plugin API for developers
- Implement plugin discovery mechanisms
- Support plugin configuration
- Manage plugin lifecycle events
- Create plugin development tooling

## Target Processes

- Plugin and Extension Architecture
- SDK Architecture Design
- Developer Experience Optimization

## Integration Points

- Plugin registries (npm, PyPI)
- SDK extension points
- Configuration systems
- Version compatibility checkers
- Plugin development CLIs

## Input Requirements

- Plugin interface requirements
- Compatibility rules
- Discovery mechanisms
- Lifecycle requirements
- Documentation needs

## Output Artifacts

- Plugin interface definitions
- Plugin loader implementation
- Compatibility validator
- Plugin documentation generator
- Discovery mechanism
- Plugin CLI tools

## Usage Example

```yaml
skill:
  name: plugin-registry-manager
  context:
    pluginInterface:
      version: "1.0"
      hooks:
        - onInit
        - onRequest
        - onResponse
        - onError
    discovery:
      patterns:
        - "@mysdk/plugin-*"
        - "mysdk-plugin-*"
      sources:
        - npm
        - local
    compatibility:
      sdkVersion: "semver"
      nodeVersion: ">=16"
    lifecycle:
      init: true
      shutdown: true
```

## Best Practices

1. Version plugin interfaces explicitly
2. Validate compatibility before loading
3. Support local development plugins
4. Provide plugin development CLI
5. Document plugin authoring clearly
6. Handle plugin failures gracefully
