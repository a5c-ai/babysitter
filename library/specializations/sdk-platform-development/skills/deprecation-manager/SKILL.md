---
name: deprecation-manager
description: Manage API and SDK deprecation lifecycle
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Deprecation Manager Skill

## Overview

This skill manages the complete deprecation lifecycle for APIs and SDKs, from initial deprecation notices through sunset, ensuring smooth transitions for API consumers.

## Capabilities

- Track deprecation timelines and milestones
- Inject deprecation warnings in SDK code
- Send sunset notifications to API consumers
- Generate migration documentation automatically
- Monitor deprecated endpoint usage
- Configure Sunset and Deprecation HTTP headers
- Implement gradual deprecation with usage thresholds
- Archive deprecated documentation appropriately

## Target Processes

- Backward Compatibility Management
- API Versioning Strategy
- SDK Versioning and Release Management

## Integration Points

- Sunset header injection middleware
- Deprecation annotation processors
- Usage analytics systems
- Email/notification services
- Documentation platforms

## Input Requirements

- Deprecation policy and timelines
- Affected endpoints/features list
- Replacement/migration paths
- Consumer notification requirements
- Usage monitoring access

## Output Artifacts

- Deprecation timeline documentation
- SDK deprecation annotations
- Migration guides
- Sunset header configurations
- Consumer notification templates
- Usage monitoring dashboards
- Archived documentation

## Usage Example

```yaml
skill:
  name: deprecation-manager
  context:
    deprecationPolicy: ./docs/deprecation-policy.md
    features:
      - featureId: legacy-auth
        deprecationDate: "2024-06-01"
        sunsetDate: "2024-12-01"
        replacement: oauth2-flow
    notificationChannels:
      - email
      - dashboard
      - sdkWarnings
    usageThreshold: 100
```

## Best Practices

1. Announce deprecations well in advance (6+ months)
2. Provide clear migration paths with examples
3. Monitor usage before sunset
4. Send multiple reminder notifications
5. Keep deprecated docs available but marked
6. Implement gradual rate limiting before full sunset
