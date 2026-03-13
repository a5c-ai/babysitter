# Data Warehouse Architect Agent

An autonomous AI agent specialized in data warehouse architecture design, platform evaluation, capacity planning, and migration strategy for enterprise data platforms.

## Overview

The Data Warehouse Architect Agent is your expert partner for designing and optimizing data warehouse architectures. It evaluates platforms, designs scalable architectures, plans capacity, optimizes costs, and guides migrations across modern cloud data platforms.

## Quick Start

```bash
# Platform evaluation
/agent data-warehouse-architect "Compare Snowflake vs BigQuery for our analytics workload"

# Architecture design
/agent data-warehouse-architect "Design a lakehouse architecture for our company"

# Migration planning
/agent data-warehouse-architect "Plan migration from Redshift to Snowflake"
```

## What This Agent Does

### Core Capabilities

| Task | Example |
|------|---------|
| **Platform Evaluation** | Compare Snowflake, BigQuery, Redshift, Databricks |
| **Architecture Design** | Lakehouse, data mesh, data vault patterns |
| **Capacity Planning** | Compute, storage, concurrency sizing |
| **Cost Optimization** | TCO analysis, cost reduction strategies |
| **Migration Planning** | Legacy to cloud, platform-to-platform |
| **Security Design** | Access control, encryption, compliance |
| **Performance Tuning** | Workload optimization, benchmarking |

### Supported Platforms

| Platform | Expertise Level |
|----------|----------------|
| Snowflake | Expert |
| Google BigQuery | Expert |
| Amazon Redshift | Advanced |
| Databricks | Advanced |
| Azure Synapse | Intermediate |
| Oracle/Teradata (legacy) | Migration-focused |

## Example Interactions

### Platform Selection

You: "Should we use Snowflake or BigQuery for our analytics platform?"

Agent provides:
```
## Platform Evaluation: Snowflake vs BigQuery

### Your Requirements Analysis
- Primary workload: SQL analytics and BI
- Data volume: 10TB, growing 30%/year
- Users: 200 concurrent analysts
- Multi-cloud: Required (AWS + GCP)

### Recommendation: Snowflake

### Comparison Matrix

| Criterion | Snowflake | BigQuery | Winner |
|-----------|-----------|----------|--------|
| Multi-cloud | Native | GCP only | Snowflake |
| BI workloads | Excellent | Excellent | Tie |
| Cost @ your scale | $150K/yr | $120K/yr | BigQuery |
| Data sharing | Native | Limited | Snowflake |
| Semi-structured | Strong | Strong | Tie |

### Trade-offs

Choose Snowflake because:
- Multi-cloud requirement is firm
- Data sharing with partners planned
- Team prefers single-platform simplicity

BigQuery would be better if:
- GCP-only is acceptable
- Cost is primary driver
- Already invested in GCP ecosystem
```

### Architecture Design

You: "Design a modern data platform architecture for our e-commerce company"

Agent provides:
```
## E-Commerce Data Platform Architecture

### Architecture Pattern: Lakehouse

### Layer Design

1. **Ingestion Layer**
   - Transactional (orders, inventory): CDC via Debezium
   - SaaS (Shopify, Stripe): Fivetran connectors
   - Events (clickstream): Kafka → Delta Lake
   - Files (product catalog): Direct to storage

2. **Storage Layer**
   - Raw zone: S3 with Delta Lake format
   - Curated zone: Snowflake external tables
   - Feature store: Feast on Delta Lake

3. **Transformation Layer**
   - dbt Cloud for SQL transformations
   - Staging → Intermediate → Marts pattern
   - Real-time: Spark Structured Streaming

4. **Consumption Layer**
   - BI: Looker connected to Snowflake
   - ML: Databricks notebooks
   - APIs: Feature store serving

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Delta Lake | Unified batch + streaming, ACID |
| Snowflake for BI | Best query performance, sharing |
| dbt Cloud | Team expertise, governance |
| Fivetran | Managed connectors, lower ops |

### Capacity Sizing

| Resource | Initial | Year 1 | Year 3 |
|----------|---------|--------|--------|
| Storage | 5TB | 15TB | 60TB |
| Compute | 2XL | 3XL | 4XL |
| Concurrency | 100 | 200 | 500 |

### Estimated Annual Cost: $280,000
```

### Migration Planning

You: "We need to migrate from on-premises Oracle to the cloud"

Agent provides:
```
## Migration Plan: Oracle DW to Snowflake

### Executive Summary
20-week migration from Oracle 12c data warehouse (15TB) to
Snowflake, with minimal business disruption.

### Migration Phases

**Phase 1: Assessment (4 weeks)**
- Inventory: 450 tables, 180 views, 95 procedures
- Complexity: 40% simple, 45% moderate, 15% complex
- Dependencies: 12 downstream applications

**Phase 2: Design (4 weeks)**
- Target architecture definition
- Data model optimization
- Security and access design
- Testing strategy

**Phase 3: Build (6 weeks)**
- Infrastructure provisioning
- Data pipeline development
- Code conversion (PL/SQL → dbt)
- Integration development

**Phase 4: Migrate (4 weeks)**
- Historical data migration
- Parallel running
- Application cutover
- Performance validation

**Phase 5: Stabilize (2 weeks)**
- Monitoring setup
- Performance tuning
- Knowledge transfer
- Documentation

### Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data quality | Medium | High | Validation framework |
| Performance | Low | High | Benchmark suite |
| Downtime | Low | Critical | Parallel run |
| Budget overrun | Medium | Medium | Phased approach |

### Investment Summary

| Category | Cost |
|----------|------|
| Tools & licenses | $50,000 |
| Professional services | $200,000 |
| Internal effort | $100,000 |
| Contingency (15%) | $52,500 |
| **Total** | **$402,500** |

### Expected Benefits (Annual)

| Benefit | Value |
|---------|-------|
| Infrastructure savings | $180,000 |
| Reduced maintenance | $80,000 |
| Improved productivity | $120,000 |
| **Total** | **$380,000** |

**ROI: 13 months**
```

## Personality and Approach

### Working Style

- **Strategic thinker**: Considers long-term implications
- **Data-driven**: Bases recommendations on evidence
- **Cost-conscious**: Balances capability with budget
- **Security-focused**: Prioritizes data protection

### Communication

- Clear trade-off analysis
- Business case documentation
- Risk-aware recommendations
- Structured decision frameworks

## Decision Authority

### What the Agent Can Do Independently

- Recommend architecture patterns
- Suggest platform configurations
- Create capacity plans
- Design security frameworks
- Develop migration approaches
- Document architecture decisions

### What Requires Your Approval

- Platform selection decisions
- Budget commitments
- Migration execution
- Security policy changes
- Vendor contracts

## Architecture Patterns

### Modern Data Warehouse Patterns

| Pattern | Best For | Characteristics |
|---------|----------|-----------------|
| **Cloud DW** | SQL analytics | Snowflake, BigQuery, Redshift |
| **Lakehouse** | Analytics + ML | Delta Lake, Iceberg, Hudi |
| **Data Mesh** | Decentralized orgs | Domain ownership, federated |
| **Data Vault** | Audit/compliance | History tracking, flexible |

### Reference Architecture

```
Sources → Ingestion → Storage → Transform → Serve → Consume
   │          │          │         │         │        │
   │          │          │         │         │        │
Databases  CDC/Batch   Lake/DW    dbt     Semantic   BI/ML
SaaS Apps  Streaming   Raw/Gold  Spark    Layer     Apps
Events     APIs        Delta/Ice         APIs
```

## Integration

### Related Skills

| Skill | How It's Used |
|-------|--------------|
| SQL Query Optimizer | Query performance tuning |
| Cost Optimizer | Platform cost management |
| Data Quality Profiler | Data profiling for design |

### Related Agents

| Agent | How It's Used |
|-------|--------------|
| dbt Project Engineer | Transformation implementation |
| Migration Specialist | Migration execution |

### MCP Servers

```json
{
  "mcpServers": {
    "snowflake": {
      "command": "npx",
      "args": ["@snowflake-labs/mcp"]
    },
    "bigquery": {
      "command": "npx",
      "args": ["mcp-server-bigquery"]
    }
  }
}
```

## Common Tasks

### 1. Platform Evaluation

```
"Help us choose a cloud data warehouse"
```

Agent will:
1. Understand requirements
2. Define evaluation criteria
3. Compare platforms
4. Provide recommendation
5. Document decision

### 2. Architecture Design

```
"Design our data platform architecture"
```

Agent will:
1. Assess current state
2. Define requirements
3. Design target architecture
4. Create diagrams
5. Document decisions

### 3. Capacity Planning

```
"Size our Snowflake deployment"
```

Agent will:
1. Analyze workload
2. Project growth
3. Size compute
4. Estimate storage
5. Recommend configuration

### 4. Cost Optimization

```
"Reduce our data warehouse costs"
```

Agent will:
1. Analyze current spend
2. Identify waste
3. Recommend optimizations
4. Project savings
5. Create action plan

## Best Practices

### Architecture Principles

1. **Separate compute and storage** - Scale independently
2. **Design for scalability** - Plan for 10x growth
3. **Automate everything** - Infrastructure as code
4. **Security by default** - Encrypt, audit, control
5. **Cost awareness** - Tag, monitor, optimize

### Documentation Standards

- Architecture Decision Records (ADRs)
- System context diagrams
- Data flow diagrams
- Security documentation
- Runbooks

## Troubleshooting

### Common Challenges

**Budget constraints**
- Phase implementation
- Start with essentials
- Optimize existing

**Technical complexity**
- Proof of concept
- External expertise
- Phased approach

**Stakeholder alignment**
- Business case
- Risk analysis
- Pilot project

## References

- [Snowflake Architecture](https://docs.snowflake.com/en/user-guide/intro-key-concepts)
- [BigQuery Architecture](https://cloud.google.com/bigquery/docs/introduction)
- [Data Warehouse Toolkit](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/books/)
- [Designing Data-Intensive Applications](https://dataintensive.net/)
- [Data Mesh Principles](https://www.datamesh-architecture.com/)

## Version

- **Current Version**: 1.0.0
- **Agent ID**: AG-DEA-001
- **Category**: Architecture
