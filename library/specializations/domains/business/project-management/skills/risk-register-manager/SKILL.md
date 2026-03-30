---
name: risk-register-manager
description: Build and maintain comprehensive project risk registers with quantitative analysis
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: project-management
  domain: business
  category: Risk Management
  id: SK-006
---

# Risk Register Manager

## Overview

The Risk Register Manager skill provides comprehensive capabilities for identifying, analyzing, and tracking project risks. It supports both qualitative and quantitative risk analysis methods, including Monte Carlo simulation, and maintains risk response plans throughout the project lifecycle.

## Capabilities

### Risk Identification
- Create risk identification checklists by project type
- Support brainstorming and Delphi techniques
- Categorize risks by source and impact area
- Link risks to WBS elements and project phases
- Track risk triggers and warning signs

### Qualitative Analysis
- Calculate risk scores (probability x impact)
- Generate risk heat maps and bubble charts
- Prioritize risks using multiple criteria
- Assess urgency and manageability
- Create probability-impact matrices

### Quantitative Analysis
- Perform quantitative risk analysis
- Run Monte Carlo simulation for schedule/cost risk
- Calculate Expected Monetary Value (EMV)
- Determine decision tree analysis
- Model correlations between risks

### Response Planning and Tracking
- Track risk response plans and status
- Monitor residual and secondary risks
- Calculate contingency reserve requirements
- Generate risk reports for governance
- Automate risk review reminders

## Usage

### Input Requirements
- Project scope and WBS
- Risk identification input (interviews, checklists)
- Probability and impact scales
- Historical risk data (optional)
- Cost and schedule baseline for quantitative analysis

### Output Deliverables
- Risk register with scored risks
- Risk heat map visualization
- Monte Carlo analysis results
- Contingency reserve calculation
- Risk response tracking report

### Example Use Cases
1. **Project Planning**: Identify and analyze initial risks
2. **Risk Review**: Update risk status and scores
3. **Reserve Analysis**: Calculate required contingency
4. **Governance Reporting**: Generate risk dashboard

## Process Integration

This skill integrates with the following processes:
- Risk Planning and Assessment
- Risk Monitoring and Response Execution
- budget-development.js
- portfolio-prioritization.js

## Dependencies

- Probability analysis libraries
- Monte Carlo simulation engine
- Visualization libraries
- Risk database/repository

## Related Skills

- SK-004: EVM Calculator
- SK-009: NPV/IRR Calculator
- SK-019: Dependency Mapper
