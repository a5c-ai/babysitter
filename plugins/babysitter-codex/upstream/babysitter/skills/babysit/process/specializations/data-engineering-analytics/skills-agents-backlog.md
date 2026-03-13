# Skills and Agents Backlog: Data Engineering & Analytics

This document defines specialized skills and agents (subagents) that enhance the data engineering and analytics processes beyond general-purpose capabilities.

---

## Table of Contents

1. [Overview](#overview)
2. [Skills Registry](#skills-registry)
3. [Agents Registry](#agents-registry)
4. [Process-to-Skills/Agents Mapping](#process-to-skillsagents-mapping)
5. [Shared Candidates](#shared-candidates)
6. [Implementation Priority](#implementation-priority)

---

## Overview

### Purpose

This backlog identifies specialized skills and agents that can enhance the 18 data engineering processes defined in `processes-backlog.md`. Each skill/agent provides domain-specific capabilities that go beyond what a general-purpose agent can offer.

### Terminology

- **Skill**: A focused capability that can be invoked to perform a specific task (e.g., query optimization, schema validation)
- **Agent**: An autonomous entity with domain expertise that can reason, plan, and execute complex multi-step tasks
- **Shared Candidate**: A skill or agent that can be reused across multiple specializations

---

## Skills Registry

### SK-DEA-001: Apache Spark Optimizer

**Category**: Distributed Processing
**Type**: Skill

**Description**: Analyzes and optimizes Apache Spark jobs for performance, cost, and resource utilization.

**Capabilities**:
- Spark execution plan analysis and optimization
- Partition strategy recommendations
- Shuffle reduction techniques
- Memory and executor configuration tuning
- Catalyst optimizer hints generation
- Data skew detection and mitigation
- Broadcast join optimization
- Caching strategy recommendations

**Input Schema**:
```json
{
  "sparkCode": "string",
  "clusterConfig": "object",
  "executionMetrics": "object",
  "dataCharacteristics": {
    "volumeGB": "number",
    "partitionCount": "number",
    "skewFactor": "number"
  }
}
```

**Output Schema**:
```json
{
  "optimizedCode": "string",
  "recommendations": ["string"],
  "expectedImprovement": {
    "executionTime": "percentage",
    "resourceUsage": "percentage",
    "cost": "percentage"
  },
  "configChanges": "object"
}
```

**Applicable Processes**: ETL/ELT Pipeline, Streaming Pipeline, Feature Store Setup, Pipeline Migration

---

### SK-DEA-002: Airflow DAG Analyzer

**Category**: Orchestration
**Type**: Skill

**Description**: Analyzes, validates, and optimizes Apache Airflow DAGs for reliability and performance.

**Capabilities**:
- DAG structure analysis and validation
- Task dependency optimization
- Parallelism and concurrency recommendations
- SLA and timeout configuration
- Retry and failure handling patterns
- Sensor optimization (smart sensors, deferrable operators)
- Resource pool allocation
- DAG scheduling optimization
- Cross-DAG dependency detection

**Input Schema**:
```json
{
  "dagCode": "string",
  "dagId": "string",
  "executionHistory": "object",
  "clusterConfig": {
    "workerCount": "number",
    "poolConfigs": "object"
  }
}
```

**Output Schema**:
```json
{
  "validationResults": {
    "errors": ["string"],
    "warnings": ["string"]
  },
  "optimizations": ["object"],
  "recommendedConfig": "object",
  "dependencyGraph": "object"
}
```

**Applicable Processes**: ETL/ELT Pipeline, A/B Testing Pipeline, Pipeline Migration, Data Quality Framework

---

### SK-DEA-003: dbt Project Analyzer

**Category**: Transformation
**Type**: Skill

**Description**: Analyzes dbt projects for best practices, performance, and maintainability.

**Capabilities**:
- Model dependency graph analysis
- Incremental model optimization
- Materialization strategy recommendations
- Test coverage analysis
- Documentation completeness check
- Naming convention validation
- Ref/source usage validation
- Macro efficiency analysis
- Slim CI optimization
- Model contract validation

**Input Schema**:
```json
{
  "projectPath": "string",
  "manifestJson": "object",
  "catalogJson": "object",
  "runResults": "object"
}
```

**Output Schema**:
```json
{
  "healthScore": "number",
  "issues": [{
    "severity": "string",
    "category": "string",
    "model": "string",
    "message": "string",
    "recommendation": "string"
  }],
  "metrics": {
    "testCoverage": "percentage",
    "docCoverage": "percentage",
    "incrementalRatio": "percentage"
  }
}
```

**Applicable Processes**: dbt Project Setup, dbt Model Development, Metrics Layer, Incremental Model Setup

---

### SK-DEA-004: SQL Query Optimizer

**Category**: SQL Optimization
**Type**: Skill

**Description**: Analyzes and optimizes SQL queries across different data warehouse platforms.

**Capabilities**:
- Query execution plan analysis
- Index recommendations
- Join optimization
- Subquery elimination
- CTE optimization
- Window function optimization
- Predicate pushdown validation
- Clustering key recommendations
- Materialized view suggestions
- Platform-specific optimizations (Snowflake, BigQuery, Redshift)

**Input Schema**:
```json
{
  "query": "string",
  "platform": "snowflake|bigquery|redshift|databricks",
  "tableStatistics": "object",
  "executionPlan": "object",
  "queryHistory": "object"
}
```

**Output Schema**:
```json
{
  "optimizedQuery": "string",
  "improvements": [{
    "type": "string",
    "description": "string",
    "impact": "high|medium|low"
  }],
  "indexRecommendations": ["object"],
  "estimatedImprovement": {
    "scanReduction": "percentage",
    "timeReduction": "percentage"
  }
}
```

**Applicable Processes**: Query Optimization, Data Warehouse Setup, BI Dashboard Development, OBT Creation

---

### SK-DEA-005: Data Quality Profiler

**Category**: Data Quality
**Type**: Skill

**Description**: Profiles data assets to assess quality dimensions and detect anomalies.

**Capabilities**:
- Statistical profiling (distributions, cardinality, nulls)
- Data type inference and validation
- Pattern detection (regex patterns, formats)
- Anomaly detection (outliers, drift)
- Referential integrity checking
- Freshness monitoring
- Volume trend analysis
- Schema change detection
- Cross-column correlation analysis
- PII detection and classification

**Input Schema**:
```json
{
  "dataSource": {
    "type": "table|file|query",
    "connection": "object",
    "identifier": "string"
  },
  "sampleSize": "number",
  "dimensions": ["accuracy", "completeness", "consistency", "validity", "timeliness", "uniqueness"]
}
```

**Output Schema**:
```json
{
  "profile": {
    "columns": [{
      "name": "string",
      "type": "string",
      "statistics": "object",
      "qualityScores": "object"
    }]
  },
  "anomalies": ["object"],
  "overallScore": "number",
  "recommendations": ["string"]
}
```

**Applicable Processes**: Data Quality Framework, Data Catalog, ETL/ELT Pipeline, A/B Testing Pipeline

---

### SK-DEA-006: Great Expectations Generator

**Category**: Data Quality
**Type**: Skill

**Description**: Generates Great Expectations suites from data profiles and business rules.

**Capabilities**:
- Expectation suite generation from profiling
- Custom expectation creation
- Checkpoint configuration
- Data docs generation
- Validation result analysis
- Expectation parameterization
- Suite versioning recommendations
- Integration with dbt and Airflow

**Input Schema**:
```json
{
  "dataProfile": "object",
  "businessRules": ["object"],
  "existingSuite": "object",
  "strictness": "strict|moderate|lenient"
}
```

**Output Schema**:
```json
{
  "expectationSuite": "object",
  "checkpointConfig": "object",
  "documentation": "string",
  "coverageReport": {
    "columnsWithExpectations": "number",
    "totalExpectations": "number"
  }
}
```

**Applicable Processes**: Data Quality Framework, ETL/ELT Pipeline, dbt Project Setup

---

### SK-DEA-007: Kafka Topic Designer

**Category**: Streaming
**Type**: Skill

**Description**: Designs and optimizes Apache Kafka topics and configurations.

**Capabilities**:
- Topic naming convention design
- Partition strategy optimization
- Replication factor recommendations
- Retention policy configuration
- Compaction strategy design
- Schema registry integration
- Consumer group design
- Throughput capacity planning
- Security configuration (ACLs, encryption)

**Input Schema**:
```json
{
  "requirements": {
    "throughputMBps": "number",
    "messageSize": "number",
    "retentionDays": "number",
    "orderingRequirements": "string"
  },
  "existingTopics": ["object"],
  "clusterConfig": "object"
}
```

**Output Schema**:
```json
{
  "topicDesign": {
    "name": "string",
    "partitions": "number",
    "replicationFactor": "number",
    "configs": "object"
  },
  "schemaDefinition": "object",
  "producerConfig": "object",
  "consumerConfig": "object"
}
```

**Applicable Processes**: Streaming Pipeline, ETL/ELT Pipeline (CDC), Feature Store Setup

---

### SK-DEA-008: Dimensional Model Validator

**Category**: Data Modeling
**Type**: Skill

**Description**: Validates dimensional models against Kimball methodology best practices.

**Capabilities**:
- Star/snowflake schema validation
- Grain definition verification
- Surrogate key design validation
- SCD type appropriateness check
- Conformed dimension analysis
- Fact table type validation (transaction, periodic, accumulating)
- Degenerate dimension identification
- Role-playing dimension detection
- Bus matrix compliance checking

**Input Schema**:
```json
{
  "model": {
    "facts": ["object"],
    "dimensions": ["object"],
    "relationships": ["object"]
  },
  "businessProcess": "string",
  "busMatrix": "object"
}
```

**Output Schema**:
```json
{
  "validationScore": "number",
  "issues": [{
    "severity": "error|warning|info",
    "element": "string",
    "rule": "string",
    "message": "string"
  }],
  "suggestions": ["string"],
  "conformedDimensionOpportunities": ["object"]
}
```

**Applicable Processes**: Dimensional Model Design, Data Warehouse Setup, OBT Creation

---

### SK-DEA-009: BI Semantic Layer Generator

**Category**: BI Tools
**Type**: Skill

**Description**: Generates semantic layer definitions for BI tools from dimensional models.

**Capabilities**:
- LookML generation (Looker)
- Tableau data model generation
- Power BI semantic model creation
- Cube.js schema generation
- dbt metrics layer integration
- Calculation and measure definitions
- Hierarchy generation
- Security filter generation
- Join path optimization

**Input Schema**:
```json
{
  "dimensionalModel": "object",
  "targetPlatform": "looker|tableau|powerbi|cubejs|dbt",
  "businessGlossary": "object",
  "securityRules": ["object"]
}
```

**Output Schema**:
```json
{
  "semanticModel": "object",
  "calculations": ["object"],
  "hierarchies": ["object"],
  "securityFilters": ["object"],
  "documentation": "string"
}
```

**Applicable Processes**: Metrics Layer, BI Dashboard Development, Data Warehouse Setup

---

### SK-DEA-010: Data Lineage Mapper

**Category**: Data Governance
**Type**: Skill

**Description**: Extracts and maps data lineage from various sources.

**Capabilities**:
- SQL parsing for lineage extraction
- dbt lineage integration
- Airflow task lineage mapping
- Spark job lineage extraction
- Cross-system lineage connection
- Column-level lineage tracing
- Impact analysis
- Lineage graph generation
- Integration with data catalogs

**Input Schema**:
```json
{
  "sources": [{
    "type": "sql|dbt|airflow|spark",
    "content": "string|object"
  }],
  "existingLineage": "object",
  "targetCatalog": "datahub|amundsen|alation"
}
```

**Output Schema**:
```json
{
  "lineageGraph": {
    "nodes": ["object"],
    "edges": ["object"]
  },
  "columnLineage": ["object"],
  "impactAnalysis": "object",
  "catalogIntegration": "object"
}
```

**Applicable Processes**: Data Lineage Mapping, Data Catalog, dbt Project Setup

---

### SK-DEA-011: Schema Evolution Manager

**Category**: Data Governance
**Type**: Skill

**Description**: Manages schema evolution and compatibility across data systems.

**Capabilities**:
- Schema compatibility checking (Avro, Protobuf, JSON Schema)
- Breaking change detection
- Migration script generation
- Version management
- Schema registry operations
- Backward/forward compatibility validation
- Schema documentation generation
- Cross-system schema synchronization

**Input Schema**:
```json
{
  "currentSchema": "object",
  "proposedSchema": "object",
  "schemaFormat": "avro|protobuf|jsonschema|ddl",
  "compatibilityMode": "backward|forward|full|none"
}
```

**Output Schema**:
```json
{
  "compatible": "boolean",
  "breakingChanges": ["object"],
  "migrationScript": "string",
  "recommendations": ["string"],
  "versionInfo": "object"
}
```

**Applicable Processes**: Streaming Pipeline, ETL/ELT Pipeline, Data Catalog, Pipeline Migration

---

### SK-DEA-012: Cost Optimizer (Cloud Data Platforms)

**Category**: Cost Management
**Type**: Skill

**Description**: Analyzes and optimizes costs for cloud data platforms.

**Capabilities**:
- Snowflake credit analysis and optimization
- BigQuery slot and on-demand optimization
- Redshift node sizing
- Storage cost optimization
- Query cost estimation
- Warehouse scheduling recommendations
- Data lifecycle policy recommendations
- Reserved capacity planning

**Input Schema**:
```json
{
  "platform": "snowflake|bigquery|redshift|databricks",
  "usageMetrics": "object",
  "billingData": "object",
  "queryHistory": "object"
}
```

**Output Schema**:
```json
{
  "currentCost": "number",
  "optimizedCost": "number",
  "savings": "percentage",
  "recommendations": [{
    "category": "string",
    "action": "string",
    "impact": "number",
    "effort": "low|medium|high"
  }]
}
```

**Applicable Processes**: Data Warehouse Setup, Query Optimization, Pipeline Migration

---

### SK-DEA-013: CDC Pattern Implementer

**Category**: Data Integration
**Type**: Skill

**Description**: Implements Change Data Capture patterns for real-time data integration.

**Capabilities**:
- Debezium connector configuration
- CDC pattern selection (log-based, trigger-based, timestamp-based)
- Initial snapshot strategy
- Schema change handling
- Exactly-once delivery configuration
- Sink connector setup
- Tombstone handling
- CDC monitoring setup

**Input Schema**:
```json
{
  "sourceDatabase": {
    "type": "postgres|mysql|oracle|sqlserver",
    "connection": "object"
  },
  "tables": ["string"],
  "targetSystem": "kafka|kinesis|pubsub",
  "requirements": {
    "latencyMs": "number",
    "exactlyOnce": "boolean"
  }
}
```

**Output Schema**:
```json
{
  "connectorConfig": "object",
  "snapshotStrategy": "object",
  "schemaConfig": "object",
  "monitoringConfig": "object",
  "documentation": "string"
}
```

**Applicable Processes**: ETL/ELT Pipeline, Streaming Pipeline, Data Warehouse Setup

---

### SK-DEA-014: A/B Test Statistical Analyzer

**Category**: Analytics
**Type**: Skill

**Description**: Performs statistical analysis for A/B testing experiments.

**Capabilities**:
- Sample size calculation
- Statistical significance testing
- Bayesian analysis
- Sequential testing
- Multi-armed bandit analysis
- Segment analysis
- Novelty/primacy effect detection
- SRM (Sample Ratio Mismatch) detection
- Confidence interval calculation
- Power analysis

**Input Schema**:
```json
{
  "experimentData": {
    "control": "object",
    "variants": ["object"]
  },
  "metrics": [{
    "name": "string",
    "type": "conversion|continuous|ratio"
  }],
  "analysisType": "frequentist|bayesian|sequential"
}
```

**Output Schema**:
```json
{
  "results": [{
    "metric": "string",
    "controlValue": "number",
    "variantValues": ["number"],
    "pValue": "number",
    "confidenceInterval": "object",
    "significant": "boolean"
  }],
  "srmCheck": "object",
  "recommendation": "string"
}
```

**Applicable Processes**: A/B Testing Pipeline, Feature Store Setup

---

### SK-DEA-015: Feature Engineering Optimizer

**Category**: ML Engineering
**Type**: Skill

**Description**: Optimizes feature engineering pipelines and feature store configurations.

**Capabilities**:
- Feature importance analysis
- Feature correlation detection
- Encoding strategy recommendations
- Feature freshness optimization
- Online/offline feature sync
- Feature versioning
- Point-in-time correctness validation
- Feature serving optimization

**Input Schema**:
```json
{
  "features": [{
    "name": "string",
    "definition": "string",
    "type": "string"
  }],
  "targetVariable": "string",
  "useCases": ["batch|realtime|streaming"],
  "performanceRequirements": "object"
}
```

**Output Schema**:
```json
{
  "optimizedFeatures": ["object"],
  "removedFeatures": ["string"],
  "engineeringRecommendations": ["object"],
  "servingConfig": "object"
}
```

**Applicable Processes**: Feature Store Setup, A/B Testing Pipeline

---

### SK-DEA-016: SCD Implementation Generator

**Category**: Data Modeling
**Type**: Skill

**Description**: Generates Slowly Changing Dimension implementations across platforms.

**Capabilities**:
- SCD Type 1/2/3/4/6 implementation
- MERGE statement generation
- dbt snapshot configuration
- Historical tracking optimization
- Surrogate key management
- Effective date handling
- Current flag management
- Mini-dimension design

**Input Schema**:
```json
{
  "dimension": {
    "name": "string",
    "columns": ["object"],
    "businessKey": ["string"]
  },
  "scdType": "1|2|3|4|6",
  "platform": "snowflake|bigquery|redshift|dbt",
  "trackingColumns": ["string"]
}
```

**Output Schema**:
```json
{
  "ddl": "string",
  "mergeStatement": "string",
  "dbtConfig": "object",
  "documentation": "string"
}
```

**Applicable Processes**: SCD Implementation, Dimensional Model Design, dbt Model Development

---

### SK-DEA-017: Data Catalog Enricher

**Category**: Data Governance
**Type**: Skill

**Description**: Enriches data catalog entries with automated metadata.

**Capabilities**:
- Automated tag suggestion
- Business glossary term matching
- Owner/steward recommendation
- Usage pattern analysis
- Data classification (sensitivity, PII)
- Quality score integration
- Lineage enrichment
- Search optimization

**Input Schema**:
```json
{
  "catalogEntry": "object",
  "dataProfile": "object",
  "existingGlossary": "object",
  "organizationContext": "object"
}
```

**Output Schema**:
```json
{
  "enrichedEntry": "object",
  "suggestedTags": ["string"],
  "glossaryMatches": ["object"],
  "classificationResults": "object",
  "ownerSuggestions": ["string"]
}
```

**Applicable Processes**: Data Catalog, Data Lineage Mapping, Data Quality Framework

---

### SK-DEA-018: Stream Processing Windowing Designer

**Category**: Streaming
**Type**: Skill

**Description**: Designs optimal windowing strategies for stream processing.

**Capabilities**:
- Window type selection (tumbling, sliding, session, global)
- Watermark strategy design
- Late data handling
- Trigger configuration
- Window aggregation optimization
- State management recommendations
- Exactly-once semantics configuration

**Input Schema**:
```json
{
  "useCase": "string",
  "eventTimeField": "string",
  "latencyRequirements": {
    "maxLatencyMs": "number",
    "allowedLateMs": "number"
  },
  "aggregations": ["object"]
}
```

**Output Schema**:
```json
{
  "windowConfig": {
    "type": "string",
    "size": "string",
    "slide": "string"
  },
  "watermarkConfig": "object",
  "triggerConfig": "object",
  "lateDataHandling": "object"
}
```

**Applicable Processes**: Streaming Pipeline, Feature Store Setup

---

### SK-DEA-019: Incremental Model Strategy Selector

**Category**: Transformation
**Type**: Skill

**Description**: Selects and configures optimal incremental model strategies.

**Capabilities**:
- Incremental strategy selection (append, merge, delete+insert)
- Partition pruning optimization
- Unique key configuration
- On_schema_change handling
- Full refresh scheduling
- Lookback window optimization
- Late-arriving data handling

**Input Schema**:
```json
{
  "modelCharacteristics": {
    "sourceType": "string",
    "updatePattern": "append|update|delete",
    "volumeGB": "number",
    "updateFrequency": "string"
  },
  "platform": "snowflake|bigquery|redshift",
  "existingModel": "object"
}
```

**Output Schema**:
```json
{
  "strategy": "append|merge|delete+insert",
  "config": "object",
  "partitionStrategy": "object",
  "refreshSchedule": "object",
  "dbtConfig": "object"
}
```

**Applicable Processes**: Incremental Model Setup, dbt Model Development, Pipeline Migration

---

### SK-DEA-020: OBT Design Optimizer

**Category**: Data Modeling
**Type**: Skill

**Description**: Designs and optimizes One Big Table (OBT) patterns.

**Capabilities**:
- Column selection optimization
- Denormalization strategy
- Nested/repeated field design (BigQuery)
- Clustering key selection
- Partition strategy
- Update frequency optimization
- Query pattern analysis
- Storage vs. performance tradeoffs

**Input Schema**:
```json
{
  "sourceModels": ["object"],
  "queryPatterns": ["object"],
  "platform": "snowflake|bigquery|redshift",
  "constraints": {
    "maxColumns": "number",
    "refreshFrequency": "string"
  }
}
```

**Output Schema**:
```json
{
  "obtDesign": {
    "columns": ["object"],
    "clustering": ["string"],
    "partitioning": "object"
  },
  "buildStrategy": "object",
  "refreshConfig": "object",
  "estimatedQueryImprovement": "percentage"
}
```

**Applicable Processes**: OBT Creation, BI Dashboard Development, Query Optimization

---

## Agents Registry

### AG-DEA-001: Data Warehouse Architect Agent

**Category**: Architecture
**Type**: Agent

**Description**: Autonomous agent specialized in data warehouse architecture design and optimization.

**Capabilities**:
- Platform evaluation and selection
- Architecture pattern design (Lakehouse, traditional DW, data mesh)
- Capacity planning and sizing
- Security architecture design
- Multi-region/DR strategy
- Cost modeling and optimization
- Migration planning
- Performance benchmarking

**Personality Profile**:
- Methodical and thorough in analysis
- Focused on long-term scalability
- Cost-conscious decision making
- Security-first mindset

**Decision Authority**:
- Can recommend architecture patterns
- Can suggest platform configurations
- Requires approval for: platform selection, budget commitments

**Applicable Processes**: Data Warehouse Setup, Pipeline Migration, Query Optimization

---

### AG-DEA-002: dbt Project Engineer Agent

**Category**: Transformation
**Type**: Agent

**Description**: Autonomous agent specialized in dbt project development and optimization.

**Capabilities**:
- Model development and refactoring
- Test creation and optimization
- Documentation generation
- CI/CD pipeline setup
- Incremental model design
- Macro development
- Performance troubleshooting
- Best practice enforcement

**Personality Profile**:
- Clean code advocate
- Test-driven approach
- Documentation-first mentality
- Collaborative and knowledge-sharing

**Decision Authority**:
- Can create and modify models
- Can add/modify tests
- Requires approval for: materialization changes, breaking changes

**Applicable Processes**: dbt Project Setup, dbt Model Development, Incremental Model Setup, SCD Implementation

---

### AG-DEA-003: Data Quality Engineer Agent

**Category**: Data Quality
**Type**: Agent

**Description**: Autonomous agent specialized in data quality management and monitoring.

**Capabilities**:
- Quality dimension assessment
- Expectation suite development
- Anomaly detection and alerting
- Root cause analysis
- Remediation planning
- Quality dashboard creation
- SLA monitoring
- Quality improvement recommendations

**Personality Profile**:
- Detail-oriented and thorough
- Proactive about potential issues
- Data-driven decision making
- Clear communicator of quality issues

**Decision Authority**:
- Can create quality rules
- Can configure alerts
- Requires approval for: blocking pipelines, data corrections

**Applicable Processes**: Data Quality Framework, ETL/ELT Pipeline, A/B Testing Pipeline

---

### AG-DEA-004: Streaming Pipeline Engineer Agent

**Category**: Streaming
**Type**: Agent

**Description**: Autonomous agent specialized in real-time data streaming architectures.

**Capabilities**:
- Stream processing design
- Kafka/Kinesis architecture
- Flink/Spark Streaming development
- State management
- Exactly-once delivery implementation
- Windowing and watermarking
- Connector development
- Performance tuning

**Personality Profile**:
- Real-time focused mindset
- Resilience-oriented design
- Performance optimization expert
- Scale-aware architecture

**Decision Authority**:
- Can configure topics and consumers
- Can design processing logic
- Requires approval for: production deployments, schema changes

**Applicable Processes**: Streaming Pipeline, CDC implementation, Feature Store Setup

---

### AG-DEA-005: Data Orchestration Engineer Agent

**Category**: Orchestration
**Type**: Agent

**Description**: Autonomous agent specialized in data pipeline orchestration.

**Capabilities**:
- DAG design and optimization
- Dependency management
- Error handling and retry logic
- Monitoring and alerting setup
- Resource pool management
- SLA configuration
- Cross-DAG coordination
- Backfill management

**Personality Profile**:
- Reliability-focused
- Systematic approach to problems
- Proactive monitoring mindset
- Clear operational documentation

**Decision Authority**:
- Can create and modify DAGs
- Can configure schedules
- Requires approval for: production changes, SLA modifications

**Applicable Processes**: ETL/ELT Pipeline, A/B Testing Pipeline, Data Quality Framework

---

### AG-DEA-006: Dimensional Modeler Agent

**Category**: Data Modeling
**Type**: Agent

**Description**: Autonomous agent specialized in dimensional modeling using Kimball methodology.

**Capabilities**:
- Business process analysis
- Dimensional model design
- Fact/dimension identification
- Grain definition
- SCD strategy selection
- Conformed dimension management
- Bus matrix maintenance
- Model documentation

**Personality Profile**:
- Business-process oriented
- Methodical Kimball adherent
- User-centric design approach
- Long-term maintainability focus

**Decision Authority**:
- Can design dimensional models
- Can recommend SCD types
- Requires approval for: grain changes, conformed dimension modifications

**Applicable Processes**: Dimensional Model Design, SCD Implementation, OBT Creation

---

### AG-DEA-007: BI Analytics Engineer Agent

**Category**: Analytics
**Type**: Agent

**Description**: Autonomous agent specialized in BI and analytics implementation.

**Capabilities**:
- Semantic layer design
- Dashboard development
- Metric definition
- Performance optimization
- User access management
- Report automation
- Data visualization best practices
- Self-service enablement

**Personality Profile**:
- User experience focused
- Clear visual communication
- Performance-conscious
- Collaborative with stakeholders

**Decision Authority**:
- Can create dashboards and reports
- Can define metrics
- Requires approval for: data model changes, access control changes

**Applicable Processes**: BI Dashboard Development, Metrics Layer, Data Catalog

---

### AG-DEA-008: Data Governance Steward Agent

**Category**: Governance
**Type**: Agent

**Description**: Autonomous agent specialized in data governance and cataloging.

**Capabilities**:
- Metadata management
- Data classification
- Lineage documentation
- Policy enforcement
- Access control management
- Business glossary curation
- Compliance monitoring
- Data discovery facilitation

**Personality Profile**:
- Policy-adherent
- Organization-wide perspective
- Privacy and security conscious
- Clear documentation standards

**Decision Authority**:
- Can update catalog entries
- Can suggest classifications
- Requires approval for: access changes, policy modifications

**Applicable Processes**: Data Catalog, Data Lineage Mapping, Data Quality Framework

---

### AG-DEA-009: Migration Specialist Agent

**Category**: Migration
**Type**: Agent

**Description**: Autonomous agent specialized in data pipeline and platform migrations.

**Capabilities**:
- Source system analysis
- Migration strategy design
- Data validation planning
- Parallel run coordination
- Rollback planning
- Performance comparison
- Risk assessment
- Cutover planning

**Personality Profile**:
- Risk-aware and cautious
- Thorough validation approach
- Clear communication of progress
- Contingency-focused planning

**Decision Authority**:
- Can design migration plans
- Can execute validation checks
- Requires approval for: cutover decisions, production switches

**Applicable Processes**: Pipeline Migration, Data Warehouse Setup

---

### AG-DEA-010: ML Feature Engineer Agent

**Category**: ML Engineering
**Type**: Agent

**Description**: Autonomous agent specialized in feature engineering and feature store management.

**Capabilities**:
- Feature discovery and design
- Feature pipeline development
- Online/offline serving
- Point-in-time correctness
- Feature monitoring
- Version management
- Feature documentation
- Performance optimization

**Personality Profile**:
- ML-aware perspective
- Production reliability focus
- Performance optimization mindset
- Collaborative with data scientists

**Decision Authority**:
- Can create features
- Can configure serving
- Requires approval for: feature deprecation, schema changes

**Applicable Processes**: Feature Store Setup, A/B Testing Pipeline, Streaming Pipeline

---

## Process-to-Skills/Agents Mapping

| Process | Primary Skills | Primary Agents | Supporting Skills |
|---------|---------------|----------------|-------------------|
| ETL/ELT Pipeline | SK-DEA-002, SK-DEA-013 | AG-DEA-005, AG-DEA-003 | SK-DEA-001, SK-DEA-005, SK-DEA-011 |
| Dimensional Model Design | SK-DEA-008, SK-DEA-016 | AG-DEA-006 | SK-DEA-004, SK-DEA-010 |
| dbt Project Setup | SK-DEA-003, SK-DEA-006 | AG-DEA-002 | SK-DEA-004, SK-DEA-010 |
| Data Quality Framework | SK-DEA-005, SK-DEA-006 | AG-DEA-003, AG-DEA-008 | SK-DEA-017 |
| Data Warehouse Setup | SK-DEA-004, SK-DEA-012 | AG-DEA-001 | SK-DEA-008, SK-DEA-009 |
| Metrics Layer | SK-DEA-009, SK-DEA-003 | AG-DEA-007 | SK-DEA-004 |
| A/B Testing Pipeline | SK-DEA-014, SK-DEA-005 | AG-DEA-003, AG-DEA-010 | SK-DEA-002 |
| Streaming Pipeline | SK-DEA-007, SK-DEA-018 | AG-DEA-004 | SK-DEA-001, SK-DEA-011 |
| Data Catalog | SK-DEA-017, SK-DEA-010 | AG-DEA-008 | SK-DEA-005 |
| BI Dashboard Development | SK-DEA-009, SK-DEA-004 | AG-DEA-007 | SK-DEA-020 |
| dbt Model Development | SK-DEA-003, SK-DEA-019 | AG-DEA-002 | SK-DEA-004, SK-DEA-016 |
| SCD Implementation | SK-DEA-016, SK-DEA-008 | AG-DEA-006, AG-DEA-002 | SK-DEA-003 |
| Incremental Model Setup | SK-DEA-019, SK-DEA-003 | AG-DEA-002 | SK-DEA-004 |
| OBT Creation | SK-DEA-020, SK-DEA-004 | AG-DEA-006, AG-DEA-007 | SK-DEA-008 |
| Pipeline Migration | SK-DEA-001, SK-DEA-011 | AG-DEA-009, AG-DEA-005 | SK-DEA-002, SK-DEA-012 |
| Query Optimization | SK-DEA-004, SK-DEA-012 | AG-DEA-001 | SK-DEA-020 |
| Data Lineage Mapping | SK-DEA-010, SK-DEA-017 | AG-DEA-008 | SK-DEA-003 |
| Feature Store Setup | SK-DEA-015, SK-DEA-018 | AG-DEA-010, AG-DEA-004 | SK-DEA-007 |

---

## Shared Candidates

The following skills and agents are candidates for sharing across multiple specializations:

### Cross-Specialization Skills

| Skill ID | Name | Applicable Specializations |
|----------|------|---------------------------|
| SK-DEA-004 | SQL Query Optimizer | Data Engineering, Backend Development, Database Administration |
| SK-DEA-005 | Data Quality Profiler | Data Engineering, Data Science, QA Testing |
| SK-DEA-010 | Data Lineage Mapper | Data Engineering, Data Governance, Compliance |
| SK-DEA-011 | Schema Evolution Manager | Data Engineering, Backend Development, API Development |
| SK-DEA-012 | Cost Optimizer | Data Engineering, DevOps, Cloud Architecture |
| SK-DEA-014 | A/B Test Statistical Analyzer | Data Engineering, Data Science, Product Analytics |

### Cross-Specialization Agents

| Agent ID | Name | Applicable Specializations |
|----------|------|---------------------------|
| AG-DEA-001 | Data Warehouse Architect Agent | Data Engineering, Cloud Architecture, Database Administration |
| AG-DEA-008 | Data Governance Steward Agent | Data Engineering, Compliance, Security |
| AG-DEA-009 | Migration Specialist Agent | Data Engineering, DevOps, Cloud Migration |

---

## Implementation Priority

### High Priority (Implement First)

These skills/agents provide the most value across the most processes:

1. **SK-DEA-003**: dbt Project Analyzer - Core to 4 processes
2. **SK-DEA-004**: SQL Query Optimizer - Core to 5 processes
3. **SK-DEA-005**: Data Quality Profiler - Core to 4 processes
4. **AG-DEA-002**: dbt Project Engineer Agent - Core to 4 processes
5. **AG-DEA-003**: Data Quality Engineer Agent - Core to 3 processes

### Medium Priority

These are important but have more focused applicability:

6. **SK-DEA-002**: Airflow DAG Analyzer
7. **SK-DEA-007**: Kafka Topic Designer
8. **SK-DEA-010**: Data Lineage Mapper
9. **AG-DEA-001**: Data Warehouse Architect Agent
10. **AG-DEA-005**: Data Orchestration Engineer Agent

### Lower Priority

These are specialized and should be implemented as needed:

11. **SK-DEA-001**: Apache Spark Optimizer
12. **SK-DEA-014**: A/B Test Statistical Analyzer
13. **SK-DEA-015**: Feature Engineering Optimizer
14. **AG-DEA-010**: ML Feature Engineer Agent

---

## Appendix: Technology Coverage Matrix

| Technology | Skills | Agents |
|------------|--------|--------|
| Apache Spark | SK-DEA-001 | AG-DEA-004 |
| Apache Airflow | SK-DEA-002 | AG-DEA-005 |
| dbt | SK-DEA-003, SK-DEA-019 | AG-DEA-002 |
| Apache Kafka | SK-DEA-007, SK-DEA-018 | AG-DEA-004 |
| Snowflake | SK-DEA-004, SK-DEA-012 | AG-DEA-001 |
| BigQuery | SK-DEA-004, SK-DEA-012 | AG-DEA-001 |
| Redshift | SK-DEA-004, SK-DEA-012 | AG-DEA-001 |
| Great Expectations | SK-DEA-006 | AG-DEA-003 |
| Looker | SK-DEA-009 | AG-DEA-007 |
| Tableau | SK-DEA-009 | AG-DEA-007 |
| Power BI | SK-DEA-009 | AG-DEA-007 |
| DataHub/Amundsen | SK-DEA-017 | AG-DEA-008 |
| Debezium (CDC) | SK-DEA-013 | AG-DEA-004 |
| Apache Flink | SK-DEA-018 | AG-DEA-004 |
| Feast (Feature Store) | SK-DEA-015 | AG-DEA-010 |

---

## Summary Statistics

- **Total Skills Defined**: 20
- **Total Agents Defined**: 10
- **Shared Candidates (Skills)**: 6
- **Shared Candidates (Agents)**: 3
- **Total Processes Covered**: 18

---

*Document Version: 1.0*
*Created: 2026-01-24*
*Specialization: Data Engineering & Analytics*
