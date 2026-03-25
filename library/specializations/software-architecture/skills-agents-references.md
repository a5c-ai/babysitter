# Software Architecture Skills & Agents - External References

This document catalogs community-created Claude skills, agents, plugins, and MCP servers that align with the skills and agents identified in the Software Architecture backlog.

---

## Table of Contents

1. [Diagram Generation & Visualization](#1-diagram-generation--visualization)
2. [API Design & Documentation](#2-api-design--documentation)
3. [Architecture Decision Records (ADR)](#3-architecture-decision-records-adr)
4. [Code Analysis & Complexity](#4-code-analysis--complexity)
5. [Infrastructure as Code (IaC)](#5-infrastructure-as-code-iac)
6. [Security & Threat Modeling](#6-security--threat-modeling)
7. [Observability & Monitoring](#7-observability--monitoring)
8. [Database & Data Architecture](#8-database--data-architecture)
9. [Chaos Engineering & Resilience Testing](#9-chaos-engineering--resilience-testing)
10. [Cloud Architecture & Cost Estimation](#10-cloud-architecture--cost-estimation)
11. [Domain-Driven Design & Microservices](#11-domain-driven-design--microservices)
12. [General Architecture Skills & Plugins](#12-general-architecture-skills--plugins)

---

## 1. Diagram Generation & Visualization

### MCP Servers

| Resource | Description | URL |
|----------|-------------|-----|
| **UML-MCP Server** | Comprehensive UML diagram generation via MCP supporting PlantUML, Mermaid, Kroki, and D2. Generates class, sequence, activity, and more diagram types. | [GitHub](https://github.com/antoinebou12/uml-mcp) |
| **Mermaid MCP Server** | Enables AI assistants to generate architecture diagrams, flowcharts, sequence diagrams using Mermaid. 50+ pre-built templates, 22+ diagram types. | [mcpservers.org](https://mcpservers.org/servers/narasimhaponnada/mermaid-mcp.git) |
| **Claude Mermaid** | MCP server for previewing Mermaid diagrams directly in Claude. Renders flowcharts, sequence diagrams, architecture visualizations. | [GitHub](https://github.com/veelenga/claude-mermaid) |
| **mcp-mermaid** | Generate Mermaid diagrams dynamically with AI MCP. Works with Claude Desktop, VSCode, Cline, Cherry Studio. | [GitHub](https://github.com/hustcc/mcp-mermaid) |
| **Sailor** | MCP server for generating and rendering Mermaid diagrams in Claude Desktop. | [GitHub](https://github.com/aj-geddes/sailor) |
| **MCP Kroki Server** | Converts Mermaid and PlantUML syntax to visual outputs (SVG, PNG, PDF) via Kroki.io. | [Glama](https://glama.ai/mcp/servers/@tkoba1974/mcp-kroki) |
| **Diagram MCP** | Architecture diagrams with cloud service discovery, sequence diagrams, flowcharts, class diagrams. Multi-format output (Mermaid, PlantUML, Python diagrams). | [GitHub Discussion](https://github.com/mingrammer/diagrams/discussions/1169) |

### Claude Plugins & Skills

| Resource | Description | URL |
|----------|-------------|-----|
| **claude-d2-diagrams** | Claude Code plugin for D2 diagram generation. Creates infrastructure and architecture diagrams from codebases. Supports AWS, GCP, Azure, Kubernetes icons. | [GitHub](https://github.com/heathdutton/claude-d2-diagrams) |
| **D3.js Dependency Graph Visualizer** | Universal prompt for Claude Code to generate interactive multi-level dependency graphs with D3.js (40k ft, 10k ft, full views). | [GitHub Gist](https://gist.github.com/aessam/963beecba29660a532b11f03b27e1b92) |
| **artifacts-builder** | Suite of tools for creating elaborate, multi-component HTML artifacts using modern frontend technologies. | [awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) |

### Related Tools

| Resource | Description | URL |
|----------|-------------|-----|
| **Structurizr** | C4 model visualization tooling by Simon Brown. Diagrams as code with DSL support. | [structurizr.com](https://structurizr.com/) |
| **Structurizr DSL Python** | Python integration for generating C4 model diagrams (v2.0+ supports async rendering). | [structurizr-python](https://pypi.org/project/structurizr-python/) |
| **c4viz** | Open source C4 visualization from Structurizr DSL workspace files. | [GitHub](https://github.com/pmorch/c4viz) |

---

## 2. API Design & Documentation

### MCP Servers

| Resource | Description | URL |
|----------|-------------|-----|
| **mcp-openapi-schema** | MCP server exposing OpenAPI schema information to LLMs. Allows exploration and understanding of OpenAPI specifications. | [GitHub](https://github.com/hannesj/mcp-openapi-schema) |
| **Apidog MCP Server** | Connects AI to Apidog projects, online API documentation, or local OpenAPI/Swagger files. Intelligent code generation for DTOs, controllers, client code. | [apidog.com](https://apidog.com/blog/top-10-mcp-servers-for-claude-code/) |
| **mcp-graphql** | Model Context Protocol server for GraphQL. Strongly-typed integration with schema exploration tools. | [GitHub](https://github.com/blurrah/mcp-graphql) |
| **mcp-graphql-schema** | Exposes GraphQL schema information to LLMs. Allows exploration and understanding of GraphQL schemas. | [Glama](https://glama.ai/mcp/servers/@hannesj/mcp-graphql-schema) |

### Claude Plugins & Skills

| Resource | Description | URL |
|----------|-------------|-----|
| **openapi-expert** | OpenAPI specification handling plugin for Claude Code. | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) |
| **generate-api-docs** | API documentation generation integration. | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) |

---

## 3. Architecture Decision Records (ADR)

### MCP Servers & Tools

| Resource | Description | URL |
|----------|-------------|-----|
| **ADR Analysis MCP** | AI-powered Architectural Decision Records analysis with insights, technology stack detection, security checks, TDD workflow enhancement. | [mcpmarket.com](https://mcpmarket.com/tools/skills/adr-creator-3) |

### Claude Skills

| Resource | Description | URL |
|----------|-------------|-----|
| **ADR Creator Skill** | Standardizes architectural decision-making by generating comprehensive ADRs using MADR template with AI-specific extensions. | [mcpmarket.com](https://mcpmarket.com/tools/skills/adr-creator-3) |
| **Architecture Decision Records Skill** | Provides templates, examples, and best practices for creating and maintaining ADRs in projects. | [mcpmarket.com](https://mcpmarket.com/tools/skills/architectural-decision-records-adr) |
| **architecture-decision-record** | Claude skill for ADR documentation. | [claude-plugins.dev](https://claude-plugins.dev/skills/@ArieGoldkin/ai-agent-hub/architecture-decision-record) |
| **adr-writer** | ADR writing skill for Claude. | [claude-plugins.dev](https://claude-plugins.dev/skills/@sethdford/claude-plugins/adr-writer) |

### Guides & References

| Resource | Description | URL |
|----------|-------------|-----|
| **Claude ADR System Guide** | Comprehensive architectural decision record system for software projects with AI assistant integration. | [GitHub Gist](https://gist.github.com/joshrotenberg/a3ffd160f161c98a61c739392e953764) |
| **Claude Code ADR Feature Request** | Feature request for native ADR support in ~/.claude/adr/. | [GitHub Issue](https://github.com/anthropics/claude-code/issues/13853) |

---

## 4. Code Analysis & Complexity

### MCP Servers

| Resource | Description | URL |
|----------|-------------|-----|
| **Codacy MCP Server** | Integrates with Codacy for static analysis, code coverage metrics, quality gate configurations. Bridges to CodeQL for security vulnerability identification. | [PulseMCP](https://www.pulsemcp.com/servers/codacy) |
| **Code Analysis MCP Server** | Code review, static analysis, automated refactoring suggestions. Analyzes Python code structure, complexity, dependencies. | [PulseMCP](https://www.pulsemcp.com/servers/saiprashanths-code-analysis) |
| **code-index-mcp** | Deep insights into file structure, imports, classes, methods, complexity metrics. Tree-sitter AST parsing for 7 languages. | [Glama](https://glama.ai/mcp/servers/@johnhuang316/code-index-mcp) |
| **Code Pathfinder MCP** | Natural language queries for Python codebases. Call graphs, symbol search, dataflow analysis. 5-pass AST-based indexing. | [codepathfinder.dev](https://codepathfinder.dev/mcp) |
| **mcp-code-analyzer** | Python code analysis for structure, complexity, and dependencies. | [GitHub](https://github.com/seanivore/mcp-code-analyzer) |
| **Claude Code Review MCP** | Code review capabilities through MCP integration. | [PulseMCP](https://www.pulsemcp.com/servers/praneybehl-claude-code-review) |

### Claude Plugins & Skills

| Resource | Description | URL |
|----------|-------------|-----|
| **code-architect** | Structures and plans system design. | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) |
| **backend-architect** | Backend system design and patterns. | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) |
| **analyze-codebase** | Custom shortcuts for codebase analysis. | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) |
| **software-architecture** | Implements Clean Architecture, SOLID principles, comprehensive software design best practices. | [awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) |

---

## 5. Infrastructure as Code (IaC)

### MCP Servers

| Resource | Description | URL |
|----------|-------------|-----|
| **Terraform MCP Server (HashiCorp)** | Official Terraform Registry integration. Provider/module metadata, validation, auto-completion, best practices. | [GitHub](https://github.com/hashicorp/terraform-mcp-server) |
| **AWS Terraform MCP Server** | Terraform workflows with Checkov security scanning and AWS best practices. | [AWS Labs](https://awslabs.github.io/mcp/) |
| **AWS IaC MCP Server** | CDK and CloudFormation assistance. Validates templates with cfn-lint, runs security checks with cfn-guard. | [AWS Blog](https://aws.amazon.com/blogs/devops/introducing-the-aws-infrastructure-as-code-mcp-server-ai-powered-cdk-and-cloudformation-assistance/) |
| **AWS Cloud Control API MCP Server** | Natural language infrastructure management on AWS. | [AWS Blog](https://aws.amazon.com/blogs/devops/introducing-aws-cloud-control-api-mcp-server-natural-language-infrastructure-management-on-aws/) |

### Claude Plugins & Skills

| Resource | Description | URL |
|----------|-------------|-----|
| **infrastructure-maintainer** | Cloud and system infrastructure management. | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) |
| **deployment-engineer** | Release and deployment workflows. | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) |
| **devops-automator** | Automation workflows for operations. | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) |
| **aws-skills** | AWS development with CDK best practices and serverless architecture patterns. | [awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) |

### Kubernetes MCP Servers

| Resource | Description | URL |
|----------|-------------|-----|
| **kubernetes-mcp-server** | MCP server for Kubernetes and OpenShift. Auto-diagnose and fix deployments. | [GitHub](https://github.com/containers/kubernetes-mcp-server) |
| **mcp-server-kubernetes** | Kubernetes management commands. Non-destructive mode, secrets masking. | [GitHub](https://github.com/Flux159/mcp-server-kubernetes) |
| **Kubernetes Claude MCP (Blank Cut)** | Go-based server with ArgoCD and GitLab integration. GitOps correlation. | [PulseMCP](https://www.pulsemcp.com/servers/blankcut-kubernetes-claude) |

---

## 6. Security & Threat Modeling

### MCP Servers & Tools

| Resource | Description | URL |
|----------|-------------|-----|
| **Snyk MCP Server** | Integrates Claude Desktop with Snyk for vulnerability detection and patching. | [Snyk](https://snyk.io/articles/claude-desktop-and-snyk-mcp/) |
| **McpSafetyScanner** | First tool designed to assess security of MCP servers. Auto-detects vulnerabilities, searches knowledge bases, produces security reports. | [arxiv](https://arxiv.org/html/2509.24272v1) |

### Claude Plugins & Skills

| Resource | Description | URL |
|----------|-------------|-----|
| **enterprise-security-reviewer** | Security assessment and auditing. | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) |
| **data-privacy-engineer** | Privacy compliance and data protection. | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) |
| **compliance-automation-specialist** | Automated compliance checks. | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) |
| **threat-hunting-with-sigma-rules** | Use Sigma detection rules for threat hunting and security event analysis. | [awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) |
| **computer-forensics** | Digital forensics analysis and investigation techniques. | [awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) |

### Threat Modeling Tools

| Resource | Description | URL |
|----------|-------------|-----|
| **STRIDE-GPT** | AI-powered threat modeling using STRIDE methodology. Supports Claude 4.5 models with extended thinking. | [GitHub](https://github.com/mrwadams/stride-gpt) |
| **SecureVibes** | Python-based scanner with 5 AI agents including Threat Modeling Agent (STRIDE methodology). | [CyberSecurityNews](https://cybersecuritynews.com/securevibes/) |

---

## 7. Observability & Monitoring

### MCP Servers

| Resource | Description | URL |
|----------|-------------|-----|
| **Grafana MCP Server** | Official Grafana MCP server. Prometheus PromQL queries, Loki LogQL queries, incident management. | [GitHub](https://github.com/grafana/mcp-grafana) |
| **Grafana Cloud Traces MCP** | Direct access to distributed tracing data through TraceQL. Connect Claude Code or Cursor to Grafana Cloud Traces. | [Grafana Docs](https://grafana.com/docs/grafana-cloud/send-data/traces/mcp-server/) |
| **Tempo MCP Server** | Grafana Tempo integration for trace analysis. | [Grafana Docs](https://grafana.com/docs/tempo/latest/api_docs/mcp-server/) |

### Claude Code Observability

| Resource | Description | URL |
|----------|-------------|-----|
| **claude-code-otel** | Comprehensive observability solution for Claude Code. Routes telemetry through OpenTelemetry to Prometheus/Loki with Grafana visualization. | [GitHub](https://github.com/ColeMurray/claude-code-otel) |

### Claude Plugins & Skills

| Resource | Description | URL |
|----------|-------------|-----|
| **monitoring-observability-specialist** | System monitoring and logging capabilities. | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) |

---

## 8. Database & Data Architecture

### MCP Servers

| Resource | Description | URL |
|----------|-------------|-----|
| **Postgres MCP Pro** | Configurable read/write access, performance analysis. Query execution plans, slow query identification, index recommendations. | [GitHub](https://github.com/crystaldba/postgres-mcp) |
| **postgresql-mcp (sgaunet)** | Secure PostgreSQL integration. Read-only queries, schema exploration, performance analysis. | [GitHub](https://github.com/sgaunat/postgresql-mcp) |
| **pgEdge Postgres MCP** | Full schema introspection, pg_stat_statements performance metrics. Works with RDS, community Postgres. | [pgEdge](https://www.pgedge.com/blog/introducing-the-pgedge-postgres-mcp-server) |
| **PostgreSQL MCP Server (Official)** | Read-only SQL queries, schema information with column names/types, auto-discovers schemas. | [PulseMCP](https://www.pulsemcp.com/servers/modelcontextprotocol-postgres) |
| **PostgreSQL Full Access MCP** | Enhanced implementation allowing LLMs to query and modify database content with transaction management. | [GitHub](https://github.com/syahiidkamil/mcp-postgres-full-access) |
| **Universal DB MCP** | Multi-database support for natural language querying, schema inspection, data analysis. | [Glama](https://glama.ai/mcp/servers/@Anarkh-Lee/universal-db-mcp) |

### Claude Skills

| Resource | Description | URL |
|----------|-------------|-----|
| **pg-aiguide** | MCP server providing PostgreSQL documentation and skills for improved code generation. | [GitHub](https://github.com/timescale/pg-aiguide) |
| **postgres** | Execute safe read-only SQL queries with multi-connection support. | [awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) |

---

## 9. Chaos Engineering & Resilience Testing

### MCP Servers

| Resource | Description | URL |
|----------|-------------|-----|
| **LitmusChaos MCP Server** | Go-based MCP server connecting Claude to ChaosCenter. Discover, trigger, observe Litmus chaos experiments. | [litmuschaos.io](https://litmuschaos.io/blog/making-chaos-engineering-accessible-introducing-the-litmuschaos-mcp-server-kif) |
| **Steadybit MCP Server** | First AI-extensible solution for chaos engineering. Connect Steadybit data to LLMs for reliability insights. | [Steadybit](https://steadybit.com/news/steadybit-launches-the-first-mcp-server-for-chaos-engineering-bringing-experiment-insights-to-llm-workflows/) |
| **Harness Chaos Engineering MCP** | Test application resilience through natural language prompts. Discover and execute chaos experiments. | [Harness](https://developer.harness.io/docs/chaos-engineering/guides/ai/mcp/) |

### Load Testing

| Resource | Description | URL |
|----------|-------------|-----|
| **Locust MCP Server** | AI-driven load testing for Python-centric teams. Maximum flexibility with pure code tests. | [SkyWork AI](https://skywork.ai/skypage/en/ai-load-testing-locust-server/1981542882941661184) |

---

## 10. Cloud Architecture & Cost Estimation

### MCP Servers

| Resource | Description | URL |
|----------|-------------|-----|
| **AWS Billing and Cost Management MCP** | Real-time access to AWS cost/usage data. Cost Explorer, Cost Optimization Hub, Compute Optimizer, Savings Plans integration. | [AWS Blog](https://aws.amazon.com/blogs/aws-cloud-financial-management/aws-announces-billing-and-cost-management-mcp-server/) |
| **AWS Pricing MCP Server** | Real-time AWS pricing and availability. Query rates by region on demand. | [AWS Labs](https://awslabs.github.io/mcp/) |
| **GCP MCP Toolbox for Databases** | Simplifies AI-agent access to Cloud SQL, Spanner, AlloyDB, BigQuery. | [Google Cloud](https://cloud.google.com/) |

---

## 11. Domain-Driven Design & Microservices

### Frameworks & Guides

| Resource | Description | URL |
|----------|-------------|-----|
| **Claude-Flow DDD** | DDD guidance including bounded contexts, aggregate consistency, domain events. Service boundaries aligned with bounded contexts. | [GitHub Wiki](https://github.com/ruvnet/claude-flow/wiki/CLAUDE-MD-DDD) |
| **Azure Domain Analysis Guide** | DDD approach for microservices design fitting functional business requirements. | [Microsoft Learn](https://learn.microsoft.com/en-us/azure/architecture/microservices/model/domain-analysis) |
| **Microservices.io Patterns** | Decompose by subdomain pattern aligning with DDD bounded contexts. | [microservices.io](https://microservices.io/patterns/decomposition/decompose-by-subdomain.html) |

---

## 12. General Architecture Skills & Plugins

### Curated Collections

| Resource | Description | URL |
|----------|-------------|-----|
| **awesome-claude-skills** | Curated list of Claude Skills, resources, and tools for customizing Claude AI workflows. | [GitHub](https://github.com/ComposioHQ/awesome-claude-skills) |
| **awesome-claude-code-plugins** | Curated collection of Claude Code plugins with embedded AI skills. | [GitHub](https://github.com/ccplugins/awesome-claude-code-plugins) |
| **claude-code-plugins-plus-skills** | Hundreds of Claude Code plugins with embedded AI skills. Interactive Jupyter tutorials. 739 skills across 20 categories. | [GitHub](https://github.com/jeremylongshore/claude-code-plugins-plus-skills) |
| **alirezarezvani/claude-skills** | Collection of skills for Claude Code including subagents and commands. Factory toolkit for generating production-ready skills. | [GitHub](https://github.com/alirezarezvani/claude-skills) |
| **Claude Code Resource List (2026)** | Curated list of 100+ free agents, skills, plugins. | [scriptbyai.com](https://www.scriptbyai.com/claude-code-resource-list/) |

### Multi-Agent Orchestration

| Resource | Description | URL |
|----------|-------------|-----|
| **Claude-Flow** | Leading agent orchestration platform. Multi-agent swarms, autonomous workflows, RAG integration, native MCP support. | [GitHub](https://github.com/ruvnet/claude-flow) |
| **wshobson/agents** | Intelligent automation and multi-agent orchestration for Claude Code. | [GitHub Topics](https://github.com/topics/claude-skills) |

### Documentation

| Resource | Description | URL |
|----------|-------------|-----|
| **Anthropic Agent Skills Docs** | Official documentation for Claude Agent Skills. | [platform.claude.com](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) |
| **Claude Code Skills Extension** | Official docs for extending Claude with skills. | [code.claude.com](https://code.claude.com/docs/en/skills) |
| **Agent Skills Marketplace** | Marketplace for Claude, Codex, and ChatGPT skills. | [skillsmp.com](https://skillsmp.com/) |

---

## Summary Statistics

| Category | Reference Count |
|----------|-----------------|
| Diagram Generation & Visualization | 13 |
| API Design & Documentation | 6 |
| Architecture Decision Records (ADR) | 8 |
| Code Analysis & Complexity | 12 |
| Infrastructure as Code (IaC) | 11 |
| Security & Threat Modeling | 9 |
| Observability & Monitoring | 6 |
| Database & Data Architecture | 8 |
| Chaos Engineering & Resilience Testing | 4 |
| Cloud Architecture & Cost Estimation | 3 |
| Domain-Driven Design & Microservices | 3 |
| General Architecture Skills & Plugins | 9 |
| **Total References** | **92** |

---

## Mapping to Backlog Skills/Agents

### High-Priority Backlog Items with Available References

| Backlog Skill/Agent | Available External Resources |
|---------------------|------------------------------|
| c4-diagram-generator | Structurizr, c4viz, Mermaid MCP, UML-MCP |
| plantuml-renderer | UML-MCP, MCP Kroki Server |
| mermaid-renderer | Mermaid MCP, Claude Mermaid, mcp-mermaid, Sailor |
| openapi-generator | mcp-openapi-schema, Apidog MCP, openapi-expert |
| graphql-schema-generator | mcp-graphql, mcp-graphql-schema |
| adr-generator | ADR Creator Skill, adr-writer, ADR Analysis MCP |
| terraform-analyzer | Terraform MCP Server (HashiCorp), AWS Terraform MCP |
| k8s-validator | kubernetes-mcp-server, mcp-server-kubernetes |
| security-scanner | Snyk MCP, McpSafetyScanner, SecureVibes |
| threat-modeler | STRIDE-GPT |
| code-complexity-analyzer | Codacy MCP, Code Pathfinder MCP, code-index-mcp |
| dependency-graph-generator | D3.js Dependency Graph Visualizer, Code Pathfinder MCP |
| dashboard-generator | Grafana MCP Server |
| db-query-analyzer | Postgres MCP Pro, pgEdge Postgres MCP |
| chaos-runner | LitmusChaos MCP, Steadybit MCP, Harness Chaos MCP |
| cloud-cost-estimator | AWS Billing MCP, AWS Pricing MCP |

### Backlog Items Requiring Custom Implementation

The following backlog items have limited or no direct external references and may require custom implementation:

- Graphviz DOT Renderer (partial: UML-MCP supports some)
- API Mock Server (Prism/Mockoon integration)
- Swagger UI Deployer
- Performance Profiler
- Metrics Schema Generator
- Log Schema Generator
- Tracing Schema Generator
- Load Test Generator (k6/Locust scripts)
- Compliance Checker (SOC2, GDPR, HIPAA, PCI-DSS)

---

## Last Updated

2026-01-24

---

## Contributing

To add new references:
1. Verify the resource is actively maintained
2. Confirm compatibility with Claude Code or MCP protocol
3. Add to the appropriate category with description and URL
4. Update the summary statistics
