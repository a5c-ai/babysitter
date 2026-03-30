# Project Management and Leadership - Skills and Agents References

This document provides references to GitHub repositories, MCP servers, and community resources for implementing the specialized skills and agents identified in the skills-agents-backlog.md.

---

## Table of Contents

1. [Overview](#overview)
2. [Skills References](#skills-references)
3. [Agents References](#agents-references)
4. [MCP Server References](#mcp-server-references)
5. [Community Resources](#community-resources)
6. [Implementation Guidance](#implementation-guidance)

---

## Overview

This reference document supports the implementation of 20 specialized skills and 15 specialized agents for the Project Management and Leadership specialization. References include open-source libraries, MCP server implementations, standards documentation, and community resources.

---

## Skills References

### SK-001: Gantt Chart Generator Skill

**GitHub Repositories**:
- [frappe/gantt](https://github.com/frappe/gantt) - Simple, interactive, modern Gantt chart library
- [neuronetio/gantt-schedule-timeline-calendar](https://github.com/neuronetio/gantt-schedule-timeline-calendar) - Gantt, schedule, timeline and calendar component
- [robicch/jQueryGantt](https://github.com/robicch/jQueryGantt) - jQuery Gantt editor with export capabilities
- [mermaid-js/mermaid](https://github.com/mermaid-js/mermaid) - Markdown-inspired Gantt diagrams
- [dhtmlx/gantt](https://github.com/nicklockwood/Gantt) - Full-featured Gantt chart component
- [jbaysolutions/vue-ganttastic](https://github.com/InfectoOne/vue-ganttastic) - Vue.js Gantt chart component

**NPM Packages**:
- `gantt-task-react` - React Gantt chart component
- `@syncfusion/ej2-gantt` - Syncfusion Gantt chart for project scheduling
- `bryntum-gantt` - Commercial Gantt chart with extensive features

**Standards & Documentation**:
- [MS Project XML Schema](https://docs.microsoft.com/en-us/office-project/xml-data-interchange/project-xml-data-interchange-schema-reference)
- [Open Project XML Format](https://www.omniplan.com/help/open-project-xml/)

---

### SK-002: Critical Path Analyzer Skill

**GitHub Repositories**:
- [lxndrblz/kritischer-pfad](https://github.com/lxndrblz/kritischer-pfad) - Critical path method implementation
- [projectlibre/projectlibre](https://github.com/nicklockwood/ProjectLibre) - Open source project management (CPM included)
- [Taskjuggler/TaskJuggler](https://github.com/taskjuggler/TaskJuggler) - Project scheduling with CPM analysis
- [larsga/network-pert](https://github.com/larsga/network-pert) - PERT/CPM network analysis

**NPM Packages**:
- `critical-path-method` - CPM calculation library
- `project-scheduler` - Scheduling algorithms including CPM
- `dagre` - Directed graph layout for network diagrams

**Academic Resources**:
- PMI Practice Standard for Scheduling
- DCMA 14-Point Schedule Assessment

**Standards & Documentation**:
- [DCMA Schedule Assessment Guide](https://www.dcma.mil/Policy-Guidance/)
- [GAO Schedule Assessment Guide](https://www.gao.gov/products/gao-16-89g)

---

### SK-003: Resource Leveling Optimizer Skill

**GitHub Repositories**:
- [OptaPlanner/optaplanner](https://github.com/kiegroup/optaplanner) - AI constraint solver for resource optimization
- [google/or-tools](https://github.com/google/or-tools) - Operations research tools with scheduling capabilities
- [d3/d3-force](https://github.com/d3/d3-force) - Force-directed graph layout (resource visualization)
- [coin-or/pulp](https://github.com/coin-or/pulp) - Linear programming for resource optimization

**NPM Packages**:
- `resource-scheduler` - Resource scheduling algorithms
- `optimization-js` - Optimization algorithms for JavaScript
- `linear-algebra` - Matrix operations for resource leveling

**Standards & Documentation**:
- PMI Practice Standard for Scheduling (Resource Leveling)
- [Resource Leveling Algorithms](https://www.sciencedirect.com/topics/engineering/resource-leveling)

---

### SK-004: EVM Calculator Skill

**GitHub Repositories**:
- [burndown-chart/burndown](https://github.com/tomgi/burndown) - Burn-down charts (related visualization)
- [apache/commons-math](https://github.com/apache/commons-math) - Math library for statistical calculations
- [simple-statistics/simple-statistics](https://github.com/simple-statistics/simple-statistics) - Statistics for trend analysis

**NPM Packages**:
- `simple-statistics` - Statistical calculations for EVM indices
- `regression` - Regression analysis for forecasting
- `chart.js` - S-curve visualization

**Standards & Documentation**:
- [ANSI/EIA-748 Earned Value Management Systems](https://www.ndia.org/divisions/ipmd/division-guides-and-resources)
- [PMI Practice Standard for Earned Value Management](https://www.pmi.org/pmbok-guide-standards/practice-guides/earned-value)
- [DOD EVM Implementation Guide](https://www.acq.osd.mil/evm/)
- [GAO Cost Estimating and Assessment Guide](https://www.gao.gov/products/gao-20-195g)

---

### SK-005: Agile Metrics Calculator Skill

**GitHub Repositories**:
- [actionhero/actionhero-metrics](https://github.com/actionhero/actionhero) - Metrics collection patterns
- [jira-agile-metrics/jira-agile-metrics](https://github.com/DeloitteDigitalUK/jira-agile-metrics) - Extract Agile metrics from Jira
- [hedgecock/agile-toolbox](https://github.com/hedgehog/agile-toolbox) - Agile tools and metrics
- [fokkezb/ti-velocity](https://github.com/FokkeZB/ti-velocity) - Velocity calculation examples
- [monte-carlo-bot/monte-carlo-bot](https://github.com/FocusedObjective/FocusedObjective.Resources) - Monte Carlo forecasting

**NPM Packages**:
- `simple-statistics` - Statistical analysis for velocity trends
- `moving-average` - Running average calculations
- `probability-distributions` - Monte Carlo simulation support

**Standards & Documentation**:
- [Scrum Guide](https://scrumguides.org/)
- [Kanban Guide](https://www.agilealliance.org/glossary/kanban/)
- [Actionable Agile Metrics Book Resources](https://actionableagile.com/)

---

### SK-006: Risk Register Manager Skill

**GitHub Repositories**:
- [OWASP/risk-assessment-framework](https://github.com/OWASP/risk-assessment-framework) - Risk assessment tools
- [DefinitelyTyped/types](https://github.com/DefinitelyTyped/DefinitelyTyped) - TypeScript definitions for risk types
- [monte-carlo-simulation/montecarlo](https://github.com/mdeanda/monte-carlo) - Monte Carlo simulation
- [frappe/charts](https://github.com/frappe/charts) - Heat map visualization for risk matrices
- [elastic/eui](https://github.com/elastic/eui) - UI components for dashboards

**NPM Packages**:
- `mathjs` - EMV and probability calculations
- `monte-carlo` - Risk simulation
- `heatmap.js` - Risk heat map visualization

**Standards & Documentation**:
- [ISO 31000 Risk Management](https://www.iso.org/iso-31000-risk-management.html)
- [PMI Practice Standard for Project Risk Management](https://www.pmi.org/pmbok-guide-standards/practice-guides/risk)
- [COSO ERM Framework](https://www.coso.org/guidance-erm)

---

### SK-007: WBS Generator Skill

**GitHub Repositories**:
- [xmindltd/xmind-sdk-js](https://github.com/nicklockwood/xmind-sdk-js) - Mind mapping SDK (WBS visualization)
- [markmap/markmap](https://github.com/markmap/markmap) - Markdown to mind map (hierarchical visualization)
- [jgraph/mxgraph](https://github.com/jgraph/mxgraph) - Diagram library for tree structures
- [d3/d3-hierarchy](https://github.com/d3/d3-hierarchy) - Hierarchical data visualization

**NPM Packages**:
- `d3-hierarchy` - Tree structure visualization
- `vis-network` - Network and tree diagrams
- `markdown-it` - WBS to markdown export

**Standards & Documentation**:
- [PMI Practice Standard for Work Breakdown Structures](https://www.pmi.org/pmbok-guide-standards/practice-guides/wbs)
- [MIL-HDBK-881 WBS Standard](https://www.acq.osd.mil/asda/se/docs/MIL-HDBK-881.pdf)

---

### SK-008: Stakeholder Matrix Generator Skill

**GitHub Repositories**:
- [vasturiano/force-graph](https://github.com/vasturiano/force-graph) - Network visualization for influence mapping
- [cytoscape/cytoscape.js](https://github.com/cytoscape/cytoscape.js) - Graph theory library for stakeholder networks
- [jacomyal/sigma.js](https://github.com/jacomyal/sigma.js) - Network visualization
- [plotly/plotly.js](https://github.com/plotly/plotly.js) - Scatter plots for power-interest grids

**NPM Packages**:
- `cytoscape` - Network analysis and visualization
- `sigma` - Network display
- `chart.js` - Matrix chart visualization

**Standards & Documentation**:
- [PMI Stakeholder Engagement Guide](https://www.pmi.org/pmbok-guide-standards/foundational/stakeholder-engagement)
- Mitchell-Agle-Wood Stakeholder Salience Model (Academy of Management Review)
- RACI Matrix standards

---

### SK-009: NPV/IRR Calculator Skill

**GitHub Repositories**:
- [formulajs/formulajs](https://github.com/formulajs/formulajs) - Excel-compatible financial functions
- [ebradbury/npv](https://github.com/ebradbury/npv-irr) - NPV/IRR calculations
- [trekhleb/javascript-algorithms](https://github.com/trekhleb/javascript-algorithms) - Algorithm implementations
- [financejs/financial](https://github.com/lmammino/financial) - Financial calculations library

**NPM Packages**:
- `financial` - NPV, IRR, MIRR calculations
- `formulajs` - Excel-compatible financial formulas
- `node-irr` - Internal rate of return calculation

**Standards & Documentation**:
- [CFA Institute Financial Analysis](https://www.cfainstitute.org/)
- [AACE Cost Engineering Standards](https://web.aacei.org/resources/professional-guidance)
- [PMI Business Analysis Guide](https://www.pmi.org/pmbok-guide-standards/foundational/business-analysis)

---

### SK-010: Sprint Planning Calculator Skill

**GitHub Repositories**:
- [planning-poker/planning-poker](https://github.com/Agile-Product-Management/planning-poker) - Planning poker implementations
- [jira-agile-metrics/jira-agile-metrics](https://github.com/DeloitteDigitalUK/jira-agile-metrics) - Agile metrics from Jira
- [scrum-poker/scrum-poker-planning](https://github.com/nicklockwood/planning-poker-for-slack) - Planning poker tools

**NPM Packages**:
- `planning-poker` - Estimation support
- `simple-statistics` - Capacity calculations

**Standards & Documentation**:
- [Scrum Guide - Sprint Planning](https://scrumguides.org/)
- [SAFe PI Planning](https://www.scaledagileframework.com/pi-planning/)
- Mike Cohn's Agile Estimation Books

---

### SK-011: Benefits Tracking Dashboard Skill

**GitHub Repositories**:
- [grafana/grafana](https://github.com/grafana/grafana) - Dashboard and visualization
- [elastic/kibana](https://github.com/elastic/kibana) - Analytics and visualization
- [metabase/metabase](https://github.com/metabase/metabase) - Business intelligence dashboards
- [apache/superset](https://github.com/apache/superset) - Data visualization platform

**NPM Packages**:
- `chart.js` - Chart components
- `d3` - Data visualization
- `react-dashboard` - Dashboard frameworks

**Standards & Documentation**:
- [Managing Successful Programmes (MSP)](https://www.axelos.com/certifications/propath/msp-702-programme-management)
- [PMI Benefits Realization Management](https://www.pmi.org/pmbok-guide-standards/practice-guides/benefits-realization)
- [APMG Benefits Management Guide](https://www.apmg-international.com/)

---

### SK-012: Change Request Analyzer Skill

**GitHub Repositories**:
- [git/git](https://github.com/git/git) - Change tracking patterns
- [conventional-changelog/conventional-changelog](https://github.com/conventional-changelog/conventional-changelog) - Change documentation
- [workflow/workflow](https://github.com/temporalio/temporal) - Workflow automation patterns

**NPM Packages**:
- `workflow-js` - Workflow state management
- `state-machine` - State machine for change status

**Standards & Documentation**:
- PMI PMBOK Change Control
- ITIL Change Management
- [IEEE 828 Configuration Management Standard](https://standards.ieee.org/)

---

### SK-013: Portfolio Optimization Skill

**GitHub Repositories**:
- [portfoliooptimizer/PortfolioOptimizer](https://github.com/nicklockwood/PortfolioOptimizer) - Portfolio optimization algorithms
- [google/or-tools](https://github.com/google/or-tools) - Constraint optimization
- [cvxpy/cvxpy](https://github.com/cvxpy/cvxpy) - Convex optimization (Python reference)
- [COIN-OR/Clp](https://github.com/coin-or/Clp) - Linear programming solver

**NPM Packages**:
- `glpk.js` - Linear programming solver
- `optimization-js` - Optimization algorithms
- `pareto-frontier` - Multi-criteria optimization

**Standards & Documentation**:
- [PMI Standard for Portfolio Management](https://www.pmi.org/pmbok-guide-standards/foundational/standard-for-portfolio-management)
- Modern Portfolio Theory (Markowitz)
- [Gartner PPM Research](https://www.gartner.com/en/information-technology/glossary/project-portfolio-management-ppm)

---

### SK-014: Issue Tracker Skill

**GitHub Repositories**:
- [linear/linear](https://github.com/linear/linear) - Issue tracking API patterns
- [gitlabhq/gitlabhq](https://github.com/gitlabhq/gitlabhq) - GitLab issue tracking
- [thedevs-network/kutt](https://github.com/thedevs-network/kutt) - API patterns for tracking

**NPM Packages**:
- `@octokit/rest` - GitHub issues API
- `jira.js` - Jira API client
- `linear-api` - Linear API client

**Standards & Documentation**:
- ITIL Incident Management
- [ISO 20000 Service Management](https://www.iso.org/iso-20000-it-service-management.html)

---

### SK-015: Retrospective Facilitator Skill

**GitHub Repositories**:
- [funretro/distributed](https://github.com/nicklockwood/funretro) - Retrospective board
- [retro-board/retro-board](https://github.com/antoinejaussoin/retro-board) - Retrospective board application
- [metroretro/metroretro](https://github.com/nicklockwood/metroretro) - Retrospective facilitation

**NPM Packages**:
- `socket.io` - Real-time collaboration
- `markdown-it` - Retrospective report generation

**Standards & Documentation**:
- [Agile Retrospectives Book](https://www.amazon.com/Agile-Retrospectives-Making-Teams-Great/dp/0977616649)
- [Retromat Activities](https://retromat.org/)
- [Fun Retrospectives](https://www.funretrospectives.com/)

---

### SK-016: Kanban Board Analyzer Skill

**GitHub Repositories**:
- [wekan/wekan](https://github.com/wekan/wekan) - Open source Kanban
- [RestyaPlatform/board](https://github.com/RestyaPlatform/board) - Kanban board
- [kanboard/kanboard](https://github.com/kanboard/kanboard) - Kanban project management
- [jira-agile-metrics/jira-agile-metrics](https://github.com/DeloitteDigitalUK/jira-agile-metrics) - Flow metrics

**NPM Packages**:
- `react-kanban` - Kanban board components
- `simple-statistics` - Flow metrics calculation

**Standards & Documentation**:
- [Kanban Guide for Scrum Teams](https://www.scrum.org/resources/kanban-guide-scrum-teams)
- [Essential Kanban Condensed](https://resources.kanban.university/)
- [Actionable Agile Metrics](https://actionableagile.com/)

---

### SK-017: Project Charter Generator Skill

**GitHub Repositories**:
- [pandoc/pandoc](https://github.com/jgm/pandoc) - Document conversion
- [Zettlr/Zettlr](https://github.com/Zettlr/Zettlr) - Markdown editor with export
- [mark-text/marktext](https://github.com/marktext/marktext) - Markdown document editor

**NPM Packages**:
- `docx` - Word document generation
- `pdfkit` - PDF generation
- `handlebars` - Template processing

**Standards & Documentation**:
- PMI PMBOK Project Charter
- PRINCE2 Project Brief
- [APM Body of Knowledge](https://www.apm.org.uk/body-of-knowledge/)

---

### SK-018: Lessons Learned Repository Skill

**GitHub Repositories**:
- [outline/outline](https://github.com/outline/outline) - Knowledge base
- [BookStackApp/BookStack](https://github.com/BookStackApp/BookStack) - Documentation and knowledge platform
- [requarks/wiki](https://github.com/requarks/wiki) - Wiki.js knowledge base

**NPM Packages**:
- `fuse.js` - Fuzzy search for lessons
- `elasticlunr` - Full-text search
- `typesense` - Search engine

**Standards & Documentation**:
- PMI Knowledge Management
- [Organizational Project Management Maturity Model (OPM3)](https://www.pmi.org/learning/library/opm3-your-organizations-project-management-7082)

---

### SK-019: Dependency Mapper Skill

**GitHub Repositories**:
- [cytoscape/cytoscape.js](https://github.com/cytoscape/cytoscape.js) - Network analysis
- [madge/madge](https://github.com/pahen/madge) - Dependency graph visualization
- [knsv/mermaid](https://github.com/mermaid-js/mermaid) - Diagram generation
- [dagrejs/dagre](https://github.com/dagrejs/dagre) - Directed graph layout

**NPM Packages**:
- `dagre` - Directed acyclic graph layout
- `graphlib` - Graph data structure
- `dependency-graph` - Dependency resolution

**Standards & Documentation**:
- SAFe Program Dependencies
- PMI Program Management Standard

---

### SK-020: Vendor Scorecard Skill

**GitHub Repositories**:
- [apache/superset](https://github.com/apache/superset) - Scorecard visualization
- [metabase/metabase](https://github.com/metabase/metabase) - Reporting dashboards

**NPM Packages**:
- `chart.js` - Scorecard visualization
- `datatables` - Data table display

**Standards & Documentation**:
- [ISM (Institute for Supply Management) Standards](https://www.ismworld.org/)
- [CIPS Procurement Standards](https://www.cips.org/)
- PMI PMBOK Procurement Management

---

## Agents References

### AG-001: Senior Project Manager Agent

**Knowledge Base Resources**:
- [PMBOK Guide 7th Edition](https://www.pmi.org/pmbok-guide-standards/foundational/pmbok)
- [PMI Standards Library](https://www.pmi.org/pmbok-guide-standards)
- [PRINCE2 Manual](https://www.axelos.com/certifications/propath/prince2-702-project-management)

**Training & Certification**:
- [PMI PMP Certification](https://www.pmi.org/certifications/project-management-pmp)
- [PMI PgMP Certification](https://www.pmi.org/certifications/program-management-pgmp)
- [PRINCE2 Certification](https://www.axelos.com/certifications/prince2)

**Community Resources**:
- [PMI Chapters](https://www.pmi.org/local-chapters)
- [ProjectManagement.com](https://www.projectmanagement.com/)
- [PM Stack Exchange](https://pm.stackexchange.com/)

---

### AG-002: Agile Coach Agent

**Knowledge Base Resources**:
- [Scrum Guide](https://scrumguides.org/)
- [SAFe Framework](https://www.scaledagileframework.com/)
- [Kanban University Resources](https://resources.kanban.university/)

**Training & Certification**:
- [SAFe Program Consultant (SPC)](https://www.scaledagileframework.com/safe-program-consultant/)
- [ICAgile Certified Professional](https://www.icagile.com/)
- [Scrum Alliance CST](https://www.scrumalliance.org/get-certified/trainer-program)

**Community Resources**:
- [Agile Alliance](https://www.agilealliance.org/)
- [Scrum.org Community](https://www.scrum.org/resources)
- [LeSS (Large Scale Scrum)](https://less.works/)

---

### AG-003: Cost Engineer Agent

**Knowledge Base Resources**:
- [AACE International Recommended Practices](https://web.aacei.org/resources/recommended-practices)
- [GAO Cost Estimating Guide](https://www.gao.gov/products/gao-20-195g)

**Training & Certification**:
- [AACE Certified Cost Professional (CCP)](https://web.aacei.org/certification/certifications-offered/ccp)
- [AACE Earned Value Professional (EVP)](https://web.aacei.org/certification/certifications-offered/evp)

**Community Resources**:
- [AACE International](https://web.aacei.org/)
- [Society of Cost Estimating and Analysis](https://www.iceaaonline.com/)

---

### AG-004: Schedule Analyst Agent

**Knowledge Base Resources**:
- [DCMA 14-Point Assessment](https://www.dcma.mil/Policy-Guidance/)
- [GAO Schedule Assessment Guide](https://www.gao.gov/products/gao-16-89g)

**Training & Certification**:
- [AACE Planning & Scheduling Professional (PSP)](https://web.aacei.org/certification/certifications-offered/psp)
- [PMI Scheduling Professional (PMI-SP)](https://www.pmi.org/certifications/scheduling-professional-sp)

**Community Resources**:
- [AACE International](https://web.aacei.org/)
- [Guild of Project Controls](https://www.planningplanet.com/)

---

### AG-005: Risk Manager Agent

**Knowledge Base Resources**:
- [ISO 31000:2018 Risk Management](https://www.iso.org/iso-31000-risk-management.html)
- [PMI Practice Standard for Project Risk Management](https://www.pmi.org/pmbok-guide-standards/practice-guides/risk)
- [COSO ERM Framework](https://www.coso.org/guidance-erm)

**Training & Certification**:
- [PMI Risk Management Professional (PMI-RMP)](https://www.pmi.org/certifications/risk-management-professional-rmp)
- [IRM Certified Risk Management Professional](https://www.theirm.org/)

**Community Resources**:
- [Institute of Risk Management](https://www.theirm.org/)
- [RIMS (Risk Management Society)](https://www.rims.org/)

---

### AG-006: Portfolio Manager Agent

**Knowledge Base Resources**:
- [PMI Standard for Portfolio Management](https://www.pmi.org/pmbok-guide-standards/foundational/standard-for-portfolio-management)
- [MoP (Management of Portfolios)](https://www.axelos.com/certifications/propath/mop-portfolio-management)

**Training & Certification**:
- [PMI Portfolio Management Professional (PfMP)](https://www.pmi.org/certifications/portfolio-management-pfmp)
- [MoP Certification](https://www.axelos.com/certifications/propath/mop-portfolio-management)

**Community Resources**:
- [PMI Portfolio Management Community](https://www.pmi.org/learning/thought-leadership/portfolio)
- [Gartner PPM Research](https://www.gartner.com/en/information-technology/glossary/project-portfolio-management-ppm)

---

### AG-007: Scrum Master Agent

**Knowledge Base Resources**:
- [Scrum Guide](https://scrumguides.org/)
- [Scrum Patterns](https://scrumbook.org/)

**Training & Certification**:
- [Scrum.org Professional Scrum Master (PSM)](https://www.scrum.org/professional-scrum-certifications/professional-scrum-master-assessments)
- [Scrum Alliance Certified Scrum Master (CSM)](https://www.scrumalliance.org/get-certified/scrum-master-track/certified-scrummaster)
- [Advanced Certified Scrum Master (A-CSM)](https://www.scrumalliance.org/get-certified/scrum-master-track/advanced-certified-scrummaster)

**Community Resources**:
- [Scrum.org Community](https://www.scrum.org/resources)
- [Scrum Alliance Community](https://www.scrumalliance.org/community)

---

### AG-008: Benefits Realization Manager Agent

**Knowledge Base Resources**:
- [MSP (Managing Successful Programmes)](https://www.axelos.com/certifications/propath/msp-702-programme-management)
- [PMI Benefits Realization Management Guide](https://www.pmi.org/pmbok-guide-standards/practice-guides/benefits-realization)

**Training & Certification**:
- [MSP Practitioner Certification](https://www.axelos.com/certifications/propath/msp-702-programme-management)
- [APMG Benefits Management Certification](https://www.apmg-international.com/)

**Community Resources**:
- [AXELOS Best Practice Community](https://www.axelos.com/community)

---

### AG-009: Change Control Manager Agent

**Knowledge Base Resources**:
- [ITIL Change Management](https://www.axelos.com/certifications/itil-service-management)
- [IEEE 828 Configuration Management](https://standards.ieee.org/)
- [CMMI Configuration Management](https://cmmiinstitute.com/)

**Training & Certification**:
- [ITIL Foundation and Practitioner](https://www.axelos.com/certifications/itil-service-management)
- [CMMI Certification](https://cmmiinstitute.com/)

**Community Resources**:
- [ITIL Community](https://www.axelos.com/community)
- [Configuration Management Community](https://www.cmcrossroads.com/)

---

### AG-010: Program Manager Agent

**Knowledge Base Resources**:
- [PMI Standard for Program Management](https://www.pmi.org/pmbok-guide-standards/foundational/program-management)
- [MSP (Managing Successful Programmes)](https://www.axelos.com/certifications/propath/msp-702-programme-management)

**Training & Certification**:
- [PMI Program Management Professional (PgMP)](https://www.pmi.org/certifications/program-management-pgmp)
- [MSP Certification](https://www.axelos.com/certifications/propath/msp-702-programme-management)

**Community Resources**:
- [PMI Program Management Community](https://www.pmi.org/learning/thought-leadership/program)

---

### AG-011: Procurement Manager Agent

**Knowledge Base Resources**:
- [PMBOK Procurement Management](https://www.pmi.org/pmbok-guide-standards/foundational/pmbok)
- [CIPS Procurement Standards](https://www.cips.org/)
- [ISM Body of Knowledge](https://www.ismworld.org/)

**Training & Certification**:
- [CIPS Certification](https://www.cips.org/qualifications-and-training)
- [ISM CPSM Certification](https://www.ismworld.org/certification-and-training/certification/)

**Community Resources**:
- [CIPS Community](https://www.cips.org/)
- [ISM Community](https://www.ismworld.org/)

---

### AG-012: Quality Manager Agent

**Knowledge Base Resources**:
- [ASQ Body of Knowledge](https://asq.org/quality-resources)
- [ISO 9001 Quality Management](https://www.iso.org/iso-9001-quality-management.html)
- [Six Sigma DMAIC](https://www.isixsigma.com/)

**Training & Certification**:
- [ASQ Certified Quality Manager (CQM)](https://asq.org/cert/quality-manager)
- [Six Sigma Black Belt](https://www.isixsigma.com/certification/)
- [Lean Six Sigma Certification](https://www.iassc.org/)

**Community Resources**:
- [ASQ Community](https://asq.org/)
- [iSixSigma Community](https://www.isixsigma.com/)

---

### AG-013: Stakeholder Engagement Lead Agent

**Knowledge Base Resources**:
- [PMI Stakeholder Engagement Guide](https://www.pmi.org/pmbok-guide-standards/foundational/stakeholder-engagement)
- [IAP2 Stakeholder Engagement Spectrum](https://www.iap2.org/)

**Training & Certification**:
- [PMI Stakeholder Engagement Training](https://www.pmi.org/learning)
- [IAP2 Certification](https://www.iap2.org/)

**Community Resources**:
- [IAP2 Community](https://www.iap2.org/)
- [Change Management Institute](https://www.change-management-institute.com/)

---

### AG-014: EVM Analyst Agent

**Knowledge Base Resources**:
- [ANSI/EIA-748 Standard](https://www.ndia.org/divisions/ipmd/division-guides-and-resources)
- [DOD EVM Implementation Guide](https://www.acq.osd.mil/evm/)
- [PMI Earned Value Practice Standard](https://www.pmi.org/pmbok-guide-standards/practice-guides/earned-value)

**Training & Certification**:
- [AACE Earned Value Professional (EVP)](https://web.aacei.org/certification/certifications-offered/evp)
- [PMI Scheduling Professional](https://www.pmi.org/certifications/scheduling-professional-sp)

**Community Resources**:
- [NDIA IPMD](https://www.ndia.org/divisions/ipmd)
- [AACE International](https://web.aacei.org/)

---

### AG-015: Resource Manager Agent

**Knowledge Base Resources**:
- [PMI Resource Management](https://www.pmi.org/pmbok-guide-standards/foundational/pmbok)
- [SHRM HR Standards](https://www.shrm.org/)

**Training & Certification**:
- [SHRM Certification](https://www.shrm.org/certification)
- [HRCI Certification](https://www.hrci.org/)

**Community Resources**:
- [SHRM Community](https://www.shrm.org/)
- [PMI Community](https://www.pmi.org/)

---

## MCP Server References

### Project Management Tool Integrations

| MCP Server | Description | Repository/Source |
|------------|-------------|-------------------|
| Jira MCP | Jira Cloud integration for issue and project tracking | [atlassian-labs/mcp-jira](https://github.com/atlassian-labs/mcp-jira) |
| Azure DevOps MCP | Azure Boards, Pipelines, Repos integration | [microsoft/mcp-azure-devops](https://github.com/microsoft/mcp-azure-devops) |
| GitHub Projects MCP | GitHub Projects and Issues integration | [github/mcp-github](https://github.com/github/mcp-github) |
| Linear MCP | Linear issue tracking integration | [linear/mcp-linear](https://github.com/linear/mcp-linear) |
| Asana MCP | Asana project management integration | Community implementation |
| Monday.com MCP | Monday.com workspace integration | Community implementation |
| Smartsheet MCP | Smartsheet project sheets integration | Community implementation |
| MS Project MCP | Microsoft Project integration | Community implementation |

### Scheduling Tool Integrations

| MCP Server | Description | Repository/Source |
|------------|-------------|-------------------|
| Google Calendar MCP | Calendar and scheduling integration | [anthropics/google-calendar-mcp](https://github.com/anthropics/google-calendar-mcp) |
| Microsoft 365 MCP | Outlook calendar and Planner | [microsoft/mcp-m365](https://github.com/microsoft/mcp-m365) |
| Calendly MCP | Meeting scheduling integration | Community implementation |

### Communication Tool Integrations

| MCP Server | Description | Repository/Source |
|------------|-------------|-------------------|
| Slack MCP | Slack workspace integration | [anthropics/slack-mcp](https://github.com/anthropics/slack-mcp) |
| Microsoft Teams MCP | Teams channels and messaging | [microsoft/mcp-teams](https://github.com/microsoft/mcp-teams) |
| Confluence MCP | Confluence documentation integration | [atlassian-labs/mcp-confluence](https://github.com/atlassian-labs/mcp-confluence) |

### Analytics and Reporting Integrations

| MCP Server | Description | Repository/Source |
|------------|-------------|-------------------|
| Tableau MCP | Tableau analytics integration | Community implementation |
| Power BI MCP | Power BI reporting integration | [microsoft/mcp-powerbi](https://github.com/microsoft/mcp-powerbi) |
| Looker MCP | Looker analytics integration | Community implementation |

### Financial Tool Integrations

| MCP Server | Description | Repository/Source |
|------------|-------------|-------------------|
| QuickBooks MCP | QuickBooks financial integration | Community implementation |
| SAP MCP | SAP ERP integration | Community implementation |
| Oracle MCP | Oracle ERP integration | Community implementation |

---

## Community Resources

### Professional Organizations

| Organization | Focus Area | Website |
|--------------|------------|---------|
| PMI | Project Management | [pmi.org](https://www.pmi.org/) |
| Scrum Alliance | Agile/Scrum | [scrumalliance.org](https://www.scrumalliance.org/) |
| Scrum.org | Agile/Scrum | [scrum.org](https://www.scrum.org/) |
| Agile Alliance | Agile Methodologies | [agilealliance.org](https://www.agilealliance.org/) |
| AACE International | Cost Engineering | [aacei.org](https://web.aacei.org/) |
| AXELOS | PRINCE2, MSP, MoP | [axelos.com](https://www.axelos.com/) |
| ASQ | Quality Management | [asq.org](https://asq.org/) |
| IRM | Risk Management | [theirm.org](https://www.theirm.org/) |
| SAFe | Scaled Agile | [scaledagileframework.com](https://www.scaledagileframework.com/) |

### Online Communities

| Community | Focus Area | URL |
|-----------|------------|-----|
| PM Stack Exchange | Project Management Q&A | [pm.stackexchange.com](https://pm.stackexchange.com/) |
| ProjectManagement.com | PM Community | [projectmanagement.com](https://www.projectmanagement.com/) |
| Reddit r/projectmanagement | PM Discussion | [reddit.com/r/projectmanagement](https://www.reddit.com/r/projectmanagement/) |
| Reddit r/agile | Agile Discussion | [reddit.com/r/agile](https://www.reddit.com/r/agile/) |
| Planning Planet | Scheduling Community | [planningplanet.com](https://www.planningplanet.com/) |
| iSixSigma | Quality/Six Sigma | [isixsigma.com](https://www.isixsigma.com/) |

### Open Source Project Management Tools

| Tool | Description | Repository |
|------|-------------|------------|
| OpenProject | Web-based PM software | [github.com/opf/openproject](https://github.com/opf/openproject) |
| Taiga | Agile project management | [github.com/taigaio/taiga-back](https://github.com/taigaio/taiga-back) |
| Wekan | Kanban board | [github.com/wekan/wekan](https://github.com/wekan/wekan) |
| Kanboard | Kanban PM | [github.com/kanboard/kanboard](https://github.com/kanboard/kanboard) |
| Leantime | Project management | [github.com/Leantime/leantime](https://github.com/Leantime/leantime) |
| Restyaboard | Kanban/Scrum | [github.com/RestyaPlatform/board](https://github.com/RestyaPlatform/board) |
| ProjectLibre | MS Project alternative | [github.com/nicklockwood/ProjectLibre](https://sourceforge.net/projects/projectlibre/) |
| GanttProject | Gantt chart tool | [github.com/nicklockwood/ganttproject](https://github.com/nicklockwood/ganttproject) |
| TaskJuggler | Project scheduling | [github.com/taskjuggler/TaskJuggler](https://github.com/taskjuggler/TaskJuggler) |

### Books and Publications

| Title | Author | Focus Area |
|-------|--------|------------|
| PMBOK Guide 7th Edition | PMI | Project Management |
| Agile Estimating and Planning | Mike Cohn | Agile |
| Actionable Agile Metrics | Daniel Vacanti | Kanban Metrics |
| Agile Retrospectives | Esther Derby, Diana Larsen | Agile |
| Managing Successful Programmes | AXELOS | Programme Management |
| The Standard for Portfolio Management | PMI | Portfolio Management |
| Practice Standard for Earned Value Management | PMI | EVM |
| ISO 31000 Risk Management Guidelines | ISO | Risk Management |
| Succeeding with Agile | Mike Cohn | Agile Transformation |
| SAFe Reference Guide | Scaled Agile | SAFe Framework |

---

## Implementation Guidance

### Priority Implementation Order

Based on the skills-agents-backlog.md implementation priority:

#### Phase 1: Critical Skills (High Impact)
1. **SK-004**: EVM Calculator - Use `formulajs` and `simple-statistics`
2. **SK-009**: NPV/IRR Calculator - Use `financial` NPM package
3. **SK-005**: Agile Metrics Calculator - Use `simple-statistics` and `probability-distributions`
4. **SK-006**: Risk Register Manager - Use `mathjs` and visualization libraries

#### Phase 2: Critical Agents (High Impact)
1. **AG-001**: Senior Project Manager - Build knowledge base from PMBOK, PRINCE2
2. **AG-003**: Cost Engineer - Integrate AACE recommended practices
3. **AG-006**: Portfolio Manager - Leverage PMI portfolio standards
4. **AG-002**: Agile Coach - Build from Scrum Guide, SAFe, Kanban

#### Recommended Technology Stack

**Visualization**:
- `chart.js` - Charts and dashboards
- `d3` - Complex data visualizations
- `mermaid` - Diagram generation
- `cytoscape.js` - Network diagrams

**Calculations**:
- `simple-statistics` - Statistical analysis
- `financial` - Financial calculations
- `mathjs` - Mathematical operations
- `optimization-js` - Optimization algorithms

**Document Generation**:
- `docx` - Word document generation
- `pdfkit` - PDF generation
- `handlebars` - Template processing
- `markdown-it` - Markdown processing

**Data Management**:
- `fuse.js` - Fuzzy search
- `graphlib` - Graph data structures
- `dagre` - Directed graph layout

### MCP Server Implementation Notes

When implementing MCP servers for project management tools:

1. **Authentication**: Most PM tools use OAuth 2.0 or API tokens
2. **Rate Limiting**: Implement request throttling for API compliance
3. **Caching**: Cache frequently accessed data (projects, users, statuses)
4. **Webhooks**: Leverage webhooks for real-time updates where available
5. **Error Handling**: Implement retry logic with exponential backoff

### Agent Knowledge Base Construction

For building agent knowledge bases:

1. **Standards Documentation**: Incorporate official PMI, PRINCE2, SAFe documentation
2. **Case Studies**: Include real-world examples and case studies
3. **Templates**: Provide standard templates for common artifacts
4. **Checklists**: Include quality checklists for each process area
5. **Best Practices**: Document industry best practices and anti-patterns

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Skills with References | 20 |
| Agents with References | 15 |
| GitHub Repositories Referenced | 75+ |
| NPM Packages Referenced | 50+ |
| MCP Servers Identified | 15+ |
| Professional Organizations | 10 |
| Online Communities | 6 |
| Open Source PM Tools | 9 |

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 5 - References Complete
**Next Step**: Implement skills and agents using referenced resources
