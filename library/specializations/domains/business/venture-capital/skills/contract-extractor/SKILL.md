---
name: contract-extractor
description: Extracts key terms from contracts, identifies risks, flags unusual provisions
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
  skill-id: vc-skill-016
---

# Contract Extractor

## Overview

The Contract Extractor skill provides automated extraction and analysis of key terms from contracts during due diligence. It identifies important provisions, flags risks and unusual terms, and summarizes contract portfolios for efficient review.

## Capabilities

### Term Extraction
- Extract pricing and payment terms
- Identify term length and renewal provisions
- Capture termination rights and notice periods
- Extract exclusivity and non-compete clauses

### Risk Identification
- Flag unusual or non-standard provisions
- Identify liability and indemnification risks
- Detect change of control provisions
- Highlight IP assignment issues

### Contract Summarization
- Generate executive summaries of key contracts
- Create comparison matrices across contracts
- Summarize obligation and commitment inventory
- Track key dates and milestones

### Portfolio Analysis
- Analyze contract concentration risk
- Assess revenue exposure by contract
- Identify renewal risk and churn exposure
- Map contract interdependencies

## Usage

### Extract Contract Terms
```
Input: Contract document(s), extraction parameters
Process: Parse contracts, extract key terms
Output: Extracted terms, structured data
```

### Identify Risks
```
Input: Contract documents, risk criteria
Process: Analyze for risk factors, flag issues
Output: Risk assessment, flagged provisions
```

### Summarize Contract Portfolio
```
Input: Set of contracts, summary requirements
Process: Aggregate and analyze portfolio
Output: Portfolio summary, key metrics
```

### Compare Contracts
```
Input: Multiple contracts, comparison criteria
Process: Extract and compare terms
Output: Comparison matrix, variance analysis
```

## Key Extraction Categories

| Category | Key Terms |
|----------|-----------|
| Commercial | Pricing, payment terms, volume commitments |
| Duration | Term, renewal, termination, notice |
| Legal | Liability caps, indemnification, warranties |
| IP | Assignment, licensing, restrictions |
| Change of Control | Consent requirements, termination rights |

## Integration Points

- **Legal Due Diligence**: Core tool for legal DD
- **Definitive Document Negotiation**: Inform deal negotiations
- **Audit Trail Verifier**: Connect contracts to financials
- **Legal Reviewer (Agent)**: Support legal analysis

## Risk Flags

- Unlimited liability provisions
- Broad indemnification obligations
- Onerous change of control clauses
- IP ownership ambiguities
- Automatic renewal with price escalators
- Most favored nation provisions
- Audit rights and clawback provisions

## Best Practices

1. Prioritize material contracts for detailed review
2. Maintain standard extraction templates
3. Flag deviations from market standard terms
4. Track obligations requiring ongoing compliance
5. Document contract review in organized fashion
