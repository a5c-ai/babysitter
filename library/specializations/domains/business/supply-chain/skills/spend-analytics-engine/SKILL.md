---
name: spend-analytics-engine
description: Procurement spend analysis skill with classification, consolidation, and savings identification
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: supply-chain
  domain: business
  category: analytics
  priority: high
---

# Spend Analytics Engine

## Overview

The Spend Analytics Engine provides comprehensive procurement spend analysis capabilities. It cleanses and classifies spend data, identifies consolidation opportunities, detects maverick spending, and quantifies savings opportunities to drive procurement value.

## Capabilities

- **Spend Data Cleansing and Normalization**: Data quality improvement
- **UNSPSC/Commodity Classification**: Standard category assignment
- **Supplier Consolidation Analysis**: Fragmentation identification
- **Price Variance Identification**: Unit price analysis across transactions
- **Maverick Spend Detection**: Off-contract purchasing identification
- **Contract Compliance Analysis**: Spend vs. contract terms
- **Savings Opportunity Quantification**: Addressable spend and savings potential
- **Spend Trend Visualization**: Historical pattern analysis

## Input Schema

```yaml
spend_analysis_request:
  spend_data:
    transactions: array
      - supplier: string
        description: string
        amount: float
        quantity: float
        date: date
        business_unit: string
        cost_center: string
    period:
      start_date: date
      end_date: date
  reference_data:
    supplier_master: array
    category_taxonomy: object
    contracts: array
  analysis_scope:
    analysis_types: array         # classification, consolidation, compliance
    focus_categories: array
    thresholds: object
```

## Output Schema

```yaml
spend_analysis_output:
  spend_summary:
    total_spend: float
    supplier_count: integer
    transaction_count: integer
    by_category: object
    by_supplier: object
    by_business_unit: object
  classification_results:
    classified_spend: float
    unclassified_spend: float
    category_distribution: object
  consolidation_opportunities:
    fragmented_categories: array
    supplier_rationalization: array
    estimated_savings: float
  price_variance_analysis:
    variance_by_item: array
    outliers: array
    benchmark_comparisons: object
  maverick_spend:
    off_contract_spend: float
    percentage: float
    top_violations: array
  contract_compliance:
    compliant_spend: float
    non_compliant_spend: float
    compliance_issues: array
  savings_opportunities:
    total_addressable_spend: float
    estimated_savings: float
    initiatives: array
      - initiative: string
        category: string
        addressable_spend: float
        savings_potential: float
        confidence: string
  visualizations: object
```

## Usage

### Comprehensive Spend Analysis

```
Input: 12 months AP transaction data
Process: Cleanse, classify, analyze patterns
Output: Complete spend analysis with savings opportunities
```

### Supplier Consolidation Analysis

```
Input: Classified spend by category
Process: Identify fragmentation, model consolidation
Output: Consolidation recommendations with savings
```

### Contract Compliance Review

```
Input: Spend data, contract terms
Process: Match spend to contracts, identify leakage
Output: Compliance report with violation details
```

## Integration Points

- **Spend Analytics Platforms**: Coupa, SAP Ariba, Jaggaer
- **ERP Systems**: AP data extraction
- **Classification Services**: Automated categorization
- **Tools/Libraries**: Spend analytics, classification algorithms

## Process Dependencies

- Spend Analysis and Savings Identification
- Category Management
- Strategic Sourcing Initiative

## Best Practices

1. Establish regular data refresh cadence
2. Maintain category taxonomy consistency
3. Validate classification accuracy periodically
4. Focus on actionable savings opportunities
5. Track savings realization against projections
6. Communicate insights to stakeholders regularly
