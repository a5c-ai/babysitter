# Code Migration/Modernization - Skills and Agents References

This document catalogs community-created Claude skills, agents, plugins, MCPs, and related tools that match the skills and agents identified in the Code Migration/Modernization backlog. These resources can accelerate implementation or serve as reference implementations.

## Overview

**Specialization**: Code Migration/Modernization
**Phase**: 5 - Skills and Agents References
**Total References Found**: 78
**Categories Covered**: 12

---

## Table of Contents

1. [MCP Servers](#mcp-servers)
   - [Code Analysis & Transformation](#code-analysis--transformation)
   - [Database Migration](#database-migration)
   - [Cloud & Infrastructure](#cloud--infrastructure)
   - [Version Control & Git](#version-control--git)
   - [Security & Vulnerability Scanning](#security--vulnerability-scanning)
   - [Dependency Management](#dependency-management)

2. [Claude Code Subagents](#claude-code-subagents)
   - [Refactoring & Modernization](#refactoring--modernization)
   - [Architecture & Design](#architecture--design)
   - [Testing & Quality](#testing--quality)

3. [Codemod & AST Tools](#codemod--ast-tools)
   - [AST-based Transformation](#ast-based-transformation)
   - [Framework Migration](#framework-migration)

4. [Claude Skills & Plugins](#claude-skills--plugins)

5. [Reference Implementations](#reference-implementations)

6. [Mapping to Backlog Items](#mapping-to-backlog-items)

---

## MCP Servers

### Code Analysis & Transformation

#### 1. SonarQube MCP Server (Official)
**URL**: https://github.com/SonarSource/sonarqube-mcp-server
**Documentation**: https://docs.sonarsource.com/sonarqube-mcp-server
**Maps to Skills**: static-code-analyzer, code-smell-detector, technical-debt-quantifier
**Description**: Official MCP server from SonarSource providing seamless integration with SonarQube Server or Cloud for code quality and security analysis. Supports code snippet analysis directly within agent context.
**Features**:
- Code quality analysis on file lists
- Issue management and metrics retrieval
- Quality gate monitoring
- Security vulnerability detection
- Dependency risk analysis (Enterprise 2025.4+)
**Compatibility**: SonarQube Server 2025.1+, SonarQube Cloud, SonarQube Community Build

#### 2. ast-grep MCP Server
**URL**: https://github.com/ast-grep/ast-grep-mcp
**Alternative**: https://github.com/thrawn01/mcp-ast-grep
**Maps to Skills**: codemod-executor, refactoring-assistant, dead-code-eliminator
**Description**: Experimental MCP server providing AI assistants with powerful structural code search capabilities using ast-grep. Enables AST pattern matching rather than simple text-based search.
**Features**:
- dump_ast: Dumps AST nodes in AI-friendly format
- get_node_types: Gets tree-sitter node types for programming languages
- run_jssg_tests: Runs tests for TypeScript transformation scripts
- get_ast_grep_instructions: AST manipulation guidance
- get_codemod_cli_instructions: Codemod CLI integration

#### 3. Codemod MCP Server
**URL**: https://docs.codemod.com/model-context-protocol
**GitHub**: https://github.com/codemod/codemod
**Maps to Skills**: codemod-executor, refactoring-assistant
**Description**: MCP server providing AI tools for code analysis, AST manipulation, and codemod creation. Democratizes code transformation by integrating deterministic engines into AI-powered development workflows.
**Features**:
- First-class ast-grep support
- Multi-step transformations
- Framework upgrade codemods
- Security patch codemods
- Custom codemod scaffolding

#### 4. Code Guardian Studio
**URL**: https://github.com/phuongrealmax/code-guardian
**Maps to Skills**: refactoring-assistant, static-code-analyzer
**Description**: AI-powered code refactor engine for large repositories, built on Claude Code + MCP. Specializes in systematic code improvement across large codebases.

---

### Database Migration

#### 5. Postgres MCP Pro
**URL**: https://github.com/crystaldba/postgres-mcp
**Maps to Skills**: schema-comparator, query-translator, data-migration-validator
**Description**: Configurable read/write access and performance analysis for PostgreSQL databases. Provides comprehensive database management capabilities.
**Features**:
- Schema listing and exploration
- Database object introspection (tables, views, sequences, extensions)
- SQL execution with read-only mode option
- Query execution plan analysis
- Column, constraint, and index information

#### 6. PostgreSQL MCP Server (HenkDz)
**URL**: https://github.com/HenkDz/postgresql-mcp-server
**Maps to Skills**: schema-comparator, data-migration-validator
**Description**: Powerful PostgreSQL MCP server with 14 consolidated database management tools for AI assistants. Completely redesigned from 46 individual tools.
**Features**:
- Schema management
- Data manipulation with transaction management
- Comment management capabilities
- Intelligent tool consolidation

#### 7. MCP-PostgreSQL-Ops
**URL**: https://github.com/call518/MCP-PostgreSQL-Ops
**Maps to Skills**: schema-comparator, performance-baseline-capturer
**Description**: Professional MCP server for PostgreSQL operations & monitoring with 30+ extension-independent tools.
**Features**:
- Performance analysis
- Table bloat detection
- Autovacuum monitoring
- Schema introspection
- Database management (PostgreSQL 12-17)

#### 8. SQL Server to PostgreSQL Migration
**URL**: https://github.com/dalibo/sqlserver2pgsql
**Maps to Skills**: query-translator, schema-comparator
**Description**: Migration tool to convert Microsoft SQL Server Database into PostgreSQL database as automatically as possible. Written in Perl.

---

### Cloud & Infrastructure

#### 9. AWS MCP Servers (Official)
**URL**: https://github.com/awslabs/mcp
**Documentation**: https://awslabs.github.io/mcp/
**Maps to Skills**: cloud-readiness-assessor, iac-generator, cloud-cost-estimator
**Maps to Agents**: cloud-migration-engineer, infrastructure-migration-agent
**Description**: Official AWS MCP servers providing comprehensive AWS API support with access to latest documentation, API references, and agent SOPs.
**Features**:
- Command validation and security controls
- All AWS service access
- Infrastructure management through natural language
- Resource exploration and AWS operations

#### 10. Azure MCP Server (Official)
**URL**: https://github.com/microsoft/mcp (Current)
**Previous**: https://github.com/Azure/azure-mcp (Archived)
**Maps to Skills**: cloud-readiness-assessor, iac-generator, cloud-cost-estimator
**Maps to Agents**: cloud-migration-engineer, infrastructure-migration-agent
**Description**: Azure MCP Server 1.0 GA - supercharges agents with Azure context across 40+ different Azure services.
**Features**:
- Single server for all Azure MCP tools
- Seamless AI agent and Azure service connection
- Multi-service integration

#### 11. Terraform MCP Server (HashiCorp Official)
**URL**: https://github.com/hashicorp/terraform-mcp-server
**Documentation**: https://awslabs.github.io/mcp/servers/terraform-mcp-server
**Maps to Skills**: iac-generator, configuration-migrator
**Maps to Agents**: infrastructure-migration-agent
**Description**: Seamless integration with Terraform ecosystem for Infrastructure as Code development automation.
**Features**:
- Dual transport support (Stdio and StreamableHTTP)
- Terraform Registry integration
- HCP Terraform & Terraform Enterprise support
- Workspace management
- Private registry access

#### 12. Kubernetes MCP Server
**URL**: https://github.com/containers/kubernetes-mcp-server
**Maps to Skills**: containerization-assistant, iac-generator
**Maps to Agents**: cloud-migration-engineer
**Description**: Go-based native implementation interacting directly with Kubernetes API server. Not a wrapper around kubectl/helm.
**Features**:
- Multi-cluster support
- Cross-platform (Linux, macOS, Windows)
- Stateless mode for container deployments
- High-performance/low-latency direct API interaction

#### 13. Cloud Cost MCP Server
**URL**: https://github.com/jasonwilbur/cloud-cost-mcp
**Maps to Skills**: cloud-cost-estimator
**Maps to Agents**: cost-optimization-agent
**Description**: Multi-cloud pricing comparison across AWS, Azure, GCP, and OCI with 2,700+ instance types.
**Features**:
- Real-time pricing from public APIs
- Workload calculators
- Migration savings estimator

---

### Version Control & Git

#### 14. GitHub MCP Server (Official)
**URL**: https://github.com/github/github-mcp-server
**Documentation**: https://github.blog/ai-and-ml/generative-ai/a-practical-guide-on-how-to-use-the-github-mcp-server/
**Maps to Skills**: rollback-automation-skill, documentation-generator
**Maps to Agents**: cutover-coordinator, migration-project-coordinator
**Description**: Official GitHub MCP Server connecting AI tools directly to GitHub platform for repository management, issue/PR automation, and workflow intelligence.
**Features**:
- Repository browsing and code analysis
- Issue and PR management
- GitHub Actions workflow monitoring
- Build failure analysis
- Dependabot alert review
- GitHub Projects support

#### 15. Git MCP Server
**URL**: https://github.com/cyanheads/git-mcp-server
**Maps to Skills**: rollback-automation-skill
**Maps to Agents**: rollback-specialist
**Description**: MCP server enabling LLMs and AI agents to interact with Git repositories with 27 comprehensive tools.
**Features**:
- Clone, commit, branch, diff, log, status, push, pull
- Merge, rebase, worktree, tag management
- Systematic workflow protocol for git sessions
- Safety features for destructive operations
- Session-specific directory context

---

### Security & Vulnerability Scanning

#### 16. MCP-Scan
**URL**: https://github.com/invariantlabs-ai/mcp-scan
**Maps to Skills**: vulnerability-scanner, compliance-validator
**Maps to Agents**: security-vulnerability-assessor
**Description**: Security scanning tool for local and remote MCP Servers checking connections for common vulnerabilities.
**Features**:
- Static scanning for malicious tool descriptions
- Tool poisoning attack detection
- Cross-origin escalation detection
- Proxy mode for real-time monitoring
- PII detection
- Indirect prompt injection protection

#### 17. SBOM Generator MCP Server (Trivy)
**URL**: https://playbooks.com/mcp/trivy-sbom-generator
**Maps to Skills**: dependency-scanner, vulnerability-scanner, license-compliance-checker
**Description**: MCP server performing Trivy scanning to generate Software Bill of Materials (SBOM) in CycloneDX format.
**Features**:
- Detailed component information
- Package metadata
- License information
- Vulnerability data for security compliance
- Dependency analysis

---

### Dependency Management

#### 18. GitHub Dependabot MCP Server
**URL**: https://mcp.so/server/github-dependabot-mcp-server/avarant
**Maps to Skills**: dependency-scanner, dependency-updater, vulnerability-scanner
**Maps to Agents**: dependency-modernization-agent
**Description**: Server designed to work with GitHub's Dependabot for automating dependency updates.
**Features**:
- Automatic library and framework updates
- Security vulnerability addressing
- Streamlined dependency currency management

---

## Claude Code Subagents

### Refactoring & Modernization

#### 19. Legacy Modernizer Subagent
**Repository**: https://github.com/VoltAgent/awesome-claude-code-subagents
**Path**: `categories/06-developer-experience/legacy-modernizer.md`
**Maps to Skills**: legacy-code-interpreter, technical-debt-quantifier
**Maps to Agents**: legacy-system-archaeologist, technical-debt-auditor
**Description**: Legacy code modernization specialist for transforming outdated codebases.

#### 20. Refactoring Specialist Subagent
**Repository**: https://github.com/VoltAgent/awesome-claude-code-subagents
**Path**: `categories/06-developer-experience/refactoring-specialist.md`
**Maps to Skills**: refactoring-assistant, code-smell-detector, dead-code-eliminator
**Maps to Agents**: code-transformation-executor
**Description**: Expert refactoring specialist mastering safe code transformation techniques and design pattern application. Specializes in improving code structure, reducing complexity, and enhancing maintainability while preserving behavior.
**Expertise**:
- Code smell detection
- Refactoring pattern application
- Safe transformation techniques
- Test-driven refactoring

#### 21. Dependency Manager Subagent
**Repository**: https://github.com/VoltAgent/awesome-claude-code-subagents
**Path**: `categories/06-developer-experience/dependency-manager.md`
**Maps to Skills**: dependency-scanner, dependency-updater, license-compliance-checker
**Maps to Agents**: dependency-modernization-agent
**Description**: Package and dependency specialist for managing project dependencies.

#### 22. Code Reviewer Subagent
**Repository**: https://github.com/VoltAgent/awesome-claude-code-subagents
**Path**: `categories/04-quality-security/code-reviewer.md`
**Maps to Skills**: static-code-analyzer, code-smell-detector
**Maps to Agents**: technical-debt-auditor
**Description**: Code quality guardian with capabilities for migration guides, dependency analysis (version management, security vulnerabilities, license compliance), and technical debt assessment.

---

### Architecture & Design

#### 23. Architect Reviewer Subagent
**Repository**: https://github.com/VoltAgent/awesome-claude-code-subagents
**Path**: `categories/04-quality-security/architect-reviewer.md`
**Maps to Skills**: architecture-analyzer
**Maps to Agents**: ddd-analyst
**Description**: Architecture review specialist for evaluating system designs.

#### 24. Microservices Architect Subagent
**Repository**: https://github.com/VoltAgent/awesome-claude-code-subagents
**Path**: `categories/01-core-development/microservices-architect.md`
**Maps to Skills**: domain-model-extractor, strangler-fig-orchestrator
**Maps to Agents**: microservices-decomposer, ddd-analyst
**Description**: Identifies service boundaries through domain-driven design. Demonstrated success decomposing monolith into 12 services with clear boundaries.
**Achievements**:
- Kubernetes deployment with Istio service mesh
- Kafka event streaming implementation
- Comprehensive observability setup

#### 25. API Designer Subagent
**Repository**: https://github.com/VoltAgent/awesome-claude-code-subagents
**Path**: `categories/01-core-development/api-designer.md`
**Maps to Skills**: api-inventory-scanner, openapi-generator, api-compatibility-analyzer
**Maps to Agents**: api-modernization-architect
**Description**: Handles API architecture including modernization efforts.

#### 26. Database Administrator Subagent
**Repository**: https://github.com/VoltAgent/awesome-claude-code-subagents
**Path**: `categories/03-infrastructure/database-administrator.md`
**Maps to Skills**: schema-comparator, data-migration-validator, query-translator
**Maps to Agents**: database-migration-orchestrator, data-architect-agent
**Description**: Manages database migration and optimization tasks.

---

### Testing & Quality

#### 27. Test Automator Subagent
**Repository**: https://github.com/VoltAgent/awesome-claude-code-subagents
**Path**: `categories/04-quality-security/test-automator.md`
**Maps to Skills**: characterization-test-generator, test-coverage-analyzer
**Maps to Agents**: migration-testing-strategist, regression-detector
**Description**: Essential for validating transformed code during migration.

---

### Alternative Subagent Collections

#### 28. 0xfurai/claude-code-subagents
**URL**: https://github.com/0xfurai/claude-code-subagents
**Description**: Comprehensive collection of 100+ specialized AI subagents for Claude Code with domain-specific expertise.

#### 29. rshah515/claude-code-subagents
**URL**: https://github.com/rshah515/claude-code-subagents
**Description**: Complete set of 133+ specialized AI subagents covering the entire software development lifecycle. Includes core `refactorer.md` agent for code refactoring and cleanup.

#### 30. wshobson/agents
**URL**: https://github.com/wshobson/agents
**Description**: Production-ready system combining 108 specialized AI agents, 15 multi-agent workflow orchestrators, 129 agent skills, and 72 development tools organized into focused plugins.

#### 31. supatest-ai/awesome-claude-code-sub-agents
**URL**: https://github.com/supatest-ai/awesome-claude-code-sub-agents
**Description**: Collection of specialized Claude Code agents.

#### 32. vanzan01/claude-code-sub-agent-collective
**URL**: https://github.com/vanzan01/claude-code-sub-agent-collective
**Description**: Context Engineering Research - Hub-and-spoke coordination through Claude Code.

---

## Codemod & AST Tools

### AST-based Transformation

#### 33. jscodeshift
**URL**: https://github.com/facebook/jscodeshift
**Maps to Skills**: codemod-executor
**Description**: Official JavaScript codemod toolkit from Facebook providing a runner for executing transforms and a wrapper around recast with jQuery-like API.
**Features**:
- AST-to-AST transform
- Style preservation
- Multi-file transformations
- Fluent interface for AST traversal

#### 34. jssg (JavaScript ast-grep)
**URL**: https://codemod.com/blog/jssg
**Maps to Skills**: codemod-executor
**Description**: Modern successor to jscodeshift powered by ast-grep. Keeps familiar authoring model while upgrading engine.
**Features**:
- Faster than jscodeshift
- Polyglot support
- Built-in tests
- Modern, typed developer experience

#### 35. ts-morph
**URL**: https://github.com/dsherret/ts-morph
**Maps to Skills**: codemod-executor, refactoring-assistant
**Description**: TypeScript Compiler API wrapper for easier manipulation of TypeScript/JavaScript code.

#### 36. ast-grep
**URL**: https://ast-grep.github.io/
**GitHub**: https://github.com/ast-grep/ast-grep
**Maps to Skills**: codemod-executor, static-code-analyzer
**Description**: Structural search/rewrite tool for many languages using tree-sitter for AST parsing.
**Features**:
- Pattern-based code search
- Code transformation
- Linting capabilities
- 20+ language support

---

### Framework Migration

#### 37. OpenRewrite
**URL**: https://github.com/openrewrite/rewrite
**Spring Recipes**: https://github.com/openrewrite/rewrite-spring
**Documentation**: https://docs.openrewrite.org/
**Maps to Skills**: framework-compatibility-checker, codemod-executor
**Maps to Agents**: framework-upgrade-specialist
**Description**: Large-scale automated source code refactoring. Exercises Java compiler internally to compile code patterns for modernization.
**Available Recipes**:
- Spring Boot 4.0 Migration
- Spring Boot 3.x Migrations (3.0, 3.2, 3.4, 3.5)
- Spring Framework 6.x Migrations
- Java version upgrades
- Security patches

#### 38. Rector (PHP)
**URL**: https://github.com/rectorphp/rector
**Maps to Skills**: codemod-executor, framework-compatibility-checker
**Description**: Instant upgrades and automated refactoring for PHP.

#### 39. Scalafix
**URL**: https://github.com/scalacenter/scalafix
**Maps to Skills**: codemod-executor
**Description**: Refactoring and linting tool for Scala.

#### 40. Bowler
**URL**: https://github.com/facebookincubator/Bowler
**Maps to Skills**: codemod-executor
**Description**: Safe code refactoring for modern Python.

---

## Claude Skills & Plugins

#### 41. Skill Seekers
**URL**: https://github.com/yusufkaraaslan/Skill_Seekers
**Maps to Skills**: knowledge-extractor, documentation-generator
**Description**: Converts documentation websites, GitHub repositories, and PDFs into Claude AI skills with automatic conflict detection. Includes AST parsing capabilities.

#### 42. Software Architecture Skill
**URL**: https://github.com/NeoLabHQ/context-engineering-kit/tree/master/plugins/ddd/skills/software-architecture
**Maps to Skills**: architecture-analyzer, domain-model-extractor
**Maps to Agents**: ddd-analyst
**Description**: Implements design patterns including Clean Architecture, SOLID principles, and comprehensive software design best practices.

#### 43. Subagent-Driven Development Skill
**URL**: https://github.com/NeoLabHQ/context-engineering-kit/tree/master/plugins/sadd/skills/subagent-driven-development
**Maps to Agents**: migration-project-coordinator, cross-team-integrator
**Description**: Dispatches independent subagents for individual tasks with code review checkpoints between iterations.

#### 44. Test-Driven Development Skill
**URL**: https://github.com/obra/superpowers/tree/main/skills/test-driven-development
**Maps to Skills**: characterization-test-generator, test-coverage-analyzer
**Maps to Agents**: migration-testing-strategist
**Description**: Use when implementing any feature or bugfix, before writing implementation code.

#### 45. Move Code Quality Skill
**URL**: https://github.com/1NickPappas/move-code-quality-skill
**Maps to Skills**: static-code-analyzer
**Description**: Analyzes Move language packages against official Code Quality Checklist.

#### 46. Microservices Patterns Skill
**URL**: https://mcpmarket.com/tools/skills/microservices-architecture-patterns-4
**Maps to Skills**: domain-model-extractor, strangler-fig-orchestrator
**Maps to Agents**: microservices-decomposer
**Description**: Provides guidance on strategic service decomposition using DDD, distributed data management (Saga pattern), and resilience patterns.

#### 47. API Documentation Expert
**URL**: https://subagents.app/agents/api-docs
**Maps to Skills**: openapi-generator, api-inventory-scanner
**Maps to Agents**: api-modernization-architect
**Description**: Expert agent for creating and maintaining OpenAPI/Swagger documentation.
**Features**:
- Create OpenAPI specs
- Generate Swagger documentation
- Document API authentication flows

---

## Claude Plugins (ccplugins)

#### 48. refractor Plugin
**URL**: https://github.com/ccplugins/awesome-claude-code-plugins/blob/main/plugins/refractor
**Maps to Skills**: refactoring-assistant, code-smell-detector
**Description**: Refactoring tool for code improvement.

#### 49. code-architect Plugin
**URL**: https://github.com/ccplugins/awesome-claude-code-plugins/blob/main/plugins/code-architect
**Maps to Skills**: architecture-analyzer
**Description**: Architectural design and code structure optimization.

#### 50. backend-architect Plugin
**URL**: https://github.com/ccplugins/awesome-claude-code-plugins/blob/main/plugins/backend-architect
**Maps to Skills**: architecture-analyzer
**Maps to Agents**: ddd-analyst
**Description**: Backend system design and modernization.

#### 51. database-performance-optimizer Plugin
**URL**: https://github.com/ccplugins/awesome-claude-code-plugins/blob/main/plugins/database-performance-optimizer
**Maps to Skills**: schema-comparator, query-translator
**Description**: Database query and schema optimization.

#### 52. analyze-codebase Plugin
**URL**: https://github.com/ccplugins/awesome-claude-code-plugins/blob/main/plugins/analyze-codebase
**Maps to Skills**: static-code-analyzer, architecture-analyzer
**Maps to Agents**: legacy-system-archaeologist
**Description**: Analyzes code structure and dependencies for comprehensive understanding.

#### 53. codebase-documenter Plugin
**URL**: https://github.com/ccplugins/awesome-claude-code-plugins/blob/main/plugins/codebase-documenter
**Maps to Skills**: documentation-generator, knowledge-extractor
**Description**: Documentation generation from existing code.

---

## Testing Automation

#### 54. AI Testing MCP Server
**URL**: https://github.com/Twisted66/ai-testing-mcp
**Maps to Skills**: characterization-test-generator, test-coverage-analyzer
**Maps to Agents**: migration-testing-strategist, regression-detector
**Description**: AI-powered testing automation MCP server for Claude Code (TestSprite alternative).
**Features**:
- Test generation with framework auto-detection
- Test execution
- Intelligent test result analysis with fix suggestions
- Supported frameworks: Jest, Mocha, Vitest, Pytest

#### 55. Claude Code Test Runner
**URL**: https://github.com/firstloophq/claude-code-test-runner
**Maps to Skills**: characterization-test-generator, migration-validator
**Maps to Agents**: parallel-run-validator
**Description**: Automated E2E natural language test runner built on Claude Code.
**Features**:
- Playwright MCP for browser automation
- Test State MCP server for execution state
- Natural language test definitions

---

## Reference Implementations

### DDD & Microservices

#### 56. Modular Monolith with DDD
**URL**: https://github.com/kgrzybek/modular-monolith-with-ddd
**Maps to Skills**: domain-model-extractor, architecture-analyzer
**Maps to Agents**: ddd-analyst, microservices-decomposer
**Description**: Full Modular Monolith application with Domain-Driven Design approach showing best practices and OOP principles.

#### 57. Rails Modular Monolith with DDD
**URL**: https://github.com/rootstrap/rails-modular-monolith-with-ddd
**Maps to Skills**: domain-model-extractor
**Description**: Ruby on Rails implementation of modular monolith with DDD.

#### 58. DDD for Microservices
**URL**: https://github.com/ernesen/DDD
**Maps to Skills**: domain-model-extractor
**Maps to Agents**: microservices-decomposer
**Description**: Implementing Domain-Driven Design for Microservice Architecture.

### Claude Code Guides

#### 59. Claude Code Guide
**URL**: https://github.com/Cranot/claude-code-guide
**Description**: The Complete Claude Code CLI Guide - Live & Auto-Updated Every 2 Days. Contains skill best practices.

#### 60. Claude Code Showcase
**URL**: https://github.com/ChrisWiles/claude-code-showcase
**Description**: Comprehensive Claude Code project configuration example with hooks, skills, agents, commands, and GitHub Actions workflows.

#### 61. Claude Flow - DDD Wiki
**URL**: https://github.com/ruvnet/claude-flow/wiki/CLAUDE-MD-DDD
**Maps to Agents**: ddd-analyst, microservices-decomposer
**Description**: Leading agent orchestration platform for Claude with multi-agent swarms, autonomous workflows, and MCP protocol support.

---

## Additional Tools

### Dependency Management

#### 62. Renovate
**URL**: https://github.com/renovatebot/renovate
**Maps to Skills**: dependency-scanner, dependency-updater
**Maps to Agents**: dependency-modernization-agent
**Description**: Cross-platform Dependency Automation by Mend.io. Works with 30+ package managers.
**Features**:
- Dependency Dashboard
- Complex monorepo handling
- Robust grouping features
- Multi-platform support (GitHub, GitLab, Bitbucket)

#### 63. Snyk
**URL**: https://snyk.io/
**Maps to Skills**: vulnerability-scanner, dependency-scanner
**Description**: Developer security platform for finding and fixing vulnerabilities.

#### 64. OWASP Dependency-Check
**URL**: https://github.com/jeremylong/DependencyCheck
**Maps to Skills**: vulnerability-scanner, dependency-scanner
**Description**: Software Composition Analysis tool detecting publicly disclosed vulnerabilities.

### API Tools

#### 65. OpenAPI Generator
**URL**: https://github.com/OpenAPITools/openapi-generator
**Maps to Skills**: openapi-generator
**Description**: Generates API client libraries, server stubs, documentation from OpenAPI Spec.

#### 66. Swagger Codegen
**URL**: https://github.com/swagger-api/swagger-codegen
**Maps to Skills**: openapi-generator
**Description**: Template-driven engine to generate documentation, API clients, and server stubs.

### Infrastructure Tools

#### 67. Terraformer
**URL**: https://github.com/GoogleCloudPlatform/terraformer
**Maps to Skills**: iac-generator
**Description**: Generate Terraform files from existing infrastructure (reverse Terraform).

#### 68. Former2
**URL**: https://github.com/iann0036/former2
**Maps to Skills**: iac-generator
**Description**: Generate CloudFormation/Terraform from existing AWS resources.

### Testing Tools

#### 69. ApprovalTests
**URL**: https://github.com/approvals
**Maps to Skills**: characterization-test-generator
**Description**: Approval testing libraries for capturing golden master tests.

#### 70. Pact
**URL**: https://github.com/pact-foundation
**Maps to Skills**: contract-test-generator
**Maps to Agents**: cross-team-integrator
**Description**: Consumer-driven contract testing framework.

### Database Tools

#### 71. Flyway
**URL**: https://github.com/flyway/flyway
**Maps to Skills**: schema-comparator
**Description**: Database migration tool supporting version control for database.

#### 72. Liquibase
**URL**: https://github.com/liquibase/liquibase
**Maps to Skills**: schema-comparator
**Description**: Database schema change management.

#### 73. SQLGlot
**URL**: https://github.com/tobymao/sqlglot
**Maps to Skills**: query-translator
**Description**: Python SQL Parser and Transpiler supporting multiple dialects.

### Container Tools

#### 74. Dive
**URL**: https://github.com/wagoodman/dive
**Maps to Skills**: containerization-assistant
**Description**: Tool for exploring Docker images, layer contents, and reducing image size.

#### 75. Jib
**URL**: https://github.com/GoogleContainerTools/jib
**Maps to Skills**: containerization-assistant
**Description**: Build optimized Docker and OCI images for Java applications.

---

## Mapping to Backlog Items

### Skills Coverage Matrix

| Backlog Skill | References Found | Primary Tools |
|---------------|------------------|---------------|
| static-code-analyzer | 5 | SonarQube MCP, ast-grep, Code Reviewer Subagent |
| architecture-analyzer | 4 | Architect Reviewer, code-architect plugin |
| code-smell-detector | 4 | SonarQube MCP, Refactoring Specialist |
| test-coverage-analyzer | 3 | AI Testing MCP, Test Automator Subagent |
| dependency-scanner | 5 | SBOM Generator, Dependabot MCP, Renovate |
| vulnerability-scanner | 4 | MCP-Scan, SBOM Generator, Snyk |
| license-compliance-checker | 2 | SBOM Generator, Dependency Manager Subagent |
| codemod-executor | 7 | Codemod MCP, ast-grep MCP, jscodeshift, OpenRewrite |
| refactoring-assistant | 5 | Refactoring Specialist, refractor plugin, Code Guardian |
| dead-code-eliminator | 2 | ast-grep, Refactoring Specialist |
| legacy-code-interpreter | 2 | Legacy Modernizer, analyze-codebase plugin |
| technical-debt-quantifier | 3 | SonarQube MCP, Code Reviewer Subagent |
| knowledge-extractor | 2 | Skill Seekers, codebase-documenter |
| framework-compatibility-checker | 2 | OpenRewrite, Codemod MCP |
| schema-comparator | 4 | Postgres MCP Pro, PostgreSQL MCP Server, Flyway |
| data-migration-validator | 3 | Postgres MCP Pro, Database Administrator Subagent |
| query-translator | 2 | SQLGlot, database-performance-optimizer |
| etl-pipeline-builder | 1 | (Reference: Apache Airflow, dbt) |
| api-inventory-scanner | 2 | API Designer Subagent, API Documentation Expert |
| openapi-generator | 3 | OpenAPI Generator, Swagger Codegen, API Documentation Expert |
| api-compatibility-analyzer | 2 | API Designer Subagent |
| cloud-readiness-assessor | 2 | AWS MCP, Azure MCP |
| iac-generator | 4 | Terraform MCP, Terraformer, Former2 |
| containerization-assistant | 3 | Kubernetes MCP, Dive, Jib |
| cloud-cost-estimator | 2 | Cloud Cost MCP, AWS/Azure MCP |
| characterization-test-generator | 3 | AI Testing MCP, ApprovalTests, TDD Skill |
| performance-baseline-capturer | 2 | MCP-PostgreSQL-Ops |
| migration-validator | 2 | Claude Code Test Runner |
| contract-test-generator | 2 | Pact |
| strangler-fig-orchestrator | 2 | Microservices Architect Subagent, Microservices Patterns Skill |
| domain-model-extractor | 4 | Microservices Architect, DDD Skill, Modular Monolith reference |
| rollback-automation-skill | 2 | Git MCP Server, GitHub MCP |
| compliance-validator | 2 | MCP-Scan |
| documentation-generator | 3 | codebase-documenter, API Documentation Expert |

### Agents Coverage Matrix

| Backlog Agent | References Found | Primary Tools |
|---------------|------------------|---------------|
| legacy-system-archaeologist | 2 | Legacy Modernizer, analyze-codebase |
| migration-readiness-assessor | 2 | AWS MCP, Azure MCP |
| technical-debt-auditor | 2 | SonarQube MCP, Code Reviewer |
| security-vulnerability-assessor | 3 | MCP-Scan, SBOM Generator |
| database-migration-orchestrator | 3 | PostgreSQL MCP servers |
| api-modernization-architect | 3 | API Designer, API Documentation Expert |
| microservices-decomposer | 4 | Microservices Architect, DDD references |
| framework-upgrade-specialist | 3 | OpenRewrite, Codemod MCP |
| cloud-migration-engineer | 3 | AWS MCP, Azure MCP, Terraform MCP |
| code-transformation-executor | 4 | Refactoring Specialist, Codemod tools |
| dependency-modernization-agent | 3 | Dependency Manager, Dependabot MCP, Renovate |
| migration-testing-strategist | 3 | AI Testing MCP, Test Automator |
| regression-detector | 2 | AI Testing MCP |
| data-integrity-validator | 2 | PostgreSQL MCP servers |
| infrastructure-migration-agent | 3 | Terraform MCP, Kubernetes MCP |
| cutover-coordinator | 2 | GitHub MCP, Git MCP |
| rollback-specialist | 2 | Git MCP Server |
| ddd-analyst | 4 | Microservices Architect, DDD skills/references |
| migration-project-coordinator | 2 | Subagent-Driven Development |

---

## Resource Collections

### Awesome Lists

| Resource | URL | Description |
|----------|-----|-------------|
| awesome-mcp-servers (punkpeye) | https://github.com/punkpeye/awesome-mcp-servers | Curated MCP servers list |
| awesome-mcp-servers (wong2) | https://github.com/wong2/awesome-mcp-servers | Curated MCP servers list |
| awesome-mcp-servers (TensorBlock) | https://github.com/TensorBlock/awesome-mcp-servers | 7260+ MCP servers coverage |
| awesome-claude-skills | https://github.com/ComposioHQ/awesome-claude-skills | Claude skills collection |
| awesome-claude-code-plugins | https://github.com/ccplugins/awesome-claude-code-plugins | Claude Code plugins |
| awesome-claude-code-subagents | https://github.com/VoltAgent/awesome-claude-code-subagents | 100+ specialized subagents |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **MCP Servers** | 18 |
| **Claude Code Subagents** | 14 |
| **Codemod/AST Tools** | 8 |
| **Claude Skills/Plugins** | 13 |
| **Testing Tools** | 5 |
| **Reference Implementations** | 6 |
| **Additional Tools** | 14 |
| **Total References** | 78 |
| **Categories Covered** | 12 |

---

## Next Steps

1. **Evaluate Priority Tools**: Start with high-priority MCP servers (SonarQube, ast-grep, Terraform, AWS/Azure)
2. **Integrate Subagents**: Deploy VoltAgent subagents for immediate capability boost
3. **Build Custom MCPs**: Create specialized MCPs where gaps exist (ETL, strangler-fig orchestration)
4. **Establish Tool Chain**: Connect Codemod MCP + OpenRewrite for comprehensive migration support
5. **Testing Infrastructure**: Deploy AI Testing MCP for migration validation
6. **Document Integrations**: Create integration guides for Babysitter SDK orchestration

---

## References

- [MCP Specification](https://modelcontextprotocol.io/)
- [Claude Code Documentation](https://code.claude.com/docs/)
- [SonarQube MCP Documentation](https://docs.sonarsource.com/sonarqube-mcp-server)
- [Codemod Documentation](https://docs.codemod.com/)
- [OpenRewrite Documentation](https://docs.openrewrite.org/)
- [ast-grep Documentation](https://ast-grep.github.io/)
