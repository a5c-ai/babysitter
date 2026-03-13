---
name: incoterms-compliance-checker
description: International shipping terms validation and documentation skill ensuring trade compliance
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
  category: analytics
  priority: lower
  shared-candidate: true
---

# Incoterms Compliance Checker

## Overview

The Incoterms Compliance Checker validates international shipping terms and ensures trade documentation compliance. It verifies proper application of Incoterms 2020, identifies risk transfer points, and supports customs compliance for international shipments.

## Capabilities

- **Incoterms 2020 Validation**: Validate correct application and interpretation of Incoterms 2020 rules
- **Risk Transfer Point Identification**: Clearly identify where risk transfers from seller to buyer
- **Cost Responsibility Allocation**: Allocate costs appropriately based on selected Incoterm
- **Document Requirement Generation**: Generate lists of required documents for each Incoterm
- **Customs Compliance Checking**: Verify compliance with customs requirements based on trade terms
- **Trade Agreement Validation**: Check applicability of trade agreements and preferential tariffs
- **Landed Cost Calculation**: Calculate total landed costs including duties, taxes, and fees

## Tools and Libraries

- Trade Compliance Databases
- Customs APIs
- Landed Cost Calculators
- Document Management Systems

## Used By Processes

- Carrier Selection and Procurement
- Freight Audit and Payment
- Distribution Network Optimization

## Usage

```yaml
skill: incoterms-compliance-checker
inputs:
  shipment:
    origin_country: "CN"
    destination_country: "US"
    origin_port: "Shanghai"
    destination_port: "Los Angeles"
    incoterm: "CIF"
    product:
      hs_code: "8471.30.0100"
      description: "Laptop computers"
      value: 250000
      weight_kg: 500
    parties:
      seller: "Acme Electronics Ltd, Shanghai"
      buyer: "Tech Distributors Inc, Los Angeles"
  validation_scope:
    incoterm_compliance: true
    document_requirements: true
    landed_cost: true
outputs:
  incoterm_validation:
    incoterm: "CIF"
    full_name: "Cost, Insurance and Freight"
    applicable_mode: "sea_and_inland_waterway"
    validation_status: "valid"
    mode_match: true
  risk_transfer:
    point: "On board the vessel at port of shipment"
    location: "Shanghai Port"
    seller_risk_coverage: "Until goods placed on vessel"
    buyer_risk_coverage: "From vessel loading onwards"
  cost_allocation:
    seller_responsibilities:
      - "Export clearance and duties"
      - "Carriage to port of shipment"
      - "Loading charges"
      - "Ocean freight to destination port"
      - "Marine insurance (minimum coverage)"
    buyer_responsibilities:
      - "Unloading at destination port"
      - "Import clearance and duties"
      - "Carriage from port to final destination"
      - "Additional insurance if desired"
  document_requirements:
    seller_must_provide:
      - "Commercial invoice"
      - "Packing list"
      - "Bill of lading"
      - "Certificate of origin"
      - "Insurance certificate"
      - "Export license (if required)"
    buyer_must_obtain:
      - "Import license (if required)"
      - "Customs entry documentation"
  landed_cost_calculation:
    product_value: 250000
    international_freight: 4500
    insurance: 625
    customs_duties: 0  # Duty-free under HS code
    customs_processing_fee: 500
    harbor_maintenance_fee: 62.50
    merchandise_processing_fee: 556.31
    inland_freight_estimate: 2500
    total_landed_cost: 258743.81
    landed_cost_per_unit: 517.49
  compliance_alerts:
    - type: "documentation"
      message: "Ensure certificate of origin is properly certified for potential duty savings"
      severity: "info"
```

## Integration Points

- Global Trade Management Systems
- Customs Brokers
- Trade Compliance Databases
- Freight Forwarders
- Financial Systems

## Performance Metrics

- Compliance rate
- Documentation accuracy
- Customs clearance time
- Landed cost accuracy
- Trade agreement utilization
