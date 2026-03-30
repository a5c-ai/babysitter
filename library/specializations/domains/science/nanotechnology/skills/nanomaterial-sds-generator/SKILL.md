---
name: nanomaterial-sds-generator
description: Safety documentation skill for generating Safety Data Sheets for nanomaterials
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: nanotechnology
  domain: science
  category: infrastructure-quality
  priority: medium
  phase: 6
  tools-libraries:
    - SDS authoring tools
    - Hazard databases
---

# Nanomaterial SDS Generator

## Purpose

The Nanomaterial SDS Generator skill provides automated generation of Safety Data Sheets for nanomaterials, ensuring proper hazard communication and regulatory compliance for safe handling.

## Capabilities

- GHS classification for nanomaterials
- Hazard identification
- Exposure control recommendations
- First aid and fire-fighting measures
- Disposal considerations
- Regulatory information compilation

## Usage Guidelines

### SDS Generation

1. **Hazard Classification**
   - Apply GHS criteria
   - Consider nano-specific hazards
   - Assign hazard statements

2. **Exposure Controls**
   - Define engineering controls
   - Specify PPE requirements
   - Set exposure limits

3. **Document Assembly**
   - Populate 16 GHS sections
   - Include nano-specific info
   - Generate PDF output

## Process Integration

- Nanomaterial Safety Assessment Pipeline

## Input Schema

```json
{
  "material_name": "string",
  "cas_number": "string",
  "composition": [{"component": "string", "percentage": "number"}],
  "physical_form": "powder|dispersion|embedded",
  "particle_size": "number (nm)",
  "hazard_data": {
    "ld50": "number",
    "inhalation_data": "string"
  }
}
```

## Output Schema

```json
{
  "sds_document": {
    "file_path": "string",
    "revision_date": "string",
    "format": "GHS"
  },
  "classification": {
    "hazard_classes": ["string"],
    "signal_word": "danger|warning|none",
    "pictograms": ["string"]
  },
  "key_warnings": ["string"],
  "ppe_requirements": ["string"]
}
```
