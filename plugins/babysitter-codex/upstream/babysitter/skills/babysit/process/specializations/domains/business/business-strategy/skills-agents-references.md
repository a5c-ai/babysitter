# Business Strategy and Operations - Skills and Agents References

This document catalogs existing Claude skills, MCP servers, agents, and community resources that can be reused or adapted for the Business Strategy specialization processes. These references are organized by capability area to facilitate implementation planning.

---

## Table of Contents

1. [Overview](#overview)
2. [MCP Servers - Financial Data](#mcp-servers---financial-data)
3. [MCP Servers - Market Intelligence](#mcp-servers---market-intelligence)
4. [MCP Servers - Business Data](#mcp-servers---business-data)
5. [MCP Servers - Visualization](#mcp-servers---visualization)
6. [Claude Skills - Official](#claude-skills---official)
7. [Claude Skills - Community](#claude-skills---community)
8. [Internal Specialization References](#internal-specialization-references)
9. [Open Source Tools](#open-source-tools)
10. [MCP Server Directories](#mcp-server-directories)
11. [Process-to-Reference Mapping](#process-to-reference-mapping)

---

## Overview

### Purpose

This reference document supports Phase 5 implementation by identifying:
- Existing MCP servers that provide data access for strategic analysis
- Claude skills that can be reused or extended for business strategy workflows
- Open source tools that can complement skill development
- Internal specializations with transferable processes and patterns

### Key Integration Points

| Capability Area | Primary MCP Servers | Primary Skills |
|----------------|---------------------|----------------|
| Financial Analysis | Financial Modeling Prep, Financial Datasets, SEC MCP | xlsx skill, financial_analyzer |
| Market Intelligence | Octagon, TAM MCP, Reddit Research | competitive-intel skill |
| Data Visualization | mcp-server-chart, QuickChart, ECharts | pptx skill, chart generation |
| Due Diligence | Companies House, SEC MCP | pdf skill, report_generator |
| Performance Management | HubSpot, Notion, Google Calendar | OKR recipes, product-strategist |

---

## MCP Servers - Financial Data

### 1. Financial Modeling Prep MCP Server

**Repository**: [imbenrabi/Financial-Modeling-Prep-MCP-Server](https://github.com/imbenrabi/Financial-Modeling-Prep-MCP-Server)

**Description**: Comprehensive financial data access with 253+ tools across 24 categories for stock information, company fundamentals, and market insights.

**Capabilities**:
- Company financial statements and metrics
- Stock quotes and historical data
- Analyst ratings and estimates
- Market indices and performers
- DCF valuation data

**Applicable Processes**:
- business-case-development.js (financial modeling)
- ma-target-screening.js (target valuation)
- due-diligence-framework.js (financial DD)
- competitive-intelligence.js (competitor financials)

**License**: Apache 2.0 (requires FMP API key)

---

### 2. Financial Datasets MCP Server

**Repository**: [financial-datasets/mcp-server](https://github.com/financial-datasets/mcp-server)

**Description**: Stock market data access including income statements, balance sheets, cash flow statements, stock prices, and market news.

**Capabilities**:
- getFilings, getFilingItems for SEC data
- getFinancialMetrics, getFinancialMetricsSnapshot
- getBalanceSheet, getIncomeStatement
- getNews for market news

**Use Cases**:
- Automated Due Diligence workflows
- Comparative Analysis automation
- Financial statement analysis

**Applicable Processes**:
- due-diligence-framework.js (comprehensive DD)
- ma-target-screening.js (financial evaluation)
- business-case-development.js (investment analysis)

---

### 3. SEC MCP Server

**Repository**: [LuisRincon23/SEC-MCP](https://github.com/LuisRincon23/SEC-MCP)

**Description**: Streamlined interface to SEC EDGAR data with real-time streaming via SSE.

**Capabilities**:
- Access to SEC filings
- Company disclosure data
- Institutional holdings
- Insider trading information

**Applicable Processes**:
- due-diligence-framework.js (regulatory filings)
- ma-target-screening.js (public company research)
- competitive-intelligence.js (competitor filings)

---

### 4. European Financial Reports MCP Server

**Repository**: [itisaevalex/financial-reports-mcp-server](https://github.com/itisaevalex/financial-reports-mcp-server)

**Description**: Access to FinancialReports.eu API for European company filings and industry data.

**Capabilities**:
- Company financial filings (EU)
- Industry classifications
- Cross-border financial data

**Applicable Processes**:
- pestel-analysis.js (European regulatory context)
- ma-target-screening.js (EU target research)
- due-diligence-framework.js (international DD)

---

### 5. Massive.com MCP Server

**Repository**: [massive-com/mcp_massive](https://github.com/massive-com/mcp_massive)

**Description**: Comprehensive financial market data including stock, options, forex, and crypto.

**Capabilities**:
- Market aggregates and bars
- Multi-asset class data
- Real-time market data

**Applicable Processes**:
- scenario-planning.js (market scenarios)
- business-case-development.js (market context)

---

### 6. cdtait FMP MCP Server

**Repository**: [cdtait/fmp-mcp-server](https://github.com/cdtait/fmp-mcp-server)

**Description**: Financial analysis using Financial Modeling Prep API with tools, resources, and prompts.

**Features**:
- Company Information tools
- Financial Statements access
- Financial Metrics calculation
- Market Data retrieval
- Analyst Ratings

**Applicable Processes**:
- porters-five-forces.js (industry financials)
- competitive-intelligence.js (competitor metrics)

---

## MCP Servers - Market Intelligence

### 7. Octagon Deep Research MCP

**Repository**: [OctagonAI/octagon-deep-research-mcp](https://github.com/OctagonAI/octagon-deep-research-mcp)

**Description**: AI-powered comprehensive research and analysis with specialized deep research agents.

**Capabilities**:
- Competitive landscape analysis
- Technical deep-dives
- Policy impact assessment
- Market dynamics research

**Applicable Processes**:
- competitive-intelligence.js (comprehensive research)
- pestel-analysis.js (macro analysis)
- scenario-planning.js (trend research)
- blue-ocean-strategy.js (market opportunity)

---

### 8. Octagon MCP Server

**Repository**: [OctagonAI/octagon-mcp-server](https://github.com/OctagonAI/octagon-mcp-server)

**Description**: Financial research and analysis through the Octagon Market Intelligence API.

**Capabilities**:
- Public filings analysis
- Earnings transcript insights
- Financial metrics extraction
- Private market transactions
- Deep web-based research

**Applicable Processes**:
- ma-target-screening.js (market intelligence)
- due-diligence-framework.js (comprehensive research)
- competitive-intelligence.js (competitor analysis)

---

### 9. TAM MCP Server

**Repository**: [gvaibhav/TAM-MCP-Server](https://github.com/gvaibhav/TAM-MCP-Server)

**Description**: Comprehensive market sizing and industry research with 28 tools and 15 professional templates.

**Capabilities**:
- TAM/SAM/SOM calculation
- Market sizing analysis
- Industry research templates
- Data integration (Alpha Vantage, BLS, Census, FRED, IMF, OECD, World Bank)

**Applicable Processes**:
- growth-strategy-ansoff.js (market assessment)
- competitive-intelligence.js (market size)
- business-case-development.js (opportunity sizing)
- ma-target-screening.js (market evaluation)

---

### 10. Reddit Research MCP

**Repository**: [king-of-the-grackles/reddit-research-mcp](https://github.com/king-of-the-grackles/reddit-research-mcp)

**Description**: Reddit intelligence platform for competitive analysis, market research, and customer discovery.

**Capabilities**:
- Semantic search across 20,000+ subreddits
- Customer sentiment analysis
- Market trend identification
- Competitive discussion monitoring

**Applicable Processes**:
- competitive-intelligence.js (social listening)
- value-proposition-design.js (customer insights)
- pestel-analysis.js (social trends)

---

### 11. Adalyst MCP

**Repository**: [Mohit-Dhawan98/adalyst-mcp](https://github.com/Mohit-Dhawan98/adalyst-mcp)

**Description**: AI-powered competitive analysis and market research tools.

**Capabilities**:
- Competitor strategy analysis
- Market trend identification
- Advertising intelligence
- Business insights generation

**Applicable Processes**:
- competitive-intelligence.js (competitor tracking)
- blue-ocean-strategy.js (market analysis)
- swot-analysis.js (external analysis)

---

## MCP Servers - Business Data

### 12. Companies House MCP Server

**Repository**: [elankeeran/Companies-House-MCP-Server](https://github.com/elankeeran/Companies-House-MCP-Server)

**Description**: UK Companies House API integration for company research and due diligence.

**Capabilities**:
- Company search and profiles
- Officers and directors information
- Insolvency proceedings check
- Beneficial owners (PSC) identification
- Due diligence report generation

**Applicable Processes**:
- due-diligence-framework.js (UK company DD)
- ma-target-screening.js (UK targets)
- competitive-intelligence.js (UK competitors)

---

### 13. HubSpot MCP Server

**Reference**: [HubSpot MCP Documentation](https://www.unleash.so/post/claude-mcp-the-complete-guide-to-model-context-protocol-integration-and-enterprise-security)

**Description**: CRM data access for deals, contacts, and customer analytics.

**Capabilities**:
- Deal pipeline access
- Customer ticket analysis
- Sales performance data
- Contact and company information

**Applicable Processes**:
- balanced-scorecard.js (customer metrics)
- okr-development.js (sales OKRs)
- value-proposition-design.js (customer data)

---

### 14. Notion MCP Server

**Reference**: [Notion MCP Integration](https://www.k2view.com/blog/awesome-mcp-servers)

**Description**: Notion workspace data access for pages, databases, and tasks.

**Capabilities**:
- Page and database access
- Task management integration
- Knowledge base queries
- Collaborative workspace data

**Applicable Processes**:
- strategy-map-creation.js (strategy documentation)
- okr-development.js (OKR tracking)
- annual-strategic-planning.js (planning documents)

---

### 15. Google Calendar MCP Server

**Reference**: [Google Calendar MCP](https://www.k2view.com/blog/awesome-mcp-servers)

**Description**: Calendar data access for scheduling and availability analysis.

**Capabilities**:
- Schedule and availability data
- Meeting metadata access
- Calendar-based planning

**Applicable Processes**:
- kotter-change-management.js (change timelines)
- post-merger-integration.js (integration scheduling)
- digital-transformation-roadmap.js (milestone planning)

---

## MCP Servers - Visualization

### 16. AntVis Chart MCP Server

**Repository**: [antvis/mcp-server-chart](https://github.com/antvis/mcp-server-chart)

**Description**: Visualization skill with 25+ chart types using AntVis library.

**Chart Types**:
- Area, bar, boxplot, column charts
- Liquid, mind map, network graphs
- Organizational charts, pie charts
- Radar charts, word clouds
- Pin maps, treemaps

**Applicable Processes**:
- strategy-map-creation.js (strategy visualization)
- balanced-scorecard.js (dashboard charts)
- blue-ocean-strategy.js (strategy canvas)
- value-stream-mapping.js (flow visualization)

---

### 17. QuickChart MCP Server

**Repository**: [GongRzhe/Quickchart-MCP-Server](https://github.com/GongRzhe/Quickchart-MCP-Server)

**Description**: Chart generation through QuickChart.io with multiple chart types.

**Chart Types**:
- Bar, line, pie, doughnut
- Radar, polar area, scatter, bubble
- Radial gauge, speedometer

**Applicable Processes**:
- balanced-scorecard.js (KPI dashboards)
- okr-development.js (progress tracking)
- business-case-development.js (financial charts)

---

### 18. ECharts MCP Server

**Repository**: [hustcc/mcp-echarts](https://github.com/hustcc/mcp-echarts)

**Description**: Apache ECharts integration for dynamic chart generation.

**Applicable Processes**:
- annual-strategic-planning.js (roadmap visualization)
- strategic-initiative-portfolio.js (portfolio views)
- porters-five-forces.js (force diagrams)

---

### 19. Mermaid MCP Server

**Repository**: [hustcc/mcp-mermaid](https://github.com/hustcc/mcp-mermaid)

**Description**: Mermaid diagram generation for flowcharts, sequences, and organizational charts.

**Applicable Processes**:
- operating-model-redesign.js (org charts)
- value-stream-mapping.js (process flows)
- business-process-reengineering.js (process diagrams)

---

### 20. Excel MCP Server

**Repository**: [haris-musa/excel-mcp-server](https://github.com/haris-musa/excel-mcp-server)

**Description**: Excel manipulation with charts, pivot tables, and formulae.

**Applicable Processes**:
- business-case-development.js (financial models)
- balanced-scorecard.js (scorecards)
- six-sigma-dmaic.js (statistical analysis)

---

## Claude Skills - Official

### 21. Anthropic Skills Repository

**Repository**: [anthropics/skills](https://github.com/anthropics/skills)

**Description**: Official Agent Skills repository with document creation and specialized workflows.

**Available Skills**:

| Skill | Description | Applicable Processes |
|-------|-------------|---------------------|
| `skills/xlsx` | Excel document creation with formulas and charts | business-case-development.js, balanced-scorecard.js |
| `skills/pptx` | PowerPoint presentation generation | strategy-map-creation.js, annual-strategic-planning.js |
| `skills/pdf` | PDF document generation | due-diligence-framework.js, business-case-development.js |
| `skills/docx` | Word document creation | annual-strategic-planning.js, operating-model-redesign.js |

---

### 22. Claude Cookbooks - Financial Applications

**Repository**: [anthropics/claude-cookbooks/skills](https://github.com/anthropics/claude-cookbooks/tree/main/skills)

**Notebook**: [02_skills_financial_applications.ipynb](https://github.com/anthropics/claude-cookbooks/blob/main/skills/notebooks/02_skills_financial_applications.ipynb)

**Capabilities**:
- Comprehensive financial models in Excel with formulas and charts
- Executive presentations from financial data
- Portfolio analysis tools with risk metrics
- Multi-format reporting pipelines

**Sample Data Available**:
- financial_statements.csv
- portfolio_holdings.json
- budget_template.csv
- quarterly_metrics.json

**Custom Skills**:
- financial_analyzer
- brand_guidelines
- report_generator

**Applicable Processes**:
- business-case-development.js (all phases)
- ma-target-screening.js (valuation analysis)
- balanced-scorecard.js (performance reporting)

---

## Claude Skills - Community

### 23. Awesome Claude Skills Collections

**Repositories**:
- [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills)
- [travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills)
- [VoltAgent/awesome-claude-skills](https://github.com/VoltAgent/awesome-claude-skills)
- [abubakarsiddik31/claude-skills-collection](https://github.com/abubakarsiddik31/claude-skills-collection)

**Relevant Skills**:

| Skill | Description | Applicable Processes |
|-------|-------------|---------------------|
| `kaizen` | Continuous improvement methodology (Lean/Kaizen) | lean-process-optimization.js, six-sigma-dmaic.js |
| `product-strategist` | OKR cascades, strategic planning | okr-development.js, annual-strategic-planning.js |
| `meeting-insights-analyzer` | Meeting analysis, leadership patterns | kotter-change-management.js, stakeholder analysis |

---

### 24. alirezarezvani Claude Skills

**Repository**: [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills)

**Description**: Collection of skills for Claude Code including subagents and commands.

**Relevant Skills**:
- product-strategist: OKR cascades, vision alignment
- Strategic planning capabilities

**Applicable Processes**:
- okr-development.js (OKR generation)
- annual-strategic-planning.js (vision alignment)
- strategy-map-creation.js (objective mapping)

---

### 25. gked2121 Claude Skills

**Repository**: [gked2121/claude-skills](https://github.com/gked2121/claude-skills)

**Description**: 47 Production-Ready Claude Code Skills for developers, marketers, sales teams, and business professionals.

**Categories**:
- Document Processing (Word, PDF, PowerPoint)
- Data Analysis
- Business and Marketing
- Project Management

**Applicable Processes**: Multiple across business strategy domain

---

### 26. OKR Recipe

**Repository**: [sgharlow/claude-code-recipes](https://github.com/sgharlow/claude-code-recipes/blob/main/recipes/Recipe-017-OKR-Goal-Setting.md)

**Description**: Recipe for developing well-structured OKRs with alignment documentation.

**Features**:
- 2-4 measurable key results per objective
- SMART validation criteria
- Alignment documentation templates
- Dependency tracking

**Applicable Processes**:
- okr-development.js (all phases)
- balanced-scorecard.js (objective alignment)
- annual-strategic-planning.js (goal setting)

---

### 27. Planning with Files Skill

**Repository**: [OthmanAdi/planning-with-files](https://github.com/OthmanAdi/planning-with-files)

**Description**: Manus-style persistent markdown planning for project management.

**Applicable Processes**:
- strategic-initiative-portfolio.js (initiative tracking)
- digital-transformation-roadmap.js (transformation planning)
- post-merger-integration.js (integration planning)

---

## Internal Specialization References

### 28. Product Management Specialization

**Path**: `plugins/babysitter/skills/babysit/process/specializations/product-management/`

**Transferable Processes**:

| Process | Transferable Elements |
|---------|----------------------|
| `competitive-analysis.js` | Competitor profiling, market positioning |
| `product-vision-strategy.js` | Vision articulation, strategic alignment |
| `stakeholder-alignment.js` | Stakeholder mapping, communication planning |
| `jtbd-analysis.js` | Jobs-to-be-done methodology |
| `conversion-funnel-analysis.js` | Funnel analysis patterns |
| `metrics-dashboard.js` | Dashboard design, KPI tracking |

**Applicable Business Strategy Processes**:
- competitive-intelligence.js (from competitive-analysis.js)
- value-proposition-design.js (from jtbd-analysis.js)
- balanced-scorecard.js (from metrics-dashboard.js)

---

### 29. Data Engineering Analytics Specialization

**Path**: `plugins/babysitter/skills/babysit/process/specializations/data-engineering-analytics/`

**Transferable Processes**:

| Process | Transferable Elements |
|---------|----------------------|
| `bi-dashboard.js` | Dashboard creation, visualization |
| `metrics-layer.js` | Metrics definition, calculation |
| `data-quality-framework.js` | Data validation patterns |
| `ab-testing-pipeline.js` | Experimental design |

**Applicable Business Strategy Processes**:
- balanced-scorecard.js (from bi-dashboard.js)
- six-sigma-dmaic.js (from data-quality-framework.js)
- business-case-development.js (from metrics-layer.js)

---

### 30. DevOps SRE Platform Specialization

**Path**: `plugins/babysitter/skills/babysit/process/specializations/devops-sre-platform/`

**Transferable Processes**:

| Process | Transferable Elements |
|---------|----------------------|
| `slo-sli-tracking.js` | Service level tracking methodology |
| `incident-response.js` | Response framework patterns |
| `cost-optimization.js` | Cost analysis methodology |

**Applicable Business Strategy Processes**:
- balanced-scorecard.js (from slo-sli-tracking.js)
- lean-process-optimization.js (from cost-optimization.js)
- kotter-change-management.js (from incident-response.js patterns)

---

### 31. Technical Documentation Specialization

**Path**: `plugins/babysitter/skills/babysit/process/specializations/technical-documentation/`

**Transferable Processes**:

| Process | Transferable Elements |
|---------|----------------------|
| `adr-docs.js` | Decision record methodology |
| `content-strategy.js` | Content planning |
| `knowledge-base-setup.js` | Knowledge management |

**Applicable Business Strategy Processes**:
- strategy-map-creation.js (from content-strategy.js)
- annual-strategic-planning.js (from adr-docs.js patterns)

---

### 32. Data Science ML Specialization

**Path**: `plugins/babysitter/skills/babysit/process/specializations/data-science-ml/`

**Transferable Processes**:

| Process | Transferable Elements |
|---------|----------------------|
| `eda-pipeline.js` | Exploratory analysis patterns |
| `model-evaluation.js` | Evaluation methodology |
| `experiment-planning.js` | Experimental design |

**Applicable Business Strategy Processes**:
- scenario-planning.js (from experiment-planning.js)
- six-sigma-dmaic.js (from eda-pipeline.js)
- business-case-development.js (from model-evaluation.js patterns)

---

### 33. UX UI Design Specialization

**Path**: `plugins/babysitter/skills/babysit/process/specializations/ux-ui-design/`

**Transferable Processes**:

| Process | Transferable Elements |
|---------|----------------------|
| `user-journey-mapping.js` | Journey mapping methodology |
| `persona-development.js` | Persona creation |
| `design-sprint.js` | Sprint methodology |
| `user-research.js` | Research synthesis |

**Applicable Business Strategy Processes**:
- value-proposition-design.js (from persona-development.js)
- blue-ocean-strategy.js (from user-journey-mapping.js)
- business-process-reengineering.js (from design-sprint.js)

---

## Open Source Tools

### 34. Strategic Balanced Scorecard Repository

**Repository**: [joelparkerhenderson/strategic-balanced-scorecard](https://github.com/joelparkerhenderson/strategic-balanced-scorecard)

**Description**: Strategic planning using OKRs, KPIs, and initiatives.

**Features**:
- OKR formulation guides
- KPI definition templates
- Critical success factors framework
- Strategy-to-tactics connection

**Applicable Processes**:
- balanced-scorecard.js (methodology reference)
- okr-development.js (OKR templates)
- strategy-map-creation.js (mapping approach)

---

### 35. Business Model Canvas Repository

**Repository**: [joelparkerhenderson/business-model-canvas](https://github.com/joelparkerhenderson/business-model-canvas)

**Description**: Strategic management template for business model design.

**Features**:
- Nine building blocks framework
- Value proposition templates
- Customer relationship patterns
- Revenue model examples

**Applicable Processes**:
- business-model-canvas.js (methodology reference)
- value-proposition-design.js (VP templates)
- blue-ocean-strategy.js (business model innovation)

---

### 36. bcanvas - Business Canvas Tool

**Repository**: [richardgrey/bcanvas](https://github.com/richardgrey/bcanvas)

**Description**: Online tool for Business Model Canvas, Lean Canvas, and Value Proposition Canvas.

**Features**:
- Multiple canvas types
- Interactive editing
- Export capabilities

**Applicable Processes**:
- business-model-canvas.js (canvas generation)
- value-proposition-design.js (VP canvas)

---

### 37. HTML5 Business Model Canvas

**Repository**: [vertex/HTML5-Business-Model-Canvas](https://github.com/vertex/HTML5-Business-Model-Canvas)

**Description**: Open source Business Model Canvas generator using Ember.js.

**Applicable Processes**:
- business-model-canvas.js (visualization)

---

## MCP Server Directories

### Primary Directories

| Directory | URL | Description |
|-----------|-----|-------------|
| Awesome MCP Servers (punkpeye) | [GitHub](https://github.com/punkpeye/awesome-mcp-servers) | Comprehensive collection with web directory |
| Awesome MCP Servers (wong2) | [GitHub](https://github.com/wong2/awesome-mcp-servers) | Curated list of MCP servers |
| MCP Servers Directory | [mcpservers.org](https://mcpservers.org/) | Searchable MCP server directory |
| MCP Market | [mcpmarket.com](https://mcpmarket.com/) | Directory of MCP servers and clients |
| TensorBlock Awesome MCP | [GitHub](https://github.com/TensorBlock/awesome-mcp-servers/blob/main/docs/data-analysis--business-intelligence.md) | Data analysis and BI focused list |

### Category-Specific Resources

| Category | Resource | Description |
|----------|----------|-------------|
| Financial Data | [Top 5 MCP Servers for Financial Data](https://medium.com/predict/top-5-mcp-servers-for-financial-data-in-2026-5bf45c2c559d) | 2026 financial data server review |
| Data Science | [11 Data Science MCP Servers](https://snyk.io/articles/11-data-science-mcp-servers-for-sourcing-analyzing-and-visualizing-data/) | Data sourcing and analysis |
| Enterprise | [K2view MCP Guide](https://www.k2view.com/blog/awesome-mcp-servers) | Enterprise data integration |
| General | [Best MCP Servers 2026](https://blog.skyvia.com/best-mcp-servers/) | Comprehensive server guide |

---

## Process-to-Reference Mapping

### Strategic Analysis Processes

| Process | Primary References | Secondary References |
|---------|-------------------|---------------------|
| swot-analysis.js | Octagon Deep Research, Adalyst MCP | product-management/competitive-analysis.js |
| porters-five-forces.js | Financial Modeling Prep, TAM MCP | mcp-server-chart |
| pestel-analysis.js | Octagon Deep Research, Reddit Research | data-science-ml/eda-pipeline.js |
| scenario-planning.js | TAM MCP, Financial Datasets | data-science-ml/experiment-planning.js |
| competitive-intelligence.js | Adalyst MCP, Octagon MCP, Reddit Research | product-management/competitive-analysis.js |

### Business Model and Value Creation Processes

| Process | Primary References | Secondary References |
|---------|-------------------|---------------------|
| business-model-canvas.js | business-model-canvas repo, bcanvas | xlsx skill |
| value-proposition-design.js | Reddit Research, jtbd-analysis.js | persona-development.js |
| blue-ocean-strategy.js | mcp-server-chart, Octagon Research | user-journey-mapping.js |
| core-competency-assessment.js | Financial Modeling Prep | swot-analysis patterns |

### Strategic Planning and Execution Processes

| Process | Primary References | Secondary References |
|---------|-------------------|---------------------|
| annual-strategic-planning.js | strategic-balanced-scorecard repo, product-strategist | pptx skill, planning-with-files |
| okr-development.js | OKR Recipe, product-strategist | HubSpot MCP |
| balanced-scorecard.js | strategic-balanced-scorecard repo, xlsx skill | bi-dashboard.js, mcp-server-chart |
| strategy-map-creation.js | mcp-server-chart, mermaid MCP | pptx skill |
| strategic-initiative-portfolio.js | planning-with-files, xlsx skill | Notion MCP |

### Operational Excellence Processes

| Process | Primary References | Secondary References |
|---------|-------------------|---------------------|
| lean-process-optimization.js | kaizen skill | cost-optimization.js |
| six-sigma-dmaic.js | kaizen skill, eda-pipeline.js | data-quality-framework.js |
| business-process-reengineering.js | mermaid MCP, design-sprint.js | value-stream-mapping patterns |
| value-stream-mapping.js | mermaid MCP, mcp-server-chart | devops-sre patterns |

### Change Management and Transformation Processes

| Process | Primary References | Secondary References |
|---------|-------------------|---------------------|
| kotter-change-management.js | meeting-insights-analyzer | incident-response.js patterns |
| digital-transformation-roadmap.js | planning-with-files, Notion MCP | Google Calendar MCP |
| operating-model-redesign.js | mermaid MCP, docx skill | org chart visualization |

### M&A and Growth Processes

| Process | Primary References | Secondary References |
|---------|-------------------|---------------------|
| ma-target-screening.js | Companies House MCP, Financial Modeling Prep, Octagon MCP | SEC MCP |
| due-diligence-framework.js | Companies House MCP, SEC MCP, Financial Datasets | pdf skill |
| post-merger-integration.js | planning-with-files, Google Calendar MCP | Notion MCP |
| growth-strategy-ansoff.js | TAM MCP, Financial Modeling Prep | competitive-analysis.js |

### Business Case Processes

| Process | Primary References | Secondary References |
|---------|-------------------|---------------------|
| business-case-development.js | financial_analyzer skill, Financial Modeling Prep, xlsx skill | pptx skill, report_generator |

---

## Implementation Recommendations

### Phase 1: Foundation (Priority: High)

1. **Integrate Financial Modeling Prep MCP Server**
   - Enables financial analysis across 10+ processes
   - Supports valuation, comparative analysis, and due diligence

2. **Deploy mcp-server-chart**
   - Provides visualization for strategy canvases, dashboards, and maps
   - Supports 25+ chart types for strategic communication

3. **Implement xlsx skill integration**
   - Foundation for financial modeling and scorecards
   - Supports business case development and balanced scorecard

### Phase 2: Market Intelligence (Priority: High)

4. **Integrate Octagon MCP Servers**
   - Deep research and competitive intelligence capabilities
   - Supports comprehensive due diligence

5. **Deploy TAM MCP Server**
   - Market sizing and industry research
   - Supports growth strategy and opportunity assessment

### Phase 3: Visualization and Reporting (Priority: Medium)

6. **Integrate pptx skill**
   - Executive presentation generation
   - Strategy communication artifacts

7. **Deploy mermaid MCP**
   - Process flows and organizational charts
   - Operating model and value stream visualization

### Phase 4: Cross-Specialization Reuse (Priority: Medium)

8. **Adapt product-management processes**
   - Competitive analysis patterns
   - Stakeholder alignment methodology

9. **Leverage data-engineering processes**
   - Dashboard and metrics patterns
   - Data quality frameworks

### Phase 5: Advanced Capabilities (Priority: Lower)

10. **Integrate Companies House MCP**
    - UK-specific due diligence
    - International expansion support

11. **Deploy Reddit Research MCP**
    - Social listening and customer insights
    - Market sentiment analysis

---

## Summary Statistics

| Category | Count |
|----------|-------|
| MCP Servers - Financial Data | 6 |
| MCP Servers - Market Intelligence | 5 |
| MCP Servers - Business Data | 4 |
| MCP Servers - Visualization | 5 |
| Claude Skills - Official | 2 repositories |
| Claude Skills - Community | 5 collections |
| Internal Specializations Referenced | 6 |
| Open Source Tools | 4 |
| MCP Directories | 5 |
| Total External References | 37+ |

---

## Sources

### MCP Servers
- [Financial Modeling Prep MCP Server](https://github.com/imbenrabi/Financial-Modeling-Prep-MCP-Server)
- [Financial Datasets MCP Server](https://github.com/financial-datasets/mcp-server)
- [TAM MCP Server](https://github.com/gvaibhav/TAM-MCP-Server)
- [Octagon Deep Research MCP](https://github.com/OctagonAI/octagon-deep-research-mcp)
- [Octagon MCP Server](https://github.com/OctagonAI/octagon-mcp-server)
- [Companies House MCP Server](https://github.com/elankeeran/Companies-House-MCP-Server)
- [SEC MCP Server](https://github.com/LuisRincon23/SEC-MCP)
- [AntVis Chart MCP Server](https://github.com/antvis/mcp-server-chart)
- [Reddit Research MCP](https://github.com/king-of-the-grackles/reddit-research-mcp)
- [Adalyst MCP](https://github.com/Mohit-Dhawan98/adalyst-mcp)

### Claude Skills
- [Anthropic Skills Repository](https://github.com/anthropics/skills)
- [Claude Cookbooks - Financial Applications](https://github.com/anthropics/claude-cookbooks/tree/main/skills)
- [ComposioHQ Awesome Claude Skills](https://github.com/ComposioHQ/awesome-claude-skills)
- [OKR Recipe](https://github.com/sgharlow/claude-code-recipes/blob/main/recipes/Recipe-017-OKR-Goal-Setting.md)

### Open Source Tools
- [Strategic Balanced Scorecard](https://github.com/joelparkerhenderson/strategic-balanced-scorecard)
- [Business Model Canvas](https://github.com/joelparkerhenderson/business-model-canvas)

### Directories
- [Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers)
- [MCP Servers Directory](https://mcpservers.org/)
- [MCP Market](https://mcpmarket.com/)

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 5 - Skills and Agents References Completed
**Next Step**: Phase 6 - Implement specialized skills and agents based on backlog priorities
