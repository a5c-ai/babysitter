---
name: developer-portal-builder
description: Build unified developer portals with Backstage or custom frameworks
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Developer Portal Builder Skill

## Overview

This skill builds comprehensive developer portals that unify API discovery, documentation, credential management, and analytics into a single cohesive experience.

## Capabilities

- Configure service catalog and API discovery
- Implement credential management UI (API keys, OAuth apps)
- Build API discovery and search features
- Integrate analytics and usage dashboards
- Configure self-service onboarding flows
- Implement rate limit and quota visualization
- Build webhook management interfaces
- Support multi-tenant portal configurations

## Target Processes

- Developer Portal Implementation
- Internal Developer Platform Setup
- Developer Experience Optimization

## Integration Points

- Backstage for internal platforms
- Port for developer portals
- Custom React/Next.js applications
- Stripe-style portal patterns
- API management platforms (Kong, Apigee)

## Input Requirements

- API catalog requirements
- Authentication/authorization model
- Credential types to manage
- Analytics requirements
- Branding and UX guidelines
- Multi-tenancy requirements

## Output Artifacts

- Developer portal application
- Service catalog configuration
- Credential management system
- Analytics dashboard
- Onboarding flow implementation
- Documentation integration
- Admin panel for portal management

## Usage Example

```yaml
skill:
  name: developer-portal-builder
  context:
    framework: backstage
    features:
      - apiCatalog
      - credentialManagement
      - usageDashboard
      - webhookManagement
    authProvider: auth0
    multiTenant: false
    customBranding: true
```

## Best Practices

1. Prioritize time-to-first-call metrics
2. Implement self-service credential management
3. Provide clear usage and billing visibility
4. Enable easy environment switching
5. Include comprehensive search functionality
6. Support team and organization management
