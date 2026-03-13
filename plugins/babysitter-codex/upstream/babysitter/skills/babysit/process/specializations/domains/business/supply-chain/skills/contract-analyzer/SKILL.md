---
name: contract-analyzer
description: Contract analysis and negotiation support skill with clause extraction and risk identification
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: supply-chain
  domain: business
  category: procurement
  priority: future
---

# Contract Analyzer

## Overview

The Contract Analyzer provides intelligent contract analysis capabilities including clause extraction, risk identification, terms comparison, and negotiation support. It leverages natural language processing to accelerate contract review and improve negotiation outcomes.

## Capabilities

- **Contract Clause Extraction**: Automated identification and extraction of key clauses
- **Risk Clause Identification**: Flag high-risk or non-standard terms
- **Terms Comparison**: Side-by-side comparison across suppliers
- **Price Escalation Analysis**: Identify and model price adjustment mechanisms
- **SLA and KPI Extraction**: Extract service level commitments
- **Renewal Date Tracking**: Monitor contract expiration and renewal windows
- **Compliance Requirement Mapping**: Map regulatory and policy requirements
- **Negotiation Leverage Identification**: Highlight negotiation opportunities

## Input Schema

```yaml
contract_analysis_request:
  contract_document: object       # Contract file or text
  analysis_type: string           # full, risk, comparison
  reference_contracts: array      # For comparison analysis
  company_standards: object       # Standard terms to compare against
  risk_categories: array          # Risk areas to flag
  extraction_fields: array        # Specific fields to extract
```

## Output Schema

```yaml
contract_analysis_output:
  extracted_terms:
    pricing: object
    payment_terms: object
    delivery_terms: object
    warranty: object
    liability: object
    termination: object
    sla_kpis: array
  risk_assessment:
    high_risk_clauses: array
    deviations_from_standard: array
    missing_protections: array
    risk_score: float
  comparison_matrix: object
  negotiation_points: array
  renewal_alerts: array
  compliance_status: object
```

## Usage

### Contract Risk Review

```
Input: Draft supplier contract
Process: Extract clauses, compare to standards, identify risks
Output: Risk assessment with flagged clauses and recommendations
```

### Supplier Terms Comparison

```
Input: Contracts from 3 competing suppliers
Process: Extract and compare key terms side-by-side
Output: Comparison matrix highlighting differences
```

### Renewal Analysis

```
Input: Existing contract approaching renewal
Process: Analyze current terms, market changes, performance
Output: Renegotiation strategy with target improvements
```

## Integration Points

- **Contract Management Systems**: CLM platforms integration
- **Legal Document Repositories**: Access to contract templates
- **NLP/AI Tools**: Legal AI, contract analysis platforms
- **Tools/Libraries**: NLP libraries, document parsing

## Process Dependencies

- Contract Negotiation and Management
- Strategic Sourcing Initiative
- Supplier Onboarding and Qualification

## Best Practices

1. Maintain current clause libraries and standards
2. Involve legal counsel for high-risk findings
3. Track clause acceptance rates for negotiation insights
4. Version control all contract iterations
5. Document negotiation rationale for precedent
6. Regular review of standard terms against market practice
