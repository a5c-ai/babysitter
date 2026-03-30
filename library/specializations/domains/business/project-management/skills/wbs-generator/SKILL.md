---
name: wbs-generator
description: Generate and validate Work Breakdown Structures with automated decomposition
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: project-management
  domain: business
  category: Scope Management
  id: SK-007
---

# WBS Generator

## Overview

The WBS Generator skill creates and validates Work Breakdown Structures (WBS) for projects. It applies decomposition principles to break down project scope into manageable work packages, generates WBS dictionaries, and ensures completeness through validation rules.

## Capabilities

### WBS Creation
- Create hierarchical WBS from scope statements
- Apply decomposition rules (8/80 rule)
- Support deliverable-oriented and phase-oriented structures
- Generate control accounts from WBS elements
- Create work package definitions

### WBS Dictionary
- Generate WBS dictionaries with element descriptions
- Define acceptance criteria per work package
- Link WBS elements to schedule activities
- Assign responsible parties
- Document assumptions and constraints

### Validation
- Validate WBS completeness (100% rule)
- Check decomposition consistency
- Verify work package sizing rules
- Identify gaps and overlaps
- Review element naming conventions

### Export and Formatting
- Create WBS numbering schemes
- Export to multiple formats (outline, tree diagram, table)
- Generate visual WBS diagrams
- Support rolling wave planning updates
- Integrate with schedule tools

## Usage

### Input Requirements
- Project scope statement
- Deliverables list
- Project life cycle definition
- Organizational standards/templates
- Subject matter expert input

### Output Deliverables
- Hierarchical WBS structure
- WBS dictionary
- WBS diagram (graphical)
- Control account definitions
- Work package descriptions

### Example Use Cases
1. **Project Planning**: Create initial WBS from scope
2. **Scope Refinement**: Decompose planning packages
3. **Cost Estimation**: Provide WBS for bottom-up estimating
4. **Control Setup**: Define control accounts for EVM

## Process Integration

This skill integrates with the following processes:
- Work Breakdown Structure (WBS) Development
- budget-development.js
- earned-value-management.js
- Resource Planning and Allocation

## Dependencies

- Tree data structures
- Decomposition algorithms
- Visualization libraries
- Document formatting utilities

## Related Skills

- SK-001: Gantt Chart Generator
- SK-004: EVM Calculator
- SK-017: Project Charter Generator
