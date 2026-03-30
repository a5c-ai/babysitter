---
name: freight-audit-validator
description: Automated freight bill validation skill with discrepancy detection and payment processing automation
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: logistics
  domain: business
  category: transportation
  priority: lower
---

# Freight Audit Validator

## Overview

The Freight Audit Validator is an automated skill that validates freight bills and invoices, detects discrepancies, and streamlines payment processing. It uses OCR, data extraction, and contract validation to ensure accurate carrier payments while identifying cost recovery opportunities from billing errors.

## Capabilities

- **Invoice Data Extraction (OCR)**: Automatically extract invoice data from paper and electronic documents using optical character recognition
- **Contract Rate Validation**: Verify billed rates against contracted rates, tariffs, and pricing agreements
- **Accessorial Charge Verification**: Validate accessorial charges against service records and approved charge schedules
- **Weight and Dimension Validation**: Cross-reference billed weights and dimensions with shipping documents and actual measurements
- **Duplicate Invoice Detection**: Identify and flag potential duplicate invoices to prevent double payments
- **Discrepancy Classification**: Categorize billing discrepancies by type, root cause, and financial impact
- **Claim Generation Automation**: Automatically generate claims and dispute documentation for invalid charges

## Tools and Libraries

- OCR Engines (Tesseract, ABBYY)
- EDI Parsers (X12 210, 214)
- Freight Audit Platforms
- Document Management APIs

## Used By Processes

- Freight Audit and Payment
- Carrier Selection and Procurement

## Usage

```yaml
skill: freight-audit-validator
inputs:
  invoice:
    invoice_number: "INV-2026-12345"
    carrier_id: "CARRIER001"
    invoice_date: "2026-01-20"
    total_amount: 2350.00
    line_items:
      - description: "Line haul"
        amount: 2100.00
      - description: "Fuel surcharge"
        amount: 185.00
      - description: "Liftgate"
        amount: 65.00
  shipment_reference: "SHP-2026-98765"
  validation_rules:
    tolerance_percentage: 2
    auto_approve_under: 50.00
outputs:
  validation_result:
    status: "discrepancy_found"
    approved_amount: 2285.00
    discrepancy_amount: 65.00
    discrepancies:
      - type: "accessorial_not_authorized"
        description: "Liftgate charge not on BOL"
        billed_amount: 65.00
        approved_amount: 0.00
        action: "claim_generated"
    claim_reference: "CLM-2026-54321"
```

## Integration Points

- Accounts Payable Systems
- Transportation Management Systems (TMS)
- Contract Management Systems
- Document Management Systems
- EDI Networks

## Performance Metrics

- Invoice processing accuracy
- Discrepancy detection rate
- Cost recovery amount
- Processing cycle time
- Auto-approval rate
