---
name: intercompany-eliminator
description: Automated intercompany transaction identification and elimination skill for consolidated reporting
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

# Intercompany Eliminator

## Overview

The Intercompany Eliminator skill automates the identification and elimination of intercompany transactions for consolidated financial reporting. It ensures accurate elimination entries and handles complex multi-entity structures.

## Capabilities

### Intercompany Matching
- Trading partner identification
- Transaction type classification
- Amount reconciliation
- Timing difference handling
- Currency conversion alignment
- Threshold-based matching

### Elimination Entry Generation
- Revenue/cost of goods sold elimination
- Intercompany receivable/payable netting
- Dividend elimination
- Management fee elimination
- Interest income/expense elimination
- Service charge elimination

### Currency Translation
- Functional currency determination
- Translation method application
- Temporal method calculations
- Current rate method application
- Cumulative translation adjustment
- Remeasurement gain/loss

### Minority Interest Calculation
- Noncontrolling interest identification
- Profit/loss allocation
- Comprehensive income allocation
- Changes in ownership treatment
- Step acquisition adjustments
- Deconsolidation accounting

### Investment Elimination
- Cost method elimination
- Equity method elimination
- Acquisition accounting
- Goodwill calculation
- Push-down accounting
- Basis differences

### Unrealized Profit Elimination
- Inventory profit elimination
- Fixed asset profit elimination
- Upstream vs. downstream
- Minority interest impact
- Tax effect consideration
- Realization timing

## Usage

### Monthly Consolidation
```
Input: Subsidiary trial balances, intercompany activity reports
Process: Match transactions, generate eliminations, calculate minority interest
Output: Consolidated trial balance, elimination entries, reconciliation report
```

### Intercompany Reconciliation
```
Input: Intercompany balance reports from all entities
Process: Identify mismatches, investigate differences, propose adjustments
Output: Reconciled balances, adjustment entries, exception report
```

## Integration

### Used By Processes
- Intercompany Accounting and Consolidation
- Financial Statement Preparation
- Month-End Close Process

### Tools and Libraries
- ERP APIs (SAP, Oracle)
- Consolidation software (HFM, OneStream)
- Custom matching algorithms

## Best Practices

1. Establish intercompany policies and procedures
2. Implement real-time matching where possible
3. Set materiality thresholds for reconciliation
4. Create standard intercompany transaction templates
5. Build escalation procedures for unmatched items
6. Maintain entity relationship mapping
