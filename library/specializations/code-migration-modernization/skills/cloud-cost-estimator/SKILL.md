---
name: cloud-cost-estimator
description: Estimate cloud costs for migration targets with resource sizing and optimization recommendations
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Cloud Cost Estimator Skill

Estimates cloud costs for migration targets, provides resource sizing recommendations, and suggests cost optimization strategies.

## Purpose

Enable cloud cost planning for:
- Resource sizing recommendations
- Cost projection
- Reserved instance optimization
- Spot instance eligibility
- Cost comparison

## Capabilities

### 1. Resource Sizing Recommendations
- Right-size compute instances
- Optimize storage allocation
- Plan memory requirements
- Size database instances

### 2. Cost Projection
- Monthly cost estimates
- Annual projections
- Growth modeling
- Budget forecasting

### 3. Reserved Instance Optimization
- Identify RI candidates
- Calculate savings
- Plan commitment levels
- Optimize coverage

### 4. Spot Instance Eligibility
- Assess workload suitability
- Estimate availability
- Calculate savings
- Plan fallback strategy

### 5. Cost Comparison (On-Prem vs Cloud)
- Calculate current costs
- Project cloud costs
- Analyze TCO
- Document savings

### 6. FinOps Recommendations
- Identify waste
- Suggest optimizations
- Plan tagging strategy
- Implement showback

## Tool Integrations

| Tool | Cloud | Integration Method |
|------|-------|-------------------|
| AWS Pricing Calculator | AWS | Web/API |
| Azure TCO Calculator | Azure | Web/API |
| Google Cloud Pricing Calculator | GCP | Web/API |
| Infracost | Multi | CLI |
| CloudHealth | Multi | API |
| Spot.io | Multi | API |

## Output Schema

```json
{
  "estimateId": "string",
  "timestamp": "ISO8601",
  "costs": {
    "monthly": {
      "compute": "number",
      "storage": "number",
      "network": "number",
      "database": "number",
      "total": "number"
    },
    "annual": "number"
  },
  "sizing": {
    "instances": [],
    "storage": [],
    "databases": []
  },
  "optimizations": {
    "reservedInstances": {},
    "spotInstances": {},
    "rightSizing": []
  },
  "comparison": {
    "onPremises": "number",
    "cloud": "number",
    "savings": "number"
  }
}
```

## Integration with Migration Processes

- **cloud-migration**: Cost planning
- **migration-planning-roadmap**: Budget planning

## Related Skills

- `cloud-readiness-assessor`: Migration planning

## Related Agents

- `cost-optimization-agent`: Cost optimization
- `cloud-migration-engineer`: Migration execution
