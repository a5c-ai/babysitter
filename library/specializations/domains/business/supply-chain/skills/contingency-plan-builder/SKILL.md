---
name: contingency-plan-builder
description: Business continuity and contingency plan development skill for supply chain resilience
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: supply-chain
  domain: business
  category: risk-management
  priority: standard
---

# Contingency Plan Builder

## Overview

The Contingency Plan Builder supports the development and maintenance of supply chain business continuity and contingency plans. It identifies critical dependencies, maps alternative sources, designs buffer strategies, and creates recovery procedures for resilient supply chain operations.

## Capabilities

- **Critical Supplier Identification**: Dependency analysis and criticality ranking
- **Alternative Source Mapping**: Backup supplier identification and qualification
- **Buffer Stock Policy Design**: Strategic inventory buffer planning
- **Qualification Timeline Modeling**: Alternative source readiness planning
- **Recovery Procedure Documentation**: Step-by-step recovery guides
- **Communication Protocol Design**: Stakeholder notification procedures
- **Scenario Testing Frameworks**: Contingency plan testing approaches
- **Plan Maintenance Scheduling**: Regular review and update cycles

## Input Schema

```yaml
contingency_plan_request:
  scope:
    categories: array
    suppliers: array
    locations: array
  risk_scenarios: array
    - scenario_name: string
      risk_type: string
      probability: string
      impact_duration: string
  current_state:
    critical_suppliers: array
    existing_alternatives: array
    current_inventory_policy: object
  planning_parameters:
    acceptable_downtime: string
    recovery_time_objective: string
    budget_constraints: float
```

## Output Schema

```yaml
contingency_plan_output:
  plan_name: string
  version: string
  criticality_assessment:
    critical_suppliers: array
      - supplier_id: string
        criticality_score: float
        single_source: boolean
        alternative_available: boolean
    critical_items: array
    critical_locations: array
  mitigation_strategies:
    alternative_sources: array
      - primary_supplier: string
        alternatives: array
        qualification_status: string
        estimated_qualification_time: string
    buffer_stock_policy:
      items: array
      investment_required: float
      coverage_days: integer
    dual_sourcing: array
  response_procedures: array
    - scenario: string
      trigger_conditions: array
      response_steps: array
      responsible_parties: array
      communication_plan: object
      recovery_timeline: object
  testing_schedule:
    test_scenarios: array
    frequency: string
    next_test_date: date
  maintenance_schedule:
    review_frequency: string
    next_review_date: date
    change_triggers: array
```

## Usage

### Critical Dependency Analysis

```
Input: Supplier list, BOM data, spend data
Process: Identify single-source and high-criticality dependencies
Output: Criticality-ranked supplier list with risk exposure
```

### Alternative Source Strategy

```
Input: Critical suppliers, market data
Process: Identify and assess potential alternatives
Output: Alternative source roadmap with qualification plan
```

### Recovery Procedure Development

```
Input: Risk scenarios, organizational structure
Process: Design step-by-step recovery procedures
Output: Documented recovery playbooks by scenario
```

## Integration Points

- **Supplier Management**: Supplier data, alternatives
- **Risk Management**: Risk scenarios, probabilities
- **Inventory Systems**: Buffer stock management
- **Tools/Libraries**: BCP templates, scenario planning frameworks

## Process Dependencies

- Business Continuity and Contingency Planning
- Supply Chain Disruption Response
- Supply Chain Risk Assessment

## Best Practices

1. Focus on high-impact, high-probability scenarios
2. Involve cross-functional teams in planning
3. Test plans through tabletop exercises
4. Update plans after each significant event
5. Ensure plans are accessible during disruptions
6. Train personnel on their roles in recovery
