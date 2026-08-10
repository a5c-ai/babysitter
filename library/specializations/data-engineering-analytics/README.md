# Data Engineering, Analytics, and BI Specialization

## Overview

The Data Engineering, Analytics, and BI specialization encompasses the end-to-end lifecycle of transforming raw data into actionable insights. This specialization bridges the gap between data collection and business decision-making, combining technical infrastructure (data engineering), analytical modeling (analytics engineering), and visualization (business intelligence).

## Flagship process — `data-product-lifecycle-workflow.js`

`data-product-lifecycle-workflow.js` is the spine of this directory: requirement + data-contract
definition → source discovery/profiling + lineage mapping → model/pipeline build → EXECUTED
data-quality and contract test families → two adversarial gates → policy-gated destructive
backfill, PII exposure, contract-breaking-change and production cutover → catalog/contract
publish → SLA + freshness monitoring → policy-gated irreversible dataset deprecation →
kip-backed `data-product` memory.

### Composition map — callable point-task stages (NOT superseded)

The 18 modules below are point tasks that build one model, one pipeline, one dashboard. The
flagship sequences them and adds the governance/gate/monitoring surface none of them owns
individually. It composes them **by name** through frozen lookup tables and **imports none of
them** — they remain independently callable stages.

| Composed module | Role in the lifecycle | Routed via |
| --- | --- | --- |
| `data-catalog.js` | Source discovery + the catalog/contract publish surface | `INGREDIENT_MODULES.catalog` |
| `data-lineage.js` | Upstream/downstream lineage map + the live consumer inventory | `INGREDIENT_MODULES.lineage` |
| `data-quality-framework.js` | The test-family spine (one run per family) | `INGREDIENT_MODULES.quality` |
| `data-warehouse-setup.js` | Target warehouse platform scaffold | `INGREDIENT_MODULES.warehouse` |
| `dbt-project-setup.js` | Transformation-project scaffold | `INGREDIENT_MODULES.dbtProject` |
| `metrics-layer.js` | Semantic metric definitions the reconciliation critic recomputes against | `INGREDIENT_MODULES.metrics` |
| `query-optimization.js` | Executed EXPLAIN/cost evidence before cutover | `INGREDIENT_MODULES.queryOptimization` |
| `dimensional-model.js` | Model pattern `dimensional` | `MODEL_PATTERN_MODULES` |
| `obt-creation.js` | Model pattern `obt` | `MODEL_PATTERN_MODULES` |
| `scd-implementation.js` | Model pattern `scd` | `MODEL_PATTERN_MODULES` |
| `incremental-model.js` | Model pattern `incremental` | `MODEL_PATTERN_MODULES` |
| `dbt-model-development.js` | Model pattern `dbt` (per-model authoring) | `MODEL_PATTERN_MODULES` |
| `etl-elt-pipeline.js` | Pipeline mode `batch` | `PIPELINE_MODE_MODULES` |
| `streaming-pipeline.js` | Pipeline mode `streaming` | `PIPELINE_MODE_MODULES` |
| `pipeline-migration.js` | Pipeline mode `migration` | `PIPELINE_MODE_MODULES` |
| `bi-dashboard.js` | Serving surface kind `dashboard` | `SERVING_SURFACE_MODULES` |
| `feature-store.js` | Serving surface kind `feature-store` | `SERVING_SURFACE_MODULES` |
| `ab-testing-pipeline.js` | Serving surface kind `experiment` | `SERVING_SURFACE_MODULES` |

Shape references: `methodologies/composition-open-source-data-validation/` (validation spine),
`methodologies/composition-saas-analytics-dashboard/` (serving/consumption end), and
`specializations/backend-development/backend-service-delivery.js` (overall delivery shape).

### Boundary vs `../mlops/model-lifecycle.js`

`model-lifecycle.js` owns the lifecycle **around a trained model artifact**: dataset-governance
intake for training sets, eval harness + executed eval runs, promotion between `MODEL_STAGES`,
drift monitoring, rollback and model retirement. `data-product-lifecycle-workflow` owns the
lifecycle of a **dataset / pipeline / published data contract**: contract definition, source
profiling, model+pipeline build, data-quality and contract test suites, backfill, production
cutover of consumers, freshness/SLA monitoring and dataset deprecation.

The two meet at exactly one seam and neither supersedes the other: a gold-tier data product
produced here (typically a feature-store or holdout serving surface) is a legitimate entry in
`model-lifecycle`'s `datasets` input, and `model-lifecycle`'s dataset-governance
lineage/consent/retention checks consume the lineage map and contract published here. This
process **never** trains, evaluates, promotes, or retires a model; `model-lifecycle` **never**
defines a data contract, profiles a source, runs a dbt/quality suite, or deprecates a dataset.

### Frozen tables (verbatim)

```js
PRODUCT_TIERS = ['bronze', 'silver', 'gold', 'platinum']

SOURCE_PROFILE_CHECKS = ['schema', 'volume', 'nullability', 'distribution', 'freshness']

TEST_FAMILIES = [
  'schema-contract',
  'row-count-reconciliation',
  'metric-value-reconciliation',
  'uniqueness-referential',
  'freshness-sla',
]

MODEL_PATTERN_MODULES = {
  dimensional: 'dimensional-model.js',
  obt:         'obt-creation.js',
  scd:         'scd-implementation.js',
  incremental: 'incremental-model.js',
  dbt:         'dbt-model-development.js',
}

SLA_BREACH_ROUTING = {
  SEV1: { escalationPath: 'immediate-remediation', escalationExpert: null },
  SEV2: { escalationPath: 'immediate-remediation', escalationExpert: null },
  SEV3: { escalationPath: 'remediation-choice',    escalationExpert: 'analytics-engineering-lead' },
  SEV4: { escalationPath: 'remediation-choice',    escalationExpert: 'analytics-engineering-lead' },
}
```

`TIER_POLICY` drives which families are mandatory and whether a serving surface is permitted:
`bronze` → `schema-contract` (no serving); `silver` → `schema-contract`,
`row-count-reconciliation`, `uniqueness-referential` (no serving); `gold` and `platinum` → all
five families, serving allowed. Declaring a `servingSurfaces` entry on a non-serving tier
**throws** at input validation — there is no silent downgrade.

### Policy-gated actions

| actionId (= breakpointId) | Expert | Phase | Irreversible? |
| --- | --- | --- | --- |
| `data-product.pii-field-exposure` | `data-privacy-officer` | P3.5 | No, but rejection fails the run closed |
| `data-product.destructive-backfill` | `data-platform-lead` | P5 | **Yes** — overwrites/deletes warehouse data |
| `data-product.contract-breaking-change` | `analytics-engineering-lead` | P5 | Yes for consumers — breaks the published contract |
| `data-product.production-cutover` | `data-platform-lead` | P5 | Yes — repoints live consumers |
| `data-product.dataset-deprecation` | `data-platform-lead` | P7 | **Yes** — drops a dataset with live consumers |

None of these carries `autoApproveAfterN`. Each executor (`backfill`, `cutover`, `deprecation`)
has exactly **one** call site, physically inside its `if (gate.approved === true)` block. A
rejection ends the branch with the state surfaced and the executor never invoked.

The single non-policy breakpoint is `dpl.sla.remediation-choice` (P6, SEV3/SEV4 only) — the
accept-and-fix-forward vs remediate-now call is genuinely ambiguous. SEV1/SEV2 route straight to
remediation.

### Quality gates

#### `dpl.correctness-and-reconciliation` (P4)

Three independent critics — `quality-suite-reexecution-critic`, `reconciliation-critic`,
`profile-recomputation-critic`. Demanded evidence: the critics must **re-execute** the quality
checks themselves, **re-compute** row counts and headline metric values against the source of
truth, and **re-compute** the P2 profile statistics from real sample data, citing the actual
query text and output plus `file:line` for every model/metric definition. A green dbt run
reported by the builder is not evidence; quoting the quality report is not evidence. The
characteristic failure of this domain is a silently **wrong answer**, not a crash.

#### `dpl.lineage-and-contract-conformance` (P4)

Three independent critics — `contract-conformance-critic`, `lineage-traversal-critic`,
`pii-classification-critic`. Demanded evidence: query the built product and prove every contract
field exists with the declared type/nullability/grain; traverse the lineage graph from each
contract field back to a profiled source column and forward to every declared consumer; inspect
actual (redacted) sample values and challenge every declared classification. Reading the contract
or the lineage document is not evidence.

Either gate failing means the `data-product.production-cutover` gate is **never raised**. Both
gates run sequentially (never nested inside a `ctx.parallel`, because each may raise an
escalation breakpoint), and both escalate to `owner` via
`<gateId>.gate-escalation` when the fix budget is exhausted.

### Inputs / outputs reference

See the `@inputs` / `@outputs` JSDoc blocks at the top of
`data-product-lifecycle-workflow.js` — they are the authoritative contract. Required:
`dataProduct { name, version, tier, owner }`, non-empty `sources`, `models`, `pipelines`,
`contractFields`, and `sla { freshnessMinutes, availabilityTarget }`. Optional:
`servingSurfaces`, `backfill`, `cutoverStrategy` (`dual-run` | `blue-green` | `in-place`,
default `dual-run`), `deprecation`, `maxFixAttempts` (2), `maxRemediationAttempts` (1),
`kipEnabled` (true), `kipDir` (`.a5c/kip`), `kipModel` (`sonnet`), `artifactsDir`.

No fallbacks anywhere: unknown tier / model pattern / pipeline mode / serving-surface kind /
field classification / cutover strategy / test family / SLA severity all **throw** naming the
source; a source that cannot be profiled **fails the run** rather than proceeding on an assumed
schema; an unresolved consumer inventory fails rather than assuming zero consumers.

### Usage

```js
await orchestrate('specializations/data-engineering-analytics/data-product-lifecycle-workflow', {
  dataProduct: {
    name: 'orders-gold',
    version: '2.0.0',
    tier: 'gold',
    owner: 'analytics-platform',
    warehouse: 'snowflake',
    publishedContractRef: 'contracts/orders-gold@1.4.0.md',
  },
  sources: [
    { name: 'raw_orders', uri: 'raw.public.orders', system: 'postgres-cdc', expectedGrain: 'one row per order' },
    { name: 'raw_customers', uri: 'raw.public.customers', system: 'postgres-cdc' },
  ],
  models: [
    { name: 'dim_customer', pattern: 'scd', grain: 'one row per customer version', sources: ['raw_customers'] },
    { name: 'fct_orders', pattern: 'dimensional', grain: 'one row per order', sources: ['raw_orders'] },
  ],
  pipelines: [{ name: 'orders_elt', mode: 'batch', schedule: '0 * * * *', models: ['dim_customer', 'fct_orders'] }],
  contractFields: [
    { field: 'order_id', type: 'string', classification: 'internal', semantics: 'natural order key' },
    { field: 'customer_email', type: 'string', classification: 'pii', semantics: 'contact address' },
  ],
  servingSurfaces: [{ name: 'orders-exec-dashboard', kind: 'dashboard' }],
  sla: { freshnessMinutes: 60, availabilityTarget: 0.999, completenessTarget: 0.995 },
  backfill: { requested: true, window: '2024-01-01/2024-06-30', destructive: true },
  cutoverStrategy: 'blue-green',
});
```

### Non-interactive runs

Every policy gate in this process is fail-closed: with no approver present the run ends with the
state surfaced and no executor invoked. `autoApprovals` is **always** present in the output
(possibly empty) so any harness-level auto-approval of a policy-gated breakpoint is visible in the
result rather than silent. Do not add `autoApproveAfterN` to make a non-interactive run proceed —
a destructive backfill, a PII exposure, a production cutover and a dataset deprecation must never
auto-approve.

## Core Roles

### Data Engineer

**Primary Responsibilities**:
- Design and build scalable data pipelines and infrastructure
- Implement ETL/ELT processes for data ingestion and transformation
- Manage data warehouse and data lake architectures
- Ensure data quality, reliability, and performance
- Optimize data storage and compute resources
- Implement data governance and security controls

**Key Skills**:
- Programming: Python, SQL, Scala, Java
- Big Data: Spark, Hadoop, Kafka, Flink
- Cloud Platforms: AWS, GCP, Azure
- Orchestration: Airflow, Prefect, Dagster
- Data Warehouses: Snowflake, BigQuery, Redshift
- Version Control: Git, CI/CD pipelines
- Data Modeling: Dimensional modeling, normalization

**Typical Tasks**:
- Build batch and streaming data pipelines
- Optimize query performance and data models
- Implement data quality checks and monitoring
- Migrate legacy systems to modern data platforms
- Automate data workflows and deployments
- Collaborate with data scientists and analysts on data needs

**Career Path**:
Junior Data Engineer → Data Engineer → Senior Data Engineer → Staff/Principal Data Engineer → Data Engineering Manager/Director

### Analytics Engineer

**Primary Responsibilities**:
- Transform raw data into clean, modeled datasets for analysis
- Build and maintain data models (dimensional, denormalized)
- Implement data quality tests and documentation
- Create reusable metrics and business logic
- Bridge the gap between data engineering and analytics
- Enable self-service analytics through well-modeled data

**Key Skills**:
- SQL (advanced): CTEs, window functions, optimization
- dbt: Modeling, testing, documentation, packages
- Data Modeling: Star schema, snowflake schema, OBT
- Version Control: Git workflows, pull requests
- Data Warehouses: Snowflake, BigQuery, Redshift
- Data Quality: Great Expectations, dbt tests
- Business Acumen: Understanding of business metrics and KPIs

**Typical Tasks**:
- Build dbt models (staging, intermediate, fact, dimension)
- Implement data quality tests and monitors
- Document data models and lineage
- Define and standardize business metrics
- Optimize model performance and costs
- Collaborate with analysts on data requirements

**Career Path**:
Analytics Engineer → Senior Analytics Engineer → Staff Analytics Engineer → Analytics Engineering Manager

**dbt Workflow**:
```sql
-- Example: Staging model (stg_orders.sql)
with source as (
    select * from {{ source('ecommerce', 'raw_orders') }}
),

cleaned as (
    select
        order_id,
        customer_id,
        cast(order_date as date) as order_date,
        order_total,
        order_status
    from source
    where order_id is not null
)

select * from cleaned
```

### BI Developer / Analyst

**Primary Responsibilities**:
- Design and build dashboards and reports
- Create data visualizations for business stakeholders
- Perform ad-hoc analysis and exploratory data analysis
- Translate business requirements into technical specifications
- Implement row-level security and access controls
- Train business users on self-service analytics tools

**Key Skills**:
- BI Tools: Tableau, Power BI, Looker, Metabase
- SQL: Querying and analysis
- Data Visualization: Chart selection, design principles
- Business Intelligence: KPIs, metrics, reporting
- Communication: Presenting insights to stakeholders
- Statistics: Descriptive statistics, basic inference

**Typical Tasks**:
- Build executive dashboards and operational reports
- Perform root cause analysis on business metrics
- Create ad-hoc reports for business questions
- Optimize dashboard performance
- Implement data governance in BI tools
- Conduct user training and support

**Career Path**:
BI Analyst → Senior BI Analyst → BI Developer → Senior BI Developer → BI Manager/Lead

## Data Pipelines

### Pipeline Architecture Patterns

#### ETL (Extract, Transform, Load)
- **Flow**: Source → Transform (staging) → Load (warehouse)
- **Use Cases**: Data cleaning, complex transformations, on-premise systems
- **Tools**: Informatica, Talend, SSIS, custom scripts
- **Pros**: Data validated before loading, reduced warehouse load
- **Cons**: Longer latency, transformation bottleneck

#### ELT (Extract, Load, Transform)
- **Flow**: Source → Load (warehouse) → Transform (in warehouse)
- **Use Cases**: Cloud data warehouses with powerful compute
- **Tools**: Fivetran + dbt, Stitch + dbt, Airbyte + dbt
- **Pros**: Faster ingestion, leverage warehouse compute, flexibility
- **Cons**: Raw data in warehouse, transformation costs

#### Lambda Architecture
- **Components**: Batch layer + Speed layer + Serving layer
- **Use Cases**: Real-time and historical analytics
- **Challenge**: Maintaining two codebases (batch and streaming)

#### Kappa Architecture
- **Components**: Stream processing only
- **Use Cases**: Everything as a stream, unified pipeline
- **Tools**: Kafka + Flink/Spark Streaming

### Pipeline Orchestration

#### Workflow Management
- **Airflow DAGs**: Task dependencies, scheduling, monitoring
- **Prefect Flows**: Dynamic workflows, parameterization
- **Dagster**: Asset-based orchestration, type system
- **Step Functions**: Serverless workflow on AWS
- **Temporal**: Durable execution, long-running workflows

#### Best Practices
- **Idempotency**: Pipelines produce same output given same input
- **Incremental Processing**: Process only new/changed data
- **Backfilling**: Ability to reprocess historical data
- **Monitoring**: Track pipeline health, data quality, SLAs
- **Alerting**: Notify on failures, delays, quality issues
- **Testing**: Unit tests, integration tests, data validation
- **Documentation**: Pipeline purpose, dependencies, SLAs

### Data Pipeline Layers

#### Bronze Layer (Raw)
- Exact copy of source data
- Minimal transformation (type casting, column renaming)
- Full history preserved
- Schema-on-read

#### Silver Layer (Cleaned)
- Cleaned and conformed data
- Deduplicated, validated
- Standardized formats
- Type 2 SCD for history

#### Gold Layer (Business)
- Business-level aggregations
- Fact and dimension tables
- Metrics and KPIs
- Optimized for reporting

## Data Modeling

### Dimensional Modeling (Kimball Methodology)

#### Star Schema
```
Fact Table (Center):
- fact_sales
  - sale_id (PK)
  - date_id (FK)
  - customer_id (FK)
  - product_id (FK)
  - store_id (FK)
  - quantity
  - amount
  - cost

Dimension Tables (Points):
- dim_date
  - date_id (PK)
  - date
  - day_of_week
  - month
  - quarter
  - year

- dim_customer
  - customer_id (PK)
  - customer_name
  - segment
  - region

- dim_product
  - product_id (PK)
  - product_name
  - category
  - brand

- dim_store
  - store_id (PK)
  - store_name
  - city
  - state
```

#### Fact Table Types
- **Transaction Facts**: One row per transaction (sales, orders)
- **Periodic Snapshot Facts**: Regular intervals (daily inventory)
- **Accumulating Snapshot Facts**: Lifecycle events (order fulfillment)
- **Factless Facts**: Event tracking without measures (attendance)

#### Slowly Changing Dimensions (SCD)

**Type 0**: No changes allowed (immutable)

**Type 1**: Overwrite (no history)
```sql
UPDATE dim_customer
SET city = 'New York'
WHERE customer_id = 123;
```

**Type 2**: Add new row (full history)
```sql
-- Current record
customer_id | name    | city       | valid_from | valid_to   | is_current
123        | John    | Boston     | 2020-01-01 | 2023-05-15 | FALSE
123        | John    | New York   | 2023-05-16 | 9999-12-31 | TRUE
```

**Type 3**: Add new column (limited history)
```sql
customer_id | name | current_city | previous_city
123        | John | New York     | Boston
```

**Type 6**: Hybrid (1+2+3)

### Data Vault Modeling

**Purpose**: Scalable, auditable, flexible modeling for enterprise data warehouses

**Core Components**:

1. **Hubs**: Business keys
```sql
hub_customer:
- hub_customer_id (PK, surrogate key)
- customer_id (business key)
- load_timestamp
- record_source
```

2. **Links**: Many-to-many relationships
```sql
link_customer_order:
- link_customer_order_id (PK)
- hub_customer_id (FK)
- hub_order_id (FK)
- load_timestamp
- record_source
```

3. **Satellites**: Descriptive attributes with history
```sql
sat_customer_details:
- hub_customer_id (PK, FK)
- load_timestamp (PK)
- customer_name
- email
- city
- hash_diff (for change detection)
- record_source
```

**Benefits**:
- Audit trail and full history
- Parallel loading from multiple sources
- Flexible for changing requirements
- Separates business keys from attributes

**Challenges**:
- Complex queries (many joins)
- Requires intermediate layer for BI
- Steeper learning curve

### One Big Table (OBT)

**Concept**: Denormalized, wide table with all relevant attributes and metrics

**Use Cases**:
- Cloud data warehouses (cheap storage, fast compute)
- Self-service analytics (simpler queries)
- BI tool performance (fewer joins)

**Example**:
```sql
create table obt_sales as
select
    s.sale_id,
    s.sale_date,
    s.quantity,
    s.amount,
    c.customer_name,
    c.customer_segment,
    c.customer_region,
    p.product_name,
    p.product_category,
    p.product_brand,
    st.store_name,
    st.store_city,
    st.store_state
from fact_sales s
join dim_customer c on s.customer_id = c.customer_id
join dim_product p on s.product_id = p.product_id
join dim_store st on s.store_id = st.store_id;
```

**Trade-offs**:
- Pros: Fast queries, simple for analysts, fewer joins
- Cons: Data duplication, higher storage costs, update complexity

## Metrics and KPIs

### Metric Types

#### Business Metrics
- **Revenue Metrics**: MRR, ARR, revenue growth
- **Customer Metrics**: CAC, LTV, churn rate, retention rate
- **Product Metrics**: DAU, MAU, engagement rate, feature adoption
- **Operational Metrics**: Conversion rate, cart abandonment, fulfillment time

#### Data Quality Metrics
- **Freshness**: Time since last update
- **Completeness**: Percentage of null values
- **Accuracy**: Data matches source of truth
- **Consistency**: Same value across systems

### Metrics Layer

**Purpose**: Centralized definition of business metrics

**Benefits**:
- Single source of truth
- Consistent calculations across tools
- Reusability across dashboards and reports
- Governance and documentation

**Implementation**:
- **dbt Metrics**: Define metrics in YAML
- **Looker LookML**: Measures and dimensions
- **Cube.js**: Headless BI semantic layer
- **MetricFlow**: dbt semantic layer (acquired by dbt Labs)
- **Supergrain**: Metrics catalog and lineage

**Example (dbt Metrics)**:
```yaml
# models/metrics.yml
metrics:
  - name: total_revenue
    label: Total Revenue
    model: ref('fct_sales')
    calculation_method: sum
    expression: amount
    timestamp: order_date
    time_grains: [day, week, month, quarter, year]
    dimensions:
      - customer_segment
      - product_category
```

### Metric Governance

- **Naming Conventions**: Clear, descriptive names
- **Documentation**: Business definition, calculation logic
- **Ownership**: Assign metric owners
- **Versioning**: Track changes to metric definitions
- **Validation**: Compare against known values
- **Lineage**: Track metric dependencies

## Experimentation

### A/B Testing Framework

#### Experiment Design
1. **Hypothesis**: What are we testing and why?
2. **Success Metrics**: Primary and secondary metrics
3. **Guardrail Metrics**: Metrics that shouldn't degrade
4. **Randomization Unit**: User, session, or request
5. **Traffic Allocation**: Percentage per variant
6. **Duration**: How long to run the experiment

#### Statistical Concepts

**Sample Size Calculation**:
```
n = (Z_α/2 + Z_β)² × (σ₁² + σ₂²) / (μ₁ - μ₂)²

Where:
- Z_α/2: Critical value for significance level (e.g., 1.96 for 95%)
- Z_β: Critical value for power (e.g., 0.84 for 80%)
- σ: Standard deviation
- μ: Mean values
- MDE: Minimum detectable effect (μ₁ - μ₂)
```

**Statistical Power**: Probability of detecting an effect when it exists (typically 80%)

**Significance Level (α)**: Probability of false positive (typically 5%)

**P-value**: Probability of observing results if null hypothesis is true

#### Experimentation Platform Components

1. **Feature Flagging**: Control which users see which variant
2. **Assignment Service**: Consistent user bucketing
3. **Metrics Pipeline**: Collect and aggregate metrics
4. **Analysis Engine**: Statistical testing and visualization
5. **Reporting Dashboard**: Results and insights

#### Common Pitfalls

- **Peeking**: Checking results before experiment completes
- **Sample Ratio Mismatch (SRM)**: Uneven traffic split indicates bug
- **Novelty Effect**: Initial excitement skews results
- **Multiple Testing**: Testing many metrics increases false positives
- **Selection Bias**: Non-random assignment
- **Carryover Effects**: Previous experiments affect current one

### Multi-Armed Bandit

**Concept**: Adaptive allocation that shifts traffic to better-performing variants

**Thompson Sampling**:
- Bayesian approach
- Balances exploration and exploitation
- Faster convergence than pure A/B testing

**Use Cases**:
- Content recommendation
- Ad optimization
- Email subject line testing
- Lower risk than fixed A/B test

## Integration with Data Science and ML

### Data Engineering for ML

#### Feature Store
**Purpose**: Centralized repository for ML features

**Benefits**:
- Feature reusability across models
- Consistent feature engineering
- Online and offline feature serving
- Feature versioning and lineage

**Tools**:
- **Feast**: Open-source feature store
- **Tecton**: Managed feature platform
- **AWS SageMaker Feature Store**
- **Google Vertex AI Feature Store**
- **Databricks Feature Store**

**Example**:
```python
# Define feature view
@feature_view(
    entities=[customer],
    ttl=timedelta(days=1),
    online=True,
    batch_source=BigQuerySource(
        table="project.dataset.customer_features"
    )
)
def customer_features_fv():
    return Field("total_purchases", Int64)
```

#### ML Pipeline Integration

**Training Pipeline**:
1. **Data Extraction**: Pull data from warehouse
2. **Feature Engineering**: Transform raw data into features
3. **Training**: Train model on features
4. **Validation**: Evaluate model performance
5. **Model Registry**: Store trained model

**Inference Pipeline**:
1. **Feature Retrieval**: Get features from feature store
2. **Model Serving**: Load model and make predictions
3. **Prediction Storage**: Store predictions in warehouse
4. **Monitoring**: Track model performance and drift

### Analytics for Model Evaluation

**Model Metrics**:
- **Classification**: Accuracy, precision, recall, F1, AUC-ROC
- **Regression**: RMSE, MAE, R², MAPE
- **Ranking**: NDCG, MAP, MRR

**Model Monitoring**:
- **Data Drift**: Input feature distribution changes
- **Concept Drift**: Relationship between features and target changes
- **Prediction Drift**: Model output distribution changes
- **Performance Degradation**: Metrics decline over time

**Tools**:
- **Evidently AI**: ML monitoring and testing
- **Whylabs**: Data and ML monitoring
- **Arize**: ML observability
- **Fiddler**: ML monitoring and explainability

### BI for ML Insights

**ML Dashboards**:
- Model performance over time
- Feature importance and distributions
- Prediction distribution and statistics
- Error analysis and edge cases
- A/B test results for new models

**Business Impact**:
- Revenue impact of ML models
- Cost savings from automation
- User engagement improvements
- Operational efficiency gains

## Data Stack Examples

### Modern Data Stack (Cloud)

**Ingestion**: Fivetran / Airbyte
↓
**Storage**: Snowflake / BigQuery / Redshift
↓
**Transformation**: dbt
↓
**BI**: Tableau / Looker / Power BI
↓
**Orchestration**: Airflow / Prefect
↓
**Monitoring**: Monte Carlo / Datafold

### Real-Time Analytics Stack

**Streaming**: Kafka / Kinesis
↓
**Processing**: Flink / Spark Streaming
↓
**Storage**: ClickHouse / Druid
↓
**Visualization**: Grafana / Superset

### ML Platform Stack

**Data**: Data Warehouse (Snowflake)
↓
**Features**: Feature Store (Feast/Tecton)
↓
**Training**: Databricks / SageMaker
↓
**Serving**: SageMaker / Vertex AI
↓
**Monitoring**: Evidently AI / Arize

## Best Practices

### Data Engineering
- Design idempotent and rerunnable pipelines
- Implement comprehensive data quality checks
- Monitor pipeline health and data freshness
- Use version control for all pipeline code
- Document data sources, transformations, and SLAs
- Optimize for cost and performance
- Implement proper error handling and retries

### Analytics Engineering
- Follow dbt best practices (staging, intermediate, marts)
- Test all critical business logic
- Document models and columns thoroughly
- Use consistent naming conventions
- Leverage incremental models for large datasets
- Implement code reviews for model changes
- Monitor model performance and costs

### Business Intelligence
- Design dashboards for the audience
- Optimize for performance (aggregations, extracts)
- Implement proper access controls
- Provide context and documentation in dashboards
- Use appropriate visualizations for data types
- Monitor dashboard usage and performance
- Gather feedback from business users

### Cross-Functional Collaboration
- Establish data contracts between teams
- Define SLAs for data availability and quality
- Regular sync meetings between data teams
- Shared documentation and knowledge base
- Consistent tooling and standards
- Clear ownership and accountability

## Career Development

### Learning Path

**Beginner**:
- SQL fundamentals and query optimization
- Basic Python/scripting
- Data warehouse concepts
- BI tool basics (Tableau/Power BI)
- Version control (Git)

**Intermediate**:
- Advanced SQL (window functions, CTEs, optimization)
- dbt for transformation
- Data modeling (dimensional, normalization)
- Airflow or similar orchestration
- Cloud data platforms (Snowflake/BigQuery)
- Data quality frameworks

**Advanced**:
- Streaming data (Kafka, Flink)
- Distributed systems concepts
- Data architecture and system design
- ML integration and feature stores
- Infrastructure as code (Terraform)
- Team leadership and mentorship

### Key Competencies

**Technical**:
- SQL mastery
- Programming (Python, Scala, Java)
- Cloud platforms
- Data modeling
- ETL/ELT development
- Performance optimization

**Business**:
- Domain knowledge
- Stakeholder management
- Requirement gathering
- Communication and presentation
- Project management
- Strategic thinking

**Soft Skills**:
- Problem-solving
- Collaboration
- Documentation
- Teaching and mentoring
- Adaptability
- Attention to detail

## See Also

- [references.md](./references.md) - Comprehensive tool and framework references
- [../methodologies/](../methodologies/) - Process methodologies for data projects
