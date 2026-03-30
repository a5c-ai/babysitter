---
name: procurement-automation-orchestrator
description: Procurement process automation skill for P2P workflow optimization
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: supply-chain
  domain: business
  category: cross-functional
  priority: future
---

# Procurement Automation Orchestrator

## Overview

The Procurement Automation Orchestrator enables procurement process automation across the procure-to-pay (P2P) lifecycle. It orchestrates workflow automation, catalog management, and system integration to improve procurement efficiency and compliance.

## Capabilities

- **Requisition Workflow Automation**: Automated request routing and approval
- **Catalog Management**: Punchout and hosted catalog maintenance
- **Approval Routing Optimization**: Dynamic approval chain management
- **PO Generation Automation**: Automatic purchase order creation
- **Invoice Matching Automation**: 2-way and 3-way matching
- **Supplier Portal Integration**: Self-service supplier connectivity
- **RPA Bot Coordination**: Robotic process automation orchestration
- **Exception Handling Workflow**: Automated exception resolution

## Input Schema

```yaml
automation_orchestration_request:
  process_scope:
    requisition: boolean
    purchase_order: boolean
    receiving: boolean
    invoice: boolean
    payment: boolean
  automation_rules:
    approval_matrix: object
    auto_approval_threshold: float
    matching_tolerance: float
    exception_routing: object
  integrations:
    erp_system: string
    procurement_platform: string
    supplier_portals: array
    rpa_platform: string
  catalog_config:
    punchout_catalogs: array
    hosted_catalogs: array
```

## Output Schema

```yaml
automation_orchestration_output:
  automation_status:
    processes_automated: array
    automation_rate: float
    manual_touchpoints: array
  workflow_configuration:
    approval_workflows: array
    exception_workflows: array
    notification_rules: array
  catalog_status:
    active_catalogs: integer
    catalog_coverage: float
    update_schedule: object
  integration_status:
    connected_systems: array
    sync_status: object
    error_log: array
  rpa_bots:
    active_bots: array
    bot_performance: object
    scheduled_runs: array
  metrics:
    cycle_time_reduction: float
    touchless_rate: float
    exception_rate: float
    compliance_rate: float
  optimization_recommendations: array
```

## Usage

### P2P Workflow Automation

```
Input: Current P2P process, automation rules
Process: Configure automated workflows
Output: Automated P2P process configuration
```

### Invoice Matching Automation

```
Input: Invoice data, PO and receipt data
Process: Automated 3-way matching
Output: Matched invoices and exception queue
```

### RPA Bot Deployment

```
Input: Manual process steps, RPA platform
Process: Design and deploy automation bots
Output: Active RPA bots with monitoring
```

## Integration Points

- **ERP Systems**: SAP, Oracle procurement modules
- **Procurement Platforms**: Coupa, Ariba, Jaggaer
- **RPA Platforms**: UiPath, Blue Prism, Automation Anywhere
- **Supplier Portals**: Vendor self-service systems
- **Tools/Libraries**: RPA platforms, procurement system APIs

## Process Dependencies

- RFx Process Management
- Supplier Onboarding and Qualification
- Contract Negotiation and Management

## Best Practices

1. Map current processes before automating
2. Define clear exception handling rules
3. Monitor automation effectiveness
4. Maintain human oversight for high-value items
5. Ensure compliance with procurement policies
6. Continuously optimize automation rules
