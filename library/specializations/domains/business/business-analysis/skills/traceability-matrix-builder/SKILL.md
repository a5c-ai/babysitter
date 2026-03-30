---
name: traceability-matrix-builder
description: Build and maintain requirements traceability matrices with bidirectional links and coverage analysis
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: business-analysis
  domain: business
  id: SK-007
  category: Requirements Management
---

# Traceability Matrix Builder

## Overview

The Traceability Matrix Builder skill provides specialized capabilities for creating and maintaining requirements traceability matrices (RTM). This skill enables bidirectional traceability from business requirements through design, implementation, and testing, ensuring complete coverage and impact analysis capabilities.

## Capabilities

### Bidirectional Traceability Links
- Create bidirectional traceability links
- Link requirements forward to design and implementation
- Link requirements backward to business objectives
- Support multiple link types (derives, satisfies, verifies)

### Orphan Requirement Detection
- Detect orphan requirements with no forward links
- Identify requirements with no backward links
- Flag incomplete traceability chains
- Generate orphan reports with remediation guidance

### Coverage Percentage Calculation
- Calculate forward coverage percentages
- Calculate backward coverage percentages
- Measure test coverage by requirement
- Generate coverage dashboards

### Traceability Reports
- Generate comprehensive traceability reports
- Create requirement-to-test case mappings
- Produce coverage summary reports
- Export compliance documentation

### Requirement Change Impact Tracking
- Track requirement changes and impact
- Identify affected downstream artifacts
- Calculate change impact radius
- Generate impact assessment reports

### Network Diagram Visualization
- Visualize traceability as network diagrams
- Show requirement relationships graphically
- Highlight orphans and gaps visually
- Create interactive traceability views

### Tool Export
- Export to Jira requirements format
- Export to Azure DevOps work items
- Generate CSV for import tools
- Create XML interchange formats

## Usage

### Create Traceability Matrix
```
Create a traceability matrix for these requirements:
[Requirements list with IDs]

Link to these artifacts:
- Design elements: [List]
- Test cases: [List]
```

### Calculate Coverage
```
Calculate traceability coverage for this project:
[Requirements list]
[Test cases list]

Report coverage percentages and identify gaps.
```

### Impact Analysis
```
Analyze the impact of changing this requirement:
[Requirement details]

Identify all affected artifacts and stakeholders.
```

### Generate Report
```
Generate a traceability report for stakeholder review:
[Project scope]

Include coverage metrics and orphan analysis.
```

## Process Integration

This skill integrates with the following business analysis processes:
- requirements-traceability.js - Core traceability management
- brd-creation.js - Requirements documentation
- uat-planning.js - Test case traceability
- solution-performance-assessment.js - Requirements fulfillment tracking

## Dependencies

- Requirements data structures
- Link management algorithms
- Export format generators
- Visualization libraries

## Traceability Frameworks Reference

### Traceability Link Types
| Link Type | Direction | Description |
|-----------|-----------|-------------|
| Derives | Forward | Requirement derives design element |
| Satisfies | Forward | Implementation satisfies requirement |
| Verifies | Forward | Test case verifies requirement |
| Traces To | Bidirectional | General relationship |
| Depends On | Backward | Requirement depends on business objective |
| Refines | Forward | Detailed requirement refines parent |

### Traceability Levels
```
Business Objective
    |
    v
Business Requirement (BRD)
    |
    v
Functional Requirement (SRS)
    |
    v
Design Element (Design Doc)
    |
    v
Implementation (Code Module)
    |
    v
Test Case (Test Plan)
```

### Coverage Metrics
| Metric | Formula | Target |
|--------|---------|--------|
| Forward Coverage | Linked Requirements / Total Requirements | 100% |
| Test Coverage | Requirements with Tests / Total Requirements | 100% |
| Backward Coverage | Requirements with Business Links / Total | 100% |

### RTM Standard Columns
| Column | Description |
|--------|-------------|
| Req ID | Unique requirement identifier |
| Req Description | Brief requirement summary |
| Business Objective | Linked business goal |
| Design Reference | Design document/element |
| Code Module | Implementation reference |
| Test Case ID | Linked test case(s) |
| Status | Current requirement status |
| Priority | Requirement priority |

### Orphan Types
1. **No Parent**: Missing backward traceability
2. **No Child**: Missing forward traceability
3. **No Test**: Missing verification traceability
4. **Isolated**: No links in either direction
