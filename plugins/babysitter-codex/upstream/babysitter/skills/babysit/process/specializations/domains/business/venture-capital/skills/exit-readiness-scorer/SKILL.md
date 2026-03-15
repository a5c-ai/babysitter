---
name: exit-readiness-scorer
description: Scores company readiness across financial, operational, governance dimensions
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: venture-capital
  domain: business
  skill-id: vc-skill-040
---

# Exit Readiness Scorer

## Overview

The Exit Readiness Scorer skill assesses portfolio company preparedness for exit across financial, operational, and governance dimensions. It identifies gaps and provides actionable recommendations to improve exit outcomes.

## Capabilities

### Readiness Assessment
- Evaluate financial readiness
- Assess operational maturity
- Review governance and compliance
- Score data room preparedness

### Dimension Scoring
- Score each readiness dimension
- Weight by exit type relevance
- Calculate composite scores
- Benchmark against standards

### Gap Identification
- Identify readiness gaps
- Prioritize remediation items
- Estimate remediation timelines
- Track improvement progress

### Exit Type Suitability
- Assess IPO readiness
- Evaluate M&A preparedness
- Consider secondary options
- Recommend exit path

## Usage

### Assess Exit Readiness
```
Input: Company data, assessment criteria
Process: Evaluate across dimensions
Output: Readiness scorecard, gaps
```

### Score by Exit Type
```
Input: Company profile, exit scenarios
Process: Assess fit for each path
Output: Exit type suitability matrix
```

### Create Remediation Plan
```
Input: Readiness gaps, timeline
Process: Prioritize improvements
Output: Remediation roadmap
```

### Track Progress
```
Input: Remediation activities
Process: Update scores, track completion
Output: Progress report, updated scores
```

## Assessment Dimensions

| Dimension | Key Criteria |
|-----------|--------------|
| Financial | Audit quality, reporting, controls |
| Operational | Processes, scalability, team |
| Governance | Board, policies, compliance |
| Legal | IP clean, contracts, structure |
| Market | Position, metrics, story |

## Integration Points

- **Exit Readiness Assessment Process**: Core scoring
- **Portfolio Dashboard Builder**: Readiness views
- **Exit Planner (Agent)**: Support planning
- **Buyer Universe Builder**: Match to buyer needs

## Scoring Scale

| Score | Readiness Level |
|-------|-----------------|
| 1 | Not Ready - Major gaps |
| 2 | Early Stage - Significant work needed |
| 3 | Developing - Some gaps remain |
| 4 | Ready - Minor improvements needed |
| 5 | Fully Ready - Exit-ready now |

## Best Practices

1. Assess readiness early, not just at exit
2. Use exit-type-specific criteria
3. Prioritize gaps by impact and effort
4. Track progress consistently
5. Adjust assessment as company evolves
