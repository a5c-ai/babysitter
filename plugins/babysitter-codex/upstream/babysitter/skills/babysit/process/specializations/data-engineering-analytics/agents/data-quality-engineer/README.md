# Data Quality Engineer Agent

An autonomous AI agent specialized in data quality management, monitoring, anomaly detection, and remediation for data engineering workflows.

## Overview

The Data Quality Engineer Agent is your expert partner for ensuring data quality across your data platform. It assesses quality dimensions, creates testing suites, detects anomalies, investigates issues, and recommends improvements to maintain trustworthy data.

## Quick Start

```bash
# Assess data quality
/agent data-quality-engineer "Assess the quality of our customer data"

# Investigate an anomaly
/agent data-quality-engineer "Revenue dropped 30% yesterday, investigate"

# Create quality tests
/agent data-quality-engineer "Create comprehensive tests for the orders table"
```

## What This Agent Does

### Core Capabilities

| Task | Example |
|------|---------|
| **Quality Assessment** | Evaluate data across six dimensions |
| **Test Creation** | Build dbt tests, Great Expectations suites |
| **Anomaly Detection** | Identify data drift and outliers |
| **Root Cause Analysis** | Investigate quality issues |
| **Remediation Planning** | Design fixes for problems |
| **Dashboard Creation** | Build quality monitoring dashboards |
| **SLA Monitoring** | Track data freshness and quality SLAs |

### Quality Dimensions

The agent evaluates data quality across six core dimensions:

| Dimension | What It Measures | Example Checks |
|-----------|-----------------|----------------|
| **Completeness** | Is all required data present? | Null rates, missing records |
| **Accuracy** | Does data reflect reality? | Value verification |
| **Consistency** | Is data uniform? | Cross-table checks |
| **Validity** | Does data conform to rules? | Format, type, range |
| **Timeliness** | Is data fresh enough? | Freshness SLAs |
| **Uniqueness** | Are there duplicates? | Key uniqueness |

## Example Interactions

### Quality Assessment

You: "Assess the quality of our sales data"

Agent provides:
```
## Sales Data Quality Report

Overall Score: 82/100 (B)

| Dimension | Score | Status |
|-----------|-------|--------|
| Completeness | 95 | Excellent |
| Accuracy | 78 | Good |
| Consistency | 72 | Needs Work |
| Validity | 85 | Good |
| Timeliness | 98 | Excellent |
| Uniqueness | 88 | Good |

Top Issues:
1. 22% of product_category values don't match master list
2. 5% of transactions have mismatched totals
3. Order_source has inconsistent naming conventions

Recommended Actions:
1. Add validation for product_category at ingestion
2. Implement line item total reconciliation
3. Standardize order_source values
```

### Anomaly Investigation

You: "Our customer count dropped 20% in yesterday's report"

Agent investigates:
```
## Anomaly Investigation

### Finding: False Alert - Data Issue

Timeline Analysis:
- Previous day: 1,245,678 customers
- Reported: 996,542 customers
- Delta: -249,136 (20% drop)

Root Cause:
The customer deduplication job ran with incorrect parameters,
over-merging customers with similar names.

Evidence:
- Merge logs show 3x normal merge rate
- No corresponding drop in transactions
- Customer names with common surnames over-merged

Impact Assessment:
- Analytics dashboards affected
- No impact on transactional systems
- Reporting accuracy compromised

Recommended Actions:
1. IMMEDIATE: Rollback customer table to pre-job snapshot
2. SHORT-TERM: Fix deduplication parameters
3. LONG-TERM: Add merge rate anomaly detection
```

### Creating Quality Tests

You: "Create comprehensive tests for our payment transactions"

Agent creates:
```yaml
# dbt schema.yml
models:
  - name: fct_payments
    description: Payment transactions fact table
    tests:
      - dbt_utils.recency:
          datepart: hour
          field: processed_at
          interval: 4
    columns:
      - name: payment_id
        tests:
          - unique
          - not_null
      - name: amount
        tests:
          - not_null
          - dbt_utils.expression_is_true:
              expression: "> 0"
      - name: currency
        tests:
          - not_null
          - accepted_values:
              values: ['USD', 'EUR', 'GBP', 'CAD']
      - name: status
        tests:
          - not_null
          - accepted_values:
              values: ['pending', 'completed', 'failed', 'refunded']
      - name: customer_id
        tests:
          - not_null
          - relationships:
              to: ref('dim_customers')
              field: customer_id
```

```python
# Great Expectations suite
expectations = [
    expect_table_row_count_to_be_between(min=1000),
    expect_column_sum_to_be_between(
        column='amount',
        min_value=0
    ),
    expect_column_pair_values_A_to_be_greater_than_B(
        column_A='gross_amount',
        column_B='net_amount'
    ),
    expect_column_values_to_match_regex(
        column='payment_id',
        regex='^PAY-[A-Z0-9]{12}$'
    )
]
```

## Personality and Approach

### Working Style

- **Thorough**: Investigates all potential causes
- **Risk-aware**: Prioritizes by business impact
- **Evidence-based**: Backs findings with data
- **Proactive**: Identifies issues before impact

### Communication

- Clear severity ratings
- Business context for technical issues
- Actionable recommendations
- Root cause explanations

## Decision Authority

### What the Agent Can Do Independently

- Create quality rules and tests
- Configure alert thresholds
- Generate quality reports
- Investigate anomalies
- Document findings
- Recommend fixes
- Update dashboards

### What Requires Your Approval

- Blocking pipelines on failures
- Correcting data
- Modifying SLAs
- Changing escalation paths
- Implementing production gates

## Quality Testing Framework

### Testing Pyramid

```
           /\
          /E2E\        End-to-end data validation
         /----\
        /      \
       /Business\     Business rule checks
      / Rules   \
     /----------\
    /            \
   /  Structural  \   Schema, types, constraints
  /--------------\
 /                \
/ Row-Level Tests  \  Nulls, uniqueness, ranges
------------------
```

### Test Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| Schema | Structure validation | Column exists, types match |
| Completeness | Required data present | Not null, row counts |
| Validity | Correct values | Ranges, formats, lookups |
| Consistency | Cross-data agreement | Referential integrity |
| Timeliness | Data freshness | Source freshness, recency |
| Business | Domain rules | Calculated fields, totals |

## Integration

### Related Skills

| Skill | How It's Used |
|-------|--------------|
| Data Quality Profiler | Profile data for assessment |
| dbt Project Analyzer | Assess test coverage |
| Data Lineage Mapper | Trace quality issues upstream |

### MCP Servers

```json
{
  "mcpServers": {
    "elementary": {
      "command": "python",
      "args": ["-m", "elementary_mcp_server"]
    }
  }
}
```

## Common Tasks

### 1. Initial Quality Assessment

```
"Assess the quality of all tables in our analytics schema"
```

Agent will:
1. Profile all tables
2. Score each quality dimension
3. Identify critical issues
4. Prioritize remediation
5. Create action plan

### 2. Quality Monitoring Setup

```
"Set up quality monitoring for our data warehouse"
```

Agent will:
1. Define quality KPIs
2. Create test suites
3. Configure alerts
4. Build dashboard
5. Document SLAs

### 3. Incident Investigation

```
"Investigate why our daily report shows wrong numbers"
```

Agent will:
1. Identify affected data
2. Trace issue source
3. Determine root cause
4. Assess impact
5. Recommend fix

### 4. Test Coverage Improvement

```
"Improve test coverage for our core models"
```

Agent will:
1. Analyze current coverage
2. Identify gaps
3. Create missing tests
4. Prioritize by risk
5. Document new tests

## SLA Framework

### Data Tiers

| Tier | Description | Freshness | Quality |
|------|-------------|-----------|---------|
| **Tier 1** | Business critical | < 1 hour | > 99% |
| **Tier 2** | Standard ops | < 4 hours | > 95% |
| **Tier 3** | Informational | < 24 hours | > 90% |

### Alert Severity

| Level | Response Time | Example |
|-------|---------------|---------|
| Critical | 15 minutes | Production data loss |
| High | 1 hour | Major quality degradation |
| Medium | 4 hours | SLA breach risk |
| Low | Next business day | Minor inconsistencies |

## Best Practices

### Quality-First Development

1. Define quality requirements before development
2. Implement tests alongside transformations
3. Monitor quality continuously
4. Fix issues at the source
5. Document quality expectations

### Testing Strategy

- Test at ingestion (catch issues early)
- Test after transformation (verify logic)
- Test before consumption (ensure usability)
- Test continuously (detect drift)

## Troubleshooting

### Common Issues

**Test Failures**

Agent approach:
1. Analyze failure pattern
2. Check if data or test issue
3. Investigate root cause
4. Recommend fix

**Anomaly Alerts**

Agent approach:
1. Verify anomaly is real
2. Check business calendar
3. Investigate data sources
4. Determine if action needed

**Quality Score Drops**

Agent approach:
1. Identify affected dimensions
2. Find contributing factors
3. Prioritize fixes
4. Track improvement

## References

- [DAMA Data Management Body of Knowledge](https://www.dama.org/cpages/body-of-knowledge)
- [Great Expectations Documentation](https://docs.greatexpectations.io/)
- [Elementary Data](https://docs.elementary-data.com/)
- [Data Quality Fundamentals](https://www.oreilly.com/library/view/data-quality-fundamentals/9781098112035/)

## Version

- **Current Version**: 1.0.0
- **Agent ID**: AG-DEA-003
- **Category**: Data Quality
