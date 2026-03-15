---
name: technical-debt-quantifier
description: Measure, categorize, and prioritize technical debt for migration planning and remediation
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Technical Debt Quantifier Skill

Measures, categorizes, and prioritizes technical debt to support informed decision-making for migration planning and debt remediation strategies.

## Purpose

Enable technical debt management for:
- Debt categorization and inventory
- Remediation effort estimation
- Interest calculation (ongoing cost)
- Priority scoring
- Trend tracking

## Capabilities

### 1. Debt Categorization
- Code debt (smells, complexity)
- Architecture debt (coupling, cohesion)
- Test debt (coverage gaps)
- Documentation debt
- Infrastructure debt

### 2. Remediation Effort Estimation
- Estimate fix time per item
- Calculate total remediation cost
- Identify quick wins
- Plan sprint allocation

### 3. Interest Calculation
- Calculate ongoing maintenance cost
- Estimate productivity impact
- Project future debt growth
- Model compound interest

### 4. Priority Scoring
- Score by business impact
- Weight by risk level
- Factor in remediation cost
- Calculate ROI of fixes

### 5. Debt-to-Value Ratio
- Compare debt to feature velocity
- Benchmark against industry
- Track debt percentage
- Set organizational targets

### 6. Trend Tracking
- Monitor debt over time
- Track remediation progress
- Identify debt sources
- Report debt velocity

## Tool Integrations

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| SonarQube | Debt calculation | API |
| CodeScene | Hotspot analysis | API |
| Codacy | Quality metrics | API |
| Code Climate | Maintainability | API |
| NDepend | .NET debt analysis | CLI |

## Output Schema

```json
{
  "analysisId": "string",
  "timestamp": "ISO8601",
  "debt": {
    "total": {
      "estimatedHours": "number",
      "monetaryValue": "number",
      "items": "number"
    },
    "byCategory": {
      "code": {},
      "architecture": {},
      "test": {},
      "documentation": {}
    },
    "byPriority": {
      "critical": [],
      "high": [],
      "medium": [],
      "low": []
    }
  },
  "metrics": {
    "debtRatio": "number",
    "debtPerLoc": "number",
    "interestRate": "number"
  },
  "trends": {
    "thirtyDay": "number",
    "ninetyDay": "number"
  },
  "recommendations": []
}
```

## Integration with Migration Processes

- **legacy-codebase-assessment**: Debt quantification
- **technical-debt-remediation**: Prioritization

## Related Skills

- `code-smell-detector`: Debt identification
- `static-code-analyzer`: Quality metrics

## Related Agents

- `technical-debt-auditor`: Deep debt analysis
