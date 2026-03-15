---
name: workforce-planning
description: Forecast workforce needs and plan talent supply strategies
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: human-resources
  domain: business
  category: HR Analytics
  skill-id: SK-018
  dependencies:
    - Workforce data
    - Forecasting models
---

# Workforce Planning Skill

## Overview

The Workforce Planning skill provides capabilities for forecasting workforce needs and developing talent supply strategies. This skill enables demand forecasting, supply analysis, gap identification, and scenario-based workforce planning.

## Capabilities

### Demand Forecasting
- Create workforce demand forecasts
- Model headcount by business scenarios
- Project skill requirements
- Factor growth and attrition
- Align with business planning

### Supply Analysis
- Analyze internal talent supply
- Track current workforce composition
- Project internal movement
- Assess development pipeline
- Model retirement and turnover

### Gap Analysis
- Calculate workforce gaps by skill/role
- Identify critical shortages
- Project future gap evolution
- Prioritize gap closure strategies
- Estimate gap costs

### Scenario Modeling
- Model scenario-based workforce plans
- Compare strategic alternatives
- Assess risk and contingencies
- Evaluate build vs. buy vs. borrow
- Support strategic decision-making

### Headcount Planning
- Generate headcount planning templates
- Support annual planning cycles
- Enable rolling forecasts
- Track plan vs. actual
- Manage requisition approval

### Dashboard and Reporting
- Build workforce dashboards
- Create executive summaries
- Track planning assumptions
- Monitor plan execution
- Report on workforce metrics

## Usage

### Demand Forecast
```javascript
const demandForecast = {
  timeHorizon: {
    years: 3,
    periods: 'quarterly'
  },
  baseScenario: {
    revenuegrowth: [10, 12, 15],
    productivityImprovement: [2, 3, 3]
  },
  departmentModels: [
    {
      department: 'Engineering',
      driver: 'product-roadmap',
      currentHeadcount: 100,
      projectedGrowth: [15, 20, 25]
    },
    {
      department: 'Sales',
      driver: 'revenue-ratio',
      revenuePerSalesperson: 1000000,
      projectedRevenue: [50000000, 60000000, 75000000]
    },
    {
      department: 'Customer Success',
      driver: 'customer-ratio',
      customersPerCSM: 50,
      projectedCustomers: [500, 650, 850]
    }
  ],
  assumptions: {
    attrition: 15,
    internalMobility: 10,
    leadTime: 90
  }
};
```

### Gap Analysis
```javascript
const gapAnalysis = {
  planning Period: '2026-2028',
  scope: 'critical-skills',
  skills: [
    {
      name: 'Machine Learning',
      currentSupply: 10,
      futuredemand: { y1: 15, y2: 25, y3: 40 },
      internalPipeline: 3,
      externalAvailability: 'scarce'
    },
    {
      name: 'Cloud Architecture',
      currentSupply: 20,
      futureDemand: { y1: 25, y2: 30, y3: 35 },
      internalPipeline: 5,
      externalAvailability: 'moderate'
    }
  ],
  strategies: {
    build: { timeToReady: 18, costPerPerson: 25000 },
    buy: { timeToHire: 4, costPerHire: 50000 },
    borrow: { availability: 'contractors', premiumRate: 1.5 }
  }
};
```

## Process Integration

This skill integrates with the following HR processes:

| Process | Integration Points |
|---------|-------------------|
| workforce-planning-forecasting.js | Full planning workflow |
| succession-planning.js | Supply analysis |
| training-needs-analysis.js | Skill gap input |

## Best Practices

1. **Business Alignment**: Link workforce plans to business strategy
2. **Multiple Scenarios**: Plan for base, optimistic, and pessimistic cases
3. **Regular Updates**: Refresh forecasts at least quarterly
4. **Skills Focus**: Plan for skills, not just headcount
5. **Lead Time**: Account for hiring and development lead times
6. **Finance Integration**: Align with financial planning processes

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Forecast Accuracy | Actual vs. planned headcount | Within 10% |
| Time to Fill | Average days to fill positions | <60 days |
| Critical Role Coverage | Filled critical roles | 100% |
| Skills Gap Closure | Gaps addressed on time | >80% |
| Internal Fill Rate | Positions filled internally | >40% |

## Related Skills

- SK-019: Turnover Analytics (attrition forecasting)
- SK-009: Training Needs (skill development)
- SK-011: Succession Planning (pipeline input)
