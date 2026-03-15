# dbt Project Engineer Agent

An autonomous AI agent specialized in dbt (data build tool) project development, optimization, and best practices enforcement.

## Overview

The dbt Project Engineer Agent is your expert partner for all dbt-related tasks. It combines deep knowledge of dbt patterns, SQL optimization, and data modeling best practices to help you build and maintain high-quality data transformation projects.

## Quick Start

```bash
# Invoke for model development
/agent dbt-project-engineer "Create a staging model for our Salesforce opportunities data"

# Invoke for testing
/agent dbt-project-engineer "Add comprehensive tests to the orders fact table"

# Invoke for optimization
/agent dbt-project-engineer "Convert dim_products to incremental materialization"
```

## What This Agent Does

### Core Capabilities

| Task | Example |
|------|---------|
| **Model Development** | Create staging, intermediate, and mart models |
| **Testing** | Implement generic, singular, and custom tests |
| **Documentation** | Write model and column descriptions |
| **Incremental Design** | Set up efficient incremental models |
| **Macro Creation** | Build reusable Jinja macros |
| **Performance Tuning** | Optimize slow-running models |
| **CI/CD Setup** | Configure dbt Cloud or GitHub Actions |

### Example Interactions

**Creating a New Staging Model**

You: "Create a staging model for our PostgreSQL users table"

Agent:
```sql
-- models/staging/postgres/_postgres__sources.yml
version: 2
sources:
  - name: postgres
    database: "{{ env_var('POSTGRES_DATABASE') }}"
    schema: public
    tables:
      - name: users
        freshness:
          warn_after: {count: 24, period: hour}
          error_after: {count: 48, period: hour}
        loaded_at_field: updated_at

-- models/staging/postgres/stg_postgres__users.sql
with source as (
    select * from {{ source('postgres', 'users') }}
),

renamed as (
    select
        id as user_id,
        email,
        first_name,
        last_name,
        concat(first_name, ' ', last_name) as full_name,
        created_at,
        updated_at,
        is_active
    from source
)

select * from renamed
```

**Adding Tests**

You: "Add tests for the customer dimension"

Agent:
```yaml
models:
  - name: dim_customers
    description: Customer master dimension
    columns:
      - name: customer_id
        tests:
          - unique
          - not_null
      - name: customer_status
        tests:
          - accepted_values:
              values: ['active', 'inactive', 'churned']
      - name: email
        tests:
          - unique:
              where: "is_current = true"
```

**Optimizing Performance**

You: "My fct_events model is running for 2 hours, help optimize"

Agent analyzes and recommends:
1. Convert to incremental with merge strategy
2. Add partition pruning
3. Optimize join order
4. Create upstream intermediate model

## Personality and Approach

### Working Style

- **Methodical**: Follows structured approaches to model development
- **Educational**: Explains the "why" behind recommendations
- **Quality-focused**: Emphasizes testing and documentation
- **Pragmatic**: Balances ideal patterns with practical constraints

### Communication

- Provides clear explanations of dbt concepts
- References official documentation when relevant
- Suggests multiple approaches when appropriate
- Asks clarifying questions for business logic

## Decision Authority

### What the Agent Can Do Independently

- Create new models following existing project patterns
- Add tests to existing models
- Write documentation
- Create macros for common patterns
- Refactor SQL for readability
- Fix compilation errors
- Optimize query performance within existing structure

### What Requires Your Approval

- Changing materializations (e.g., view to table)
- Breaking schema changes
- Deleting models or tests
- Adding new package dependencies
- Major architectural changes
- Production deployment decisions

## Best Practices Enforced

### Project Structure

```
models/
  staging/          # Source-aligned, light transformations
  intermediate/     # Business logic, reusable components
  marts/            # Business-aligned, consumer-facing
    core/           # Shared dimensions and facts
    marketing/      # Department-specific marts
    finance/
```

### Naming Conventions

| Layer | Pattern | Example |
|-------|---------|---------|
| Staging | `stg_<source>__<entity>` | `stg_stripe__charges` |
| Intermediate | `int_<entity>_<verb>` | `int_orders_pivoted` |
| Mart - Fact | `fct_<entity>` | `fct_orders` |
| Mart - Dimension | `dim_<entity>` | `dim_products` |

### Testing Standards

Every production model includes:
- Unique test on primary key
- Not null test on primary key
- Relationship tests for foreign keys
- Accepted values for status/type columns

### Documentation Standards

- Every model has a description
- Critical columns are documented
- Complex logic is explained
- Examples provided where helpful

## Integration with Other Tools

### Related Skills

| Skill | How It's Used |
|-------|--------------|
| dbt Project Analyzer | Assess project health |
| SQL Query Optimizer | Optimize complex queries |
| Data Quality Profiler | Profile source data |
| Data Lineage Mapper | Map model dependencies |

### MCP Servers

Connect the dbt MCP server for enhanced capabilities:

```json
{
  "mcpServers": {
    "dbt": {
      "command": "npx",
      "args": ["-y", "@dbt-labs/dbt-mcp"]
    }
  }
}
```

## Common Tasks

### 1. New Model Development

```
"Create a fact table for orders combining orders and line items"
```

Agent will:
1. Create staging models if needed
2. Create intermediate model for joins
3. Create final fact table
4. Add tests and documentation
5. Suggest materialization strategy

### 2. Test Implementation

```
"Add comprehensive testing to our staging layer"
```

Agent will:
1. Analyze existing models
2. Add primary key tests
3. Add referential integrity tests
4. Add data quality tests
5. Document test coverage

### 3. Performance Optimization

```
"Our nightly dbt run takes 4 hours, help reduce it"
```

Agent will:
1. Identify slowest models
2. Recommend incremental strategies
3. Suggest model restructuring
4. Optimize SQL patterns
5. Configure Slim CI

### 4. Documentation Generation

```
"Document all models in the core mart"
```

Agent will:
1. Analyze model SQL
2. Write descriptions
3. Document columns
4. Add examples
5. Generate lineage docs

## Troubleshooting

### Common Issues

**Compilation Errors**

Agent approach:
1. Parse error message
2. Identify root cause
3. Fix the issue
4. Explain what went wrong

**Test Failures**

Agent approach:
1. Investigate failing records
2. Determine if data or test issue
3. Fix or update accordingly
4. Add regression prevention

**Performance Problems**

Agent approach:
1. Profile query execution
2. Identify bottlenecks
3. Recommend optimizations
4. Implement changes

## Feedback and Learning

The agent improves with context:

- Share your project's specific conventions
- Explain your business domain
- Provide feedback on suggestions
- Reference existing patterns you like

## References

- [dbt Documentation](https://docs.getdbt.com/)
- [dbt Best Practices](https://docs.getdbt.com/best-practices)
- [dbt Community Slack](https://community.getdbt.com/)
- [dbt Packages Hub](https://hub.getdbt.com/)

## Version

- **Current Version**: 1.0.0
- **Agent ID**: AG-DEA-002
- **Category**: Transformation
