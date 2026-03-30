# SDK/Platform Development - Skills and Agents References (Phase 5)

## Overview

This document provides community-created Claude skills, agents, plugins, and MCP servers that match the skills and agents identified in Phase 4 backlog. These references enable rapid implementation of SDK/Platform Development capabilities through existing open-source resources.

---

## Category 1: API Design and Specification

### OpenAPI/Swagger Tools

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **mcp-openapi-schema** | MCP Server | [GitHub](https://github.com/hannesj/mcp-openapi-schema) | Exposes OpenAPI schema information to LLMs, enabling exploration of API paths, operations, parameters, and schemas |
| **openapi-mcp-server** | MCP Server | [GitHub](https://github.com/janwilmake/openapi-mcp-server) | Allows AI to navigate complex OpenAPIs using natural language |
| **swagger-mcp** | MCP Server | [GitHub](https://github.com/johnneerdael/swagger-mcp) | Swagger Explorer MCP for analyzing OpenAPI specifications with support for large APIs and private API authentication |
| **Apidog MCP Server** | MCP Server | [Apidog](https://apidog.com/blog/top-10-mcp-servers-for-claude-code/) | API Specification Integration connecting AI to OpenAPI/Swagger files with intelligent code generation |
| **openapi-expert** | Claude Plugin | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) | Specializes in OpenAPI specification creation and optimization |
| **Theneo MCP Server** | MCP Server | [Theneo](https://www.theneo.io/blog/launch-mcp-server) | One-command tool giving API projects AI-native endpoints with /openapi, /context, and tool manifest support |

### GraphQL Tools

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **mcp-graphql** | MCP Server | [GitHub](https://github.com/blurrah/mcp-graphql) | GraphQL MCP Server for Claude Desktop with mutation safety controls |
| **mcp-graphql-schema** | MCP Server | [Glama](https://glama.ai/mcp/servers/@hannesj/mcp-graphql-schema) | Exposes GraphQL schema information to LLMs without loading entire schema into context |
| **Grafbase MCP** | MCP Server | [Mirumee](https://mirumee.com/blog/from-graphql-schema-to-mcp-server) | Turn GraphQL API into MCP server with schema intelligence in a single command |
| **Apollo MCP Server** | MCP Server | [MCPMarket](https://mcpmarket.com/server/graphql-1) | Connect GraphQL APIs to AI agents |

### gRPC/Protobuf Tools

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **ggRMCP** | MCP Server | [GitHub](https://github.com/aalobaidi/ggRMCP) | Gateway converting gRPC services into MCP-compatible tools with automatic schema generation from Protobuf |
| **protoc-gen-go-mcp** | Code Generator | [Redpanda](https://www.redpanda.com/blog/turn-grpc-api-into-mcp-server) | Protocol Buffers compiler plugin generating MCP servers from gRPC services |
| **awesome-grpc** | Reference | [GitHub](https://github.com/grpc-ecosystem/awesome-grpc) | Curated list of gRPC resources including code generation tools |

### API Design Review

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **api-integration-specialist** | Claude Plugin | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) | Handles complex API connectivity and middleware design |
| **backend-architect** | Claude Plugin | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) | API architecture design and optimization |
| **Stainless SDK Platform** | Platform | [Stainless](https://www.stainless.com/blog/stainless-in-2025-building-the-api-platform-we-always-wanted) | API platform with spec transforms, MCP server generation, and SDK generation |

---

## Category 2: SDK Code Generation

### Multi-Language SDK Generation

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **Claude Agent SDK (TypeScript)** | Official SDK | [GitHub](https://github.com/anthropics/claude-agent-sdk-typescript) | Official TypeScript SDK for building AI agents |
| **claude-code-sdk (Python)** | Official SDK | [PyPI](https://pypi.org/project/claude-code-sdk/) | Official Python SDK for Claude Code integration |
| **claude-code-sdk-go** | Community SDK | [Go Packages](https://pkg.go.dev/github.com/yukifoo/claude-code-sdk-go) | Go SDK wrapper providing programmatic access to Claude's agentic capabilities |
| **AWS Smithy Models** | Code Generator | [AWS Blog](https://aws.amazon.com/blogs/aws/introducing-aws-api-models-and-publicly-available-resources-for-aws-api-definitions/) | Generate SDKs in any language from Smithy API models |
| **AWS PDK Type-Safe API** | Framework | [AWS PDK](https://aws.github.io/aws-pdk/developer_guides/type-safe-api/index.html) | Define APIs using Smithy, TypeSpec, or OpenAPI with multi-language SDK generation |

### SDK Development Kits

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **developer-kit** | Claude Skill | [GitHub](https://github.com/giuseppe-trisciuoglio/developer-kit) | Starter kit for building skills/agents with patterns for Java, Spring Boot, extensible to multiple languages |
| **claude-code-skill-factory** | Toolkit | [GitHub](https://github.com/alirezarezvani/claude-code-skill-factory) | Production-ready toolkit for building Claude Skills, agents, and slash commands at scale |
| **agent-sdk-dev** | Claude Plugin | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) | Custom shortcuts for Agent SDK development workflows |

### Template & Code Generation

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **rapid-prototyper** | Claude Plugin | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) | Quick developer tool scaffolding |
| **code-architect** | Claude Plugin | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) | Structural patterns and SDK interface design |
| **MCP Builder** | Claude Skill | [ComposioHQ](https://github.com/ComposioHQ/awesome-claude-skills) | Guides creation of MCP servers for integrating APIs with LLMs using Python or TypeScript |
| **Skill Creator** | Claude Skill | [ComposioHQ](https://github.com/ComposioHQ/awesome-claude-skills) | Guidance for creating effective Claude Skills with specialized knowledge and tool integrations |

---

## Category 3: Documentation and Developer Portal

### Documentation Generation

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **Mintlify Documentation Manager** | Claude Skill | [MCPMarket](https://mcpmarket.com/tools/skills/mintlify-documentation-manager) | Claude Code skill for managing Mintlify documentation |
| **generate-api-docs** | Claude Plugin | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) | Automated API documentation generation from code |
| **documentation-generator** | Claude Plugin | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) | Comprehensive codebase documentation creation |
| **codebase-documenter** | Claude Plugin | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) | Ensures consistent documentation workflows |
| **document-specialist-skill** | Claude Skill | [GitHub](https://github.com/SpillwaveSolutions/document-specialist-skill) | AI-powered documentation automation for design, requirements, SRS, PRD, and API docs |
| **typo3-docs-skill** | Claude Skill | [GitHub](https://github.com/netresearch/typo3-docs-skill) | Documentation maintenance automation |
| **agents-skill** | Claude Skill | [GitHub](https://github.com/netresearch/agents-skill) | Generates AGENTS.md files following documentation conventions |

### Documentation Platforms Integration

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **docmole** | MCP Server | [GitHub](https://github.com/Vigtu/docmole) | Query any Mintlify-powered documentation from MCP clients with RAG support |
| **Mintlify MCP Generator** | Platform | [Mintlify](https://www.mintlify.com/blog/how-to-use-mcp-servers-to-generate-docs) | Auto-generates MCP servers for documentation |
| **Docusaurus Agent** | Integration | [Medium](https://medium.com/@dan.avila7/automated-documentation-with-claude-code-building-self-updating-docs-using-docusaurus-agent-2c85d3ec0e19) | Automated documentation system using Claude Code and Docusaurus |
| **Stoplight Elements** | API Docs | [Stoplight](https://stoplight.io/open-source/elements) | API documentation tool with OpenAPI support |
| **Redoc** | API Docs | [GitHub](https://github.com/Redocly/redoc) | OpenAPI/Swagger documentation generator |

### Developer Portal / IDP

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **Backstage MCP Plugin** | MCP Server | [Vrabbi Cloud](https://vrabbi.cloud/post/backstage-as-the-ultimate-mcp-server/) | MCP integration with Backstage developer portal |
| **catalog-mcp-backend** | Backstage Plugin | [Backstage](https://backstage.io/) | Bridges MCP to Backstage Catalog API for entity queries |
| **scaffolder-mcp-backend** | Backstage Plugin | [Backstage](https://backstage.io/) | Bridges MCP to Scaffolder API for template operations |
| **Port MCP Server** | MCP Server | [Port.io](https://www.port.io/blog/integrate-software-catalog-every-workflow-port-mcp-server) | Software catalog integration for developer workflows |

---

## Category 4: Versioning and Compatibility

### Changelog and Release Management

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **changelog-generator** | Claude Skill | [ComposioHQ](https://github.com/ComposioHQ/awesome-claude-skills) | Automatically creates user-facing changelogs from git commits |
| **changelog-generator** | Claude Plugin | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) | Version history and release note automation |
| **Claude Code Action** | GitHub Action | [GitHub](https://github.com/anthropics/claude-code-action) | AI-powered automation for PRs and releases |

### API Diff and Compatibility

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **Specmatic MCP Server** | MCP Server | [GitHub](https://github.com/specmatic/specmatic-mcp-server) | API contract validation and breaking change detection using git comparison |
| **PactFlow MCP Server** | MCP Server | [PactFlow](https://pactflow.io/blog/pactflow-mcp-server/) | Consumer-driven contract testing with AI code review |

---

## Category 5: Package Publishing and Distribution

### Package Registry Tools

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **package-registry-mcp** | MCP Server | [GitHub](https://github.com/Artmann/package-registry-mcp) | Search and get info from NPM, Cargo, PyPi, and NuGet packages |
| **mcp-package-version** | MCP Server | [npm](https://www.npmjs.com/package/mcp-package-version) | Check package versions across registries |
| **Dependency MCP Server** | MCP Server | [LobeHub](https://lobehub.com/mcp/niradler-dependency-mcp) | Multi-language package version checking across NPM, PyPI, Maven, NuGet, RubyGems, Crates.io, Go modules |
| **MCP Registry** | Registry | [MCP Info](https://modelcontextprotocol.info/tools/registry/) | Official MCP registry supporting npm, PyPI, and NuGet publishing |

---

## Category 6: Authentication and Security

### OAuth and Token Management

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **MCP OAuth 2.1 Spec** | Specification | [Composio](https://composio.dev/blog/oauth-2-1-in-mcp) | OAuth 2.1 implementation guide for MCP |
| **Auth0 MCP Integration** | Integration | [Auth0](https://auth0.com/blog/an-introduction-to-mcp-and-authorization/) | MCP authorization with Auth0 |
| **Stytch MCP Auth Guide** | Guide | [Stytch](https://stytch.com/blog/MCP-authentication-and-authorization-guide/) | Authentication and authorization implementation guide |
| **Curity MCP Authorization** | Integration | [Curity](https://curity.io/resources/learn/implementing-mcp-authorization-apis/) | Enterprise MCP authorization implementation |
| **Azure APIM MCP** | Integration | [Microsoft](https://developer.microsoft.com/blog/claude-ready-secure-mcp-apim) | Entra ID-protected MCP servers with Azure API Management |
| **Zuplo MCP OAuth** | Integration | [Zuplo](https://zuplo.com/blog/building-secure-mcp-servers-with-oauth) | Building secure MCP servers with OAuth |

---

## Category 7: Testing and Quality

### Contract Testing

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **PactFlow MCP Server** | MCP Server | [PactFlow](https://pactflow.io/blog/pactflow-mcp-server/) | AI-powered contract testing embedded in modern editors |
| **Specmatic MCP Server** | MCP Server | [GitHub](https://github.com/specmatic/specmatic-mcp-server) | Contract testing and mock server management for Claude Code |
| **pact-js** | Testing Framework | [GitHub](https://github.com/pact-foundation/pact-js) | Consumer-driven contract testing framework |

### API Testing

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **api-tester** | Claude Plugin | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) | API validation framework |
| **unit-test-generator** | Claude Plugin | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) | Automated testing framework setup |
| **analyze-codebase** | Claude Plugin | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) | SDK surface analysis and API inventory |

### Code Quality and Linting

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **lint-fixer** | Claude Skill | [MCPMarket](https://mcpmarket.com/tools/skills/lint-fixer) | Automated linting and fixing skill |
| **cclint** | Linting Tool | [GitHub](https://github.com/carlrannaberg/cclint) | Linter for Claude Code project files, agent definitions, and command configurations |

---

## Category 8: Observability and Telemetry

### OpenTelemetry Integration

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **opentelemetry-mcp-server** | MCP Server | [GitHub](https://github.com/traceloop/opentelemetry-mcp-server) | Query OpenTelemetry traces across Jaeger, Tempo, Traceloop for automated debugging |
| **claude_telemetry** | CLI Wrapper | [GitHub](https://github.com/TechNickAI/claude_telemetry) | OpenTelemetry wrapper logging tool calls, token usage, costs to Logfire, Sentry, Honeycomb, Datadog |
| **claude-code-otel** | Observability | [GitHub](https://github.com/ColeMurray/claude-code-otel) | Comprehensive observability for monitoring Claude Code usage, performance, and costs |
| **Claude Code OTel Native** | Built-in | [Claude Docs](https://code.claude.com/docs/en/monitoring-usage) | Native OpenTelemetry support in Claude Code |
| **Langfuse Claude Integration** | Observability | [Langfuse](https://langfuse.com/integrations/frameworks/claude-agent-sdk) | Observability for Claude Agent SDK |

---

## Category 9: CI/CD and Automation

### GitHub Actions

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **claude-code-action** | GitHub Action | [GitHub](https://github.com/anthropics/claude-code-action) | Official Claude Code action for GitHub PRs and issues |
| **claude-code-base-action** | GitHub Action | [GitHub](https://github.com/anthropics/claude-code-base-action) | Base action for Claude Code GitHub integrations |
| **claude-flow** | Orchestrator | [GitHub](https://github.com/ruvnet/claude-flow) | Enterprise-grade architecture with distributed swarm intelligence and MCP protocol support |

### CI/CD Integration

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **cicd-pipeline-generator** | Claude Skill | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) | Generate GitHub Actions/GitLab CI pipelines |

---

## Category 10: CLI and Tooling

### CLI Development

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **cli-toolchain** | Claude Skill | [Claude Plugins](https://claude-plugins.dev/skills/@phrazzld/claude-config/cli-toolchain) | CLI development patterns using Commander.js, oclif, Ink for Node.js |
| **Claude Skill CLI** | CLI Tool | [Medium](https://kotrotsos.medium.com/claude-skill-cli-b22b244171e0) | Manage Claude Code skills from the terminal |
| **claude-code-templates** | CLI Tool | [GitHub](https://github.com/davila7/claude-code-templates) | CLI tool for configuring and monitoring Claude Code |

### Project Scaffolding

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **pinme** | Deployment Tool | [GitHub](https://github.com/glitternetwork/pinme) | Deploy frontend in a single command with Claude Code Skills support |
| **outline-driven-development** | Development Skill | [GitHub](https://github.com/OutlineDriven/outline-driven-development) | AST analysis and CLI tools with context engineering |

---

## Category 11: Platform Infrastructure

### AWS MCP Servers

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **AWS MCP Servers** | MCP Server | [GitHub](https://github.com/awslabs/mcp) | Official AWS MCP servers with 45+ tools for AWS operations |
| **AWS MCP Hosted Server** | Managed Service | [AWS Labs](https://awslabs.github.io/mcp/) | Remote managed MCP server with AWS documentation and API support |

### API Gateway

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **APIWeaver** | MCP Server | [MCPMarket](https://mcpmarket.com/) | Dynamic MCP server creation from REST API, GraphQL endpoint, or web service configurations |

---

## Category 12: Skills Collections and Repositories

### Curated Collections

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **awesome-claude-skills (travisvn)** | Collection | [GitHub](https://github.com/travisvn/awesome-claude-skills) | Curated list of Claude Skills for customizing workflows |
| **awesome-claude-skills (ComposioHQ)** | Collection | [GitHub](https://github.com/ComposioHQ/awesome-claude-skills) | Skills, resources, and tools for Claude AI workflows |
| **awesome-claude-skills (VoltAgent)** | Collection | [GitHub](https://github.com/VoltAgent/awesome-claude-skills) | Agent Skills standard compatible with Codex, Gemini CLI |
| **awesome-claude-code** | Collection | [GitHub](https://github.com/hesreallyhim/awesome-claude-code) | Skills, hooks, slash-commands, agent orchestrators for Claude Code |
| **awesome-claude-code-plugins** | Collection | [GitHub](https://github.com/ccplugins/awesome-claude-code-plugins) | Plugin registry at claudecodeplugins.dev |
| **claude-code-plugins-plus-skills** | Collection | [GitHub](https://github.com/jeremylongshore/claude-code-plugins-plus-skills) | 739 skills across 20 categories including DevOps, Security, ML, Data, API |

### Official Resources

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **anthropics/skills** | Official Repo | [GitHub](https://github.com/anthropics/skills) | Official example skills and Agent Skills standard |
| **Agent Skills Specification** | Standard | [agentskills.io](https://agentskills.io) | Open standard for AI agent skills |
| **SkillsMP** | Marketplace | [SkillsMP](https://skillsmp.com/) | Agent Skills Marketplace for Claude, Codex, and ChatGPT |

---

## Summary Statistics

| Category | References Found |
|----------|-----------------|
| API Design and Specification | 16 |
| SDK Code Generation | 12 |
| Documentation and Developer Portal | 15 |
| Versioning and Compatibility | 5 |
| Package Publishing and Distribution | 4 |
| Authentication and Security | 6 |
| Testing and Quality | 8 |
| Observability and Telemetry | 5 |
| CI/CD and Automation | 4 |
| CLI and Tooling | 5 |
| Platform Infrastructure | 3 |
| Skills Collections and Repositories | 8 |
| **Total** | **91** |

---

## Mapping to Backlog Skills

### High Coverage (Multiple Resources Available)

| Backlog Skill/Agent | Matching Resources |
|---------------------|-------------------|
| openapi-spec-generator | mcp-openapi-schema, openapi-mcp-server, swagger-mcp, Apidog MCP |
| graphql-schema-designer | mcp-graphql, mcp-graphql-schema, Grafbase MCP, Apollo MCP |
| protobuf-grpc-designer | ggRMCP, protoc-gen-go-mcp |
| diataxis-doc-generator | Mintlify MCP, docmole, Docusaurus Agent |
| developer-portal-builder | Backstage MCP Plugin, Port MCP Server, catalog-mcp-backend |
| changelog-generator | ComposioHQ changelog-generator, ccplugins changelog-generator |
| contract-test-framework | PactFlow MCP, Specmatic MCP, pact-js |
| opentelemetry-integrator | opentelemetry-mcp-server, claude_telemetry, claude-code-otel |
| oauth-flow-implementer | MCP OAuth 2.1 Spec, Auth0 integration, Stytch guide, Curity, Azure APIM |

### Partial Coverage (Some Resources)

| Backlog Skill/Agent | Matching Resources |
|---------------------|-------------------|
| api-diff-analyzer | Specmatic MCP (breaking change detection) |
| semver-analyzer | changelog-generator (indirectly) |
| cli-framework-builder | cli-toolchain skill |
| package-publisher | package-registry-mcp, Dependency MCP Server |
| sdk-mock-generator | Specmatic MCP (mock server management) |

### Gaps (Limited/No Direct Resources)

| Backlog Skill/Agent | Notes |
|---------------------|-------|
| smithy-sdk-generator | AWS Smithy models available but no dedicated MCP |
| typespec-sdk-generator | AWS PDK supports TypeSpec, no dedicated skill |
| deprecation-manager | No dedicated resource found |
| codemod-generator | No dedicated MCP/skill found |
| error-code-catalog | Can be built using documentation skills |
| actionable-error-formatter | Partial coverage via lint-fixer |
| usage-analytics-collector | Can use OpenTelemetry tools |
| rate-limiter-designer | No dedicated MCP found |
| middleware-chain-designer | No dedicated resource found |
| plugin-registry-manager | No dedicated resource found |

---

## Implementation Recommendations

### Quick Wins (Ready to Use)

1. **OpenAPI Tools**: mcp-openapi-schema + swagger-mcp provide comprehensive OpenAPI support
2. **Contract Testing**: PactFlow MCP + Specmatic MCP for API validation
3. **Documentation**: Mintlify integration + docmole for documentation workflows
4. **Observability**: Native Claude Code OTel + opentelemetry-mcp-server
5. **Package Registry**: package-registry-mcp for multi-registry support

### Build on Existing

1. **SDK Generation**: Extend AWS Smithy integration with custom templates
2. **Developer Portal**: Build on Backstage MCP plugins
3. **CLI Tools**: Use cli-toolchain skill as foundation

### Custom Development Needed

1. **Deprecation Manager**: Build using changelog + API diff tools
2. **Codemod Generator**: Integrate with language-specific AST tools
3. **Rate Limiter Designer**: Build custom MCP for API gateway integration

---

## References

### MCP Protocol
- Model Context Protocol: https://modelcontextprotocol.io/
- MCP Registry: https://modelcontextprotocol.info/tools/registry/
- MCP Servers Repository: https://github.com/modelcontextprotocol/servers

### Skills Standards
- Agent Skills Specification: https://agentskills.io
- Anthropic Skills Repository: https://github.com/anthropics/skills

### SDK Documentation
- Claude Agent SDK: https://platform.claude.com/docs/en/agent-sdk/overview
- Claude Code Skills: https://code.claude.com/docs/en/skills
- Claude Code MCP: https://code.claude.com/docs/en/mcp

### Industry Standards
- Azure SDK Guidelines: https://azure.github.io/azure-sdk/
- Google API Design Guide: https://cloud.google.com/apis/design
- OpenAPI Generator: https://openapi-generator.tech/
- Smithy: https://smithy.io/
- TypeSpec: https://typespec.io/

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01 | Initial skills and agents references created |
