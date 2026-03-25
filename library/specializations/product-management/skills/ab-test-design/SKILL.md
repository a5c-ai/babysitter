---
name: A/B Test Design
description: Statistical experiment design and analysis capabilities for product experimentation
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
---

# A/B Test Design Skill

## Overview

Specialized skill for statistical experiment design and analysis capabilities. Enables product teams to design rigorous experiments, calculate sample sizes, and interpret results with statistical confidence.

## Capabilities

### Experiment Design
- Calculate required sample sizes for experiments
- Design experiment variants and hypotheses
- Define success metrics and guardrail metrics
- Create experiment documentation templates
- Design multi-variant tests (A/B/n)
- Plan sequential and Bayesian experiments

### Statistical Analysis
- Validate statistical significance of results
- Calculate practical significance and effect sizes
- Detect interaction effects and segments
- Perform power analysis
- Calculate confidence intervals
- Handle multiple comparison corrections

### Decision Support
- Recommend ship/iterate/kill decisions
- Identify segment-specific impacts
- Assess long-term vs short-term effects
- Generate experiment reports
- Track experiment velocity metrics

## Target Processes

This skill integrates with the following processes:
- `product-market-fit.js` - Validation experiments for PMF hypotheses
- `conversion-funnel-analysis.js` - Funnel optimization experiments
- `beta-program.js` - A/B testing during beta phases

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "experimentType": {
      "type": "string",
      "enum": ["ab", "multivariate", "sequential", "bandit"],
      "description": "Type of experiment to design"
    },
    "hypothesis": {
      "type": "string",
      "description": "Hypothesis to test"
    },
    "primaryMetric": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "baseline": { "type": "number" },
        "mde": { "type": "number", "description": "Minimum detectable effect" }
      }
    },
    "guardrailMetrics": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Metrics that should not regress"
    },
    "trafficAllocation": {
      "type": "number",
      "description": "Percentage of traffic for experiment"
    },
    "confidenceLevel": {
      "type": "number",
      "default": 0.95,
      "description": "Statistical confidence level"
    }
  },
  "required": ["experimentType", "hypothesis", "primaryMetric"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "experimentPlan": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "hypothesis": { "type": "string" },
        "variants": { "type": "array", "items": { "type": "object" } },
        "sampleSize": { "type": "number" },
        "duration": { "type": "string" },
        "metrics": { "type": "object" }
      }
    },
    "powerAnalysis": {
      "type": "object",
      "properties": {
        "requiredSampleSize": { "type": "number" },
        "estimatedDuration": { "type": "string" },
        "power": { "type": "number" }
      }
    },
    "implementation": {
      "type": "object",
      "properties": {
        "trackingEvents": { "type": "array", "items": { "type": "string" } },
        "segmentation": { "type": "array", "items": { "type": "string" } },
        "rolloutPlan": { "type": "string" }
      }
    },
    "analysisFramework": {
      "type": "object",
      "properties": {
        "primaryAnalysis": { "type": "string" },
        "secondaryAnalyses": { "type": "array", "items": { "type": "string" } },
        "decisionCriteria": { "type": "object" }
      }
    }
  }
}
```

## Usage Example

```javascript
const experimentDesign = await executeSkill('ab-test-design', {
  experimentType: 'ab',
  hypothesis: 'Adding social proof to pricing page increases conversion by 10%',
  primaryMetric: {
    name: 'pricing_page_conversion',
    baseline: 0.05,
    mde: 0.10
  },
  guardrailMetrics: ['revenue_per_visitor', 'bounce_rate'],
  trafficAllocation: 50,
  confidenceLevel: 0.95
});
```

## Dependencies

- Statistical libraries for power analysis
- Experimentation platform integrations (Optimizely, LaunchDarkly, etc.)
