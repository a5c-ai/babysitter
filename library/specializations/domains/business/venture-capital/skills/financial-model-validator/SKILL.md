---
name: financial-model-validator
description: Validates financial model assumptions, checks formula integrity, stress tests scenarios
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
  skill-id: vc-skill-010
---

# Financial Model Validator

## Overview

The Financial Model Validator skill provides systematic validation of financial models submitted during due diligence. It checks assumption reasonableness, validates formula integrity, and stress tests scenarios to assess model reliability and identify risks.

## Capabilities

### Assumption Validation
- Check revenue assumptions against market data
- Validate cost structure assumptions
- Assess headcount and hiring plan reasonability
- Compare unit economics to industry benchmarks

### Formula Integrity Checking
- Detect circular references and errors
- Validate calculation accuracy
- Check balance sheet balancing
- Verify cash flow statement tie-outs

### Stress Testing
- Run downside scenario analyses
- Test assumption sensitivity
- Model cash runway under stress
- Identify breaking point assumptions

### Benchmark Comparison
- Compare projections to comparable companies
- Assess growth rate reasonability by stage
- Benchmark margins and efficiency metrics
- Validate working capital assumptions

## Usage

### Validate Financial Model
```
Input: Financial model file, validation parameters
Process: Parse model, run validation checks
Output: Validation report, issues identified
```

### Check Assumptions
```
Input: Model assumptions, market data, benchmarks
Process: Compare against reasonable ranges
Output: Assumption assessment, flags and concerns
```

### Stress Test Scenarios
```
Input: Base case model, stress parameters
Process: Apply stress scenarios, calculate impacts
Output: Stress test results, runway analysis
```

### Benchmark Model
```
Input: Financial projections, comparable set
Process: Compare against benchmarks
Output: Benchmark comparison, outlier identification
```

## Validation Checklist

| Category | Key Checks |
|----------|------------|
| Revenue | Growth rates, pricing trends, customer assumptions |
| Costs | Gross margin trends, opex scaling, headcount costs |
| Working Capital | AR/AP days, inventory, payment terms |
| Cash Flow | Capex, debt service, runway calculation |
| Structure | Formula accuracy, circular refs, balance |

## Integration Points

- **Financial Due Diligence**: Core validation for financial DD
- **DCF Modeler**: Validate models used in DCF analysis
- **Scenario Modeler**: Feed validated base case into scenarios
- **Financial Analyst (Agent)**: Support analyst validation work

## Common Issues Detected

- Unrealistic revenue growth hockey sticks
- Margin expansion without clear drivers
- Understated headcount requirements
- Missing or understated working capital needs
- Circular references in model logic
- Hard-coded values hiding assumptions

## Best Practices

1. Always validate against source data where possible
2. Check model against historical actuals
3. Run multiple stress scenarios
4. Document all validation findings
5. Request model walkthrough with management
