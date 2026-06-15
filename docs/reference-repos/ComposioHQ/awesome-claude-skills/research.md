# ComposioHQ/awesome-claude-skills

- **Archetype**: mega-skill-pack
- **Stars**: 53,397
- **Last pushed**: 2026-02-19
- **License**: Apache-2.0
- **Discovered**: 2026-04-13
- **Source**: gh-search
- **Skills found**: 864

## Summary
ComposioHQ's massive collection of 864 practical Claude skills spanning multiple domains including MCP development, tool integration, workflow automation, document processing, and business operations. Features high-quality procedural skills with systematic design principles and connects Claude to 500+ apps via Composio integration.

## Assessment
VERY HIGH VALUE. This is the largest single collection of structured SKILL.md files with systematic procedural content across multiple domains. The skills demonstrate sophisticated agent-centric design principles, particularly in the mcp-builder and skill-creator skills which encode meta-level processes for building agent capabilities. The quality is consistently high with detailed workflows, error handling patterns, and practical implementation guidance. Many skills contain multi-step procedures extractable as babysitter processes, particularly in areas like MCP server development, document processing workflows, tool integration patterns, and business automation processes.

## Extraction Priority
VERY HIGH - Contains the largest collection of systematic procedural skills with direct transferability:
- MCP development and tool integration processes → specializations/tools-integration/
- Skill creation and design methodologies → methodologies/skill-engineering/
- Document processing workflows → specializations/content-automation/
- Business automation and productivity processes → specializations/business-automation/

## Processes
- **mcp-server-development**: Systematic process for building high-quality MCP servers with agent-centric design principles
  - Source: mcp-builder/SKILL.md (comprehensive workflow)
  - Placement: specializations/tools-integration/
  - Inputs: Service requirements, API specifications, agent workflow needs
  - Outputs: MCP server implementation, tool definitions, integration guidance
  - Complexity: complex
  - Notes: Contains agent-centric design principles, context optimization, error handling patterns

- **skill-creation-methodology**: Structured approach to creating effective skills with specialized workflows and domain expertise
  - Source: skill-creator/SKILL.md (systematic guidance)
  - Placement: methodologies/skill-engineering/
  - Inputs: Domain requirements, procedural knowledge, integration needs
  - Outputs: Skill specification, implementation guidance, bundled resources
  - Complexity: complex
  - Notes: Meta-level process for creating procedural knowledge systems

- **document-processing-automation**: Multi-format document processing workflows (PDF, DOCX, PPTX, XLSX)
  - Source: document-skills/ subdirectories
  - Placement: specializations/content-automation/
  - Inputs: Document requirements, format specifications, processing workflows
  - Outputs: Processed documents, automated workflows, format conversions
  - Complexity: moderate

- **business-workflow-automation**: Integration patterns for connecting AI agents to business tools and services
  - Source: connect-apps/ and various business automation skills
  - Placement: specializations/business-automation/
  - Inputs: Business requirements, tool integrations, workflow specifications
  - Outputs: Automated workflows, service integrations, business process automation
  - Complexity: complex

## Plugin Ideas
- **composio-integration-suite**: Comprehensive integration environment with 500+ app connections and MCP development tools
  - What install.md would do: Install Composio SDK, set up authentication, configure MCP servers, create integration templates, set up skill development environment
  - Processes it would copy: mcp-server-development, skill-creation-methodology, business-workflow-automation
  - Configs/hooks it would create: MCP server templates, authentication configs, integration dashboards, skill development frameworks
  - Source evidence: 864 skills with systematic Composio integration patterns and MCP development workflows

- **document-automation-suite**: Plugin for automated document processing across multiple formats with AI-driven workflows
  - What install.md would do: Install document processing libraries, set up format converters, configure OCR tools, create processing pipelines
  - Processes it would copy: document-processing-automation
  - Configs/hooks it would create: Document templates, processing pipelines, format conversion tools, automated workflow triggers
  - Source evidence: Dedicated document-skills directory with PDF/DOCX/PPTX/XLSX processing workflows

- **skill-development-framework**: Plugin for creating and managing procedural skills with systematic design patterns
  - What install.md would do: Install skill development tools, set up skill templates, configure testing frameworks, create skill registry
  - Processes it would copy: skill-creation-methodology
  - Configs/hooks it would create: Skill templates, development frameworks, testing tools, skill registry management
  - Source evidence: skill-creator skill with systematic methodology for creating effective skills

## Implicit Procedural Knowledge
- **Agent-Centric Tool Design**: Methodology for designing AI agent tools that optimize for limited context and enable complete workflows
  - Source: mcp-builder/SKILL.md agent-centric design principles section
  - Placement: methodologies/agent-tool-design/
  - Why codify: Provides reusable framework for designing effective agent tools across all domains
  - Sketch: Workflow analysis → Context optimization → Tool consolidation → Error message design → Natural task subdivision → Testing and refinement

- **Multi-Service Integration Orchestration**: Process for systematically integrating AI agents with multiple external services and APIs
  - Source: connect-apps patterns and various integration skills
  - Placement: specializations/tools-integration/
  - Why codify: Systematic approach to service integration that's reusable across different integration scenarios
  - Sketch: Service analysis → Authentication setup → Tool definition → Workflow mapping → Integration testing → Error handling → Performance optimization

- **Procedural Knowledge Extraction**: Methodology for transforming domain expertise into systematic, reproducible agent workflows
  - Source: skill-creator methodology and meta-patterns across 864 skills
  - Placement: methodologies/knowledge-extraction/
  - Why codify: Core methodology for converting implicit knowledge into explicit procedures that agents can execute reliably
  - Sketch: Domain analysis → Workflow identification → Procedure decomposition → Resource bundling → Testing and validation → Documentation and maintenance

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| MCP Server Development | NEW | Systematic MCP server building with agent-centric design principles | - | specializations/shared/mcp-server-development.js |
| Skill Creation Methodology | NEW | Structured approach to creating effective skills with domain expertise | - | methodologies/skill-creation-methodology/ |
| Document Processing Automation | NEW | Multi-format document processing workflows (PDF, DOCX, PPTX, XLSX) | - | specializations/shared/document-processing-automation.js |
| Business Workflow Automation | NEW | AI agent integration patterns for business tools and services | - | specializations/business/business-workflow-automation.js |
| Agent-Centric Tool Design | NEW | Methodology for designing AI agent tools optimized for limited context | - | methodologies/agent-centric-tool-design/ |
| Multi-Service Integration Orchestration | NEW | Systematic approach to integrating agents with multiple external services | - | specializations/shared/multi-service-integration-orchestration.js |
| Procedural Knowledge Extraction | NEW | Transform domain expertise into systematic, reproducible agent workflows | - | methodologies/procedural-knowledge-extraction/ |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Composio Integration Suite | NEW | Comprehensive integration environment with 500+ app connections and MCP development tools | - | plugins/a5c/marketplace/blueprints/composio-integration-suite/ |
| Document Automation Suite | NEW | Multi-format document processing with AI-driven workflows and format converters | - | plugins/a5c/marketplace/blueprints/document-automation-suite/ |
| Skill Development Framework | NEW | Skill creation and management with systematic design patterns and testing frameworks | - | plugins/a5c/marketplace/blueprints/skill-development-framework/ |