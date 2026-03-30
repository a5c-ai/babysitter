# Skills and Agents References: Data Engineering & Analytics

This document catalogs community-created Claude skills, agents, plugins, and MCP servers that align with the capabilities defined in `skills-agents-backlog.md`.

---

## Table of Contents

1. [Overview](#overview)
2. [MCP Servers - Databases & Data Warehouses](#mcp-servers---databases--data-warehouses)
3. [MCP Servers - Orchestration & Pipelines](#mcp-servers---orchestration--pipelines)
4. [MCP Servers - Streaming & Real-time](#mcp-servers---streaming--real-time)
5. [MCP Servers - Data Quality & Observability](#mcp-servers---data-quality--observability)
6. [MCP Servers - Transformation & Modeling](#mcp-servers---transformation--modeling)
7. [MCP Servers - BI & Analytics](#mcp-servers---bi--analytics)
8. [Claude Skills](#claude-skills)
9. [Claude Subagents](#claude-subagents)
10. [Awesome Lists & Aggregators](#awesome-lists--aggregators)
11. [Skill-to-Reference Mapping](#skill-to-reference-mapping)
12. [Summary Statistics](#summary-statistics)

---

## Overview

### Purpose

This document maps community resources (MCP servers, Claude skills, plugins, and agents) to the specialized skills and agents defined in the Data Engineering & Analytics backlog. These references can be used to accelerate implementation or serve as inspiration for custom development.

### Resource Types

- **MCP Server**: Model Context Protocol server providing tool access to external systems
- **Claude Skill**: Reusable filesystem-based knowledge module for Claude Code
- **Claude Subagent**: Specialized AI assistant with domain-specific expertise
- **Plugin**: Extension or integration package for Claude tools

---

## MCP Servers - Databases & Data Warehouses

### Snowflake

| Resource | Description | URL | Relevance |
|----------|-------------|-----|-----------|
| **Snowflake-Labs/mcp** | Official Snowflake MCP Server with Cortex AI, object management, SQL orchestration, semantic view consumption | [GitHub](https://github.com/Snowflake-Labs/mcp) | SK-DEA-004, SK-DEA-012, AG-DEA-001 |
| **isaacwasserman/mcp-snowflake-server** | Snowflake integration with read/write operations and insight tracking | [GitHub](https://github.com/isaacwasserman/mcp-snowflake-server) | SK-DEA-004, SK-DEA-012 |
| **alkemiai/alkemi-mcp** | Natural language querying of Snowflake, BigQuery, and Databricks data products | [GitHub](https://github.com/alkemiai/alkemi-mcp) | SK-DEA-004, SK-DEA-009 |

### Google BigQuery

| Resource | Description | URL | Relevance |
|----------|-------------|-----|-----------|
| **LucasHild/mcp-server-bigquery** | BigQuery MCP server with schema exploration and query capabilities | [GitHub](https://github.com/LucasHild/mcp-server-bigquery) | SK-DEA-004, SK-DEA-012, AG-DEA-001 |
| **ergut/mcp-bigquery-server** | Alternative BigQuery MCP implementation | [GitHub](https://github.com/ergut/mcp-bigquery-server) | SK-DEA-004 |

### Amazon Redshift

| Resource | Description | URL | Relevance |
|----------|-------------|-----|-----------|
| **awslabs/mcp (Redshift)** | Official AWS Redshift MCP Server with cluster discovery, metadata exploration, and safe query execution | [AWS Docs](https://awslabs.github.io/mcp/servers/redshift-mcp-server) | SK-DEA-004, SK-DEA-012, AG-DEA-001 |
| **aws-samples/sample-amazon-redshift-MCP-server** | Python-based MCP server for Redshift database interaction | [GitHub](https://github.com/aws-samples/sample-amazon-redshift-MCP-server) | SK-DEA-004 |
| **paschmaria/redshift-mcp-server** | TypeScript Redshift MCP with schema inspection and read-only queries | [GitHub](https://github.com/paschmaria/redshift-mcp-server) | SK-DEA-004 |
| **snahmod/mcp-server-redshift** | PostgreSQL-based Redshift MCP implementation | [GitHub](https://github.com/snahmod/mcp-server-redshift) | SK-DEA-004 |
| **Moonlight-CL/redshift-mcp-server** | Python MCP with DDL scripts, statistics, and query analysis | [GitHub](https://github.com/Moonlight-CL/redshift-mcp-server) | SK-DEA-004, SK-DEA-012 |
| **vinodismyname/redshift-utils-mcp** | Redshift MCP for monitoring, diagnostics, and querying via AWS Data API | [GitHub](https://github.com/vinodismyname/redshift-utils-mcp) | SK-DEA-004, SK-DEA-012 |

### PostgreSQL

| Resource | Description | URL | Relevance |
|----------|-------------|-----|-----------|
| **modelcontextprotocol/servers (postgres)** | Official MCP PostgreSQL server with schema inspection and read-only queries | [GitHub](https://github.com/modelcontextprotocol/servers/tree/main/src/postgres) | SK-DEA-004 |
| **pgedge/postgres-mcp-server** | pgEdge Postgres MCP with full schema introspection and Claude Code integration | [pgEdge](https://www.pgedge.com/blog/introducing-the-pgedge-postgres-mcp-server) | SK-DEA-004, SK-DEA-008 |

### Other Databases

| Resource | Description | URL | Relevance |
|----------|-------------|-----|-----------|
| **modelcontextprotocol/servers (sqlite)** | SQLite MCP with database interaction and BI capabilities | [GitHub](https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite) | SK-DEA-004 |
| **ktanaka101/mcp-server-duckdb** | DuckDB integration with schema inspection and query features | [GitHub](https://github.com/ktanaka101/mcp-server-duckdb) | SK-DEA-004 |
| **ClickHouse/mcp-clickhouse** | ClickHouse database integration with schema inspection | [GitHub](https://github.com/ClickHouse/mcp-clickhouse) | SK-DEA-004, SK-DEA-018 |
| **Dataring-engineering/mcp-server-trino** | Trino MCP Server for querying Trino clusters | [GitHub](https://github.com/Dataring-engineering/mcp-server-trino) | SK-DEA-004 |
| **designcomputer/mysql_mcp_server** | MySQL MCP with configurable access controls | [GitHub](https://github.com/designcomputer/mysql_mcp_server) | SK-DEA-004 |
| **RichardHan/mssql_mcp_server** | Microsoft SQL Server MCP for secure database interactions | [GitHub](https://github.com/RichardHan/mssql_mcp_server) | SK-DEA-004 |
| **mindsdb/mindsdb** | Connect and unify data across platforms as a single MCP server | [GitHub](https://github.com/mindsdb/mindsdb) | SK-DEA-004, SK-DEA-010 |
| **julien040/anyquery** | Query 40+ applications using SQL | [GitHub](https://github.com/julien040/anyquery) | SK-DEA-004 |

### Oracle Database

| Resource | Description | URL | Relevance |
|----------|-------------|-----|-----------|
| **Oracle Autonomous AI Database MCP** | Multi-tenant MCP server for Oracle AI Database with Select AI Agent | [Oracle Blog](https://blogs.oracle.com/machinelearning/announcing-the-oracle-autonomous-ai-database-mcp-server) | SK-DEA-004 |

---

## MCP Servers - Orchestration & Pipelines

### Apache Airflow

| Resource | Description | URL | Relevance |
|----------|-------------|-----|-----------|
| **yangkyeongmo/mcp-server-apache-airflow** | MCP server wrapping Apache Airflow REST API for standardized interaction | [GitHub](https://github.com/yangkyeongmo/mcp-server-apache-airflow) | SK-DEA-002, AG-DEA-005 |

### Dagster

| Resource | Description | URL | Relevance |
|----------|-------------|-----|-----------|
| **kyryl-opens-ml/mcp-server-dagster** | Dagster MCP server based on GraphQL API for LLM orchestration | [GitHub](https://github.com/kyryl-opens-ml/mcp-server-dagster) | SK-DEA-002, AG-DEA-005 |
| **dagster-io/dagster (built-in)** | Native Dagster MCP implementation via dagster-dg library | [GitHub](https://github.com/dagster-io/dagster) | SK-DEA-002, AG-DEA-005 |

### Prefect

| Resource | Description | URL | Relevance |
|----------|-------------|-----|-----------|
| **Prefect MCP Server** | Official Prefect MCP for workflow orchestration with deployment monitoring | [Prefect Docs](https://docs.prefect.io/mcp) | SK-DEA-002, AG-DEA-005 |

### Kestra

| Resource | Description | URL | Relevance |
|----------|-------------|-----|-----------|
| **kestra-io/mcp-server-python** | MCP server for Kestra workflow orchestration platform | [GitHub](https://github.com/kestra-io/mcp-server-python) | SK-DEA-002, AG-DEA-005 |

---

## MCP Servers - Streaming & Real-time

### Apache Kafka

| Resource | Description | URL | Relevance |
|----------|-------------|-----|-----------|
| **jovezhong/mcp-timeplus** | MCP for Apache Kafka and Timeplus with topic listing, message polling, and SQL streaming | [GitHub](https://github.com/jovezhong/mcp-timeplus) | SK-DEA-007, SK-DEA-018, AG-DEA-004 |
| **aywengo/kafka-schema-reg-mcp** | Kafka Schema Registry MCP with 48 tools for multi-registry management and schema migration | [GitHub](https://github.com/aywengo/kafka-schema-reg-mcp) | SK-DEA-007, SK-DEA-011, AG-DEA-004 |
| **confluentinc/mcp-confluent** | Official Confluent integration for Kafka and Confluent Cloud REST APIs | [GitHub](https://github.com/confluentinc/mcp-confluent) | SK-DEA-007, AG-DEA-004 |

### Real-time Analytics

| Resource | Description | URL | Relevance |
|----------|-------------|-----|-----------|
| **Apache Pinot MCP** | MCP for real-time analytics queries on Apache Pinot OLAP database | [MCP Registry](https://registry.modelcontextprotocol.io/) | SK-DEA-018, AG-DEA-004 |
| **Aiven-Open/mcp-aiven** | Navigate Aiven projects with PostgreSQL, Kafka, ClickHouse, OpenSearch | [GitHub](https://github.com/Aiven-Open/mcp-aiven) | SK-DEA-007, SK-DEA-018 |

---

## MCP Servers - Data Quality & Observability

### Elementary Data

| Resource | Description | URL | Relevance |
|----------|-------------|-----|-----------|
| **Elementary MCP Server** | Data observability MCP with anomaly detection, quality monitoring, and dbt integration | [Elementary](https://www.elementary-data.com/post/how-mcp-improves-data-reliability-workflows) | SK-DEA-005, SK-DEA-006, AG-DEA-003 |

### MLflow

| Resource | Description | URL | Relevance |
|----------|-------------|-----|-----------|
| **MLflow MCP Server** | Official MLflow 3.4+ MCP for trace analysis, feedback logging, and metadata management | [Medium](https://medium.com/@AI-on-Databricks/using-mlflows-mcp-server-for-conversational-trace-analysis-f1553b543d21) | SK-DEA-015, AG-DEA-010 |

---

## MCP Servers - Transformation & Modeling

### dbt (data build tool)

| Resource | Description | URL | Relevance |
|----------|-------------|-----|-----------|
| **dbt-labs/dbt-mcp** | Official dbt MCP server with project metadata discovery, model information, and semantic layer querying | [GitHub](https://github.com/dbt-labs/dbt-mcp) | SK-DEA-003, SK-DEA-009, SK-DEA-019, AG-DEA-002 |
| **dbt Remote MCP Server** | Cloud-hosted dbt MCP with single secure endpoint per environment | [dbt Labs](https://www.getdbt.com/blog/dbt-agents-remote-dbt-mcp-server-trusted-ai-for-analytics) | SK-DEA-003, AG-DEA-002 |
| **dbt Agents** | Task-specific AI agents built on dbt platform (beta) | [dbt Labs](https://www.getdbt.com/blog/dbt-agents-remote-dbt-mcp-server-trusted-ai-for-analytics) | AG-DEA-002, AG-DEA-003 |

---

## MCP Servers - BI & Analytics

### Power BI

| Resource | Description | URL | Relevance |
|----------|-------------|-----|-----------|
| **maxanatsko/pbi-desktop-mcp-public** | Power BI Desktop MCP for model structure, DAX queries, measures, relationships, and analytics | [GitHub](https://github.com/maxanatsko/pbi-desktop-mcp-public) | SK-DEA-009, AG-DEA-007 |

### Databricks

| Resource | Description | URL | Relevance |
|----------|-------------|-----|-----------|
| **Databricks DBSQL MCP** | Execute read-only SQL on Databricks with financial and KPI analysis | [Medium](https://medium.com/@hiydavid/specializing-claude-code-a-quick-guide-to-agent-skills-and-mcp-on-databricks-c0cfdd43637d) | SK-DEA-004, SK-DEA-009, AG-DEA-001 |

### Tinybird

| Resource | Description | URL | Relevance |
|----------|-------------|-----|-----------|
| **tinybirdco/tinybird-agent-skills** | Tinybird project guidelines with 18 rules for datasources, pipes, endpoints, SQL | [GitHub](https://github.com/tinybirdco/tinybird-agent-skills) | SK-DEA-018, AG-DEA-004 |

---

## Claude Skills

### Database Skills

| Skill | Description | URL | Relevance |
|-------|-------------|-----|-----------|
| **sanjay3290/postgres** | Execute safe read-only SQL queries against PostgreSQL with multi-connection support | [GitHub](https://github.com/sanjay3290/ai-skills/tree/main/skills/postgres) | SK-DEA-004 |
| **neondatabase/using-neon** | Best practices for Neon Serverless Postgres | [GitHub](https://github.com/neondatabase/agent-skills/tree/main/skills/using-neon) | SK-DEA-004 |
| **supabase/postgres-best-practices** | PostgreSQL best practices for Supabase | [GitHub](https://github.com/supabase/agent-skills/tree/main/skills/postgres-best-practices) | SK-DEA-004, SK-DEA-008 |

### Analytics Skills

| Skill | Description | URL | Relevance |
|-------|-------------|-----|-----------|
| **anthropics/xlsx** | Create, edit, and analyze Excel spreadsheets | [GitHub](https://github.com/anthropics/skills/tree/main/skills/xlsx) | SK-DEA-009, AG-DEA-007 |
| **coffeefuelbump/csv-data-summarizer** | Automatically analyzes CSV files and generates insights with visualizations | [GitHub](https://github.com/coffeefuelbump/csv-data-summarizer-claude-skill) | SK-DEA-005, SK-DEA-014 |
| **huggingface/hugging-face-datasets** | Create and manage datasets with configs and SQL querying | [GitHub](https://github.com/huggingface/skills/tree/main/skills/hugging-face-datasets) | SK-DEA-015, AG-DEA-010 |

### Tinybird Skill

| Skill | Description | URL | Relevance |
|-------|-------------|-----|-----------|
| **tinybirdco/tinybird-best-practices** | Tinybird project guidelines with 18 rules for datasources, pipes, endpoints, SQL, deployments | [GitHub](https://github.com/tinybirdco/tinybird-agent-skills/tree/main/skills/tinybird-best-practices) | SK-DEA-018, AG-DEA-004 |

---

## Claude Subagents

### VoltAgent Awesome Claude Code Subagents

A collection of 100+ specialized Claude Code subagents including data engineering specialists.

| Subagent | Description | URL | Relevance |
|----------|-------------|-----|-----------|
| **data-engineer** | Data infrastructure specialist building scalable data pipelines for ETL/ELT and warehousing | [GitHub](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/05-data-ai/data-engineer.md) | AG-DEA-001, AG-DEA-005 |
| **sql-pro** | Expert SQL developer with complex query optimization across PostgreSQL, MySQL, SQL Server, Oracle | [GitHub](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/02-language-specialists/sql-pro.md) | SK-DEA-004, AG-DEA-001 |
| **data-analyst** | Expert data analyst with BI, visualization, and statistical analysis expertise | [GitHub](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/05-data-ai/data-analyst.md) | SK-DEA-009, AG-DEA-007 |
| **data-scientist** | Statistics, ML, and domain expertise for predictive modeling | [GitHub](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/05-data-ai/data-scientist.md) | SK-DEA-014, SK-DEA-015 |
| **database-optimizer** | Database performance expert for query optimization and tuning | [GitHub](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/05-data-ai/database-optimizer.md) | SK-DEA-004, SK-DEA-012 |
| **postgres-pro** | PostgreSQL specialist mastering advanced features and optimizations | [GitHub](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/05-data-ai/postgres-pro.md) | SK-DEA-004, SK-DEA-008 |
| **ml-engineer** | Machine learning expert developing and optimizing ML models | [GitHub](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/05-data-ai/ml-engineer.md) | SK-DEA-015, AG-DEA-010 |
| **mlops-engineer** | MLOps specialist for ML model deployment with CI/CD and monitoring | [GitHub](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/05-data-ai/mlops-engineer.md) | SK-DEA-015, AG-DEA-010 |
| **devops-engineer** | Infrastructure and deployment specialist | [GitHub](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/03-infrastructure/devops-engineer.md) | AG-DEA-005, AG-DEA-009 |

---

## Awesome Lists & Aggregators

### Primary Aggregators

| Resource | Description | URL |
|----------|-------------|-----|
| **punkpeye/awesome-mcp-servers** | Comprehensive collection of MCP servers | [GitHub](https://github.com/punkpeye/awesome-mcp-servers) |
| **appcypher/awesome-mcp-servers** | Curated list of Model Context Protocol servers | [GitHub](https://github.com/appcypher/awesome-mcp-servers) |
| **modelcontextprotocol/servers** | Official MCP reference server implementations | [GitHub](https://github.com/modelcontextprotocol/servers) |
| **collabnix/awesome-mcp-lists** | Curated list of MCP servers, clients, and toolkits | [GitHub](https://github.com/collabnix/awesome-mcp-lists) |
| **MobinX/awesome-mcp-list** | Concise list for MCP servers | [GitHub](https://github.com/MobinX/awesome-mcp-list) |

### Claude Skills Aggregators

| Resource | Description | URL |
|----------|-------------|-----|
| **VoltAgent/awesome-claude-skills** | Awesome collection of Claude Skills and resources | [GitHub](https://github.com/VoltAgent/awesome-claude-skills) |
| **ComposioHQ/awesome-claude-skills** | Curated skill collections | [GitHub](https://github.com/ComposioHQ/awesome-claude-skills) |
| **VoltAgent/awesome-claude-code-subagents** | 100+ specialized Claude Code subagents | [GitHub](https://github.com/VoltAgent/awesome-claude-code-subagents) |
| **ccplugins/awesome-claude-code-plugins** | Claude Code plugins by category | [GitHub](https://github.com/ccplugins/awesome-claude-code-plugins) |

### Web Resources

| Resource | Description | URL |
|----------|-------------|-----|
| **MCPServers.org** | Searchable directory of MCP servers | [Website](https://mcpservers.org/) |
| **Glama MCP Servers** | Popular MCP servers catalog | [Website](https://glama.ai/mcp/servers) |
| **MCP Registry** | Official Model Context Protocol registry | [Website](https://registry.modelcontextprotocol.io/) |
| **Claude Code Plugins Marketplace** | Plugin directory at claudecodeplugins.dev | [Website](https://claudecodeplugins.dev/) |

### Data Quality Tool Aggregators

| Resource | Description | URL |
|----------|-------------|-----|
| **kwanUm/awesome-data-quality** | Curated list of data quality tools and frameworks | [GitHub](https://github.com/kwanUm/awesome-data-quality) |
| **opendatadiscovery/awesome-data-catalogs** | Awesome data catalogs and observability platforms | [GitHub](https://github.com/opendatadiscovery/awesome-data-catalogs) |
| **data-engineering-helpers/data-quality** | Material about data quality | [GitHub](https://github.com/data-engineering-helpers/data-quality) |

---

## Skill-to-Reference Mapping

### Skills with Available References

| Skill ID | Skill Name | Available Resources |
|----------|------------|---------------------|
| SK-DEA-001 | Apache Spark Optimizer | Dagster Spark integration, Databricks MCP |
| SK-DEA-002 | Airflow DAG Analyzer | yangkyeongmo/mcp-server-apache-airflow, Dagster MCP, Prefect MCP, Kestra MCP |
| SK-DEA-003 | dbt Project Analyzer | dbt-labs/dbt-mcp, dbt Remote MCP, dbt Agents |
| SK-DEA-004 | SQL Query Optimizer | Multiple database MCPs (Snowflake, BigQuery, Redshift, PostgreSQL, etc.), sql-pro subagent |
| SK-DEA-005 | Data Quality Profiler | Elementary MCP, csv-data-summarizer skill |
| SK-DEA-006 | Great Expectations Generator | Elementary MCP (partial) |
| SK-DEA-007 | Kafka Topic Designer | mcp-timeplus, kafka-schema-reg-mcp, mcp-confluent |
| SK-DEA-008 | Dimensional Model Validator | postgres-best-practices skill, postgres-pro subagent |
| SK-DEA-009 | BI Semantic Layer Generator | dbt-mcp, pbi-desktop-mcp, xlsx skill, data-analyst subagent |
| SK-DEA-010 | Data Lineage Mapper | dbt-mcp (partial), mindsdb |
| SK-DEA-011 | Schema Evolution Manager | kafka-schema-reg-mcp |
| SK-DEA-012 | Cost Optimizer | Snowflake MCP, Redshift MCPs, database-optimizer subagent |
| SK-DEA-013 | CDC Pattern Implementer | kafka-schema-reg-mcp, Confluent MCP |
| SK-DEA-014 | A/B Test Statistical Analyzer | data-scientist subagent, csv-data-summarizer |
| SK-DEA-015 | Feature Engineering Optimizer | MLflow MCP, ml-engineer subagent, huggingface-datasets skill |
| SK-DEA-016 | SCD Implementation Generator | dbt-mcp |
| SK-DEA-017 | Data Catalog Enricher | dbt-mcp (metadata) |
| SK-DEA-018 | Stream Processing Windowing Designer | mcp-timeplus, tinybird skill, ClickHouse MCP |
| SK-DEA-019 | Incremental Model Strategy Selector | dbt-mcp |
| SK-DEA-020 | OBT Design Optimizer | dbt-mcp, database MCPs |

### Agents with Available References

| Agent ID | Agent Name | Available Resources |
|----------|------------|---------------------|
| AG-DEA-001 | Data Warehouse Architect Agent | Snowflake MCP, BigQuery MCP, Redshift MCPs, data-engineer subagent |
| AG-DEA-002 | dbt Project Engineer Agent | dbt-mcp, dbt Agents |
| AG-DEA-003 | Data Quality Engineer Agent | Elementary MCP, dbt-mcp |
| AG-DEA-004 | Streaming Pipeline Engineer Agent | mcp-timeplus, kafka-schema-reg-mcp, Confluent MCP, tinybird skill |
| AG-DEA-005 | Data Orchestration Engineer Agent | Airflow MCP, Dagster MCP, Prefect MCP, Kestra MCP, devops-engineer subagent |
| AG-DEA-006 | Dimensional Modeler Agent | dbt-mcp, postgres-pro subagent |
| AG-DEA-007 | BI Analytics Engineer Agent | pbi-desktop-mcp, data-analyst subagent, xlsx skill |
| AG-DEA-008 | Data Governance Steward Agent | dbt-mcp (metadata), Elementary MCP |
| AG-DEA-009 | Migration Specialist Agent | Multiple database MCPs, devops-engineer subagent |
| AG-DEA-010 | ML Feature Engineer Agent | MLflow MCP, ml-engineer subagent, mlops-engineer subagent |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| MCP Servers - Databases | 20 |
| MCP Servers - Orchestration | 5 |
| MCP Servers - Streaming | 5 |
| MCP Servers - Data Quality | 2 |
| MCP Servers - Transformation | 3 |
| MCP Servers - BI & Analytics | 3 |
| Claude Skills | 7 |
| Claude Subagents | 9 |
| Awesome Lists/Aggregators | 13 |
| **Total References Found** | **67** |

### Coverage Analysis

| Backlog Item | References Found | Coverage |
|--------------|------------------|----------|
| Skills (20 defined) | 20 with partial+ coverage | 100% |
| Agents (10 defined) | 10 with partial+ coverage | 100% |

### Gaps Identified

The following areas have limited community resources and may require custom development:

1. **Great Expectations Generator (SK-DEA-006)**: No direct MCP server; Elementary provides partial coverage
2. **Dimensional Model Validator (SK-DEA-008)**: No specialized tool; rely on dbt and PostgreSQL resources
3. **Data Catalog Enricher (SK-DEA-017)**: Limited to dbt metadata; no dedicated DataHub/Amundsen MCP
4. **A/B Test Statistical Analyzer (SK-DEA-014)**: No direct MCP; use general data science tools
5. **CDC Pattern Implementer (SK-DEA-013)**: Partial coverage via Kafka tools; no Debezium-specific MCP

---

## Version Information

- **Document Version**: 1.0
- **Created**: 2026-01-24
- **Last Updated**: 2026-01-24
- **Specialization**: Data Engineering & Analytics

---

## References

### Official Documentation

- [Model Context Protocol Documentation](https://docs.claude.com/en/docs/mcp)
- [Claude Code MCP Integration](https://code.claude.com/docs/en/mcp)
- [dbt MCP Server](https://www.getdbt.com/blog/dbt-mcp-server-conversational-analytics)
- [Elementary Data MCP](https://www.elementary-data.com/post/how-mcp-improves-data-reliability-workflows)

### Community Resources

- [Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers)
- [Awesome Claude Skills](https://github.com/VoltAgent/awesome-claude-skills)
- [Awesome Claude Code Subagents](https://github.com/VoltAgent/awesome-claude-code-subagents)
- [MCP Servers Directory](https://mcpservers.org/)
