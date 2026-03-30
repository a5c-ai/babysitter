# Code Migration/Modernization - Skills and Agents Backlog

This document catalogs specialized skills and agents (subagents) that would enhance the Code Migration/Modernization processes beyond general-purpose capabilities. These components are designed to integrate with the Babysitter SDK orchestration framework.

## Overview

**Specialization**: Code Migration/Modernization
**Phase**: 4 - Skills and Agents Identification
**Total Skills Identified**: 42
**Total Agents Identified**: 38
**Shared/Cross-Cutting Candidates**: 15

---

## Table of Contents

1. [Skills Backlog](#skills-backlog)
   - [Code Analysis Skills](#code-analysis-skills)
   - [Dependency Management Skills](#dependency-management-skills)
   - [Refactoring Skills](#refactoring-skills)
   - [Legacy System Analysis Skills](#legacy-system-analysis-skills)
   - [Framework Migration Skills](#framework-migration-skills)
   - [Database Migration Skills](#database-migration-skills)
   - [API Modernization Skills](#api-modernization-skills)
   - [Cloud Migration Skills](#cloud-migration-skills)
   - [Testing and Validation Skills](#testing-and-validation-skills)

2. [Agents Backlog](#agents-backlog)
   - [Assessment Agents](#assessment-agents)
   - [Migration Execution Agents](#migration-execution-agents)
   - [Quality Assurance Agents](#quality-assurance-agents)
   - [Infrastructure Agents](#infrastructure-agents)

3. [Shared/Cross-Cutting Components](#sharedcross-cutting-components)

4. [Integration Matrix](#integration-matrix)

---

## Skills Backlog

### Code Analysis Skills

#### 1. static-code-analyzer
**Purpose**: Deep static analysis of codebases for quality, complexity, and migration readiness
**Processes**: legacy-codebase-assessment, code-refactoring, technical-debt-remediation
**Capabilities**:
- Cyclomatic complexity measurement
- Code duplication detection (clone detection)
- Dead code identification
- Security vulnerability scanning (SAST)
- Maintainability index calculation
- Coding standards compliance checking

**Tool Integrations**: SonarQube, CodeClimate, ESLint, PMD, FindBugs, Checkstyle
**Priority**: High
**Shared Candidate**: Yes (cross-specialization utility)

#### 2. architecture-analyzer
**Purpose**: Analyze and visualize software architecture patterns and dependencies
**Processes**: legacy-codebase-assessment, monolith-to-microservices, migration-planning-roadmap
**Capabilities**:
- Component dependency mapping
- Layered architecture detection
- Coupling/cohesion metrics
- Architectural violation detection
- Module boundary identification
- Dependency graph generation

**Tool Integrations**: Structure101, Lattix, NDepend, JDepend, Madge
**Priority**: High
**Shared Candidate**: Yes

#### 3. code-smell-detector
**Purpose**: Automated detection of code smells and anti-patterns
**Processes**: code-refactoring, technical-debt-remediation, legacy-codebase-assessment
**Capabilities**:
- Long method detection
- Large class identification
- Feature envy analysis
- Primitive obsession detection
- Parallel inheritance hierarchy
- Shotgun surgery detection
- God class identification

**Tool Integrations**: SonarQube, PMD, IntelliJ IDEA analysis, Designite
**Priority**: Medium
**Shared Candidate**: Yes

#### 4. test-coverage-analyzer
**Purpose**: Analyze test coverage and identify gaps before migration
**Processes**: migration-testing-strategy, code-refactoring, framework-upgrade
**Capabilities**:
- Line/branch/path coverage measurement
- Coverage gap identification
- Critical path coverage analysis
- Integration test coverage mapping
- Coverage trend analysis

**Tool Integrations**: Istanbul, JaCoCo, Cobertura, Coverage.py, SimpleCov
**Priority**: High
**Shared Candidate**: Yes

---

### Dependency Management Skills

#### 5. dependency-scanner
**Purpose**: Comprehensive dependency scanning and inventory
**Processes**: dependency-analysis-updates, legacy-codebase-assessment, framework-upgrade
**Capabilities**:
- Direct/transitive dependency extraction
- Dependency tree visualization
- Version conflict detection
- Circular dependency identification
- License extraction
- SBOM generation

**Tool Integrations**: npm, Maven, Gradle, pip, Bundler, Snyk, OWASP Dependency-Check
**Priority**: High
**Shared Candidate**: Yes

#### 6. vulnerability-scanner
**Purpose**: Security vulnerability scanning for dependencies
**Processes**: dependency-analysis-updates, security-remediation-migration
**Capabilities**:
- CVE database checking
- Severity assessment
- Exploitability analysis
- Patch availability checking
- Transitive vulnerability chain mapping
- Risk scoring

**Tool Integrations**: Snyk, npm audit, OWASP Dependency-Check, Trivy, Grype, GitHub Dependabot
**Priority**: Critical
**Shared Candidate**: Yes (security specialization)

#### 7. license-compliance-checker
**Purpose**: Automated license compliance verification
**Processes**: dependency-analysis-updates, legacy-codebase-assessment
**Capabilities**:
- License identification
- Compatibility checking
- Copyleft license flagging
- Attribution requirement tracking
- Policy enforcement
- Compliance report generation

**Tool Integrations**: FOSSA, WhiteSource, Black Duck, license-checker, licensee
**Priority**: Medium
**Shared Candidate**: Yes (legal/compliance)

#### 8. dependency-updater
**Purpose**: Automated dependency update execution
**Processes**: dependency-analysis-updates, framework-upgrade
**Capabilities**:
- Safe update execution
- Breaking change detection
- Rollback capability
- Update batching
- Lock file management
- Changelog parsing

**Tool Integrations**: Dependabot, Renovate, npm-check-updates, pyup
**Priority**: Medium
**Shared Candidate**: No

---

### Refactoring Skills

#### 9. codemod-executor
**Purpose**: Execute automated code transformations
**Processes**: code-refactoring, framework-upgrade, language-version-migration, code-translation
**Capabilities**:
- AST-based transformations
- Pattern matching and replacement
- Multi-file transformations
- Dry-run preview
- Rollback support
- Custom codemod creation

**Tool Integrations**: jscodeshift, ts-morph, Rector (PHP), Scalafix, OpenRewrite, Bowler
**Priority**: High
**Shared Candidate**: Yes

#### 10. refactoring-assistant
**Purpose**: Suggest and apply refactoring patterns
**Processes**: code-refactoring, technical-debt-remediation
**Capabilities**:
- Extract method/class suggestions
- Move method recommendations
- Rename refactoring
- Inline refactoring
- Pull up/push down member
- Design pattern application

**Tool Integrations**: IDE refactoring engines, Sourcery, Sourcegraph Cody
**Priority**: Medium
**Shared Candidate**: No

#### 11. dead-code-eliminator
**Purpose**: Identify and safely remove dead/unused code
**Processes**: code-refactoring, legacy-decommissioning, monolith-to-microservices
**Capabilities**:
- Unused function detection
- Unreachable code identification
- Unused variable detection
- Orphan file detection
- Safe removal verification
- Impact analysis

**Tool Integrations**: ts-prune, unimported, deadcode (Python), UCDetector
**Priority**: Medium
**Shared Candidate**: Yes

---

### Legacy System Analysis Skills

#### 12. legacy-code-interpreter
**Purpose**: Understand and document legacy code behavior
**Processes**: legacy-codebase-assessment, migration-planning-roadmap
**Capabilities**:
- Business logic extraction
- Undocumented feature discovery
- Control flow analysis
- Data flow tracking
- Side effect identification
- Behavior characterization

**Tool Integrations**: Understand (SciTools), Lattix, custom AST analyzers
**Priority**: High
**Shared Candidate**: No

#### 13. technical-debt-quantifier
**Purpose**: Measure and prioritize technical debt
**Processes**: legacy-codebase-assessment, technical-debt-remediation
**Capabilities**:
- Debt categorization (code, architecture, test, documentation)
- Remediation effort estimation
- Interest calculation (ongoing cost)
- Priority scoring
- Debt-to-value ratio
- Trend tracking

**Tool Integrations**: SonarQube, CodeScene, Codacy
**Priority**: Medium
**Shared Candidate**: Yes

#### 14. knowledge-extractor
**Purpose**: Extract tribal knowledge from code and documentation
**Processes**: legacy-codebase-assessment, documentation-migration
**Capabilities**:
- Comment analysis
- Commit message mining
- Documentation parsing
- Pattern recognition
- Business rule extraction
- Glossary generation

**Tool Integrations**: Custom NLP tools, Sourcegraph, grep-based extraction
**Priority**: Medium
**Shared Candidate**: No

---

### Framework Migration Skills

#### 15. framework-compatibility-checker
**Purpose**: Check codebase compatibility with target framework versions
**Processes**: framework-upgrade, language-version-migration
**Capabilities**:
- Deprecated API usage detection
- Breaking change impact analysis
- Compatibility matrix generation
- Migration path recommendation
- Risk assessment

**Tool Integrations**: Framework-specific migration checkers (Angular update, React upgrade tools)
**Priority**: High
**Shared Candidate**: No

#### 16. ui-component-migrator
**Purpose**: Migrate UI components between frameworks
**Processes**: ui-framework-migration, framework-upgrade
**Capabilities**:
- Component structure translation
- State management migration
- Lifecycle method conversion
- Event handling transformation
- Style migration
- Test migration

**Tool Integrations**: Framework-specific codemods, custom transformers
**Priority**: Medium
**Shared Candidate**: No

#### 17. configuration-migrator
**Purpose**: Migrate configuration files between formats/versions
**Processes**: configuration-migration, framework-upgrade, cloud-migration
**Capabilities**:
- Config format conversion (XML to YAML, etc.)
- Environment variable extraction
- Secret detection
- Schema validation
- Default value handling
- Template generation

**Tool Integrations**: Konfig, config-migrator, custom parsers
**Priority**: Medium
**Shared Candidate**: Yes

---

### Database Migration Skills

#### 18. schema-comparator
**Purpose**: Compare database schemas between source and target
**Processes**: database-schema-migration, data-format-migration
**Capabilities**:
- Schema diff generation
- Data type mapping
- Constraint comparison
- Index analysis
- Stored procedure comparison
- Migration script generation

**Tool Integrations**: Flyway, Liquibase, Redgate SQL Compare, SchemaHero
**Priority**: High
**Shared Candidate**: No

#### 19. data-migration-validator
**Purpose**: Validate data integrity during migration
**Processes**: database-schema-migration, cloud-migration
**Capabilities**:
- Row count validation
- Checksum verification
- Sample data comparison
- Referential integrity checking
- Business rule validation
- Reconciliation reporting

**Tool Integrations**: Custom validation scripts, Great Expectations, dbt tests
**Priority**: High
**Shared Candidate**: No

#### 20. query-translator
**Purpose**: Translate SQL queries between database dialects
**Processes**: database-schema-migration, cloud-migration
**Capabilities**:
- Dialect conversion (Oracle to PostgreSQL, etc.)
- Function mapping
- Syntax translation
- Performance hint conversion
- Query optimization suggestions

**Tool Integrations**: SQLGlot, AWS SCT, ora2pg
**Priority**: Medium
**Shared Candidate**: No

#### 21. etl-pipeline-builder
**Purpose**: Build and manage ETL pipelines for data migration
**Processes**: database-schema-migration, cloud-migration, data-format-migration
**Capabilities**:
- Source-to-target mapping
- Transformation definition
- Incremental load setup
- CDC configuration
- Error handling
- Pipeline monitoring

**Tool Integrations**: Apache Airflow, dbt, Airbyte, Fivetran, AWS DMS
**Priority**: Medium
**Shared Candidate**: Yes (data engineering)

---

### API Modernization Skills

#### 22. api-inventory-scanner
**Purpose**: Discover and document existing API endpoints
**Processes**: api-modernization, integration-migration
**Capabilities**:
- Endpoint discovery (from code, logs, traffic)
- Request/response format extraction
- Authentication method detection
- Rate limit identification
- Consumer mapping
- Usage pattern analysis

**Tool Integrations**: Swagger Inspector, Postman, custom code parsers
**Priority**: High
**Shared Candidate**: No

#### 23. openapi-generator
**Purpose**: Generate OpenAPI specifications from code or legacy APIs
**Processes**: api-modernization, documentation-migration
**Capabilities**:
- Spec generation from code annotations
- Schema inference
- Example generation
- Validation rule extraction
- Versioning support
- Documentation generation

**Tool Integrations**: Swagger Codegen, OpenAPI Generator, springdoc, NSwag
**Priority**: High
**Shared Candidate**: Yes

#### 24. api-compatibility-analyzer
**Purpose**: Analyze API changes for backward compatibility
**Processes**: api-modernization, framework-upgrade
**Capabilities**:
- Breaking change detection
- Deprecation analysis
- Version comparison
- Consumer impact assessment
- Migration path suggestion
- Compatibility layer design

**Tool Integrations**: OpenAPI-diff, Optic, Akita
**Priority**: Medium
**Shared Candidate**: No

#### 25. soap-to-rest-converter
**Purpose**: Convert SOAP services to REST APIs
**Processes**: api-modernization
**Capabilities**:
- WSDL parsing
- Operation-to-endpoint mapping
- Type conversion
- Authentication migration
- SOAP envelope removal
- REST resource modeling

**Tool Integrations**: SOAP UI, custom transformers
**Priority**: Low
**Shared Candidate**: No

---

### Cloud Migration Skills

#### 26. cloud-readiness-assessor
**Purpose**: Assess application readiness for cloud migration
**Processes**: cloud-migration, migration-planning-roadmap
**Capabilities**:
- 6 Rs classification (Rehost, Replatform, etc.)
- Cloud-native pattern compliance
- Stateless verification
- External dependency mapping
- Cost estimation
- Risk assessment

**Tool Integrations**: AWS Migration Hub, Azure Migrate, Google Cloud Migration Center
**Priority**: High
**Shared Candidate**: No

#### 27. iac-generator
**Purpose**: Generate Infrastructure as Code from existing infrastructure
**Processes**: cloud-migration, containerization
**Capabilities**:
- Resource discovery
- Terraform/CloudFormation generation
- Module structuring
- Variable extraction
- State management setup
- Best practice enforcement

**Tool Integrations**: Terraform, Pulumi, AWS CDK, Former2, Terraformer
**Priority**: High
**Shared Candidate**: Yes (DevOps/SRE)

#### 28. containerization-assistant
**Purpose**: Assist in containerizing applications
**Processes**: containerization, cloud-migration, monolith-to-microservices
**Capabilities**:
- Dockerfile generation
- Multi-stage build optimization
- Base image selection
- Dependency packaging
- Health check configuration
- Security scanning

**Tool Integrations**: Docker, Buildpacks, Jib, ko, Dive
**Priority**: High
**Shared Candidate**: Yes (DevOps/SRE)

#### 29. cloud-cost-estimator
**Purpose**: Estimate cloud costs for migration targets
**Processes**: cloud-migration, migration-planning-roadmap
**Capabilities**:
- Resource sizing recommendations
- Cost projection
- Reserved instance optimization
- Spot instance eligibility
- Cost comparison (on-prem vs cloud)
- FinOps recommendations

**Tool Integrations**: AWS Pricing Calculator, Azure TCO, Google Cloud Pricing Calculator, Infracost
**Priority**: Medium
**Shared Candidate**: Yes (DevOps/SRE)

---

### Testing and Validation Skills

#### 30. characterization-test-generator
**Purpose**: Generate characterization tests to capture existing behavior
**Processes**: migration-testing-strategy, code-refactoring
**Capabilities**:
- Golden master test creation
- Approval test generation
- Edge case discovery
- Input/output recording
- Behavior snapshot
- Regression baseline establishment

**Tool Integrations**: ApprovalTests, Jest snapshots, custom recording tools
**Priority**: High
**Shared Candidate**: Yes

#### 31. performance-baseline-capturer
**Purpose**: Capture performance baselines before migration
**Processes**: migration-testing-strategy, performance-optimization-migration
**Capabilities**:
- Response time measurement
- Throughput baseline
- Resource utilization tracking
- Load test execution
- Percentile calculation
- Regression threshold setting

**Tool Integrations**: JMeter, Gatling, k6, Locust, Artillery
**Priority**: Medium
**Shared Candidate**: Yes

#### 32. migration-validator
**Purpose**: Validate functional equivalence after migration
**Processes**: migration-testing-strategy, parallel-run-validation
**Capabilities**:
- Side-by-side comparison
- Output diffing
- Behavioral verification
- Data consistency checking
- Integration validation
- Acceptance criteria verification

**Tool Integrations**: Custom validators, Diffy, contract testing tools
**Priority**: High
**Shared Candidate**: No

#### 33. contract-test-generator
**Purpose**: Generate contract tests for API migrations
**Processes**: api-modernization, monolith-to-microservices
**Capabilities**:
- Consumer contract generation
- Provider verification
- Schema validation
- Breaking change detection
- Mock server generation
- Contract versioning

**Tool Integrations**: Pact, Spring Cloud Contract, Dredd
**Priority**: Medium
**Shared Candidate**: Yes

---

### Additional Specialized Skills

#### 34. strangler-fig-orchestrator
**Purpose**: Orchestrate strangler fig pattern implementation
**Processes**: monolith-to-microservices, legacy-decommissioning
**Capabilities**:
- Traffic routing configuration
- Feature flag management
- Gradual cutover orchestration
- Rollback coordination
- Progress tracking
- Legacy component sunset

**Tool Integrations**: API gateways, feature flag services, custom routers
**Priority**: Medium
**Shared Candidate**: No

#### 35. domain-model-extractor
**Purpose**: Extract domain models from monolithic codebases
**Processes**: monolith-to-microservices, migration-planning-roadmap
**Capabilities**:
- Bounded context identification
- Aggregate detection
- Entity relationship mapping
- Domain event discovery
- Ubiquitous language extraction
- Context map generation

**Tool Integrations**: EventStorming tools, custom analyzers
**Priority**: High
**Shared Candidate**: No

#### 36. event-sourcing-migrator
**Purpose**: Migrate to event-sourcing architecture
**Processes**: monolith-to-microservices, database-schema-migration
**Capabilities**:
- Event extraction from existing data
- Event store setup
- Projection generation
- CQRS implementation
- Snapshot management
- Event replay

**Tool Integrations**: EventStore, Axon, custom event stores
**Priority**: Low
**Shared Candidate**: No

#### 37. authentication-migrator
**Purpose**: Migrate authentication systems
**Processes**: authentication-modernization, api-modernization
**Capabilities**:
- Credential migration
- Session to token conversion
- OAuth2/OIDC setup
- MFA migration
- Identity provider integration
- User migration scripts

**Tool Integrations**: Auth0, Keycloak, Okta, custom migration tools
**Priority**: Medium
**Shared Candidate**: Yes (security)

#### 38. logging-migrator
**Purpose**: Migrate logging infrastructure
**Processes**: logging-observability-migration, cloud-migration
**Capabilities**:
- Log format standardization
- Structured logging conversion
- Log aggregation setup
- Correlation ID injection
- Log level normalization
- Retention policy migration

**Tool Integrations**: ELK Stack, Datadog, Splunk, Loki
**Priority**: Medium
**Shared Candidate**: Yes (DevOps/SRE)

#### 39. build-system-migrator
**Purpose**: Migrate build systems to modern alternatives
**Processes**: build-system-modernization
**Capabilities**:
- Build file conversion
- Plugin migration
- Dependency management migration
- CI/CD integration
- Cache optimization
- Incremental build setup

**Tool Integrations**: Gradle, Maven, Bazel, Nx, Turborepo
**Priority**: Medium
**Shared Candidate**: No

#### 40. rollback-automation-skill
**Purpose**: Automate rollback procedures
**Processes**: all migration processes
**Capabilities**:
- State snapshot management
- Rollback script generation
- Database rollback coordination
- Traffic switch rollback
- Verification automation
- Rollback testing

**Tool Integrations**: Database migration tools, deployment tools, feature flags
**Priority**: High
**Shared Candidate**: Yes

#### 41. compliance-validator
**Purpose**: Validate compliance during migration
**Processes**: cloud-migration, security-remediation-migration
**Capabilities**:
- Compliance rule checking
- Audit trail generation
- Security control validation
- Policy enforcement
- Compliance report generation
- Gap analysis

**Tool Integrations**: AWS Config, Azure Policy, Chef InSpec, OPA
**Priority**: Medium
**Shared Candidate**: Yes (security)

#### 42. documentation-generator
**Purpose**: Generate documentation for migrated systems
**Processes**: documentation-migration, all migration processes
**Capabilities**:
- API documentation generation
- Architecture documentation
- Runbook generation
- Change documentation
- Migration guide creation
- Diagram generation

**Tool Integrations**: Swagger UI, AsyncAPI, PlantUML, Mermaid, Backstage
**Priority**: Medium
**Shared Candidate**: Yes

---

## Agents Backlog

### Assessment Agents

#### 1. legacy-system-archaeologist
**Role**: Expert in excavating and understanding legacy systems
**Processes**: legacy-codebase-assessment, migration-planning-roadmap
**Capabilities**:
- Deep code archaeology
- Business logic reconstruction
- Tribal knowledge interview synthesis
- Historical context analysis
- Undocumented feature mapping
- Risk identification

**Required Skills**: legacy-code-interpreter, knowledge-extractor, technical-debt-quantifier
**Priority**: High

#### 2. migration-readiness-assessor
**Role**: Assess overall readiness for migration initiatives
**Processes**: legacy-codebase-assessment, cloud-migration, migration-planning-roadmap
**Capabilities**:
- Multi-dimensional readiness scoring
- Blocker identification
- Prerequisite analysis
- Team capability assessment
- Infrastructure readiness
- Risk-benefit analysis

**Required Skills**: cloud-readiness-assessor, static-code-analyzer, technical-debt-quantifier
**Priority**: High

#### 3. technical-debt-auditor
**Role**: Comprehensive technical debt assessment and prioritization
**Processes**: technical-debt-remediation, legacy-codebase-assessment
**Capabilities**:
- Debt categorization
- Impact assessment
- Remediation cost estimation
- Priority recommendation
- Quick win identification
- Long-term debt strategy

**Required Skills**: technical-debt-quantifier, code-smell-detector, static-code-analyzer
**Priority**: Medium

#### 4. security-vulnerability-assessor
**Role**: Security-focused assessment for migrations
**Processes**: dependency-analysis-updates, security-remediation-migration
**Capabilities**:
- Vulnerability prioritization
- Exploitability assessment
- Remediation planning
- Security debt tracking
- Compliance gap analysis
- Risk communication

**Required Skills**: vulnerability-scanner, compliance-validator, static-code-analyzer
**Priority**: High

---

### Migration Execution Agents

#### 5. database-migration-orchestrator
**Role**: Orchestrate complex database migrations
**Processes**: database-schema-migration, cloud-migration
**Capabilities**:
- Migration sequence planning
- Zero-downtime migration execution
- Data validation coordination
- Rollback orchestration
- Performance monitoring
- Cutover management

**Required Skills**: schema-comparator, data-migration-validator, query-translator, etl-pipeline-builder
**Priority**: High

#### 6. api-modernization-architect
**Role**: Design and execute API modernization strategies
**Processes**: api-modernization, integration-migration
**Capabilities**:
- Modern API design
- Backward compatibility planning
- Consumer migration support
- Versioning strategy
- Gateway configuration
- Documentation generation

**Required Skills**: api-inventory-scanner, openapi-generator, api-compatibility-analyzer
**Priority**: High

#### 7. microservices-decomposer
**Role**: Guide monolith to microservices decomposition
**Processes**: monolith-to-microservices
**Capabilities**:
- Domain boundary identification
- Service extraction sequencing
- Data decomposition planning
- Strangler fig implementation
- Integration design
- Eventual consistency patterns

**Required Skills**: domain-model-extractor, strangler-fig-orchestrator, architecture-analyzer
**Priority**: High

#### 8. framework-upgrade-specialist
**Role**: Execute framework upgrade migrations
**Processes**: framework-upgrade, language-version-migration, ui-framework-migration
**Capabilities**:
- Upgrade path analysis
- Breaking change resolution
- Codemod execution
- Test migration
- Configuration update
- Performance validation

**Required Skills**: framework-compatibility-checker, codemod-executor, dependency-updater
**Priority**: High

#### 9. cloud-migration-engineer
**Role**: Execute cloud migration initiatives
**Processes**: cloud-migration, containerization, serverless-migration
**Capabilities**:
- Infrastructure provisioning
- Application containerization
- Data migration execution
- Network configuration
- Security implementation
- Operational setup

**Required Skills**: iac-generator, containerization-assistant, cloud-readiness-assessor, cloud-cost-estimator
**Priority**: High

#### 10. code-transformation-executor
**Role**: Execute large-scale code transformations
**Processes**: code-refactoring, code-translation, language-version-migration
**Capabilities**:
- AST manipulation
- Pattern-based transformation
- Safe refactoring execution
- Incremental changes
- Test maintenance
- Quality validation

**Required Skills**: codemod-executor, refactoring-assistant, dead-code-eliminator
**Priority**: Medium

#### 11. dependency-modernization-agent
**Role**: Modernize project dependencies
**Processes**: dependency-analysis-updates, framework-upgrade
**Capabilities**:
- Update planning
- Batch execution
- Conflict resolution
- Compatibility testing
- Security patching
- Documentation update

**Required Skills**: dependency-scanner, dependency-updater, vulnerability-scanner, license-compliance-checker
**Priority**: High

#### 12. strangler-implementation-agent
**Role**: Implement strangler fig pattern for gradual migration
**Processes**: monolith-to-microservices, legacy-decommissioning
**Capabilities**:
- Routing layer setup
- Feature extraction
- Traffic management
- Parallel running
- Cutover coordination
- Legacy sunset

**Required Skills**: strangler-fig-orchestrator, api-compatibility-analyzer, migration-validator
**Priority**: Medium

---

### Quality Assurance Agents

#### 13. migration-testing-strategist
**Role**: Design and implement migration testing strategies
**Processes**: migration-testing-strategy, all migration processes
**Capabilities**:
- Test strategy design
- Characterization test creation
- Regression suite design
- Performance baseline
- Data validation design
- Acceptance criteria definition

**Required Skills**: characterization-test-generator, performance-baseline-capturer, test-coverage-analyzer
**Priority**: High

#### 14. parallel-run-validator
**Role**: Validate systems running in parallel during migration
**Processes**: parallel-run-validation, migration-testing-strategy
**Capabilities**:
- Output comparison
- Discrepancy analysis
- Confidence scoring
- Issue triage
- Cutover recommendation
- Statistical validation

**Required Skills**: migration-validator, data-migration-validator, performance-baseline-capturer
**Priority**: Medium

#### 15. regression-detector
**Role**: Detect regressions introduced during migration
**Processes**: all migration processes
**Capabilities**:
- Behavior comparison
- Performance regression detection
- Error rate monitoring
- Feature parity verification
- Visual regression detection
- API contract verification

**Required Skills**: migration-validator, characterization-test-generator, contract-test-generator
**Priority**: High

#### 16. data-integrity-validator
**Role**: Ensure data integrity throughout migration
**Processes**: database-schema-migration, cloud-migration, data-format-migration
**Capabilities**:
- Row count verification
- Checksum validation
- Sampling verification
- Referential integrity
- Business rule validation
- Reconciliation reporting

**Required Skills**: data-migration-validator, etl-pipeline-builder
**Priority**: High

#### 17. performance-validation-agent
**Role**: Validate performance after migration
**Processes**: performance-optimization-migration, cloud-migration, framework-upgrade
**Capabilities**:
- Baseline comparison
- Load testing
- Bottleneck identification
- SLA verification
- Optimization recommendation
- Capacity planning

**Required Skills**: performance-baseline-capturer, migration-validator
**Priority**: Medium

---

### Infrastructure Agents

#### 18. infrastructure-migration-agent
**Role**: Migrate infrastructure components
**Processes**: cloud-migration, containerization
**Capabilities**:
- IaC migration
- Network migration
- Security group migration
- Storage migration
- DNS migration
- Certificate migration

**Required Skills**: iac-generator, containerization-assistant, configuration-migrator
**Priority**: High

#### 19. cutover-coordinator
**Role**: Coordinate production cutover activities
**Processes**: all migration processes
**Capabilities**:
- Cutover planning
- Stakeholder coordination
- Go/no-go decisions
- Rollback triggers
- Communication management
- Post-cutover validation

**Required Skills**: rollback-automation-skill, migration-validator
**Priority**: High

#### 20. rollback-specialist
**Role**: Manage rollback procedures and execution
**Processes**: all migration processes
**Capabilities**:
- Rollback planning
- State preservation
- Quick rollback execution
- Partial rollback support
- Rollback verification
- Post-rollback analysis

**Required Skills**: rollback-automation-skill, data-migration-validator
**Priority**: High

#### 21. operational-readiness-agent
**Role**: Ensure operational readiness post-migration
**Processes**: cloud-migration, all migration processes
**Capabilities**:
- Monitoring setup
- Alerting configuration
- Runbook creation
- On-call setup
- Training coordination
- Documentation finalization

**Required Skills**: logging-migrator, documentation-generator
**Priority**: Medium

---

### Specialized Execution Agents

#### 22. authentication-migration-agent
**Role**: Migrate authentication and identity systems
**Processes**: authentication-modernization
**Capabilities**:
- Credential migration
- Session management migration
- IdP integration
- MFA setup
- User communication
- Cutover coordination

**Required Skills**: authentication-migrator, compliance-validator
**Priority**: Medium

#### 23. observability-migration-agent
**Role**: Migrate observability stack
**Processes**: logging-observability-migration
**Capabilities**:
- Logging migration
- Metrics migration
- Tracing setup
- Dashboard migration
- Alert migration
- SLO/SLI setup

**Required Skills**: logging-migrator, performance-baseline-capturer
**Priority**: Medium

#### 24. documentation-migration-agent
**Role**: Migrate and update documentation
**Processes**: documentation-migration
**Capabilities**:
- Doc format conversion
- Link updating
- Architecture doc generation
- API doc generation
- Runbook migration
- Knowledge base update

**Required Skills**: documentation-generator, openapi-generator
**Priority**: Low

#### 25. build-pipeline-migrator
**Role**: Migrate build and CI/CD pipelines
**Processes**: build-system-modernization
**Capabilities**:
- Build system conversion
- CI/CD pipeline migration
- Artifact management migration
- Cache optimization
- Parallelization setup
- Quality gate migration

**Required Skills**: build-system-migrator, configuration-migrator
**Priority**: Medium

---

### Domain-Specific Agents

#### 26. ddd-analyst
**Role**: Apply Domain-Driven Design principles to migration
**Processes**: monolith-to-microservices, migration-planning-roadmap
**Capabilities**:
- Bounded context analysis
- Aggregate identification
- Domain event discovery
- Context mapping
- Ubiquitous language definition
- Strategic design

**Required Skills**: domain-model-extractor, architecture-analyzer
**Priority**: High

#### 27. data-architect-agent
**Role**: Design data architecture for migrated systems
**Processes**: database-schema-migration, monolith-to-microservices
**Capabilities**:
- Data decomposition design
- Consistency pattern selection
- Saga design
- CQRS/ES patterns
- Data mesh design
- Data ownership definition

**Required Skills**: schema-comparator, etl-pipeline-builder, event-sourcing-migrator
**Priority**: Medium

#### 28. api-gateway-configurator
**Role**: Configure API gateways for migration
**Processes**: api-modernization, monolith-to-microservices
**Capabilities**:
- Gateway selection
- Routing configuration
- Rate limiting setup
- Authentication integration
- Request transformation
- Response caching

**Required Skills**: api-compatibility-analyzer, strangler-fig-orchestrator
**Priority**: Medium

---

### Coordination Agents

#### 29. migration-project-coordinator
**Role**: Coordinate overall migration project activities
**Processes**: migration-planning-roadmap, all processes
**Capabilities**:
- Project planning
- Resource allocation
- Risk management
- Stakeholder communication
- Progress tracking
- Issue resolution

**Required Skills**: None (orchestration-focused)
**Priority**: Medium

#### 30. cross-team-integrator
**Role**: Coordinate cross-team migration activities
**Processes**: all migration processes
**Capabilities**:
- Team coordination
- Dependency management
- Interface contracts
- Integration testing coordination
- Communication facilitation
- Conflict resolution

**Required Skills**: contract-test-generator, api-compatibility-analyzer
**Priority**: Medium

---

### Additional Specialized Agents

#### 31. legacy-decommissioning-specialist
**Role**: Safely decommission legacy systems
**Processes**: legacy-decommissioning
**Capabilities**:
- Usage verification
- Data archival coordination
- Dependency verification
- Staged shutdown
- Resource cleanup
- Compliance documentation

**Required Skills**: dead-code-eliminator, compliance-validator, rollback-automation-skill
**Priority**: Medium

#### 32. serverless-migration-specialist
**Role**: Migrate applications to serverless architectures
**Processes**: serverless-migration, cloud-migration
**Capabilities**:
- Function extraction
- Event source mapping
- Cold start optimization
- State management
- Cost optimization
- Vendor lock-in mitigation

**Required Skills**: cloud-readiness-assessor, iac-generator, containerization-assistant
**Priority**: Low

#### 33. integration-migration-specialist
**Role**: Migrate integrations and middleware
**Processes**: integration-migration
**Capabilities**:
- Integration mapping
- Protocol migration
- Message format conversion
- Queue migration
- Event bus setup
- Contract testing

**Required Skills**: api-inventory-scanner, configuration-migrator, contract-test-generator
**Priority**: Medium

#### 34. code-translation-agent
**Role**: Translate code between programming languages
**Processes**: code-translation
**Capabilities**:
- Syntax translation
- Library mapping
- Idiom conversion
- Type system mapping
- Test translation
- Documentation update

**Required Skills**: codemod-executor, static-code-analyzer
**Priority**: Low

#### 35. configuration-centralization-agent
**Role**: Centralize and modernize configuration management
**Processes**: configuration-migration, cloud-migration
**Capabilities**:
- Config extraction
- Secret identification
- Environment separation
- Config server setup
- Feature flag migration
- Version management

**Required Skills**: configuration-migrator, compliance-validator
**Priority**: Medium

#### 36. compliance-migration-agent
**Role**: Ensure compliance during migration
**Processes**: cloud-migration, security-remediation-migration
**Capabilities**:
- Compliance mapping
- Control implementation
- Audit trail setup
- Evidence collection
- Gap remediation
- Certification support

**Required Skills**: compliance-validator, authentication-migrator
**Priority**: Medium

#### 37. cost-optimization-agent
**Role**: Optimize costs during and after migration
**Processes**: cloud-migration, performance-optimization-migration
**Capabilities**:
- Cost analysis
- Right-sizing recommendations
- Reserved capacity planning
- Spot instance eligibility
- Resource cleanup
- FinOps implementation

**Required Skills**: cloud-cost-estimator, performance-baseline-capturer
**Priority**: Medium

#### 38. post-migration-validator
**Role**: Comprehensive post-migration validation
**Processes**: all migration processes
**Capabilities**:
- Functional validation
- Performance validation
- Security validation
- Data integrity validation
- User acceptance coordination
- Sign-off facilitation

**Required Skills**: migration-validator, data-integrity-validator, performance-validation-agent
**Priority**: High

---

## Shared/Cross-Cutting Components

The following components are identified as candidates for sharing across multiple specializations:

### Skills (Shared)
| Skill | Potential Sharing Domains |
|-------|---------------------------|
| static-code-analyzer | QA Testing, Software Architecture, Security |
| architecture-analyzer | Software Architecture, DevOps/SRE |
| code-smell-detector | QA Testing, Software Architecture |
| test-coverage-analyzer | QA Testing |
| dependency-scanner | DevOps/SRE, Security |
| vulnerability-scanner | Security |
| license-compliance-checker | Legal/Compliance |
| codemod-executor | All development specializations |
| dead-code-eliminator | All development specializations |
| technical-debt-quantifier | Software Architecture, Project Management |
| iac-generator | DevOps/SRE, Cloud Architecture |
| containerization-assistant | DevOps/SRE, Cloud Architecture |
| cloud-cost-estimator | DevOps/SRE, FinOps |
| characterization-test-generator | QA Testing |
| performance-baseline-capturer | QA Testing, DevOps/SRE |
| contract-test-generator | QA Testing, API Design |
| compliance-validator | Security, Legal/Compliance |
| documentation-generator | Technical Documentation |
| openapi-generator | API Design, Technical Documentation |
| configuration-migrator | DevOps/SRE |
| rollback-automation-skill | DevOps/SRE |
| logging-migrator | DevOps/SRE, Observability |
| authentication-migrator | Security |
| etl-pipeline-builder | Data Engineering |

### Agents (Shared)
| Agent | Potential Sharing Domains |
|-------|---------------------------|
| security-vulnerability-assessor | Security |
| migration-testing-strategist | QA Testing |
| regression-detector | QA Testing |
| infrastructure-migration-agent | DevOps/SRE |
| cutover-coordinator | DevOps/SRE, Release Management |
| rollback-specialist | DevOps/SRE |
| operational-readiness-agent | DevOps/SRE |
| compliance-migration-agent | Security, Legal/Compliance |
| cost-optimization-agent | FinOps |

---

## Integration Matrix

### Process to Skills/Agents Mapping

| Process | Primary Skills | Primary Agents |
|---------|---------------|----------------|
| legacy-codebase-assessment | static-code-analyzer, architecture-analyzer, technical-debt-quantifier, legacy-code-interpreter | legacy-system-archaeologist, migration-readiness-assessor, technical-debt-auditor |
| migration-planning-roadmap | cloud-readiness-assessor, technical-debt-quantifier | migration-readiness-assessor, ddd-analyst, migration-project-coordinator |
| dependency-analysis-updates | dependency-scanner, vulnerability-scanner, license-compliance-checker, dependency-updater | dependency-modernization-agent, security-vulnerability-assessor |
| database-schema-migration | schema-comparator, data-migration-validator, query-translator, etl-pipeline-builder | database-migration-orchestrator, data-integrity-validator |
| migration-testing-strategy | characterization-test-generator, test-coverage-analyzer, performance-baseline-capturer | migration-testing-strategist, regression-detector |
| api-modernization | api-inventory-scanner, openapi-generator, api-compatibility-analyzer | api-modernization-architect, api-gateway-configurator |
| framework-upgrade | framework-compatibility-checker, codemod-executor, dependency-updater | framework-upgrade-specialist, regression-detector |
| language-version-migration | codemod-executor, framework-compatibility-checker | framework-upgrade-specialist, code-transformation-executor |
| monolith-to-microservices | domain-model-extractor, strangler-fig-orchestrator, architecture-analyzer | microservices-decomposer, ddd-analyst, strangler-implementation-agent |
| cloud-migration | cloud-readiness-assessor, iac-generator, containerization-assistant, cloud-cost-estimator | cloud-migration-engineer, infrastructure-migration-agent, operational-readiness-agent |
| code-refactoring | code-smell-detector, codemod-executor, refactoring-assistant, test-coverage-analyzer | code-transformation-executor, regression-detector |
| technical-debt-remediation | technical-debt-quantifier, code-smell-detector, refactoring-assistant | technical-debt-auditor, code-transformation-executor |
| build-system-modernization | build-system-migrator, configuration-migrator | build-pipeline-migrator |
| data-format-migration | etl-pipeline-builder, data-migration-validator | data-integrity-validator |
| authentication-modernization | authentication-migrator, compliance-validator | authentication-migration-agent |
| containerization | containerization-assistant, iac-generator | cloud-migration-engineer, infrastructure-migration-agent |
| code-translation | codemod-executor, static-code-analyzer | code-translation-agent |
| integration-migration | api-inventory-scanner, configuration-migrator, contract-test-generator | integration-migration-specialist |
| configuration-migration | configuration-migrator | configuration-centralization-agent |
| logging-observability-migration | logging-migrator | observability-migration-agent |
| ui-framework-migration | ui-component-migrator, codemod-executor | framework-upgrade-specialist |
| serverless-migration | cloud-readiness-assessor, iac-generator | serverless-migration-specialist |
| documentation-migration | documentation-generator, openapi-generator | documentation-migration-agent |
| legacy-decommissioning | dead-code-eliminator, compliance-validator, rollback-automation-skill | legacy-decommissioning-specialist, cutover-coordinator |
| performance-optimization-migration | performance-baseline-capturer | performance-validation-agent, cost-optimization-agent |

---

## Implementation Priority

### Phase 1 - Critical Foundation (Weeks 1-4)
**Skills**:
1. static-code-analyzer
2. dependency-scanner
3. vulnerability-scanner
4. architecture-analyzer
5. characterization-test-generator

**Agents**:
1. legacy-system-archaeologist
2. migration-readiness-assessor
3. migration-testing-strategist
4. dependency-modernization-agent

### Phase 2 - Core Migration (Weeks 5-8)
**Skills**:
1. schema-comparator
2. data-migration-validator
3. codemod-executor
4. cloud-readiness-assessor
5. iac-generator
6. containerization-assistant

**Agents**:
1. database-migration-orchestrator
2. framework-upgrade-specialist
3. cloud-migration-engineer
4. data-integrity-validator

### Phase 3 - Advanced Capabilities (Weeks 9-12)
**Skills**:
1. api-inventory-scanner
2. openapi-generator
3. domain-model-extractor
4. strangler-fig-orchestrator
5. technical-debt-quantifier
6. contract-test-generator

**Agents**:
1. api-modernization-architect
2. microservices-decomposer
3. ddd-analyst
4. technical-debt-auditor
5. strangler-implementation-agent

### Phase 4 - Operational Excellence (Weeks 13-16)
**Skills**:
1. rollback-automation-skill
2. performance-baseline-capturer
3. compliance-validator
4. configuration-migrator
5. authentication-migrator

**Agents**:
1. cutover-coordinator
2. rollback-specialist
3. operational-readiness-agent
4. parallel-run-validator
5. post-migration-validator

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **Total Skills** | 42 |
| **Total Agents** | 38 |
| **Shared Skill Candidates** | 24 |
| **Shared Agent Candidates** | 9 |
| **High Priority Skills** | 18 |
| **High Priority Agents** | 15 |
| **Critical Priority Items** | 1 (vulnerability-scanner) |

---

## Next Steps

1. **Validate with Process Owners**: Review skill/agent mappings with process implementation teams
2. **Define Interfaces**: Create standardized input/output schemas for each skill
3. **Identify Tool Dependencies**: Map required tool integrations and licensing
4. **Create Implementation Backlog**: Break down into implementable units
5. **Design Shared Component Registry**: Architecture for cross-specialization sharing
6. **Prototype Critical Skills**: Start with Phase 1 skills for early validation
7. **Integration Testing Plan**: Define how skills/agents integrate with process orchestration
