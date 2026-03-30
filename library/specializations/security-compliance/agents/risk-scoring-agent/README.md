# Risk Scoring Agent

## Overview

The `risk-scoring-agent` provides intelligent risk scoring and prioritization. It embodies the expertise of a Risk Management Specialist for calculating CVSS scores, integrating EPSS for exploit probability, factoring business context, and recommending risk treatment strategies.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Risk Management Specialist |
| **Experience** | 10+ years in security risk assessment |
| **Background** | FAIR methodology, CVSS, EPSS |
| **Philosophy** | "Quantified risk enables informed decisions" |

## Core Principles

1. **Quantitative Analysis** - Use data-driven scoring
2. **Business Context** - Factor in business impact
3. **Probability Focus** - Consider exploit likelihood
4. **Asset Criticality** - Weight by asset importance
5. **Actionable Output** - Clear treatment recommendations

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **CVSS Analysis** | Base, temporal, environmental scores |
| **EPSS Integration** | Exploit probability scoring |
| **Business Context** | Impact, criticality assessment |
| **Composite Scoring** | Multi-factor risk calculation |
| **Heat Maps** | Risk visualization |
| **Treatment** | Remediate, mitigate, accept, transfer |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(riskScoringTask, {
  agentName: 'risk-scoring-agent',
  prompt: {
    role: 'Risk Management Specialist',
    task: 'Score and prioritize vulnerabilities',
    context: {
      vulnerabilities: await getVulnData(),
      assetInventory: await getAssets(),
      businessContext: await getBusinessContext(),
      existingControls: await getControls()
    },
    instructions: [
      'Calculate CVSS scores',
      'Integrate EPSS data',
      'Factor asset criticality',
      'Apply compensating controls',
      'Generate composite risk scores',
      'Recommend treatment strategies'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# Score vulnerabilities with full context
/agent risk-scoring-agent score \
  --vulnerabilities ./vulns.json \
  --assets ./asset-inventory.json \
  --include-epss

# Generate risk heat map
/agent risk-scoring-agent heat-map \
  --vulnerabilities ./scored-vulns.json \
  --group-by system

# Recommend treatment strategies
/agent risk-scoring-agent treatment \
  --vulnerabilities ./scored-vulns.json \
  --budget medium \
  --timeline 30d

# Risk acceptance report
/agent risk-scoring-agent acceptance-report \
  --vulnerabilities ./accepted-risks.json \
  --review-period quarterly
```

## Common Tasks

### 1. Vulnerability Risk Scoring

```bash
/agent risk-scoring-agent score \
  --vulnerabilities ./scan-results.json \
  --asset-context ./assets.json \
  --controls ./compensating-controls.json \
  --output ./risk-scored.json
```

Output includes:
- CVSS base and adjusted scores
- EPSS probability and percentile
- Composite risk scores
- Risk level classification
- Scoring rationale

### 2. Risk Heat Map Generation

```bash
/agent risk-scoring-agent heat-map \
  --vulnerabilities ./scored-vulns.json \
  --dimensions "likelihood,impact" \
  --aggregation system \
  --output ./heat-map.json
```

Provides:
- Visual heat map data
- Risk aggregation by system/team
- Trend indicators
- Priority quadrants

### 3. Treatment Recommendations

```bash
/agent risk-scoring-agent treatment-plan \
  --vulnerabilities ./scored-vulns.json \
  --capacity ./team-capacity.json \
  --budget high \
  --output ./treatment-plan.json
```

Delivers:
- Treatment strategy per vulnerability
- Prioritized remediation backlog
- Mitigation alternatives
- Risk acceptance candidates

### 4. Executive Risk Report

```bash
/agent risk-scoring-agent executive-report \
  --vulnerabilities ./all-risks.json \
  --period Q1-2026 \
  --comparison ./q4-2025-baseline.json
```

Reports:
- Risk posture summary
- Trend analysis
- Top risks
- Treatment progress
- Recommendations

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `security-risk-assessment.js` | Core risk scoring |
| `vulnerability-management.js` | Vulnerability prioritization |
| `threat-modeling.js` | Threat risk evaluation |
| `compliance-assessment.js` | Compliance risk scoring |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const riskScoringTask = defineTask({
  name: 'risk-scoring',
  description: 'Calculate composite risk scores for vulnerabilities',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: `Risk scoring for ${inputs.assessmentScope}`,
      agent: {
        name: 'risk-scoring-agent',
        prompt: {
          role: 'Risk Management Specialist',
          task: 'Calculate and prioritize vulnerability risks',
          context: {
            vulnerabilities: inputs.vulnerabilities,
            assetInventory: inputs.assets,
            businessContext: inputs.businessContext,
            compensatingControls: inputs.controls,
            epssEnabled: inputs.includeEpss !== false
          },
          instructions: [
            'Calculate CVSS base scores for each vulnerability',
            'Fetch and integrate EPSS probability scores',
            'Assess asset criticality (Tier 1-4)',
            'Evaluate business impact (financial, operational, reputational)',
            'Factor in compensating controls effectiveness',
            'Calculate composite risk score',
            'Classify risk level (Critical/High/Medium/Low)',
            'Recommend treatment strategy for each'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['riskAssessment', 'scoredVulnerabilities', 'recommendations'],
          properties: {
            riskAssessment: { type: 'object' },
            riskSummary: { type: 'object' },
            scoredVulnerabilities: { type: 'array' },
            heatMapData: { type: 'object' },
            recommendations: { type: 'object' }
          }
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## Scoring Framework

### CVSS Severity Ratings

| Score | Rating | Typical SLA |
|-------|--------|-------------|
| 9.0-10.0 | Critical | 24 hours |
| 7.0-8.9 | High | 7 days |
| 4.0-6.9 | Medium | 30 days |
| 0.1-3.9 | Low | 90 days |
| 0.0 | None | N/A |

### EPSS Interpretation

| Score | Meaning | Action |
|-------|---------|--------|
| >= 0.5 | Very likely exploited | Immediate priority |
| 0.2-0.5 | Significant probability | Urgent remediation |
| 0.05-0.2 | Moderate risk | Scheduled fix |
| < 0.05 | Low probability | Standard process |

### Asset Criticality Tiers

| Tier | Description | Multiplier |
|------|-------------|------------|
| Tier 1 | Revenue, customer-facing | 1.5x |
| Tier 2 | Internal production | 1.2x |
| Tier 3 | Development, staging | 1.0x |
| Tier 4 | Isolated, minimal impact | 0.7x |

## Composite Risk Formula

```
CompositeRisk = (
  (CVSS_Score * 0.25) +
  (EPSS_Score * 10 * 0.25) +
  (AssetCriticality * 0.20) +
  (BusinessImpact * 0.15) +
  (ExposureLevel * 0.15)
) * CompensatingControlsFactor
```

### Factor Weights

| Factor | Weight | Range |
|--------|--------|-------|
| CVSS Score | 25% | 0-10 |
| EPSS Score | 25% | 0-10 (scaled) |
| Asset Criticality | 20% | 1-10 |
| Business Impact | 15% | 1-10 |
| Exposure Level | 15% | 1-10 |

### Compensating Controls Factor

| Level | Factor | Examples |
|-------|--------|----------|
| None | 1.0 | No mitigations |
| Partial | 0.7 | WAF, basic monitoring |
| Substantial | 0.5 | WAF + segmentation |
| Comprehensive | 0.3 | Defense in depth |

## Treatment Strategies

| Strategy | When to Use | Requirements |
|----------|-------------|--------------|
| **Remediate** | Fix available, acceptable effort | Patch/fix deployed |
| **Mitigate** | Remediation delayed | Controls documented |
| **Transfer** | Third party can absorb | Contract/insurance |
| **Accept** | Low risk, justified | Business sign-off |
| **Avoid** | System not critical | Alternative available |

## Interaction Guidelines

### What to Expect

- **Data-driven** risk scores with clear methodology
- **Business-aligned** prioritization
- **Actionable** treatment recommendations
- **Documented** scoring rationale

### Best Practices

1. Provide complete asset inventory
2. Include business criticality data
3. Document existing controls
4. Specify risk appetite thresholds

## Related Resources

- [vulnerability-triage-agent](../vulnerability-triage-agent/) - Triage findings
- [threat-modeling-agent](../threat-modeling-agent/) - Threat risks
- [sast-analyzer skill](../../skills/sast-analyzer/) - SAST scoring
- [dast-scanner skill](../../skills/dast-scanner/) - DAST scoring

## References

- [FIRST CVSS Calculator](https://www.first.org/cvss/calculator/3.1)
- [FIRST EPSS](https://www.first.org/epss/)
- [NIST Risk Management Framework](https://csrc.nist.gov/projects/risk-management)
- [FAIR Institute](https://www.fairinstitute.org/)
- [CISA KEV Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-SEC-003
**Category:** Risk Management
**Status:** Active
