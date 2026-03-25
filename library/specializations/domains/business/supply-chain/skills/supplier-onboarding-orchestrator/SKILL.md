---
name: supplier-onboarding-orchestrator
description: Supplier onboarding workflow orchestration with documentation collection and system setup
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: supply-chain
  domain: business
  category: supplier-management
  priority: future
---

# Supplier Onboarding Orchestrator

## Overview

The Supplier Onboarding Orchestrator manages the end-to-end supplier onboarding process. It coordinates documentation collection, capability assessment, compliance verification, and system setup to ensure new suppliers are fully qualified and enabled for transactions.

## Capabilities

- **Onboarding Checklist Management**: Dynamic checklist by supplier type
- **Document Collection and Validation**: Required document tracking
- **Capability Questionnaire Scoring**: Supplier capability assessment
- **Compliance Verification Workflow**: Regulatory and policy compliance
- **System Master Data Setup**: ERP and procurement system configuration
- **Banking and Payment Setup**: Payment information and terms
- **Quality Agreement Tracking**: Quality requirements documentation
- **Onboarding Status Dashboard**: Real-time progress visibility

## Input Schema

```yaml
onboarding_request:
  supplier_info:
    company_name: string
    contact: object
    category: string
    supplier_type: string         # direct, indirect, services
    country: string
  sourcing_context:
    category: string
    estimated_spend: float
    contract_reference: string
  requirements:
    documents_required: array
    certifications_required: array
    compliance_checks: array
  timeline:
    target_completion: date
    urgency: string
```

## Output Schema

```yaml
onboarding_output:
  supplier_id: string
  onboarding_status: string       # initiated, in_progress, complete
  checklist:
    total_items: integer
    completed: integer
    pending: array
    blocked: array
  document_status:
    collected: array
    pending: array
    issues: array
  capability_assessment:
    questionnaire_score: float
    capability_rating: string
    concerns: array
  compliance_status:
    checks_completed: array
    checks_pending: array
    findings: array
  system_setup:
    erp_status: string
    portal_status: string
    payment_status: string
  quality_agreement: object
  next_steps: array
  estimated_completion: date
```

## Usage

### New Supplier Onboarding

```
Input: New supplier information, category requirements
Process: Initialize checklist, request documents, verify compliance
Output: Onboarding workflow with status tracking
```

### Document Collection Automation

```
Input: Required documents list, supplier portal access
Process: Request, receive, validate documents
Output: Document status with missing item follow-up
```

### System Enablement

```
Input: Validated supplier, approved terms
Process: Create vendor master, enable portal, configure payments
Output: Fully enabled supplier in procurement systems
```

## Integration Points

- **Supplier Portals**: Document collection, self-service
- **ERP Systems**: Vendor master creation
- **Compliance Systems**: Background checks, sanctions screening
- **Workflow Automation**: RPA, approval routing
- **Tools/Libraries**: Workflow automation, document management

## Process Dependencies

- Supplier Onboarding and Qualification
- Strategic Sourcing Initiative
- Supplier Evaluation and Selection

## Best Practices

1. Define onboarding requirements by supplier category
2. Automate document collection where possible
3. Set clear SLAs for each onboarding stage
4. Communicate progress to stakeholders regularly
5. Archive all onboarding documentation
6. Review and streamline process periodically
