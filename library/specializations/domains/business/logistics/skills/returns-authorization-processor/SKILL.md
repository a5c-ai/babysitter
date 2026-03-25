---
name: returns-authorization-processor
description: Automated return authorization and routing skill optimizing return paths and customer experience
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

# Returns Authorization Processor

## Overview

The Returns Authorization Processor automates return authorization and routing decisions to optimize return paths and enhance customer experience. It validates return eligibility, selects optimal return methods, and detects potential fraud while maintaining customer satisfaction.

## Capabilities

- **Return Eligibility Validation**: Verify return eligibility based on policy rules, purchase date, and product condition
- **Return Reason Classification**: Categorize and analyze return reasons for trend identification
- **Return Method Selection**: Recommend optimal return method (carrier pickup, store drop-off, scheduled pickup)
- **Label Generation Automation**: Automatically generate return shipping labels with appropriate routing
- **Return Tracking Provision**: Provide return tracking capabilities from initiation to processing
- **Refund Timing Estimation**: Estimate and communicate expected refund processing timelines
- **Fraud Detection Screening**: Screen returns for fraud indicators and flag suspicious patterns

## Tools and Libraries

- OMS APIs
- Return Label Generation Services
- Fraud Detection Tools
- Customer Communication Platforms

## Used By Processes

- Reverse Logistics Management
- Returns Processing and Disposition
- Warranty Claims Processing

## Usage

```yaml
skill: returns-authorization-processor
inputs:
  return_request:
    order_id: "ORD-2026-12345"
    customer_id: "CUST-98765"
    items:
      - sku: "SKU001"
        quantity: 1
        reason_code: "defective"
        description: "Product stopped working after 2 weeks"
    original_purchase_date: "2026-01-05"
    original_amount: 149.99
  customer_profile:
    return_history:
      returns_last_12_months: 2
      return_rate_percent: 8
    customer_tier: "gold"
  return_policy:
    return_window_days: 30
    condition_requirements: ["original_packaging", "all_accessories"]
    free_return_threshold: 50.00
outputs:
  authorization:
    rma_number: "RMA-2026-54321"
    status: "approved"
    eligibility:
      within_return_window: true
      policy_compliant: true
      fraud_risk: "low"
  return_method:
    recommended_method: "carrier_pickup"
    carrier: "UPS"
    pickup_date_options: ["2026-01-26", "2026-01-27", "2026-01-28"]
    label_url: "https://returns.example.com/label/RMA-2026-54321"
    return_location: "Returns Center - Columbus, OH"
  refund_estimate:
    refund_amount: 149.99
    refund_method: "original_payment"
    estimated_processing_days: 5
    estimated_refund_date: "2026-02-03"
  customer_communication:
    confirmation_email_sent: true
    tracking_url: "https://returns.example.com/track/RMA-2026-54321"
  fraud_analysis:
    risk_score: 15
    risk_level: "low"
    flags: []
```

## Integration Points

- Order Management Systems (OMS)
- Customer Service Platforms
- Carrier Integration (label generation)
- Fraud Detection Systems
- Refund Processing Systems

## Performance Metrics

- Return authorization time
- Customer satisfaction (CSAT)
- Fraud detection rate
- Return processing cycle time
- Return rate by reason
