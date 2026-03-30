# Human Resources and People Operations - Skills and Agents Backlog

This document identifies specialized skills and agents (subagents) that could enhance the Human Resources processes beyond general-purpose capabilities. These tools would provide domain-specific expertise, automation capabilities, and integration with specialized HR technology platforms.

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
All 24 processes identified in the backlog for this specialization would benefit from specialized skills and agents. While general-purpose agents can execute these workflows, domain-specific optimizations would significantly improve quality, compliance accuracy, and integration with HR technology ecosystems.

### Backlog Processes
1. Full-Cycle Recruiting Process
2. Structured Interview Design
3. Employee Onboarding Program
4. Employer Branding Strategy
5. Goal Setting and OKR Framework
6. Performance Review Cycle
7. 360-Degree Feedback Implementation
8. Performance Improvement Plan (PIP)
9. Continuous Feedback and Check-ins
10. Training Needs Analysis (TNA)
11. Learning Management System (LMS) Implementation
12. Leadership Development Program
13. Succession Planning Process
14. Job Evaluation and Leveling
15. Salary Benchmarking and Market Pricing
16. Benefits Administration and Enrollment
17. Pay Equity Analysis
18. Grievance Handling Process
19. Workplace Investigation Process
20. Employee Exit and Offboarding
21. Workforce Planning and Forecasting
22. Turnover Analysis and Retention Strategy
23. Employee Engagement Survey Process
24. Culture Assessment and Transformation

### Goals
- Provide deep expertise in HR frameworks, employment law, and best practices
- Enable automated ATS and HRIS integration workflows
- Reduce compliance risk through specialized legal and regulatory knowledge
- Improve quality of candidate assessment and performance evaluation
- Integrate with HR technology platforms (Workday, SAP SuccessFactors, BambooHR, etc.)
- Enhance analytics capabilities for workforce insights and planning

---

## Skills Backlog

### SK-001: ATS Integration Skill
**Slug**: `ats-integration`
**Category**: Talent Acquisition

**Description**: Specialized skill for integrating with Applicant Tracking Systems and automating recruitment workflows.

**Capabilities**:
- Parse and standardize job requisitions across ATS platforms
- Extract and normalize candidate data from multiple sources
- Generate ATS-compatible candidate profiles
- Create structured interview scorecards and forms
- Automate candidate status tracking and communication triggers
- Build talent pipeline reports and metrics dashboards
- Support OFCCP/EEO compliance data collection

**Process Integration**:
- Full-Cycle Recruiting Process
- Structured Interview Design
- Employer Branding Strategy

**Dependencies**: ATS APIs (Greenhouse, Lever, Workday Recruiting, iCIMS)

---

### SK-002: Resume Parsing and Screening Skill
**Slug**: `resume-screening`
**Category**: Talent Acquisition

**Description**: Intelligent resume parsing and candidate screening capabilities.

**Capabilities**:
- Parse resumes in multiple formats (PDF, Word, text)
- Extract structured data (skills, experience, education)
- Match candidates against job requirements
- Calculate fit scores based on configurable criteria
- Detect potential red flags (gaps, inconsistencies)
- Generate candidate summaries for hiring managers
- Support bias-reduction through standardized evaluation

**Process Integration**:
- Full-Cycle Recruiting Process
- Structured Interview Design

**Dependencies**: NLP, resume parsing libraries, skills taxonomies

---

### SK-003: Interview Question Generator Skill
**Slug**: `interview-questions`
**Category**: Talent Acquisition

**Description**: Generate competency-based and behavioral interview questions.

**Capabilities**:
- Generate STAR-format behavioral interview questions
- Create competency-based question sets by role
- Build technical assessment frameworks
- Generate interview scorecards with rating criteria
- Create situational judgment questions
- Validate questions for legal compliance
- Adapt questions for different interview stages

**Process Integration**:
- Structured Interview Design
- Full-Cycle Recruiting Process
- Leadership Development Program

**Dependencies**: Competency frameworks, question banks

---

### SK-004: Onboarding Workflow Skill
**Slug**: `onboarding-workflow`
**Category**: Talent Acquisition

**Description**: Automate and manage employee onboarding workflows and checklists.

**Capabilities**:
- Generate role-specific onboarding checklists
- Create preboarding communication sequences
- Build 30-60-90 day plans by position type
- Track onboarding task completion and milestones
- Generate IT provisioning requests
- Create buddy/mentor assignment workflows
- Measure onboarding effectiveness metrics

**Process Integration**:
- Employee Onboarding Program
- Full-Cycle Recruiting Process

**Dependencies**: HRIS integration, task management

---

### SK-005: OKR/Goal Management Skill
**Slug**: `okr-management`
**Category**: Performance Management

**Description**: Manage OKRs and goal setting with alignment and tracking capabilities.

**Capabilities**:
- Create SMART goals from natural language descriptions
- Cascade organizational OKRs to team and individual levels
- Track goal progress and scoring
- Identify alignment gaps between levels
- Generate goal review reports
- Calculate OKR attainment percentages
- Create goal dependency visualizations

**Process Integration**:
- Goal Setting and OKR Framework
- Performance Review Cycle
- Succession Planning Process

**Dependencies**: OKR frameworks, progress tracking

---

### SK-006: Performance Review Generator Skill
**Slug**: `performance-review`
**Category**: Performance Management

**Description**: Generate performance review documentation and facilitate evaluation processes.

**Capabilities**:
- Create self-assessment templates by role
- Generate manager evaluation forms with competencies
- Build calibration session frameworks
- Calculate performance ratings and distributions
- Generate performance summary documents
- Create development recommendation templates
- Track review completion and deadlines

**Process Integration**:
- Performance Review Cycle
- 360-Degree Feedback Implementation
- Performance Improvement Plan (PIP)

**Dependencies**: Competency models, rating scales

---

### SK-007: 360 Feedback Survey Skill
**Slug**: `360-feedback`
**Category**: Performance Management

**Description**: Design, administer, and analyze 360-degree feedback surveys.

**Capabilities**:
- Generate 360 survey questions by competency
- Configure rater groups and anonymity settings
- Calculate aggregate scores and distributions
- Identify blind spots and hidden strengths
- Generate individual feedback reports
- Create development priorities from feedback
- Track response rates and send reminders

**Process Integration**:
- 360-Degree Feedback Implementation
- Leadership Development Program
- Succession Planning Process

**Dependencies**: Survey platforms, statistical analysis

---

### SK-008: PIP Documentation Skill
**Slug**: `pip-documentation`
**Category**: Performance Management

**Description**: Create legally compliant performance improvement plan documentation.

**Capabilities**:
- Generate PIP templates with required elements
- Document performance deficiencies with evidence
- Create SMART improvement goals
- Build support and resource plans
- Track PIP milestones and check-ins
- Generate outcome determination documentation
- Ensure legal compliance and consistency

**Process Integration**:
- Performance Improvement Plan (PIP)
- Performance Review Cycle
- Grievance Handling Process

**Dependencies**: Employment law templates, documentation standards

---

### SK-009: Training Needs Assessment Skill
**Slug**: `training-needs`
**Category**: Learning & Development

**Description**: Analyze skill gaps and prioritize learning investments.

**Capabilities**:
- Conduct skills gap analysis by role
- Aggregate training needs from multiple data sources
- Prioritize learning investments by business impact
- Map competencies to training content
- Calculate training ROI projections
- Generate training curriculum recommendations
- Create skills heat maps by team/department

**Process Integration**:
- Training Needs Analysis (TNA)
- Leadership Development Program
- Succession Planning Process

**Dependencies**: Competency frameworks, skills taxonomies

---

### SK-010: LMS Administration Skill
**Slug**: `lms-admin`
**Category**: Learning & Development

**Description**: Configure and manage Learning Management System operations.

**Capabilities**:
- Create course structures and learning paths
- Configure user enrollments and assignments
- Build compliance training schedules
- Generate completion reports and transcripts
- Track learning analytics and engagement
- Create certificate and credential records
- Manage content libraries and catalogs

**Process Integration**:
- LMS Implementation
- Training Needs Analysis (TNA)
- Leadership Development Program

**Dependencies**: LMS APIs (Cornerstone, Workday Learning, SAP SuccessFactors Learning)

---

### SK-011: Succession Planning Skill
**Slug**: `succession-planning`
**Category**: Learning & Development

**Description**: Identify critical roles and develop succession pipelines.

**Capabilities**:
- Map critical roles and succession risk levels
- Assess internal candidate readiness
- Generate 9-box talent matrices
- Create individual development plans
- Track succession readiness metrics
- Build role-based competency requirements
- Generate succession bench reports

**Process Integration**:
- Succession Planning Process
- Leadership Development Program
- Performance Review Cycle

**Dependencies**: Talent assessment data, competency models

---

### SK-012: Job Evaluation Skill
**Slug**: `job-evaluation`
**Category**: Compensation & Benefits

**Description**: Analyze and evaluate jobs for internal equity and leveling.

**Capabilities**:
- Apply point-factor job evaluation methods
- Create job family and career level frameworks
- Generate job architecture documentation
- Calculate internal equity relationships
- Build job leveling guides and criteria
- Create job description templates
- Map jobs to market survey matches

**Process Integration**:
- Job Evaluation and Leveling
- Salary Benchmarking and Market Pricing
- Succession Planning Process

**Dependencies**: Job evaluation methodologies, career frameworks

---

### SK-013: Compensation Benchmarking Skill
**Slug**: `comp-benchmarking`
**Category**: Compensation & Benefits

**Description**: Analyze market compensation data and establish competitive pay structures.

**Capabilities**:
- Import and analyze salary survey data
- Calculate market percentiles and positioning
- Build salary range structures
- Model compensation scenarios and costs
- Generate market pricing reports
- Create geographic pay differentials
- Track compensation competitiveness trends

**Process Integration**:
- Salary Benchmarking and Market Pricing
- Job Evaluation and Leveling
- Pay Equity Analysis

**Dependencies**: Compensation survey data, market pricing tools

---

### SK-014: Pay Equity Analysis Skill
**Slug**: `pay-equity`
**Category**: Compensation & Benefits

**Description**: Statistical analysis of compensation for equity and compliance.

**Capabilities**:
- Perform regression-based pay equity analysis
- Identify statistically significant pay gaps
- Calculate adjusted and unadjusted pay gaps
- Generate remediation recommendations
- Create pay equity reports for leadership
- Monitor pay equity trends over time
- Support regulatory compliance (EEOC, state laws)

**Process Integration**:
- Pay Equity Analysis
- Salary Benchmarking and Market Pricing
- Grievance Handling Process

**Dependencies**: Statistical libraries, compensation data

---

### SK-015: Benefits Enrollment Skill
**Slug**: `benefits-enrollment`
**Category**: Compensation & Benefits

**Description**: Manage benefits enrollment and administration workflows.

**Capabilities**:
- Generate benefits election forms and guides
- Calculate benefit costs and employee contributions
- Process life event changes
- Create open enrollment communications
- Track enrollment completion and deadlines
- Generate benefits utilization reports
- Validate benefits compliance (ACA, ERISA)

**Process Integration**:
- Benefits Administration and Enrollment
- Employee Onboarding Program
- Employee Exit and Offboarding

**Dependencies**: Benefits administration systems, carrier integrations

---

### SK-016: HR Investigation Skill
**Slug**: `hr-investigation`
**Category**: Employee Relations

**Description**: Support workplace investigation processes with documentation and methodology.

**Capabilities**:
- Create investigation plans and interview guides
- Generate witness interview questions
- Document evidence and findings consistently
- Apply legal standards and burden of proof
- Create investigation summary reports
- Track investigation timelines and milestones
- Ensure procedural consistency

**Process Integration**:
- Workplace Investigation Process
- Grievance Handling Process
- Performance Improvement Plan (PIP)

**Dependencies**: Investigation templates, employment law

---

### SK-017: Exit Interview Analysis Skill
**Slug**: `exit-analysis`
**Category**: Employee Relations

**Description**: Analyze exit interview data and identify retention insights.

**Capabilities**:
- Create exit interview question templates
- Analyze exit data for themes and patterns
- Calculate voluntary turnover drivers
- Generate department-level exit reports
- Identify management and culture issues
- Track exit trends over time
- Create retention recommendation reports

**Process Integration**:
- Employee Exit and Offboarding
- Turnover Analysis and Retention Strategy
- Employee Engagement Survey Process

**Dependencies**: NLP, exit survey data

---

### SK-018: Workforce Planning Skill
**Slug**: `workforce-planning`
**Category**: HR Analytics

**Description**: Forecast workforce needs and plan talent supply strategies.

**Capabilities**:
- Create workforce demand forecasts
- Analyze internal talent supply
- Calculate workforce gaps by skill/role
- Model scenario-based workforce plans
- Generate headcount planning templates
- Build workforce dashboards
- Track workforce planning assumptions

**Process Integration**:
- Workforce Planning and Forecasting
- Succession Planning Process
- Training Needs Analysis (TNA)

**Dependencies**: Workforce data, forecasting models

---

### SK-019: Turnover Analytics Skill
**Slug**: `turnover-analytics`
**Category**: HR Analytics

**Description**: Analyze turnover patterns and develop retention strategies.

**Capabilities**:
- Calculate turnover rates by segment
- Perform survival analysis on tenure
- Build turnover prediction models
- Identify high-risk employees and teams
- Analyze turnover cost impacts
- Generate retention intervention recommendations
- Track retention program effectiveness

**Process Integration**:
- Turnover Analysis and Retention Strategy
- Workforce Planning and Forecasting
- Employee Engagement Survey Process

**Dependencies**: HRIS data, statistical models

---

### SK-020: Engagement Survey Skill
**Slug**: `engagement-survey`
**Category**: HR Analytics

**Description**: Design, administer, and analyze employee engagement surveys.

**Capabilities**:
- Create engagement survey instruments
- Configure survey distribution and anonymity
- Calculate engagement scores and benchmarks
- Identify engagement drivers and detractors
- Generate manager-level action reports
- Track engagement trends over time
- Create action planning templates

**Process Integration**:
- Employee Engagement Survey Process
- Culture Assessment and Transformation
- Turnover Analysis and Retention Strategy

**Dependencies**: Survey platforms, statistical analysis

---

### SK-021: Culture Assessment Skill
**Slug**: `culture-assessment`
**Category**: Organizational Development

**Description**: Assess and measure organizational culture.

**Capabilities**:
- Design culture assessment instruments
- Apply culture framework models (CVF, OCI)
- Analyze current vs. desired culture gaps
- Identify cultural strengths and barriers
- Generate culture diagnostic reports
- Create culture transformation roadmaps
- Track culture change progress

**Process Integration**:
- Culture Assessment and Transformation
- Employee Engagement Survey Process
- Leadership Development Program

**Dependencies**: Culture frameworks, diagnostic tools

---

### SK-022: Employment Law Compliance Skill
**Slug**: `employment-compliance`
**Category**: Compliance

**Description**: Ensure compliance with employment laws and regulations.

**Capabilities**:
- Validate HR documents for legal compliance
- Track regulatory requirements by jurisdiction
- Generate compliance checklists
- Create required notices and postings
- Audit HR practices for compliance gaps
- Calculate FLSA classification determinations
- Support EEO/OFCCP compliance reporting

**Process Integration**:
- All processes (cross-cutting)
- Workplace Investigation Process
- Pay Equity Analysis
- Benefits Administration and Enrollment

**Dependencies**: Employment law databases, regulatory updates

---

---

## Agents Backlog

### AG-001: Talent Acquisition Strategist Agent
**Slug**: `ta-strategist`
**Category**: Talent Acquisition

**Description**: Senior talent acquisition strategist for recruiting strategy and employer branding.

**Expertise Areas**:
- Recruiting strategy development
- Employer brand and EVP creation
- Sourcing channel optimization
- Diversity recruiting programs
- Recruiting metrics and analytics
- Candidate experience design

**Persona**:
- Role: VP of Talent Acquisition
- Experience: 15+ years recruiting leadership
- Background: Multiple scaling organizations

**Process Integration**:
- Full-Cycle Recruiting Process (all phases)
- Employer Branding Strategy (all phases)
- Structured Interview Design (design phases)

---

### AG-002: Technical Recruiter Agent
**Slug**: `technical-recruiter`
**Category**: Talent Acquisition

**Description**: Specialist in technical recruiting and engineering talent acquisition.

**Expertise Areas**:
- Technical skills assessment
- Engineering interview design
- Coding challenge evaluation
- Technical sourcing strategies
- Developer community engagement
- Technical offer negotiation

**Persona**:
- Role: Senior Technical Recruiter
- Experience: 10+ years tech recruiting
- Background: Engineering + recruiting hybrid

**Process Integration**:
- Full-Cycle Recruiting Process (technical roles)
- Structured Interview Design (technical interviews)
- Employee Onboarding Program (technical onboarding)

---

### AG-003: HR Business Partner Agent
**Slug**: `hr-business-partner`
**Category**: HR Generalist

**Description**: Strategic HR business partner for employee lifecycle management.

**Expertise Areas**:
- Business partner consulting
- Performance management coaching
- Employee relations guidance
- Organizational design
- Change management support
- Manager development

**Persona**:
- Role: Senior HR Business Partner
- Experience: 12+ years HRBP experience
- Background: Multiple industries and company stages

**Process Integration**:
- Performance Review Cycle (all phases)
- Goal Setting and OKR Framework (implementation)
- Continuous Feedback and Check-ins (coaching)
- Grievance Handling Process (resolution)

---

### AG-004: Performance Management Expert Agent
**Slug**: `performance-expert`
**Category**: Performance Management

**Description**: Expert in performance management systems and evaluation methodologies.

**Expertise Areas**:
- Performance evaluation design
- Goal setting frameworks (OKR, SMART)
- Calibration session facilitation
- Feedback and coaching techniques
- Performance improvement planning
- Rating and distribution methods

**Persona**:
- Role: Director of Performance Management
- Experience: 10+ years performance systems
- Background: I/O Psychology + HR

**Process Integration**:
- Performance Review Cycle (all phases)
- Goal Setting and OKR Framework (all phases)
- 360-Degree Feedback Implementation (all phases)
- Performance Improvement Plan (PIP) (all phases)

---

### AG-005: Learning and Development Specialist Agent
**Slug**: `learning-specialist`
**Category**: Learning & Development

**Description**: Expert in training design, delivery, and learning technology.

**Expertise Areas**:
- Instructional design principles
- Adult learning theory
- Learning technology platforms
- Leadership development programs
- Training evaluation (Kirkpatrick)
- Skills-based learning design

**Persona**:
- Role: Senior Learning and Development Manager
- Experience: 12+ years L&D
- Background: Instructional design + facilitation

**Process Integration**:
- Training Needs Analysis (TNA) (all phases)
- LMS Implementation (all phases)
- Leadership Development Program (all phases)
- Succession Planning Process (development planning)

---

### AG-006: Total Rewards Strategist Agent
**Slug**: `total-rewards`
**Category**: Compensation & Benefits

**Description**: Expert in compensation strategy, pay equity, and benefits design.

**Expertise Areas**:
- Compensation philosophy development
- Salary structure design
- Market pricing and benchmarking
- Pay equity analysis
- Benefits strategy and design
- Executive compensation

**Persona**:
- Role: Head of Total Rewards
- Experience: 15+ years compensation
- Background: CCP certified, consulting experience

**Process Integration**:
- Job Evaluation and Leveling (all phases)
- Salary Benchmarking and Market Pricing (all phases)
- Pay Equity Analysis (all phases)
- Benefits Administration and Enrollment (strategy)

---

### AG-007: Compensation Analyst Agent
**Slug**: `compensation-analyst`
**Category**: Compensation & Benefits

**Description**: Analytical specialist in compensation data and market pricing.

**Expertise Areas**:
- Salary survey participation
- Market pricing methodology
- Compensation modeling
- Pay equity statistics
- Range development
- Job matching techniques

**Persona**:
- Role: Senior Compensation Analyst
- Experience: 8+ years comp analysis
- Background: Statistics + HR

**Process Integration**:
- Salary Benchmarking and Market Pricing (all phases)
- Pay Equity Analysis (analysis phases)
- Job Evaluation and Leveling (job matching)

---

### AG-008: Employee Relations Investigator Agent
**Slug**: `er-investigator`
**Category**: Employee Relations

**Description**: Expert in workplace investigations and employee relations matters.

**Expertise Areas**:
- Investigation methodology
- Interview techniques
- Evidence evaluation
- Employment law application
- Documentation standards
- Conflict resolution

**Persona**:
- Role: Employee Relations Manager
- Experience: 10+ years ER/investigations
- Background: Employment law + HR

**Process Integration**:
- Workplace Investigation Process (all phases)
- Grievance Handling Process (all phases)
- Performance Improvement Plan (PIP) (documentation)
- Employee Exit and Offboarding (sensitive exits)

---

### AG-009: People Analytics Expert Agent
**Slug**: `people-analytics`
**Category**: HR Analytics

**Description**: Expert in HR analytics, workforce metrics, and predictive modeling.

**Expertise Areas**:
- HR metrics and dashboards
- Workforce planning analytics
- Turnover and retention analysis
- Engagement data analysis
- Predictive modeling
- Data visualization

**Persona**:
- Role: Head of People Analytics
- Experience: 10+ years analytics
- Background: Data science + HR

**Process Integration**:
- Workforce Planning and Forecasting (all phases)
- Turnover Analysis and Retention Strategy (all phases)
- Employee Engagement Survey Process (analysis)
- Performance Review Cycle (calibration data)

---

### AG-010: Workforce Planning Strategist Agent
**Slug**: `workforce-planner`
**Category**: HR Analytics

**Description**: Strategic workforce planning for talent supply and demand alignment.

**Expertise Areas**:
- Workforce demand forecasting
- Talent supply analysis
- Scenario planning
- Headcount budgeting
- Skills gap analysis
- Strategic workforce modeling

**Persona**:
- Role: Director of Workforce Planning
- Experience: 12+ years workforce planning
- Background: Strategy consulting + HR

**Process Integration**:
- Workforce Planning and Forecasting (all phases)
- Succession Planning Process (supply analysis)
- Training Needs Analysis (TNA) (gap analysis)

---

### AG-011: Organizational Development Consultant Agent
**Slug**: `od-consultant`
**Category**: Organizational Development

**Description**: Expert in organizational effectiveness, culture, and change management.

**Expertise Areas**:
- Culture assessment and transformation
- Change management methodologies
- Team effectiveness interventions
- Organizational design
- Leadership assessment
- Strategic alignment facilitation

**Persona**:
- Role: Senior OD Consultant
- Experience: 15+ years OD
- Background: I/O Psychology + consulting

**Process Integration**:
- Culture Assessment and Transformation (all phases)
- Leadership Development Program (assessment)
- Employee Engagement Survey Process (action planning)
- Succession Planning Process (readiness assessment)

---

### AG-012: Employment Law Advisor Agent
**Slug**: `employment-law`
**Category**: Compliance

**Description**: Expert in employment law compliance and HR legal matters.

**Expertise Areas**:
- Federal employment law (FLSA, FMLA, ADA, Title VII)
- State and local employment regulations
- Discrimination and harassment law
- Wage and hour compliance
- Leave and accommodation law
- HR policy development

**Persona**:
- Role: Employment Law Attorney / HR Compliance Director
- Experience: 15+ years employment law
- Background: JD + HR practice

**Process Integration**:
- Workplace Investigation Process (legal guidance)
- Pay Equity Analysis (legal compliance)
- Performance Improvement Plan (PIP) (documentation review)
- Benefits Administration and Enrollment (compliance)

---

### AG-013: DEI Program Manager Agent
**Slug**: `dei-manager`
**Category**: Diversity, Equity & Inclusion

**Description**: Expert in diversity, equity, inclusion, and belonging initiatives.

**Expertise Areas**:
- DEI strategy development
- Inclusive hiring practices
- Bias mitigation techniques
- ERG program management
- Pay equity advocacy
- DEI metrics and reporting

**Persona**:
- Role: Director of DEI
- Experience: 10+ years DEI leadership
- Background: HR + DEI certification

**Process Integration**:
- Full-Cycle Recruiting Process (inclusive hiring)
- Pay Equity Analysis (equity focus)
- Employee Engagement Survey Process (belonging metrics)
- Culture Assessment and Transformation (inclusion culture)

---

### AG-014: Onboarding Coordinator Agent
**Slug**: `onboarding-coordinator`
**Category**: Talent Acquisition

**Description**: Specialist in new hire integration and onboarding program management.

**Expertise Areas**:
- Preboarding communication
- First-week experience design
- 30-60-90 day planning
- Buddy program management
- Onboarding technology
- Onboarding metrics and optimization

**Persona**:
- Role: Onboarding Program Manager
- Experience: 8+ years onboarding
- Background: HR + employee experience

**Process Integration**:
- Employee Onboarding Program (all phases)
- Full-Cycle Recruiting Process (handoff)
- Culture Assessment and Transformation (culture integration)

---

### AG-015: Succession Planning Advisor Agent
**Slug**: `succession-advisor`
**Category**: Talent Management

**Description**: Expert in succession planning and leadership pipeline development.

**Expertise Areas**:
- Critical role identification
- Talent assessment methods
- 9-box talent reviews
- Development planning
- High-potential programs
- Succession readiness evaluation

**Persona**:
- Role: VP of Talent Management
- Experience: 15+ years talent management
- Background: Executive assessment + development

**Process Integration**:
- Succession Planning Process (all phases)
- Leadership Development Program (development planning)
- Performance Review Cycle (talent identification)
- Workforce Planning and Forecasting (pipeline planning)

---

---

## Process-to-Skill/Agent Mapping

| Process | Primary Skills | Primary Agents |
|---------|---------------|----------------|
| Full-Cycle Recruiting Process | SK-001, SK-002, SK-003 | AG-001, AG-002, AG-013 |
| Structured Interview Design | SK-002, SK-003 | AG-001, AG-002, AG-004 |
| Employee Onboarding Program | SK-004, SK-015 | AG-014, AG-003 |
| Employer Branding Strategy | SK-001 | AG-001, AG-013 |
| Goal Setting and OKR Framework | SK-005 | AG-004, AG-003 |
| Performance Review Cycle | SK-005, SK-006 | AG-004, AG-003 |
| 360-Degree Feedback Implementation | SK-007 | AG-004, AG-011 |
| Performance Improvement Plan (PIP) | SK-006, SK-008, SK-022 | AG-004, AG-008, AG-012 |
| Continuous Feedback and Check-ins | SK-005, SK-006 | AG-004, AG-003 |
| Training Needs Analysis (TNA) | SK-009, SK-018 | AG-005, AG-010 |
| LMS Implementation | SK-010 | AG-005 |
| Leadership Development Program | SK-007, SK-009, SK-011 | AG-005, AG-011, AG-015 |
| Succession Planning Process | SK-011, SK-018 | AG-015, AG-010, AG-011 |
| Job Evaluation and Leveling | SK-012, SK-013 | AG-006, AG-007 |
| Salary Benchmarking and Market Pricing | SK-013, SK-014 | AG-006, AG-007 |
| Benefits Administration and Enrollment | SK-015, SK-022 | AG-006, AG-012 |
| Pay Equity Analysis | SK-014, SK-022 | AG-006, AG-007, AG-012, AG-013 |
| Grievance Handling Process | SK-016, SK-022 | AG-008, AG-012 |
| Workplace Investigation Process | SK-016, SK-022 | AG-008, AG-012 |
| Employee Exit and Offboarding | SK-015, SK-017 | AG-003, AG-008 |
| Workforce Planning and Forecasting | SK-018, SK-019 | AG-010, AG-009 |
| Turnover Analysis and Retention Strategy | SK-017, SK-019, SK-020 | AG-009, AG-010 |
| Employee Engagement Survey Process | SK-020, SK-021 | AG-009, AG-011 |
| Culture Assessment and Transformation | SK-021, SK-020 | AG-011, AG-013 |

---

## Shared Candidates

These skills and agents are strong candidates for extraction to a shared library as they apply across multiple specializations.

### Shared Skills

| ID | Skill | Potential Shared Specializations |
|----|-------|----------------------------------|
| SK-005 | OKR/Goal Management | Product Management, Project Management |
| SK-020 | Engagement Survey | Organizational Development, Product Management |
| SK-021 | Culture Assessment | Organizational Development, Change Management |
| SK-022 | Employment Law Compliance | Legal, Risk Management |

### Shared Agents

| ID | Agent | Potential Shared Specializations |
|----|-------|----------------------------------|
| AG-009 | People Analytics Expert | Data Science/ML, Business Intelligence |
| AG-011 | OD Consultant | Change Management, Strategy Consulting |
| AG-012 | Employment Law Advisor | Legal, Risk Management, Compliance |
| AG-013 | DEI Program Manager | All organizational specializations |

---

## Implementation Priority

### Phase 1: Foundation (High Impact)
1. **SK-001**: ATS Integration - Foundation for recruiting automation
2. **SK-006**: Performance Review Generator - Core performance management
3. **SK-022**: Employment Law Compliance - Cross-cutting compliance need
4. **AG-003**: HR Business Partner - Highest process coverage
5. **AG-004**: Performance Management Expert - Core people process

### Phase 2: Talent Acquisition
1. **SK-002**: Resume Parsing and Screening
2. **SK-003**: Interview Question Generator
3. **SK-004**: Onboarding Workflow
4. **AG-001**: Talent Acquisition Strategist
5. **AG-002**: Technical Recruiter
6. **AG-014**: Onboarding Coordinator

### Phase 3: Compensation & Analytics
1. **SK-012**: Job Evaluation
2. **SK-013**: Compensation Benchmarking
3. **SK-014**: Pay Equity Analysis
4. **SK-018**: Workforce Planning
5. **AG-006**: Total Rewards Strategist
6. **AG-007**: Compensation Analyst
7. **AG-009**: People Analytics Expert

### Phase 4: Performance & Development
1. **SK-005**: OKR/Goal Management
2. **SK-007**: 360 Feedback Survey
3. **SK-009**: Training Needs Assessment
4. **SK-011**: Succession Planning
5. **AG-005**: Learning and Development Specialist
6. **AG-015**: Succession Planning Advisor

### Phase 5: Employee Relations & Culture
1. **SK-016**: HR Investigation
2. **SK-017**: Exit Interview Analysis
3. **SK-019**: Turnover Analytics
4. **SK-020**: Engagement Survey
5. **SK-021**: Culture Assessment
6. **AG-008**: Employee Relations Investigator
7. **AG-011**: OD Consultant
8. **AG-012**: Employment Law Advisor
9. **AG-013**: DEI Program Manager

### Phase 6: Specialized Tools
1. **SK-008**: PIP Documentation
2. **SK-010**: LMS Administration
3. **SK-015**: Benefits Enrollment
4. **AG-010**: Workforce Planning Strategist

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Skills Identified | 22 |
| Agents Identified | 15 |
| Shared Skill Candidates | 4 |
| Shared Agent Candidates | 4 |
| Total Processes Covered | 24 |

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 4 - Skills and Agents Identified
**Next Step**: Phase 5 - Implement specialized skills and agents
