---
name: rollback-automation-skill
description: Automate rollback procedures with state snapshots, rollback scripts, and verification automation
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Rollback Automation Skill

Automates rollback procedures for migration activities, managing state snapshots, generating rollback scripts, and automating verification.

## Purpose

Enable safe rollback for:
- State snapshot management
- Rollback script generation
- Database rollback coordination
- Traffic switch rollback
- Verification automation

## Capabilities

### 1. State Snapshot Management
- Create pre-migration snapshots
- Store state checkpoints
- Version snapshots
- Clean up old snapshots

### 2. Rollback Script Generation
- Generate database rollbacks
- Create code rollbacks
- Build config rollbacks
- Document procedures

### 3. Database Rollback Coordination
- Generate reverse migrations
- Handle data rollback
- Manage transactions
- Coordinate sequences

### 4. Traffic Switch Rollback
- Revert routing rules
- Switch DNS
- Update load balancers
- Handle sticky sessions

### 5. Verification Automation
- Test rollback success
- Verify functionality
- Check data integrity
- Validate performance

### 6. Rollback Testing
- Test rollback procedures
- Simulate failures
- Validate timing
- Document results

## Tool Integrations

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| Database migration tools | Schema rollback | CLI |
| Deployment tools | Code rollback | CLI |
| Feature flags | Feature rollback | API |
| Load balancers | Traffic rollback | API |
| IaC tools | Infrastructure rollback | CLI |

## Output Schema

```json
{
  "rollbackId": "string",
  "timestamp": "ISO8601",
  "snapshot": {
    "id": "string",
    "created": "ISO8601",
    "components": []
  },
  "scripts": {
    "database": "string",
    "application": "string",
    "infrastructure": "string"
  },
  "execution": {
    "status": "ready|executed|verified",
    "duration": "string",
    "verification": {}
  }
}
```

## Integration with Migration Processes

- All migration processes (universal rollback support)

## Related Skills

- `data-migration-validator`: Post-rollback validation

## Related Agents

- `rollback-specialist`: Rollback orchestration
- `cutover-coordinator`: Cutover management
