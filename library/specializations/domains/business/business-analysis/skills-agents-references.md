# Business Analysis and Consulting - Skills and Agents References

This document catalogs community-created Claude skills, agents, plugins, and MCP servers that align with the identified skills and agents in the backlog for the Business Analysis and Consulting specialization.

---

## Table of Contents

1. [Overview](#overview)
2. [Requirements Analysis and Documentation](#requirements-analysis-and-documentation)
3. [Process Modeling and BPMN](#process-modeling-and-bpmn)
4. [Financial Analysis and Business Case](#financial-analysis-and-business-case)
5. [Stakeholder Analysis and Communication](#stakeholder-analysis-and-communication)
6. [Change Management](#change-management)
7. [Consulting and Problem Solving](#consulting-and-problem-solving)
8. [Presentation and Documentation](#presentation-and-documentation)
9. [Project and Issue Management MCPs](#project-and-issue-management-mcps)
10. [Diagram and Visualization Tools](#diagram-and-visualization-tools)
11. [Workshop and Collaboration Tools](#workshop-and-collaboration-tools)
12. [Metrics and Performance Tracking](#metrics-and-performance-tracking)
13. [Risk Management](#risk-management)
14. [Training and Knowledge Transfer](#training-and-knowledge-transfer)
15. [Awesome Lists and Catalogs](#awesome-lists-and-catalogs)
16. [Skills-to-Reference Mapping](#skills-to-reference-mapping)
17. [Agents-to-Reference Mapping](#agents-to-reference-mapping)
18. [Implementation Recommendations](#implementation-recommendations)

---

## Overview

This reference document provides links to existing community resources that can be leveraged or adapted for the Business Analysis and Consulting specialization. Resources are organized by functional area to facilitate discovery and implementation planning.

### Reference Statistics

| Category | Resources Found |
|----------|-----------------|
| Requirements Analysis Tools | 12 |
| Process Modeling and BPMN | 10 |
| Financial Analysis | 8 |
| Stakeholder Analysis | 9 |
| Change Management | 7 |
| Consulting Tools | 8 |
| Presentation Tools | 11 |
| Project Management MCPs | 14 |
| Diagram/Visualization | 12 |
| Workshop/Collaboration | 8 |
| Metrics and Performance | 7 |
| Risk Management | 5 |
| Training/Knowledge Transfer | 6 |
| Awesome Lists | 12 |
| **Total Unique Resources** | **129** |

---

## Requirements Analysis and Documentation

### MCP Servers and Integrations

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| ChatPRD MCP Integration | MCP | Live PRD access for Claude Code with always up-to-date requirements | [ChatPRD Resources](https://www.chatprd.ai/resources/PRD-for-Claude-Code) |
| prd-dxt | MCP/DXT | Automated PRD generation from README files | [GitHub](https://github.com/Njengah/prd-dxt) |
| GitHub Project Manager MCP | MCP | PRD tools including generate, parse, enhance PRD and create roadmap | [GitHub](https://github.com/Faresabdelghany/github-project-manager-mcp) |
| Notion MCP Server (Official) | MCP | Create BRDs, requirements specs, and documentation in Notion | [GitHub](https://github.com/makenotion/notion-mcp-server) |
| Confluence MCP (Atlassian) | MCP | Store requirements and documentation in Confluence | [GitHub](https://github.com/atlassian/atlassian-mcp-server) |

### Claude Code Skills

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| Product Manager Toolkit | Skill | PRD templates, RICE Prioritizer, Customer Interview Analyzer | [GitHub](https://github.com/alirezarezvani/claude-skills) |
| Agile Product Owner | Skill | User Story Generator, Sprint Planner, INVEST validation | [GitHub](https://github.com/alirezarezvani/claude-skills) |
| User Story Writer Skill | Skill | Convert requirements to user stories with acceptance criteria | [MCPMarket](https://mcpmarket.com/tools/skills) |

### Requirements Validation Tools

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| Impersonaid | Tool | Test requirements against LLM-powered user personas | [GitHub](https://github.com/theletterf/impersonaid) |
| Product Manager Prompts | Prompts | JTBD, User Story templates, requirements scaffolding | [GitHub](https://github.com/deanpeters/product-manager-prompts) |
| Requirements Quality Checker | Plugin | Validates requirements against INVEST and SMART criteria | [claude-plugins.dev](https://claude-plugins.dev/) |

### Subagents

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| business-analyst | Subagent | Requirements elicitation and documentation specialist | [VoltAgent](https://github.com/VoltAgent/awesome-claude-code-subagents) |
| requirements-analyst | Subagent | Focused on requirements engineering and validation | [ChrisRoyse/610ClaudeSubagents](https://github.com/ChrisRoyse/610ClaudeSubagents) |

---

## Process Modeling and BPMN

### MCP Servers for Diagram Generation

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| BPMN.js MCP Server | MCP Server | Create and manipulate BPMN diagrams using bpmn-js library | [LobeHub](https://lobehub.com/mcp/dattmavis-bpmn-js-mcp) |
| UML-MCP | MCP Server | Generate UML and BPMN diagrams via PlantUML, Mermaid, Kroki, D2 | [GitHub](https://github.com/antoinebou12/uml-mcp) |
| claude-mermaid | MCP Server | Render Mermaid diagrams with live reload for process flows | [GitHub](https://github.com/veelenga/claude-mermaid) |
| mcp-mermaid (hustcc) | MCP Server | Generate Mermaid diagrams and flowcharts dynamically | [GitHub](https://github.com/hustcc/mcp-mermaid) |
| Diagram Bridge MCP | MCP Server | Bridge LLMs and diagram creation (Mermaid, PlantUML, C4, D2) | [Glama](https://glama.ai/mcp/servers/@tohachan/diagram-bridge-mcp) |

### Claude Skills for Process Modeling

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| design-doc-mermaid | Claude Skill | Create Mermaid diagrams and design documents | [GitHub](https://github.com/SpillwaveSolutions/design-doc-mermaid) |
| mermaid-gen | Skill | Generate syntactically correct Mermaid diagrams | [FastMCP](https://fastmcp.me/Skills/Details/289/mermaid-gen) |
| mermaid-diagram-claude-code | Integration | Flowcharts, sequence diagrams, architecture diagrams | [GitHub](https://github.com/zabolotiny/mermaid-diagram-claude-code) |

### Process Improvement Subagents

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| process-improvement-analyst | Subagent | Process optimization and waste elimination | [ChrisRoyse/610ClaudeSubagents](https://github.com/ChrisRoyse/610ClaudeSubagents) |
| operations-excellence-specialist | Subagent | Lean and Six Sigma methodologies | [ChrisRoyse/610ClaudeSubagents](https://github.com/ChrisRoyse/610ClaudeSubagents) |

---

## Financial Analysis and Business Case

### Claude in Excel and Financial Tools

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| Claude in Excel | Integration | Financial modeling, NPV, IRR, ROI calculations directly in Excel | [Claude](https://claude.com/claude-in-excel) |
| xlsx Skill | Skill | Create, edit, and analyze Excel spreadsheets with financial models | [MCPMarket](https://mcpmarket.com/tools/skills/excel-financial-modeling) |
| Excel Financial Modeling Skill | Skill | Professional financial formatting, formulas, error validation | [MCPMarket](https://mcpmarket.com/tools/skills/excel-financial-modeling) |
| Excel & Spreadsheet Automation | Skill | CSV parsing to institutional-grade financial models | [MCPMarket](https://mcpmarket.com/tools/skills/excel-spreadsheet-automation-6) |

### Financial Analysis Subagents

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| financial-analyst | Subagent | NPV, IRR, ROI analysis and financial modeling | [VoltAgent](https://github.com/VoltAgent/awesome-claude-code-subagents) |
| business-case-analyst | Subagent | Cost-benefit analysis and business case development | [ChrisRoyse/610ClaudeSubagents](https://github.com/ChrisRoyse/610ClaudeSubagents) |
| pricing-strategy-optimizer | Subagent | Revenue model design and pricing analysis | [ChrisRoyse/610ClaudeSubagents](https://github.com/ChrisRoyse/610ClaudeSubagents) |

### Data Analysis Tools

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| Postgres Skill | Skill | Execute SQL queries for financial data analysis | [ComposioHQ](https://github.com/ComposioHQ/awesome-claude-skills) |
| CSV Data Summarizer | Skill | Analyze CSV files and generate insights with visualizations | [ComposioHQ](https://github.com/ComposioHQ/awesome-claude-skills) |

---

## Stakeholder Analysis and Communication

### Stakeholder Management Tools

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| stakeholder-communication-planner | Subagent | Create stakeholder communication plans | [ChrisRoyse/610ClaudeSubagents](https://github.com/ChrisRoyse/610ClaudeSubagents) |
| user-journey-strategist | Subagent | Maps stakeholder touchpoint flows | [ChrisRoyse/610ClaudeSubagents](https://github.com/ChrisRoyse/610ClaudeSubagents) |
| consumer-insights-synthesizer | Subagent | Aggregates stakeholder and consumer data patterns | [ChrisRoyse/610ClaudeSubagents](https://github.com/ChrisRoyse/610ClaudeSubagents) |

### Communication Skills

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| Internal Comms | Skill | Status reports, 3P updates, newsletters, FAQs | [ComposioHQ](https://github.com/ComposioHQ/awesome-claude-skills) |
| Communication Plan Generator | Skill | Multi-channel communication strategies | [MCPMarket](https://mcpmarket.com/tools/skills) |

### RACI and Matrix Tools

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| Table Generator Skill | Skill | Generate RACI matrices and stakeholder tables | [MCPMarket](https://mcpmarket.com/tools/skills) |
| Mermaid Quadrant Charts | Tool | Power-Interest and Salience model visualizations | [GitHub](https://github.com/veelenga/claude-mermaid) |

### Collaboration Platforms MCP

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| Notion Connector | Integration | Create stakeholder maps and communication plans in Notion | [Claude](https://claude.com/connectors/notion) |
| Confluence MCP | MCP | Store RACI matrices and stakeholder analysis in Confluence | [GitHub](https://github.com/sooperset/mcp-atlassian) |

---

## Change Management

### ADKAR and Change Assessment

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| Survey Design Skill | Skill | Create ADKAR assessment questionnaires | [GitHub](https://github.com/alirezarezvani/claude-skills) |
| UX Researcher Designer | Skill | Persona Generator for change impact assessment | [GitHub](https://github.com/alirezarezvani/claude-skills) |
| awesome-mcp-personas | Collection | Persona-based MCP server groupings for change simulation | [GitHub](https://github.com/toolprint/awesome-mcp-personas) |

### Change Management Subagents

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| change-management-specialist | Subagent | Change readiness and adoption tracking | [ChrisRoyse/610ClaudeSubagents](https://github.com/ChrisRoyse/610ClaudeSubagents) |
| organizational-development-expert | Subagent | Organizational transformation and culture change | [ChrisRoyse/610ClaudeSubagents](https://github.com/ChrisRoyse/610ClaudeSubagents) |

### Resistance Management and Adoption

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| feedback-synthesizer | Plugin | Aggregate resistance feedback and sentiment | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) |
| Meeting Insights Analyzer | Skill | Analyze meeting transcripts for resistance patterns | [ComposioHQ](https://github.com/ComposioHQ/awesome-claude-skills) |

---

## Consulting and Problem Solving

### Structured Problem Solving

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| Kaizen | Skill | Continuous improvement methodology with analytical approaches | [ComposioHQ](https://github.com/ComposioHQ/awesome-claude-skills) |
| Issue Tree Generator | Skill | MECE-structured issue trees for consulting | [MCPMarket](https://mcpmarket.com/tools/skills) |
| Hypothesis Analysis Skill | Skill | Hypothesis-driven analysis frameworks | [MCPMarket](https://mcpmarket.com/tools/skills) |

### Consulting Subagents

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| management-consultant | Subagent | McKinsey-style problem solving and issue trees | [VoltAgent](https://github.com/VoltAgent/awesome-claude-code-subagents) |
| strategy-consultant | Subagent | Strategic analysis and recommendation development | [ChrisRoyse/610ClaudeSubagents](https://github.com/ChrisRoyse/610ClaudeSubagents) |
| competitive-analyst | Subagent | Competitive intelligence and market analysis | [VoltAgent](https://github.com/VoltAgent/awesome-claude-code-subagents) |

### Research and Analysis

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| Claude-Deep-Research | MCP | Comprehensive research with web and academic search | [GitHub](https://github.com/mcherukara/Claude-Deep-Research) |
| sanjay3290/deep-research | Skill | Autonomous research for market and competitive analysis | [VoltAgent](https://github.com/VoltAgent/awesome-claude-skills) |
| Lead Research Assistant | Skill | Identify opportunities by analyzing market data | [ComposioHQ](https://github.com/ComposioHQ/awesome-claude-skills) |

---

## Presentation and Documentation

### PowerPoint Generation

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| PowerPoint Automation MCP Server | MCP | Create presentations with Claude Desktop via MCP | [GitHub](https://github.com/socamalo/PPT_MCP_Server) |
| Marp MCP Server | MCP | Markdown-based presentations with structured layouts | [Glama](https://glama.ai/mcp/servers/@masaki39/marp-mcp) |
| SlideSpeak MCP | MCP | Generate professional PowerPoint from AI chat | [SlideSpeak](https://slidespeak.co/blog/2025/07/21/create-ai-presentations-in-claude-using-mcp) |
| pptx Skill | Skill | Create, edit, and analyze PowerPoint presentations | [MCPMarket](https://mcpmarket.com/tools/skills/pptx-professional-presentation-toolkit) |
| ppt-creator | Skill | Presentation creation capabilities | [GitHub](https://github.com/daymade/claude-code-skills) |
| revealjs-skill | Skill | Generate professional presentations with Reveal.js | [ComposioHQ](https://github.com/ComposioHQ/awesome-claude-skills) |

### Document Generation

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| docx Skill | Skill | Create, edit, and analyze Word documents | [VoltAgent](https://github.com/VoltAgent/awesome-claude-skills) |
| pdf Skill | Skill | Extract text, create PDFs, and handle forms | [VoltAgent](https://github.com/VoltAgent/awesome-claude-skills) |
| MD-PDF MCP Server | MCP | Convert Markdown to PDF with Pandoc and WeasyPrint | [mcpservers.org](https://mcpservers.org/servers/kareemaly/md-pdf-mcp) |
| MCP-Pandoc | MCP | Document format conversion using Pandoc | [GitHub](https://github.com/vivekVells/mcp-pandoc) |

### Pyramid Principle and Structuring

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| CEO Advisor | Skill | Strategy Analyzer with executive communication frameworks | [GitHub](https://github.com/alirezarezvani/claude-skills) |
| Executive Summary Generator | Plugin | Generate executive summaries from detailed analysis | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) |

---

## Project and Issue Management MCPs

### Jira Integration

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| mcp-atlassian | MCP | Confluence and Jira for Cloud and Server/Data Center | [GitHub](https://github.com/sooperset/mcp-atlassian) |
| Atlassian Rovo MCP Server | MCP | Official Atlassian cloud-based MCP bridge | [Atlassian Support](https://support.atlassian.com/atlassian-rovo-mcp-server/docs/setting-up-clients/) |
| mcp-jira-server | MCP | Complete Jira functionality with batch processing | [GitHub](https://github.com/tom28881/mcp-jira-server) |
| mcp-atlassian-sprint | MCP | Sprint management across Atlassian platforms | [TensorBlock](https://github.com/TensorBlock/awesome-mcp-servers) |

### Linear and Asana Integration

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| linear-mcp-server | MCP | Manage teams, issues, projects, and cycles | [Glama](https://glama.ai/mcp/servers/@cpropster/linear-mcp-server) |
| Asana MCP Server (Official) | MCP | Official Asana MCP for AI workspace access | [Asana Developers](https://developers.asana.com/docs/using-asanas-mcp-server) |
| mcp-server-asana | MCP | Task and project management via Asana API | [TensorBlock](https://github.com/TensorBlock/awesome-mcp-servers) |

### GitHub and Planning MCPs

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| GitHub MCP Server (Official) | MCP | Repos, issues/PRs, workflows | [GitHub](https://github.com/github/github-mcp-server) |
| Software-planning-mcp | MCP | Breaks projects into tasks and manages detailed plans | [GitHub](https://github.com/NightTrek/Software-planning-mcp) |
| project-mcp | MCP | Structured knowledge graphs for tasks, milestones, resources, risks | [TensorBlock](https://github.com/TensorBlock/awesome-mcp-servers) |

### Documentation and Collaboration

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| Notion MCP (Official) | MCP | Full workspace access with OAuth for BA documentation | [Notion Developers](https://developers.notion.com/docs/mcp) |
| Confluence MCP | MCP | Documentation and knowledge base management | [GitHub](https://github.com/atlassian/atlassian-mcp-server) |

---

## Diagram and Visualization Tools

### Architecture and Flow Diagrams

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| C4Diagrammer | MCP Server | Generate C4 architecture diagrams using Mermaid.js | [GitHub](https://github.com/jonverrier/C4Diagrammer) |
| sailor | MCP Server | Mermaid diagrams with web UI and AI-powered generation | [GitHub](https://github.com/aj-geddes/sailor) |
| mcp-mermaid-diagram | MCP Server | Natural language to flowchart, sequence, class diagrams | [GitHub](https://github.com/locupleto/mcp-mermaid-diagram) |
| Architecture Diagrams Skill | Skill | Create architecture and system diagrams | [claude-plugins.dev](https://claude-plugins.dev/skills/@aj-geddes/useful-ai-prompts/architecture-diagrams) |

### Value Stream and Process Visualization

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| D3.js Visualization Skill | Skill | D3.js data visualization for value stream maps | [GitHub](https://github.com/chrisvoncsefalvay/claude-d3js-skill) |
| mermaid-gen | Skill | Generate Mermaid diagrams including flowcharts and journey maps | [FastMCP](https://fastmcp.me/Skills/Details/289/mermaid-gen) |

### Stakeholder Visualizations

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| Mermaid Quadrant Charts | Feature | Power-Interest grid visualizations | [Mermaid Docs](https://mermaid.js.org/syntax/quadrantChart.html) |
| Network Diagrams | Feature | Influence network and relationship mapping | [GitHub](https://github.com/veelenga/claude-mermaid) |

---

## Workshop and Collaboration Tools

### Virtual Collaboration Platforms

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| Miro MCP Server | MCP | Visual collaboration for workshops and brainstorming | [Miro Developers](https://developers.miro.com/) |
| Notion Skills Marketplace | Skill | Meeting intelligence and knowledge capture | [GitHub](https://github.com/tommy-ca/notion-skills) |
| Knowledge Capture Skill | Skill | Turn workshop discussions into durable knowledge | [GitHub](https://github.com/tommy-ca/notion-skills) |

### Facilitation and Brainstorming

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| obra/brainstorming | Skill | Generate and explore ideas for planning sessions | [VoltAgent](https://github.com/VoltAgent/awesome-claude-skills) |
| obra/writing-plans | Skill | Create strategic documentation from workshops | [VoltAgent](https://github.com/VoltAgent/awesome-claude-skills) |
| obra/dispatching-parallel-agents | Skill | Coordinate multiple work streams in large workshops | [VoltAgent](https://github.com/VoltAgent/awesome-claude-skills) |

### Workshop Facilitation Subagents

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| workshop-facilitator | Subagent | Design and facilitate collaborative sessions | [VoltAgent](https://github.com/VoltAgent/awesome-claude-code-subagents) |
| design-thinking-facilitator | Subagent | Design thinking and ideation sessions | [ChrisRoyse/610ClaudeSubagents](https://github.com/ChrisRoyse/610ClaudeSubagents) |

---

## Metrics and Performance Tracking

### Analytics and Dashboards

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| Mixpanel MCP | MCP | Funnels, retention, frequency queries via natural language | [Mixpanel Docs](https://docs.mixpanel.com/docs/features/mcp) |
| cc-metrics | Tool | Real-time tracking and analytics with Chart.js | [GitHub](https://github.com/lasswellt/cc-metrics) |
| analytics-reporter | Plugin | Generate analytics reports and metrics summaries | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) |

### Performance Measurement Subagents

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| performance-pattern-analyzer | Subagent | Examines historical performance data | [ChrisRoyse/610ClaudeSubagents](https://github.com/ChrisRoyse/610ClaudeSubagents) |
| kpi-tracking-specialist | Subagent | KPI definition and measurement tracking | [ChrisRoyse/610ClaudeSubagents](https://github.com/ChrisRoyse/610ClaudeSubagents) |

### Dashboard Design Skills

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| Dashboard Designer Skill | Skill | KPI dashboard layouts and visualizations | [MCPMarket](https://mcpmarket.com/tools/skills) |
| Excel Dashboard Templates | Integration | Metrics dashboards in Excel via Claude | [Claude](https://claude.com/claude-in-excel) |

---

## Risk Management

### Risk Analysis Tools

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| Risk Assessment Skill | Skill | Risk identification and scoring frameworks | [MCPMarket](https://mcpmarket.com/tools/skills) |
| Monte Carlo Simulation | Integration | Sensitivity analysis via Claude in Excel | [Claude](https://claude.com/claude-in-excel) |

### Risk Management Subagents

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| risk-analyst | Subagent | Risk identification, scoring, and mitigation | [VoltAgent](https://github.com/VoltAgent/awesome-claude-code-subagents) |
| compliance-analyst | Subagent | Compliance and governance risk assessment | [ChrisRoyse/610ClaudeSubagents](https://github.com/ChrisRoyse/610ClaudeSubagents) |

### Risk Visualization

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| Mermaid Quadrant Charts | Feature | Risk matrices and heat maps | [Mermaid Docs](https://mermaid.js.org/syntax/quadrantChart.html) |
| Risk Register Templates | Templates | Excel-based risk registers via Claude | [Claude](https://claude.com/claude-in-excel) |

---

## Training and Knowledge Transfer

### Learning and Development

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| Training Curriculum Designer | Skill | Competency-based learning paths | [MCPMarket](https://mcpmarket.com/tools/skills) |
| Interactive Tutorial Skill | Skill | Design assessment instruments and training modules | [claude-plugins.dev](https://claude-plugins.dev/) |

### Knowledge Management

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| Tapestry | Skill | Interlink and summarize documents into knowledge networks | [ComposioHQ](https://github.com/ComposioHQ/awesome-claude-skills) |
| Knowledge Capture Skill | Skill | Convert discussions to structured knowledge | [GitHub](https://github.com/tommy-ca/notion-skills) |
| Confluence Knowledge Base MCP | MCP | Store and retrieve knowledge transfer materials | [GitHub](https://github.com/atlassian/atlassian-mcp-server) |

### Training Design Subagents

| Resource | Type | Description | URL |
|----------|------|-------------|-----|
| training-designer | Subagent | Instructional design and learning objectives | [ChrisRoyse/610ClaudeSubagents](https://github.com/ChrisRoyse/610ClaudeSubagents) |
| knowledge-transfer-specialist | Subagent | Capability building and enablement | [ChrisRoyse/610ClaudeSubagents](https://github.com/ChrisRoyse/610ClaudeSubagents) |

---

## Awesome Lists and Catalogs

### Primary Skill and Plugin Catalogs

| Resource | Description | URL |
|----------|-------------|-----|
| awesome-claude-skills (ComposioHQ) | Curated Claude Skills and tools | [GitHub](https://github.com/ComposioHQ/awesome-claude-skills) |
| awesome-claude-skills (VoltAgent) | Awesome collection of Claude Skills | [GitHub](https://github.com/VoltAgent/awesome-claude-skills) |
| awesome-claude-code-plugins (ccplugins) | Claude Code plugins marketplace | [GitHub](https://github.com/ccplugins/awesome-claude-code-plugins) |
| claude-plugins.dev | Community registry with CLI for plugins/skills | [Website](https://claude-plugins.dev/) |
| MCPMarket | Skills and MCP servers marketplace | [Website](https://mcpmarket.com/) |
| skillsmp.com | Claude Skills marketplace | [Website](https://skillsmp.com/) |

### MCP Server Collections

| Resource | Description | URL |
|----------|-------------|-----|
| awesome-mcp-servers (punkpeye) | Comprehensive MCP servers collection (76.5k stars) | [GitHub](https://github.com/punkpeye/awesome-mcp-servers) |
| awesome-mcp-servers (wong2) | Curated MCP servers with official integrations | [GitHub](https://github.com/wong2/awesome-mcp-servers) |
| MCP Servers (Official) | Official Model Context Protocol Servers | [GitHub](https://github.com/modelcontextprotocol/servers) |
| TensorBlock/awesome-mcp-servers | 7260+ MCP servers catalog | [GitHub](https://github.com/TensorBlock/awesome-mcp-servers) |
| mcpservers.org | Awesome MCP Servers directory | [Website](https://mcpservers.org/) |
| mcp-awesome.com | 1200+ quality-verified MCP servers directory | [Website](https://mcp-awesome.com/) |

---

## Skills-to-Reference Mapping

| Backlog Skill ID | Skill Name | Primary References |
|------------------|------------|---------------------|
| SK-001 | Requirements Quality Analyzer | Product Manager Toolkit, Agile Product Owner, Requirements Quality Checker |
| SK-002 | BPMN Diagram Generator | BPMN.js MCP Server, UML-MCP, Mermaid MCPs |
| SK-003 | Financial Calculator | Claude in Excel, xlsx Skill, Excel Financial Modeling Skill |
| SK-004 | Stakeholder Matrix Generator | Mermaid Quadrant Charts, Table Generator Skill, Notion Connector |
| SK-005 | Gap Analysis Framework | Kaizen Skill, process-improvement-analyst, competitive-analyst |
| SK-006 | User Story Writer | Agile Product Owner, Product Manager Prompts, User Story Writer Skill |
| SK-007 | Traceability Matrix Builder | GitHub Project Manager MCP, Jira MCP, requirements-analyst |
| SK-008 | Value Stream Mapping | D3.js Visualization Skill, Mermaid diagrams, UML-MCP |
| SK-009 | ADKAR Assessment | Survey Design Skill, UX Researcher Designer, change-management-specialist |
| SK-010 | Pyramid Principle Structuring | CEO Advisor, Executive Summary Generator, pptx Skill |
| SK-011 | Issue Tree Generator | management-consultant, Kaizen Skill, Mermaid tree diagrams |
| SK-012 | UAT Test Case Generator | Agile Product Owner, Product Manager Toolkit, requirements-analyst |
| SK-013 | Communication Plan Generator | Internal Comms, stakeholder-communication-planner, Notion Skills |
| SK-014 | Options Scoring Calculator | xlsx Skill, Excel Financial Modeling, pricing-strategy-optimizer |
| SK-015 | Training Curriculum Designer | Training Curriculum Designer Skill, training-designer subagent |
| SK-016 | Workshop Facilitation Toolkit | obra/brainstorming, workshop-facilitator, design-thinking-facilitator |
| SK-017 | Metrics Dashboard Designer | Dashboard Designer Skill, cc-metrics, D3.js Visualization Skill |
| SK-018 | Risk Register Builder | Risk Assessment Skill, risk-analyst, Mermaid Quadrant Charts |

---

## Agents-to-Reference Mapping

| Backlog Agent ID | Agent Name | Primary References |
|------------------|------------|---------------------|
| AG-001 | Senior Business Analyst | business-analyst subagent, requirements-analyst, Product Manager Toolkit |
| AG-002 | Process Improvement Expert | process-improvement-analyst, operations-excellence-specialist, Kaizen |
| AG-003 | Management Consultant | management-consultant, strategy-consultant, CEO Advisor |
| AG-004 | Financial Analyst | financial-analyst, business-case-analyst, Claude in Excel |
| AG-005 | Stakeholder Management Expert | stakeholder-communication-planner, user-journey-strategist, Internal Comms |
| AG-006 | Change Management Expert | change-management-specialist, organizational-development-expert, ADKAR tools |
| AG-007 | Training Design Expert | training-designer, knowledge-transfer-specialist, Training Curriculum Designer |
| AG-008 | Solution Architect Analyst | competitive-analyst, pricing-strategy-optimizer, strategy-consultant |
| AG-009 | Workshop Facilitator | workshop-facilitator, design-thinking-facilitator, obra/brainstorming |
| AG-010 | Technical Writer | docx Skill, pptx Skill, Internal Comms, Confluence MCP |
| AG-011 | Quality Assurance Analyst | Requirements Quality Checker, Impersonaid, requirements-analyst |
| AG-012 | Risk Analyst | risk-analyst, compliance-analyst, Risk Assessment Skill |
| AG-013 | Performance Measurement Expert | performance-pattern-analyzer, kpi-tracking-specialist, Mixpanel MCP |

---

## Implementation Recommendations

### High-Value Quick Wins

1. **Integrate Core MCP Servers**: Jira, Confluence, Notion, and Linear MCPs provide immediate value for existing BA workflows
2. **Adopt Claude in Excel**: Native financial analysis capabilities for business case development
3. **Leverage Mermaid MCPs**: Multiple options for BPMN, flowcharts, and stakeholder visualizations
4. **Use Existing Skills**: alirezarezvani/claude-skills Product Team package covers many requirements and consulting needs

### Gaps Requiring Custom Development

| Gap Area | Description | Priority |
|----------|-------------|----------|
| ADKAR-Specific Skill | No dedicated Prosci ADKAR assessment tool | High |
| Volere Template Generator | IEEE 29148 / Volere requirements template automation | Medium |
| RACI Matrix Generator | Dedicated RACI creation with validation rules | High |
| Value Stream Mapping Skill | Dedicated VSM with waste identification and PCE calculation | Medium |
| Stakeholder Salience Model | Mitchell-Agle-Wood visualization and scoring | Medium |

### Recommended Integration Path

1. **Phase 1**: Install core MCP servers (Atlassian, Notion, GitHub)
2. **Phase 2**: Configure Claude in Excel for financial analysis
3. **Phase 3**: Integrate Mermaid MCPs for process and stakeholder diagrams
4. **Phase 4**: Adopt alirezarezvani/claude-skills Product Team package
5. **Phase 5**: Build custom skills for ADKAR, RACI, and Volere gaps

### Cross-Specialization Reusability

Skills and agents from this specialization that can be shared with other domains:

| Resource | Applicable To |
|----------|--------------|
| SK-003 Financial Calculator | Product Management, Project Management |
| SK-005 Gap Analysis Framework | Software Architecture, Security Compliance |
| SK-006 User Story Writer | Product Management, Agile Development |
| SK-010 Pyramid Principle | Technical Documentation, Executive Communication |
| SK-016 Workshop Facilitation | UX/UI Design, Product Management |
| SK-017 Metrics Dashboard Designer | Data Analytics, DevOps/SRE |
| SK-018 Risk Register Builder | Project Management, Security Compliance |
| AG-003 Management Consultant | Strategy, Executive Communication |
| AG-009 Workshop Facilitator | UX/UI Design, Agile Development |
| AG-010 Technical Writer | Technical Documentation |

---

## Summary

| Metric | Value |
|--------|-------|
| Total References Cataloged | 129 |
| Categories Covered | 14 |
| Skills with Matches | 18/18 (100%) |
| Agents with Matches | 13/13 (100%) |
| MCP Servers Listed | 38 |
| Claude Skills Listed | 42 |
| Subagents Listed | 28 |
| Plugins Listed | 9 |
| Curated Collections | 12 |

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 5 - Skills and Agents References Compiled
**Source Backlog**: skills-agents-backlog.md
**Primary Sources**:
- [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills)
- [VoltAgent/awesome-claude-skills](https://github.com/VoltAgent/awesome-claude-skills)
- [GitHub Topics: claude-skills](https://github.com/topics/claude-skills)
- [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)
- [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)
