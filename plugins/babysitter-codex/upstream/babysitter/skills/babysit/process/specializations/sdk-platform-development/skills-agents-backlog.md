# SDK/Platform Development - Skills and Agents Backlog (Phase 4)

## Overview

This document identifies specialized skills and agents that could enhance the SDK/Platform Development processes beyond general-purpose capabilities. These are categorized by domain expertise and mapped to the processes they would support.

---

## Category 1: API Design and Specification Skills

### Skill: openapi-spec-generator
- **Type**: Skill
- **Description**: Automated OpenAPI specification generation from code annotations, comments, and interface definitions
- **Processes Supported**: API Design Specification, API Documentation System
- **Capabilities**:
  - Parse code to extract API endpoints and schemas
  - Generate OpenAPI 3.x specifications
  - Validate spec completeness and correctness
  - Auto-update specs from code changes
- **Integration Points**: Code analysis tools, schema validators

### Skill: graphql-schema-designer
- **Type**: Skill
- **Description**: GraphQL schema design and optimization with federation support
- **Processes Supported**: API Design Specification, Multi-Language SDK Strategy
- **Capabilities**:
  - Design type-safe GraphQL schemas
  - Implement schema stitching and federation
  - Optimize query complexity and depth limits
  - Generate schema documentation
- **Integration Points**: Apollo, Hasura, graphql-codegen

### Skill: protobuf-grpc-designer
- **Type**: Skill
- **Description**: Protocol Buffers and gRPC service definition with backward compatibility checks
- **Processes Supported**: API Design Specification, Backward Compatibility Management
- **Capabilities**:
  - Design .proto files with best practices
  - Implement gRPC service definitions
  - Validate wire format compatibility
  - Generate language-specific stubs
- **Integration Points**: buf, protoc, grpcurl

### Agent: api-design-reviewer
- **Type**: Agent
- **Description**: Expert API design review agent following industry standards (Google, Microsoft, Stripe)
- **Processes Supported**: API Design Specification, Developer Experience Optimization
- **Capabilities**:
  - Review API designs against style guides
  - Identify usability issues and anti-patterns
  - Suggest naming and structure improvements
  - Benchmark against industry leaders
- **Knowledge Base**: Azure SDK Guidelines, Google API Design Guide, Stripe API patterns

---

## Category 2: SDK Code Generation Skills

### Skill: openapi-codegen-orchestrator
- **Type**: Skill
- **Description**: Orchestrate multi-language SDK generation from OpenAPI specifications
- **Processes Supported**: SDK Code Generation Pipeline, Multi-Language SDK Strategy
- **Capabilities**:
  - Configure OpenAPI Generator per language
  - Apply custom templates and post-processing
  - Handle edge cases and custom extensions
  - Validate generated code compilation
- **Integration Points**: OpenAPI Generator, Swagger Codegen, AutoRest

### Skill: smithy-sdk-generator
- **Type**: Skill
- **Description**: AWS Smithy-based SDK generation for enterprise-grade APIs
- **Processes Supported**: SDK Code Generation Pipeline, SDK Architecture Design
- **Capabilities**:
  - Design Smithy models with traits
  - Generate SDKs with AWS-style patterns
  - Implement waiters, paginators, and retries
  - Support custom code generation plugins
- **Integration Points**: AWS Smithy, smithy-typescript, smithy-go

### Skill: typespec-sdk-generator
- **Type**: Skill
- **Description**: Microsoft TypeSpec-based API and SDK generation
- **Processes Supported**: SDK Code Generation Pipeline, API Design Specification
- **Capabilities**:
  - Design APIs using TypeSpec language
  - Generate multi-language SDKs
  - Emit OpenAPI and other formats
  - Apply Azure SDK style guidelines
- **Integration Points**: TypeSpec compiler, autorest emitters

### Agent: template-customization-agent
- **Type**: Agent
- **Description**: Intelligent agent for creating and maintaining language-specific SDK templates
- **Processes Supported**: SDK Code Generation Pipeline, Multi-Language SDK Strategy
- **Capabilities**:
  - Analyze language idioms and conventions
  - Create idiomatic code templates
  - Apply post-generation transformations
  - Maintain template version compatibility
- **Knowledge Base**: Language style guides, SDK patterns per ecosystem

---

## Category 3: Multi-Language Support Skills

### Skill: typescript-sdk-specialist
- **Type**: Skill
- **Description**: TypeScript SDK development with Node.js and browser support
- **Processes Supported**: Multi-Language SDK Strategy, SDK Architecture Design
- **Capabilities**:
  - Design TypeScript SDK architecture
  - Implement type-safe API clients
  - Support ESM and CommonJS modules
  - Configure bundling for browsers
- **Integration Points**: npm, tsup, esbuild, Vitest

### Skill: python-sdk-specialist
- **Type**: Skill
- **Description**: Python SDK development with async support and type hints
- **Processes Supported**: Multi-Language SDK Strategy, SDK Architecture Design
- **Capabilities**:
  - Design Pythonic SDK architecture
  - Implement async/await with aiohttp
  - Configure type hints and mypy
  - Support Python 3.8+ compatibility
- **Integration Points**: PyPI, pytest, mypy, httpx

### Skill: go-sdk-specialist
- **Type**: Skill
- **Description**: Go SDK development with idiomatic patterns
- **Processes Supported**: Multi-Language SDK Strategy, SDK Architecture Design
- **Capabilities**:
  - Design Go SDK with modules
  - Implement context-based cancellation
  - Apply Go error handling patterns
  - Configure go.mod versioning
- **Integration Points**: go modules, go test, golangci-lint

### Skill: java-sdk-specialist
- **Type**: Skill
- **Description**: Java SDK development for enterprise environments
- **Processes Supported**: Multi-Language SDK Strategy, SDK Architecture Design
- **Capabilities**:
  - Design Java SDK with builders
  - Implement reactive and sync clients
  - Configure Maven/Gradle publishing
  - Support Java 11+ compatibility
- **Integration Points**: Maven Central, JUnit, Gradle

### Skill: csharp-sdk-specialist
- **Type**: Skill
- **Description**: C#/.NET SDK development with async patterns
- **Processes Supported**: Multi-Language SDK Strategy, SDK Architecture Design
- **Capabilities**:
  - Design .NET SDK architecture
  - Implement async/await patterns
  - Configure NuGet publishing
  - Support .NET Standard/Core/.NET 6+
- **Integration Points**: NuGet, xUnit, dotnet CLI

### Skill: rust-sdk-specialist
- **Type**: Skill
- **Description**: Rust SDK development with zero-cost abstractions
- **Processes Supported**: Multi-Language SDK Strategy, SDK Architecture Design
- **Capabilities**:
  - Design Rust SDK with traits
  - Implement async with tokio
  - Configure cargo publishing
  - Ensure memory safety patterns
- **Integration Points**: crates.io, cargo, tokio

### Agent: cross-language-consistency-agent
- **Type**: Agent
- **Description**: Ensures feature parity and naming consistency across SDK languages
- **Processes Supported**: Multi-Language SDK Strategy, SDK Testing Strategy
- **Capabilities**:
  - Verify API surface consistency
  - Map naming conventions across languages
  - Identify missing features per language
  - Generate consistency reports
- **Knowledge Base**: Cross-language naming mappings, feature parity matrices

---

## Category 4: Documentation and Developer Portal Skills

### Skill: diataxis-doc-generator
- **Type**: Skill
- **Description**: Generate documentation following the Diataxis framework
- **Processes Supported**: API Documentation System, SDK Onboarding and Tutorials
- **Capabilities**:
  - Structure docs as tutorials, how-to, reference, explanation
  - Generate getting started guides
  - Create interactive API reference
  - Build code example repositories
- **Integration Points**: Docusaurus, ReadTheDocs, Mintlify

### Skill: interactive-api-console
- **Type**: Skill
- **Description**: Build interactive API try-it-out consoles for documentation
- **Processes Supported**: API Documentation System, Developer Portal Implementation
- **Capabilities**:
  - Embed API explorer in docs
  - Auto-generate request examples
  - Support authentication injection
  - Enable code snippet generation
- **Integration Points**: Swagger UI, Redoc, Stoplight Elements

### Skill: developer-portal-builder
- **Type**: Skill
- **Description**: Build unified developer portals with Backstage or custom frameworks
- **Processes Supported**: Developer Portal Implementation, Internal Developer Platform Setup
- **Capabilities**:
  - Configure service catalog
  - Implement credential management UI
  - Build API discovery features
  - Integrate analytics dashboards
- **Integration Points**: Backstage, Port, custom React apps

### Agent: dx-content-writer
- **Type**: Agent
- **Description**: Technical writer agent specialized in developer documentation
- **Processes Supported**: API Documentation System, SDK Onboarding and Tutorials
- **Capabilities**:
  - Write clear, concise technical content
  - Create progressive learning paths
  - Develop code examples in multiple languages
  - Apply Google Developer Documentation Style Guide
- **Knowledge Base**: Diataxis framework, technical writing best practices

### Agent: tutorial-builder-agent
- **Type**: Agent
- **Description**: Creates step-by-step tutorials and interactive learning experiences
- **Processes Supported**: SDK Onboarding and Tutorials, Developer Experience Optimization
- **Capabilities**:
  - Design tutorial progression
  - Create sandbox environments
  - Build interactive code playgrounds
  - Implement progress tracking
- **Knowledge Base**: Learning design principles, developer onboarding patterns

---

## Category 5: Versioning and Compatibility Skills

### Skill: semver-analyzer
- **Type**: Skill
- **Description**: Analyze code changes and determine semantic version bumps
- **Processes Supported**: SDK Versioning and Release Management, Backward Compatibility Management
- **Capabilities**:
  - Detect breaking changes automatically
  - Suggest version bump (major/minor/patch)
  - Generate changelog entries
  - Validate version consistency
- **Integration Points**: semantic-release, conventional-commits

### Skill: api-diff-analyzer
- **Type**: Skill
- **Description**: Compare API specifications to detect breaking changes
- **Processes Supported**: API Versioning Strategy, Backward Compatibility Management
- **Capabilities**:
  - Compare OpenAPI spec versions
  - Categorize changes by severity
  - Generate migration guides
  - Block breaking changes in CI
- **Integration Points**: oasdiff, optic, Akita

### Skill: deprecation-manager
- **Type**: Skill
- **Description**: Manage API and SDK deprecation lifecycle
- **Processes Supported**: Backward Compatibility Management, API Versioning Strategy
- **Capabilities**:
  - Track deprecation timelines
  - Inject deprecation warnings
  - Send sunset notifications
  - Generate migration documentation
- **Integration Points**: Sunset header injection, deprecation annotations

### Skill: codemod-generator
- **Type**: Skill
- **Description**: Generate automated code migration scripts (codemods)
- **Processes Supported**: Backward Compatibility Management, Package Distribution
- **Capabilities**:
  - Create AST-based transformations
  - Support multiple languages
  - Provide dry-run and rollback
  - Generate migration reports
- **Integration Points**: jscodeshift, libcst, go-codemod

### Agent: compatibility-auditor
- **Type**: Agent
- **Description**: Reviews changes for backward compatibility violations
- **Processes Supported**: Backward Compatibility Management, SDK Versioning and Release Management
- **Capabilities**:
  - Audit API changes against compatibility policy
  - Identify subtle breaking changes
  - Suggest backward-compatible alternatives
  - Approve/reject changes with rationale
- **Knowledge Base**: SemVer rules, API evolution patterns

---

## Category 6: Authentication and Security Skills

### Skill: oauth-flow-implementer
- **Type**: Skill
- **Description**: Implement OAuth 2.0 and OpenID Connect flows for SDKs
- **Processes Supported**: Authentication and Authorization Patterns, Platform API Gateway Design
- **Capabilities**:
  - Implement authorization code flow with PKCE
  - Configure client credentials flow
  - Handle token refresh automatically
  - Support device authorization flow
- **Integration Points**: OAuth libraries, OIDC providers

### Skill: api-key-manager
- **Type**: Skill
- **Description**: API key generation, rotation, and management system
- **Processes Supported**: Authentication and Authorization Patterns, Developer Portal Implementation
- **Capabilities**:
  - Generate secure API keys
  - Implement key rotation
  - Track key usage and quotas
  - Support key scoping
- **Integration Points**: Key management systems, rate limiters

### Skill: jwt-handler
- **Type**: Skill
- **Description**: JWT creation, validation, and management for SDK authentication
- **Processes Supported**: Authentication and Authorization Patterns, SDK Architecture Design
- **Capabilities**:
  - Generate and validate JWTs
  - Implement JWK key rotation
  - Support multiple signing algorithms
  - Handle token claims validation
- **Integration Points**: jose libraries, JWKS endpoints

### Skill: scope-permission-designer
- **Type**: Skill
- **Description**: Design and implement scoped permission models
- **Processes Supported**: Authentication and Authorization Patterns, Developer Portal Implementation
- **Capabilities**:
  - Design scope hierarchies
  - Implement permission validation
  - Generate scope documentation
  - Support scope-based access control
- **Integration Points**: Policy engines, RBAC systems

### Agent: security-review-agent
- **Type**: Agent
- **Description**: Reviews SDK authentication and security implementations
- **Processes Supported**: Authentication and Authorization Patterns, SDK Architecture Design
- **Capabilities**:
  - Audit authentication flows
  - Identify security vulnerabilities
  - Review credential handling
  - Suggest security improvements
- **Knowledge Base**: OWASP guidelines, OAuth best practices

---

## Category 7: Testing and Quality Skills

### Skill: contract-test-framework
- **Type**: Skill
- **Description**: Consumer-driven contract testing for SDK-API compatibility
- **Processes Supported**: SDK Testing Strategy, Compatibility Testing
- **Capabilities**:
  - Generate Pact consumer tests
  - Verify provider contracts
  - Configure Pact broker
  - Implement can-i-deploy checks
- **Integration Points**: Pact, Pactflow, Spring Cloud Contract

### Skill: sdk-mock-generator
- **Type**: Skill
- **Description**: Generate mock servers and clients for SDK testing
- **Processes Supported**: SDK Testing Strategy, Developer Experience Optimization
- **Capabilities**:
  - Generate mock servers from OpenAPI
  - Create SDK test fixtures
  - Implement response stubbing
  - Support stateful mocking
- **Integration Points**: Prism, WireMock, MSW

### Skill: performance-benchmark-suite
- **Type**: Skill
- **Description**: SDK performance benchmarking and regression detection
- **Processes Supported**: Performance Benchmarking, SDK Testing Strategy
- **Capabilities**:
  - Measure latency percentiles
  - Track memory usage
  - Detect performance regressions
  - Generate benchmark reports
- **Integration Points**: k6, Artillery, hyperfine

### Skill: compatibility-test-matrix
- **Type**: Skill
- **Description**: Multi-version, multi-platform SDK compatibility testing
- **Processes Supported**: Compatibility Testing, SDK Testing Strategy
- **Capabilities**:
  - Test across runtime versions
  - Validate OS compatibility
  - Check dependency compatibility
  - Generate compatibility matrices
- **Integration Points**: GitHub Actions matrix, tox, nox

### Agent: test-coverage-analyzer
- **Type**: Agent
- **Description**: Analyzes test coverage and identifies testing gaps
- **Processes Supported**: SDK Testing Strategy, Compatibility Testing
- **Capabilities**:
  - Analyze code coverage
  - Identify untested paths
  - Suggest test scenarios
  - Track coverage trends
- **Knowledge Base**: Testing patterns, edge case identification

---

## Category 8: Error Handling and Debugging Skills

### Skill: error-code-catalog
- **Type**: Skill
- **Description**: Manage and document SDK error codes and messages
- **Processes Supported**: Error Handling and Debugging Support, API Design Specification
- **Capabilities**:
  - Define error code taxonomy
  - Generate error documentation
  - Validate error message quality
  - Support error localization
- **Integration Points**: Error tracking systems, i18n frameworks

### Skill: actionable-error-formatter
- **Type**: Skill
- **Description**: Format errors with actionable fix suggestions and documentation links
- **Processes Supported**: Error Handling and Debugging Support, Developer Experience Optimization
- **Capabilities**:
  - Generate helpful error messages
  - Include fix suggestions
  - Add documentation links
  - Support verbose debug mode
- **Integration Points**: Error handling frameworks, logging systems

### Skill: request-debugger
- **Type**: Skill
- **Description**: HTTP request/response debugging and inspection tools
- **Processes Supported**: Error Handling and Debugging Support, Logging and Diagnostics
- **Capabilities**:
  - Log request/response details
  - Redact sensitive data
  - Correlate with request IDs
  - Support curl command export
- **Integration Points**: HTTP client interceptors, logging frameworks

### Agent: error-message-reviewer
- **Type**: Agent
- **Description**: Reviews error messages for clarity and actionability
- **Processes Supported**: Error Handling and Debugging Support, Developer Experience Optimization
- **Capabilities**:
  - Evaluate error message quality
  - Suggest clearer wording
  - Ensure consistent tone
  - Validate fix suggestions
- **Knowledge Base**: Error message best practices, UX writing

---

## Category 9: Observability and Telemetry Skills

### Skill: opentelemetry-integrator
- **Type**: Skill
- **Description**: Integrate OpenTelemetry tracing and metrics into SDKs
- **Processes Supported**: Observability Integration, Telemetry and Analytics Integration
- **Capabilities**:
  - Add tracing spans to SDK operations
  - Export metrics (latency, errors, throughput)
  - Configure context propagation
  - Support multiple exporters
- **Integration Points**: OpenTelemetry SDKs, Jaeger, Prometheus

### Skill: usage-analytics-collector
- **Type**: Skill
- **Description**: Privacy-respecting SDK usage analytics collection
- **Processes Supported**: Telemetry and Analytics Integration, Developer Portal Implementation
- **Capabilities**:
  - Track SDK feature usage
  - Implement opt-in/opt-out
  - Anonymize collected data
  - Generate usage dashboards
- **Integration Points**: Segment, Amplitude, custom analytics

### Skill: health-check-endpoint
- **Type**: Skill
- **Description**: Implement health check and readiness endpoints for SDK consumers
- **Processes Supported**: Observability Integration, Platform API Gateway Design
- **Capabilities**:
  - Design health check contracts
  - Implement dependency checks
  - Support Kubernetes probes
  - Generate health reports
- **Integration Points**: Kubernetes, load balancers, monitoring systems

### Agent: telemetry-privacy-auditor
- **Type**: Agent
- **Description**: Audits SDK telemetry for privacy compliance
- **Processes Supported**: Telemetry and Analytics Integration, Observability Integration
- **Capabilities**:
  - Review data collection practices
  - Verify anonymization
  - Check consent mechanisms
  - Ensure GDPR/CCPA compliance
- **Knowledge Base**: Privacy regulations, data minimization principles

---

## Category 10: Platform and Infrastructure Skills

### Skill: api-gateway-configurator
- **Type**: Skill
- **Description**: Configure API gateways for SDK traffic management
- **Processes Supported**: Platform API Gateway Design, API Versioning Strategy
- **Capabilities**:
  - Configure request routing
  - Implement rate limiting
  - Set up authentication
  - Configure circuit breakers
- **Integration Points**: Kong, AWS API Gateway, Apigee

### Skill: rate-limiter-designer
- **Type**: Skill
- **Description**: Design and implement rate limiting strategies
- **Processes Supported**: Platform API Gateway Design, Authentication and Authorization Patterns
- **Capabilities**:
  - Implement token bucket/leaky bucket
  - Configure per-key limits
  - Design quota systems
  - Generate rate limit headers
- **Integration Points**: Redis, rate limiting middleware

### Skill: idp-configurator
- **Type**: Skill
- **Description**: Configure Internal Developer Platform (IDP) components
- **Processes Supported**: Internal Developer Platform Setup, Developer Portal Implementation
- **Capabilities**:
  - Set up Backstage catalogs
  - Configure golden path templates
  - Implement self-service workflows
  - Integrate with CI/CD
- **Integration Points**: Backstage, Port, Cortex

### Agent: platform-architect
- **Type**: Agent
- **Description**: Designs SDK platform infrastructure and architecture
- **Processes Supported**: Platform API Gateway Design, Internal Developer Platform Setup
- **Capabilities**:
  - Design scalable API infrastructure
  - Plan multi-region deployments
  - Optimize for performance
  - Ensure high availability
- **Knowledge Base**: Cloud architecture patterns, API platform design

---

## Category 11: CLI and Tooling Skills

### Skill: cli-framework-builder
- **Type**: Skill
- **Description**: Build command-line interfaces for SDK interaction
- **Processes Supported**: CLI Tool Development, Developer Experience Optimization
- **Capabilities**:
  - Design CLI command structure
  - Implement interactive prompts
  - Generate shell completions
  - Support configuration management
- **Integration Points**: oclif, cobra, click, typer

### Skill: sdk-init-generator
- **Type**: Skill
- **Description**: Generate SDK initialization wizards and scaffolding
- **Processes Supported**: CLI Tool Development, SDK Onboarding and Tutorials
- **Capabilities**:
  - Create project scaffolding
  - Generate configuration files
  - Implement interactive setup
  - Support multiple frameworks
- **Integration Points**: Yeoman, create-* packages, cookiecutter

### Agent: cli-ux-reviewer
- **Type**: Agent
- **Description**: Reviews CLI user experience and command design
- **Processes Supported**: CLI Tool Development, Developer Experience Optimization
- **Capabilities**:
  - Evaluate command naming
  - Review output formatting
  - Assess help text quality
  - Ensure consistency
- **Knowledge Base**: CLI design guidelines, Unix conventions

---

## Category 12: Plugin and Extension Skills

### Skill: middleware-chain-designer
- **Type**: Skill
- **Description**: Design middleware and interceptor chains for SDK extensibility
- **Processes Supported**: Plugin and Extension Architecture, Custom Transport and Middleware
- **Capabilities**:
  - Design middleware interfaces
  - Implement interceptor chains
  - Support before/after hooks
  - Enable custom transports
- **Integration Points**: SDK core architecture, HTTP clients

### Skill: plugin-registry-manager
- **Type**: Skill
- **Description**: Manage SDK plugin discovery and registration
- **Processes Supported**: Plugin and Extension Architecture, SDK Architecture Design
- **Capabilities**:
  - Design plugin interfaces
  - Implement plugin loading
  - Validate plugin compatibility
  - Document plugin API
- **Integration Points**: Plugin registries, npm/pypi extensions

### Agent: extensibility-architect
- **Type**: Agent
- **Description**: Designs SDK extensibility patterns and plugin systems
- **Processes Supported**: Plugin and Extension Architecture, SDK Architecture Design
- **Capabilities**:
  - Design extension points
  - Review plugin interfaces
  - Ensure backward compatibility
  - Document extension patterns
- **Knowledge Base**: Plugin architecture patterns, SDK extension best practices

---

## Shared/Cross-Cutting Skills and Agents

### Skill: changelog-generator
- **Type**: Skill (Shared)
- **Description**: Automated changelog generation from commits and PRs
- **Processes Supported**: SDK Versioning and Release Management, API Versioning Strategy
- **Shared With**: DevOps/SRE, Technical Documentation
- **Capabilities**:
  - Parse conventional commits
  - Generate release notes
  - Categorize changes
  - Support multiple formats

### Skill: cicd-pipeline-generator
- **Type**: Skill (Shared)
- **Description**: Generate CI/CD pipelines for SDK build and release
- **Processes Supported**: SDK Versioning and Release Management, SDK Code Generation Pipeline
- **Shared With**: DevOps/SRE
- **Capabilities**:
  - Generate GitHub Actions/GitLab CI
  - Configure multi-language builds
  - Set up release automation
  - Implement quality gates

### Agent: technical-writer-agent
- **Type**: Agent (Shared)
- **Description**: General technical writing agent for SDK documentation
- **Processes Supported**: All documentation-related processes
- **Shared With**: Technical Documentation
- **Capabilities**:
  - Write clear documentation
  - Follow style guides
  - Create examples
  - Review content quality

### Skill: package-publisher
- **Type**: Skill (Shared)
- **Description**: Publish packages to language-specific registries
- **Processes Supported**: Package Distribution, SDK Versioning and Release Management
- **Shared With**: DevOps/SRE
- **Capabilities**:
  - Publish to npm, PyPI, Maven, NuGet
  - Implement package signing
  - Configure CDN distribution
  - Verify installation

---

## Summary Statistics

| Category | Skills | Agents | Total |
|----------|--------|--------|-------|
| API Design and Specification | 3 | 1 | 4 |
| SDK Code Generation | 3 | 1 | 4 |
| Multi-Language Support | 6 | 1 | 7 |
| Documentation and Developer Portal | 3 | 2 | 5 |
| Versioning and Compatibility | 4 | 1 | 5 |
| Authentication and Security | 4 | 1 | 5 |
| Testing and Quality | 4 | 1 | 5 |
| Error Handling and Debugging | 3 | 1 | 4 |
| Observability and Telemetry | 3 | 1 | 4 |
| Platform and Infrastructure | 3 | 1 | 4 |
| CLI and Tooling | 2 | 1 | 3 |
| Plugin and Extension | 2 | 1 | 3 |
| Shared/Cross-Cutting | 3 | 1 | 4 |
| **Total** | **43** | **14** | **57** |

### Shared Candidates Summary

The following skills/agents are identified as candidates for sharing across specializations:

1. **changelog-generator** - Shared with DevOps/SRE, Technical Documentation
2. **cicd-pipeline-generator** - Shared with DevOps/SRE
3. **technical-writer-agent** - Shared with Technical Documentation
4. **package-publisher** - Shared with DevOps/SRE
5. **security-review-agent** - Shared with Security/Compliance
6. **api-design-reviewer** - Shared with Software Architecture
7. **performance-benchmark-suite** - Shared with Performance Optimization
8. **contract-test-framework** - Shared with QA/Testing Automation

---

## Implementation Priority

### Phase 1 (Critical - High Impact)
1. openapi-codegen-orchestrator
2. typescript-sdk-specialist / python-sdk-specialist
3. api-design-reviewer
4. contract-test-framework
5. semver-analyzer

### Phase 2 (Important - Medium Impact)
6. diataxis-doc-generator
7. oauth-flow-implementer
8. api-diff-analyzer
9. cross-language-consistency-agent
10. error-code-catalog

### Phase 3 (Enhancement - Lower Priority)
11. opentelemetry-integrator
12. cli-framework-builder
13. middleware-chain-designer
14. developer-portal-builder
15. All remaining skills/agents

---

## References

- Azure SDK Guidelines: https://azure.github.io/azure-sdk/
- Google API Design Guide: https://cloud.google.com/apis/design
- OpenAPI Generator: https://openapi-generator.tech/
- Smithy: https://smithy.io/
- TypeSpec: https://typespec.io/
- Pact Contract Testing: https://docs.pact.io/
- Diataxis Documentation Framework: https://diataxis.fr/
- OpenTelemetry: https://opentelemetry.io/

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01 | Initial skills and agents backlog created |
