---
name: idp-configurator
description: Configure Internal Developer Platform (IDP) components
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# IDP Configurator Skill

## Overview

This skill configures Internal Developer Platform (IDP) components including service catalogs, golden path templates, and self-service workflows for internal development teams.

## Capabilities

- Set up Backstage service catalogs
- Configure golden path templates
- Implement self-service workflows
- Integrate with CI/CD systems
- Set up software templates
- Configure TechDocs integration
- Implement scaffolder actions
- Design developer portal UX

## Target Processes

- Internal Developer Platform Setup
- Developer Portal Implementation
- SDK Architecture Design

## Integration Points

- Backstage platform
- Port developer portal
- Cortex for service management
- GitHub/GitLab for templates
- CI/CD systems

## Input Requirements

- Service catalog requirements
- Template requirements
- Workflow definitions
- Integration needs
- User roles and permissions

## Output Artifacts

- Backstage configuration
- Software templates
- Catalog entity definitions
- TechDocs setup
- CI/CD integrations
- Custom plugins

## Usage Example

```yaml
skill:
  name: idp-configurator
  context:
    platform: backstage
    catalog:
      entities:
        - kind: Component
          type: service
        - kind: API
          type: openapi
    templates:
      - name: typescript-service
        path: ./templates/typescript-service
      - name: python-sdk
        path: ./templates/python-sdk
    integrations:
      github:
        enabled: true
      jenkins:
        enabled: true
    techDocs:
      builder: local
```

## Best Practices

1. Start with golden paths for common use cases
2. Integrate service catalog with CI/CD
3. Provide self-service provisioning
4. Document everything with TechDocs
5. Track developer productivity metrics
6. Iterate based on developer feedback
