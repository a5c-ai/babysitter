# modelcontextprotocol/servers

- **Archetype**: domain-skill-pack
- **Stars**: 83,628
- **Last pushed**: 2026-03-29
- **License**: Apache-2.0 (transitioning from MIT)
- **Discovered**: 2026-04-13
- **Source**: backlog evaluation
- **Skills found**: 0 (no SKILL.md files, but comprehensive MCP server reference implementations)

## Summary
Official collection of reference MCP server implementations showcasing SDK usage patterns across multiple languages. Contains 7+ server implementations (filesystem, git, memory, fetch, everything, sequentialthinking, time) with detailed documentation of API design, security patterns, tool annotations, and deployment configurations. Serves as the canonical reference for MCP server development patterns.

## Assessment
Extremely high transferable value for babysitter's MCP integration surface. Each server implementation documents comprehensive development patterns: API design with proper input/output schemas, tool annotation patterns (readOnly/idempotent/destructive hints), security models (directory access controls, sandboxing), deployment patterns (Docker/NPX), and client integration (Claude Desktop, VS Code). The filesystem server alone contains 12+ documented tools with detailed patterns for file operations, directory traversal, and access control that map directly to babysitter process specializations.

## Extraction Priority
- High
- Rationale: Direct relevance to babysitter's MCP integration. Contains canonical patterns from the protocol maintainers for server development, security, deployment, and client integration. Multiple extractable processes for MCP server development workflow.

## Skills Inventory

| Skill | Path | Domain | Transferable? | Notes |
|-------|------|--------|---------------|-------|
| filesystem-server | src/filesystem/README.md | MCP/DevX | Yes - comprehensive patterns | Complete filesystem MCP server with 12+ tools, security model, deployment configs |
| git-server | src/git/README.md | MCP/DevOps | Yes - VCS patterns | Git operations via MCP with repository management |
| memory-server | src/memory/README.md | MCP/Context | Yes - persistence patterns | Knowledge graph and memory management via MCP |
| fetch-server | src/fetch/README.md | MCP/Networking | Yes - web integration patterns | Web content fetching and conversion for LLM usage |

## Processes
- **MCP Server Development Workflow**: Multi-phase process for creating MCP servers (API design, tool implementation, security model, testing, deployment)
  - Source: src/filesystem/README.md (comprehensive reference implementation)
  - Placement: specializations/devx/mcp-server-development
  - Inputs/Outputs: Server spec → Deployed MCP server with client configs
  - Complexity: moderate
  - Notes: Covers full lifecycle from tool definitions through production deployment

- **MCP Tool Design Process**: Systematic approach to designing MCP tool interfaces with proper annotations and security
  - Source: src/filesystem/README.md (tool annotations section, API documentation)
  - Placement: specializations/devx/mcp-tool-design
  - Inputs/Outputs: Tool requirements → Tool implementation with MCP hints
  - Complexity: simple
  - Notes: Includes readOnly/idempotent/destructive hint patterns, input validation, error handling

- **MCP Security Model Implementation**: Process for implementing directory access controls and sandboxing
  - Source: src/filesystem/README.md (directory access control section)
  - Placement: specializations/security-compliance/mcp-security
  - Inputs/Outputs: Security requirements → Sandboxed MCP server with access controls
  - Complexity: moderate
  - Notes: Command-line args vs dynamic roots, path validation, permission management

- **MCP Deployment Pipeline**: Process for packaging and deploying MCP servers with multiple client integrations
  - Source: src/filesystem/README.md (usage sections), Dockerfile patterns
  - Placement: specializations/devx/mcp-deployment
  - Inputs/Outputs: MCP server implementation → Client-ready deployment configs
  - Complexity: simple
  - Notes: Docker vs NPX packaging, Claude Desktop/VS Code integration configs

## Plugin Ideas
- **MCP Server Builder**: Plugin that scaffolds MCP servers following canonical patterns, with tool generation, security model setup, and client integration configs
  - What install.md would do: Interview user about server purpose, detect preferred language/SDK, scaffold server structure with tool definitions, security model, Docker/NPX configs, and client integration files
  - Processes it would copy: mcp-server-development, mcp-tool-design, mcp-security, mcp-deployment
  - Configs/hooks it would create: package.json, Dockerfile, tsconfig.json, MCP client configs for Claude Desktop/VS Code
  - Source evidence: Comprehensive reference implementations with documented patterns for all aspects of MCP server development

- **DevX Enhancement**: MCP integration improvement plugin that extends babysitter's mcp:serve surface with reference implementation patterns
  - What install.md would do: Analyze existing MCP usage, enhance tool annotations, add security patterns, improve client integration configs
  - Processes it would copy: mcp-tool-design, mcp-security
  - Configs/hooks it would create: Enhanced MCP server configs, client integration improvements
  - Source evidence: Advanced tool annotation patterns and security models from reference implementations

## Harness Integration Ideas
N/A - This is not a harness framework repository.

## Implicit Procedural Knowledge
- **MCP Tool Annotation Strategy**: Systematic approach to marking tools with readOnly/idempotent/destructive hints
  - Source: Filesystem tool annotations table and implementation patterns
  - Placement: specializations/devx/mcp-tool-design
  - Why codify: Ensures consistent tool behavior expectations across MCP servers, improves client UX
  - Sketch: Analyze tool behavior → Assign appropriate hints → Document guarantees → Implement validation

- **Dynamic Access Control Pattern**: Process for implementing flexible directory/resource access via MCP Roots protocol
  - Source: Directory access control documentation in filesystem server
  - Placement: specializations/security-compliance/mcp-security  
  - Why codify: Reusable security pattern for any resource-bounded MCP server
  - Sketch: Define access boundaries → Implement roots protocol → Handle runtime updates → Validate access on operations

- **Multi-Client Deployment Strategy**: Process for packaging MCP servers for multiple client environments
  - Source: Usage sections covering Claude Desktop, VS Code, Docker, NPX deployment patterns
  - Placement: specializations/devx/mcp-deployment
  - Why codify: Standardizes deployment across different MCP client ecosystems
  - Sketch: Package server → Generate client configs → Test integration → Document installation

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| MCP Server Development Workflow | NEW | Multi-phase MCP server creation process | - | specializations/devops-sre-platform/mcp-server-development.js |
| MCP Tool Design Process | NEW | Systematic tool interface design with annotations | - | specializations/devops-sre-platform/mcp-tool-design.js |
| MCP Security Model Implementation | NEW | Access controls and sandboxing for MCP servers | - | specializations/security-compliance/mcp-security.js |
| MCP Deployment Pipeline | NEW | Multi-client packaging and deployment | - | specializations/devops-sre-platform/mcp-deployment.js |
| MCP Tool Annotation Strategy | NEW | Tool behavior marking with readOnly/idempotent/destructive | - | specializations/devops-sre-platform/mcp-tool-annotations.js |
| Dynamic Access Control Pattern | NEW | Flexible resource access via MCP Roots protocol | - | specializations/security-compliance/mcp-access-control.js |
| Multi-Client Deployment Strategy | NEW | Cross-platform MCP server packaging | - | specializations/devops-sre-platform/mcp-multi-deployment.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| MCP Server Builder | NEW | Scaffold MCP servers with canonical patterns | - | plugins/a5c/marketplace/blueprints/mcp-server-builder/ |
| DevX Enhancement | UPGRADE | Enhance babysitter MCP integration with reference patterns | dev-browser | plugins/a5c/marketplace/blueprints/mcp-devx-enhancement/ |