---
name: portfolio-optimization
description: Optimize project portfolio selection under constraints using mathematical optimization
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: project-management
  domain: business
  category: Portfolio Management
  id: SK-013
---

# Portfolio Optimization

## Overview

The Portfolio Optimization skill applies mathematical optimization techniques to project portfolio selection and balancing. It maximizes portfolio value while respecting budget, resource, and strategic constraints, enabling data-driven investment decisions.

## Capabilities

### Optimization Methods
- Apply constraint-based optimization (budget, resources)
- Calculate efficient frontier for risk-return tradeoff
- Support integer programming for project selection
- Model dependency constraints between projects
- Handle mutually exclusive project alternatives

### Multi-Criteria Analysis
- Support multi-criteria project scoring
- Apply weighted scoring models
- Perform pairwise comparison (AHP)
- Normalize heterogeneous criteria
- Calculate composite portfolio scores

### Scenario Analysis
- Perform scenario analysis on portfolio
- Calculate portfolio-level NPV and risk
- Identify project interdependencies
- Generate what-if analysis for portfolio changes
- Model constraint relaxation impacts

### Portfolio Balancing
- Support dynamic portfolio rebalancing
- Optimize resource allocation across projects
- Balance strategic alignment dimensions
- Model risk diversification
- Track portfolio composition metrics

## Usage

### Input Requirements
- Project candidates with attributes
- Scoring criteria and weights
- Constraint definitions (budget, resources)
- Strategic alignment factors
- Project dependencies and exclusions

### Output Deliverables
- Optimized portfolio selection
- Efficient frontier visualization
- Constraint analysis report
- Scenario comparison results
- Portfolio balance scorecard

### Example Use Cases
1. **Annual Planning**: Optimize project selection for budget
2. **Portfolio Review**: Rebalance in-flight portfolio
3. **Strategic Alignment**: Maximize strategic value
4. **Resource Planning**: Optimize under resource constraints

## Process Integration

This skill integrates with the following processes:
- portfolio-prioritization.js
- Resource Planning and Allocation
- benefits-realization.js
- Business Case Development

## Dependencies

- Optimization algorithms (linear, integer programming)
- Constraint solvers
- Financial models
- Visualization libraries

## Related Skills

- SK-009: NPV/IRR Calculator
- SK-011: Benefits Tracking Dashboard
- SK-019: Dependency Mapper
