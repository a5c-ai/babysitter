# Entrepreneurship and Startup Processes - Skills and Agents Backlog

This document identifies specialized skills and agents (subagents) that could enhance the Entrepreneurship and Startup processes beyond general-purpose capabilities. These tools would provide domain-specific expertise, automation capabilities, and integration with specialized startup tooling.

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
All 25 implemented processes in this specialization currently use the `general-purpose` agent for task execution. While functional, this approach lacks domain-specific optimizations that specialized skills and agents could provide for startup-specific challenges.

### Implemented Processes

#### Idea Validation and Customer Discovery
1. `customer-discovery-interview.js` - Customer discovery following The Mom Test
2. `problem-solution-fit-validation.js` - Problem-solution fit validation
3. `market-sizing-analysis.js` - TAM/SAM/SOM market sizing
4. `competitive-landscape-mapping.js` - Competitive landscape analysis

#### Pitch Deck and Presentations
5. `investor-pitch-deck.js` - Investor pitch deck development
6. `demo-day-presentation.js` - Demo day presentation preparation
7. `board-meeting-presentation.js` - Board meeting presentations

#### Fundraising Processes
8. `pre-seed-fundraising.js` - Pre-seed/Seed fundraising
9. `series-a-fundraising.js` - Series A fundraising
10. `due-diligence-preparation.js` - Due diligence preparation
11. `investor-update-communication.js` - Investor update communications

#### Business Planning and Strategy
12. `business-model-canvas.js` - Business Model Canvas development
13. `financial-model-development.js` - Financial model building
14. `gtm-strategy-development.js` - Go-to-market strategy
15. `business-plan-document.js` - Business plan creation

#### Product-Market Fit
16. `mvp-definition-development.js` - MVP definition and development
17. `product-market-fit-assessment.js` - PMF assessment
18. `pivot-decision-framework.js` - Pivot or persevere decisions

#### Growth and Scaling
19. `traction-channel-identification.js` - Bullseye Framework traction channels
20. `growth-experiment-design.js` - Growth experiment design
21. `scaling-operations-playbook.js` - Scaling operations
22. `international-expansion-planning.js` - International expansion

#### Team and Culture
23. `founding-team-formation.js` - Co-founder evaluation and agreements
24. `startup-hiring-process.js` - Early-stage hiring
25. `startup-culture-definition.js` - Culture and values definition

### Goals
- Provide deep expertise in startup methodologies (Lean Startup, Customer Development)
- Enable automated market research and competitive intelligence
- Support investor pitch preparation and fundraising processes
- Improve quality of financial modeling and unit economics analysis
- Integrate with startup-specific tools (cap table, investor CRM, analytics)

---

## Skills Backlog

### SK-001: Business Model Canvas Generator Skill
**Slug**: `business-model-canvas`
**Category**: Business Planning

**Description**: Specialized skill for creating and iterating on Business Model Canvas and Lean Canvas documents.

**Capabilities**:
- Generate complete Business Model Canvas from inputs
- Apply Strategyzer methodology and best practices
- Identify assumption risks in each canvas block
- Create Lean Canvas variations for startups
- Map value propositions to customer segments
- Generate assumption testing priorities
- Track canvas iterations and changes
- Export to various visual formats

**Process Integration**:
- business-model-canvas.js
- problem-solution-fit-validation.js
- pivot-decision-framework.js
- financial-model-development.js

**Dependencies**: Canvas templates, visualization libraries

---

### SK-002: Pitch Deck Creator Skill
**Slug**: `pitch-deck-creator`
**Category**: Presentations

**Description**: Generate investor-ready pitch decks following proven frameworks.

**Capabilities**:
- Apply Sequoia/YC pitch deck templates
- Generate slide content from structured inputs
- Create compelling narrative arcs
- Produce visual design recommendations
- Generate presenter notes per slide
- Create appendix and backup slides
- Calculate optimal timing per slide
- Export to PowerPoint/Keynote/Google Slides format

**Process Integration**:
- investor-pitch-deck.js
- demo-day-presentation.js
- series-a-fundraising.js
- pre-seed-fundraising.js

**Dependencies**: Presentation templates, DocSend best practices

---

### SK-003: Market Sizing Calculator Skill
**Slug**: `market-sizing`
**Category**: Market Analysis

**Description**: Automated TAM/SAM/SOM calculations with methodology documentation.

**Capabilities**:
- Calculate Total Addressable Market (TAM)
- Calculate Serviceable Addressable Market (SAM)
- Calculate Serviceable Obtainable Market (SOM)
- Apply top-down and bottom-up methodologies
- Source and cite market data
- Generate market sizing narratives for investors
- Create market growth projections
- Validate market size assumptions

**Process Integration**:
- market-sizing-analysis.js
- investor-pitch-deck.js
- business-plan-document.js
- series-a-fundraising.js

**Dependencies**: Market data sources, industry reports

---

### SK-004: Unit Economics Calculator Skill
**Slug**: `unit-economics`
**Category**: Financial Analysis

**Description**: Calculate and analyze startup unit economics with SaaS/B2B/B2C models.

**Capabilities**:
- Calculate Customer Acquisition Cost (CAC)
- Calculate Customer Lifetime Value (LTV/CLV)
- Calculate LTV:CAC ratio with benchmarks
- Calculate payback period
- Model churn and retention impacts
- Calculate Net Revenue Retention (NRR)
- Generate cohort-based LTV analysis
- Compare to industry benchmarks

**Process Integration**:
- financial-model-development.js
- product-market-fit-assessment.js
- series-a-fundraising.js
- investor-pitch-deck.js

**Dependencies**: Financial formulas, benchmark databases

---

### SK-005: Financial Projection Model Skill
**Slug**: `financial-projections`
**Category**: Financial Planning

**Description**: Build comprehensive startup financial models with projections.

**Capabilities**:
- Generate 3-5 year revenue projections
- Model operating expenses and headcount
- Create cash flow and runway projections
- Build scenario analysis (base/bull/bear)
- Generate sensitivity analysis tables
- Calculate burn rate and runway
- Model funding round impacts
- Export to Excel/Google Sheets format

**Process Integration**:
- financial-model-development.js
- series-a-fundraising.js
- due-diligence-preparation.js
- investor-pitch-deck.js

**Dependencies**: Financial modeling templates, Excel generation

---

### SK-006: Competitor Analysis Skill
**Slug**: `competitor-analysis`
**Category**: Market Intelligence

**Description**: Deep competitive intelligence and market positioning analysis.

**Capabilities**:
- Analyze competitor websites and positioning
- Track competitor funding and announcements
- Generate feature comparison matrices
- Create competitive positioning maps
- Identify white space opportunities
- Monitor competitor pricing strategies
- Extract competitive advantages and moats
- Generate investor-ready competitive slides

**Process Integration**:
- competitive-landscape-mapping.js
- investor-pitch-deck.js
- gtm-strategy-development.js
- product-market-fit-assessment.js

**Dependencies**: Web scraping, news monitoring, Crunchbase API

---

### SK-007: Customer Interview Synthesis Skill
**Slug**: `interview-synthesis`
**Category**: Customer Discovery

**Description**: Synthesize customer discovery interviews into actionable insights.

**Capabilities**:
- Apply The Mom Test principles validation
- Extract patterns from interview transcripts
- Identify validated/invalidated hypotheses
- Calculate evidence confidence levels
- Generate insight summaries
- Create quote banks and evidence documentation
- Track hypothesis evolution over interviews
- Generate customer persona attributes

**Process Integration**:
- customer-discovery-interview.js
- problem-solution-fit-validation.js
- product-market-fit-assessment.js
- mvp-definition-development.js

**Dependencies**: NLP capabilities, interview templates

---

### SK-008: Term Sheet Analyzer Skill
**Slug**: `term-sheet-analyzer`
**Category**: Fundraising

**Description**: Analyze and compare venture capital term sheets.

**Capabilities**:
- Parse term sheet documents
- Explain term meanings in plain language
- Calculate dilution scenarios
- Compare multiple term sheets
- Identify founder-friendly vs. investor-friendly terms
- Flag unusual or aggressive provisions
- Generate negotiation recommendations
- Model cap table impacts

**Process Integration**:
- pre-seed-fundraising.js
- series-a-fundraising.js
- due-diligence-preparation.js
- founding-team-formation.js

**Dependencies**: Legal term databases, NVCA model documents

---

### SK-009: Cap Table Modeler Skill
**Slug**: `cap-table-model`
**Category**: Equity Management

**Description**: Model and manage startup cap tables through funding rounds.

**Capabilities**:
- Create pro-forma cap tables
- Model funding round dilution
- Calculate option pool impacts
- Generate waterfall analysis
- Model exit scenarios
- Track vesting schedules
- Generate investor ownership reports
- Export to Carta/Pulley format

**Process Integration**:
- pre-seed-fundraising.js
- series-a-fundraising.js
- founding-team-formation.js
- due-diligence-preparation.js

**Dependencies**: Cap table templates, dilution calculators

---

### SK-010: MVP Type Selector Skill
**Slug**: `mvp-selector`
**Category**: Product Development

**Description**: Select and design appropriate MVP types for hypothesis testing.

**Capabilities**:
- Evaluate MVP type options (concierge, Wizard of Oz, landing page, etc.)
- Match MVP types to hypotheses
- Estimate build vs. learning tradeoffs
- Generate MVP specifications
- Create build checklists
- Define success metrics per MVP type
- Plan iteration strategies
- Document MVP learnings framework

**Process Integration**:
- mvp-definition-development.js
- problem-solution-fit-validation.js
- pivot-decision-framework.js
- product-market-fit-assessment.js

**Dependencies**: MVP templates, Lean Startup methodology

---

### SK-011: PMF Survey Designer Skill
**Slug**: `pmf-survey`
**Category**: Validation

**Description**: Design and analyze Product-Market Fit surveys.

**Capabilities**:
- Generate Sean Ellis PMF survey
- Design follow-up questions
- Calculate PMF score (40% threshold)
- Segment responses by user type
- Identify "very disappointed" user patterns
- Generate improvement recommendations
- Track PMF trends over time
- Create NPS integration

**Process Integration**:
- product-market-fit-assessment.js
- mvp-definition-development.js
- pivot-decision-framework.js
- growth-experiment-design.js

**Dependencies**: Survey platforms, statistical analysis

---

### SK-012: Growth Experiment Designer Skill
**Slug**: `growth-experiments`
**Category**: Growth

**Description**: Design and plan growth experiments with statistical rigor.

**Capabilities**:
- Generate experiment hypotheses
- Apply ICE/RICE scoring frameworks
- Calculate sample size requirements
- Design A/B test variants
- Define success metrics and guardrails
- Plan experiment execution
- Analyze results statistically
- Document learnings and playbooks

**Process Integration**:
- growth-experiment-design.js
- traction-channel-identification.js
- product-market-fit-assessment.js
- scaling-operations-playbook.js

**Dependencies**: Statistical libraries, experimentation platforms

---

### SK-013: Traction Channel Evaluator Skill
**Slug**: `traction-channels`
**Category**: Growth

**Description**: Apply Bullseye Framework to identify and test traction channels.

**Capabilities**:
- Evaluate all 19 traction channels
- Rank channels by potential and cost
- Design channel tests
- Calculate channel economics
- Track channel performance
- Identify winning channels
- Generate channel playbooks
- Compare to similar company channels

**Process Integration**:
- traction-channel-identification.js
- growth-experiment-design.js
- gtm-strategy-development.js
- scaling-operations-playbook.js

**Dependencies**: Traction framework, channel benchmarks

---

### SK-014: Investor CRM Manager Skill
**Slug**: `investor-crm`
**Category**: Fundraising

**Description**: Manage investor pipeline and fundraising process.

**Capabilities**:
- Build target investor lists
- Track investor pipeline stages
- Map warm introduction paths
- Generate outreach templates
- Track meeting outcomes
- Calculate fundraise progress
- Generate investor reports
- Manage follow-up cadence

**Process Integration**:
- pre-seed-fundraising.js
- series-a-fundraising.js
- investor-update-communication.js
- demo-day-presentation.js

**Dependencies**: CRM templates, investor databases

---

### SK-015: Data Room Organizer Skill
**Slug**: `data-room`
**Category**: Due Diligence

**Description**: Organize and manage due diligence data rooms.

**Capabilities**:
- Generate data room structure
- Create document checklists
- Set up access controls
- Track document requests
- Generate document summaries
- Manage version control
- Create due diligence indices
- Track investor activity

**Process Integration**:
- due-diligence-preparation.js
- series-a-fundraising.js
- pre-seed-fundraising.js
- board-meeting-presentation.js

**Dependencies**: Data room templates, document management

---

### SK-016: Investor Update Generator Skill
**Slug**: `investor-updates`
**Category**: Investor Relations

**Description**: Generate structured investor update communications.

**Capabilities**:
- Apply YC investor update templates
- Generate metrics dashboards
- Create wins/challenges/asks format
- Track investor engagement
- Schedule update cadence
- Personalize for investor tiers
- Generate board materials
- Track investor responses

**Process Integration**:
- investor-update-communication.js
- board-meeting-presentation.js
- series-a-fundraising.js
- due-diligence-preparation.js

**Dependencies**: Email templates, metrics integration

---

### SK-017: Founders Agreement Generator Skill
**Slug**: `founders-agreement`
**Category**: Legal

**Description**: Generate and manage co-founder agreements and equity splits.

**Capabilities**:
- Generate founders agreement templates
- Design vesting schedules
- Document equity split rationale
- Create role and responsibility matrices
- Generate cliff and acceleration terms
- Track founder milestones
- Plan for departure scenarios
- Generate board resolutions

**Process Integration**:
- founding-team-formation.js
- due-diligence-preparation.js
- startup-culture-definition.js
- series-a-fundraising.js

**Dependencies**: Legal templates, vesting calculators

---

### SK-018: Startup Metrics Dashboard Skill
**Slug**: `startup-metrics`
**Category**: Analytics

**Description**: Build startup metrics dashboards with key KPIs.

**Capabilities**:
- Calculate AARRR pirate metrics
- Track North Star metrics
- Generate MRR/ARR dashboards
- Calculate growth rates
- Track runway and burn
- Create cohort visualizations
- Generate investor-ready reports
- Alert on metric thresholds

**Process Integration**:
- financial-model-development.js
- product-market-fit-assessment.js
- investor-update-communication.js
- growth-experiment-design.js

**Dependencies**: Analytics platforms, visualization libraries

---

### SK-019: GTM Strategy Designer Skill
**Slug**: `gtm-strategy`
**Category**: Launch

**Description**: Design go-to-market strategies for startup launches.

**Capabilities**:
- Define target customer segments
- Create positioning and messaging
- Design channel strategies
- Plan pricing approaches
- Create launch timelines
- Generate sales playbooks
- Design partnership strategies
- Plan geographic expansion

**Process Integration**:
- gtm-strategy-development.js
- product-market-fit-assessment.js
- scaling-operations-playbook.js
- international-expansion-planning.js

**Dependencies**: GTM frameworks, channel templates

---

### SK-020: Pivot Analyzer Skill
**Slug**: `pivot-analyzer`
**Category**: Strategy

**Description**: Analyze pivot decisions with evidence-based frameworks.

**Capabilities**:
- Compile validation evidence
- Score pivot signals
- Generate pivot alternatives
- Evaluate pivot options
- Calculate pivot costs
- Plan pivot execution
- Document pivot rationale
- Track post-pivot progress

**Process Integration**:
- pivot-decision-framework.js
- product-market-fit-assessment.js
- business-model-canvas.js
- mvp-definition-development.js

**Dependencies**: Lean Startup methodology, decision frameworks

---

---

## Agents Backlog

### AG-001: Startup Founder Coach Agent
**Slug**: `founder-coach`
**Category**: Mentorship

**Description**: Experienced startup founder providing strategic guidance and coaching.

**Expertise Areas**:
- First-time founder guidance
- Startup stage navigation
- Founder psychology and resilience
- Co-founder dynamics
- Work-life balance in startups
- Pivoting and perseverance

**Persona**:
- Role: Serial Entrepreneur / EIR
- Experience: 3+ successful exits
- Background: YC/Techstars alumni, angel investor

**Process Integration**:
- founding-team-formation.js (all phases)
- pivot-decision-framework.js (decision support)
- startup-culture-definition.js (culture guidance)
- business-model-canvas.js (business design)

---

### AG-002: Venture Capital Partner Agent
**Slug**: `vc-partner`
**Category**: Fundraising

**Description**: VC partner perspective for fundraising strategy and investor relations.

**Expertise Areas**:
- VC investment criteria and process
- Term sheet negotiation
- Board dynamics and governance
- Portfolio company best practices
- Fundraising timing and strategy
- Series A readiness assessment

**Persona**:
- Role: General Partner at Series A Fund
- Experience: 15+ years VC investing
- Background: Former founder, 50+ board seats

**Process Integration**:
- series-a-fundraising.js (all phases)
- pre-seed-fundraising.js (strategy phases)
- investor-pitch-deck.js (feedback)
- board-meeting-presentation.js (board dynamics)

---

### AG-003: Lean Startup Practitioner Agent
**Slug**: `lean-startup-expert`
**Category**: Methodology

**Description**: Expert in Lean Startup and Customer Development methodologies.

**Expertise Areas**:
- Build-Measure-Learn loops
- Customer discovery methodology
- MVP design and execution
- Hypothesis testing
- Pivot or persevere decisions
- Innovation accounting

**Persona**:
- Role: Lean Startup Coach / Innovation Consultant
- Experience: 10+ years Lean practice
- Background: Eric Ries trained, Steve Blank certified

**Process Integration**:
- customer-discovery-interview.js (all phases)
- mvp-definition-development.js (all phases)
- problem-solution-fit-validation.js (all phases)
- pivot-decision-framework.js (methodology)

---

### AG-004: Startup CFO Agent
**Slug**: `startup-cfo`
**Category**: Finance

**Description**: Startup finance expert for financial planning and fundraising.

**Expertise Areas**:
- Startup financial modeling
- Unit economics optimization
- Cash flow management
- Fundraising financial preparation
- Board financial reporting
- Cap table management

**Persona**:
- Role: Startup CFO / VP Finance
- Experience: 10+ years startup finance
- Background: Big 4 accounting + multiple startup CFO roles

**Process Integration**:
- financial-model-development.js (all phases)
- series-a-fundraising.js (financial preparation)
- due-diligence-preparation.js (financial diligence)
- investor-update-communication.js (financial reporting)

---

### AG-005: Growth Hacker Agent
**Slug**: `growth-hacker`
**Category**: Growth

**Description**: Growth expert specializing in early-stage startup growth strategies.

**Expertise Areas**:
- Growth loops and flywheels
- Traction channel identification
- Growth experimentation
- Viral mechanics
- Retention optimization
- Activation and onboarding

**Persona**:
- Role: VP Growth / Head of Growth
- Experience: 8+ years startup growth
- Background: 0-to-1 growth at multiple startups

**Process Integration**:
- growth-experiment-design.js (all phases)
- traction-channel-identification.js (all phases)
- product-market-fit-assessment.js (growth signals)
- scaling-operations-playbook.js (growth scaling)

---

### AG-006: Pitch Coach Agent
**Slug**: `pitch-coach`
**Category**: Presentations

**Description**: Expert pitch coach for investor and demo day presentations.

**Expertise Areas**:
- Investor pitch development
- Storytelling and narrative
- Demo day preparation
- Presentation skills
- Q&A handling
- Investor psychology

**Persona**:
- Role: Pitch Coach / Accelerator Director
- Experience: 500+ pitches coached
- Background: Accelerator experience, former VC

**Process Integration**:
- investor-pitch-deck.js (all phases)
- demo-day-presentation.js (all phases)
- pre-seed-fundraising.js (pitch development)
- series-a-fundraising.js (partner meetings)

---

### AG-007: Market Analyst Agent
**Slug**: `market-analyst`
**Category**: Research

**Description**: Expert in market research, sizing, and competitive analysis.

**Expertise Areas**:
- TAM/SAM/SOM methodology
- Competitive intelligence
- Market trends and dynamics
- Industry analysis
- Customer segmentation
- Market entry strategy

**Persona**:
- Role: Market Research Director
- Experience: 12+ years market research
- Background: Management consulting, equity research

**Process Integration**:
- market-sizing-analysis.js (all phases)
- competitive-landscape-mapping.js (all phases)
- gtm-strategy-development.js (market analysis)
- international-expansion-planning.js (market selection)

---

### AG-008: Product-Market Fit Expert Agent
**Slug**: `pmf-expert`
**Category**: Validation

**Description**: Expert in achieving and measuring product-market fit.

**Expertise Areas**:
- PMF definition and measurement
- Sean Ellis survey methodology
- Retention analysis
- Customer engagement signals
- Superhuman PMF engine approach
- Pre-PMF vs post-PMF strategies

**Persona**:
- Role: Head of Product / PMF Consultant
- Experience: Achieved PMF at multiple startups
- Background: Product leadership, startup advisor

**Process Integration**:
- product-market-fit-assessment.js (all phases)
- mvp-definition-development.js (PMF planning)
- pivot-decision-framework.js (PMF signals)
- growth-experiment-design.js (post-PMF growth)

---

### AG-009: Startup Lawyer Agent
**Slug**: `startup-lawyer`
**Category**: Legal

**Description**: Startup legal expert for formation, fundraising, and agreements.

**Expertise Areas**:
- Delaware C-corp formation
- SAFE and convertible note terms
- Series A documentation
- Founder agreements
- IP protection
- Employment agreements

**Persona**:
- Role: Startup Attorney / General Counsel
- Experience: 15+ years startup law
- Background: Top startup law firm, in-house GC

**Process Integration**:
- founding-team-formation.js (legal structure)
- pre-seed-fundraising.js (SAFE terms)
- series-a-fundraising.js (definitive docs)
- due-diligence-preparation.js (legal diligence)

---

### AG-010: Operations Scaling Expert Agent
**Slug**: `ops-scaling`
**Category**: Operations

**Description**: Expert in scaling startup operations and processes.

**Expertise Areas**:
- Process documentation
- Automation and tooling
- Hiring and onboarding
- Vendor management
- International operations
- SOC 2 / compliance

**Persona**:
- Role: COO / VP Operations
- Experience: 10+ years startup operations
- Background: Scaled multiple startups from 10 to 500+

**Process Integration**:
- scaling-operations-playbook.js (all phases)
- international-expansion-planning.js (ops planning)
- startup-hiring-process.js (hiring at scale)
- startup-culture-definition.js (culture at scale)

---

### AG-011: Talent Acquisition Agent
**Slug**: `talent-acquisition`
**Category**: Hiring

**Description**: Expert in startup recruiting and team building.

**Expertise Areas**:
- Early-stage hiring strategy
- Technical recruiting
- Equity compensation
- Interview process design
- Employer branding
- Reference checking

**Persona**:
- Role: VP People / Head of Talent
- Experience: 10+ years startup recruiting
- Background: Recruiting at hyper-growth startups

**Process Integration**:
- startup-hiring-process.js (all phases)
- founding-team-formation.js (team composition)
- startup-culture-definition.js (culture fit)
- scaling-operations-playbook.js (hiring scaling)

---

### AG-012: Business Model Strategist Agent
**Slug**: `business-model-strategist`
**Category**: Strategy

**Description**: Expert in business model design and innovation.

**Expertise Areas**:
- Business Model Canvas methodology
- Revenue model design
- Pricing strategy
- Platform business models
- Network effects
- Marketplace dynamics

**Persona**:
- Role: Strategy Consultant / Business Model Expert
- Experience: 12+ years business strategy
- Background: Strategyzer certified, McKinsey alumnus

**Process Integration**:
- business-model-canvas.js (all phases)
- gtm-strategy-development.js (monetization)
- financial-model-development.js (revenue modeling)
- pivot-decision-framework.js (model pivots)

---

### AG-013: Customer Development Expert Agent
**Slug**: `customer-dev-expert`
**Category**: Discovery

**Description**: Expert in Steve Blank's Customer Development methodology.

**Expertise Areas**:
- Customer discovery
- Customer validation
- Customer creation
- Company building
- Hypothesis testing
- Earlyvangelists identification

**Persona**:
- Role: Customer Development Coach
- Experience: Steve Blank trained
- Background: Multiple 0-to-1 startups

**Process Integration**:
- customer-discovery-interview.js (all phases)
- problem-solution-fit-validation.js (validation)
- mvp-definition-development.js (customer testing)
- product-market-fit-assessment.js (validation signals)

---

### AG-014: Angel Investor Perspective Agent
**Slug**: `angel-investor`
**Category**: Fundraising

**Description**: Angel investor perspective for early-stage fundraising.

**Expertise Areas**:
- Angel investment criteria
- Pre-seed/seed evaluation
- SAFE terms and valuation
- Due diligence priorities
- Portfolio construction
- Angel group dynamics

**Persona**:
- Role: Super Angel / Angel Group Lead
- Experience: 50+ angel investments
- Background: Successful founder turned angel

**Process Integration**:
- pre-seed-fundraising.js (all phases)
- investor-pitch-deck.js (angel feedback)
- demo-day-presentation.js (angel audience)
- investor-update-communication.js (angel updates)

---

### AG-015: Accelerator Program Director Agent
**Slug**: `accelerator-director`
**Category**: Programs

**Description**: Accelerator perspective for program preparation and execution.

**Expertise Areas**:
- Accelerator application strategy
- Demo day preparation
- Mentor network leverage
- Batch dynamics
- Post-accelerator fundraising
- YC/Techstars best practices

**Persona**:
- Role: Accelerator Managing Director
- Experience: Run 10+ accelerator batches
- Background: Former founder, accelerator leadership

**Process Integration**:
- demo-day-presentation.js (all phases)
- investor-pitch-deck.js (accelerator context)
- pre-seed-fundraising.js (accelerator fundraising)
- founding-team-formation.js (team feedback)

---

---

## Process-to-Skill/Agent Mapping

| Process File | Primary Skills | Primary Agents |
|-------------|---------------|----------------|
| customer-discovery-interview.js | SK-007 | AG-003, AG-013 |
| problem-solution-fit-validation.js | SK-007, SK-010 | AG-003, AG-008 |
| market-sizing-analysis.js | SK-003, SK-006 | AG-007 |
| competitive-landscape-mapping.js | SK-006 | AG-007 |
| investor-pitch-deck.js | SK-002, SK-003, SK-004 | AG-006, AG-002 |
| demo-day-presentation.js | SK-002 | AG-006, AG-015 |
| board-meeting-presentation.js | SK-016, SK-018 | AG-004, AG-002 |
| pre-seed-fundraising.js | SK-008, SK-009, SK-014 | AG-014, AG-003 |
| series-a-fundraising.js | SK-004, SK-005, SK-008, SK-015 | AG-002, AG-004 |
| due-diligence-preparation.js | SK-015, SK-09 | AG-009, AG-004 |
| investor-update-communication.js | SK-016, SK-018 | AG-004, AG-014 |
| business-model-canvas.js | SK-001, SK-004 | AG-012, AG-003 |
| financial-model-development.js | SK-004, SK-005, SK-018 | AG-004 |
| gtm-strategy-development.js | SK-019, SK-006 | AG-007, AG-005 |
| business-plan-document.js | SK-001, SK-003, SK-005 | AG-012, AG-007 |
| mvp-definition-development.js | SK-010, SK-007 | AG-003, AG-008 |
| product-market-fit-assessment.js | SK-011, SK-004, SK-018 | AG-008, AG-005 |
| pivot-decision-framework.js | SK-020, SK-001 | AG-003, AG-001 |
| traction-channel-identification.js | SK-013, SK-012 | AG-005 |
| growth-experiment-design.js | SK-012, SK-018 | AG-005, AG-008 |
| scaling-operations-playbook.js | SK-019, SK-013 | AG-010 |
| international-expansion-planning.js | SK-003, SK-019 | AG-010, AG-007 |
| founding-team-formation.js | SK-017, SK-009 | AG-001, AG-009, AG-011 |
| startup-hiring-process.js | SK-017 | AG-011, AG-010 |
| startup-culture-definition.js | SK-017 | AG-001, AG-011, AG-010 |

---

## Shared Candidates

These skills and agents are strong candidates for extraction to a shared library as they apply across multiple specializations.

### Shared Skills

| ID | Skill | Potential Shared Specializations |
|----|-------|----------------------------------|
| SK-003 | Market Sizing Calculator | Product Management, Business Strategy |
| SK-004 | Unit Economics Calculator | Product Management, Data Analytics |
| SK-005 | Financial Projection Model | Finance, Business Planning |
| SK-006 | Competitor Analysis | Product Management, Marketing |
| SK-007 | Customer Interview Synthesis | Product Management, UX Research |
| SK-011 | PMF Survey Designer | Product Management |
| SK-012 | Growth Experiment Designer | Product Management, Marketing |
| SK-018 | Startup Metrics Dashboard | Product Management, Data Analytics |
| SK-019 | GTM Strategy Designer | Product Management, Marketing |

### Shared Agents

| ID | Agent | Potential Shared Specializations |
|----|-------|----------------------------------|
| AG-003 | Lean Startup Practitioner | Product Management |
| AG-005 | Growth Hacker | Product Management, Marketing |
| AG-007 | Market Analyst | Product Management, Business Strategy |
| AG-008 | Product-Market Fit Expert | Product Management |
| AG-010 | Operations Scaling Expert | Operations, Business Management |
| AG-011 | Talent Acquisition | HR, People Operations |
| AG-012 | Business Model Strategist | Business Strategy, Product Management |

---

## Implementation Priority

### Phase 1: Critical Skills (High Impact)
1. **SK-002**: Pitch Deck Creator - Highest usage in fundraising
2. **SK-004**: Unit Economics Calculator - Foundation for financial analysis
3. **SK-007**: Customer Interview Synthesis - Core validation capability
4. **SK-008**: Term Sheet Analyzer - Critical for fundraising

### Phase 2: Critical Agents (High Impact)
1. **AG-002**: VC Partner Agent - Fundraising expertise
2. **AG-003**: Lean Startup Practitioner - Methodology expertise
3. **AG-004**: Startup CFO - Financial expertise
4. **AG-006**: Pitch Coach - Presentation expertise

### Phase 3: Validation & PMF
1. **SK-010**: MVP Type Selector
2. **SK-011**: PMF Survey Designer
3. **SK-001**: Business Model Canvas Generator
4. **AG-008**: Product-Market Fit Expert
5. **AG-013**: Customer Development Expert

### Phase 4: Growth & Scaling
1. **SK-012**: Growth Experiment Designer
2. **SK-013**: Traction Channel Evaluator
3. **SK-019**: GTM Strategy Designer
4. **AG-005**: Growth Hacker
5. **AG-010**: Operations Scaling Expert

### Phase 5: Financial & Legal
1. **SK-005**: Financial Projection Model
2. **SK-009**: Cap Table Modeler
3. **SK-017**: Founders Agreement Generator
4. **AG-009**: Startup Lawyer
5. **AG-014**: Angel Investor Perspective

### Phase 6: Support Tools
1. **SK-003**: Market Sizing Calculator
2. **SK-006**: Competitor Analysis
3. **SK-014**: Investor CRM Manager
4. **SK-015**: Data Room Organizer
5. **SK-016**: Investor Update Generator
6. **SK-018**: Startup Metrics Dashboard
7. **SK-020**: Pivot Analyzer

### Phase 7: Team & Culture
1. **AG-001**: Startup Founder Coach
2. **AG-011**: Talent Acquisition
3. **AG-007**: Market Analyst
4. **AG-012**: Business Model Strategist
5. **AG-015**: Accelerator Program Director

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Skills Identified | 20 |
| Agents Identified | 15 |
| Shared Skill Candidates | 9 |
| Shared Agent Candidates | 7 |
| Total Processes Covered | 25 |

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 4 - Skills and Agents Identified
**Next Step**: Phase 5 - Implement specialized skills and agents
