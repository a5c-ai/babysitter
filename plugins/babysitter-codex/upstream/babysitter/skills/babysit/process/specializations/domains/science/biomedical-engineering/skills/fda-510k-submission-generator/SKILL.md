---
name: fda-510k-submission-generator
description: Automated 510(k) premarket notification preparation for generating submission packages, predicate device comparisons, and substantial equivalence arguments
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
  skill-id: BME-SK-001
---

# FDA 510(k) Submission Generator Skill

## Purpose

The FDA 510(k) Submission Generator Skill automates the preparation of 510(k) premarket notifications for medical devices. It streamlines the creation of submission packages, predicate device comparisons, and substantial equivalence arguments to support regulatory clearance.

## Capabilities

- Predicate device database search and comparison
- Substantial equivalence argument drafting
- Device description template generation
- Performance data tabulation
- eCopy package structure validation
- FDA eSTAR form population assistance
- Indications for use statement generation
- Biocompatibility summary generation
- Software documentation compilation (if applicable)
- Performance testing summary tables
- Labeling content review assistance

## Usage Guidelines

### When to Use
- Preparing FDA 510(k) premarket notification submissions
- Identifying and comparing predicate devices
- Documenting substantial equivalence arguments
- Compiling regulatory submission packages

### Prerequisites
- Device design documentation completed
- Performance testing data available
- Predicate device research conducted
- Biocompatibility data compiled

### Best Practices
- Verify predicate device selection with regulatory team
- Ensure all performance data supports substantial equivalence
- Cross-reference with current FDA guidance documents
- Validate submission format against FDA requirements

## Process Integration

This skill integrates with the following processes:
- 510(k) Premarket Submission Preparation
- EU MDR Technical Documentation
- Post-Market Surveillance System Implementation
- Design Control Process Implementation

## Dependencies

- FDA GUDID API
- FDA 510(k) Database
- eSTAR templates
- CDRH guidance documents
- Product code database

## Configuration

```yaml
fda-510k-submission-generator:
  submission-types:
    - traditional
    - abbreviated
    - special
  device-classes:
    - Class I
    - Class II
  output-formats:
    - eCopy
    - eSTAR
  sections:
    - cover-letter
    - device-description
    - substantial-equivalence
    - performance-data
    - labeling
```

## Output Artifacts

- Complete 510(k) submission package
- Predicate device comparison tables
- Substantial equivalence arguments
- Device description documents
- Performance data summaries
- Labeling drafts
- eCopy file structure

## Quality Criteria

- Submission follows current FDA format requirements
- Predicate device selection is well-justified
- Substantial equivalence arguments are comprehensive
- All required sections are complete and accurate
- Performance data supports claimed equivalence
- Documentation suitable for FDA review
