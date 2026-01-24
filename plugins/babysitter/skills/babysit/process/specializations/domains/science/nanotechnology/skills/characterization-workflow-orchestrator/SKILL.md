---
name: characterization-workflow-orchestrator
description: Workflow automation skill for orchestrating multi-technique characterization sequences
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
    - Workflow engines
    - Instrument integration APIs
---

# Characterization Workflow Orchestrator

## Purpose

The Characterization Workflow Orchestrator skill provides automated coordination of multi-technique characterization campaigns, enabling efficient sample throughput, data correlation, and comprehensive reporting.

## Capabilities

- Characterization sequence planning
- Sample routing optimization
- Data aggregation and correlation
- Report generation
- Quality gate enforcement
- Instrument scheduling

## Usage Guidelines

### Workflow Orchestration

1. **Sequence Planning**
   - Define required techniques
   - Order for sample compatibility
   - Allocate instrument time

2. **Execution Management**
   - Track sample progress
   - Handle technique failures
   - Route to next steps

3. **Data Integration**
   - Aggregate results
   - Correlate across techniques
   - Generate reports

## Process Integration

- Multi-Modal Nanomaterial Characterization Pipeline
- Structure-Property Correlation Analysis

## Input Schema

```json
{
  "sample_id": "string",
  "characterization_goals": ["size", "composition", "structure", "surface"],
  "techniques_required": ["TEM", "XRD", "XPS", "DLS"],
  "priority": "routine|urgent",
  "turnaround_target": "number (days)"
}
```

## Output Schema

```json
{
  "workflow": {
    "id": "string",
    "status": "planned|in_progress|completed",
    "sequence": [{
      "step": "number",
      "technique": "string",
      "instrument": "string",
      "scheduled_time": "string"
    }]
  },
  "progress": {
    "completed": "number",
    "total": "number",
    "current_step": "string"
  },
  "integrated_results": {
    "summary": "string",
    "data_files": ["string"],
    "quality_metrics": {}
  },
  "report_path": "string"
}
```
