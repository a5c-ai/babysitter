---
name: corporate-records
description: Manage corporate records and minute books
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
  skill-id: SK-022
---

# Corporate Records Skill

## Overview

The Corporate Records Skill manages corporate records and minute books for legal entities. It provides comprehensive capabilities for maintaining corporate formalities, documenting corporate actions, and ensuring compliance with state and federal corporate record-keeping requirements.

## Capabilities

- Maintain corporate minute books with proper organization
- Generate corporate resolutions (board, shareholder, written consent)
- Track organizational documents (articles, bylaws, certificates)
- Manage registered agent information and changes
- Support annual filing requirements and deadlines
- Document stock transactions and capitalization
- Track corporate authorizations and delegations
- Generate corporate certificates and certifications
- Maintain officer and director records
- Track corporate seals and signature authorities
- Document stock ledger and ownership records
- Support corporate good standing maintenance

## Use Cases

### Minute Book Maintenance
Maintain organized and complete minute books with all required corporate records and documentation.

### Resolution Documentation
Draft and file appropriate resolutions for corporate actions including officer appointments, contracts, and transactions.

### Annual Compliance
Manage annual filing requirements, franchise taxes, and good standing maintenance across jurisdictions.

### Stock Administration
Document and track stock issuances, transfers, and capitalization table changes.

### Corporate Certifications
Generate corporate certificates, secretary certificates, and incumbency certificates as needed.

## Process Integration

This skill integrates with the following processes:
- Corporate Records Management (all phases)
- Board Governance Framework (resolution tracking)
- Entity Management (organizational documents)
- Contract Lifecycle Management (authority verification)

## Dependencies

- Entity management systems (Diligent Entities, CT Corporation)
- Document storage and management systems
- Corporate filing services
- Stock administration systems
- Calendar and deadline tracking
- Corporate seal and signature management

## Configuration

```yaml
corporate-records:
  document-categories:
    - formation-documents
    - bylaws-amendments
    - board-minutes
    - shareholder-minutes
    - written-consents
    - stock-records
    - officer-director-records
    - annual-filings
  resolution-types:
    - board-resolution
    - shareholder-resolution
    - written-consent
    - unanimous-written-consent
  certificate-types:
    - secretary-certificate
    - incumbency-certificate
    - good-standing
    - certificate-of-existence
```

## Usage

### Basic Invocation
```
Use the corporate-records skill to prepare a board resolution for appointing new officers.
```

### With Parameters
```
Use the corporate-records skill to:
- action: draft-resolution
- resolution-type: board-resolution
- entity: "Acme Corporation"
- subject: "Officer Appointment"
- effective-date: 2026-02-01
- officers:
    - name: "Jane Smith"
      title: "Chief Financial Officer"
```

## Output Artifacts

- Corporate minute books (organized by entity)
- Board and shareholder resolutions
- Written consent documents
- Stock ledgers and capitalization tables
- Officer and director records
- Corporate certificates
- Annual filing records
- Registered agent documentation
- Good standing certificates
- Corporate authorization records

## Quality Criteria

- Minute books are complete and properly organized
- Resolutions contain appropriate legal language
- Stock records accurately reflect ownership
- Annual filings are completed timely
- Good standing is maintained in all jurisdictions
- Officer and director records are current
- Corporate formalities are properly documented
- Records support legal and audit requirements
