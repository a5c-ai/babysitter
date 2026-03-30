---
name: media-mix-modeling
description: Advanced econometric modeling for marketing effectiveness and budget optimization
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: marketing
  domain: business
  category: Marketing Analytics
  skill-id: SK-019
---

# Media Mix Modeling Skill

## Overview

The Media Mix Modeling Skill provides advanced econometric modeling capabilities for measuring marketing effectiveness and optimizing budget allocation. This skill enables marketing mix model development, channel contribution analysis, saturation curve modeling, and scenario planning using statistical techniques and machine learning approaches including Google Lightweight MMM and custom Python/R implementations.

## Capabilities

### Marketing Mix Model Development
- Bayesian model specification
- Frequentist regression modeling
- Time series decomposition
- Variable selection and feature engineering
- Model training and validation
- Holdout testing and backtesting
- Model diagnostics and validation
- Documentation and reproducibility

### Channel Contribution Analysis
- Base vs. incremental decomposition
- Channel-level contribution calculation
- Marginal contribution analysis
- Diminishing returns identification
- Channel interaction effects
- Year-over-year contribution comparison
- Share of contribution trending
- Contribution waterfall visualization

### Saturation Curve Modeling
- Diminishing returns function fitting
- Hill function parameterization
- S-curve response modeling
- Optimal spend level identification
- Saturation point calculation
- Response curve visualization
- Per-channel curve comparison
- Confidence interval estimation

### Adstock/Carryover Effects
- Adstock decay estimation
- Carryover rate calculation
- Geometric decay modeling
- Weibull decay functions
- Peak lag identification
- Effective frequency calculation
- Media half-life analysis
- Long-term effect quantification

### Budget Optimization Algorithms
- Constrained optimization
- Marginal ROI maximization
- Budget allocation simulation
- Channel mix optimization
- Spend threshold identification
- Diminishing returns avoidance
- Cross-channel trade-off analysis
- Multi-objective optimization

### Scenario Planning
- What-if budget scenarios
- Channel reallocation modeling
- Seasonal budget planning
- New channel introduction simulation
- Budget cut impact analysis
- Growth scenario modeling
- Competitive response scenarios
- Economic downturn planning

### Incremental Lift Calculation
- Incremental revenue estimation
- Lift over baseline calculation
- Test vs. control comparison
- Geo-matched market testing
- Synthetic control methods
- Causal impact analysis
- Incrementality confidence intervals
- Attribution vs. incrementality reconciliation

### Cross-Channel Synergy Analysis
- Interaction term modeling
- Synergy effect quantification
- Complementary channel identification
- Cannibalization detection
- Optimal channel combination
- Sequencing effect analysis
- Cross-media amplification
- Halo effect measurement

### Seasonality Adjustment
- Seasonal pattern identification
- Holiday effect modeling
- Trend decomposition
- Cyclical pattern adjustment
- Weather impact incorporation
- Event-based adjustment
- Calendar normalization
- Forecast seasonality application

## Process Integration

This skill integrates with the following marketing processes:

- **marketing-roi-analysis.js** - ROI calculation and budget optimization
- **attribution-modeling-setup.js** - Attribution model calibration
- **integrated-campaign-planning.js** - Budget allocation and planning

## Dependencies

- Python data science libraries (pandas, numpy, scipy, statsmodels)
- Google Lightweight MMM / Robyn
- R statistical libraries
- Bayesian modeling frameworks (PyMC, Stan)
- Optimization libraries (scipy.optimize, cvxpy)
- Visualization libraries (matplotlib, plotly)

## Usage

### Model Development

```yaml
skill: media-mix-modeling
action: build-model
parameters:
  model_type: bayesian_mmm
  framework: lightweight_mmm
  data_configuration:
    date_column: week
    target_variable: revenue
    media_variables:
      - tv_spend
      - digital_display_spend
      - paid_search_spend
      - paid_social_spend
      - radio_spend
    control_variables:
      - price_index
      - competitor_spend
      - economic_indicator
      - seasonality_index
  model_settings:
    adstock:
      type: geometric
      max_lag: 8
    saturation:
      type: hill
    priors:
      type: informative
      source: prior_mmm_results
  validation:
    holdout_weeks: 12
    cross_validation_folds: 5
```

### Channel Contribution Analysis

```yaml
skill: media-mix-modeling
action: analyze-contributions
parameters:
  model_id: "mmm_2024_q4"
  analysis_period:
    start_date: "2024-01-01"
    end_date: "2024-12-31"
  outputs:
    - type: contribution_breakdown
      format: waterfall_chart
    - type: channel_roi
      format: bar_chart
    - type: contribution_over_time
      format: stacked_area
    - type: marginal_contribution
      format: line_chart
  export:
    format: [pdf, csv, xlsx]
    destination: "reports/mmm_contributions"
```

### Budget Optimization

```yaml
skill: media-mix-modeling
action: optimize-budget
parameters:
  model_id: "mmm_2024_q4"
  optimization_settings:
    objective: maximize_revenue
    total_budget: 10000000
    constraints:
      - channel: tv_spend
        min_percent: 0.20
        max_percent: 0.40
      - channel: paid_search_spend
        min_percent: 0.15
        max_percent: 0.30
      - channel: paid_social_spend
        min_percent: 0.10
        max_percent: 0.25
    business_rules:
      - type: minimum_presence
        channels: [tv, digital_display]
      - type: maximum_concentration
        single_channel_cap: 0.50
  scenarios:
    - name: "optimal_allocation"
      constraints: default
    - name: "digital_first"
      overrides:
        digital_channels_min: 0.60
    - name: "brand_building"
      overrides:
        tv_min: 0.35
```

### Scenario Planning

```yaml
skill: media-mix-modeling
action: run-scenarios
parameters:
  model_id: "mmm_2024_q4"
  scenarios:
    - name: "Budget Cut 20%"
      budget_change: -0.20
      allocation: optimized
    - name: "Budget Increase 30%"
      budget_change: 0.30
      allocation: optimized
    - name: "TV Elimination"
      channel_changes:
        tv_spend: 0
      reallocate: true
    - name: "New Channel Test"
      new_channels:
        - name: connected_tv
          estimated_roi: 2.5
          test_budget: 500000
    - name: "Q1 Seasonal Plan"
      period: "2025-01-01 to 2025-03-31"
      seasonality_adjustment: true
  comparison_metrics:
    - total_revenue
    - incremental_revenue
    - overall_roi
    - channel_roi
```

### Saturation Analysis

```yaml
skill: media-mix-modeling
action: analyze-saturation
parameters:
  model_id: "mmm_2024_q4"
  channels:
    - tv_spend
    - paid_search_spend
    - paid_social_spend
  analysis:
    - type: response_curves
      spend_range: [0, 2x_current]
      granularity: 100_points
    - type: optimal_spend
      threshold: 0.95_saturation
    - type: marginal_roi_curve
      spend_range: [0.5x_current, 1.5x_current]
  visualization:
    charts:
      - response_curves_overlay
      - marginal_roi_comparison
      - saturation_heatmap
```

## Best Practices

1. **Data Quality**: Ensure sufficient historical data (2+ years recommended)
2. **Variable Selection**: Include relevant control variables (pricing, competition, economy)
3. **Model Validation**: Use holdout periods and cross-validation
4. **Uncertainty Quantification**: Report confidence intervals, not just point estimates
5. **Regular Refresh**: Update models quarterly with new data
6. **Triangulation**: Validate MMM results with experiments where possible
7. **Stakeholder Communication**: Present results in business-friendly formats
8. **Documentation**: Maintain model documentation and assumptions log

## Related Skills

- SK-005: Marketing Analytics Platform
- SK-014: BI and Dashboard Platform
- SK-018: CRM Integration

## Related Agents

- AG-008: Marketing Analytics Director
- AG-012: Media Planning Expert
