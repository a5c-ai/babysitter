# microsoft/skills

- **Archetype**: mega-skill-pack
- **Stars**: 2,029
- **Last pushed**: 2026-04-10
- **License**: MIT
- **Discovered**: 2026-04-13
- **Source**: backlog-processing
- **Skills found**: 132 (organized by language: dotnet, java, python, rust, typescript)

## Summary
Microsoft's official skill collection for AI coding agents working with Azure SDKs and Microsoft AI Foundry. Contains 132 skills organized by programming language and service category, with a custom installer (skills.sh), skill explorer UI, and multi-agent support. Includes skills for cloud architecture, Azure services, foundry workflows, and language-specific development patterns.

## Assessment
HIGH VALUE. This is a professionally maintained mega-skill-pack with substantial procedural content. Skills contain detailed workflows, design patterns, and service integration patterns specific to Microsoft/Azure ecosystem. The cloud-solution-architect skill alone contains 44 cloud design patterns, architecture review workflows, and Well-Architected Framework guidance. Many skills encode specific deployment, monitoring, and integration processes that are extractable as specializations/devops-sre-platform/ processes.

## Extraction Priority
HIGH - Contains well-documented Microsoft/Azure ecosystem processes that are directly extractable:
- Cloud architecture review workflows -> specializations/devops-sre-platform/
- Azure service integration patterns -> specializations/devops-sre-platform/ 
- Performance optimization processes -> specializations/shared/
- Multi-language development workflows -> specializations/shared/

## Skills Inventory

| Skill | Path | Domain | Transferable? | Notes |
|-------|------|--------|---------------|-------|
| cloud-solution-architect | .github/skills/cloud-solution-architect/ | DevOps/Cloud | Yes - process | 10 design principles, 44 cloud patterns, architecture review workflow |
| frontend-design-review | .github/skills/frontend-design-review/ | Frontend | Yes - process | UI/UX review checklist and accessibility audit |
| github-issue-creator | .github/skills/github-issue-creator/ | Project Mgmt | Yes - pattern | Structured issue creation workflow |
| mcp-builder | .github/skills/mcp-builder/ | Tools | Yes - process | MCP server development workflow |
| continual-learning | .github/skills/continual-learning/ | Methodology | Yes - process | Learning plan creation and progress tracking |

## Processes
- **azure-architecture-review**: Well-Architected Framework review process with 6 architecture styles and design pattern evaluation
  - Source: .github/skills/cloud-solution-architect/SKILL.md (lines 20-50)
  - Placement: specializations/devops-sre-platform/
  - Inputs: Architecture design documents, requirements
  - Outputs: Review report, recommendations, risk assessment
  - Complexity: complex
  - Notes: Contains 44 specific cloud design patterns mapped to WAF pillars

- **frontend-design-review**: UI/UX design review with accessibility and performance audit
  - Source: .github/skills/frontend-design-review/SKILL.md
  - Placement: specializations/frontend/
  - Inputs: Design mockups, component library, user stories
  - Outputs: Design review report, accessibility audit, performance recommendations
  - Complexity: moderate

- **mcp-development-workflow**: Process for building MCP servers from requirements to deployment
  - Source: .github/skills/mcp-builder/SKILL.md
  - Placement: specializations/shared/
  - Inputs: Tool requirements, integration specs
  - Outputs: MCP server implementation, tests, documentation
  - Complexity: moderate

## Plugin Ideas
- **azure-development-suite**: Comprehensive Azure development setup plugin
  - What install.md would do: Detect project type (web, API, function), install relevant Azure skills, configure Azure CLI, set up deployment pipelines, create monitoring dashboards
  - Processes it would copy: azure-architecture-review, azure-service-integration, performance-optimization
  - Configs/hooks it would create: Azure DevOps pipelines, ARM/Bicep templates, monitoring alerts
  - Source evidence: 132 Azure/Microsoft skills organized by service and language

- **cloud-architecture**: Plugin for cloud architecture best practices
  - What install.md would do: Install architecture review processes, configure Well-Architected assessments, set up design pattern library
  - Processes it would copy: azure-architecture-review, cloud-design-patterns, performance-antipatterns
  - Configs/hooks it would create: Architecture review templates, assessment checklists, pattern catalogs
  - Source evidence: Cloud Solution Architect skill with 44 design patterns and review workflows

## Implicit Procedural Knowledge
- **Well-Architected Framework Assessment**: Systematic review process using 5 pillars (cost, operational excellence, performance, reliability, security)
  - Source: cloud-solution-architect skill description and workflow sections
  - Placement: specializations/devops-sre-platform/
  - Why codify: Provides structured approach to cloud architecture validation that's reusable across cloud providers
  - Sketch: Requirements analysis -> Architecture style selection -> Design pattern mapping -> Risk assessment -> Recommendation generation

- **Multi-language skill organization**: Process for organizing skills by programming language and service domain
  - Source: Repository structure (skills/dotnet/, skills/java/, etc.) and symlink organization
  - Placement: specializations/shared/
  - Why codify: Demonstrates scalable approach to managing large skill collections with cross-cutting concerns
  - Sketch: Language detection -> Service categorization -> Symlink creation -> Multi-agent compatibility

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Azure Architecture Review | NEW | Well-Architected Framework review with 44 cloud patterns and architecture styles | - | specializations/devops-sre-platform/azure-architecture-review.js |
| Frontend Design Review | NEW | UI/UX design review with accessibility audit and performance recommendations | - | specializations/frontend/frontend-design-review.js |
| MCP Development Workflow | NEW | End-to-end MCP server development from requirements to deployment | - | specializations/shared/mcp-development-workflow.js |
| Well-Architected Framework Assessment | NEW | Systematic cloud architecture validation using 5 pillars (cost, operational excellence, performance, reliability, security) | - | specializations/devops-sre-platform/well-architected-framework-assessment.js |
| Multi-Language Skill Organization | NEW | Scalable approach to managing large skill collections with cross-cutting concerns | - | specializations/shared/multi-language-skill-organization.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Azure Development Suite | NEW | Comprehensive Azure development with CLI, deployment pipelines, and monitoring | - | plugins/a5c/marketplace/blueprints/azure-development-suite/ |
| Cloud Architecture Framework | NEW | Cloud architecture best practices with Well-Architected assessments and design patterns | - | plugins/a5c/marketplace/blueprints/cloud-architecture-framework/ |