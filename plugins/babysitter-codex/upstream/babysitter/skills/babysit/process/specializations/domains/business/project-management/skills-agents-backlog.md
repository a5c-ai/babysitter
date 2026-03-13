# Project Management and Leadership - Skills and Agents Backlog

This document identifies specialized skills and agents (subagents) that could enhance the Project Management processes beyond general-purpose capabilities. These tools would provide domain-specific expertise, automation capabilities, and integration with specialized tooling.

---

## Table of Contents

1. [Overview](#overview)
2. [Skills Backlog](#skills-backlog)
3. [Agents Backlog](#agents-backlog)
4. [Process-to-Skill/Agent Mapping](#process-to-skillagent-mapping)
5. [Shared Candidates](#shared-candidates)
6. [Implementation Priority](#implementation-priority)

---

## Overview

### Current State
All implemented processes in this specialization currently use the `general-purpose` agent for task execution. While functional, this approach lacks domain-specific optimizations that specialized skills and agents could provide.

### Implemented Processes

#### Phase 3 (Standard Priority) - Implemented
1. `budget-development.js` - Budget Development and Cost Estimation using multiple estimation techniques
2. `earned-value-management.js` - Earned Value Management (EVM) for schedule and cost performance tracking
3. `agile-metrics-velocity.js` - Agile Metrics and Velocity Tracking for forecasting and continuous improvement
4. `portfolio-prioritization.js` - Portfolio Prioritization and Investment Analysis using strategic alignment and financial metrics
5. `benefits-realization.js` - Benefits Realization Management for tracking business outcomes

### Processes Backlog (25 Total)

#### Project Initiation
- Project Charter Development
- Stakeholder Analysis and Engagement Planning
- Business Case Development

#### Planning
- Work Breakdown Structure (WBS) Development
- Schedule Development and Critical Path Analysis
- Risk Planning and Assessment
- Resource Planning and Allocation
- Budget Development and Cost Estimation (Implemented)

#### Execution
- Team Formation and Development
- Status Reporting and Communication Management
- Quality Assurance Implementation
- Vendor and Procurement Management

#### Monitoring and Control
- Earned Value Management (EVM) (Implemented)
- Change Control Management
- Issue Management and Escalation
- Risk Monitoring and Response Execution

#### Agile
- Sprint Planning and Backlog Refinement
- Sprint Review and Demonstration
- Sprint Retrospective Facilitation
- Agile Metrics and Velocity Tracking (Implemented)
- Kanban Flow Optimization

#### Portfolio/Program Management
- Portfolio Prioritization and Investment Analysis (Implemented)
- Benefits Realization Management (Implemented)
- Program Dependency Management
- Lessons Learned and Knowledge Management

### Goals
- Provide deep expertise in PMI PMBOK, PRINCE2, and Agile methodologies
- Enable automated schedule analysis with critical path and resource leveling
- Reduce context-switching overhead for domain-specific tasks
- Improve quality of financial analysis and EVM calculations
- Integrate with project management, scheduling, and portfolio management tools

---

## Skills Backlog

### SK-001: Gantt Chart Generator Skill
**Slug**: `gantt-chart-generator`
**Category**: Schedule Management

**Description**: Generate and manage Gantt chart visualizations from schedule data with interactive timeline views.

**Capabilities**:
- Generate Gantt charts from task lists and dependencies
- Create milestone markers and summary tasks
- Display critical path highlighting
- Show resource assignments on tasks
- Generate baseline vs. actual comparison views
- Export to multiple formats (SVG, PNG, HTML, MS Project XML)
- Create timeline views at different zoom levels (day, week, month, quarter)
- Support for multiple baselines tracking

**Process Integration**:
- Schedule Development and Critical Path Analysis
- earned-value-management.js
- agile-metrics-velocity.js
- Program Dependency Management

**Dependencies**: Visualization libraries, date/time libraries, scheduling algorithms

---

### SK-002: Critical Path Analyzer Skill
**Slug**: `critical-path-analyzer`
**Category**: Schedule Management

**Description**: Perform critical path method (CPM) analysis with forward/backward pass calculations.

**Capabilities**:
- Calculate forward pass (early start/finish dates)
- Calculate backward pass (late start/finish dates)
- Determine total float and free float
- Identify critical path activities
- Detect near-critical paths (activities with low float)
- Perform what-if analysis for schedule compression
- Calculate schedule risk exposure
- Generate critical path reports and visualizations

**Process Integration**:
- Schedule Development and Critical Path Analysis
- earned-value-management.js
- Program Dependency Management
- Risk Planning and Assessment

**Dependencies**: Network diagram algorithms, scheduling mathematics

---

### SK-003: Resource Leveling Optimizer Skill
**Slug**: `resource-leveling`
**Category**: Resource Management

**Description**: Optimize resource allocation to eliminate overallocation while minimizing schedule impact.

**Capabilities**:
- Detect resource overallocation conflicts
- Apply resource leveling algorithms
- Calculate resource utilization histograms
- Perform resource smoothing (within float)
- Optimize multi-resource allocation
- Generate resource loading reports
- Support skills-based resource assignment
- Calculate resource costs by period

**Process Integration**:
- Resource Planning and Allocation
- budget-development.js
- portfolio-prioritization.js
- Team Formation and Development

**Dependencies**: Optimization algorithms, resource calendars

---

### SK-004: EVM Calculator Skill
**Slug**: `evm-calculator`
**Category**: Earned Value Management

**Description**: Automated calculation of all earned value metrics and forecasts.

**Capabilities**:
- Calculate Planned Value (PV/BCWS)
- Calculate Earned Value (EV/BCWP)
- Calculate Actual Cost (AC/ACWP)
- Calculate Schedule Variance (SV) and Cost Variance (CV)
- Calculate Schedule Performance Index (SPI) and Cost Performance Index (CPI)
- Calculate TCPI (To-Complete Performance Index)
- Calculate EAC using multiple methods (CPI, SPI*CPI, bottom-up)
- Calculate ETC and VAC
- Generate S-curve visualizations
- Perform trend analysis on indices

**Process Integration**:
- earned-value-management.js
- budget-development.js
- portfolio-prioritization.js
- Status Reporting and Communication Management

**Dependencies**: Financial calculations, time series analysis

---

### SK-005: Agile Metrics Calculator Skill
**Slug**: `agile-metrics-calculator`
**Category**: Agile Management

**Description**: Calculate and analyze Agile delivery metrics including velocity, burndown, and flow metrics.

**Capabilities**:
- Calculate team velocity with running averages
- Generate sprint burndown charts
- Generate release burnup charts
- Calculate cycle time and lead time
- Analyze throughput trends
- Calculate flow efficiency
- Generate cumulative flow diagrams
- Perform Monte Carlo forecasting
- Calculate predictability metrics

**Process Integration**:
- agile-metrics-velocity.js
- Sprint Planning and Backlog Refinement
- Kanban Flow Optimization
- Release Forecasting

**Dependencies**: Statistical analysis, time series, probability calculations

---

### SK-006: Risk Register Manager Skill
**Slug**: `risk-register-manager`
**Category**: Risk Management

**Description**: Build and maintain comprehensive project risk registers with quantitative analysis.

**Capabilities**:
- Create risk identification checklists by project type
- Calculate risk scores (probability x impact)
- Generate risk heat maps and bubble charts
- Perform qualitative risk analysis
- Perform quantitative risk analysis (Monte Carlo simulation)
- Calculate Expected Monetary Value (EMV)
- Track risk response plans and status
- Generate risk reports for governance
- Calculate contingency reserve requirements

**Process Integration**:
- Risk Planning and Assessment
- Risk Monitoring and Response Execution
- budget-development.js
- portfolio-prioritization.js

**Dependencies**: Probability analysis, Monte Carlo simulation, visualization

---

### SK-007: WBS Generator Skill
**Slug**: `wbs-generator`
**Category**: Scope Management

**Description**: Generate and validate Work Breakdown Structures with automated decomposition.

**Capabilities**:
- Create hierarchical WBS from scope statements
- Apply decomposition rules (8/80 rule)
- Generate WBS dictionaries
- Validate WBS completeness (100% rule)
- Create WBS numbering schemes
- Export to multiple formats (outline, tree diagram, table)
- Generate control accounts from WBS elements
- Link WBS to schedule activities

**Process Integration**:
- Work Breakdown Structure (WBS) Development
- budget-development.js
- earned-value-management.js
- Resource Planning and Allocation

**Dependencies**: Tree data structures, decomposition algorithms

---

### SK-008: Stakeholder Matrix Generator Skill
**Slug**: `stakeholder-matrix-generator`
**Category**: Stakeholder Management

**Description**: Generate stakeholder analysis matrices and engagement visualizations.

**Capabilities**:
- Generate Power-Interest grids with quadrant placement
- Create Mitchell-Agle-Wood Salience diagrams
- Build influence network visualizations
- Generate RACI matrices with validation
- Create stakeholder engagement assessment matrices
- Track engagement level changes over time
- Export to multiple formats (Markdown, CSV, image)
- Calculate stakeholder engagement index

**Process Integration**:
- Stakeholder Analysis and Engagement Planning
- Status Reporting and Communication Management
- Team Formation and Development
- Change Control Management

**Dependencies**: Visualization libraries, matrix templates

---

### SK-009: NPV/IRR Calculator Skill
**Slug**: `npv-irr-calculator`
**Category**: Financial Analysis

**Description**: Calculate project financial metrics for investment decision making.

**Capabilities**:
- Calculate Net Present Value (NPV) with configurable discount rates
- Calculate Internal Rate of Return (IRR)
- Calculate Modified Internal Rate of Return (MIRR)
- Calculate payback period (simple and discounted)
- Calculate Profitability Index (PI)
- Perform sensitivity analysis on assumptions
- Generate cash flow projections
- Calculate benefit-cost ratio
- Support multiple currency conversions

**Process Integration**:
- Business Case Development
- budget-development.js
- portfolio-prioritization.js
- benefits-realization.js

**Dependencies**: Financial mathematics, numerical computation

---

### SK-010: Sprint Planning Calculator Skill
**Slug**: `sprint-planning-calculator`
**Category**: Agile Management

**Description**: Calculate sprint capacity and support story point estimation.

**Capabilities**:
- Calculate team capacity based on availability
- Factor in focus factor for realistic planning
- Support Planning Poker estimation
- Calculate velocity-based sprint commitment
- Identify capacity risks and constraints
- Generate sprint goal recommendations
- Track commitment vs. completion ratios
- Support multiple estimation scales (Fibonacci, T-shirt)

**Process Integration**:
- Sprint Planning and Backlog Refinement
- agile-metrics-velocity.js
- Resource Planning and Allocation
- Team Formation and Development

**Dependencies**: Estimation algorithms, capacity calculations

---

### SK-011: Benefits Tracking Dashboard Skill
**Slug**: `benefits-tracking-dashboard`
**Category**: Benefits Management

**Description**: Track and visualize benefit realization against targets.

**Capabilities**:
- Define benefit metrics and KPIs
- Track benefit baseline vs. actual
- Generate benefit realization curves
- Calculate ROI and value delivered
- Track leading and lagging indicators
- Generate benefit owner reports
- Create benefit dependency visualizations
- Alert on benefit realization risks

**Process Integration**:
- benefits-realization.js
- portfolio-prioritization.js
- Business Case Development
- Lessons Learned and Knowledge Management

**Dependencies**: Dashboard visualization, KPI tracking, alerting

---

### SK-012: Change Request Analyzer Skill
**Slug**: `change-request-analyzer`
**Category**: Change Control

**Description**: Analyze change request impacts on scope, schedule, and cost.

**Capabilities**:
- Parse and categorize change requests
- Calculate schedule impact of changes
- Calculate cost impact of changes
- Assess scope impact (WBS affected elements)
- Generate impact assessment reports
- Track change request status workflow
- Calculate change request approval metrics
- Generate CCB presentation materials

**Process Integration**:
- Change Control Management
- earned-value-management.js
- Risk Monitoring and Response Execution
- Issue Management and Escalation

**Dependencies**: Impact analysis algorithms, workflow management

---

### SK-013: Portfolio Optimization Skill
**Slug**: `portfolio-optimization`
**Category**: Portfolio Management

**Description**: Optimize project portfolio selection under constraints using mathematical optimization.

**Capabilities**:
- Apply constraint-based optimization (budget, resources)
- Calculate efficient frontier for risk-return tradeoff
- Support multi-criteria project scoring
- Perform scenario analysis on portfolio
- Calculate portfolio-level NPV and risk
- Identify project interdependencies
- Generate what-if analysis for portfolio changes
- Support dynamic portfolio rebalancing

**Process Integration**:
- portfolio-prioritization.js
- Resource Planning and Allocation
- benefits-realization.js
- Business Case Development

**Dependencies**: Optimization algorithms, constraint solvers, financial models

---

### SK-014: Issue Tracker Skill
**Slug**: `issue-tracker`
**Category**: Issue Management

**Description**: Track and manage project issues with escalation and resolution workflows.

**Capabilities**:
- Create issue logs with categorization
- Define escalation paths and triggers
- Track issue aging and SLA compliance
- Perform root cause analysis (5 Whys, Fishbone)
- Link issues to risks and change requests
- Generate issue status reports
- Calculate issue resolution metrics
- Automate issue notifications and reminders

**Process Integration**:
- Issue Management and Escalation
- Risk Monitoring and Response Execution
- Status Reporting and Communication Management
- Quality Assurance Implementation

**Dependencies**: Workflow automation, notification systems, analytics

---

### SK-015: Retrospective Facilitator Skill
**Slug**: `retrospective-facilitator`
**Category**: Agile Management

**Description**: Generate retrospective formats and analyze improvement actions.

**Capabilities**:
- Generate retrospective agenda templates (Starfish, 4Ls, Sailboat)
- Create anonymous feedback collection mechanisms
- Categorize and prioritize improvement items
- Track action item completion across sprints
- Generate retrospective summary reports
- Analyze patterns across multiple retrospectives
- Calculate team improvement velocity
- Suggest retrospective format variations

**Process Integration**:
- Sprint Retrospective Facilitation
- agile-metrics-velocity.js
- Lessons Learned and Knowledge Management
- Team Formation and Development

**Dependencies**: Templates library, feedback collection, pattern analysis

---

### SK-016: Kanban Board Analyzer Skill
**Slug**: `kanban-analyzer`
**Category**: Agile Management

**Description**: Analyze Kanban flow metrics and identify bottlenecks.

**Capabilities**:
- Generate cumulative flow diagrams
- Calculate WIP (Work in Progress) statistics
- Identify bottlenecks and constraints
- Calculate throughput variability
- Analyze blocked time and wait states
- Generate aging work item reports
- Recommend WIP limit adjustments
- Calculate flow efficiency metrics

**Process Integration**:
- Kanban Flow Optimization
- agile-metrics-velocity.js
- Issue Management and Escalation
- Status Reporting and Communication Management

**Dependencies**: Flow metrics calculations, visualization, statistical analysis

---

### SK-017: Project Charter Generator Skill
**Slug**: `project-charter-generator`
**Category**: Project Initiation

**Description**: Generate project charter documents with comprehensive project definition elements.

**Capabilities**:
- Generate charter templates by project type
- Capture objectives, scope, and success criteria
- Define high-level milestones and deliverables
- Document assumptions, constraints, and risks
- Define roles and governance structure
- Generate authorization signature pages
- Create executive summary views
- Export to multiple formats (Markdown, Word, PDF)

**Process Integration**:
- Project Charter Development
- Business Case Development
- Stakeholder Analysis and Engagement Planning
- budget-development.js

**Dependencies**: Document templates, formatting libraries

---

### SK-018: Lessons Learned Repository Skill
**Slug**: `lessons-learned-repository`
**Category**: Knowledge Management

**Description**: Capture, categorize, and retrieve project lessons learned for organizational learning.

**Capabilities**:
- Capture lessons using structured templates
- Categorize by project phase, knowledge area, and outcome
- Search and retrieve relevant lessons for new projects
- Generate lessons learned reports
- Analyze patterns across project history
- Link lessons to specific project contexts
- Calculate lesson implementation rate
- Recommend applicable lessons for current projects

**Process Integration**:
- Lessons Learned and Knowledge Management
- Sprint Retrospective Facilitation
- benefits-realization.js
- Project Charter Development

**Dependencies**: Knowledge base, search/retrieval, pattern analysis

---

### SK-019: Dependency Mapper Skill
**Slug**: `dependency-mapper`
**Category**: Program Management

**Description**: Map and visualize cross-project dependencies in programs and portfolios.

**Capabilities**:
- Create dependency network diagrams
- Identify critical cross-project dependencies
- Calculate dependency risk exposure
- Detect circular dependencies
- Track dependency resolution status
- Generate program-level dependency reports
- Perform dependency impact analysis
- Recommend dependency mitigation strategies

**Process Integration**:
- Program Dependency Management
- portfolio-prioritization.js
- Schedule Development and Critical Path Analysis
- Risk Planning and Assessment

**Dependencies**: Network analysis, graph algorithms, visualization

---

### SK-020: Vendor Scorecard Skill
**Slug**: `vendor-scorecard`
**Category**: Procurement Management

**Description**: Evaluate and track vendor performance using scorecards and metrics.

**Capabilities**:
- Create vendor evaluation criteria and weights
- Generate vendor comparison matrices
- Track vendor performance metrics over time
- Calculate vendor risk scores
- Generate contract compliance reports
- Create vendor management dashboards
- Automate vendor performance alerts
- Generate procurement recommendations

**Process Integration**:
- Vendor and Procurement Management
- Risk Monitoring and Response Execution
- Quality Assurance Implementation
- Issue Management and Escalation

**Dependencies**: Scorecard templates, metrics tracking, contract management

---

## Agents Backlog

### AG-001: Senior Project Manager Agent
**Slug**: `senior-pm`
**Category**: Project Management

**Description**: PMP-certified Senior Project Manager with comprehensive PMBOK expertise.

**Expertise Areas**:
- PMI PMBOK 7th Edition knowledge areas and principles
- Project integration management
- Scope, schedule, cost, quality management
- Resource and communication management
- Risk and procurement management
- Stakeholder engagement management
- Tailoring approaches for different project types

**Persona**:
- Role: Senior Project Manager (PMP, PgMP)
- Experience: 15+ years project management
- Background: Large enterprise projects, IT and business transformation

**Process Integration**:
- All project initiation, planning, execution, and control processes
- Project Charter Development
- Schedule Development and Critical Path Analysis
- budget-development.js
- earned-value-management.js

---

### AG-002: Agile Coach Agent
**Slug**: `agile-coach`
**Category**: Agile Management

**Description**: SAFe-certified Agile Coach with expertise in Scrum, Kanban, and scaled Agile.

**Expertise Areas**:
- Scrum framework mastery
- Kanban method expertise
- SAFe (Scaled Agile Framework)
- Agile metrics and continuous improvement
- Team coaching and facilitation
- Agile transformation leadership
- DevOps integration with Agile

**Persona**:
- Role: Enterprise Agile Coach (SAFe SPC, CST)
- Experience: 12+ years Agile transformation
- Background: Software development, organizational change

**Process Integration**:
- Sprint Planning and Backlog Refinement
- Sprint Review and Demonstration
- Sprint Retrospective Facilitation
- agile-metrics-velocity.js
- Kanban Flow Optimization

---

### AG-003: Cost Engineer Agent
**Slug**: `cost-engineer`
**Category**: Cost Management

**Description**: Certified Cost Engineer with expertise in project cost estimation and control.

**Expertise Areas**:
- Cost estimation methodologies (analogous, parametric, bottom-up, three-point)
- Earned Value Management (EVM) analysis
- Cost baseline development
- Cash flow analysis and forecasting
- Contingency and reserve analysis
- Cost risk quantification
- Life cycle costing

**Persona**:
- Role: Senior Cost Engineer (CCP, EVP)
- Experience: 15+ years cost engineering
- Background: Construction, engineering, IT projects

**Process Integration**:
- budget-development.js (all phases)
- earned-value-management.js (all phases)
- Business Case Development
- Resource Planning and Allocation

---

### AG-004: Schedule Analyst Agent
**Slug**: `schedule-analyst`
**Category**: Schedule Management

**Description**: Expert schedule analyst with CPM, resource leveling, and schedule risk expertise.

**Expertise Areas**:
- Critical Path Method (CPM) analysis
- Precedence Diagramming Method (PDM)
- Resource-constrained scheduling
- Schedule compression techniques (crashing, fast-tracking)
- Schedule risk analysis (PERT, Monte Carlo)
- Multi-project scheduling
- Earned schedule analysis

**Persona**:
- Role: Master Scheduler / Planning & Scheduling Professional (PSP)
- Experience: 12+ years scheduling
- Background: Large programs, construction, aerospace

**Process Integration**:
- Schedule Development and Critical Path Analysis
- earned-value-management.js
- Resource Planning and Allocation
- Program Dependency Management

---

### AG-005: Risk Manager Agent
**Slug**: `risk-manager`
**Category**: Risk Management

**Description**: Certified Risk Manager with expertise in project risk identification, analysis, and response.

**Expertise Areas**:
- Risk identification techniques (brainstorming, Delphi, interviews)
- Qualitative risk analysis (probability-impact matrix)
- Quantitative risk analysis (Monte Carlo simulation, EMV)
- Risk response planning (avoid, transfer, mitigate, accept)
- Risk monitoring and control
- Opportunity management
- Risk governance and reporting

**Persona**:
- Role: Project Risk Manager (PMI-RMP)
- Experience: 12+ years risk management
- Background: Large programs, complex projects, insurance/finance

**Process Integration**:
- Risk Planning and Assessment
- Risk Monitoring and Response Execution
- budget-development.js (reserve analysis)
- portfolio-prioritization.js (portfolio risk)

---

### AG-006: Portfolio Manager Agent
**Slug**: `portfolio-manager`
**Category**: Portfolio Management

**Description**: PfMP-certified Portfolio Manager with strategic alignment and investment optimization expertise.

**Expertise Areas**:
- Portfolio strategic alignment
- Investment analysis (NPV, IRR, payback)
- Multi-criteria decision analysis
- Portfolio balancing and optimization
- Resource capacity management
- Portfolio governance
- Benefits realization management

**Persona**:
- Role: Portfolio Manager (PfMP)
- Experience: 15+ years portfolio management
- Background: IT portfolio, capital programs, executive leadership

**Process Integration**:
- portfolio-prioritization.js (all phases)
- benefits-realization.js (all phases)
- Business Case Development
- Program Dependency Management

---

### AG-007: Scrum Master Agent
**Slug**: `scrum-master`
**Category**: Agile Management

**Description**: Advanced Certified Scrum Master with team facilitation and impediment resolution expertise.

**Expertise Areas**:
- Scrum events facilitation
- Impediment identification and removal
- Team dynamics and coaching
- Servant leadership
- Agile metrics interpretation
- Continuous improvement facilitation
- Stakeholder collaboration

**Persona**:
- Role: Senior Scrum Master (A-CSM, PSM II)
- Experience: 8+ years Scrum Master
- Background: Software development teams, multi-team coordination

**Process Integration**:
- Sprint Planning and Backlog Refinement
- Sprint Review and Demonstration
- Sprint Retrospective Facilitation
- agile-metrics-velocity.js
- Team Formation and Development

---

### AG-008: Benefits Realization Manager Agent
**Slug**: `benefits-manager`
**Category**: Benefits Management

**Description**: Benefits management specialist with MSP and outcome tracking expertise.

**Expertise Areas**:
- Benefits identification and mapping
- Benefits measurement planning
- Benefits realization tracking
- Outcome chain management
- Benefits ownership assignment
- Dis-benefits management
- Benefits sustainment

**Persona**:
- Role: Benefits Realization Manager (MSP Practitioner)
- Experience: 10+ years benefits management
- Background: Large transformation programs, business change

**Process Integration**:
- benefits-realization.js (all phases)
- portfolio-prioritization.js (benefits analysis)
- Business Case Development
- Lessons Learned and Knowledge Management

---

### AG-009: Change Control Manager Agent
**Slug**: `change-control-manager`
**Category**: Change Control

**Description**: Expert in integrated change control and configuration management.

**Expertise Areas**:
- Change request assessment
- Impact analysis (scope, schedule, cost, quality)
- Change Control Board (CCB) facilitation
- Configuration management
- Baseline management
- Change documentation and tracking
- Integrated change control processes

**Persona**:
- Role: Change Control Manager / Configuration Manager
- Experience: 10+ years change control
- Background: IT systems, regulatory environments, engineering

**Process Integration**:
- Change Control Management
- earned-value-management.js (baseline changes)
- Issue Management and Escalation
- Quality Assurance Implementation

---

### AG-010: Program Manager Agent
**Slug**: `program-manager`
**Category**: Program Management

**Description**: PgMP-certified Program Manager with multi-project coordination expertise.

**Expertise Areas**:
- Program governance and structure
- Benefits management across projects
- Program stakeholder engagement
- Cross-project dependency management
- Program risk and issue management
- Resource optimization across projects
- Program performance measurement

**Persona**:
- Role: Senior Program Manager (PgMP)
- Experience: 15+ years program management
- Background: Large enterprise programs, transformations

**Process Integration**:
- Program Dependency Management
- portfolio-prioritization.js
- benefits-realization.js
- Stakeholder Analysis and Engagement Planning

---

### AG-011: Procurement Manager Agent
**Slug**: `procurement-manager`
**Category**: Procurement Management

**Description**: Expert in project procurement management and vendor relations.

**Expertise Areas**:
- Procurement planning and strategy
- Make-or-buy analysis
- Vendor selection and evaluation
- Contract types and negotiation
- Contract administration
- Vendor performance management
- Claims and dispute management

**Persona**:
- Role: Senior Procurement Manager / Contracts Manager
- Experience: 12+ years procurement
- Background: Large contracts, construction, IT services

**Process Integration**:
- Vendor and Procurement Management
- Risk Monitoring and Response Execution
- budget-development.js (vendor costs)
- Quality Assurance Implementation

---

### AG-012: Quality Manager Agent
**Slug**: `quality-manager`
**Category**: Quality Management

**Description**: Quality management professional with continuous improvement expertise.

**Expertise Areas**:
- Quality planning and standards
- Quality assurance processes
- Quality control and metrics
- Continuous improvement methodologies
- Six Sigma and Lean principles
- Acceptance criteria definition
- Quality audits and reviews

**Persona**:
- Role: Quality Manager (Six Sigma Black Belt, CQM)
- Experience: 12+ years quality management
- Background: Manufacturing, IT, process improvement

**Process Integration**:
- Quality Assurance Implementation
- Sprint Review and Demonstration
- Vendor and Procurement Management
- Lessons Learned and Knowledge Management

---

### AG-013: Stakeholder Engagement Lead Agent
**Slug**: `stakeholder-lead`
**Category**: Stakeholder Management

**Description**: Expert in stakeholder analysis, engagement, and communication.

**Expertise Areas**:
- Stakeholder identification and analysis
- Power-interest and salience modeling
- Engagement strategy development
- Communication planning and execution
- Stakeholder conflict resolution
- Executive communication
- Change communication

**Persona**:
- Role: Stakeholder Engagement Lead / Communications Manager
- Experience: 10+ years stakeholder management
- Background: Large transformations, organizational change

**Process Integration**:
- Stakeholder Analysis and Engagement Planning
- Status Reporting and Communication Management
- Team Formation and Development
- benefits-realization.js (benefit owners)

---

### AG-014: EVM Analyst Agent
**Slug**: `evm-analyst`
**Category**: Performance Measurement

**Description**: Earned Value Management specialist with performance analysis expertise.

**Expertise Areas**:
- EVM metrics calculation (PV, EV, AC, SV, CV, SPI, CPI)
- Forecasting (EAC, ETC, VAC, TCPI)
- Earned schedule analysis
- Variance analysis and reporting
- Performance trend analysis
- Root cause analysis for variances
- EVM compliance (ANSI/EIA-748)

**Persona**:
- Role: EVM Analyst (EVP certified)
- Experience: 10+ years earned value analysis
- Background: Government contracting, defense, aerospace

**Process Integration**:
- earned-value-management.js (all phases)
- budget-development.js (cost baseline)
- Status Reporting and Communication Management
- portfolio-prioritization.js

---

### AG-015: Resource Manager Agent
**Slug**: `resource-manager`
**Category**: Resource Management

**Description**: Expert in resource planning, allocation, and team development.

**Expertise Areas**:
- Resource capacity planning
- Skills-based resource allocation
- Resource leveling and optimization
- Team building and development
- Resource conflict resolution
- Matrix organization navigation
- Workforce planning

**Persona**:
- Role: Resource Manager / Workforce Planning Lead
- Experience: 12+ years resource management
- Background: Shared services, IT organizations, professional services

**Process Integration**:
- Resource Planning and Allocation
- Team Formation and Development
- portfolio-prioritization.js (resource constraints)
- agile-metrics-velocity.js (team capacity)

---

---

## Process-to-Skill/Agent Mapping

| Process File | Primary Skills | Primary Agents |
|-------------|---------------|----------------|
| budget-development.js | SK-004, SK-009, SK-007 | AG-003, AG-001 |
| earned-value-management.js | SK-004, SK-001, SK-002 | AG-014, AG-003, AG-004 |
| agile-metrics-velocity.js | SK-005, SK-010, SK-016 | AG-002, AG-007 |
| portfolio-prioritization.js | SK-009, SK-013, SK-006, SK-019 | AG-006, AG-010 |
| benefits-realization.js | SK-011, SK-009 | AG-008, AG-006 |
| Project Charter Development | SK-017, SK-008 | AG-001, AG-013 |
| Stakeholder Analysis | SK-008 | AG-013, AG-001 |
| Business Case Development | SK-009, SK-006 | AG-006, AG-003 |
| WBS Development | SK-007 | AG-001, AG-004 |
| Schedule Development | SK-001, SK-002, SK-003 | AG-004, AG-001 |
| Risk Planning | SK-006 | AG-005, AG-001 |
| Resource Planning | SK-003 | AG-015, AG-001 |
| Team Formation | SK-008, SK-003 | AG-015, AG-007 |
| Status Reporting | SK-001, SK-004 | AG-001, AG-014 |
| Quality Assurance | SK-014 | AG-012, AG-001 |
| Vendor Management | SK-020 | AG-011, AG-001 |
| Change Control | SK-012 | AG-009, AG-001 |
| Issue Management | SK-014 | AG-001, AG-009 |
| Risk Monitoring | SK-006 | AG-005, AG-001 |
| Sprint Planning | SK-010, SK-005 | AG-007, AG-002 |
| Sprint Review | SK-005 | AG-007, AG-002 |
| Sprint Retrospective | SK-015 | AG-007, AG-002 |
| Kanban Optimization | SK-016, SK-005 | AG-002 |
| Program Dependencies | SK-019, SK-002 | AG-010, AG-004 |
| Lessons Learned | SK-018 | AG-001, AG-012 |

---

## Shared Candidates

These skills and agents are strong candidates for extraction to a shared library as they apply across multiple specializations.

### Shared Skills

| ID | Skill | Potential Shared Specializations |
|----|-------|----------------------------------|
| SK-001 | Gantt Chart Generator | Software Development, Construction Management |
| SK-004 | EVM Calculator | DevOps/SRE, Engineering |
| SK-005 | Agile Metrics Calculator | Software Development, Product Management |
| SK-006 | Risk Register Manager | Business Analysis, Security Compliance |
| SK-008 | Stakeholder Matrix Generator | Business Analysis, Change Management |
| SK-009 | NPV/IRR Calculator | Business Analysis, Finance Accounting |
| SK-011 | Benefits Tracking Dashboard | Business Strategy, Product Management |
| SK-014 | Issue Tracker | Software Development, DevOps/SRE |
| SK-018 | Lessons Learned Repository | Business Analysis, Quality Management |
| SK-020 | Vendor Scorecard | Procurement, Vendor Management |

### Shared Agents

| ID | Agent | Potential Shared Specializations |
|----|-------|----------------------------------|
| AG-002 | Agile Coach | Software Development, Product Management |
| AG-003 | Cost Engineer | Business Analysis, Finance Accounting |
| AG-005 | Risk Manager | Business Analysis, Security Compliance |
| AG-007 | Scrum Master | Software Development, Product Management |
| AG-012 | Quality Manager | QA Testing Automation, DevOps/SRE |
| AG-013 | Stakeholder Engagement Lead | Business Analysis, Change Management |
| AG-014 | EVM Analyst | Engineering, Construction Management |

---

## Implementation Priority

### Phase 1: Critical Skills (High Impact)
1. **SK-004**: EVM Calculator - Foundation for earned value processes (implemented)
2. **SK-009**: NPV/IRR Calculator - Essential for portfolio and business case
3. **SK-005**: Agile Metrics Calculator - Core Agile tracking need (implemented)
4. **SK-006**: Risk Register Manager - Critical for all project planning

### Phase 2: Critical Agents (High Impact)
1. **AG-001**: Senior Project Manager - Highest process coverage
2. **AG-003**: Cost Engineer - Critical for budget and EVM
3. **AG-006**: Portfolio Manager - Essential for portfolio processes
4. **AG-002**: Agile Coach - Critical for Agile processes

### Phase 3: Schedule & Resource Management
1. **SK-001**: Gantt Chart Generator
2. **SK-002**: Critical Path Analyzer
3. **SK-003**: Resource Leveling Optimizer
4. **AG-004**: Schedule Analyst
5. **AG-015**: Resource Manager

### Phase 4: Governance & Control
1. **SK-008**: Stakeholder Matrix Generator
2. **SK-012**: Change Request Analyzer
3. **SK-014**: Issue Tracker
4. **AG-005**: Risk Manager
5. **AG-009**: Change Control Manager
6. **AG-013**: Stakeholder Engagement Lead

### Phase 5: Specialized Tools
1. **SK-007**: WBS Generator
2. **SK-010**: Sprint Planning Calculator
3. **SK-011**: Benefits Tracking Dashboard
4. **SK-013**: Portfolio Optimization
5. **SK-015**: Retrospective Facilitator
6. **SK-016**: Kanban Board Analyzer
7. **SK-017**: Project Charter Generator
8. **SK-018**: Lessons Learned Repository
9. **SK-019**: Dependency Mapper
10. **SK-020**: Vendor Scorecard
11. **AG-007**: Scrum Master
12. **AG-008**: Benefits Realization Manager
13. **AG-010**: Program Manager
14. **AG-011**: Procurement Manager
15. **AG-012**: Quality Manager
16. **AG-014**: EVM Analyst

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Skills Identified | 20 |
| Agents Identified | 15 |
| Shared Skill Candidates | 10 |
| Shared Agent Candidates | 7 |
| Implemented Processes | 5 |
| Total Processes (Backlog) | 25 |

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 4 - Skills and Agents Identified
**Next Step**: Phase 5 - Implement specialized skills and agents
