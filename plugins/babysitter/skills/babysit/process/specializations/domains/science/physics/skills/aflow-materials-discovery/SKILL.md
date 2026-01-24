---
name: aflow-materials-discovery
description: AFLOW automatic materials discovery skill for high-throughput DFT calculations and materials database queries
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Task
metadata:
  version: "1.0"
  category: condensed-matter
  domain: physics
  tools:
    - AFLOW
    - aflow.py
    - Materials Project API
  processes:
    - density-functional-theory-calculations
    - material-synthesis-and-characterization
    - machine-learning-for-physics
---

# AFLOW Materials Discovery Skill

## Purpose

Provides AFLOW high-throughput materials discovery capabilities for systematic DFT calculations, database queries, and machine learning-driven materials screening.

## Capabilities

- **Database Queries**: Access AFLOW database via REST API for computed properties
- **Workflow Generation**: Create automatic calculation workflows for new materials
- **Thermodynamic Stability**: Analyze convex hulls and formation energies
- **Structure Generation**: Generate prototype structures from Pearson symbols
- **Descriptor Calculation**: Compute materials descriptors for ML models
- **ML Integration**: Interface with machine learning for property prediction

## Usage Guidelines

1. **Database Access**
   - Use AFLOW API for property queries
   - Search by composition, prototype, or properties
   - Download structure files in various formats
   - Access computed electronic and thermodynamic data

2. **Workflow Setup**
   - Configure AFLOW for systematic calculations
   - Set standard calculation parameters
   - Define convergence criteria
   - Enable automatic error handling

3. **Stability Analysis**
   - Construct compositional phase diagrams
   - Calculate formation energies
   - Identify stable and metastable phases
   - Predict synthesizability

4. **Machine Learning**
   - Calculate AFLOW-ML descriptors
   - Use pre-trained property predictors
   - Screen large chemical spaces
   - Validate predictions with DFT

5. **Best Practices**
   - Cite AFLOW database properly
   - Verify computed properties against experiment
   - Document search and filtering criteria
   - Consider DFT method limitations
