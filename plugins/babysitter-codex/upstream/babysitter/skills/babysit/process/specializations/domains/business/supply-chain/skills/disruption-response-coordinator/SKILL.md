---
name: disruption-response-coordinator
description: Supply chain disruption rapid response skill with impact assessment and mitigation activation
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
  priority: future
---

# Disruption Response Coordinator

## Overview

The Disruption Response Coordinator manages rapid response to supply chain disruptions. It provides structured incident classification, impact assessment, mitigation activation, stakeholder communication, and recovery tracking to minimize disruption impact.

## Capabilities

- **Incident Classification and Escalation**: Severity-based incident categorization
- **Impact Assessment**: Supply, demand, and financial impact analysis
- **War Room Coordination**: Cross-functional response team orchestration
- **Mitigation Option Activation**: Contingency plan execution
- **Stakeholder Communication**: Internal and external communication management
- **Recovery Tracking**: Progress monitoring toward normal operations
- **Lessons Learned Capture**: Post-incident documentation
- **Post-Incident Analysis**: Root cause and improvement identification

## Input Schema

```yaml
disruption_response_request:
  incident:
    incident_id: string
    type: string                  # supplier, logistics, demand, natural disaster
    description: string
    affected_entities: array
    detection_time: datetime
    reported_by: string
  initial_assessment:
    estimated_duration: string
    affected_products: array
    affected_customers: array
    financial_exposure: float
  available_mitigations:
    alternative_suppliers: array
    buffer_inventory: object
    demand_management: array
  communication_requirements:
    internal_stakeholders: array
    external_stakeholders: array
    regulatory_notifications: array
```

## Output Schema

```yaml
disruption_response_output:
  incident_classification:
    severity: string              # Minor, Moderate, Major, Critical
    escalation_level: string
    incident_commander: string
  impact_assessment:
    supply_impact:
      affected_skus: array
      shortage_forecast: object
    demand_impact:
      affected_customers: array
      revenue_at_risk: float
    financial_impact:
      total_exposure: float
      breakdown: object
  response_plan:
    activated_mitigations: array
    action_items: array
      - action: string
        owner: string
        due_date: datetime
        status: string
    war_room_schedule: object
  communication_log:
    internal_updates: array
    external_communications: array
    regulatory_notifications: array
  recovery_tracking:
    current_status: string
    milestones: array
    estimated_recovery_date: date
    progress_percentage: float
  lessons_learned:
    root_cause: string
    what_worked: array
    improvement_opportunities: array
    action_items: array
```

## Usage

### Incident Classification

```
Input: Disruption event details, affected scope
Process: Classify severity, determine escalation
Output: Incident classification with response level
```

### Impact Assessment

```
Input: Affected suppliers/products, demand data
Process: Model supply shortage, customer impact
Output: Quantified impact assessment
```

### Mitigation Activation

```
Input: Available alternatives, contingency plans
Process: Select and activate appropriate mitigations
Output: Active mitigation plan with assignments
```

## Integration Points

- **Incident Management Systems**: Ticketing, escalation
- **Communication Platforms**: Notification, collaboration
- **Supply Chain Systems**: Inventory, order management
- **Tools/Libraries**: Incident management, communication tools

## Process Dependencies

- Supply Chain Disruption Response
- Business Continuity and Contingency Planning
- Supplier Risk Monitoring and Early Warning

## Best Practices

1. Establish clear severity criteria upfront
2. Pre-define escalation paths and thresholds
3. Maintain updated contact lists
4. Practice response through simulations
5. Communicate early and often during incidents
6. Conduct thorough post-incident reviews
