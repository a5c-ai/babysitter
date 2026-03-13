---
name: rfx-document-generator
description: Automated RFI/RFP/RFQ document creation skill with template management and evaluation criteria
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
  priority: standard
---

# RFx Document Generator

## Overview

The RFx Document Generator automates the creation of Request for Information (RFI), Request for Proposal (RFP), and Request for Quotation (RFQ) documents. It provides template management, evaluation criteria definition, and response analysis capabilities to streamline the competitive bidding process.

## Capabilities

- **RFI/RFP/RFQ Template Generation**: Structured document creation from templates
- **Scope of Work Structuring**: Comprehensive SOW development
- **Evaluation Criteria Weighting**: Define and weight selection criteria
- **Terms and Conditions Library**: Standard clause management
- **Supplier Question Management**: Q&A tracking and response
- **Response Collection and Parsing**: Structured response extraction
- **Side-by-Side Comparison Matrices**: Supplier response comparison
- **Award Recommendation Scoring**: Weighted scoring and ranking

## Input Schema

```yaml
rfx_request:
  rfx_type: string                # RFI, RFP, RFQ
  category: string
  scope_of_work:
    description: string
    requirements: array
    specifications: object
  evaluation_criteria: array
    - criterion: string
      weight: float
      scoring_method: string
  timeline:
    issue_date: date
    question_deadline: date
    response_deadline: date
    award_date: date
  invited_suppliers: array
  terms_requirements: array
```

## Output Schema

```yaml
rfx_output:
  document:
    header: object
    introduction: string
    scope_of_work: object
    requirements: array
    evaluation_criteria: object
    terms_and_conditions: array
    response_instructions: object
    timeline: object
  response_template: object
  evaluation_scorecard: object
  comparison_matrix: object
  award_recommendation: object
```

## Usage

### RFP Creation

```
Input: Category requirements, evaluation criteria, supplier list
Process: Generate structured RFP with weighted evaluation
Output: Complete RFP document with response template
```

### Response Evaluation

```
Input: Supplier responses, evaluation criteria
Process: Score responses, calculate weighted totals
Output: Comparison matrix with ranking and recommendation
```

### RFQ for Commodity Sourcing

```
Input: Specifications, quantities, delivery requirements
Process: Generate quote request with pricing template
Output: RFQ document optimized for price comparison
```

## Integration Points

- **e-Sourcing Platforms**: Ariba, Coupa, Jaggaer integration
- **Document Management**: Template repository, version control
- **Supplier Portals**: Electronic distribution and response collection
- **Tools/Libraries**: Document generation frameworks

## Process Dependencies

- RFx Process Management
- Strategic Sourcing Initiative
- Supplier Evaluation and Selection

## Best Practices

1. Use standardized templates for consistency
2. Clearly define evaluation criteria before issuing RFx
3. Ensure compliance with procurement policies
4. Maintain audit trail of all communications
5. Allow adequate response time for complex RFPs
6. Debrief unsuccessful bidders when appropriate
