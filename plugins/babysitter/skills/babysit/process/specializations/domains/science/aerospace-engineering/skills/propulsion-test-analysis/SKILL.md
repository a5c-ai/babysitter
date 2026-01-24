---
name: propulsion-test-analysis
description: Skill for propulsion system ground test data acquisition and analysis
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - WebFetch
  - WebSearch
  - Bash
metadata:
  version: "1.0"
  category: aerospace-engineering
  tags:
    - propulsion
    - testing
    - data-acquisition
    - validation
---

# Propulsion Test Data Analysis Skill

## Purpose
Support propulsion system ground testing through comprehensive data acquisition configuration, real-time analysis, and test-to-prediction correlation.

## Capabilities
- Test cell instrumentation configuration
- Data acquisition system setup
- Real-time performance calculation
- Test-to-prediction correlation
- Thrust stand calibration verification
- Measurement uncertainty analysis
- Test matrix optimization
- Health monitoring parameter tracking

## Usage Guidelines
- Verify instrumentation calibration before each test campaign
- Define clear success criteria and abort conditions
- Monitor critical parameters in real-time during testing
- Apply appropriate measurement corrections and uncertainty propagation
- Correlate test results with analytical predictions
- Document all test conditions, anomalies, and lessons learned

## Dependencies
- LabVIEW
- MATLAB
- Data acquisition systems
- Test cell control systems

## Process Integration
- AE-006: Propulsion System Testing
