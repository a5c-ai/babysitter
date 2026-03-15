---
name: strangler-fig-orchestrator
description: Orchestrate strangler fig pattern implementation for gradual migration with traffic routing and cutover management
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Strangler Fig Orchestrator Skill

Orchestrates the strangler fig pattern implementation for gradual migration from legacy to modern systems with traffic routing and cutover management.

## Purpose

Enable incremental migration for:
- Traffic routing configuration
- Feature flag management
- Gradual cutover orchestration
- Rollback coordination
- Legacy component sunset

## Capabilities

### 1. Traffic Routing Configuration
- Configure API gateway rules
- Set up routing weights
- Handle header-based routing
- Manage path-based routing

### 2. Feature Flag Management
- Create feature flags
- Control rollout percentage
- Manage user segments
- Handle A/B testing

### 3. Gradual Cutover Orchestration
- Plan cutover phases
- Execute incremental shifts
- Monitor health metrics
- Coordinate teams

### 4. Rollback Coordination
- Define rollback triggers
- Automate rollback
- Preserve state
- Document recovery

### 5. Progress Tracking
- Track migration progress
- Monitor adoption rates
- Report on status
- Visualize timeline

### 6. Legacy Component Sunset
- Plan decommissioning
- Verify no traffic
- Archive data
- Clean up resources

## Tool Integrations

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| API Gateways | Traffic routing | Config/API |
| LaunchDarkly | Feature flags | API |
| Split.io | Feature management | API |
| Consul | Service mesh | API |
| Istio | Traffic management | Config |

## Output Schema

```json
{
  "orchestrationId": "string",
  "timestamp": "ISO8601",
  "migration": {
    "legacy": {
      "system": "string",
      "endpoints": []
    },
    "modern": {
      "system": "string",
      "endpoints": []
    }
  },
  "routing": {
    "strategy": "string",
    "rules": [],
    "currentWeights": {}
  },
  "progress": {
    "phase": "string",
    "percentMigrated": "number",
    "remainingEndpoints": []
  },
  "rollback": {
    "available": "boolean",
    "lastCheckpoint": "string"
  }
}
```

## Integration with Migration Processes

- **monolith-to-microservices**: Gradual extraction
- **legacy-decommissioning**: Sunset planning

## Related Skills

- `api-compatibility-analyzer`: Contract verification

## Related Agents

- `strangler-implementation-agent`: Implementation
- `microservices-decomposer`: Service extraction
