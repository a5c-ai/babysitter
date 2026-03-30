---
name: gaap-ifrs-compliance-checker
description: Automated compliance validation skill for GAAP and IFRS accounting standards with codification references
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: finance-accounting
  domain: business
  category: accounting-compliance
  priority: high
---

# GAAP/IFRS Compliance Checker

## Overview

The GAAP/IFRS Compliance Checker skill provides automated validation of financial reporting against US GAAP and IFRS accounting standards. It ensures consistency with codification requirements and identifies potential compliance gaps.

## Capabilities

### ASC Topic Validation
- Codification topic mapping
- Subtopic requirement checking
- Section-level guidance review
- Implementation guidance application
- Transition provision verification
- Pending standard consideration

### IFRS Standard Compliance
- IAS/IFRS standard identification
- Standard requirement mapping
- Interpretations (IFRIC/SIC) consideration
- IFRS for SMEs applicability
- Endorsement status tracking
- Convergence area analysis

### Disclosure Requirement Verification
- Required disclosure checklist
- Encouraged disclosure identification
- Comparative period requirements
- Quantitative threshold checking
- Qualitative factor assessment
- Materiality consideration

### Policy Consistency Analysis
- Year-over-year policy comparison
- Policy change identification
- Change in estimate detection
- Error correction classification
- Retrospective application needs
- Prospective treatment validation

### Footnote Completeness Checking
- Significant accounting policy review
- Critical estimate disclosure
- Related party identification
- Contingency disclosure assessment
- Subsequent event coverage
- Segment reporting requirements

### SEC Regulation Compliance
- Regulation S-X requirements
- Regulation S-K compliance
- Form-specific requirements
- SAB guidance consideration
- C&DI interpretation application
- Comment letter history review

## Usage

### Financial Statement Review
```
Input: Draft financial statements, footnotes, accounting policies
Process: Validate against applicable standards and regulations
Output: Compliance checklist with gaps, references, remediation guidance
```

### Policy Change Assessment
```
Input: Proposed policy change, current policy, new standard requirements
Process: Evaluate compliance impact, transition requirements
Output: Implementation guidance, disclosure requirements, timeline
```

## Integration

### Used By Processes
- Financial Statement Preparation
- Revenue Recognition and ASC 606 Compliance
- Lease Accounting and ASC 842 Implementation

### Tools and Libraries
- FASB ASC database
- IFRS taxonomy
- SEC EDGAR
- Compliance tracking platforms

## Best Practices

1. Maintain current mapping of standards to company transactions
2. Track pending standards with effective dates
3. Document policy elections and rationale
4. Build checklist tailored to company circumstances
5. Update for new SEC guidance and interpretations
6. Coordinate with external auditors on technical positions
