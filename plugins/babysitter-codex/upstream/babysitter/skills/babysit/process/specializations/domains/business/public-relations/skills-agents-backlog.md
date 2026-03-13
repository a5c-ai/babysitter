# Public Relations and Communications - Skills and Agents Backlog

This document identifies specialized skills and agents (subagents) that could enhance the Public Relations processes beyond general-purpose capabilities. These tools would provide domain-specific expertise, automation capabilities, and integration with specialized PR platforms and media monitoring tools.

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
All 25 implemented processes in this specialization currently use the `general-purpose` agent for task execution. While functional, this approach lacks domain-specific optimizations that specialized skills and agents could provide for public relations operations.

### Goals
- Provide deep expertise in media monitoring and intelligence platforms (Cision, Meltwater, etc.)
- Enable automated media outreach with journalist database integrations
- Reduce context-switching overhead for PR-specific tasks
- Improve accuracy and efficiency of reputation monitoring and crisis response
- Integrate with wire services for press release distribution

---

## Skills Backlog

### SK-001: Media Monitoring Skill
**Slug**: `media-monitoring`
**Category**: Reputation Monitoring

**Description**: Deep integration with media monitoring platforms for coverage tracking, sentiment analysis, and reporting.

**Capabilities**:
- Cision API integration for media monitoring
- Meltwater API integration for global coverage
- Brandwatch media monitoring configuration
- Boolean search query building and optimization
- Media clip aggregation and deduplication
- Automated sentiment classification
- Share of voice calculation
- Outlet tiering and weighting
- Coverage alert configuration
- Trend detection and spike alerts

**Process Integration**:
- reputation-monitoring.js
- reputation-risk-identification.js
- media-coverage-analysis.js
- pr-measurement-framework.js

**Dependencies**: Cision API, Meltwater API, Brandwatch API

---

### SK-002: Social Listening Skill
**Slug**: `social-listening-pr`
**Category**: Reputation Monitoring

**Description**: Social media monitoring and conversation analysis for PR intelligence.

**Capabilities**:
- Sprinklr social listening integration
- Talkwalker conversation analysis
- Mention alert configuration
- Hashtag and keyword tracking
- Influencer conversation monitoring
- Crisis signal detection
- Social sentiment analysis
- Platform-specific monitoring (Twitter/X, LinkedIn, Reddit)
- Community conversation clustering
- Viral content detection

**Process Integration**:
- reputation-monitoring.js
- reputation-risk-identification.js
- crisis-response-execution.js
- social-listening-pr.js

**Dependencies**: Sprinklr API, Talkwalker API, native social APIs

---

### SK-003: Media Database and Outreach Skill
**Slug**: `media-database`
**Category**: Media Relations

**Description**: Journalist database access and media outreach automation.

**Capabilities**:
- Cision Connect journalist database access
- Muck Rack journalist search and monitoring
- Propel PRM media list management
- Journalist beat and preference tracking
- Contact information verification
- Pitch tracking and follow-up automation
- Response rate analytics
- Media list segmentation
- Email deliverability optimization
- Coverage linkage to outreach

**Process Integration**:
- media-relations-strategy.js
- media-pitching-campaigns.js
- press-release-development.js
- executive-visibility-program.js

**Dependencies**: Cision API, Muck Rack API, Propel API

---

### SK-004: Press Release Distribution Skill
**Slug**: `press-release-distribution`
**Category**: Media Relations

**Description**: Wire service integration and press release distribution management.

**Capabilities**:
- PR Newswire API integration
- Business Wire distribution management
- GlobeNewswire circuit selection
- Distribution circuit optimization
- Embargo management
- Multimedia asset attachment
- Geographic targeting configuration
- Industry/sector targeting
- Distribution tracking and reporting
- Pickup monitoring

**Process Integration**:
- press-release-development.js
- investor-communications-support.js
- csr-communications.js
- annual-report-production.js

**Dependencies**: PR Newswire API, Business Wire API, GlobeNewswire API

---

### SK-005: Crisis Management Platform Skill
**Slug**: `crisis-management-platform`
**Category**: Crisis Communications

**Description**: Crisis response platform integration and real-time monitoring.

**Capabilities**:
- Crisis monitoring dashboard configuration
- Real-time alert escalation
- Stakeholder notification system integration
- Holding statement rapid deployment
- Dark site activation management
- Multi-channel response coordination
- Team collaboration tools integration
- Incident logging and documentation
- Response time tracking
- Post-crisis report generation

**Process Integration**:
- crisis-communications-plan.js
- crisis-response-execution.js
- crisis-simulation-training.js
- post-crisis-analysis.js

**Dependencies**: Crisis management platform APIs, Slack/Teams APIs

---

### SK-006: Reputation Intelligence Skill
**Slug**: `reputation-intelligence`
**Category**: Reputation Management

**Description**: Reputation measurement and benchmarking platform integration.

**Capabilities**:
- RepTrak reputation data integration
- YouGov brand tracking data access
- Glassdoor employer reputation monitoring
- G2/Capterra review monitoring
- Trust Pilot integration
- Net Promoter Score tracking
- Reputation index calculation
- Competitive reputation benchmarking
- Stakeholder perception surveys
- Brand health dashboards

**Process Integration**:
- reputation-monitoring.js
- reputation-risk-identification.js
- reputation-recovery-strategy.js
- executive-visibility-program.js

**Dependencies**: RepTrak API, YouGov API, review platform APIs

---

### SK-007: Internal Communications Platform Skill
**Slug**: `internal-comms-platform`
**Category**: Internal Communications

**Description**: Employee communications platform integration and analytics.

**Capabilities**:
- Staffbase intranet integration
- Workplace by Meta management
- Viva Engage (Yammer) operations
- Microsoft Teams channel management
- Slack enterprise communications
- Email newsletter platforms (Poppulo, ContactMonkey)
- Employee pulse survey integration
- Internal video platform management
- Push notification systems
- Analytics and engagement tracking

**Process Integration**:
- internal-communications-strategy.js
- change-management-communications.js
- town-hall-event-planning.js
- employee-advocacy-program.js

**Dependencies**: Staffbase API, Microsoft Graph API, Slack API

---

### SK-008: Speaking and Events Skill
**Slug**: `speaking-events`
**Category**: Executive Visibility

**Description**: Speaking opportunity discovery and conference management.

**Capabilities**:
- Conference and event database access
- Call for proposals (CFP) tracking
- Speaking submission management
- Event calendar aggregation
- Webinar platform integration (ON24, Zoom Events)
- Speaker bureau coordination
- Post-event content repurposing
- Speaking opportunity scoring
- Award submission tracking
- Panel placement coordination

**Process Integration**:
- executive-visibility-program.js
- community-relations-program.js
- town-hall-event-planning.js

**Dependencies**: Event platform APIs, webinar platform APIs

---

### SK-009: PR Analytics and Reporting Skill
**Slug**: `pr-analytics`
**Category**: Measurement and Analytics

**Description**: PR measurement and reporting automation following Barcelona Principles.

**Capabilities**:
- AMEC Integrated Evaluation Framework implementation
- Barcelona Principles 3.0 metrics calculation
- AVE alternative metrics (where still requested)
- Media quality score calculation
- Message pull-through analysis
- Sentiment trend visualization
- Competitive share of voice reporting
- Executive dashboard generation
- Automated report scheduling
- Data visualization (Tableau, Power BI integration)

**Process Integration**:
- pr-measurement-framework.js
- media-coverage-analysis.js
- reputation-monitoring.js
- marketing-performance-dashboard.js

**Dependencies**: BI platform APIs, media monitoring data exports

---

### SK-010: Influencer and KOL Management Skill
**Slug**: `influencer-kol-management`
**Category**: Media Relations

**Description**: Industry influencer and key opinion leader relationship management.

**Capabilities**:
- Industry analyst database (Gartner, Forrester)
- Academic KOL identification
- Thought leader mapping
- Influencer CRM integration
- Engagement tracking and scoring
- Briefing scheduling and management
- Relationship health monitoring
- Analyst report tracking
- Podcast guest coordination
- Industry awards nomination tracking

**Process Integration**:
- media-relations-strategy.js
- executive-visibility-program.js
- stakeholder-mapping.js
- influencer-relationship.js

**Dependencies**: Analyst relations platforms, CRM systems

---

### SK-011: AP Style and Writing Skill
**Slug**: `ap-style-writing`
**Category**: Content Creation

**Description**: AP style compliance, grammar checking, and PR writing assistance.

**Capabilities**:
- AP Stylebook integration
- Real-time style checking
- Grammar and readability analysis
- Headline optimization
- Quote formatting validation
- Boilerplate management
- Press release template library
- Multi-language style adaptation
- Brand voice consistency checking
- Legal/compliance flag detection

**Process Integration**:
- press-release-development.js
- corporate-messaging-architecture.js
- csr-communications.js
- internal-communications-strategy.js

**Dependencies**: AP Stylebook API, Grammarly Business API

---

### SK-012: Stakeholder CRM Skill
**Slug**: `stakeholder-crm`
**Category**: Stakeholder Communications

**Description**: Stakeholder relationship management and engagement tracking.

**Capabilities**:
- Stakeholder database management
- Engagement history tracking
- Communication preference management
- Meeting and interaction logging
- Relationship scoring
- Stakeholder segmentation
- Multi-channel touchpoint tracking
- Coalition partner management
- Government affairs contact management
- Investor relations contact management

**Process Integration**:
- stakeholder-mapping.js
- government-affairs-communications.js
- investor-communications-support.js
- community-relations-program.js

**Dependencies**: CRM APIs (Salesforce, HubSpot), specialized stakeholder platforms

---

### SK-013: Media Training Simulation Skill
**Slug**: `media-training-simulation`
**Category**: Crisis Communications

**Description**: Media interview preparation and crisis simulation tools.

**Capabilities**:
- Interview simulation scenario generation
- Question bank management
- Video recording and review
- Message bridge technique training
- Body language feedback
- Crisis scenario simulation
- Tabletop exercise facilitation
- Performance scoring and feedback
- Training progress tracking
- Best practice video library

**Process Integration**:
- media-interview-preparation.js
- crisis-simulation-training.js
- executive-visibility-program.js

**Dependencies**: Video conferencing APIs, learning management systems

---

### SK-014: Government Affairs Intelligence Skill
**Slug**: `government-affairs-intel`
**Category**: Stakeholder Communications

**Description**: Legislative tracking and government affairs monitoring.

**Capabilities**:
- Legislative tracking (FiscalNote, Quorum)
- Regulatory alert monitoring
- Policy analysis tools
- Legislator database access
- Hearing schedule tracking
- Comment period monitoring
- Lobby disclosure compliance
- Political risk assessment
- Grassroots campaign coordination
- Public affairs coalition management

**Process Integration**:
- government-affairs-communications.js
- stakeholder-mapping.js
- reputation-risk-identification.js

**Dependencies**: FiscalNote API, Quorum API, government data feeds

---

### SK-015: Employee Advocacy Platform Skill
**Slug**: `employee-advocacy`
**Category**: Internal Communications

**Description**: Employee social sharing and advocacy program management.

**Capabilities**:
- Sociabble platform integration
- EveryoneSocial advocacy management
- LinkedIn Elevate content distribution
- Shareable content curation
- Gamification and leaderboards
- Compliance review workflows
- Reach and engagement tracking
- Employee participation analytics
- Pre-approved content library
- Social selling integration

**Process Integration**:
- employee-advocacy-program.js
- internal-communications-strategy.js
- executive-visibility-program.js

**Dependencies**: Sociabble API, EveryoneSocial API, LinkedIn API

---

### SK-016: Investor Relations Platform Skill
**Slug**: `investor-relations-platform`
**Category**: Stakeholder Communications

**Description**: Investor communications and financial disclosure management.

**Capabilities**:
- IR website management (Q4, Notified)
- Earnings call coordination
- Financial calendar management
- SEC filing coordination
- Investor targeting and CRM
- Earnings transcript analysis
- Peer benchmarking
- Analyst estimate tracking
- Shareholder identification
- Investor day event management

**Process Integration**:
- investor-communications-support.js
- annual-report-production.js
- stakeholder-mapping.js

**Dependencies**: Q4 API, Notified API, financial data providers

---

---

## Agents Backlog

### AG-001: Media Relations Strategist Agent
**Slug**: `media-relations-strategist`
**Category**: Media Relations

**Description**: Expert agent for media strategy development and journalist relationship management.

**Expertise Areas**:
- PESO model implementation
- Media landscape analysis
- Journalist relationship building
- Pitch strategy development
- Story angle identification
- News hook creation
- Exclusive and embargo management
- Wire service strategy
- Beat reporter cultivation
- Reactive commentary positioning

**Persona**:
- Role: VP of Media Relations
- Experience: 15+ years in PR and journalism
- Background: Former journalist, agency and in-house experience
- Certifications: PRSA APR

**Process Integration**:
- media-relations-strategy.js (all phases)
- media-pitching-campaigns.js (all phases)
- press-release-development.js (strategy phases)

---

### AG-002: Press Release Writer Agent
**Slug**: `press-release-writer`
**Category**: Media Relations

**Description**: Specialized agent for newsworthy content creation following AP style.

**Expertise Areas**:
- AP style mastery
- News writing techniques
- Inverted pyramid structure
- Headline writing
- Quote development
- Boilerplate crafting
- Multimedia release creation
- SEO optimization for releases
- Localization and adaptation
- Financial disclosure writing

**Persona**:
- Role: Senior Communications Writer
- Experience: 10+ years in PR and journalism
- Background: Wire service experience, corporate communications
- Specialization: Financial, technology, healthcare writing

**Process Integration**:
- press-release-development.js (all phases)
- investor-communications-support.js (written content)
- csr-communications.js (report writing)

---

### AG-003: Crisis Communications Expert Agent
**Slug**: `crisis-communications-expert`
**Category**: Crisis Communications

**Description**: Specialized crisis management and rapid response expert.

**Expertise Areas**:
- SCCT (Situational Crisis Communication Theory)
- Crisis severity assessment
- Holding statement development
- Stakeholder prioritization in crisis
- Social media crisis management
- Legal/communications coordination
- Reputation recovery strategies
- Image Restoration Theory application
- Executive coaching during crisis
- Post-crisis analysis

**Persona**:
- Role: Crisis Communications Director
- Experience: 12+ years in crisis management
- Background: Agency crisis practice, corporate issues management
- Track record: Major corporate crisis experience

**Process Integration**:
- crisis-communications-plan.js (all phases)
- crisis-response-execution.js (all phases)
- crisis-simulation-training.js (scenario development)
- post-crisis-analysis.js (all phases)

---

### AG-004: Reputation Management Expert Agent
**Slug**: `reputation-management-expert`
**Category**: Reputation Management

**Description**: Expert in reputation monitoring, risk assessment, and recovery.

**Expertise Areas**:
- Reputation audit methodology
- RepTrak and reputation indices
- Stakeholder perception analysis
- Reputation risk mapping
- Early warning indicators
- Competitive reputation benchmarking
- Executive reputation management
- Employer brand reputation
- Online reputation management
- Reputation recovery planning

**Persona**:
- Role: Chief Reputation Officer
- Experience: 15+ years in corporate affairs
- Background: Strategy consulting, corporate communications
- Specialization: Reputation research and measurement

**Process Integration**:
- reputation-monitoring.js (all phases)
- reputation-risk-identification.js (all phases)
- reputation-recovery-strategy.js (all phases)

---

### AG-005: Corporate Communications Strategist Agent
**Slug**: `corporate-communications-strategist`
**Category**: Corporate Communications

**Description**: Strategic corporate messaging and executive communications expert.

**Expertise Areas**:
- Corporate narrative development
- Message architecture frameworks
- Executive positioning
- Thought leadership strategy
- Integrated communications planning
- Brand-corporate alignment
- Purpose and ESG communications
- Annual report messaging
- Corporate milestones communications
- M&A communications

**Persona**:
- Role: Chief Communications Officer
- Experience: 18+ years in corporate communications
- Background: Fortune 500 corporate affairs leadership
- Specialization: Strategic counsel to C-suite

**Process Integration**:
- corporate-messaging-architecture.js (all phases)
- executive-visibility-program.js (strategy phases)
- csr-communications.js (strategy phases)
- annual-report-production.js (messaging phases)

---

### AG-006: Executive Visibility Expert Agent
**Slug**: `executive-visibility-expert`
**Category**: Corporate Communications

**Description**: Thought leadership and executive profile building specialist.

**Expertise Areas**:
- Executive positioning strategy
- Thought leadership platform development
- Speaking opportunity identification
- Bylined article strategy
- Podcast and media appearance preparation
- LinkedIn executive presence
- Book and research publication guidance
- Award positioning
- Executive media training
- Executive social media strategy

**Persona**:
- Role: Executive Communications Director
- Experience: 12+ years in executive visibility
- Background: Agency and in-house executive comms
- Network: Strong speaking bureau and media relationships

**Process Integration**:
- executive-visibility-program.js (all phases)
- media-interview-preparation.js (all phases)
- corporate-messaging-architecture.js (executive voice)

---

### AG-007: Internal Communications Strategist Agent
**Slug**: `internal-communications-strategist`
**Category**: Internal Communications

**Description**: Employee communications and change management expert.

**Expertise Areas**:
- ADKAR change model implementation
- Employee engagement strategies
- Multi-channel internal communications
- Leader communication enablement
- Town hall and all-hands design
- Intranet and digital workplace
- Crisis internal communications
- M&A internal communications
- Employee pulse and feedback
- DEI communications

**Persona**:
- Role: VP of Internal Communications
- Experience: 14+ years in employee communications
- Background: HR communications, change management
- Certifications: Prosci Change Management

**Process Integration**:
- internal-communications-strategy.js (all phases)
- change-management-communications.js (all phases)
- town-hall-event-planning.js (all phases)
- employee-advocacy-program.js (all phases)

---

### AG-008: Stakeholder Engagement Expert Agent
**Slug**: `stakeholder-engagement-expert`
**Category**: Stakeholder Communications

**Description**: Multi-stakeholder relationship and engagement strategy expert.

**Expertise Areas**:
- Stakeholder Salience Model application
- Interest-influence mapping
- Stakeholder segmentation
- Coalition building
- Community relations
- NGO and activist engagement
- Multi-stakeholder dialogue facilitation
- Public consultation processes
- Stakeholder feedback integration
- Relationship measurement

**Persona**:
- Role: Director of Stakeholder Relations
- Experience: 12+ years in stakeholder engagement
- Background: Public affairs, community relations
- Specialization: Multi-stakeholder complex environments

**Process Integration**:
- stakeholder-mapping.js (all phases)
- community-relations-program.js (all phases)
- government-affairs-communications.js (stakeholder engagement)

---

### AG-009: Government Affairs Communications Expert Agent
**Slug**: `government-affairs-expert`
**Category**: Stakeholder Communications

**Description**: Public policy and government relations communications specialist.

**Expertise Areas**:
- Legislative and regulatory tracking
- Policy position development
- Advocacy campaign communications
- Grassroots mobilization
- Coalition communications
- Political stakeholder engagement
- Testimony and comment preparation
- Regulatory affairs communications
- International government relations
- Trade association coordination

**Persona**:
- Role: VP of Government Affairs Communications
- Experience: 15+ years in public affairs
- Background: Government, lobbying, and corporate public affairs
- Network: Strong Capitol Hill and regulatory relationships

**Process Integration**:
- government-affairs-communications.js (all phases)
- stakeholder-mapping.js (government stakeholders)
- reputation-risk-identification.js (political risk)

---

### AG-010: PR Measurement Analyst Agent
**Slug**: `pr-measurement-analyst`
**Category**: Measurement and Analytics

**Description**: PR analytics and measurement framework implementation expert.

**Expertise Areas**:
- Barcelona Principles 3.0 implementation
- AMEC Integrated Evaluation Framework
- Media quality metrics development
- Sentiment analysis interpretation
- Share of voice analysis
- Message pull-through measurement
- Reputation tracking methodology
- ROI and business impact metrics
- Dashboard design and visualization
- Benchmarking and competitive analysis

**Persona**:
- Role: Director of PR Measurement
- Experience: 10+ years in communications research
- Background: Market research, media analytics
- Certifications: AMEC measurement training

**Process Integration**:
- pr-measurement-framework.js (all phases)
- media-coverage-analysis.js (all phases)
- reputation-monitoring.js (metrics phases)

---

### AG-011: Investor Communications Expert Agent
**Slug**: `investor-communications-expert`
**Category**: Stakeholder Communications

**Description**: Financial communications and investor relations specialist.

**Expertise Areas**:
- Earnings communications
- Investor day planning
- Financial disclosure writing
- Analyst and investor targeting
- ESG investor communications
- IPO and transaction communications
- Proxy and governance communications
- Financial media relations
- Investor presentation development
- Shareholder activism response

**Persona**:
- Role: SVP of Investor Relations
- Experience: 15+ years in IR and financial communications
- Background: Sell-side analyst, corporate IR leadership
- Certifications: NIRI certification

**Process Integration**:
- investor-communications-support.js (all phases)
- annual-report-production.js (all phases)
- stakeholder-mapping.js (investor stakeholders)

---

### AG-012: CSR and ESG Communications Expert Agent
**Slug**: `csr-esg-communications-expert`
**Category**: Corporate Communications

**Description**: Sustainability and social responsibility communications specialist.

**Expertise Areas**:
- ESG reporting frameworks (GRI, SASB, TCFD)
- Sustainability storytelling
- Impact measurement communications
- Stakeholder engagement on ESG
- Greenwashing risk mitigation
- Purpose-driven communications
- Corporate citizenship programs
- Sustainability report production
- Employee volunteer communications
- Community investment communications

**Persona**:
- Role: Director of CSR Communications
- Experience: 10+ years in sustainability communications
- Background: NGO, corporate sustainability
- Certifications: GRI-certified professional

**Process Integration**:
- csr-communications.js (all phases)
- annual-report-production.js (ESG sections)
- community-relations-program.js (CSR integration)

---

---

## Process-to-Skill/Agent Mapping

| Process File | Primary Skills | Primary Agents |
|-------------|---------------|----------------|
| media-relations-strategy.js | SK-001, SK-003, SK-010 | AG-001 |
| press-release-development.js | SK-004, SK-011, SK-003 | AG-002, AG-001 |
| media-pitching-campaigns.js | SK-003, SK-001 | AG-001 |
| media-interview-preparation.js | SK-013, SK-003 | AG-006, AG-001 |
| crisis-communications-plan.js | SK-005, SK-002 | AG-003 |
| crisis-response-execution.js | SK-005, SK-002, SK-007 | AG-003 |
| crisis-simulation-training.js | SK-013, SK-005 | AG-003 |
| post-crisis-analysis.js | SK-001, SK-009, SK-005 | AG-003, AG-010 |
| corporate-messaging-architecture.js | SK-011 | AG-005 |
| executive-visibility-program.js | SK-008, SK-003, SK-010 | AG-006, AG-005 |
| csr-communications.js | SK-011, SK-004 | AG-012, AG-005 |
| annual-report-production.js | SK-016, SK-011 | AG-011, AG-012 |
| reputation-monitoring.js | SK-001, SK-002, SK-006, SK-009 | AG-004, AG-010 |
| reputation-risk-identification.js | SK-001, SK-002, SK-006 | AG-004 |
| reputation-recovery-strategy.js | SK-006, SK-001, SK-009 | AG-004, AG-003 |
| stakeholder-mapping.js | SK-012, SK-014 | AG-008 |
| government-affairs-communications.js | SK-014, SK-012 | AG-009, AG-008 |
| community-relations-program.js | SK-012, SK-008 | AG-008 |
| investor-communications-support.js | SK-016, SK-004 | AG-011 |
| internal-communications-strategy.js | SK-007, SK-015 | AG-007 |
| change-management-communications.js | SK-007 | AG-007 |
| town-hall-event-planning.js | SK-007, SK-008 | AG-007 |
| employee-advocacy-program.js | SK-015, SK-007 | AG-007 |
| pr-measurement-framework.js | SK-009, SK-001 | AG-010 |
| media-coverage-analysis.js | SK-001, SK-009 | AG-010, AG-001 |

---

## Shared Candidates

These skills and agents are strong candidates for extraction to a shared library as they apply across multiple specializations.

### Shared Skills

| ID | Skill | Potential Shared Specializations |
|----|-------|----------------------------------|
| SK-001 | Media Monitoring | Digital Marketing, Brand Management |
| SK-002 | Social Listening | Digital Marketing, Customer Experience, Brand Management |
| SK-007 | Internal Communications Platform | Human Resources, Change Management |
| SK-009 | PR Analytics and Reporting | Digital Marketing, Executive Leadership |
| SK-012 | Stakeholder CRM | Customer Experience, Business Strategy |
| SK-015 | Employee Advocacy Platform | Digital Marketing, Human Resources |

### Shared Agents

| ID | Agent | Potential Shared Specializations |
|----|-------|----------------------------------|
| AG-005 | Corporate Communications Strategist | Executive Leadership, Brand Management |
| AG-007 | Internal Communications Strategist | Human Resources, Change Management |
| AG-008 | Stakeholder Engagement Expert | Business Strategy, Sustainability |
| AG-010 | PR Measurement Analyst | Digital Marketing, Marketing Analytics |
| AG-012 | CSR and ESG Communications Expert | Sustainability, Corporate Governance |

---

## Implementation Priority

### Phase 1: Core Monitoring and Media Skills (High Impact)
1. **SK-001**: Media Monitoring - Foundation for all PR measurement
2. **SK-003**: Media Database and Outreach - Core to media relations
3. **SK-004**: Press Release Distribution - Essential for earned media
4. **SK-002**: Social Listening - Critical for reputation awareness

### Phase 2: Core Expert Agents (High Impact)
1. **AG-001**: Media Relations Strategist - Highest media coverage
2. **AG-003**: Crisis Communications Expert - Critical risk mitigation
3. **AG-004**: Reputation Management Expert - Cross-cutting reputation
4. **AG-010**: PR Measurement Analyst - ROI and accountability

### Phase 3: Crisis and Reputation
1. **SK-005**: Crisis Management Platform
2. **SK-006**: Reputation Intelligence
3. **AG-002**: Press Release Writer
4. **AG-005**: Corporate Communications Strategist

### Phase 4: Internal and Stakeholder
1. **SK-007**: Internal Communications Platform
2. **SK-012**: Stakeholder CRM
3. **AG-007**: Internal Communications Strategist
4. **AG-008**: Stakeholder Engagement Expert

### Phase 5: Executive and Specialized
1. **SK-008**: Speaking and Events
2. **SK-010**: Influencer and KOL Management
3. **SK-011**: AP Style and Writing
4. **AG-006**: Executive Visibility Expert
5. **AG-009**: Government Affairs Communications Expert

### Phase 6: Advanced and Integrations
1. **SK-009**: PR Analytics and Reporting
2. **SK-013**: Media Training Simulation
3. **SK-014**: Government Affairs Intelligence
4. **SK-015**: Employee Advocacy Platform
5. **SK-016**: Investor Relations Platform
6. **AG-011**: Investor Communications Expert
7. **AG-012**: CSR and ESG Communications Expert

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Skills Identified | 16 |
| Agents Identified | 12 |
| Shared Skill Candidates | 6 |
| Shared Agent Candidates | 5 |
| Total Processes Covered | 25 |

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 4 - Skills and Agents Identified
**Next Step**: Phase 5 - Implement specialized skills and agents
