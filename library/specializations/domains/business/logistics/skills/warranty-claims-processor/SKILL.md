---
name: warranty-claims-processor
description: Streamlined warranty claim validation and processing skill improving customer satisfaction and reducing processing time
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
  category: returns
  priority: medium
---

# Warranty Claims Processor

## Overview

The Warranty Claims Processor streamlines warranty claim validation and processing to improve customer satisfaction and reduce processing time. It automates coverage verification, coordinates parts returns, and manages supplier recovery while detecting fraudulent claims.

## Capabilities

- **Warranty Coverage Verification**: Automatically verify warranty status, coverage terms, and eligibility
- **Claim Validity Assessment**: Assess claims against warranty terms and known failure patterns
- **Parts Return Coordination**: Coordinate the return of defective parts for analysis and supplier recovery
- **Replacement/Credit Processing**: Process product replacements, repairs, or credit issuance
- **Supplier Recovery Tracking**: Track and manage claims against suppliers for warranty cost recovery
- **Warranty Cost Analysis**: Analyze warranty costs by product, defect type, and supplier
- **Fraud Pattern Detection**: Detect fraudulent warranty claims through pattern analysis

## Tools and Libraries

- Warranty Management Systems
- Supplier Portals
- Claims Processing Platforms
- Fraud Detection Tools

## Used By Processes

- Warranty Claims Processing
- Returns Processing and Disposition
- Reverse Logistics Management

## Usage

```yaml
skill: warranty-claims-processor
inputs:
  claim:
    claim_id: "WC-2026-12345"
    customer_id: "CUST-98765"
    product:
      sku: "SKU001"
      serial_number: "SN-ABC123456"
      purchase_date: "2025-07-15"
      purchase_price: 499.99
    defect_description: "Motor failure - unit does not power on"
    claim_date: "2026-01-24"
  warranty_terms:
    standard_warranty_months: 12
    extended_warranty_months: 0
    coverage_type: "parts_and_labor"
    exclusions: ["physical_damage", "water_damage"]
  product_info:
    manufacturer: "Acme Corp"
    supplier_warranty: true
    known_defects: ["motor_bearing_failure"]
outputs:
  claim_validation:
    status: "approved"
    warranty_status: "in_warranty"
    warranty_expiration: "2026-07-15"
    days_remaining: 172
    coverage_applicable: true
    exclusions_triggered: []
  resolution:
    resolution_type: "replacement"
    replacement_sku: "SKU001-V2"
    replacement_order: "REP-2026-54321"
    estimated_ship_date: "2026-01-26"
    customer_cost: 0.00
  supplier_recovery:
    recoverable: true
    supplier: "Acme Corp"
    recovery_claim_id: "SR-2026-98765"
    recovery_amount: 275.00
    parts_return_required: true
    return_instructions: "Return defective unit to Acme Corp RMA Center"
  fraud_analysis:
    risk_score: 8
    risk_level: "low"
    claim_history:
      customer_claims_12mo: 0
      serial_number_claims: 0
    flags: []
  cost_tracking:
    claim_cost: 499.99
    expected_recovery: 275.00
    net_warranty_cost: 224.99
```

## Integration Points

- Product Registration Systems
- Order Management Systems
- Supplier Portals
- Customer Service Platforms
- Financial Systems

## Performance Metrics

- Claim processing time
- First-time resolution rate
- Supplier recovery rate
- Warranty cost per unit
- Customer satisfaction score
