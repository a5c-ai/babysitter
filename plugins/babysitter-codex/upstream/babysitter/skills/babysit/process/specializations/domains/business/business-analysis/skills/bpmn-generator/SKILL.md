---
name: bpmn-generator
description: Generate and validate BPMN 2.0 diagrams from process descriptions
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: business-analysis
  domain: business
  id: SK-002
  category: Process Modeling
---

# BPMN Diagram Generator

## Overview

The BPMN Diagram Generator skill provides specialized capabilities for creating, validating, and exporting BPMN 2.0 (Business Process Model and Notation) compliant process diagrams. This skill enables transformation of natural language process descriptions into standardized process models that can be used across various process modeling tools.

## Capabilities

### BPMN 2.0 Generation
- Generate BPMN 2.0 compliant XML from natural language process descriptions
- Create properly structured process diagrams with correct notation
- Support all BPMN 2.0 element types (activities, events, gateways, flows)
- Generate collaboration diagrams with multiple pools and lanes

### Notation Validation
- Validate BPMN notation correctness against specification
- Check for proper use of start/end events
- Verify gateway logic and flow completeness
- Identify unreachable activities or incomplete paths

### Swimlane Layout
- Create swimlane layouts automatically based on participant roles
- Organize activities by responsible parties
- Handle cross-lane message flows
- Optimize layout for readability

### Gap Identification
- Identify missing gateways in decision points
- Flag missing events (start, end, intermediate)
- Detect incomplete or disconnected flows
- Highlight activities without clear inputs/outputs

### AS-IS to TO-BE Comparison
- Generate side-by-side comparison views
- Highlight differences between current and future states
- Track process improvement changes
- Calculate process metric differences

### Multi-Format Export
- Export to SVG for web display
- Export to PNG for documentation
- Export to BPMN XML for tool import
- Generate Markdown representations for documentation

### Tool Integration
- Integrate with Camunda process engine format
- Support Bizagi file format
- Compatible with Signavio exports
- Support for draw.io BPMN diagrams

## Usage

### Generate BPMN from Description
```
Generate a BPMN 2.0 diagram for the following process:
[Process description in natural language]

Include swimlanes for each role mentioned and proper gateway notation.
```

### Validate Existing BPMN
```
Validate this BPMN diagram for compliance:
[BPMN XML content]

Check for notation correctness and process completeness.
```

### AS-IS to TO-BE Comparison
```
Compare the AS-IS and TO-BE processes:

AS-IS: [Current process description]
TO-BE: [Future process description]

Generate comparison view highlighting improvements.
```

## Process Integration

This skill integrates with the following business analysis processes:
- bpmn-process-modeling.js - Core BPMN modeling activities
- sipoc-process-definition.js - Process boundary definition
- value-stream-mapping.js - Process flow visualization
- process-gap-analysis.js - Current vs future state comparison

## Dependencies

- BPMN 2.0 specification library
- Diagram rendering capabilities
- XML generation and validation
- Layout algorithms for swimlane optimization

## BPMN 2.0 Elements Reference

### Flow Objects
- **Events**: Start, Intermediate, End (Message, Timer, Error, Signal, etc.)
- **Activities**: Task, Sub-Process, Call Activity
- **Gateways**: Exclusive, Inclusive, Parallel, Event-Based, Complex

### Connecting Objects
- **Sequence Flows**: Connect flow objects within a pool
- **Message Flows**: Connect objects between pools
- **Associations**: Connect artifacts to flow objects

### Swimlanes
- **Pools**: Represent participants/organizations
- **Lanes**: Subdivisions within pools for roles/departments

### Artifacts
- **Data Objects**: Information flowing through process
- **Groups**: Visual grouping of elements
- **Annotations**: Additional explanatory text
