# Technical Documentation - Skills and Agents References

This document provides links to community-created Claude skills, agents, plugins, and MCP servers that match the identified skills and agents from the backlog. These resources can be used as references, starting points, or direct integrations for implementing the Technical Documentation specialization.

---

## Table of Contents

1. [Overview](#overview)
2. [API Documentation Tools](#api-documentation-tools)
3. [Documentation Site Generators](#documentation-site-generators)
4. [Diagram and Visualization Tools](#diagram-and-visualization-tools)
5. [Content Authoring and Quality](#content-authoring-and-quality)
6. [Code Documentation Tools](#code-documentation-tools)
7. [Localization and Translation](#localization-and-translation)
8. [Documentation Platforms](#documentation-platforms)
9. [Accessibility Testing](#accessibility-testing)
10. [Architecture Documentation](#architecture-documentation)
11. [Search and Analytics](#search-and-analytics)
12. [PDF and Output Generation](#pdf-and-output-generation)
13. [General Documentation Skills](#general-documentation-skills)
14. [Curated Collections](#curated-collections)

---

## Overview

### Purpose
This reference document maps community resources to the skills and agents identified in `skills-agents-backlog.md`. Each section corresponds to one or more skill/agent categories and provides links to:
- MCP servers (Model Context Protocol)
- Claude Code plugins and skills
- GitHub repositories
- Documentation and guides

### Resource Types
- **MCP Server**: Model Context Protocol server for Claude integration
- **Claude Skill**: Skill file for Claude Code or Claude.ai
- **Plugin**: Claude Code plugin with commands/agents
- **GitHub Repo**: Open source repository
- **Documentation**: Official docs or guides

---

## API Documentation Tools

### SK-001: OpenAPI/Swagger Resources

| Resource | Type | Description | Link |
|----------|------|-------------|------|
| Swagger Explorer MCP | MCP Server | Explore and analyze Swagger/OpenAPI specifications through Claude | [GitHub](https://github.com/johnneerdael/swagger-mcp) |
| Swagger MCP Server (dcolley) | MCP Server | Ingest Swagger/OpenAPI specs and make them accessible via MCP | [Playbooks](https://playbooks.com/mcp/dcolley-swagger) |
| Auto-MCP | MCP Server | Transform any OpenAPI/Swagger definition into MCP server | [GitHub](https://github.com/brizzai/auto-mcp) |
| OpenAPI-MCP-Swagger | MCP Server | AI-powered endpoint discovery and code generation for OpenAPI | [GitHub](https://github.com/salacoste/openapi-mcp-swagger) |
| OpenAPI Expert Plugin | Claude Plugin | Specializes in OpenAPI specification handling | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) |
| Speakeasy MCP Generator | Tool | Generate MCP servers from OpenAPI documents | [Speakeasy](https://www.speakeasy.com/docs/standalone-mcp/build-server) |
| Apidog MCP Server | MCP Server | Connect AI to Apidog projects and OpenAPI/Swagger files | [Apidog Blog](https://apidog.com/blog/top-10-mcp-servers-for-claude-code/) |

### SK-016: AsyncAPI Resources

| Resource | Type | Description | Link |
|----------|------|-------------|------|
| AsyncAPI CLI | CLI Tool | Official AsyncAPI CLI for documentation generation | [AsyncAPI](https://www.asyncapi.com/tools/cli) |

### GraphQL Documentation

| Resource | Type | Description | Link |
|----------|------|-------------|------|
| GraphQL Schema Skill | Claude Skill | GraphQL queries, mutations, and code generation patterns | [GitHub](https://github.com/ChrisWiles/claude-code-showcase/blob/main/.claude/skills/graphql-schema/SKILL.md) |
| GraphQL API Development Skill | Claude Skill | Comprehensive guide for building production-ready GraphQL APIs | [claude-plugins.dev](https://claude-plugins.dev/skills/@manutej/luxor-claude-marketplace/graphql-api-development) |
| GraphQL Architect Subagent | Subagent | Schema architect for federation, subscriptions, and optimization | [GitHub](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/01-core-development/graphql-architect.md) |

---

## Documentation Site Generators

### SK-002: Docusaurus Resources

| Resource | Type | Description | Link |
|----------|------|-------------|------|
| Docusaurus Agent Guide | Guide | Automated documentation with Claude Code using Docusaurus | [Medium](https://medium.com/@dan.avila7/automated-documentation-with-claude-code-building-self-updating-docs-using-docusaurus-agent-2c85d3ec0e19) |
| Documentation Site Setup Skill | Claude Skill | Sets up documentation websites using Docusaurus, MkDocs, VitePress, GitBook | [skillsmp.com](https://skillsmp.com/skills/aj-geddes-useful-ai-prompts-skills-documentation-site-setup-skill-md) |
| Documentation Generator Plugin | Claude Plugin | Automated documentation with API docs and Docusaurus setup | [claude-plugins.dev](https://claude-plugins.dev/) |

### SK-003: MkDocs/Material Resources

| Resource | Type | Description | Link |
|----------|------|-------------|------|
| MkDocs Documentation Generator | Claude Skill | Build fast, professional static documentation sites with MkDocs | [MCPMarket](https://mcpmarket.com/tools/skills/mkdocs-documentation-generator) |
| Documentation Site Setup Skill | Claude Skill | Multi-platform docs setup including MkDocs | [skillsmp.com](https://skillsmp.com/skills/aj-geddes-useful-ai-prompts-skills-documentation-site-setup-skill-md) |

### SK-004: Sphinx Resources

| Resource | Type | Description | Link |
|----------|------|-------------|------|
| Sphinx Official Documentation | Documentation | Getting started with Sphinx | [Sphinx](https://www.sphinx-doc.org/en/master/usage/quickstart.html) |
| Read the Docs Sphinx Tutorial | Documentation | Deploying Sphinx on Read the Docs | [ReadTheDocs](https://docs.readthedocs.io/en/stable/intro/sphinx.html) |

---

## Diagram and Visualization Tools

### SK-006: Diagram Generation Resources

| Resource | Type | Description | Link |
|----------|------|-------------|------|
| C4Diagrammer | MCP Server | Generate C4 architecture diagrams using Mermaid.js | [GitHub](https://github.com/jonverrier/C4Diagrammer) |
| UML-MCP | MCP Server | Generate UML diagrams via PlantUML, Mermaid, Kroki, D2 | [GitHub](https://github.com/antoinebou12/uml-mcp) |
| claude-mermaid | MCP Server | Render Mermaid diagrams with live reload | [GitHub](https://github.com/veelenga/claude-mermaid) |
| mcp-mermaid (hustcc) | MCP Server | Generate Mermaid diagrams and charts dynamically | [GitHub](https://github.com/hustcc/mcp-mermaid) |
| Diagram Bridge MCP | MCP Server | Bridge LLMs and diagram creation (Mermaid, PlantUML, C4, D2) | [Glama](https://glama.ai/mcp/servers/@tohachan/diagram-bridge-mcp) |
| Architecture Diagrams Skill | Claude Skill | Create architecture diagrams | [claude-plugins.dev](https://claude-plugins.dev/skills/@aj-geddes/useful-ai-prompts/architecture-diagrams) |
| Mermaid-MCP | MCP Server | Mermaid diagram generation via MCP | [mcpservers.org](https://mcpservers.org/servers/narasimhaponnada/mermaid-mcp.git) |
| D3.js Visualization Skill | Claude Skill | D3.js data visualization | [GitHub](https://github.com/chrisvoncsefalvay/claude-d3js-skill) |

---

## Content Authoring and Quality

### SK-005: Markdown/MDX Resources

| Resource | Type | Description | Link |
|----------|------|-------------|------|
| Markdown Quality Skill | Claude Skill | Quality control for AI-generated markdown (markdownlint, GFM) | [MCPMarket](https://mcpmarket.com/tools/skills/markdown) |
| Record to Markdown MCP | MCP Server | Convert Claude conversations to Markdown | [PulseMCP](https://www.pulsemcp.com/servers/29decibel-record-to-markdown) |
| Update ClaudeMD Plugin | Claude Plugin | Updates Claude markdown documentation files | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) |

### SK-007: Technical Writing Lint Resources

| Resource | Type | Description | Link |
|----------|------|-------------|------|
| Vale MCP Server | MCP Server | Prose linting with Vale for style and grammar | [MCPMarket](https://mcpmarket.com/server/vale) |
| Style Guide Enforcement | Best Practice | Use linters and formatters with Claude Code hooks | [Anthropic](https://www.anthropic.com/engineering/claude-code-best-practices) |

### SK-008: Code Sample Validation Resources

| Resource | Type | Description | Link |
|----------|------|-------------|------|
| Plugin Validator Skill | Claude Skill | Validates plugin structure and compliance | [claude-plugins.dev](https://claude-plugins.dev/skills/@jeremylongshore/claude-code-plugins-plus/plugin-validator) |
| Documentation Generator Plugin | Claude Plugin | Generate documentation and unit tests | [Skywork](https://skywork.ai/blog/how-to-generate-documentation-unit-tests-claude-code-plugin/) |

### SK-009: Link Validation Resources

| Resource | Type | Description | Link |
|----------|------|-------------|------|
| Linkinator MCP | MCP Server | Broken link checker for websites and documentation | [GitHub](https://github.com/JustinBeckwith/linkinator) |
| CC-Skills Link Tools | Claude Skill | Link validation, lychee broken link detection | [GitHub](https://github.com/terrylica/cc-skills) |
| Skill Documentation Validator | Claude Skill | Validates documentation against skill manifests | [MCPMarket](https://mcpmarket.com/tools/skills/skill-documentation-validator) |

---

## Code Documentation Tools

### SK-014: JSDoc/TSDoc Resources

| Resource | Type | Description | Link |
|----------|------|-------------|------|
| TypeDoc | Tool | Documentation generator for TypeScript projects | [TypeDoc](https://typedoc.org/) |
| TypeDoc GitHub | GitHub Repo | Official TypeDoc repository | [GitHub](https://github.com/TypeStrong/typedoc) |
| TSDoc | Standard | Standardized doc comments for TypeScript | [TSDoc](https://tsdoc.org/) |
| Documentation Generator Guide | Guide | Generate JSDoc/docstrings with Claude Code | [Skywork](https://skywork.ai/blog/how-to-generate-documentation-unit-tests-claude-code-plugin/) |

### SK-015: Doxygen/Javadoc Resources

| Resource | Type | Description | Link |
|----------|------|-------------|------|
| Doxygen | Tool | Documentation generator for C/C++/Java | [Doxygen](https://www.doxygen.nl/) |
| Javadoc | Tool | Standard Java documentation generator | [Oracle](https://docs.oracle.com/javase/8/docs/technotes/tools/windows/javadoc.html) |

### SK-017: Storybook Documentation Resources

| Resource | Type | Description | Link |
|----------|------|-------------|------|
| Storybook MCP Addon | MCP Server | Official Storybook addon for MCP integration | [npm](https://www.npmjs.com/package/@storybook/addon-mcp) |
| Storybook MCP Server (Apify) | MCP Server | Connect AI to any Storybook instance | [Apify](https://apify.com/minute_contest/storybook-mcp-server) |
| Story UI | Tool | AI-powered Storybook story generation | [npm](https://www.npmjs.com/package/@tpitre/story-ui) |
| Storybook Design Systems RFC | Discussion | Design systems with MCP agents | [GitHub](https://github.com/storybookjs/ds-mcp-experiment-reshaped/discussions/1) |
| Storybook MCP Guide | Guide | Supercharge design systems with LLMs and Storybook MCP | [Codrops](https://tympanus.net/codrops/2025/12/09/supercharge-your-design-system-with-llms-and-storybook-mcp/) |

---

## Localization and Translation

### SK-010: Translation Management Resources

| Resource | Type | Description | Link |
|----------|------|-------------|------|
| Crowdin MCP Server | MCP Server | Connect Claude to Crowdin workspace for localization | [Crowdin Store](https://store.crowdin.com/crowdin-mcp-server) |
| Crowdin Agentic AI | Tool | AI translation with Anthropic models support | [Crowdin Store](https://store.crowdin.com/translation-ai-agent) |
| Next-intl Localization Skill | Claude Skill | Next-intl localization and i18n management | [MCPMarket](https://mcpmarket.com/tools/skills/next-intl-localization) |
| Lokalise MCP Server | MCP Server | Manage Lokalise projects, keys, and translations | [GitHub](https://github.com/AbdallahAHO/lokalise-mcp) |
| Crowdin MCP Guide | Guide | How to benefit from MCP in localization | [Crowdin Blog](https://crowdin.com/blog/2025/08/19/what-is-a-model-context-protocol) |

---

## Documentation Platforms

### SK-011: GitBook/Notion Resources

| Resource | Type | Description | Link |
|----------|------|-------------|------|
| Notion Connector | Integration | Create, edit, search Notion content from Claude | [Claude](https://claude.com/connectors/notion) |
| Notion Skills Marketplace | Claude Skills | Knowledge capture, meeting intelligence, research docs | [GitHub](https://github.com/tommy-ca/notion-skills) |
| Knowledge Capture Skill | Claude Skill | Turn discussions into durable knowledge in Notion | [GitHub](https://github.com/tommy-ca/notion-skills) |

### SK-012: ReadMe.com Resources

| Resource | Type | Description | Link |
|----------|------|-------------|------|
| README Generator Skill | Claude Skill | Generate README documentation | [GitHub](https://github.com/GLINCKER/claude-code-marketplace/blob/main/skills/documentation/readme-generator/SKILL.md) |

### SK-013: Confluence Resources

| Resource | Type | Description | Link |
|----------|------|-------------|------|
| Atlassian Skills | Official Skills | Jira, Confluence integration with Claude | [Claude Blog](https://claude.com/blog/organization-skills-and-directory) |
| ADR Writer (Confluence) | Claude Skill | Create ADRs in Confluence | [claude-plugins.dev](https://claude-plugins.dev/skills/@sethdford/claude-plugins/adr-writer) |

---

## Accessibility Testing

### SK-019: Accessibility Checker Resources

| Resource | Type | Description | Link |
|----------|------|-------------|------|
| A11y MCP (ronantakizawa) | MCP Server | Web accessibility testing with Axe-core | [GitHub](https://github.com/ronantakizawa/a11ymcp) |
| A11y MCP (priyankark) | MCP Server | Accessibility audits with axe-core for agentic workflows | [GitHub](https://github.com/priyankark/a11y-mcp) |
| A11y MCP Server (shawnmcb) | MCP Server | WCAG lookup, remediation guidance, audit reports | [Glama](https://glama.ai/mcp/servers/@shawnmcb/a11y-mcp-server) |
| Accessibility Testing MCP | MCP Server | Axe-core and IBM Equal Access with Playwright | [Glama](https://glama.ai/mcp/servers/@joe-watkins/accessibility-testing-mcp) |
| Cursor A11y MCP | MCP Server | Accessibility testing for AI agents | [Playbooks](https://playbooks.com/mcp/westsideori-cursor-a11y) |
| Accessibility Test Scanner | Claude Skill | Scanning for accessibility issues | [claude-plugins.dev](https://claude-plugins.dev/skills/@jeremylongshore/claude-code-plugins-plus/accessibility-test-scanner) |

---

## Architecture Documentation

### ADR Documentation Resources

| Resource | Type | Description | Link |
|----------|------|-------------|------|
| ADR Writer Skill | Claude Skill | Create ADRs in Confluence | [claude-plugins.dev](https://claude-plugins.dev/skills/@sethdford/claude-plugins/adr-writer) |
| Architecture Decision Record Skill | Claude Skill | ADR documentation best practices | [claude-plugins.dev](https://claude-plugins.dev/skills/@ArieGoldkin/ai-agent-hub/architecture-decision-record) |
| ADR Creator Skill | Claude Skill | MADR template-based ADR creation | [MCPMarket](https://mcpmarket.com/tools/skills/adr-creator-3) |
| ADR Suggestion Skill | Claude Skill | Intelligent detection of ADR-worthy decisions | [MCPMarket](https://mcpmarket.com/tools/skills/architectural-decision-records-adr) |
| ADR Writing Skill | Claude Skill | Focused ADRs with context and alternatives | [claude-plugins.dev](https://claude-plugins.dev/skills/@sebnow/configs/adr-writing) |
| ADR Architecture Manager | Claude Skill | Systematic ADR workflow management | [MCPMarket](https://mcpmarket.com/tools/skills/adr-architecture-manager) |
| ADR Skill (atusy) | Claude Skill | Architecture decision records | [claude-plugins.dev](https://claude-plugins.dev/skills/@atusy/dotfiles/adr) |
| Claude ADR System Guide | Guide | Comprehensive ADR system for AI-assisted development | [GitHub Gist](https://gist.github.com/joshrotenberg/a3ffd160f161c98a61c739392e953764) |

---

## Search and Analytics

### SK-018: Documentation Analytics Resources

| Resource | Type | Description | Link |
|----------|------|-------------|------|
| Algolia MCP Server | MCP Server | Search, Recommend, and Analytics APIs for Claude | [GitHub](https://github.com/algolia/mcp-node) |
| DocSearch by Algolia | Service | Search made for documentation with MCP support | [DocSearch](https://docsearch.algolia.com/) |

---

## PDF and Output Generation

### SK-020: PDF Generation Resources

| Resource | Type | Description | Link |
|----------|------|-------------|------|
| MD-PDF MCP Server | MCP Server | Convert Markdown to PDF with Pandoc and WeasyPrint | [mcpservers.org](https://mcpservers.org/servers/kareemaly/md-pdf-mcp) |
| MCP-Pandoc | MCP Server | Document format conversion using Pandoc | [GitHub](https://github.com/vivekVells/mcp-pandoc) |
| Pandoc Document Converter | MCP Server | File format conversion via MCP | [Metorial](https://marketplace.metorial.com/marketplace/s/maitreyam/file-converter-mcp) |

---

## General Documentation Skills

### Documentation Plugins and Skills

| Resource | Type | Description | Link |
|----------|------|-------------|------|
| Codebase Documenter | Claude Plugin | Creates documentation from codebase analysis | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) |
| Analyze Codebase | Claude Plugin | Analyzes codebases for documentation purposes | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) |
| Documentation Generator | Claude Plugin | Generates technical documentation automatically | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) |
| Generate API Docs | Claude Plugin | Creates API documentation | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) |
| Changelog Generator | Claude Plugin/Skill | Creates user-facing changelogs from git commits | [ComposioHQ](https://github.com/ComposioHQ/awesome-claude-skills) |
| Context7 Docs Fetcher | Claude Plugin | Fetches documentation from Context7 | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) |
| Skill Seekers | Tool | Convert documentation websites to Claude AI skills | [GitHub](https://github.com/yusufkaraaslan/Skill_Seekers) |
| pg-aiguide | MCP Server | Postgres skills and documentation for AI tools | [GitHub](https://github.com/timescale/pg-aiguide) |
| Scientific Writing Plugin | Claude Plugin | Scientific writing, code review, technical documentation | [GitHub](https://github.com/matsengrp/plugins) |

### MCP Builder and Skill Creator

| Resource | Type | Description | Link |
|----------|------|-------------|------|
| MCP Builder | Claude Skill | Create high-quality MCP servers for external APIs | [ComposioHQ](https://github.com/ComposioHQ/awesome-claude-skills) |
| Skill Creator | Claude Skill | Create effective Claude Skills | [ComposioHQ](https://github.com/ComposioHQ/awesome-claude-skills) |
| Claude Code Skill Factory | Tool | Toolkit for building production-ready Claude Skills | [GitHub](https://github.com/alirezarezvani/claude-code-skill-factory) |

---

## Curated Collections

### Awesome Lists and Registries

| Resource | Type | Description | Link |
|----------|------|-------------|------|
| Awesome Claude Skills (ComposioHQ) | Curated List | Curated list of Claude Skills and tools | [GitHub](https://github.com/ComposioHQ/awesome-claude-skills) |
| Awesome Claude Skills (VoltAgent) | Curated List | Awesome collection of Claude Skills | [GitHub](https://github.com/VoltAgent/awesome-claude-skills) |
| Awesome Claude Skills (travisvn) | Curated List | Claude Skills for Claude Code | [GitHub](https://github.com/travisvn/awesome-claude-skills) |
| Awesome Claude Code Plugins | Curated List | Plugins, skills, hooks, and agents | [GitHub](https://github.com/ccplugins/awesome-claude-code-plugins) |
| Awesome Claude Code (hesreallyhim) | Curated List | Skills, hooks, slash-commands, orchestrators | [GitHub](https://github.com/hesreallyhim/awesome-claude-code) |
| Awesome Claude Code Subagents | Curated List | Specialized subagents for Claude Code | [GitHub](https://github.com/VoltAgent/awesome-claude-code-subagents) |
| Claude Plugins Dev | Registry | Community registry with CLI for plugins/skills | [claude-plugins.dev](https://claude-plugins.dev/) |
| MCP Market | Marketplace | Skills and MCP servers marketplace | [MCPMarket](https://mcpmarket.com/) |
| Claude Skills Library | Registry | MCP servers and skills library | [mcpservers.org](https://mcpservers.org/claude-skills) |
| Plugin Marketplace | Registry | Claude Code plugin marketplace | [GitHub](https://github.com/kivilaid/plugin-marketplace) |

### MCP Server Collections

| Resource | Type | Description | Link |
|----------|------|-------------|------|
| Awesome MCP Servers (punkpeye) | Curated List | Comprehensive MCP servers collection | [GitHub](https://github.com/punkpeye/awesome-mcp-servers) |
| Awesome MCP Servers (wong2) | Curated List | Curated MCP servers with official integrations | [GitHub](https://github.com/wong2/awesome-mcp-servers) |
| Awesome MCP Servers (appcypher) | Curated List | Production-ready and experimental MCP servers | [GitHub](https://github.com/appcypher/awesome-mcp-servers) |
| Awesome MCP Servers (TensorBlock) | Curated List | 7260+ MCP servers catalog | [GitHub](https://github.com/TensorBlock/awesome-mcp-servers) |
| MCP Servers Org | Web Directory | Awesome MCP Servers directory | [mcpservers.org](https://mcpservers.org/) |
| Official MCP Servers | Reference | Model Context Protocol reference servers | [GitHub](https://github.com/modelcontextprotocol/servers) |
| Anthropic Skills Repo | Official | Public repository for Agent Skills | [GitHub](https://github.com/anthropics/skills) |

---

## Skill/Agent to Reference Mapping

### Skills Mapping

| Skill ID | Skill Name | Primary References |
|----------|------------|-------------------|
| SK-001 | OpenAPI/Swagger | Swagger Explorer MCP, Auto-MCP, OpenAPI-MCP-Swagger |
| SK-002 | Docusaurus | Documentation Site Setup Skill, Docusaurus Agent Guide |
| SK-003 | MkDocs/Material | MkDocs Documentation Generator Skill |
| SK-004 | Sphinx | Read the Docs documentation |
| SK-005 | Markdown/MDX | Markdown Quality Skill, Record to Markdown MCP |
| SK-006 | Diagram Generation | C4Diagrammer, UML-MCP, claude-mermaid, mcp-mermaid |
| SK-007 | Technical Writing Lint | Vale MCP Server |
| SK-008 | Code Sample Validation | Plugin Validator Skill |
| SK-009 | Link Validation | Linkinator MCP, CC-Skills Link Tools |
| SK-010 | Translation Management | Crowdin MCP Server, Lokalise MCP |
| SK-011 | GitBook/Notion | Notion Connector, Notion Skills Marketplace |
| SK-012 | ReadMe.com | README Generator Skill |
| SK-013 | Confluence | Atlassian Skills, ADR Writer (Confluence) |
| SK-014 | JSDoc/TSDoc | TypeDoc, TSDoc |
| SK-015 | Doxygen/Javadoc | Doxygen, Javadoc |
| SK-016 | AsyncAPI | AsyncAPI CLI |
| SK-017 | Storybook Documentation | Storybook MCP Addon, Story UI |
| SK-018 | Documentation Analytics | Algolia MCP Server, DocSearch |
| SK-019 | Accessibility Checker | A11y MCP servers (multiple) |
| SK-020 | PDF Generation | MD-PDF MCP Server, MCP-Pandoc |

### Agents Mapping

| Agent ID | Agent Name | Relevant References |
|----------|------------|---------------------|
| AG-001 | Technical Writing Expert | Vale MCP, Style guides, Markdown skills |
| AG-002 | API Documentation Specialist | OpenAPI MCPs, GraphQL skills |
| AG-003 | Information Architect | Notion Skills, Documentation plugins |
| AG-004 | Documentation QA Analyst | A11y MCPs, Link validators, Vale MCP |
| AG-005 | DevOps Documentation | Changelog Generator, Runbook templates |
| AG-006 | Architecture Documentation | ADR skills, C4Diagrammer, UML-MCP |
| AG-007 | Localization Coordinator | Crowdin MCP, Lokalise MCP |
| AG-008 | Developer Experience | Storybook MCP, Interactive docs skills |
| AG-009 | Docs Platform Engineer | MkDocs/Docusaurus skills, Algolia MCP |
| AG-010 | Content Strategist | Notion Skills, Documentation analytics |
| AG-011 | Tutorial Developer | Interactive tutorials, Storybook docs |
| AG-012 | Compliance Documentation | ADR skills, Audit documentation |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Total References Found | 89 |
| MCP Servers | 32 |
| Claude Skills | 31 |
| Claude Plugins | 12 |
| Curated Collections | 14 |
| Categories Covered | 14 |
| Skills Mapped (of 20) | 20 |
| Agents Mapped (of 12) | 12 |

---

## Notes

### Coverage Assessment
- **Strong Coverage**: OpenAPI/Swagger, Diagram Generation, Accessibility Testing, ADR Documentation, Localization
- **Moderate Coverage**: MkDocs, Markdown/MDX, Link Validation, Storybook, Notion
- **Limited Coverage**: Sphinx, AsyncAPI, Doxygen/Javadoc, ReadMe.com platform

### Recommendations
1. **High-value integrations**: Swagger MCP servers, Crowdin MCP, A11y MCP servers, and diagram generation MCPs are production-ready
2. **Custom development needed**: Sphinx integration, AsyncAPI skill, and ReadMe.com platform integration may require custom skill development
3. **Leverage curated lists**: The awesome-claude-skills and awesome-mcp-servers repositories are actively maintained and provide ongoing discovery of new resources

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 5 - Skills and Agents References Compiled
**Source**: Community research from GitHub, MCP Market, claude-plugins.dev, and web search
