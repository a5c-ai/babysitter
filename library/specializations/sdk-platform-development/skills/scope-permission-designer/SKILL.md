---
name: scope-permission-designer
description: Design and implement scoped permission models
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Scope Permission Designer Skill

## Overview

This skill designs and implements OAuth scopes and permission models for APIs, enabling fine-grained access control that maps to business requirements.

## Capabilities

- Design scope hierarchies and inheritance
- Implement permission validation in SDK/API
- Generate comprehensive scope documentation
- Support scope-based access control (SBAC)
- Configure scope consent flows
- Implement resource-level permissions
- Design scope grouping and bundles
- Generate scope matrices for documentation

## Target Processes

- Authentication and Authorization Patterns
- Developer Portal Implementation
- API Design Specification

## Integration Points

- OAuth authorization servers
- Policy engines (OPA, Cedar)
- RBAC/ABAC systems
- API gateway authorization
- Consent management UIs

## Input Requirements

- Business requirements for access control
- Resource and action mapping
- Scope naming conventions
- Hierarchy requirements
- Consent flow needs

## Output Artifacts

- Scope taxonomy documentation
- Permission validation middleware
- Scope documentation for developers
- Consent UI components
- Scope matrices and mappings
- Admin permission management API

## Usage Example

```yaml
skill:
  name: scope-permission-designer
  context:
    scopeFormat: "resource:action"
    hierarchy:
      admin: ["read", "write", "delete"]
      write: ["read"]
    scopes:
      - users:read
      - users:write
      - users:delete
      - projects:read
      - projects:write
    bundles:
      - name: basic
        scopes: ["users:read", "projects:read"]
      - name: full
        scopes: ["users:*", "projects:*"]
```

## Best Practices

1. Use consistent naming conventions
2. Design scopes around resources and actions
3. Implement scope hierarchies to reduce complexity
4. Document all scopes clearly
5. Provide sensible default scope bundles
6. Support both fine-grained and coarse permissions
