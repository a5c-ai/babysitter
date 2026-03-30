---
name: account-reconciliation-automator
description: Automated account reconciliation skill with matching algorithms and exception handling
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

# Account Reconciliation Automator

## Overview

The Account Reconciliation Automator skill provides automated reconciliation capabilities for financial accounts. It uses matching algorithms to reconcile balances and transactions, identifies exceptions, and streamlines the close process.

## Capabilities

### Bank Reconciliation Automation
- Statement import and parsing
- Transaction matching rules
- Outstanding check tracking
- Deposit in transit identification
- Bank fee recognition
- Interest income posting

### Subledger to GL Matching
- Accounts receivable reconciliation
- Accounts payable reconciliation
- Fixed asset subledger matching
- Inventory valuation reconciliation
- Prepaid expense verification
- Accrual account validation

### Three-Way Match Processing
- Purchase order matching
- Goods receipt verification
- Invoice matching
- Quantity tolerance checking
- Price variance identification
- Exception routing

### Exception Identification
- Unmatched item detection
- Threshold-based flagging
- Aging categorization
- Priority assignment
- Owner notification
- Resolution tracking

### Aging Analysis
- Bucket categorization
- Days outstanding calculation
- Collectability assessment
- Write-off identification
- Reserve calculation support
- Trend analysis

### Variance Threshold Alerting
- Configurable thresholds
- Automatic escalation
- Email notifications
- Dashboard integration
- Audit trail creation
- Resolution documentation

## Usage

### Month-End Reconciliation
```
Input: GL balances, subledger reports, bank statements
Process: Execute matching rules, identify exceptions, generate reconciliation
Output: Certified reconciliation, exception list, adjustment entries
```

### Daily Cash Reconciliation
```
Input: Bank feeds, cash receipts, disbursements
Process: Match transactions, identify timing differences
Output: Reconciled cash position, outstanding items list
```

## Integration

### Used By Processes
- Month-End Close Process
- External Audit Coordination
- SOX Compliance and Testing

### Tools and Libraries
- BlackLine API
- Trintech
- Reconciliation platforms
- RPA tools

## Best Practices

1. Establish reconciliation frequency by account risk
2. Define matching rules with appropriate tolerances
3. Set escalation timelines for aged exceptions
4. Maintain documentation standards
5. Implement certification workflows
6. Build continuous monitoring for high-risk accounts
