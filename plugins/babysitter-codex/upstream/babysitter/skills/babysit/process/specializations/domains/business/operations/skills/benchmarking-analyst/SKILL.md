---
name: benchmarking-analyst
description: Benchmarking study skill for internal, competitive, and best-in-class performance comparison
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
metadata:
  specialization: operations
  domain: business
  category: continuous-improvement
---

# Benchmarking Analyst

## Overview

The Benchmarking Analyst skill provides comprehensive capabilities for conducting benchmarking studies. It supports internal, competitive, and best-in-class benchmarking, KPI normalization, best practice identification, and adaptation planning.

## Capabilities

- Benchmark partner identification
- KPI selection and normalization
- Data collection methodology
- Performance gap analysis
- Best practice identification
- Adaptation planning
- Progress tracking
- Benchmarking database maintenance

## Used By Processes

- CI-003: Benchmarking Program
- CI-001: Operational Excellence Program Design
- QMS-002: TQM Program Development

## Tools and Libraries

- APQC benchmarking database
- Industry consortiums
- Survey tools
- Data analysis platforms

## Usage

```yaml
skill: benchmarking-analyst
inputs:
  benchmarking_type: "best_in_class"  # internal | competitive | functional | best_in_class
  focus_area: "Order fulfillment cycle time"
  current_performance:
    metric: "order_to_ship_days"
    value: 5
  benchmark_sources:
    - type: "industry_database"
      source: "APQC"
    - type: "consortium"
      source: "Supply Chain Council"
  target_percentile: 90  # aim for top 10%
outputs:
  - benchmark_study
  - performance_gaps
  - best_practices
  - adaptation_plan
  - implementation_roadmap
  - tracking_metrics
```

## Benchmarking Types

| Type | Description | Use Case |
|------|-------------|----------|
| Internal | Compare across own sites/units | Identify internal best practices |
| Competitive | Compare to direct competitors | Understand competitive position |
| Functional | Compare to same function in other industries | Learn from leaders |
| Best-in-Class | Compare to world leaders | Achieve breakthrough performance |

## Benchmarking Process

### Phase 1: Planning
1. Identify what to benchmark
2. Form benchmarking team
3. Identify benchmark partners
4. Determine data collection method

### Phase 2: Analysis
1. Collect performance data
2. Determine performance gaps
3. Identify enablers of superior performance
4. Project future performance

### Phase 3: Integration
1. Communicate findings
2. Establish improvement goals
3. Develop action plans
4. Gain commitment

### Phase 4: Action
1. Implement plans
2. Monitor progress
3. Recalibrate benchmarks
4. Achieve maturity

## KPI Normalization

Normalize metrics for fair comparison:
- Per employee
- Per revenue dollar
- Per unit produced
- Per square foot
- Percent of total

### Example
```
Raw metric: Inventory value = $10M
Normalized: Days of inventory = 45 days
Industry benchmark: 30 days
Gap: 15 days (50% improvement opportunity)
```

## Performance Gap Analysis

| Performance Level | % of Benchmark | Action |
|-------------------|----------------|--------|
| Leading | >110% | Share best practices |
| Parity | 90-110% | Monitor and improve |
| Lagging | 70-90% | Targeted improvement |
| Poor | <70% | Major initiative needed |

## Best Practice Categories

1. **Process Design** - How work flows
2. **Technology** - Tools and systems used
3. **Organization** - Structure and roles
4. **People** - Skills and culture
5. **Metrics** - What is measured

## Integration Points

- Industry databases (APQC, Gartner)
- Consortium networks
- Performance management systems
- Knowledge management platforms
