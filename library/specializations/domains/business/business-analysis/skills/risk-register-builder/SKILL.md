---
name: risk-register-builder
description: Build and maintain project and change risk registers with scoring, mitigation strategies, and tracking
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: business-analysis
  domain: business
  id: SK-018
  category: Risk Management
---

# Risk Register Builder

## Overview

The Risk Register Builder skill provides specialized capabilities for creating and maintaining comprehensive risk registers. This skill enables systematic risk identification, assessment, mitigation planning, and ongoing tracking for projects and change initiatives.

## Capabilities

### Risk Identification Checklists
- Create risk identification checklists by category
- Apply standard risk taxonomies
- Generate role-specific risk prompts
- Compile risks from multiple sources

### Risk Score Calculation
- Calculate risk scores using probability x impact
- Apply consistent scoring scales
- Weight risks by category importance
- Generate composite risk ratings

### Risk Matrix and Heat Map Generation
- Generate risk matrices with quadrant placement
- Create visual heat maps
- Show risk distribution patterns
- Enable portfolio risk views

### Mitigation Strategy Templates
- Create mitigation strategy templates
- Apply the 4 T's: Treat, Transfer, Tolerate, Terminate
- Define response actions
- Assign mitigation owners

### Trigger Event Tracking
- Track risk status and trigger events
- Define early warning indicators
- Monitor risk conditions
- Activate response plans

### Risk Exposure Calculation
- Calculate risk exposure (probability x impact x cost)
- Determine contingency requirements
- Aggregate portfolio exposure
- Track exposure trends

### Risk Governance Reports
- Generate risk reports for governance
- Create executive risk summaries
- Produce trend analysis reports
- Support audit requirements

## Usage

### Create Risk Register
```
Create a risk register for:
Project/Initiative: [Description]
Categories: [Risk categories to cover]

Include identification, assessment, and mitigation.
```

### Score Risks
```
Score these identified risks:
[Risk list]

Calculate risk scores and prioritize.
```

### Develop Mitigations
```
Develop mitigation strategies for these high risks:
[High-risk list]

Apply 4 T's framework and assign owners.
```

### Generate Risk Report
```
Generate a risk report for governance review:
[Risk register data]

Include summary, trends, and recommendations.
```

## Process Integration

This skill integrates with the following business analysis processes:
- business-case-development.js - Business case risk assessment
- solution-options-analysis.js - Option risk evaluation
- change-management-strategy.js - Change initiative risks
- consulting-engagement-planning.js - Engagement risk management

## Dependencies

- Risk templates and taxonomies
- Scoring algorithms
- Visualization libraries
- Reporting frameworks

## Risk Management Reference

### Risk Register Template
```
RISK REGISTER
Project: [Name] | Owner: [Name] | Last Updated: [Date]

| ID | Risk | Category | Probability | Impact | Score | Owner | Mitigation | Status |
|----|------|----------|-------------|--------|-------|-------|------------|--------|
| R1 | [Description] | [Cat] | [1-5] | [1-5] | [P*I] | [Name] | [Action] | [Status] |
```

### Risk Categories (Typical)
| Category | Description | Examples |
|----------|-------------|----------|
| Technical | Technology-related risks | Integration failure, performance issues |
| Schedule | Timeline-related risks | Delays, dependencies |
| Resource | People/skill-related risks | Key person dependency, skill gaps |
| Financial | Cost-related risks | Budget overrun, funding changes |
| External | External factor risks | Vendor failure, regulatory changes |
| Organizational | Internal org risks | Sponsor change, competing priorities |
| Change Management | People change risks | Resistance, adoption failure |

### Probability Scale
| Score | Level | Description | Percentage |
|-------|-------|-------------|------------|
| 5 | Almost Certain | Expected to occur | >90% |
| 4 | Likely | Probably will occur | 70-90% |
| 3 | Possible | May occur | 30-70% |
| 2 | Unlikely | Could occur | 10-30% |
| 1 | Rare | Unlikely to occur | <10% |

### Impact Scale
| Score | Level | Description | Impact |
|-------|-------|-------------|--------|
| 5 | Catastrophic | Project failure | >$1M or critical |
| 4 | Major | Significant impact | $500K-$1M |
| 3 | Moderate | Noticeable impact | $100K-$500K |
| 2 | Minor | Small impact | $10K-$100K |
| 1 | Negligible | Minimal impact | <$10K |

### Risk Matrix
```
Impact →       1       2       3       4       5
Probability ↓  Neg.   Minor   Mod.   Major   Cat.
    5          5      10      15      20      25
    4          4       8      12      16      20
    3          3       6       9      12      15
    2          2       4       6       8      10
    1          1       2       3       4       5

Legend: Low (1-4), Medium (5-9), High (10-14), Critical (15-25)
```

### The 4 T's - Response Strategies
| Strategy | Description | When to Use |
|----------|-------------|-------------|
| Treat | Take action to reduce P or I | Can reduce risk cost-effectively |
| Transfer | Shift to third party | Insurance, contracts, outsourcing |
| Tolerate | Accept and monitor | Low impact or cannot mitigate |
| Terminate | Avoid the risk entirely | Risk too high, alternatives exist |

### Risk Status Values
| Status | Description |
|--------|-------------|
| Identified | Risk documented but not yet assessed |
| Open | Assessed and being monitored |
| In Mitigation | Mitigation actions underway |
| Triggered | Risk event has occurred |
| Closed | Risk no longer applicable |

### Risk Reporting Template
```
RISK SUMMARY REPORT
Report Date: [Date] | Period: [Period]

EXECUTIVE SUMMARY:
- Total risks: [#]
- Critical risks: [#]
- High risks: [#]
- New this period: [#]
- Closed this period: [#]

TOP RISKS:
1. [Risk 1] - Score: [X] - Status: [Status]
2. [Risk 2] - Score: [X] - Status: [Status]
3. [Risk 3] - Score: [X] - Status: [Status]

TRENDS:
[Chart showing risk count over time]

TRIGGERED RISKS:
[Any risks that materialized]

RECOMMENDED ACTIONS:
1. [Action 1]
2. [Action 2]
```
