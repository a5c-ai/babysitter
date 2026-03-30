---
name: closing-checklist-tracker
description: Tracks closing conditions, deliverables, sign-offs across parties
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: venture-capital
  domain: business
  skill-id: vc-skill-030
---

# Closing Checklist Tracker

## Overview

The Closing Checklist Tracker skill manages deal closing logistics by tracking conditions, deliverables, signatures, and sign-offs across all parties. It ensures nothing falls through the cracks during the complex deal closing process.

## Capabilities

### Checklist Management
- Create deal-specific closing checklists
- Track standard and custom closing conditions
- Manage multi-party deliverable requirements
- Handle parallel workstreams

### Condition Tracking
- Track conditions precedent status
- Monitor waiver requests and approvals
- Manage bring-down conditions
- Track regulatory approvals where needed

### Signature Coordination
- Track signature requirements by document
- Coordinate multi-party signature flows
- Manage electronic signature processes
- Handle counter-signature logistics

### Closing Coordination
- Manage closing timeline
- Coordinate fund flow logistics
- Track post-closing deliverables
- Generate closing status reports

## Usage

### Create Closing Checklist
```
Input: Deal structure, parties, documents
Process: Generate comprehensive checklist
Output: Closing checklist with assignments
```

### Track Deliverable Status
```
Input: Checklist updates
Process: Update tracking, notify parties
Output: Updated status, completion metrics
```

### Coordinate Signatures
```
Input: Signature requirements
Process: Route for signature, track status
Output: Signature status, outstanding items
```

### Generate Closing Report
```
Input: Checklist status
Process: Compile closing status
Output: Closing status report
```

## Checklist Categories

| Category | Typical Items |
|----------|---------------|
| Legal Documents | SPA, IRA, voting, ROFR, charter |
| Approvals | Board approvals, shareholder consents |
| Deliverables | Good standing, opinions, officers certs |
| Fund Flow | Wire instructions, funds verification |
| Post-Closing | Stock certificates, cap table updates |

## Integration Points

- **Definitive Document Negotiation**: Track doc completion
- **Document Redliner**: Monitor document status
- **Closing Manager (Agent)**: Support closing coordination
- **Deal Counsel Coordinator (Agent)**: Legal coordination

## Closing Timeline

| Phase | Duration | Key Activities |
|-------|----------|----------------|
| Pre-Closing | 1-2 weeks | Final doc review, approvals |
| Closing | 1-3 days | Signatures, fund flow |
| Post-Closing | 1-2 weeks | Filings, admin updates |

## Best Practices

1. Start checklist early in document negotiation
2. Assign clear ownership for each item
3. Track dependencies between items
4. Build buffer time for unexpected delays
5. Maintain clear communication across parties
