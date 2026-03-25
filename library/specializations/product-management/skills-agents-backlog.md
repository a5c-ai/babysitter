# Product Management and Product Strategy - Skills and Agents Backlog

This document identifies specialized skills and agents (subagents) that could enhance the Product Management processes beyond general-purpose capabilities. These tools would provide domain-specific expertise, automation capabilities, and integration with specialized tooling.

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
All 17 implemented processes in this specialization currently use the `general-purpose` agent for task execution. While functional, this approach lacks domain-specific optimizations that specialized skills and agents could provide.

### Implemented Processes
1. `quarterly-roadmap.js` - Strategic roadmap planning
2. `rice-prioritization.js` - RICE scoring framework
3. `moscow-prioritization.js` - MoSCoW categorization
4. `feature-definition-prd.js` - PRD creation and user story writing
5. `user-story-mapping.js` - User story mapping with personas
6. `jtbd-analysis.js` - Jobs-to-be-Done analysis
7. `competitive-analysis.js` - Market and competitive analysis
8. `product-market-fit.js` - PMF assessment and validation
9. `product-vision-strategy.js` - Vision and strategy definition
10. `product-launch-gtm.js` - Launch planning and GTM strategy
11. `beta-program.js` - Beta program management
12. `metrics-dashboard.js` - KPI and metrics definition
13. `conversion-funnel-analysis.js` - Funnel optimization
14. `retention-cohort-analysis.js` - Cohort retention analysis
15. `stakeholder-alignment.js` - Stakeholder communication
16. `customer-advisory-board.js` - CAB management
17. `product-council-review.js` - Product review processes

### Goals
- Provide deep expertise in product management frameworks and methodologies
- Enable automated research synthesis and competitive intelligence
- Reduce context-switching overhead for domain-specific tasks
- Improve quality of user research analysis and prioritization decisions
- Integrate with product management and analytics tools

---

## Skills Backlog

### SK-001: User Research Synthesis Skill
**Slug**: `user-research-synthesis`
**Category**: User Research

**Description**: Specialized skill for synthesizing qualitative user research into actionable insights.

**Capabilities**:
- Analyze interview transcripts for patterns and themes
- Extract key quotes and evidence for insights
- Identify user pain points, needs, and goals
- Create affinity diagrams and thematic maps
- Generate persona attributes from research data
- Synthesize research across multiple sources (surveys, interviews, support tickets)
- Calculate insight confidence levels based on evidence

**Process Integration**:
- jtbd-analysis.js
- user-story-mapping.js
- product-market-fit.js
- feature-definition-prd.js

**Dependencies**: NLP capabilities, research data formats

---

### SK-002: Competitive Intelligence Skill
**Slug**: `competitive-intel`
**Category**: Market Analysis

**Description**: Deep competitive analysis and market monitoring capabilities.

**Capabilities**:
- Analyze competitor websites, pricing, and positioning
- Track competitor feature releases and announcements
- Generate feature comparison matrices
- Monitor competitor reviews and ratings
- Extract competitor strengths and weaknesses
- Identify market gaps and white space opportunities
- Track industry analyst reports and mentions

**Process Integration**:
- competitive-analysis.js
- product-vision-strategy.js
- product-launch-gtm.js
- quarterly-roadmap.js

**Dependencies**: Web scraping, news monitoring APIs

---

### SK-003: RICE/Prioritization Calculator Skill
**Slug**: `prioritization-calculator`
**Category**: Prioritization Frameworks

**Description**: Automated calculation and scoring for prioritization frameworks.

**Capabilities**:
- Calculate RICE scores with validation
- Calculate ICE (Impact, Confidence, Ease) scores
- Apply MoSCoW categorization rules
- Weight scoring based on strategic priorities
- Normalize scores across different data sources
- Generate priority rankings with confidence intervals
- Support custom prioritization frameworks

**Process Integration**:
- rice-prioritization.js
- moscow-prioritization.js
- feature-definition-prd.js
- quarterly-roadmap.js

**Dependencies**: Numerical computation

---

### SK-004: Product Analytics Skill
**Slug**: `product-analytics`
**Category**: Analytics

**Description**: Deep integration with product analytics platforms for metrics and insights.

**Capabilities**:
- Query Amplitude/Mixpanel/Heap data
- Generate retention curves and cohort analyses
- Calculate conversion funnel metrics
- Identify drop-off points and friction
- Create custom event tracking specifications
- Generate metric definitions and documentation
- Build dashboard configurations

**Process Integration**:
- metrics-dashboard.js
- conversion-funnel-analysis.js
- retention-cohort-analysis.js
- product-market-fit.js

**Dependencies**: Analytics platform APIs (Amplitude, Mixpanel, GA4)

---

### SK-005: A/B Test Design Skill
**Slug**: `ab-test-design`
**Category**: Experimentation

**Description**: Statistical experiment design and analysis capabilities.

**Capabilities**:
- Calculate required sample sizes for experiments
- Design experiment variants and hypotheses
- Validate statistical significance of results
- Calculate practical significance and effect sizes
- Detect interaction effects and segments
- Generate experiment documentation
- Recommend ship/iterate/kill decisions

**Process Integration**:
- product-market-fit.js (validation experiments)
- conversion-funnel-analysis.js (funnel experiments)
- beta-program.js (A/B testing in beta)

**Dependencies**: Statistical libraries, experimentation platforms

---

### SK-006: User Story Generator Skill
**Slug**: `user-story-generator`
**Category**: Requirements

**Description**: Generate and validate user stories from various inputs.

**Capabilities**:
- Generate user stories from requirements descriptions
- Apply INVEST criteria validation
- Create acceptance criteria from user stories
- Split large stories into smaller ones
- Estimate story points based on complexity
- Generate story maps and release plans
- Convert job stories to user stories and vice versa

**Process Integration**:
- feature-definition-prd.js
- user-story-mapping.js
- jtbd-analysis.js
- sprint planning

**Dependencies**: NLP, story templates

---

### SK-007: PRD Document Generator Skill
**Slug**: `prd-generator`
**Category**: Documentation

**Description**: Generate comprehensive PRD documents from structured inputs.

**Capabilities**:
- Generate PRD from feature specifications
- Apply company PRD templates and formatting
- Create visual mockup placeholders
- Generate technical requirements sections
- Create success metrics specifications
- Build launch checklists
- Version and track PRD changes

**Process Integration**:
- feature-definition-prd.js
- product-launch-gtm.js
- beta-program.js

**Dependencies**: Document templates, formatting

---

### SK-008: Roadmap Visualization Skill
**Slug**: `roadmap-viz`
**Category**: Planning

**Description**: Generate roadmap visualizations and planning artifacts.

**Capabilities**:
- Generate Now/Next/Later roadmap views
- Create timeline-based roadmap visualizations
- Build stakeholder-specific roadmap versions
- Create Gantt-style planning charts
- Generate dependency graphs
- Build resource allocation views
- Export to various formats (Markdown, Mermaid, CSV)

**Process Integration**:
- quarterly-roadmap.js
- product-vision-strategy.js
- stakeholder-alignment.js
- product-council-review.js

**Dependencies**: Visualization libraries, export formats

---

### SK-009: GTM Strategy Skill
**Slug**: `gtm-strategy`
**Category**: Go-to-Market

**Description**: Go-to-market planning and execution capabilities.

**Capabilities**:
- Generate launch tier recommendations
- Create messaging frameworks and positioning
- Build channel strategy recommendations
- Calculate launch timeline milestones
- Generate sales enablement materials structure
- Create competitive battlecard frameworks
- Build launch checklist templates

**Process Integration**:
- product-launch-gtm.js
- competitive-analysis.js
- beta-program.js
- stakeholder-alignment.js

**Dependencies**: Marketing frameworks, channel templates

---

### SK-010: Survey Design Skill
**Slug**: `survey-design`
**Category**: User Research

**Description**: Design and analyze surveys for product validation.

**Capabilities**:
- Design PMF surveys (Sean Ellis test)
- Create NPS survey implementations
- Build feature validation surveys
- Generate survey question banks
- Analyze survey response data
- Calculate statistical confidence in results
- Segment analysis by user attributes

**Process Integration**:
- product-market-fit.js
- beta-program.js
- customer-advisory-board.js
- jtbd-analysis.js

**Dependencies**: Survey platforms, statistical analysis

---

### SK-011: OKR Planning Skill
**Slug**: `okr-planning`
**Category**: Strategic Planning

**Description**: Objectives and Key Results planning and tracking.

**Capabilities**:
- Generate OKRs from strategic objectives
- Validate KR measurability and specificity
- Calculate OKR progress and scores
- Align team OKRs with company OKRs
- Generate OKR review reports
- Identify at-risk objectives
- Create OKR cascade visualizations

**Process Integration**:
- quarterly-roadmap.js
- product-vision-strategy.js
- metrics-dashboard.js
- stakeholder-alignment.js

**Dependencies**: OKR frameworks, scoring algorithms

---

### SK-012: Persona Development Skill
**Slug**: `persona-development`
**Category**: User Research

**Description**: Create and maintain user personas from research data.

**Capabilities**:
- Generate persona profiles from research
- Identify persona segments from analytics
- Create jobs-to-be-done per persona
- Map personas to product features
- Calculate persona TAM/SAM estimates
- Update personas with new research
- Generate persona comparison matrices

**Process Integration**:
- user-story-mapping.js
- jtbd-analysis.js
- feature-definition-prd.js
- product-launch-gtm.js

**Dependencies**: Research data, segmentation algorithms

---

### SK-013: Feature Flagging Skill
**Slug**: `feature-flags`
**Category**: Release Management

**Description**: Feature flag configuration and rollout planning.

**Capabilities**:
- Generate feature flag specifications
- Design rollout percentage strategies
- Create flag targeting rules
- Plan canary and gradual rollouts
- Monitor flag impact on metrics
- Generate kill switch procedures
- Track flag lifecycle and cleanup

**Process Integration**:
- product-launch-gtm.js
- beta-program.js
- conversion-funnel-analysis.js

**Dependencies**: Feature flag platforms (LaunchDarkly, Split)

---

### SK-014: Stakeholder Communication Skill
**Slug**: `stakeholder-comms`
**Category**: Communication

**Description**: Generate stakeholder-specific communications and presentations.

**Capabilities**:
- Generate executive summaries
- Create board-level presentations
- Build sales-focused feature briefs
- Create customer communications
- Generate internal launch announcements
- Build FAQ documents
- Create status update templates

**Process Integration**:
- stakeholder-alignment.js
- product-council-review.js
- product-launch-gtm.js
- quarterly-roadmap.js

**Dependencies**: Communication templates, presentation formats

---

### SK-015: Customer Feedback Aggregation Skill
**Slug**: `feedback-aggregation`
**Category**: Voice of Customer

**Description**: Aggregate and analyze customer feedback from multiple sources.

**Capabilities**:
- Parse support tickets for feature requests
- Analyze NPS/CSAT verbatim responses
- Extract themes from sales call notes
- Monitor app store reviews
- Aggregate feedback from Intercom/Zendesk
- Calculate feature request frequency
- Track sentiment trends over time

**Process Integration**:
- jtbd-analysis.js
- feature-definition-prd.js
- rice-prioritization.js
- customer-advisory-board.js

**Dependencies**: Support platform APIs, NLP

---

---

## Agents Backlog

### AG-001: Product Strategist Agent
**Slug**: `product-strategist`
**Category**: Strategy

**Description**: Senior product strategist for vision, positioning, and strategic decisions.

**Expertise Areas**:
- Product vision and strategy development
- Market positioning and differentiation
- Portfolio strategy and resource allocation
- Build vs. buy vs. partner decisions
- Platform strategy
- Business model innovation

**Persona**:
- Role: Chief Product Officer / VP Product
- Experience: 15+ years product leadership
- Background: Multiple 0-to-1 and scaling products

**Process Integration**:
- product-vision-strategy.js (all phases)
- competitive-analysis.js (strategic positioning)
- quarterly-roadmap.js (strategic themes)
- product-council-review.js (strategic review)

---

### AG-002: User Research Expert Agent
**Slug**: `user-researcher`
**Category**: Research

**Description**: Specialist in qualitative and quantitative user research methodologies.

**Expertise Areas**:
- User interview design and facilitation
- JTBD and switch interview techniques
- Usability testing methodology
- Survey design and analysis
- Research synthesis and insight generation
- Persona development

**Persona**:
- Role: Senior User Researcher
- Experience: 10+ years UX research
- Background: Psychology/HCI trained

**Process Integration**:
- jtbd-analysis.js (all phases)
- user-story-mapping.js (persona mapping)
- product-market-fit.js (research phases)
- beta-program.js (feedback collection)

---

### AG-003: Data-Driven PM Agent
**Slug**: `data-pm`
**Category**: Analytics

**Description**: Product manager specializing in metrics, analytics, and experimentation.

**Expertise Areas**:
- Product metrics definition (North Star, KPIs)
- Funnel analysis and optimization
- Cohort and retention analysis
- A/B test design and interpretation
- SQL/analytics tool proficiency
- Growth metrics and strategies

**Persona**:
- Role: Senior Product Manager, Growth
- Experience: 8+ years data-driven PM
- Background: Analytics/data science hybrid

**Process Integration**:
- metrics-dashboard.js (all phases)
- conversion-funnel-analysis.js (all phases)
- retention-cohort-analysis.js (all phases)
- product-market-fit.js (quantitative analysis)

---

### AG-004: Technical Product Manager Agent
**Slug**: `technical-pm`
**Category**: Technical

**Description**: PM with deep technical understanding for platform and infrastructure products.

**Expertise Areas**:
- API and platform product management
- Technical specification writing
- Developer experience (DX)
- Technical debt prioritization
- Architecture decision involvement
- Technical roadmap planning

**Persona**:
- Role: Technical Product Manager / Platform PM
- Experience: 8+ years technical PM
- Background: Software engineering + PM

**Process Integration**:
- feature-definition-prd.js (technical specs)
- quarterly-roadmap.js (technical initiatives)
- rice-prioritization.js (effort estimation)
- product-council-review.js (technical review)

---

### AG-005: Go-to-Market Strategist Agent
**Slug**: `gtm-strategist`
**Category**: Launch

**Description**: Expert in product launches and go-to-market execution.

**Expertise Areas**:
- Launch planning and coordination
- Messaging and positioning development
- Channel strategy
- Sales enablement
- Customer marketing
- Analyst relations

**Persona**:
- Role: Director of Product Marketing
- Experience: 10+ years product marketing
- Background: B2B SaaS launches

**Process Integration**:
- product-launch-gtm.js (all phases)
- competitive-analysis.js (battle cards)
- beta-program.js (launch readiness)
- stakeholder-alignment.js (launch comms)

---

### AG-006: Prioritization Expert Agent
**Slug**: `prioritization-expert`
**Category**: Planning

**Description**: Expert in prioritization frameworks and tradeoff analysis.

**Expertise Areas**:
- RICE, ICE, MoSCoW frameworks
- Opportunity scoring
- Resource allocation decisions
- Tradeoff analysis
- Technical/product debt prioritization
- Backlog management

**Persona**:
- Role: Senior Product Manager
- Experience: 8+ years product management
- Background: Economics/business strategy

**Process Integration**:
- rice-prioritization.js (all phases)
- moscow-prioritization.js (all phases)
- quarterly-roadmap.js (initiative prioritization)
- feature-definition-prd.js (scope decisions)

---

### AG-007: Customer Success PM Agent
**Slug**: `customer-success-pm`
**Category**: Customer

**Description**: PM focused on customer success, retention, and expansion.

**Expertise Areas**:
- Customer health metrics
- Onboarding optimization
- Feature adoption strategies
- Churn analysis and prevention
- Customer feedback programs
- Advisory board management

**Persona**:
- Role: PM, Customer Success Products
- Experience: 7+ years customer-focused PM
- Background: Customer success + PM hybrid

**Process Integration**:
- customer-advisory-board.js (all phases)
- retention-cohort-analysis.js (retention strategies)
- product-market-fit.js (PMF signals)
- beta-program.js (participant management)

---

### AG-008: Requirements Analyst Agent
**Slug**: `requirements-analyst`
**Category**: Requirements

**Description**: Expert in requirements gathering, documentation, and management.

**Expertise Areas**:
- Requirements elicitation techniques
- User story writing (INVEST)
- Acceptance criteria definition
- Story mapping and backlog management
- Sprint planning support
- Requirements traceability

**Persona**:
- Role: Senior Business Analyst / PM
- Experience: 8+ years requirements management
- Background: BA certification, Agile trained

**Process Integration**:
- feature-definition-prd.js (all phases)
- user-story-mapping.js (all phases)
- moscow-prioritization.js (requirements scope)
- beta-program.js (test requirements)

---

### AG-009: Market Analyst Agent
**Slug**: `market-analyst`
**Category**: Analysis

**Description**: Expert in market research, sizing, and competitive intelligence.

**Expertise Areas**:
- TAM/SAM/SOM calculations
- Competitive landscape analysis
- Market trends and dynamics
- Industry analyst research
- Win/loss analysis
- Market segmentation

**Persona**:
- Role: Product Marketing Manager / Market Researcher
- Experience: 8+ years market research
- Background: Strategy consulting

**Process Integration**:
- competitive-analysis.js (all phases)
- product-vision-strategy.js (market analysis)
- product-launch-gtm.js (market positioning)
- quarterly-roadmap.js (market opportunities)

---

### AG-010: Stakeholder Manager Agent
**Slug**: `stakeholder-manager`
**Category**: Communication

**Description**: Expert in stakeholder communication and organizational alignment.

**Expertise Areas**:
- Executive communication
- Cross-functional alignment
- Change management
- Product council facilitation
- Roadmap presentations
- Conflict resolution

**Persona**:
- Role: Director of Product Management
- Experience: 12+ years PM leadership
- Background: Large organization experience

**Process Integration**:
- stakeholder-alignment.js (all phases)
- product-council-review.js (all phases)
- quarterly-roadmap.js (stakeholder views)
- product-launch-gtm.js (launch coordination)

---

### AG-011: JTBD Specialist Agent
**Slug**: `jtbd-specialist`
**Category**: Research

**Description**: Expert in Jobs-to-be-Done methodology and outcome-driven innovation.

**Expertise Areas**:
- JTBD interview techniques
- Job statement formulation
- Functional, emotional, social jobs
- Progress mapping
- Outcome-driven innovation
- Switch interview analysis

**Persona**:
- Role: JTBD Consultant / Research Lead
- Experience: 10+ years JTBD practice
- Background: Bob Moesta/Tony Ulwick trained

**Process Integration**:
- jtbd-analysis.js (all phases)
- user-story-mapping.js (job stories)
- product-vision-strategy.js (job focus)
- feature-definition-prd.js (job-based requirements)

---

### AG-012: Growth PM Agent
**Slug**: `growth-pm`
**Category**: Growth

**Description**: Product manager specializing in growth loops and experimentation.

**Expertise Areas**:
- Growth loops and flywheels
- Acquisition channel optimization
- Activation and onboarding
- Retention and engagement
- Referral and viral mechanics
- Monetization optimization

**Persona**:
- Role: Senior PM, Growth
- Experience: 7+ years growth PM
- Background: Startup growth experience

**Process Integration**:
- conversion-funnel-analysis.js (all phases)
- retention-cohort-analysis.js (growth metrics)
- product-market-fit.js (growth signals)
- metrics-dashboard.js (growth metrics)

---

---

## Process-to-Skill/Agent Mapping

| Process File | Primary Skills | Primary Agents |
|-------------|---------------|----------------|
| quarterly-roadmap.js | SK-003, SK-008, SK-011 | AG-001, AG-006 |
| rice-prioritization.js | SK-003, SK-015 | AG-006 |
| moscow-prioritization.js | SK-003, SK-006 | AG-006, AG-008 |
| feature-definition-prd.js | SK-006, SK-007, SK-012 | AG-004, AG-008 |
| user-story-mapping.js | SK-006, SK-012 | AG-002, AG-008, AG-011 |
| jtbd-analysis.js | SK-001, SK-010, SK-015 | AG-002, AG-011 |
| competitive-analysis.js | SK-002, SK-008 | AG-009, AG-005 |
| product-market-fit.js | SK-004, SK-005, SK-010 | AG-003, AG-002 |
| product-vision-strategy.js | SK-002, SK-011 | AG-001, AG-009 |
| product-launch-gtm.js | SK-009, SK-013, SK-014 | AG-005, AG-010 |
| beta-program.js | SK-010, SK-013, SK-015 | AG-007, AG-002 |
| metrics-dashboard.js | SK-004, SK-011 | AG-003, AG-012 |
| conversion-funnel-analysis.js | SK-004, SK-005 | AG-003, AG-012 |
| retention-cohort-analysis.js | SK-004 | AG-003, AG-007 |
| stakeholder-alignment.js | SK-008, SK-014 | AG-010, AG-001 |
| customer-advisory-board.js | SK-010, SK-015 | AG-007, AG-010 |
| product-council-review.js | SK-008, SK-014 | AG-010, AG-001 |

---

## Shared Candidates

These skills and agents are strong candidates for extraction to a shared library as they apply across multiple specializations.

### Shared Skills

| ID | Skill | Potential Shared Specializations |
|----|-------|----------------------------------|
| SK-001 | User Research Synthesis | UX/UI Design, Technical Documentation |
| SK-002 | Competitive Intelligence | Software Architecture, Business Strategy |
| SK-004 | Product Analytics | Data Science/ML, QA Testing |
| SK-005 | A/B Test Design | UX/UI Design, Web Development |
| SK-006 | User Story Generator | Software Development, QA Testing |
| SK-007 | PRD Generator | Technical Documentation |
| SK-010 | Survey Design | UX/UI Design |
| SK-014 | Stakeholder Communication | All specializations with executive reporting |

### Shared Agents

| ID | Agent | Potential Shared Specializations |
|----|-------|----------------------------------|
| AG-002 | User Research Expert | UX/UI Design |
| AG-003 | Data-Driven PM | Data Science/ML |
| AG-004 | Technical PM | Software Development, Architecture |
| AG-009 | Market Analyst | Business Strategy |
| AG-010 | Stakeholder Manager | All leadership specializations |

---

## Implementation Priority

### Phase 1: Critical Skills (High Impact)
1. **SK-001**: User Research Synthesis - Foundation for customer insights
2. **SK-003**: RICE/Prioritization Calculator - Core prioritization need
3. **SK-004**: Product Analytics - Essential for data-driven decisions
4. **SK-006**: User Story Generator - High-frequency requirement

### Phase 2: Critical Agents (High Impact)
1. **AG-006**: Prioritization Expert - Highest process coverage
2. **AG-003**: Data-Driven PM - Cross-cutting analytics need
3. **AG-002**: User Research Expert - Foundation for discovery

### Phase 3: Research & Discovery
1. **SK-010**: Survey Design
2. **SK-012**: Persona Development
3. **AG-011**: JTBD Specialist
4. **AG-001**: Product Strategist

### Phase 4: Launch & Communication
1. **SK-009**: GTM Strategy
2. **SK-014**: Stakeholder Communication
3. **AG-005**: GTM Strategist
4. **AG-010**: Stakeholder Manager

### Phase 5: Specialized Tools
1. **SK-002**: Competitive Intelligence
2. **SK-005**: A/B Test Design
3. **SK-013**: Feature Flagging
4. **AG-012**: Growth PM
5. **AG-007**: Customer Success PM

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Skills Identified | 15 |
| Agents Identified | 12 |
| Shared Skill Candidates | 8 |
| Shared Agent Candidates | 5 |
| Total Processes Covered | 17 |

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 4 - Skills and Agents Identified
**Next Step**: Phase 5 - Implement specialized skills and agents
