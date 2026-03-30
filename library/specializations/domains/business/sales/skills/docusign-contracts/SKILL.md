---
name: docusign-contracts
description: DocuSign contract and e-signature integration for deal closure
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: sales
  domain: business
  priority: P1
  integration-points:
    - DocuSign eSignature API
    - DocuSign CLM API
---

# DocuSign Contracts

## Overview

The DocuSign Contracts skill provides integration with DocuSign for contract and e-signature management, including envelope creation, signing status monitoring, template field mapping, and CLM integration. This skill ensures secure, compliant contract execution with full audit trails.

## Capabilities

### Envelope Management
- Create and send envelopes for signature
- Configure routing and signing order
- Set reminders and expiration
- Handle void and resend operations

### Signing Status Monitoring
- Track envelope status in real-time
- Monitor individual recipient progress
- Receive completion notifications
- Access detailed audit trails

### Template Configuration
- Map document templates to data fields
- Configure anchor tags and positioning
- Set up conditional fields
- Handle multiple document types

### CLM Integration
- Connect with DocuSign CLM for workflow
- Manage contract lifecycle stages
- Track obligations and renewals
- Maintain contract repository

## Usage

### Contract Execution
```
Send a contract for signature with proper routing through legal review and customer signing.
```

### Status Monitoring
```
Check signing progress on pending contracts and identify blockers requiring follow-up.
```

### CLM Workflow
```
Initiate a CLM workflow for contract review, approval, and execution with full compliance tracking.
```

## Enhances Processes

- deal-risk-assessment
- opportunity-stage-management

## Dependencies

- DocuSign subscription (eSignature and/or CLM)
- Template configuration
- Legal/compliance approval
