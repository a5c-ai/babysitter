---
name: materials-database-querier
description: Materials database query skill for accessing structure and property data from multiple repositories
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: nanotechnology
  domain: science
  category: computational
  priority: high
  phase: 6
  tools-libraries:
    - pymatgen
    - Materials Project API
    - AFLOW REST API
---

# Materials Database Querier

## Purpose

The Materials Database Querier skill provides unified access to multiple materials databases for structure and property retrieval, enabling comprehensive materials search and data aggregation across repositories.

## Capabilities

- Materials Project API integration
- AFLOW database queries
- ICSD/CSD structure retrieval
- NOMAD repository access
- Cross-database searches
- Property aggregation and comparison

## Usage Guidelines

### Database Query Workflow

1. **Query Design**
   - Define search criteria
   - Select target databases
   - Set property filters

2. **Data Retrieval**
   - Execute queries
   - Handle pagination
   - Aggregate results

3. **Data Processing**
   - Standardize formats
   - Compare across sources
   - Export for analysis

## Process Integration

- Machine Learning Materials Discovery Pipeline
- DFT Calculation Pipeline for Nanomaterials
- Structure-Property Correlation Analysis

## Input Schema

```json
{
  "query_type": "composition|structure|property",
  "databases": ["materials_project", "aflow", "icsd"],
  "criteria": {
    "elements": ["string"],
    "property_range": {"property": "string", "min": "number", "max": "number"}
  },
  "limit": "number"
}
```

## Output Schema

```json
{
  "materials": [{
    "id": "string",
    "formula": "string",
    "structure_file": "string",
    "properties": {
      "bandgap": "number",
      "formation_energy": "number"
    },
    "source": "string"
  }],
  "total_found": "number",
  "query_metadata": {
    "databases_searched": ["string"],
    "query_time": "number"
  }
}
```
