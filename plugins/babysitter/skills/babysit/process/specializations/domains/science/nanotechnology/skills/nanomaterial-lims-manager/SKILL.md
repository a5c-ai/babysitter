---
name: nanomaterial-lims-manager
description: Laboratory Information Management System skill for nanomaterial sample tracking and data management
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
  priority: high
  phase: 6
  tools-libraries:
    - LIMS systems
    - ELN platforms
---

# Nanomaterial LIMS Manager

## Purpose

The Nanomaterial LIMS Manager skill provides comprehensive laboratory information management for nanomaterial research, enabling systematic sample tracking, data linking, and quality assurance throughout the development lifecycle.

## Capabilities

- Sample tracking and chain of custody
- Synthesis parameter logging
- Characterization data linking
- Batch genealogy tracking
- Quality control checkpoints
- Regulatory documentation

## Usage Guidelines

### LIMS Operations

1. **Sample Management**
   - Register new samples
   - Track sample locations
   - Maintain chain of custody

2. **Data Integration**
   - Link synthesis records
   - Associate characterization data
   - Build batch genealogy

3. **Quality Management**
   - Define QC checkpoints
   - Track specifications
   - Generate certificates

## Process Integration

- All synthesis and characterization processes
- Nanomaterial Scale-Up and Process Transfer

## Input Schema

```json
{
  "operation": "register|track|query|report",
  "sample_id": "string",
  "sample_type": "nanoparticle|thin_film|device",
  "metadata": {
    "project": "string",
    "synthesized_by": "string",
    "synthesis_date": "string"
  }
}
```

## Output Schema

```json
{
  "sample_record": {
    "sample_id": "string",
    "status": "active|consumed|archived",
    "location": "string",
    "linked_data": [{
      "data_type": "string",
      "record_id": "string"
    }]
  },
  "genealogy": {
    "parent_batch": "string",
    "derived_samples": ["string"]
  },
  "qc_status": {
    "checkpoints_passed": "number",
    "checkpoints_total": "number",
    "status": "pass|fail|pending"
  }
}
```
