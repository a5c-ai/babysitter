---
name: rca-analysis
description: Structured root cause analysis for incidents and problems
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: customer-experience
  domain: business
  category: Service Management
  id: SK-015
---

# Root Cause Analysis Skill

## Overview

The Root Cause Analysis (RCA) skill provides structured methodologies and tools for conducting thorough root cause investigations for incidents and problems. This skill supports multiple analysis frameworks including 5-Whys, Fishbone/Ishikawa diagrams, and Fault Tree Analysis to identify underlying causes and drive permanent corrective actions.

## Capabilities

### 5-Whys Analysis
- Facilitate structured 5-Whys questioning
- Document causal chain progression
- Identify stopping criteria for root causes
- Generate 5-Whys analysis reports
- Track branching cause paths
- Validate root cause identification

### Fishbone/Ishikawa Diagrams
- Generate fishbone diagram structures
- Organize causes by category (6M model)
- Support custom category definitions
- Create visual diagram outputs (Mermaid, SVG)
- Facilitate brainstorming sessions
- Document contributing factors

### Fault Tree Analysis
- Build fault tree logical structures
- Define AND/OR gate relationships
- Calculate probability propagation
- Identify minimal cut sets
- Generate fault tree visualizations
- Support quantitative risk analysis

### Contributing Factor Identification
- Analyze multiple cause categories
- Identify systemic vs. proximate causes
- Document environmental factors
- Assess human factors contributions
- Evaluate process deficiencies
- Identify technology failures

### Root Cause Confidence Scoring
- Calculate confidence levels for identified causes
- Assess evidence strength for each factor
- Rate cause probability and impact
- Generate confidence intervals
- Prioritize causes by confidence
- Document uncertainty and assumptions

### RCA Documentation Generation
- Generate comprehensive RCA reports
- Create executive summaries
- Document timeline of events
- Include evidence and data references
- Produce corrective action recommendations
- Generate lessons learned documentation

### Corrective Action Tracking
- Track corrective action implementation
- Monitor action completion status
- Verify effectiveness of fixes
- Generate action status reports
- Link actions to root causes
- Track action ownership and deadlines

## Usage

### Conduct 5-Whys Analysis
```yaml
skill: rca-analysis
action: five-whys
parameters:
  incident_id: "INC-2025-001"
  problem_statement: "Customer dashboard failed to load for 2 hours"
  analysis:
    why_1:
      question: "Why did the dashboard fail to load?"
      answer: "The API gateway returned 503 errors"
    why_2:
      question: "Why did the API gateway return 503?"
      answer: "Backend services were unresponsive"
    why_3:
      question: "Why were backend services unresponsive?"
      answer: "Database connection pool was exhausted"
    why_4:
      question: "Why was the connection pool exhausted?"
      answer: "A slow query was holding connections for extended periods"
    why_5:
      question: "Why was there a slow query?"
      answer: "Missing database index on newly added column"
  root_cause: "Missing database index caused slow queries that exhausted connection pool"
```

### Generate Fishbone Diagram
```yaml
skill: rca-analysis
action: fishbone-diagram
parameters:
  problem: "High customer churn rate in Q4"
  categories:
    people:
      - "Insufficient CSM staffing"
      - "High CSM turnover"
      - "Lack of proactive outreach training"
    process:
      - "No early warning system"
      - "Delayed QBR scheduling"
      - "Reactive-only engagement model"
    technology:
      - "Health score not capturing usage decline"
      - "CRM data quality issues"
      - "No automated alerting"
    measurement:
      - "Churn identified too late"
      - "NPS not correlated to churn"
    environment:
      - "Economic downturn pressure"
      - "Competitor aggressive pricing"
  output_format: mermaid
```

### Perform Fault Tree Analysis
```yaml
skill: rca-analysis
action: fault-tree
parameters:
  top_event: "Complete service outage"
  tree:
    gate: OR
    events:
      - name: "Infrastructure failure"
        gate: AND
        events:
          - name: "Primary DC failure"
            probability: 0.001
          - name: "DR failover failure"
            probability: 0.01
      - name: "Application failure"
        gate: OR
        events:
          - name: "Code deployment error"
            probability: 0.02
          - name: "Configuration error"
            probability: 0.015
  calculate:
    - top_event_probability
    - minimal_cut_sets
    - critical_events
```

### Generate RCA Report
```yaml
skill: rca-analysis
action: generate-report
parameters:
  incident_id: "INC-2025-001"
  report_type: comprehensive
  include:
    - executive_summary
    - incident_timeline
    - impact_assessment
    - analysis_methodology
    - root_causes
    - contributing_factors
    - corrective_actions
    - lessons_learned
  format: markdown
```

### Track Corrective Actions
```yaml
skill: rca-analysis
action: track-actions
parameters:
  rca_id: "RCA-2025-001"
  actions:
    - id: "CA-001"
      description: "Add missing database index"
      owner: "database-team"
      due_date: "2025-01-20"
      status: completed
      verification: "Query performance improved from 30s to 50ms"
    - id: "CA-002"
      description: "Implement connection pool monitoring"
      owner: "sre-team"
      due_date: "2025-01-25"
      status: in_progress
```

## Process Integration

This skill integrates with the following customer experience processes:

| Process | Integration Points |
|---------|-------------------|
| problem-management.js | Core RCA methodology, known error documentation, permanent fixes |
| itil-incident-management.js | Post-incident review, PIR documentation, preventive actions |
| closed-loop-feedback.js | Customer complaint root causes, systemic issue identification |

## Analysis Frameworks

### 6M Categories (Manufacturing)
- Manpower (People)
- Methods (Process)
- Machines (Technology)
- Materials
- Measurement
- Mother Nature (Environment)

### 6S Categories (Service)
- Surroundings
- Suppliers
- Systems
- Skills
- Safety
- Standards

## Dependencies

- RCA templates and frameworks
- Analysis methodology guidelines
- Incident/problem data access
- Corrective action tracking system
- Visualization libraries for diagrams
- Historical RCA database for patterns

## Best Practices

1. **Start Quickly**: Begin RCA while evidence is fresh and available
2. **Blame-Free Culture**: Focus on systemic issues, not individuals
3. **Multiple Perspectives**: Include diverse stakeholders in analysis
4. **Evidence-Based**: Support conclusions with data and logs
5. **Actionable Outputs**: Ensure corrective actions are specific and measurable
6. **Follow Through**: Track actions to completion and verify effectiveness
7. **Learn and Share**: Document lessons learned for organizational knowledge

## Shared Potential

This skill is a strong candidate for extraction to a shared library with applicability to:
- DevOps/SRE (incident post-mortems)
- QA Testing (defect analysis)
- Software Architecture (failure analysis)
- Manufacturing Operations
- Healthcare Quality
