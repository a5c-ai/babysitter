---
name: cloud-readiness-assessor
description: Assess application readiness for cloud migration with 6Rs classification and cloud-native compliance checking
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Cloud Readiness Assessor Skill

Assesses application readiness for cloud migration, classifying applications using the 6Rs methodology and verifying cloud-native compliance.

## Purpose

Enable cloud migration planning for:
- 6 Rs classification
- Cloud-native pattern compliance
- Stateless verification
- External dependency mapping
- Cost estimation

## Capabilities

### 1. 6 Rs Classification
- Rehost (Lift and Shift)
- Replatform (Lift and Reshape)
- Repurchase (Replace/SaaS)
- Refactor (Re-architect)
- Retire (Decommission)
- Retain (Keep on-premises)

### 2. Cloud-Native Pattern Compliance
- Check twelve-factor compliance
- Verify statelessness
- Assess horizontal scalability
- Evaluate config externalization

### 3. Stateless Verification
- Identify session storage
- Find local file usage
- Detect in-memory caches
- Map persistent connections

### 4. External Dependency Mapping
- Map database connections
- Identify external APIs
- Find message queue usage
- Document service dependencies

### 5. Cost Estimation
- Estimate cloud compute costs
- Project storage costs
- Calculate data transfer
- Model reserved vs on-demand

### 6. Risk Assessment
- Identify migration blockers
- Assess complexity
- Evaluate downtime risk
- Document compliance concerns

## Tool Integrations

| Tool | Cloud | Integration Method |
|------|-------|-------------------|
| AWS Migration Hub | AWS | API |
| Azure Migrate | Azure | API |
| Google Cloud Migration Center | GCP | API |
| Cloudamize | Multi | API |
| CAST Highlight | Multi | API |

## Output Schema

```json
{
  "assessmentId": "string",
  "timestamp": "ISO8601",
  "applications": [
    {
      "name": "string",
      "classification": "rehost|replatform|repurchase|refactor|retire|retain",
      "cloudNativeScore": "number",
      "blockers": [],
      "dependencies": [],
      "estimatedCost": {},
      "risk": {}
    }
  ],
  "portfolio": {
    "byClassification": {},
    "totalCost": {},
    "timeline": {}
  }
}
```

## Integration with Migration Processes

- **cloud-migration**: Primary assessment tool
- **migration-planning-roadmap**: Planning input

## Related Skills

- `iac-generator`: Infrastructure setup
- `containerization-assistant`: Container readiness

## Related Agents

- `cloud-migration-engineer`: Migration execution
- `migration-readiness-assessor`: Overall readiness
