---
name: xbrl-filing-generator
description: XBRL financial statement tagging and SEC filing preparation skill
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: finance-accounting
  domain: business
  category: reporting-analytics
  priority: lower
---

# XBRL Filing Generator

## Overview

The XBRL Filing Generator skill provides comprehensive XBRL tagging and SEC filing preparation capabilities. It enables taxonomy mapping, inline XBRL generation, and filing validation for regulatory compliance.

## Capabilities

### XBRL Taxonomy Mapping
- US GAAP taxonomy application
- Element selection guidance
- Custom element creation
- Dimension usage
- Member selection
- Axis application

### Inline XBRL Generation
- iXBRL document creation
- Human-readable format
- Embedded tagging
- Style preservation
- Block and detail tagging
- Calculation validation

### SEC Filing Validation
- EDGAR validation rules
- Error identification
- Warning resolution
- Consistency checking
- Completeness verification
- Cross-filing validation

### Extension Taxonomy Creation
- Custom element definition
- Label creation
- Reference linkbase
- Definition linkbase
- Presentation hierarchy
- Documentation

### Calculation and Presentation Linkbase
- Calculation relationships
- Presentation ordering
- Roll-up validation
- Subtotal verification
- Sign conventions
- Display grouping

### Filing Deadline Tracking
- Form-specific deadlines
- Extension management
- Amendment tracking
- Notification alerts
- Calendar integration
- Status monitoring

## Usage

### Financial Statement Tagging
```
Input: Financial statements, footnotes, taxonomy
Process: Map elements, apply tags, validate calculations
Output: Tagged XBRL document, validation report
```

### SEC Filing Preparation
```
Input: Tagged financials, form requirements, filing metadata
Process: Compile filing, run validations, prepare submission
Output: EDGAR-ready filing, validation results
```

## Integration

### Used By Processes
- Financial Statement Preparation
- External Audit Coordination
- SOX Compliance and Testing

### Tools and Libraries
- XBRL libraries
- SEC EDGAR
- Filing platforms (Workiva, Donnelley)
- Validation tools

## Best Practices

1. Start tagging early in the close process
2. Maintain taxonomy mapping documentation
3. Validate calculations comprehensively
4. Review peer filer approaches
5. Monitor SEC staff guidance
6. Build in review cycles before filing
