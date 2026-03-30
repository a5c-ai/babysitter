---
name: lease-accounting-calculator
description: ASC 842/IFRS 16 lease accounting skill for right-of-use asset and liability calculations
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

# Lease Accounting Calculator

## Overview

The Lease Accounting Calculator skill implements ASC 842 and IFRS 16 lease accounting requirements. It calculates right-of-use assets and lease liabilities, handles lease modifications, and supports lease classification determination.

## Capabilities

### Lease Classification Determination
- Finance vs. operating lease criteria (ASC 842)
- Ownership transfer assessment
- Purchase option evaluation
- Lease term vs. economic life
- Present value vs. fair value test
- Specialized nature consideration

### Right-of-Use Asset Calculation
- Initial measurement components
- Lease liability inclusion
- Prepaid rent addition
- Initial direct costs
- Lease incentives deduction
- Restoration obligations

### Lease Liability Amortization
- Effective interest method
- Payment schedule generation
- Variable payment treatment
- Index-based adjustment
- Residual value guarantee
- In-substance fixed payments

### Modification Accounting
- Modification types identification
- Remeasurement triggers
- Separate lease assessment
- Gain/loss calculation
- Discount rate updating
- Remaining term adjustment

### Discount Rate Determination
- Rate implicit in lease
- Incremental borrowing rate
- Risk-free rate consideration
- Portfolio rate application
- Currency-specific rates
- Rate documentation

### Embedded Lease Identification
- Service contract analysis
- Right to control assessment
- Economic benefit evaluation
- Direction rights analysis
- Separation requirements
- Allocation methodology

## Usage

### New Lease Recording
```
Input: Lease agreement, payment schedule, rate assumptions
Process: Calculate ROU asset and liability, determine classification
Output: Day-one journal entry, amortization schedule, disclosure support
```

### Lease Modification
```
Input: Original lease, modification terms, reassessment date
Process: Evaluate modification type, recalculate balances
Output: Modification adjustment entries, updated schedules
```

## Integration

### Used By Processes
- Lease Accounting and ASC 842 Implementation
- Financial Statement Preparation
- Month-End Close Process

### Tools and Libraries
- Lease accounting software APIs
- Excel templates
- LeaseQuery, LeaseAccelerator integration

## Best Practices

1. Maintain comprehensive lease inventory
2. Establish discount rate methodology and document support
3. Create modification assessment decision tree
4. Build embedded lease identification checklist
5. Implement lease data collection procedures
6. Develop short-term and low-value lease policies
