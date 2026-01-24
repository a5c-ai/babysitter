---
name: udi-labeling-generator
description: Unique Device Identification (UDI) and labeling compliance skill for generating compliant labels and device identifiers
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - Bash
metadata:
  specialization: biomedical-engineering
  domain: science
  category: Regulatory Compliance
  skill-id: BME-SK-004
---

# UDI Labeling Generator Skill

## Purpose

The UDI Labeling Generator Skill creates compliant Unique Device Identification labels and manages device identifier assignments for FDA GUDID and EU EUDAMED submissions.

## Capabilities

- UDI-DI and UDI-PI generation
- GUDID data submission preparation
- Label content validation
- IFU (Instructions for Use) template generation
- Multi-language labeling support
- Symbol compliance verification (ISO 15223-1)
- Barcode generation (GS1, HIBCC, ICCBBA)
- Label artwork review assistance
- EUDAMED UDI registration support
- Package hierarchy management
- Date format standardization

## Usage Guidelines

### When to Use
- Creating device labeling for regulatory submission
- Registering devices in GUDID or EUDAMED
- Designing label artwork and content
- Validating labeling compliance

### Prerequisites
- Device identification information finalized
- Issuing agency account established
- Package configuration defined
- Regulatory requirements identified

### Best Practices
- Establish UDI strategy early in development
- Validate barcode readability across packaging
- Ensure symbol usage meets ISO 15223-1
- Maintain consistency across label variants

## Process Integration

This skill integrates with the following processes:
- 510(k) Premarket Submission Preparation
- EU MDR Technical Documentation
- Design Control Process Implementation
- Sterile Barrier System Validation

## Dependencies

- FDA GUDID API
- GS1 standards and databases
- EUDAMED system
- ISO 15223-1 symbol library
- Issuing agency interfaces

## Configuration

```yaml
udi-labeling-generator:
  issuing-agencies:
    - GS1
    - HIBCC
    - ICCBBA
  label-types:
    - device-label
    - package-label
    - shipping-label
  barcode-formats:
    - GS1-128
    - DataMatrix
    - QR-Code
  regulatory-regions:
    - FDA
    - EU-MDR
    - Health-Canada
```

## Output Artifacts

- UDI-DI assignments
- UDI-PI format specifications
- GUDID submission files
- Label content templates
- IFU drafts
- Barcode specifications
- Symbol usage guides
- Multi-language label sets

## Quality Criteria

- UDI format complies with issuing agency requirements
- Labels meet FDA 21 CFR 801 requirements
- EU MDR Annex VI requirements satisfied
- Symbols conform to ISO 15223-1
- Barcodes meet readability specifications
- Package hierarchy accurately represented
