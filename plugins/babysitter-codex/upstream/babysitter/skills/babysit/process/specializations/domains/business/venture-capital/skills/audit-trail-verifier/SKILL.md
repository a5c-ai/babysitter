---
name: audit-trail-verifier
description: Verifies financial data against source documents, bank statements, contracts
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
  skill-id: vc-skill-012
---

# Audit Trail Verifier

## Overview

The Audit Trail Verifier skill provides systematic verification of financial data against source documentation during due diligence. It traces reported metrics back to bank statements, contracts, and other primary sources to validate accuracy and identify discrepancies.

## Capabilities

### Bank Statement Reconciliation
- Match reported revenue to bank deposits
- Verify cash balance accuracy
- Reconcile payment timing differences
- Identify unexplained discrepancies

### Contract Verification
- Match revenue recognition to contract terms
- Verify pricing and payment terms
- Check contract status and renewal dates
- Validate customer counts against contracts

### Invoice and Payment Tracking
- Trace invoices to payments received
- Analyze days sales outstanding (DSO)
- Identify collection issues
- Verify accounts receivable aging

### Expense Verification
- Match expenses to supporting documentation
- Verify vendor contracts and commitments
- Check employee payroll against records
- Validate equity compensation records

## Usage

### Verify Revenue
```
Input: Reported revenue, bank statements, contracts
Process: Trace revenue to sources, reconcile differences
Output: Verification report, discrepancy list
```

### Reconcile Cash
```
Input: Reported cash, bank statements
Process: Compare balances, identify differences
Output: Cash reconciliation, unexplained items
```

### Verify Contracts
```
Input: Customer list, revenue claims, contract files
Process: Match contracts to revenue, check terms
Output: Contract verification summary, issues found
```

### Audit Expenses
```
Input: Expense reports, supporting documentation
Process: Sample and verify expenses, check approvals
Output: Expense audit results, policy compliance
```

## Verification Categories

| Category | Key Verification Points |
|----------|------------------------|
| Revenue | Bank deposits, contracts, invoices, recognition timing |
| Cash | Bank statements, reconciliations, restricted cash |
| Receivables | Aging, collectability, concentration |
| Payables | Vendor agreements, payment terms, accruals |
| Payroll | Employment records, compensation agreements |

## Integration Points

- **Financial Due Diligence**: Core verification for financial DD
- **Financial Model Validator**: Validate historical data accuracy
- **Legal Due Diligence**: Coordinate contract reviews
- **Financial Analyst (Agent)**: Support verification work

## Red Flags

- Revenue not matching bank deposits
- Large reconciling items without explanation
- Significant revenue concentration in month-end
- Missing or incomplete contract documentation
- Unusual related party transactions
- Unexplained cash movements

## Best Practices

1. Request direct bank feeds or certified statements
2. Sample test across periods, not just recent
3. Focus on material items and unusual patterns
4. Request management explanations for discrepancies
5. Document verification trail thoroughly
