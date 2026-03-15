# Data Engineering, Analytics, and BI - References

## ETL/ELT Tools

### Apache Airflow
- **Purpose**: Workflow orchestration platform for data engineering pipelines
- **Key Features**: DAG-based workflows, extensive operator library, distributed execution
- **Use Cases**: Batch data pipelines, scheduled jobs, complex dependency management
- **Documentation**: https://airflow.apache.org/
- **Best Practices**:
  - Use TaskGroups for logical grouping
  - Implement idempotent tasks
  - Leverage XComs for task communication
  - Monitor with built-in metrics and alerting

### dbt (Data Build Tool)
- **Purpose**: SQL-based transformation tool for analytics engineering
- **Key Features**: Modular SQL, testing, documentation, version control
- **Use Cases**: Data transformation, analytics engineering, data modeling
- **Documentation**: https://docs.getdbt.com/
- **Best Practices**:
  - Follow naming conventions (stg_, int_, fct_, dim_)
  - Implement data quality tests
  - Document models and columns
  - Use incremental models for large datasets

### Fivetran
- **Purpose**: Automated data integration platform
- **Key Features**: Pre-built connectors, automatic schema detection, incremental sync
- **Use Cases**: SaaS data ingestion, database replication, API integration
- **Documentation**: https://fivetran.com/docs
- **Considerations**: Cost based on MAR (Monthly Active Rows), limited transformation capabilities

### Additional ETL/ELT Tools
- **Stitch**: Simple data integration (now part of Talend)
- **Talend**: Open-source and enterprise data integration
- **Apache NiFi**: Data flow automation with visual interface
- **Informatica**: Enterprise data integration platform
- **Matillion**: Cloud-native ETL for data warehouses
- **AWS Glue**: Serverless ETL service on AWS
- **Azure Data Factory**: Cloud ETL/ELT service on Azure
- **Google Cloud Dataflow**: Stream and batch data processing

## Data Warehousing

### Snowflake
- **Architecture**: Cloud-native, multi-cluster shared data architecture
- **Key Features**: Automatic scaling, time travel, zero-copy cloning, data sharing
- **Use Cases**: Enterprise data warehousing, data lakes, data applications
- **Documentation**: https://docs.snowflake.com/
- **Cost Model**: Compute (credits) + storage (per TB)
- **Best Practices**:
  - Use warehouse sizing appropriately
  - Leverage clustering keys for large tables
  - Implement proper RBAC
  - Monitor query performance with query profiling

### Google BigQuery
- **Architecture**: Serverless, columnar storage with distributed query engine
- **Key Features**: SQL interface, ML integration, real-time analytics, petabyte scale
- **Use Cases**: Analytics, log analysis, ML workflows, streaming analytics
- **Documentation**: https://cloud.google.com/bigquery/docs
- **Cost Model**: On-demand queries (per TB scanned) or flat-rate slots
- **Best Practices**:
  - Partition and cluster tables
  - Use materialized views for common aggregations
  - Avoid SELECT *
  - Leverage BI Engine for caching

### Amazon Redshift
- **Architecture**: MPP (Massively Parallel Processing) columnar database
- **Key Features**: SQL interface, spectrum for S3 queries, ML integration
- **Use Cases**: Enterprise data warehousing, BI analytics, data lake queries
- **Documentation**: https://docs.aws.amazon.com/redshift/
- **Cost Model**: Node-based pricing (compute + storage)
- **Best Practices**:
  - Choose appropriate distribution and sort keys
  - Use COPY for bulk loading
  - Vacuum and analyze tables regularly
  - Monitor with CloudWatch and query monitoring rules

### Additional Data Warehouses
- **Azure Synapse Analytics**: Unified analytics platform
- **Databricks SQL**: Lakehouse platform with SQL analytics
- **ClickHouse**: Fast OLAP database for real-time analytics
- **Apache Druid**: Real-time analytics database
- **Teradata**: Enterprise data warehouse
- **Oracle Autonomous Database**: Self-managing cloud database

## Streaming Data

### Apache Kafka
- **Purpose**: Distributed event streaming platform
- **Key Features**: High throughput, fault tolerance, pub-sub and queue semantics
- **Use Cases**: Event streaming, log aggregation, CDC, real-time pipelines
- **Documentation**: https://kafka.apache.org/documentation/
- **Ecosystem**:
  - Kafka Connect: Integration framework
  - Kafka Streams: Stream processing library
  - ksqlDB: SQL streaming database
- **Best Practices**:
  - Design proper partition strategies
  - Monitor consumer lag
  - Use schema registry for data governance
  - Implement idempotent producers

### Apache Flink
- **Purpose**: Stream processing framework for stateful computations
- **Key Features**: Event time processing, exactly-once semantics, low latency
- **Use Cases**: Real-time analytics, event-driven applications, CEP
- **Documentation**: https://flink.apache.org/
- **Best Practices**:
  - Use watermarks for event time processing
  - Implement checkpointing for fault tolerance
  - Design proper state management
  - Monitor backpressure

### Additional Streaming Tools
- **Apache Spark Streaming**: Micro-batch stream processing
- **Apache Storm**: Real-time computation system
- **AWS Kinesis**: Managed streaming data service
- **Google Cloud Pub/Sub**: Messaging and event ingestion
- **Azure Event Hubs**: Event ingestion service
- **Confluent Cloud**: Managed Kafka platform
- **Redpanda**: Kafka-compatible streaming platform
- **Apache Pulsar**: Multi-tenant messaging and streaming

## BI and Visualization Tools

### Tableau
- **Purpose**: Visual analytics and business intelligence platform
- **Key Features**: Drag-and-drop interface, interactive dashboards, advanced analytics
- **Use Cases**: Executive dashboards, self-service analytics, data exploration
- **Documentation**: https://help.tableau.com/
- **Best Practices**:
  - Optimize data extracts vs live connections
  - Use parameters for dynamic filtering
  - Implement row-level security
  - Design for performance with aggregations

### Looker (Google Cloud)
- **Purpose**: Modern BI platform with modeling layer (LookML)
- **Key Features**: Git-based modeling, embedded analytics, data governance
- **Use Cases**: Self-service analytics, embedded BI, governed data access
- **Documentation**: https://cloud.google.com/looker/docs
- **Best Practices**:
  - Define reusable dimensions and measures in LookML
  - Implement proper access controls
  - Use persistent derived tables for complex logic
  - Version control LookML with Git

### Additional BI Tools
- **Power BI**: Microsoft's BI platform with Office integration
- **Metabase**: Open-source BI tool, user-friendly
- **Apache Superset**: Open-source data exploration platform
- **Mode Analytics**: Collaborative analytics platform
- **Sisense**: Embedded analytics platform
- **Qlik Sense**: Associative analytics engine
- **ThoughtSpot**: Search-driven analytics
- **Domo**: Cloud-based BI platform
- **Grafana**: Observability and monitoring dashboards
- **Redash**: Open-source data visualization

## A/B Testing Frameworks

### Experimentation Platforms
- **Optimizely**: Full-stack experimentation platform
- **LaunchDarkly**: Feature management and experimentation
- **Split.io**: Feature delivery platform with experimentation
- **GrowthBook**: Open-source feature flagging and A/B testing
- **Statsig**: Modern experimentation platform
- **VWO**: Website optimization and testing
- **Google Optimize**: Website testing (deprecated, moved to GA4)

### Statistical Methods
- **Frequentist A/B Testing**: Traditional hypothesis testing with p-values
- **Bayesian A/B Testing**: Probability-based approach with credible intervals
- **Sequential Testing**: Early stopping with controlled error rates
- **Multi-Armed Bandit**: Adaptive allocation based on performance
- **CUPED (Controlled-experiment Using Pre-Experiment Data)**: Variance reduction

### Key Concepts
- **Minimum Detectable Effect (MDE)**: Smallest effect size worth detecting
- **Statistical Power**: Probability of detecting an effect when it exists
- **Sample Size Calculation**: Determining required traffic for significance
- **Multiple Testing Correction**: Bonferroni, Benjamini-Hochberg for multiple comparisons
- **Randomization Units**: User, session, or page-level assignment
- **Guardrail Metrics**: Metrics that should not degrade

### Implementation Best Practices
- Define success metrics and guardrails upfront
- Calculate required sample size before launching
- Monitor sample ratio mismatch (SRM)
- Implement proper randomization and bucketing
- Track metric movement over time (novelty effects)
- Document experiment hypotheses and results

## Data Quality

### Data Quality Frameworks

#### Great Expectations
- **Purpose**: Data validation and documentation framework
- **Key Features**: Expectation suites, profiling, data docs
- **Use Cases**: Pipeline validation, data contracts, documentation
- **Documentation**: https://docs.greatexpectations.io/
- **Example Checks**:
  - Column value ranges
  - Null rates
  - Uniqueness constraints
  - Schema validation

#### dbt Tests
- **Purpose**: Built-in data quality testing in dbt
- **Test Types**:
  - Generic tests (unique, not_null, relationships, accepted_values)
  - Singular tests (custom SQL assertions)
  - Custom schema tests
- **Best Practices**: Test critical business logic and data contracts

#### Monte Carlo
- **Purpose**: Data observability platform
- **Key Features**: Automated anomaly detection, lineage, incident management
- **Use Cases**: Data downtime monitoring, pipeline health, alerting

#### Additional Tools
- **Soda**: Data quality testing and monitoring
- **Datafold**: Data diff and quality monitoring
- **Anomalo**: ML-based data quality monitoring
- **Apache Griffin**: Data quality solution for big data
- **Talend Data Quality**: Profiling and cleansing

### Data Quality Dimensions

1. **Accuracy**: Data correctly represents reality
2. **Completeness**: All required data is present
3. **Consistency**: Data is consistent across systems
4. **Timeliness**: Data is available when needed
5. **Validity**: Data conforms to business rules and formats
6. **Uniqueness**: No duplicate records exist

### Data Quality Patterns

#### Data Contracts
- Define explicit agreements between data producers and consumers
- Specify schema, freshness, quality thresholds
- Tools: dbt contracts, Great Expectations, Protobuf schemas

#### Data Observability
- Monitor data pipeline health and data quality
- Track freshness, volume, schema changes, distribution
- Alert on anomalies and data incidents

#### Data Lineage
- Track data flow from source to consumption
- Understand upstream and downstream dependencies
- Tools: Marquez, DataHub, Apache Atlas, Amundsen

#### Data Profiling
- Automated discovery of data characteristics
- Statistical analysis of columns and distributions
- Identify quality issues early

### Implementation Best Practices
- Shift-left: Test data quality early in pipelines
- Implement monitoring at multiple pipeline stages
- Define SLAs for data freshness and quality
- Automate alerts and incident response
- Document data contracts and expectations
- Regular data quality audits and reviews

## Data Modeling

### Dimensional Modeling (Kimball)
- **Fact Tables**: Measurements, metrics, events
- **Dimension Tables**: Descriptive attributes, context
- **Star Schema**: Facts surrounded by dimensions
- **Snowflake Schema**: Normalized dimensions
- **Slowly Changing Dimensions (SCD)**: Type 0, 1, 2, 3, 4, 6

### Data Vault (Scalable modeling)
- **Hub**: Business keys
- **Link**: Relationships between hubs
- **Satellite**: Descriptive attributes with history
- **Benefits**: Auditability, scalability, flexibility

### One Big Table (OBT)
- Denormalized wide tables for BI performance
- Common in cloud data warehouses
- Trade storage for query performance

## Additional Resources

### Learning Resources
- **The Data Warehouse Toolkit** (Ralph Kimball)
- **Designing Data-Intensive Applications** (Martin Kleppmann)
- **Fundamentals of Data Engineering** (Joe Reis, Matt Housley)
- **Data Pipelines Pocket Reference** (James Densmore)

### Communities
- dbt Community (Slack)
- Locally Optimistic (Data community)
- Data Engineering Weekly (Newsletter)
- DataTalks.Club
- Data Council conferences

### Certifications
- Snowflake SnowPro Certifications
- Google Cloud Professional Data Engineer
- AWS Certified Data Analytics
- dbt Analytics Engineering Certification
- Databricks Certified Data Engineer

### Open Standards
- **Apache Arrow**: Columnar memory format
- **Apache Parquet**: Columnar storage format
- **Apache Avro**: Row-based serialization
- **Delta Lake**: Open table format with ACID
- **Apache Iceberg**: Table format for large datasets
- **Apache Hudi**: Incremental data processing
