# Sales Specialization - Skills & Agents Backlog

This document catalogs specialized skills and agents (subagents) that would enhance the Sales processes beyond general-purpose capabilities.

---

## Skills Backlog

### CRM Integration Skills

#### 1. salesforce-connector
- **Purpose**: Bi-directional Salesforce CRM integration
- **Capabilities**:
  - SOQL query execution and data retrieval
  - Lead, Contact, Account, Opportunity CRUD operations
  - Custom object access and field mapping
  - Bulk data operations with governor limit handling
  - Real-time webhook event handling
  - Report and dashboard data extraction
- **Enhances Processes**: crm-data-quality, lead-routing-assignment, opportunity-stage-management, pipeline-review-forecast
- **Priority**: P0 (Critical)
- **Integration Points**: Salesforce REST API, Bulk API 2.0, Streaming API

#### 2. hubspot-connector
- **Purpose**: HubSpot CRM and Marketing Hub integration
- **Capabilities**:
  - Contact and company data synchronization
  - Deal pipeline management
  - Marketing automation data access
  - Email engagement tracking
  - Sequence and workflow triggering
- **Enhances Processes**: sales-marketing-alignment, lead-qualification-scoring, lead-routing-assignment
- **Priority**: P1 (High)
- **Integration Points**: HubSpot API v3

#### 3. dynamics365-connector
- **Purpose**: Microsoft Dynamics 365 Sales integration
- **Capabilities**:
  - Entity data management (accounts, contacts, opportunities)
  - Business process flow interaction
  - Power Platform integration
  - Azure AD authentication handling
- **Enhances Processes**: crm-data-quality, opportunity-stage-management, strategic-account-planning
- **Priority**: P1 (High)
- **Integration Points**: Dynamics 365 Web API, OData

#### 4. pipedrive-connector
- **Purpose**: Pipedrive CRM integration for SMB sales teams
- **Capabilities**:
  - Deal and pipeline management
  - Activity tracking and automation
  - Lead inbox management
  - Custom field handling
- **Enhances Processes**: opportunity-stage-management, pipeline-review-forecast
- **Priority**: P2 (Medium)

---

### Lead Intelligence & Enrichment Skills

#### 5. clearbit-enrichment
- **Purpose**: Company and contact data enrichment via Clearbit
- **Capabilities**:
  - Company firmographic data lookup
  - Contact information enrichment
  - Tech stack identification
  - Funding and employee growth data
- **Enhances Processes**: lead-qualification-scoring, lead-routing-assignment, territory-design-assignment
- **Priority**: P1 (High)
- **Integration Points**: Clearbit Enrichment API, Reveal API

#### 6. zoominfo-enrichment
- **Purpose**: B2B intelligence and contact data via ZoomInfo
- **Capabilities**:
  - Contact and company search
  - Intent data signals
  - Org chart mapping
  - Technographic data
- **Enhances Processes**: lead-qualification-scoring, strategic-account-planning, account-expansion-upsell
- **Priority**: P1 (High)

#### 7. apollo-prospecting
- **Purpose**: Apollo.io prospecting and engagement data
- **Capabilities**:
  - Contact database search
  - Email sequence engagement metrics
  - Buying intent signals
  - Account scoring data
- **Enhances Processes**: lead-routing-assignment, lead-qualification-scoring
- **Priority**: P2 (Medium)

#### 8. 6sense-intent
- **Purpose**: 6sense intent data and account identification
- **Capabilities**:
  - Anonymous buyer identification
  - Intent topic tracking
  - Account engagement scoring
  - Predictive analytics data
- **Enhances Processes**: lead-qualification-scoring, account-expansion-upsell, customer-health-monitoring
- **Priority**: P1 (High)

---

### Sales Analytics & Forecasting Skills

#### 9. clari-forecasting
- **Purpose**: Clari revenue operations platform integration
- **Capabilities**:
  - AI-powered forecast data retrieval
  - Pipeline inspection analytics
  - Deal activity signals
  - Forecast scenario modeling
- **Enhances Processes**: revenue-forecasting-planning, pipeline-review-forecast, deal-risk-assessment
- **Priority**: P0 (Critical)
- **Integration Points**: Clari API

#### 10. gong-conversation-intelligence
- **Purpose**: Gong.io conversation analytics integration
- **Capabilities**:
  - Call recording transcription access
  - Deal risk signals extraction
  - Competitor mention tracking
  - Talk ratio and sentiment analysis
  - Coaching moment identification
- **Enhances Processes**: win-loss-analysis, competitive-battle-cards, sales-methodology-training, deal-risk-assessment
- **Priority**: P0 (Critical)
- **Integration Points**: Gong API

#### 11. chorus-analytics
- **Purpose**: Chorus.ai (ZoomInfo) conversation intelligence
- **Capabilities**:
  - Meeting intelligence data
  - Deal momentum indicators
  - Rep performance analytics
  - Keyword and topic tracking
- **Enhances Processes**: win-loss-analysis, new-hire-onboarding-ramp, sales-playbook-development
- **Priority**: P1 (High)

#### 12. tableau-analytics
- **Purpose**: Tableau dashboard and visualization integration
- **Capabilities**:
  - Dashboard data extraction
  - Workbook query execution
  - Embedded analytics integration
  - Custom visualization generation
- **Enhances Processes**: qbr-process, pipeline-review-forecast, territory-design-assignment
- **Priority**: P2 (Medium)

---

### Sales Engagement Skills

#### 13. outreach-sequences
- **Purpose**: Outreach.io sales engagement platform integration
- **Capabilities**:
  - Sequence enrollment and management
  - Email and call task automation
  - A/B test results retrieval
  - Rep activity tracking
- **Enhances Processes**: lead-routing-assignment, new-hire-onboarding-ramp, sales-playbook-development
- **Priority**: P1 (High)

#### 14. salesloft-cadences
- **Purpose**: SalesLoft cadence and engagement integration
- **Capabilities**:
  - Cadence management and enrollment
  - Email template performance
  - Call recording access
  - Meeting scheduling automation
- **Enhances Processes**: lead-routing-assignment, sales-methodology-training
- **Priority**: P1 (High)

#### 15. calendly-scheduling
- **Purpose**: Calendly meeting scheduling integration
- **Capabilities**:
  - Meeting type management
  - Availability optimization
  - Round-robin assignment
  - No-show tracking
- **Enhances Processes**: lead-routing-assignment, qbr-process
- **Priority**: P2 (Medium)

---

### Document & Proposal Skills

#### 16. pandadoc-proposals
- **Purpose**: PandaDoc document automation integration
- **Capabilities**:
  - Proposal template management
  - Document generation from data
  - E-signature status tracking
  - Pricing table automation
- **Enhances Processes**: value-selling-roi, strategic-account-planning, account-expansion-upsell
- **Priority**: P1 (High)

#### 17. docusign-contracts
- **Purpose**: DocuSign contract and e-signature integration
- **Capabilities**:
  - Envelope creation and management
  - Signing status monitoring
  - Template field mapping
  - CLM integration
- **Enhances Processes**: deal-risk-assessment, opportunity-stage-management
- **Priority**: P1 (High)

#### 18. conga-cpq
- **Purpose**: Conga CPQ (Configure-Price-Quote) integration
- **Capabilities**:
  - Product configuration
  - Dynamic pricing rules
  - Quote document generation
  - Approval workflow triggering
- **Enhances Processes**: value-selling-roi, compensation-plan-design, quota-setting-allocation
- **Priority**: P2 (Medium)

---

### Competitive Intelligence Skills

#### 19. crayon-competitive
- **Purpose**: Crayon competitive intelligence platform
- **Capabilities**:
  - Competitor tracking alerts
  - Battlecard content retrieval
  - Win/loss data aggregation
  - Market movement signals
- **Enhances Processes**: competitive-battle-cards, win-loss-analysis, sales-playbook-development
- **Priority**: P1 (High)

#### 20. klue-battlecards
- **Purpose**: Klue competitive enablement integration
- **Capabilities**:
  - Dynamic battlecard access
  - Compete alerts
  - Sales feedback collection
  - Competitive positioning data
- **Enhances Processes**: competitive-battle-cards, challenger-sale-teaching
- **Priority**: P1 (High)

---

### Customer Success Skills

#### 21. gainsight-cs
- **Purpose**: Gainsight customer success platform integration
- **Capabilities**:
  - Health score retrieval
  - Timeline activity access
  - Success plan management
  - Risk and opportunity signals
- **Enhances Processes**: customer-health-monitoring, account-expansion-upsell, strategic-account-planning, qbr-process
- **Priority**: P0 (Critical)

#### 22. totango-health
- **Purpose**: Totango customer health and engagement
- **Capabilities**:
  - SuccessBLOC data access
  - Health indicators retrieval
  - Campaign enrollment
  - Segment management
- **Enhances Processes**: customer-health-monitoring, account-expansion-upsell
- **Priority**: P2 (Medium)

#### 23. churnzero-signals
- **Purpose**: ChurnZero churn prediction and engagement
- **Capabilities**:
  - Real-time usage data
  - Churn risk scoring
  - Playbook automation
  - NPS and CSAT data
- **Enhances Processes**: customer-health-monitoring, deal-risk-assessment
- **Priority**: P2 (Medium)

---

### Territory & Quota Planning Skills

#### 24. xactly-compensation
- **Purpose**: Xactly incentive compensation management
- **Capabilities**:
  - Commission calculation
  - Plan modeling and simulation
  - Quota attainment tracking
  - SPM analytics
- **Enhances Processes**: compensation-plan-design, quota-setting-allocation, territory-design-assignment
- **Priority**: P1 (High)

#### 25. anaplan-planning
- **Purpose**: Anaplan connected planning platform
- **Capabilities**:
  - Territory modeling
  - Quota allocation scenarios
  - Headcount planning
  - Revenue planning models
- **Enhances Processes**: territory-design-assignment, quota-setting-allocation, revenue-forecasting-planning
- **Priority**: P1 (High)

#### 26. varicent-icm
- **Purpose**: Varicent (IBM) incentive compensation
- **Capabilities**:
  - Plan administration
  - Commission calculations
  - Territory management
  - Performance analytics
- **Enhances Processes**: compensation-plan-design, quota-setting-allocation
- **Priority**: P2 (Medium)

---

### Learning & Enablement Skills

#### 27. seismic-enablement
- **Purpose**: Seismic sales enablement platform
- **Capabilities**:
  - Content recommendation
  - Buyer engagement analytics
  - Learning path management
  - Content performance data
- **Enhances Processes**: sales-playbook-development, new-hire-onboarding-ramp, competitive-battle-cards
- **Priority**: P1 (High)

#### 28. highspot-content
- **Purpose**: Highspot sales enablement integration
- **Capabilities**:
  - Content search and delivery
  - Pitch analytics
  - Training content access
  - Guided selling plays
- **Enhances Processes**: sales-playbook-development, sales-methodology-training, challenger-sale-teaching
- **Priority**: P1 (High)

#### 29. lessonly-training
- **Purpose**: Lessonly (Seismic Learning) training platform
- **Capabilities**:
  - Lesson assignment and tracking
  - Practice recording review
  - Certification management
  - Coaching feedback
- **Enhances Processes**: sales-methodology-training, new-hire-onboarding-ramp
- **Priority**: P2 (Medium)

#### 30. mindtickle-readiness
- **Purpose**: Mindtickle sales readiness platform
- **Capabilities**:
  - Readiness scoring
  - Role-play assessment
  - Certification tracking
  - Content engagement analytics
- **Enhances Processes**: sales-methodology-training, new-hire-onboarding-ramp, sales-playbook-development
- **Priority**: P2 (Medium)

---

### Data Quality & Enrichment Skills

#### 31. dun-bradstreet-data
- **Purpose**: D&B data quality and firmographic enrichment
- **Capabilities**:
  - DUNS number lookup
  - Company hierarchy mapping
  - Financial risk data
  - Industry classification
- **Enhances Processes**: crm-data-quality, lead-qualification-scoring, territory-design-assignment
- **Priority**: P1 (High)

#### 32. ringlead-dedup
- **Purpose**: RingLead data quality and deduplication
- **Capabilities**:
  - Duplicate detection and merge
  - Data normalization
  - Lead-to-account matching
  - Data routing rules
- **Enhances Processes**: crm-data-quality, lead-routing-assignment
- **Priority**: P2 (Medium)

---

## Agents Backlog

### Sales Methodology Agents

#### 1. spin-coach-agent
- **Purpose**: SPIN Selling methodology coaching and guidance
- **Capabilities**:
  - Situation/Problem/Implication/Need-payoff question generation
  - Call preparation and review
  - Discovery question sequencing
  - Methodology adherence scoring
- **Enhances Processes**: spin-selling-discovery
- **Priority**: P1 (High)
- **Model Requirements**: Strong conversational reasoning, sales domain knowledge

#### 2. challenger-coach-agent
- **Purpose**: Challenger Sale methodology implementation
- **Capabilities**:
  - Commercial teaching moment identification
  - Reframe narrative development
  - Tension introduction guidance
  - Value messaging refinement
- **Enhances Processes**: challenger-sale-teaching
- **Priority**: P1 (High)
- **Model Requirements**: Persuasion modeling, insight generation

#### 3. meddpicc-qualifier-agent
- **Purpose**: MEDDPICC qualification assessment and coaching
- **Capabilities**:
  - Qualification criteria evaluation
  - Gap identification and remediation
  - Champion development coaching
  - Decision criteria analysis
- **Enhances Processes**: meddpicc-qualification
- **Priority**: P0 (Critical)
- **Model Requirements**: Structured assessment, multi-factor analysis

#### 4. sandler-coach-agent
- **Purpose**: Sandler Pain Funnel methodology guidance
- **Capabilities**:
  - Pain point exploration techniques
  - Budget qualification scripting
  - Up-front contract coaching
  - Negative reverse selling patterns
- **Enhances Processes**: sandler-pain-funnel
- **Priority**: P2 (Medium)

#### 5. value-engineer-agent
- **Purpose**: ROI and value quantification specialist
- **Capabilities**:
  - Business case development
  - ROI model creation
  - TCO analysis
  - Value driver identification
- **Enhances Processes**: value-selling-roi
- **Priority**: P0 (Critical)
- **Model Requirements**: Financial modeling, business analysis

---

### Pipeline & Forecasting Agents

#### 6. deal-inspector-agent
- **Purpose**: Deep deal health and risk assessment
- **Capabilities**:
  - Multi-signal deal analysis
  - Stakeholder mapping evaluation
  - Timeline risk assessment
  - Competitive position analysis
- **Enhances Processes**: deal-risk-assessment, pipeline-review-forecast
- **Priority**: P0 (Critical)
- **Model Requirements**: Pattern recognition, risk modeling

#### 7. forecast-analyst-agent
- **Purpose**: Revenue forecasting and scenario modeling
- **Capabilities**:
  - Statistical forecast modeling
  - Variance analysis and explanation
  - Scenario simulation
  - Commit accuracy tracking
- **Enhances Processes**: revenue-forecasting-planning, pipeline-review-forecast
- **Priority**: P0 (Critical)
- **Model Requirements**: Statistical analysis, time series

#### 8. pipeline-optimizer-agent
- **Purpose**: Pipeline health optimization recommendations
- **Capabilities**:
  - Coverage ratio analysis
  - Stage velocity optimization
  - Conversion rate improvement
  - Pipeline gap identification
- **Enhances Processes**: opportunity-stage-management, pipeline-review-forecast
- **Priority**: P1 (High)

#### 9. win-loss-analyst-agent
- **Purpose**: Win/loss pattern analysis and insights
- **Capabilities**:
  - Root cause analysis
  - Competitive pattern identification
  - Rep performance correlation
  - Product feedback synthesis
- **Enhances Processes**: win-loss-analysis
- **Priority**: P1 (High)
- **Model Requirements**: Pattern analysis, qualitative synthesis

---

### Account Management Agents

#### 10. account-strategist-agent
- **Purpose**: Strategic account planning and execution
- **Capabilities**:
  - Account whitespace analysis
  - Stakeholder influence mapping
  - Multi-threaded engagement planning
  - Account growth strategy
- **Enhances Processes**: strategic-account-planning, account-expansion-upsell
- **Priority**: P0 (Critical)
- **Model Requirements**: Strategic planning, relationship modeling

#### 11. customer-health-agent
- **Purpose**: Customer health monitoring and intervention
- **Capabilities**:
  - Multi-signal health scoring
  - Churn risk prediction
  - Intervention recommendation
  - Renewal probability modeling
- **Enhances Processes**: customer-health-monitoring
- **Priority**: P0 (Critical)
- **Model Requirements**: Predictive modeling, signal aggregation

#### 12. expansion-hunter-agent
- **Purpose**: Upsell and cross-sell opportunity identification
- **Capabilities**:
  - Usage pattern analysis for expansion signals
  - Cross-sell propensity scoring
  - Expansion timing optimization
  - Business case development for upgrades
- **Enhances Processes**: account-expansion-upsell
- **Priority**: P1 (High)

#### 13. qbr-facilitator-agent
- **Purpose**: QBR preparation and facilitation support
- **Capabilities**:
  - Executive summary generation
  - Value delivered quantification
  - Roadmap alignment analysis
  - Action item tracking
- **Enhances Processes**: qbr-process
- **Priority**: P1 (High)

---

### Sales Operations Agents

#### 14. territory-designer-agent
- **Purpose**: Data-driven territory design and optimization
- **Capabilities**:
  - TAM/SAM analysis
  - Account distribution balancing
  - Coverage optimization modeling
  - Fair share calculation
- **Enhances Processes**: territory-design-assignment
- **Priority**: P1 (High)
- **Model Requirements**: Optimization algorithms, geospatial analysis

#### 15. quota-analyst-agent
- **Purpose**: Quota setting and allocation optimization
- **Capabilities**:
  - Quota attainment modeling
  - Bottoms-up vs top-down reconciliation
  - Fairness index calculation
  - Seasonality adjustment
- **Enhances Processes**: quota-setting-allocation
- **Priority**: P1 (High)
- **Model Requirements**: Statistical modeling, fairness analysis

#### 16. comp-designer-agent
- **Purpose**: Compensation plan design and modeling
- **Capabilities**:
  - Pay mix optimization
  - Accelerator curve design
  - Plan modeling and simulation
  - Competitive benchmarking analysis
- **Enhances Processes**: compensation-plan-design
- **Priority**: P1 (High)
- **Model Requirements**: Incentive modeling, behavioral economics

#### 17. data-steward-agent
- **Purpose**: CRM data quality management and remediation
- **Capabilities**:
  - Data completeness assessment
  - Duplicate detection and resolution
  - Data decay identification
  - Field standardization
- **Enhances Processes**: crm-data-quality
- **Priority**: P1 (High)

#### 18. lead-router-agent
- **Purpose**: Intelligent lead routing and assignment
- **Capabilities**:
  - Multi-factor routing logic
  - Capacity-aware assignment
  - Round-robin with weighting
  - Exception handling
- **Enhances Processes**: lead-routing-assignment
- **Priority**: P1 (High)
- **Model Requirements**: Rule engine, optimization

---

### Sales Enablement Agents

#### 19. playbook-author-agent
- **Purpose**: Sales playbook creation and maintenance
- **Capabilities**:
  - Best practice extraction
  - Objection handling synthesis
  - Competitive messaging development
  - Use case documentation
- **Enhances Processes**: sales-playbook-development
- **Priority**: P1 (High)
- **Model Requirements**: Content synthesis, sales domain expertise

#### 20. battlecard-creator-agent
- **Purpose**: Competitive battle card generation and updates
- **Capabilities**:
  - SWOT analysis synthesis
  - Talk track development
  - Trap question generation
  - Win theme identification
- **Enhances Processes**: competitive-battle-cards
- **Priority**: P1 (High)

#### 21. onboarding-coach-agent
- **Purpose**: New hire ramp optimization and coaching
- **Capabilities**:
  - Learning path personalization
  - Milestone progress tracking
  - Knowledge gap identification
  - Buddy/mentor matching
- **Enhances Processes**: new-hire-onboarding-ramp
- **Priority**: P1 (High)

#### 22. methodology-trainer-agent
- **Purpose**: Sales methodology training delivery and certification
- **Capabilities**:
  - Curriculum customization
  - Role-play scenario generation
  - Certification assessment
  - Reinforcement scheduling
- **Enhances Processes**: sales-methodology-training
- **Priority**: P1 (High)

---

### Revenue Operations Agents

#### 23. alignment-facilitator-agent
- **Purpose**: Sales-Marketing alignment and SLA management
- **Capabilities**:
  - Lead definition alignment
  - SLA monitoring and reporting
  - Feedback loop facilitation
  - Shared metric tracking
- **Enhances Processes**: sales-marketing-alignment
- **Priority**: P1 (High)

#### 24. lead-scorer-agent
- **Purpose**: Advanced lead scoring and prioritization
- **Capabilities**:
  - Multi-factor scoring models
  - Predictive lead scoring
  - Fit vs intent analysis
  - Score calibration
- **Enhances Processes**: lead-qualification-scoring, lead-routing-assignment
- **Priority**: P0 (Critical)
- **Model Requirements**: ML scoring, propensity modeling

#### 25. revenue-planner-agent
- **Purpose**: Comprehensive revenue planning and modeling
- **Capabilities**:
  - Annual planning facilitation
  - Scenario modeling
  - Gap-to-plan analysis
  - Investment recommendation
- **Enhances Processes**: revenue-forecasting-planning
- **Priority**: P1 (High)

---

## Shared/Cross-Cutting Candidates

These skills and agents have broad applicability across the sales domain and potentially other domains:

### Skills for Consideration as Shared
1. **salesforce-connector** - CRM integration is broadly applicable
2. **clearbit-enrichment** - Data enrichment across sales, marketing, success
3. **gong-conversation-intelligence** - Conversation analytics for any customer-facing role
4. **gainsight-cs** - Customer success metrics span sales and CS
5. **pandadoc-proposals** - Document automation for any business process
6. **docusign-contracts** - E-signature across legal, sales, HR
7. **tableau-analytics** - Analytics visualization broadly applicable

### Agents for Consideration as Shared
1. **value-engineer-agent** - ROI/business case development across sales, marketing, CS
2. **data-steward-agent** - Data quality applicable to any CRM-using function
3. **forecast-analyst-agent** - Forecasting patterns applicable beyond sales
4. **playbook-author-agent** - Playbook creation for any enablement function

---

## Implementation Priority Matrix

| Priority | Skills | Agents |
|----------|--------|--------|
| P0 (Critical) | salesforce-connector, clari-forecasting, gong-conversation-intelligence, gainsight-cs | meddpicc-qualifier-agent, value-engineer-agent, deal-inspector-agent, forecast-analyst-agent, account-strategist-agent, customer-health-agent, lead-scorer-agent |
| P1 (High) | hubspot-connector, dynamics365-connector, clearbit-enrichment, zoominfo-enrichment, 6sense-intent, chorus-analytics, outreach-sequences, salesloft-cadences, pandadoc-proposals, docusign-contracts, crayon-competitive, klue-battlecards, xactly-compensation, anaplan-planning, seismic-enablement, highspot-content, dun-bradstreet-data | spin-coach-agent, challenger-coach-agent, pipeline-optimizer-agent, win-loss-analyst-agent, expansion-hunter-agent, qbr-facilitator-agent, territory-designer-agent, quota-analyst-agent, comp-designer-agent, data-steward-agent, lead-router-agent, playbook-author-agent, battlecard-creator-agent, onboarding-coach-agent, methodology-trainer-agent, alignment-facilitator-agent, revenue-planner-agent |
| P2 (Medium) | pipedrive-connector, apollo-prospecting, tableau-analytics, calendly-scheduling, conga-cpq, totango-health, churnzero-signals, varicent-icm, lessonly-training, mindtickle-readiness, ringlead-dedup | sandler-coach-agent |

---

## Summary Statistics

- **Total Skills**: 32
- **Total Agents**: 25
- **Shared Candidates**: 11 (7 skills + 4 agents)
- **P0 Priority Items**: 4 skills + 7 agents = 11
- **P1 Priority Items**: 21 skills + 17 agents = 38
- **P2 Priority Items**: 7 skills + 1 agent = 8
