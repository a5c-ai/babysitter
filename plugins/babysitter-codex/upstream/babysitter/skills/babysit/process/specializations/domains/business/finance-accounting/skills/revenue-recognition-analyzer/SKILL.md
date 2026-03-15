---
name: revenue-recognition-analyzer
description: ASC 606 five-step model implementation skill for revenue recognition analysis and documentation
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
  priority: medium
---

# Revenue Recognition Analyzer

## Overview

The Revenue Recognition Analyzer skill implements the ASC 606 five-step revenue recognition model. It provides systematic analysis of contracts with customers to determine appropriate revenue recognition timing and amounts.

## Capabilities

### Contract Identification (Step 1)
- Contract existence verification
- Collectability assessment
- Commercial substance evaluation
- Contract combination analysis
- Contract modification handling
- Portfolio approach application

### Performance Obligation Analysis (Step 2)
- Distinct good/service identification
- Series guidance application
- Promise evaluation
- Immaterial promise assessment
- Shipping and handling evaluation
- Warranty classification

### Transaction Price Determination (Step 3)
- Fixed consideration identification
- Variable consideration estimation
- Constraint application
- Significant financing component
- Noncash consideration valuation
- Consideration payable to customer

### Allocation Calculation (Step 4)
- Standalone selling price determination
- Observable price usage
- Estimation approaches (adjusted market, expected cost plus margin, residual)
- Discount allocation
- Variable consideration allocation
- Change in transaction price handling

### Revenue Timing Assessment (Step 5)
- Point in time recognition criteria
- Over time recognition criteria
- Output method application
- Input method application
- Progress measurement
- Completion determination

### Variable Consideration Estimation
- Expected value method
- Most likely amount method
- Constraint assessment
- Update requirements
- Reversal risk evaluation
- Historical data analysis

## Usage

### New Contract Analysis
```
Input: Contract terms, deliverables, pricing structure
Process: Apply five-step model systematically
Output: Revenue recognition conclusion, journal entries, documentation
```

### Contract Modification
```
Input: Original contract, modification terms, cumulative revenue
Process: Evaluate modification accounting treatment
Output: Prospective or cumulative catch-up adjustment calculation
```

## Integration

### Used By Processes
- Revenue Recognition and ASC 606 Compliance
- Financial Statement Preparation
- External Audit Coordination

### Tools and Libraries
- Contract analysis tools
- Revenue recognition templates
- ERP revenue modules

## Best Practices

1. Document each step of the five-step model
2. Maintain contract population inventory
3. Develop revenue recognition policies by transaction type
4. Build standalone selling price database
5. Create decision trees for common scenarios
6. Establish review procedures for non-standard terms
