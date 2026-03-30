---
name: cost-of-quality-analyzer
description: Cost of Quality analysis skill with prevention, appraisal, internal failure, and external failure cost tracking
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
metadata:
  specialization: operations
  domain: business
  category: quality-management
---

# Cost of Quality Analyzer

## Overview

The Cost of Quality Analyzer skill provides comprehensive capabilities for analyzing and tracking quality costs. It supports PAF (Prevention, Appraisal, Failure) model analysis, hidden factory cost identification, and quality investment ROI calculation.

## Capabilities

- Prevention cost identification
- Appraisal cost tracking
- Internal failure cost calculation
- External failure cost estimation
- COQ ratio analysis
- Hidden factory costs
- Quality investment ROI
- Improvement prioritization

## Used By Processes

- QMS-004: Cost of Quality Analysis
- QMS-002: TQM Program Development
- CI-001: Operational Excellence Program Design

## Tools and Libraries

- Cost accounting systems
- Quality cost databases
- Financial analysis tools
- Reporting dashboards

## Usage

```yaml
skill: cost-of-quality-analyzer
inputs:
  period: "2025-Q4"
  revenue: 10000000
  cost_data:
    prevention:
      - category: "Training"
        amount: 50000
      - category: "Quality planning"
        amount: 30000
      - category: "Process control"
        amount: 40000
    appraisal:
      - category: "Inspection"
        amount: 80000
      - category: "Testing"
        amount: 60000
      - category: "Audits"
        amount: 20000
    internal_failure:
      - category: "Scrap"
        amount: 100000
      - category: "Rework"
        amount: 75000
      - category: "Downtime"
        amount: 50000
    external_failure:
      - category: "Warranty"
        amount: 120000
      - category: "Returns"
        amount: 40000
      - category: "Complaints"
        amount: 25000
outputs:
  - coq_summary
  - coq_ratios
  - trend_analysis
  - pareto_analysis
  - improvement_opportunities
  - roi_projections
```

## Cost of Quality Categories

### Prevention Costs (Investing to prevent defects)
- Quality planning
- Training and education
- Process control
- Supplier evaluation
- Design reviews
- Preventive maintenance

### Appraisal Costs (Detecting defects)
- Incoming inspection
- In-process inspection
- Final inspection
- Testing and calibration
- Quality audits
- Supplier monitoring

### Internal Failure Costs (Defects found before shipping)
- Scrap
- Rework
- Re-inspection
- Downtime
- Failure analysis
- Yield losses

### External Failure Costs (Defects found by customers)
- Warranty claims
- Returns and replacements
- Complaint handling
- Product liability
- Recalls
- Lost sales/reputation

## COQ Benchmarks

| Metric | World Class | Average | Poor |
|--------|-------------|---------|------|
| COQ as % of Revenue | 2-4% | 10-15% | 20-25% |
| Prevention % of COQ | 20-30% | 10-15% | < 5% |
| Failure % of COQ | 30-40% | 60-70% | > 80% |

## Optimal COQ Model

```
Total COQ = Prevention + Appraisal + Failure

As Prevention increases:
- Appraisal stays relatively flat
- Failure costs decrease significantly
- Total COQ decreases until optimal point
```

## Hidden Factory Costs

Often unmeasured costs:
- Expediting
- Sorting
- Engineering changes
- Excess inventory
- Extended cycle times
- Customer service escalations

## Integration Points

- ERP financial modules
- Quality Management Systems
- Cost accounting systems
- Business intelligence tools
