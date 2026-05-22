# mergisi/awesome-openclaw-agents

- **Archetype**: harness-framework
- **Stars**: 2,851
- **Last pushed**: 2026-04-07
- **License**: MIT
- **Discovered**: 2026-04-13
- **Source**: gh-search
- **Skills found**: 196 (SOUL.md agent templates)

## Summary
Comprehensive collection of 196 production-ready AI agent templates for the OpenClaw harness ecosystem, organized by business domains (automation, business, creative, development, etc.) using SOUL.md format instead of SKILL.md. Features professional deployment infrastructure through crewclaw.com platform and structured agent template system with clear identity, responsibilities, skills, and operational rules.

## Assessment
HIGH VALUE. This represents a complete alternative AI harness ecosystem with sophisticated agent template organization and deployment infrastructure. The OpenClaw platform uses SOUL.md format as an alternative to SKILL.md, providing insight into different approaches to agent specification. The business domain organization and professional deployment tools make this valuable for understanding alternative harness patterns and potentially creating a babysitter OpenClaw adapter. The agent template structure is well-designed with clear separation of identity, responsibilities, skills, rules, and tone.

## Extraction Priority
HIGH - Contains alternative harness patterns and sophisticated agent template system:
- OpenClaw harness integration patterns → harness adapter development
- SOUL.md agent specification format → alternative agent specification methodology
- Business domain agent organization → specializations/business-domains/
- Professional deployment infrastructure patterns → specializations/deployment-automation/

## Harness Integration Ideas
- **OpenClaw Harness Adapter**: New harness integration for OpenClaw platform similar to existing babysitter adapters

**Capability Assessment for Babysitter Integration:**

| Capability | Status | Details |
|------------|---------|---------|
| **Custom Tools/MCP** | ✅ SUPPORTED | Plugin SDK with tool execution hooks, `before_tool_call`/`after_tool_call` interceptors |
| **Stop Hooks** | ❌ NOT SUPPORTED | 13 event types including `command:stop` but **no mid-conversation interruption hooks**. Events: command lifecycle, session management, message flow, but no turn-level stopping |
| **Plugin System** | ✅ SUPPORTED | Comprehensive Plugin SDK with 28 hooks, npm packages with `openclaw.hooks` declaration, SOUL.md + AGENTS.md + TOOLS.md manifest system |

**Integration Viability:** PARTIAL - Strong plugin system and tool execution but **lacks critical stop-hook capability** for babysitter's orchestration loop interruption needs.

  - Adapter implementation: OpenClaw CLI detection, SOUL.md format support, crewclaw.com API integration
  - Plugin structure: plugins/babysitter-openclaw/ with hooks, commands, and skills
  - CLI integration: OpenClaw command patterns, deployment workflows, agent template management
  - Current limitation: No OpenClaw support in babysitter harness adapter system + **no stop hooks for conversation interruption**
  - Integration approach: Create adapter for OpenClaw CLI with SOUL.md conversion to babysitter format
  - Implementation scope: packages/sdk/src/harness/adapters/openclawAdapter.ts and plugin structure

- **Agent Template Infrastructure**: Enhancement to agent template management and deployment
  - Current limitation: Limited agent template infrastructure in babysitter
  - Integration approach: Adopt crewclaw.com deployment patterns for babysitter plugin marketplace
  - Implementation scope: Plugin deployment automation and template management systems

## Processes
- **soul-agent-specification**: Process for creating structured agent templates using SOUL.md format with identity, responsibilities, and operational rules
  - Source: SOUL.md template structure across 196 agent examples
  - Placement: methodologies/agent-specification/
  - Inputs: Agent requirements, business domain, operational constraints
  - Outputs: SOUL.md agent specifications, deployment configurations, operational guidelines
  - Complexity: moderate
  - Notes: Alternative to SKILL.md format with focus on agent identity and operational rules

- **business-domain-agent-organization**: Systematic approach to organizing agents by business function rather than technical capability
  - Source: Agent directory structure organized by business domains
  - Placement: specializations/business-organization/
  - Inputs: Business requirements, domain expertise needs, operational scope
  - Outputs: Domain-organized agent collections, business workflow patterns
  - Complexity: moderate
  - Notes: Clear separation of automation, business, creative, development, etc. domains

- **agent-deployment-automation**: Process for automated agent deployment with web-based configuration and deployment tools
  - Source: crewclaw.com deployment infrastructure and template system
  - Placement: specializations/deployment-automation/
  - Inputs: Agent specifications, deployment targets, configuration requirements
  - Outputs: Deployed agents, configuration dashboards, operational monitoring
  - Complexity: complex

## Plugin Ideas
- **agent-template-management**: Plugin for systematic agent template creation, organization, and deployment
  - What install.md would do: Install template management tools, set up agent specification frameworks, configure deployment pipelines, create template registry
  - Processes it would copy: soul-agent-specification, business-domain-agent-organization
  - Configs/hooks it would create: Template frameworks, specification tools, organization systems, deployment configurations
  - Source evidence: Sophisticated agent template system with business domain organization and deployment automation

## Implicit Procedural Knowledge
- **Alternative Agent Specification Methodology**: Framework for structuring agent capabilities using identity-driven approach rather than procedural skills
  - Source: SOUL.md format with identity, responsibilities, skills, rules, and tone structure
  - Placement: methodologies/agent-specification/
  - Why codify: Provides alternative to SKILL.md approach that may be more suitable for certain types of agents
  - Sketch: Identity definition → Responsibility mapping → Skill identification → Rule establishment → Tone specification → Operational validation

- **Cross-Platform Agent Ecosystem Design**: Methodology for building complete agent ecosystems with templates, deployment, and management infrastructure
  - Source: OpenClaw ecosystem with crewclaw.com platform, template system, and deployment automation
  - Placement: methodologies/ecosystem-development/
  - Why codify: Systematic approach to building complete agent platforms beyond individual agent creation
  - Sketch: Platform definition → Template system design → Deployment automation → Management infrastructure → Community integration → Ecosystem growth

- **Business-Domain Agent Architecture**: Process for organizing agent capabilities around business functions rather than technical domains
  - Source: Business domain organization pattern across automation, business, creative, development domains
  - Placement: specializations/business-architecture/
  - Why codify: Framework for organizing agent capabilities that aligns with business needs rather than technical categorization
  - Sketch: Business function analysis → Domain boundary definition → Agent responsibility mapping → Cross-domain coordination → Business workflow integration

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| SOUL Agent Specification | NEW | Structured agent template creation using SOUL.md format with identity and operational rules | - | methodologies/soul-agent-specification/ |
| Business-Domain Agent Organization | NEW | Systematic agent organization by business function rather than technical capability | - | specializations/business/business-domain-agent-organization.js |
| Agent Deployment Automation | NEW | Automated agent deployment with web-based configuration and monitoring tools | - | specializations/shared/agent-deployment-automation.js |
| Alternative Agent Specification Methodology | NEW | Identity-driven agent structuring as alternative to procedural skills approach | - | methodologies/alternative-agent-specification/ |
| Cross-Platform Agent Ecosystem Design | NEW | Complete agent ecosystem building with templates, deployment, and management infrastructure | - | methodologies/cross-platform-agent-ecosystem/ |
| Business-Domain Agent Architecture | NEW | Agent capability organization aligned with business functions and workflow integration | - | specializations/business/business-domain-agent-architecture.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Agent Template Management | NEW | Systematic agent template creation, organization, and deployment with registry system | - | plugins/a5c/marketplace/plugins/agent-template-management/ |
