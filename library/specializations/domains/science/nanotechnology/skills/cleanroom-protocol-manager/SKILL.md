---
name: cleanroom-protocol-manager
description: Cleanroom operations skill for managing protocols, contamination control, and process flows
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
    - Cleanroom management systems
    - Protocol databases
---

# Cleanroom Protocol Manager

## Purpose

The Cleanroom Protocol Manager skill provides comprehensive management of cleanroom operations for nanofabrication, ensuring protocol compliance, contamination control, and efficient process flows.

## Capabilities

- Protocol version control
- Equipment qualification tracking
- Contamination monitoring
- Process flow documentation
- Training record management
- Maintenance scheduling

## Usage Guidelines

### Protocol Management

1. **Protocol Development**
   - Create step-by-step procedures
   - Define critical parameters
   - Include safety requirements

2. **Process Control**
   - Track process execution
   - Monitor contamination levels
   - Manage equipment status

3. **Documentation**
   - Maintain revision history
   - Track operator training
   - Generate reports

## Process Integration

- All fabrication processes
- Nanomaterial Scale-Up and Process Transfer

## Input Schema

```json
{
  "operation": "create_protocol|update_protocol|track_execution|query_status",
  "protocol_id": "string",
  "process_type": "lithography|deposition|etch|characterization",
  "cleanroom_class": "1|10|100|1000|10000"
}
```

## Output Schema

```json
{
  "protocol": {
    "id": "string",
    "version": "string",
    "status": "active|draft|deprecated",
    "steps": [{
      "step_number": "number",
      "description": "string",
      "equipment": "string",
      "parameters": {}
    }]
  },
  "execution_log": {
    "total_runs": "number",
    "success_rate": "number (%)",
    "last_run": "string"
  },
  "contamination_status": {
    "particle_count": "number",
    "classification_met": "boolean"
  }
}
```
