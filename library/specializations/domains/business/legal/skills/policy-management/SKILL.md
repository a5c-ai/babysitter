---
name: policy-management
description: Manage corporate policy lifecycle from drafting through compliance
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - Bash
metadata:
  specialization: legal
  domain: business
  category: Corporate Governance
  skill-id: SK-021
---

# Policy Management Skill

## Overview

The Policy Management Skill manages the corporate policy lifecycle from drafting through compliance monitoring. It provides comprehensive capabilities for creating, distributing, and maintaining organizational policies while ensuring consistent governance and regulatory adherence across the enterprise.

## Capabilities

- Draft policy documents with consistent formatting and structure
- Track policy versions and changes with full audit trail
- Manage policy approval workflows and sign-offs
- Distribute policies to stakeholders and affected parties
- Track policy acknowledgments and attestations
- Schedule policy reviews on appropriate cycles
- Generate policy compliance reports and metrics
- Support policy search and access for employees
- Map policies to regulatory requirements
- Maintain policy hierarchy and relationships
- Archive superseded policies with retention compliance
- Generate gap analysis for policy coverage

## Use Cases

### Policy Development
Create new policies or update existing ones with proper review, approval, and version control processes.

### Policy Distribution
Distribute policies to appropriate stakeholders and track acknowledgments to ensure awareness.

### Compliance Tracking
Monitor policy compliance across the organization and identify gaps or non-compliance issues.

### Review Cycle Management
Manage periodic policy reviews to ensure policies remain current and aligned with business needs and regulations.

### Regulatory Mapping
Map policies to applicable regulations and standards to demonstrate compliance coverage.

## Process Integration

This skill integrates with the following processes:
- Corporate Policy Management (all phases)
- Board Governance Framework (governance policies)
- Compliance Program Development (policy requirements)
- Compliance Training Program (policy training)

## Dependencies

- Policy management systems (PolicyTech, PowerDMS)
- Workflow automation platforms
- Document management systems
- Notification and communication systems
- Training and LMS integration
- Compliance tracking databases

## Configuration

```yaml
policy-management:
  policy-types:
    - corporate
    - operational
    - compliance
    - hr
    - it-security
    - privacy
  review-cycles:
    annual: 12
    biennial: 24
    regulatory: 12
  approval-levels:
    - department-head
    - legal-review
    - compliance-review
    - executive-approval
    - board-approval
  attestation-requirements:
    - all-employees
    - managers
    - specific-roles
```

## Usage

### Basic Invocation
```
Use the policy-management skill to create a new information security policy for the organization.
```

### With Parameters
```
Use the policy-management skill to:
- action: create-policy
- policy-type: it-security
- title: "Data Classification Policy"
- owner: CISO
- review-cycle: annual
- requires-attestation: true
```

## Output Artifacts

- Policy documents with version control
- Policy approval records and audit trail
- Distribution and acknowledgment reports
- Policy compliance dashboards
- Review schedule and reminders
- Regulatory mapping matrices
- Gap analysis reports
- Policy archive and retention records

## Quality Criteria

- Policies follow consistent formatting and structure
- All policies have clear ownership and accountability
- Version control maintains complete audit trail
- Distribution reaches all required stakeholders
- Acknowledgments are documented and tracked
- Review cycles are maintained on schedule
- Regulatory mappings are accurate and current
- Archive and retention comply with requirements
