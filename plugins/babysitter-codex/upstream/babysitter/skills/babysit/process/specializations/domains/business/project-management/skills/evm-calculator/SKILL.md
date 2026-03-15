---
name: evm-calculator
description: Automated calculation of all earned value metrics and forecasts
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: project-management
  domain: business
  category: Earned Value Management
  id: SK-004
---

# EVM Calculator

## Overview

The EVM Calculator skill provides comprehensive automated calculation of all Earned Value Management metrics, indices, and forecasts. It supports PMI PMBOK and ANSI/EIA-748 compliant calculations for project cost and schedule performance measurement and forecasting.

## Capabilities

### Core EVM Metrics
- Calculate Planned Value (PV/BCWS)
- Calculate Earned Value (EV/BCWP)
- Calculate Actual Cost (AC/ACWP)
- Calculate Schedule Variance (SV) and Cost Variance (CV)
- Calculate SV% and CV% for normalized comparison

### Performance Indices
- Calculate Schedule Performance Index (SPI)
- Calculate Cost Performance Index (CPI)
- Calculate Critical Ratio (CR = SPI x CPI)
- Calculate TCPI (To-Complete Performance Index)
- Support both BAC-based and EAC-based TCPI

### Forecasting
- Calculate EAC using multiple methods:
  - EAC = BAC / CPI (typical performance)
  - EAC = AC + (BAC - EV) (atypical performance)
  - EAC = AC + [(BAC - EV) / (SPI x CPI)] (combined)
  - EAC = Bottom-up re-estimate
- Calculate ETC (Estimate to Complete)
- Calculate VAC (Variance at Completion)

### Visualization and Trending
- Generate S-curve visualizations
- Perform trend analysis on indices
- Create performance dashboards
- Generate variance analysis reports
- Produce management reserve tracking

## Usage

### Input Requirements
- Budget baseline (time-phased BAC)
- Progress data (percent complete or physical measurement)
- Actual cost data by period
- Work Breakdown Structure alignment
- Optional: Management reserve allocation

### Output Deliverables
- Complete EVM metrics table
- Performance indices with trends
- Forecasts (EAC, ETC, VAC)
- S-curve visualization
- Variance analysis narrative

### Example Use Cases
1. **Monthly Reporting**: Calculate all EVM metrics for status reports
2. **Forecasting**: Generate EAC using appropriate method
3. **Trend Analysis**: Track SPI/CPI trends over time
4. **Corrective Action**: Identify and analyze variances

## Process Integration

This skill integrates with the following processes:
- earned-value-management.js
- budget-development.js
- portfolio-prioritization.js
- Status Reporting and Communication Management

## Dependencies

- Financial calculation libraries
- Time series analysis utilities
- Visualization libraries
- Data aggregation algorithms

## Related Skills

- SK-001: Gantt Chart Generator
- SK-009: NPV/IRR Calculator
- SK-011: Benefits Tracking Dashboard
