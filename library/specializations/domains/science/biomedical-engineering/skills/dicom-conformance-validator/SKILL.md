---
name: dicom-conformance-validator
description: DICOM conformance testing and integration skill for medical imaging systems
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
  category: Medical Device Software
  skill-id: BME-SK-022
---

# DICOM Conformance Validator Skill

## Purpose

The DICOM Conformance Validator Skill supports DICOM conformance testing and interoperability validation for medical imaging systems, ensuring proper implementation of DICOM standards and IHE profiles.

## Capabilities

- DICOM Conformance Statement generation
- Service class (SCP/SCU) implementation verification
- PACS integration testing
- IHE profile conformance checking
- Worklist integration validation
- WADO-RS/DICOMweb compliance
- HL7 FHIR integration support
- Network configuration testing
- Transfer syntax verification
- Character set handling
- Query/retrieve validation

## Usage Guidelines

### When to Use
- Validating DICOM implementation
- Preparing conformance statements
- Testing PACS integration
- Verifying IHE profile compliance

### Prerequisites
- DICOM implementation complete
- Test environment configured
- Target system interfaces defined
- IHE profile requirements identified

### Best Practices
- Test with representative datasets
- Validate all claimed SOP classes
- Verify edge cases and error handling
- Document deviations from standard

## Process Integration

This skill integrates with the following processes:
- DICOM Integration and Interoperability
- Medical Image Processing Algorithm Development
- Software Verification and Validation
- 510(k) Premarket Submission Preparation

## Dependencies

- DVTk validation toolkit
- DCMTK command line tools
- Pydicom library
- OHIF viewer
- IHE test tools

## Configuration

```yaml
dicom-conformance-validator:
  service-classes:
    - storage-scp
    - storage-scu
    - query-retrieve-scp
    - query-retrieve-scu
    - worklist-scp
    - worklist-scu
  ihe-profiles:
    - SWF
    - PIR
    - RID
    - IOCM
  transfer-syntaxes:
    - implicit-VR-LE
    - explicit-VR-LE
    - explicit-VR-BE
    - JPEG-lossless
    - JPEG2000
```

## Output Artifacts

- Conformance statements
- Test execution reports
- Integration test results
- IHE conformance documentation
- Network configuration specs
- Error handling documentation
- Interoperability test plans
- Validation summaries

## Quality Criteria

- All claimed SOP classes validated
- Conformance statement accurate
- IHE profiles properly implemented
- Error handling appropriate
- Network behavior correct
- Documentation supports FDA submission
