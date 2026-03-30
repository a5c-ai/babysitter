---
name: oee-calculator
description: Overall Equipment Effectiveness calculation and analysis skill with availability, performance, and quality tracking
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
metadata:
  specialization: operations
  domain: business
  category: operational-analytics
---

# OEE Calculator

## Overview

The OEE Calculator skill provides comprehensive capabilities for calculating and analyzing Overall Equipment Effectiveness. It supports availability, performance, and quality tracking, six big loss categorization, and world-class benchmarking.

## Capabilities

- Availability calculation
- Performance rate tracking
- Quality rate measurement
- OEE trending and dashboards
- Six big loss categorization
- Pareto of losses
- Improvement target setting
- World-class benchmarking

## Used By Processes

- LEAN-001: Value Stream Mapping
- SIX-002: Statistical Process Control Implementation
- CI-003: Benchmarking Program

## Tools and Libraries

- MES integration
- OEE software
- Real-time dashboards
- Data collection systems

## Usage

```yaml
skill: oee-calculator
inputs:
  equipment: "CNC Machine 5"
  period: "2026-01-15"
  shift_data:
    planned_production_time: 480  # minutes
    downtime:
      - type: "breakdown"
        minutes: 30
      - type: "changeover"
        minutes: 20
    ideal_cycle_time: 0.5  # minutes per unit
    total_count: 800  # units
    good_count: 780  # units
outputs:
  - oee_score
  - availability
  - performance
  - quality
  - loss_breakdown
  - improvement_opportunities
  - trend_analysis
```

## OEE Calculation

### Formula
```
OEE = Availability x Performance x Quality

Where:
Availability = Run Time / Planned Production Time
Performance = (Total Count x Ideal Cycle Time) / Run Time
Quality = Good Count / Total Count
```

### Example Calculation
```
Planned Production Time: 480 minutes
Downtime: 50 minutes
Run Time: 430 minutes
Ideal Cycle Time: 0.5 minutes
Total Count: 800 units
Good Count: 780 units

Availability = 430 / 480 = 89.6%
Performance = (800 x 0.5) / 430 = 93.0%
Quality = 780 / 800 = 97.5%

OEE = 89.6% x 93.0% x 97.5% = 81.3%
```

## Six Big Losses

| Loss Category | OEE Factor | Examples |
|---------------|------------|----------|
| Breakdowns | Availability | Equipment failures |
| Setup/Adjustments | Availability | Changeovers, warm-up |
| Small Stops | Performance | Jams, minor issues |
| Reduced Speed | Performance | Running below ideal rate |
| Startup Rejects | Quality | Scrap during start-up |
| Production Rejects | Quality | In-process defects |

## OEE Benchmarks

| OEE Level | Classification | Typical Range |
|-----------|----------------|---------------|
| World Class | Best in class | 85%+ |
| Good | Above average | 70-85% |
| Average | Typical | 60-70% |
| Low | Needs improvement | 40-60% |
| Poor | Significant issues | <40% |

## World-Class Targets

| Factor | World Class | Typical |
|--------|-------------|---------|
| Availability | >90% | 85% |
| Performance | >95% | 90% |
| Quality | >99.9% | 98% |
| OEE | >85% | 60% |

## Loss Analysis Process

1. Collect accurate loss data
2. Categorize by six big losses
3. Create Pareto chart
4. Focus on top losses
5. Apply appropriate methodology
6. Track improvement

## Integration Points

- Manufacturing Execution Systems
- PLC/SCADA systems
- Quality Management Systems
- Maintenance management (CMMS)
