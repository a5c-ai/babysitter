# Software Architecture Skills & Agents Backlog

This document identifies specialized skills (tools, integrations) and agents (subagents with domain expertise) that would enhance the Software Architecture processes beyond general-purpose capabilities.

## Overview

Based on analysis of all 20 implemented process files, this backlog catalogs:
- **Skills**: Executable tools, integrations, and utilities
- **Agents**: Specialized AI subagents with domain expertise
- **Shared Candidates**: Reusable components across multiple processes

---

## Skills Backlog

### Diagram Generation Skills

#### 1. C4 Diagram Generator
**Skill ID**: `c4-diagram-generator`
**Category**: Visualization
**Used By**: c4-model-documentation, system-design-review, microservices-decomposition, cloud-architecture-design

**Capabilities**:
- Generate C4 diagrams from DSL (Structurizr, PlantUML, Mermaid)
- Support all four levels: Context, Container, Component, Code
- Auto-layout and styling
- Export to PNG, SVG, PDF formats
- Integration with documentation sites

**Implementation Notes**:
```javascript
{
  kind: 'skill',
  skill: {
    name: 'c4-diagram-generator',
    context: {
      level: 'container|component|context|code',
      dsl: 'structurizr|plantuml|mermaid',
      outputFormat: 'png|svg|pdf',
      elements: [...],
      relationships: [...]
    }
  }
}
```

---

#### 2. PlantUML Renderer
**Skill ID**: `plantuml-renderer`
**Category**: Visualization
**Used By**: c4-model-documentation, ddd-strategic-modeling, event-storming, data-architecture-design

**Capabilities**:
- Render PlantUML to images
- Support sequence, class, component, deployment diagrams
- Custom themes and styling
- Batch rendering support

---

#### 3. Mermaid Diagram Renderer
**Skill ID**: `mermaid-renderer`
**Category**: Visualization
**Used By**: c4-model-documentation, microservices-decomposition, data-architecture-design

**Capabilities**:
- Render Mermaid diagrams to images
- Support flowcharts, sequence, class, ER diagrams
- Theme customization
- Integration with Markdown documentation

---

#### 4. Graphviz DOT Renderer
**Skill ID**: `graphviz-renderer`
**Category**: Visualization
**Used By**: microservices-decomposition, ddd-strategic-modeling, observability-implementation

**Capabilities**:
- Render DOT graphs to images
- Dependency visualization
- Layout algorithms (dot, neato, fdp)
- Large graph support

---

### API Documentation Skills

#### 5. OpenAPI Specification Generator
**Skill ID**: `openapi-generator`
**Category**: API Design
**Used By**: api-design-specification, microservices-decomposition, system-design-review

**Capabilities**:
- Generate OpenAPI 3.0/3.1 specifications
- Validate existing specifications
- Generate from code annotations
- Schema inference from examples
- Support for JSON/YAML output

**Implementation Notes**:
```javascript
{
  kind: 'skill',
  skill: {
    name: 'openapi-generator',
    context: {
      mode: 'generate|validate|infer',
      version: '3.0|3.1',
      inputFormat: 'annotations|examples|schema',
      outputFormat: 'json|yaml'
    }
  }
}
```

---

#### 6. OpenAPI Validator
**Skill ID**: `openapi-validator`
**Category**: API Design
**Used By**: api-design-specification, system-design-review

**Capabilities**:
- Validate OpenAPI specifications
- Check security definitions
- Lint for best practices
- Compare specification versions
- Breaking change detection

---

#### 7. GraphQL Schema Generator
**Skill ID**: `graphql-schema-generator`
**Category**: API Design
**Used By**: api-design-specification

**Capabilities**:
- Generate GraphQL SDL
- Type inference from data models
- Resolver stub generation
- Schema validation
- Federation support

---

#### 8. Swagger UI Deployer
**Skill ID**: `swagger-ui-deployer`
**Category**: API Documentation
**Used By**: api-design-specification

**Capabilities**:
- Deploy interactive API documentation
- Configure Swagger UI options
- Generate static HTML
- Custom branding support

---

#### 9. API Mock Server
**Skill ID**: `api-mock-server`
**Category**: API Testing
**Used By**: api-design-specification, microservices-decomposition

**Capabilities**:
- Generate mock server from OpenAPI spec
- Dynamic response generation
- Request validation
- Prism/Mockoon integration

---

### Documentation Skills

#### 10. ADR Generator
**Skill ID**: `adr-generator`
**Category**: Documentation
**Used By**: adr-documentation, system-design-review, tech-stack-evaluation, migration-strategy

**Capabilities**:
- Generate ADR from template (Nygard, MADR)
- Auto-number ADRs
- Link related ADRs
- Status management (Proposed, Accepted, Deprecated, Superseded)
- Integration with adr-tools CLI

**Implementation Notes**:
```javascript
{
  kind: 'skill',
  skill: {
    name: 'adr-generator',
    context: {
      template: 'nygard|madr|custom',
      title: 'Decision Title',
      context: 'Decision context...',
      decision: 'What we decided...',
      consequences: ['Positive', 'Negative'],
      status: 'proposed|accepted|deprecated|superseded',
      linkedAdrs: ['ADR-001', 'ADR-002']
    }
  }
}
```

---

#### 11. Markdown/MDX Processor
**Skill ID**: `markdown-processor`
**Category**: Documentation
**Used By**: All documentation-generating processes

**Capabilities**:
- Parse and render Markdown/MDX
- Table of contents generation
- Link validation
- Frontmatter processing
- Diagram embedding

---

#### 12. Documentation Site Generator
**Skill ID**: `docs-site-generator`
**Category**: Documentation
**Used By**: c4-model-documentation, api-design-specification, observability-implementation

**Capabilities**:
- Generate Docusaurus sites
- Generate MkDocs sites
- VuePress support
- Custom theme configuration
- Search integration

---

#### 13. Technical Writing Style Checker
**Skill ID**: `tech-writing-linter`
**Category**: Documentation Quality
**Used By**: All documentation processes

**Capabilities**:
- Vale/write-good integration
- Technical writing rules
- Terminology consistency
- Readability scoring
- Custom style guide enforcement

---

### Analysis Skills

#### 14. Code Complexity Analyzer
**Skill ID**: `code-complexity-analyzer`
**Category**: Code Quality
**Used By**: refactoring-plan, performance-optimization, system-design-review

**Capabilities**:
- Calculate cyclomatic complexity
- Identify code smells
- Dependency analysis
- Duplicate code detection
- Technical debt scoring

**Implementation Notes**:
```javascript
{
  kind: 'skill',
  skill: {
    name: 'code-complexity-analyzer',
    context: {
      paths: ['src/**/*.ts'],
      metrics: ['cyclomatic', 'cognitive', 'loc', 'dependencies'],
      thresholds: { cyclomatic: 10, cognitive: 15 }
    }
  }
}
```

---

#### 15. Dependency Graph Generator
**Skill ID**: `dependency-graph-generator`
**Category**: Analysis
**Used By**: microservices-decomposition, refactoring-plan, migration-strategy

**Capabilities**:
- Generate module dependency graphs
- Identify circular dependencies
- Calculate coupling metrics
- Visualize dependencies (Graphviz, D3)

---

#### 16. Static Analysis Runner
**Skill ID**: `static-analysis-runner`
**Category**: Code Quality
**Used By**: refactoring-plan, security-architecture-review, performance-optimization

**Capabilities**:
- Run SonarQube analysis
- ESLint/TSLint execution
- Multi-language support
- Custom rule configuration
- Report aggregation

---

#### 17. Performance Profiler
**Skill ID**: `performance-profiler`
**Category**: Performance
**Used By**: performance-optimization

**Capabilities**:
- CPU profiling
- Memory profiling
- Flame graph generation
- Bottleneck identification
- Integration with APM tools

---

#### 18. Database Query Analyzer
**Skill ID**: `db-query-analyzer`
**Category**: Performance
**Used By**: performance-optimization, data-architecture-design

**Capabilities**:
- Query execution plan analysis
- Index recommendation
- Slow query identification
- Query optimization suggestions

---

### Infrastructure Skills

#### 19. Terraform Analyzer
**Skill ID**: `terraform-analyzer`
**Category**: IaC
**Used By**: iac-review, cloud-architecture-design, devops-architecture-alignment

**Capabilities**:
- Parse and validate Terraform
- Security scanning (tfsec, checkov)
- Cost estimation (infracost)
- Drift detection
- Plan visualization

**Implementation Notes**:
```javascript
{
  kind: 'skill',
  skill: {
    name: 'terraform-analyzer',
    context: {
      mode: 'validate|scan|estimate|plan',
      path: './infrastructure',
      provider: 'aws|azure|gcp',
      rules: ['security', 'cost', 'compliance']
    }
  }
}
```

---

#### 20. CloudFormation Analyzer
**Skill ID**: `cloudformation-analyzer`
**Category**: IaC
**Used By**: iac-review, cloud-architecture-design

**Capabilities**:
- Validate CloudFormation templates
- Security scanning (cfn-nag)
- Resource dependency analysis
- Cost estimation

---

#### 21. Kubernetes Manifest Validator
**Skill ID**: `k8s-validator`
**Category**: IaC
**Used By**: iac-review, devops-architecture-alignment, resilience-patterns

**Capabilities**:
- Validate Kubernetes manifests
- Security policy checking (OPA/Gatekeeper)
- Best practice linting (kube-linter)
- Resource limit validation

---

#### 22. Cloud Cost Estimator
**Skill ID**: `cloud-cost-estimator`
**Category**: Cost Analysis
**Used By**: cloud-architecture-design, iac-review, migration-strategy

**Capabilities**:
- Estimate cloud costs (AWS, Azure, GCP)
- Compare pricing across providers
- Reserved instance recommendations
- Savings plan analysis

---

### Security Skills

#### 23. Threat Modeler
**Skill ID**: `threat-modeler`
**Category**: Security
**Used By**: security-architecture-review, api-design-specification

**Capabilities**:
- Generate STRIDE threat models
- Attack tree generation
- Data flow diagram analysis
- Threat prioritization (DREAD)
- Microsoft Threat Modeling Tool integration

**Implementation Notes**:
```javascript
{
  kind: 'skill',
  skill: {
    name: 'threat-modeler',
    context: {
      methodology: 'STRIDE|PASTA|VAST',
      dataFlowDiagram: '...',
      assets: [...],
      trustBoundaries: [...]
    }
  }
}
```

---

#### 24. Security Scanner
**Skill ID**: `security-scanner`
**Category**: Security
**Used By**: security-architecture-review, iac-review

**Capabilities**:
- SAST scanning (Semgrep, CodeQL)
- Dependency vulnerability scanning (Snyk, OWASP)
- Secret detection (git-secrets, truffleHog)
- Container image scanning (Trivy)

---

#### 25. Compliance Checker
**Skill ID**: `compliance-checker`
**Category**: Security & Compliance
**Used By**: security-architecture-review, iac-review, data-architecture-design

**Capabilities**:
- SOC 2 compliance checking
- GDPR requirement validation
- HIPAA compliance assessment
- PCI-DSS validation

---

### Observability Skills

#### 26. Metrics Schema Generator
**Skill ID**: `metrics-schema-generator`
**Category**: Observability
**Used By**: observability-implementation, performance-optimization

**Capabilities**:
- Generate Prometheus metrics schemas
- OpenTelemetry metric definitions
- SLI/SLO specification
- Grafana dashboard generation

---

#### 27. Log Schema Generator
**Skill ID**: `log-schema-generator`
**Category**: Observability
**Used By**: observability-implementation

**Capabilities**:
- Structured logging schema definition
- Log level standards
- Correlation ID patterns
- ELK/Splunk integration templates

---

#### 28. Tracing Schema Generator
**Skill ID**: `tracing-schema-generator`
**Category**: Observability
**Used By**: observability-implementation, microservices-decomposition

**Capabilities**:
- OpenTelemetry tracing schemas
- Span attribute definitions
- Trace context propagation
- Jaeger/Zipkin integration

---

#### 29. Dashboard Generator
**Skill ID**: `dashboard-generator`
**Category**: Observability
**Used By**: observability-implementation, performance-optimization, resilience-patterns

**Capabilities**:
- Generate Grafana dashboards from JSON/YAML
- DataDog dashboard creation
- Panel configuration
- Alert rule integration

---

### Testing Skills

#### 30. Load Test Generator
**Skill ID**: `load-test-generator`
**Category**: Testing
**Used By**: performance-optimization, resilience-patterns, migration-strategy

**Capabilities**:
- Generate k6 load test scripts
- Locust test generation
- Gatling scenario creation
- Test scenario from OpenAPI spec

---

#### 31. Chaos Engineering Runner
**Skill ID**: `chaos-runner`
**Category**: Testing
**Used By**: resilience-patterns

**Capabilities**:
- Run Chaos Monkey experiments
- Litmus chaos execution
- Gremlin integration
- Failure injection scenarios

---

---

## Agents Backlog

### Architecture Design Agents

#### 1. C4 Model Architect
**Agent ID**: `c4-model-architect`
**Category**: Architecture Design
**Used By**: c4-model-documentation

**Expertise**:
- C4 model methodology expert
- Multi-level abstraction design
- Technology-appropriate diagramming
- Stakeholder communication

**Prompt Template**:
```javascript
{
  role: 'C4 Model Architecture Specialist',
  expertise: ['C4 methodology', 'Architecture visualization', 'Stakeholder communication'],
  task: 'Design C4 diagrams at specified abstraction level',
  guidelines: [
    'Follow C4 notation strictly',
    'Ensure appropriate level of detail per diagram type',
    'Include technology choices explicitly',
    'Consider audience for each diagram'
  ]
}
```

---

#### 2. API Design Architect
**Agent ID**: `api-design-architect`
**Category**: Interface Design
**Used By**: api-design-specification

**Expertise**:
- REST API design patterns
- GraphQL schema design
- OpenAPI specification
- API versioning strategies
- HATEOAS principles

---

#### 3. Microservices Architect
**Agent ID**: `microservices-architect`
**Category**: Architecture Design
**Used By**: microservices-decomposition, ddd-strategic-modeling

**Expertise**:
- Service boundary identification
- Domain-driven design principles
- Bounded context mapping
- Inter-service communication patterns
- Data ownership patterns

---

#### 4. Cloud Solutions Architect
**Agent ID**: `cloud-solutions-architect`
**Category**: Cloud Architecture
**Used By**: cloud-architecture-design

**Expertise**:
- AWS, Azure, GCP services
- Cloud-native patterns
- Multi-region architecture
- Hybrid cloud design
- FinOps principles

---

#### 5. Data Architect
**Agent ID**: `data-architect`
**Category**: Data Architecture
**Used By**: data-architecture-design, microservices-decomposition

**Expertise**:
- Data modeling (conceptual, logical, physical)
- Database technology selection
- Data flow patterns
- ETL/ELT design
- Data governance

---

### Domain Modeling Agents

#### 6. Domain-Driven Design Expert
**Agent ID**: `ddd-expert`
**Category**: Domain Modeling
**Used By**: ddd-strategic-modeling, event-storming, microservices-decomposition

**Expertise**:
- Strategic DDD patterns
- Tactical DDD patterns
- Bounded context identification
- Context mapping relationships
- Ubiquitous language development

**Prompt Template**:
```javascript
{
  role: 'Domain-Driven Design Strategic Consultant',
  expertise: ['DDD strategic patterns', 'Context mapping', 'Domain analysis'],
  task: 'Identify bounded contexts and context relationships',
  guidelines: [
    'Focus on business capability alignment',
    'Identify linguistic boundaries',
    'Classify subdomains (core/supporting/generic)',
    'Map context relationships (ACL, OHS, PL, CF, SK, etc.)'
  ]
}
```

---

#### 7. Event Storming Facilitator
**Agent ID**: `event-storming-facilitator`
**Category**: Domain Modeling
**Used By**: event-storming

**Expertise**:
- Event Storming methodology
- Domain event identification
- Aggregate boundary detection
- Command and policy modeling
- Read model design

---

#### 8. CQRS/Event Sourcing Expert
**Agent ID**: `cqrs-event-sourcing-expert`
**Category**: Architecture Patterns
**Used By**: event-storming, microservices-decomposition, data-architecture-design

**Expertise**:
- CQRS pattern design
- Event sourcing implementation
- Event store selection
- Projection design
- Eventual consistency patterns

---

### Quality & Analysis Agents

#### 9. Architecture Trade-off Analyst
**Agent ID**: `atam-analyst`
**Category**: Architecture Evaluation
**Used By**: atam-analysis, system-design-review

**Expertise**:
- ATAM methodology
- Quality attribute analysis
- Scenario-based evaluation
- Risk identification
- Trade-off documentation

---

#### 10. Quality Attributes Specialist
**Agent ID**: `quality-attributes-specialist`
**Category**: Requirements Analysis
**Used By**: quality-attributes-workshop, system-design-review

**Expertise**:
- ISO 25010 quality model
- FURPS+ framework
- Quality attribute scenarios
- Measurement approaches
- Trade-off analysis

---

#### 11. Performance Engineer
**Agent ID**: `performance-engineer`
**Category**: Performance
**Used By**: performance-optimization

**Expertise**:
- Performance profiling
- Bottleneck identification
- Optimization strategies
- Load testing
- APM tool interpretation

---

#### 12. Tech Stack Evaluator
**Agent ID**: `tech-stack-evaluator`
**Category**: Technology Selection
**Used By**: tech-stack-evaluation

**Expertise**:
- Technology landscape assessment
- Comparative analysis
- POC design
- TCO calculation
- Risk assessment

---

### Security Agents

#### 13. Security Architect
**Agent ID**: `security-architect`
**Category**: Security
**Used By**: security-architecture-review

**Expertise**:
- Threat modeling (STRIDE, PASTA)
- Security architecture patterns
- Authentication/authorization design
- Data protection strategies
- Compliance requirements

**Prompt Template**:
```javascript
{
  role: 'Security Architecture Specialist',
  expertise: ['Threat modeling', 'Security patterns', 'Compliance'],
  task: 'Review architecture for security risks',
  guidelines: [
    'Apply STRIDE methodology systematically',
    'Identify attack surfaces',
    'Recommend security patterns',
    'Consider defense in depth',
    'Map to compliance requirements'
  ]
}
```

---

#### 14. Threat Modeler
**Agent ID**: `threat-modeler`
**Category**: Security
**Used By**: security-architecture-review

**Expertise**:
- STRIDE threat identification
- Attack tree construction
- DREAD risk rating
- Mitigation strategies
- Threat documentation

---

#### 15. Compliance Auditor
**Agent ID**: `compliance-auditor`
**Category**: Security & Compliance
**Used By**: security-architecture-review, data-architecture-design

**Expertise**:
- SOC 2 requirements
- GDPR compliance
- HIPAA requirements
- PCI-DSS standards
- Audit trail design

---

### DevOps & Infrastructure Agents

#### 16. DevOps Architect
**Agent ID**: `devops-architect`
**Category**: DevOps
**Used By**: devops-architecture-alignment

**Expertise**:
- CI/CD pipeline design
- Deployment strategies
- Feature flag patterns
- GitOps practices
- Release management

---

#### 17. IaC Specialist
**Agent ID**: `iac-specialist`
**Category**: Infrastructure
**Used By**: iac-review, cloud-architecture-design

**Expertise**:
- Terraform best practices
- CloudFormation patterns
- Pulumi/CDK approaches
- State management
- Module design

---

#### 18. SRE/Reliability Engineer
**Agent ID**: `sre-reliability-engineer`
**Category**: Reliability
**Used By**: resilience-patterns, observability-implementation

**Expertise**:
- SLI/SLO/SLA design
- Error budget management
- Incident response
- Capacity planning
- Chaos engineering

---

#### 19. Observability Architect
**Agent ID**: `observability-architect`
**Category**: Observability
**Used By**: observability-implementation

**Expertise**:
- Three pillars of observability
- Metrics, logs, traces design
- Dashboard design
- Alert engineering
- Correlation strategies

---

### Resilience Agents

#### 20. Resilience Patterns Engineer
**Agent ID**: `resilience-patterns-engineer`
**Category**: Reliability
**Used By**: resilience-patterns

**Expertise**:
- Circuit breaker design
- Bulkhead patterns
- Retry strategies
- Timeout configuration
- Fallback mechanisms
- Rate limiting

**Prompt Template**:
```javascript
{
  role: 'Distributed Systems Resilience Engineer',
  expertise: ['Resilience patterns', 'Fault tolerance', 'Chaos engineering'],
  task: 'Design resilience patterns for distributed systems',
  guidelines: [
    'Identify failure modes',
    'Select appropriate patterns per failure mode',
    'Configure thresholds based on SLOs',
    'Plan chaos testing scenarios',
    'Document fallback behaviors'
  ]
}
```

---

#### 21. Chaos Engineer
**Agent ID**: `chaos-engineer`
**Category**: Testing
**Used By**: resilience-patterns

**Expertise**:
- Chaos experiment design
- Failure injection strategies
- Blast radius control
- Game day planning
- Post-mortem analysis

---

### Migration & Evolution Agents

#### 22. Migration Strategist
**Agent ID**: `migration-strategist`
**Category**: Migration
**Used By**: migration-strategy

**Expertise**:
- 6 Rs of migration (Rehost, Replatform, Refactor, etc.)
- Strangler Fig pattern
- Data migration strategies
- Rollback planning
- Risk mitigation

---

#### 23. Legacy Modernization Expert
**Agent ID**: `legacy-modernization-expert`
**Category**: Migration
**Used By**: migration-strategy, refactoring-plan

**Expertise**:
- Monolith to microservices
- Technical debt assessment
- Incremental modernization
- Parallel run strategies
- Feature parity validation

---

#### 24. Refactoring Coach
**Agent ID**: `refactoring-coach`
**Category**: Code Quality
**Used By**: refactoring-plan

**Expertise**:
- Refactoring patterns (Fowler)
- Code smell identification
- Test-driven refactoring
- Continuous refactoring
- Metrics improvement

---

### Documentation Agents

#### 25. Technical Writer
**Agent ID**: `technical-writer`
**Category**: Documentation
**Used By**: All processes

**Expertise**:
- Technical documentation standards
- Architecture documentation
- API documentation
- User guides
- Markdown/MDX proficiency

---

#### 26. ADR Author
**Agent ID**: `adr-author`
**Category**: Documentation
**Used By**: adr-documentation, tech-stack-evaluation, migration-strategy

**Expertise**:
- ADR methodology (Nygard, MADR)
- Decision documentation
- Context capture
- Consequence analysis
- ADR lifecycle management

---

#### 27. Diagram Specialist
**Agent ID**: `diagram-specialist`
**Category**: Visualization
**Used By**: All diagram-generating processes

**Expertise**:
- UML notation
- C4 notation
- Mermaid/PlantUML syntax
- Architecture diagram best practices
- Visual communication

---

---

## Shared Candidates (Cross-Process Reusability)

### High-Reuse Skills

| Skill ID | Process Count | Processes |
|----------|---------------|-----------|
| `c4-diagram-generator` | 4 | c4-model-documentation, system-design-review, microservices-decomposition, cloud-architecture-design |
| `openapi-generator` | 3 | api-design-specification, microservices-decomposition, system-design-review |
| `adr-generator` | 4 | adr-documentation, system-design-review, tech-stack-evaluation, migration-strategy |
| `terraform-analyzer` | 3 | iac-review, cloud-architecture-design, devops-architecture-alignment |
| `security-scanner` | 2 | security-architecture-review, iac-review |
| `code-complexity-analyzer` | 3 | refactoring-plan, performance-optimization, system-design-review |
| `dashboard-generator` | 3 | observability-implementation, performance-optimization, resilience-patterns |
| `dependency-graph-generator` | 3 | microservices-decomposition, refactoring-plan, migration-strategy |
| `markdown-processor` | 20 | All processes (documentation output) |
| `tech-writing-linter` | 20 | All processes (documentation quality) |

### High-Reuse Agents

| Agent ID | Process Count | Processes |
|----------|---------------|-----------|
| `technical-writer` | 20 | All processes |
| `diagram-specialist` | 15 | All diagram-generating processes |
| `security-architect` | 5 | security-architecture-review, api-design-specification, cloud-architecture-design, iac-review, data-architecture-design |
| `ddd-expert` | 3 | ddd-strategic-modeling, event-storming, microservices-decomposition |
| `data-architect` | 2 | data-architecture-design, microservices-decomposition |
| `devops-architect` | 3 | devops-architecture-alignment, observability-implementation, resilience-patterns |
| `sre-reliability-engineer` | 3 | resilience-patterns, observability-implementation, performance-optimization |
| `migration-strategist` | 2 | migration-strategy, refactoring-plan |

---

## Process-to-Skills/Agents Matrix

### High Priority Processes

| Process | Recommended Skills | Recommended Agents |
|---------|-------------------|-------------------|
| **c4-model-documentation** | c4-diagram-generator, plantuml-renderer, mermaid-renderer | c4-model-architect, diagram-specialist, technical-writer |
| **adr-documentation** | adr-generator, markdown-processor, tech-writing-linter | adr-author, technical-writer |
| **system-design-review** | c4-diagram-generator, code-complexity-analyzer, openapi-validator | atam-analyst, quality-attributes-specialist, security-architect |
| **api-design-specification** | openapi-generator, openapi-validator, graphql-schema-generator, api-mock-server, swagger-ui-deployer | api-design-architect, security-architect, technical-writer |
| **microservices-decomposition** | dependency-graph-generator, c4-diagram-generator, openapi-generator, mermaid-renderer | microservices-architect, ddd-expert, data-architect |

### Medium Priority Processes

| Process | Recommended Skills | Recommended Agents |
|---------|-------------------|-------------------|
| **migration-strategy** | dependency-graph-generator, adr-generator, cloud-cost-estimator | migration-strategist, legacy-modernization-expert, data-architect |
| **tech-stack-evaluation** | adr-generator, load-test-generator | tech-stack-evaluator, adr-author |
| **refactoring-plan** | code-complexity-analyzer, static-analysis-runner, dependency-graph-generator | refactoring-coach, legacy-modernization-expert |
| **performance-optimization** | performance-profiler, db-query-analyzer, load-test-generator, dashboard-generator | performance-engineer, sre-reliability-engineer |
| **quality-attributes-workshop** | markdown-processor | quality-attributes-specialist, atam-analyst |

### Advanced Priority Processes

| Process | Recommended Skills | Recommended Agents |
|---------|-------------------|-------------------|
| **event-storming** | plantuml-renderer, mermaid-renderer | event-storming-facilitator, ddd-expert, cqrs-event-sourcing-expert |
| **atam-analysis** | markdown-processor | atam-analyst, quality-attributes-specialist |
| **ddd-strategic-modeling** | plantuml-renderer, graphviz-renderer | ddd-expert, microservices-architect |
| **resilience-patterns** | chaos-runner, dashboard-generator, k8s-validator | resilience-patterns-engineer, chaos-engineer, sre-reliability-engineer |
| **cloud-architecture-design** | terraform-analyzer, cloud-cost-estimator, c4-diagram-generator | cloud-solutions-architect, iac-specialist, security-architect |

### Operational Priority Processes

| Process | Recommended Skills | Recommended Agents |
|---------|-------------------|-------------------|
| **observability-implementation** | metrics-schema-generator, log-schema-generator, tracing-schema-generator, dashboard-generator | observability-architect, sre-reliability-engineer |
| **iac-review** | terraform-analyzer, cloudformation-analyzer, k8s-validator, security-scanner, compliance-checker | iac-specialist, security-architect, compliance-auditor |
| **security-architecture-review** | threat-modeler, security-scanner, compliance-checker | security-architect, threat-modeler, compliance-auditor |
| **data-architecture-design** | db-query-analyzer, graphviz-renderer | data-architect, compliance-auditor |
| **devops-architecture-alignment** | terraform-analyzer, k8s-validator, dashboard-generator | devops-architect, sre-reliability-engineer |

---

## Implementation Priority

### Phase 1: Foundation Skills (High Impact)
1. `c4-diagram-generator` - Core visualization
2. `openapi-generator` - API design foundation
3. `adr-generator` - Decision documentation
4. `markdown-processor` - Universal documentation
5. `terraform-analyzer` - IaC foundation

### Phase 2: Analysis Skills
6. `code-complexity-analyzer` - Code quality
7. `dependency-graph-generator` - Architecture analysis
8. `security-scanner` - Security foundation
9. `threat-modeler` - Threat analysis
10. `performance-profiler` - Performance analysis

### Phase 3: Specialized Skills
11. `graphql-schema-generator` - GraphQL support
12. `chaos-runner` - Resilience testing
13. `cloud-cost-estimator` - FinOps
14. `dashboard-generator` - Observability
15. `load-test-generator` - Performance testing

### Phase 4: Domain Expert Agents
16. `c4-model-architect` - Architecture visualization
17. `api-design-architect` - API design
18. `ddd-expert` - Domain modeling
19. `security-architect` - Security expertise
20. `migration-strategist` - Migration planning

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **Total Skills** | 31 |
| **Total Agents** | 27 |
| **Shared/Reusable Skills** | 10 (high reuse) |
| **Shared/Reusable Agents** | 8 (high reuse) |

### Skills by Category
- Visualization: 4
- API Documentation: 5
- Documentation: 4
- Analysis: 5
- Infrastructure: 5
- Security: 3
- Observability: 4
- Testing: 2

### Agents by Category
- Architecture Design: 5
- Domain Modeling: 3
- Quality & Analysis: 4
- Security: 3
- DevOps & Infrastructure: 4
- Resilience: 2
- Migration & Evolution: 3
- Documentation: 3

---

## Next Steps

1. **Implement Foundation Skills** - Start with high-impact, cross-process skills
2. **Create Agent Prompt Templates** - Standardize agent configurations
3. **Build Skill Integration Tests** - Ensure reliability
4. **Document Skill APIs** - Clear usage patterns
5. **Measure Usage Patterns** - Track which skills/agents are most valuable
6. **Iterate Based on Feedback** - Refine based on real-world usage
