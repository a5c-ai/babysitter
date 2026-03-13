# Business Strategy and Operations - Skills and Agents Backlog

This document identifies specialized skills and agents (subagents) that could enhance the Business Strategy processes beyond general-purpose capabilities. These tools would provide domain-specific expertise, automation capabilities, and integration with specialized strategic planning methodologies.

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
All 26 implemented processes in this specialization currently use the `general-purpose` agent for task execution. While functional, this approach lacks domain-specific optimizations that specialized skills and agents could provide for strategic analysis, business planning, and corporate development activities.

### Implemented Processes

#### Strategic Analysis Processes
1. `swot-analysis.js` - Systematic SWOT evaluation with TOWS strategies
2. `porters-five-forces.js` - Industry competitive dynamics analysis
3. `pestel-analysis.js` - Macro-environmental scanning
4. `scenario-planning.js` - Multiple future scenarios development
5. `competitive-intelligence.js` - Competitor and market intelligence gathering

#### Business Model and Value Creation Processes
6. `business-model-canvas.js` - Nine building blocks business model design
7. `value-proposition-design.js` - Customer-centric value proposition
8. `blue-ocean-strategy.js` - Value innovation and market creation
9. `core-competency-assessment.js` - Organizational capabilities analysis

#### Strategic Planning and Execution Processes
10. `annual-strategic-planning.js` - End-to-end strategic planning cycle
11. `okr-development.js` - OKR framework implementation
12. `balanced-scorecard.js` - Four-perspective performance management
13. `strategy-map-creation.js` - Visual strategy articulation
14. `strategic-initiative-portfolio.js` - Initiative prioritization and governance

#### Operational Excellence Processes
15. `lean-process-optimization.js` - Lean principles application
16. `six-sigma-dmaic.js` - Data-driven quality improvement
17. `business-process-reengineering.js` - Radical process redesign
18. `value-stream-mapping.js` - End-to-end flow visualization

#### Change Management and Transformation Processes
19. `kotter-change-management.js` - 8-step change leadership
20. `digital-transformation-roadmap.js` - Technology-enabled transformation
21. `operating-model-redesign.js` - Organizational structure redesign

#### Mergers, Acquisitions, and Growth Processes
22. `ma-target-screening.js` - Acquisition target identification
23. `due-diligence-framework.js` - Comprehensive transaction investigation
24. `post-merger-integration.js` - Integration planning and execution
25. `growth-strategy-ansoff.js` - Ansoff matrix growth evaluation

#### Business Case and Decision Support Processes
26. `business-case-development.js` - Investment proposal methodology

### Goals
- Provide deep expertise in strategic management frameworks and methodologies
- Enable automated competitive intelligence and market research synthesis
- Reduce context-switching overhead for domain-specific strategic analysis
- Improve quality of financial modeling and scenario analysis
- Integrate with strategy execution and performance management tools

---

## Skills Backlog

### SK-001: SWOT/TOWS Analysis Skill
**Slug**: `swot-tows-analysis`
**Category**: Strategic Analysis

**Description**: Specialized skill for systematic SWOT analysis and TOWS strategy generation.

**Capabilities**:
- Structured strengths assessment across capability dimensions
- Systematic weakness identification with root cause analysis
- External opportunity scanning with timing assessment
- Threat analysis with likelihood-impact scoring
- TOWS matrix strategy generation (SO, WO, ST, WT)
- Weighted SWOT scoring methodology
- Cross-factor relationship identification
- Strategic posture determination (offensive/defensive)

**Process Integration**:
- swot-analysis.js (all phases)
- competitive-intelligence.js (SWOT inputs)
- annual-strategic-planning.js (situation analysis)
- scenario-planning.js (SWOT per scenario)

**Dependencies**: Strategic analysis frameworks, scoring algorithms

---

### SK-002: Porter's Five Forces Calculator Skill
**Slug**: `five-forces-calculator`
**Category**: Industry Analysis

**Description**: Automated industry attractiveness analysis using Porter's framework.

**Capabilities**:
- Entry barrier assessment with scoring
- Supplier power evaluation across dimensions
- Buyer power analysis by segment
- Substitute threat identification and scoring
- Competitive rivalry intensity measurement
- Industry attractiveness score calculation
- Force trend analysis over time
- Industry lifecycle stage determination
- Profit pool mapping

**Process Integration**:
- porters-five-forces.js (all phases)
- competitive-intelligence.js (industry context)
- blue-ocean-strategy.js (industry analysis)
- ma-target-screening.js (industry evaluation)

**Dependencies**: Industry databases, scoring frameworks

---

### SK-003: PESTEL Environmental Scanning Skill
**Slug**: `pestel-scanning`
**Category**: Macro Analysis

**Description**: Comprehensive macro-environmental factor analysis and monitoring.

**Capabilities**:
- Political factor tracking and impact assessment
- Economic indicator analysis and forecasting
- Social trend identification and demographics analysis
- Technology disruption monitoring
- Environmental/ESG factor evaluation
- Legal and regulatory change tracking
- Cross-factor dependency mapping
- Scenario trigger identification
- Geographic variation analysis

**Process Integration**:
- pestel-analysis.js (all phases)
- scenario-planning.js (driving forces)
- annual-strategic-planning.js (environmental scan)
- digital-transformation-roadmap.js (technology factors)

**Dependencies**: News APIs, regulatory databases, economic data sources

---

### SK-004: Scenario Planning Skill
**Slug**: `scenario-planning`
**Category**: Strategic Foresight

**Description**: Structured scenario development and strategic option analysis.

**Capabilities**:
- Focal question formulation and refinement
- Driving forces identification and categorization
- Critical uncertainties selection and ranking
- Scenario matrix/axes construction
- Narrative scenario development
- Scenario implication analysis
- Robust strategy identification
- Early warning indicator definition
- Scenario probability assessment

**Process Integration**:
- scenario-planning.js (all phases)
- annual-strategic-planning.js (scenario inputs)
- pestel-analysis.js (scenario development)
- digital-transformation-roadmap.js (future scenarios)

**Dependencies**: Foresight methodologies, trend databases

---

### SK-005: Competitive Intelligence Aggregation Skill
**Slug**: `competitive-intel`
**Category**: Market Intelligence

**Description**: Systematic competitor monitoring and intelligence synthesis.

**Capabilities**:
- Competitor identification and categorization
- Profile compilation from public sources
- Product/service feature comparison matrices
- Pricing strategy analysis
- Go-to-market strategy inference
- Leadership and organizational tracking
- M&A activity monitoring
- Strategic move prediction
- Competitive threat assessment
- Win/loss analysis synthesis

**Process Integration**:
- competitive-intelligence.js (all phases)
- porters-five-forces.js (rivalry analysis)
- blue-ocean-strategy.js (current canvas)
- swot-analysis.js (competitive inputs)

**Dependencies**: Web scraping, news APIs, company databases

---

### SK-006: Business Model Canvas Generator Skill
**Slug**: `bmc-generator`
**Category**: Business Design

**Description**: Structured business model design and documentation.

**Capabilities**:
- Customer segment identification and prioritization
- Value proposition articulation per segment
- Channel design across customer journey
- Customer relationship type definition
- Revenue stream modeling
- Key resource identification
- Key activity mapping
- Partnership strategy development
- Cost structure analysis
- Canvas coherence validation
- Business model pattern recognition

**Process Integration**:
- business-model-canvas.js (all phases)
- value-proposition-design.js (VP section)
- blue-ocean-strategy.js (new model design)
- growth-strategy-ansoff.js (model variations)

**Dependencies**: Business model templates, canvas visualization

---

### SK-007: Value Proposition Design Skill
**Slug**: `vpd-design`
**Category**: Customer Value

**Description**: Customer-centric value proposition development using jobs-to-be-done.

**Capabilities**:
- Customer jobs identification (functional, social, emotional)
- Pain point mapping and severity assessment
- Gain identification and relevance scoring
- Profile prioritization methodology
- Product/service design for job completion
- Pain reliever effectiveness assessment
- Gain creator impact evaluation
- Problem-solution fit scoring
- Value proposition statement generation
- Fit gap analysis and iteration recommendations

**Process Integration**:
- value-proposition-design.js (all phases)
- business-model-canvas.js (VP section)
- blue-ocean-strategy.js (value innovation)
- competitive-intelligence.js (VP comparison)

**Dependencies**: JTBD frameworks, customer research synthesis

---

### SK-008: Blue Ocean Strategy Skill
**Slug**: `blue-ocean-strategy`
**Category**: Market Creation

**Description**: Value innovation and market space creation analysis.

**Capabilities**:
- Strategy canvas creation and visualization
- Competing factors identification
- Three tiers of non-customer analysis
- Six Paths Framework application
- Four Actions Framework (ERRC grid)
- New value curve design
- Buyer utility mapping
- Strategic pricing corridor analysis
- Target costing from strategic price
- Adoption hurdle assessment
- Tipping point leadership application

**Process Integration**:
- blue-ocean-strategy.js (all phases)
- competitive-intelligence.js (current state)
- value-proposition-design.js (value innovation)
- business-model-canvas.js (new model)

**Dependencies**: Blue Ocean tools, visualization libraries

---

### SK-009: OKR Development and Tracking Skill
**Slug**: `okr-framework`
**Category**: Goal Setting

**Description**: Objectives and Key Results framework implementation and management.

**Capabilities**:
- Company-level OKR formulation
- Team OKR cascading methodology
- OKR quality scoring (SMART validation)
- Alignment mapping and visualization
- Progress scoring methodology (0.0-1.0)
- Check-in cadence design
- OKR anti-pattern detection
- Confidence interval tracking
- OKR retrospective facilitation
- Cross-team dependency identification

**Process Integration**:
- okr-development.js (all phases)
- balanced-scorecard.js (measure alignment)
- annual-strategic-planning.js (goal setting)
- strategy-map-creation.js (objective linkage)

**Dependencies**: OKR platforms, scoring algorithms

---

### SK-010: Balanced Scorecard Design Skill
**Slug**: `balanced-scorecard`
**Category**: Performance Management

**Description**: Four-perspective performance management system design.

**Capabilities**:
- Financial perspective objective development
- Customer perspective objective development
- Internal process perspective design
- Learning and growth perspective design
- Strategy map creation with cause-effect links
- Measure and target definition
- Leading vs lagging indicator balancing
- Initiative-objective alignment
- Scorecard cascading framework
- Performance reporting design

**Process Integration**:
- balanced-scorecard.js (all phases)
- strategy-map-creation.js (visualization)
- okr-development.js (measure alignment)
- annual-strategic-planning.js (measurement)

**Dependencies**: BSC methodology, visualization tools

---

### SK-011: Financial Modeling Skill
**Slug**: `financial-modeling`
**Category**: Financial Analysis

**Description**: Strategic financial analysis and business case modeling.

**Capabilities**:
- DCF valuation modeling
- NPV/IRR calculation
- Sensitivity analysis
- Scenario-based financial projections
- Synergy quantification
- Revenue model development
- Cost structure analysis
- Unit economics calculation
- ROI analysis
- Payback period analysis
- Financial ratio analysis

**Process Integration**:
- business-case-development.js (all phases)
- ma-target-screening.js (valuation)
- due-diligence-framework.js (financial DD)
- growth-strategy-ansoff.js (financial assessment)

**Dependencies**: Financial calculation libraries, Excel integration

---

### SK-012: M&A Analysis Skill
**Slug**: `ma-analysis`
**Category**: Corporate Development

**Description**: Mergers and acquisitions strategic analysis and evaluation.

**Capabilities**:
- Target screening criteria development
- Strategic fit assessment scoring
- Financial attractiveness analysis
- Integration feasibility evaluation
- Synergy identification and quantification
- Deal structure recommendations
- Valuation methodology selection
- Comparable transaction analysis
- Due diligence checklist generation
- Integration planning frameworks

**Process Integration**:
- ma-target-screening.js (all phases)
- due-diligence-framework.js (DD support)
- post-merger-integration.js (integration planning)
- competitive-intelligence.js (target research)

**Dependencies**: Deal databases, financial data sources

---

### SK-013: Process Improvement Skill
**Slug**: `process-improvement`
**Category**: Operational Excellence

**Description**: Lean, Six Sigma, and process optimization methodologies.

**Capabilities**:
- Value stream mapping and visualization
- Waste identification (8 types of muda)
- Process cycle time analysis
- DMAIC methodology application
- Root cause analysis (5 Whys, Fishbone)
- Statistical process control
- Kaizen event facilitation
- Process capability analysis
- Bottleneck identification
- Continuous improvement metrics

**Process Integration**:
- lean-process-optimization.js (all phases)
- six-sigma-dmaic.js (all phases)
- value-stream-mapping.js (all phases)
- business-process-reengineering.js (current state)

**Dependencies**: Process mapping tools, statistical libraries

---

### SK-014: Change Management Skill
**Slug**: `change-management`
**Category**: Transformation

**Description**: Organizational change planning and execution support.

**Capabilities**:
- Change readiness assessment
- Stakeholder impact analysis
- Resistance identification and mitigation
- Kotter 8-step implementation
- ADKAR model application
- Communication plan development
- Training needs assessment
- Change adoption metrics
- Sustainability planning
- Cultural alignment assessment

**Process Integration**:
- kotter-change-management.js (all phases)
- digital-transformation-roadmap.js (change aspects)
- operating-model-redesign.js (change management)
- post-merger-integration.js (cultural integration)

**Dependencies**: Change frameworks, assessment tools

---

### SK-015: Strategy Visualization Skill
**Slug**: `strategy-viz`
**Category**: Communication

**Description**: Strategic artifact visualization and presentation generation.

**Capabilities**:
- Strategy map visualization
- Strategy canvas generation
- Roadmap visualization (timeline, Now-Next-Later)
- SWOT matrix formatting
- Porter's Five Forces diagram
- Business Model Canvas layout
- Value proposition canvas
- OKR cascade visualization
- Balanced Scorecard dashboard
- Initiative portfolio view

**Process Integration**:
- strategy-map-creation.js (visualization)
- balanced-scorecard.js (dashboard)
- blue-ocean-strategy.js (strategy canvas)
- annual-strategic-planning.js (roadmaps)

**Dependencies**: Visualization libraries, export formats

---

### SK-016: Market Sizing Skill
**Slug**: `market-sizing`
**Category**: Market Analysis

**Description**: TAM/SAM/SOM calculation and market opportunity assessment.

**Capabilities**:
- Top-down market sizing
- Bottom-up market sizing
- TAM/SAM/SOM calculation
- Market segmentation analysis
- Growth rate projection
- Penetration rate estimation
- Market share analysis
- Addressable market validation
- Industry benchmark comparison
- Market opportunity scoring

**Process Integration**:
- competitive-intelligence.js (market size)
- growth-strategy-ansoff.js (market assessment)
- ma-target-screening.js (market evaluation)
- business-case-development.js (opportunity sizing)

**Dependencies**: Market research databases, industry reports

---

### SK-017: Strategic Initiative Prioritization Skill
**Slug**: `initiative-prioritization`
**Category**: Portfolio Management

**Description**: Strategic initiative evaluation and resource allocation.

**Capabilities**:
- Initiative scoring framework (value vs effort)
- Resource requirement estimation
- Dependency mapping and sequencing
- Portfolio balancing analysis
- Risk-adjusted prioritization
- Capacity constraint modeling
- Quick win identification
- Strategic alignment scoring
- Initiative portfolio optimization
- Trade-off analysis

**Process Integration**:
- strategic-initiative-portfolio.js (all phases)
- annual-strategic-planning.js (initiative selection)
- balanced-scorecard.js (initiative alignment)
- okr-development.js (initiative mapping)

**Dependencies**: Portfolio management tools, optimization algorithms

---

### SK-018: Digital Maturity Assessment Skill
**Slug**: `digital-maturity`
**Category**: Digital Transformation

**Description**: Organizational digital capability assessment and gap analysis.

**Capabilities**:
- Digital maturity model application
- Capability assessment across dimensions
- Industry benchmark comparison
- Gap analysis and prioritization
- Technology stack evaluation
- Data maturity assessment
- Digital culture evaluation
- Innovation capability scoring
- Digital skills gap analysis
- Roadmap recommendation generation

**Process Integration**:
- digital-transformation-roadmap.js (all phases)
- operating-model-redesign.js (digital capabilities)
- core-competency-assessment.js (digital competencies)
- annual-strategic-planning.js (digital strategy)

**Dependencies**: Maturity models, benchmark databases

---

### SK-019: Ansoff Growth Strategy Skill
**Slug**: `ansoff-growth`
**Category**: Growth Strategy

**Description**: Growth strategy evaluation using Ansoff matrix and related frameworks.

**Capabilities**:
- Market penetration opportunity analysis
- Market development assessment
- Product development evaluation
- Diversification risk analysis
- Growth option scoring
- Risk-adjusted growth projections
- Resource requirement estimation
- Growth pathway sequencing
- Organic vs inorganic growth analysis
- Growth initiative portfolio design

**Process Integration**:
- growth-strategy-ansoff.js (all phases)
- ma-target-screening.js (inorganic growth)
- blue-ocean-strategy.js (market creation)
- annual-strategic-planning.js (growth planning)

**Dependencies**: Growth frameworks, market data

---

### SK-020: Core Competency Analysis Skill
**Slug**: `core-competency`
**Category**: Capability Analysis

**Description**: Organizational capability and core competency assessment.

**Capabilities**:
- Core competency identification
- Prahalad-Hamel criteria application
- VRIO/VRIN analysis
- Competitive advantage assessment
- Capability gap analysis
- Competency sustainability evaluation
- Strategic importance scoring
- Capability development roadmap
- Make vs buy vs partner analysis
- Resource-based view analysis

**Process Integration**:
- core-competency-assessment.js (all phases)
- swot-analysis.js (strengths analysis)
- ma-target-screening.js (capability fit)
- operating-model-redesign.js (capability design)

**Dependencies**: Capability frameworks, assessment tools

---

---

## Agents Backlog

### AG-001: Chief Strategy Officer Agent
**Slug**: `chief-strategy-officer`
**Category**: Strategy Leadership

**Description**: Senior executive-level strategic planning and decision-making expertise.

**Expertise Areas**:
- Corporate strategy development
- Strategic vision articulation
- Portfolio strategy and resource allocation
- Strategic trade-off analysis
- Board-level strategic communication
- Long-term strategic planning (3-10 years)
- Strategic risk management
- Competitive positioning strategy

**Persona**:
- Role: Chief Strategy Officer / SVP Strategy
- Experience: 20+ years strategic planning leadership
- Background: Top-tier consulting + C-suite experience

**Process Integration**:
- annual-strategic-planning.js (all phases)
- swot-analysis.js (strategic implications)
- scenario-planning.js (robust strategies)
- strategy-map-creation.js (strategy articulation)

---

### AG-002: Competitive Intelligence Analyst Agent
**Slug**: `competitive-intel-analyst`
**Category**: Market Intelligence

**Description**: Expert in competitive analysis and market intelligence gathering.

**Expertise Areas**:
- Competitor profiling and monitoring
- Market dynamics analysis
- Competitive move prediction
- Industry trend analysis
- Win/loss analysis
- Competitive response strategy
- Market positioning analysis
- Strategic group mapping

**Persona**:
- Role: Director of Competitive Intelligence
- Experience: 12+ years competitive intelligence
- Background: Strategy consulting + market research

**Process Integration**:
- competitive-intelligence.js (all phases)
- porters-five-forces.js (rivalry analysis)
- swot-analysis.js (external analysis)
- blue-ocean-strategy.js (current canvas)

---

### AG-003: Industry Analyst Agent
**Slug**: `industry-analyst`
**Category**: Industry Analysis

**Description**: Expert in industry structure, dynamics, and attractiveness assessment.

**Expertise Areas**:
- Industry structure analysis
- Porter's Five Forces application
- Industry lifecycle assessment
- Industry trend identification
- Profit pool analysis
- Industry value chain analysis
- Regulatory impact assessment
- Technology disruption analysis

**Persona**:
- Role: Senior Industry Analyst
- Experience: 15+ years industry research
- Background: Equity research + consulting

**Process Integration**:
- porters-five-forces.js (all phases)
- pestel-analysis.js (industry context)
- competitive-intelligence.js (industry dynamics)
- ma-target-screening.js (industry evaluation)

---

### AG-004: Strategic Foresight Expert Agent
**Slug**: `strategic-foresight`
**Category**: Foresight

**Description**: Specialist in scenario planning and strategic foresight methodologies.

**Expertise Areas**:
- Scenario planning facilitation
- Driving forces identification
- Uncertainty analysis
- Future trend scanning
- Early warning indicator design
- Robust strategy development
- Wild card and black swan analysis
- Horizon scanning

**Persona**:
- Role: Director of Strategic Foresight
- Experience: 15+ years foresight practice
- Background: Shell scenario planning tradition

**Process Integration**:
- scenario-planning.js (all phases)
- pestel-analysis.js (trend analysis)
- annual-strategic-planning.js (scenario inputs)
- digital-transformation-roadmap.js (future scenarios)

---

### AG-005: Business Model Innovation Expert Agent
**Slug**: `business-model-innovator`
**Category**: Business Design

**Description**: Expert in business model design, innovation, and transformation.

**Expertise Areas**:
- Business Model Canvas methodology
- Value Proposition Design
- Business model patterns
- Revenue model innovation
- Platform business models
- Ecosystem design
- Business model validation
- Lean startup methodology

**Persona**:
- Role: Business Model Innovation Lead
- Experience: 12+ years business model design
- Background: Strategyzer certified, innovation consulting

**Process Integration**:
- business-model-canvas.js (all phases)
- value-proposition-design.js (all phases)
- blue-ocean-strategy.js (model innovation)
- growth-strategy-ansoff.js (model variations)

---

### AG-006: Blue Ocean Strategist Agent
**Slug**: `blue-ocean-strategist`
**Category**: Market Creation

**Description**: Expert in Blue Ocean Strategy and value innovation methodologies.

**Expertise Areas**:
- Strategy canvas analysis
- Four Actions Framework (ERRC)
- Six Paths Framework
- Non-customer analysis
- Value innovation
- Buyer utility mapping
- Strategic pricing
- Tipping point leadership

**Persona**:
- Role: Blue Ocean Strategy Consultant
- Experience: 10+ years Blue Ocean practice
- Background: INSEAD Blue Ocean Institute trained

**Process Integration**:
- blue-ocean-strategy.js (all phases)
- competitive-intelligence.js (red ocean analysis)
- value-proposition-design.js (value innovation)
- business-model-canvas.js (new model)

---

### AG-007: OKR and Performance Management Expert Agent
**Slug**: `okr-expert`
**Category**: Goal Setting

**Description**: Expert in OKR methodology and performance management systems.

**Expertise Areas**:
- OKR framework implementation
- Goal alignment and cascading
- Key result formulation
- Progress tracking methodology
- OKR coaching and facilitation
- Balanced Scorecard integration
- Performance review facilitation
- Goal anti-pattern identification

**Persona**:
- Role: OKR Coach / Performance Consultant
- Experience: 10+ years OKR practice
- Background: John Doerr methodology trained

**Process Integration**:
- okr-development.js (all phases)
- balanced-scorecard.js (alignment)
- annual-strategic-planning.js (goal setting)
- strategy-map-creation.js (objective mapping)

---

### AG-008: Balanced Scorecard Expert Agent
**Slug**: `bsc-expert`
**Category**: Performance Management

**Description**: Expert in Balanced Scorecard design and strategy execution.

**Expertise Areas**:
- Four perspective design
- Strategy map creation
- Measure selection and definition
- Target setting methodology
- Initiative alignment
- Scorecard cascading
- Strategic review facilitation
- Strategy-focused organization

**Persona**:
- Role: Balanced Scorecard Consultant
- Experience: 15+ years BSC practice
- Background: Kaplan-Norton Balanced Scorecard Collaborative

**Process Integration**:
- balanced-scorecard.js (all phases)
- strategy-map-creation.js (all phases)
- annual-strategic-planning.js (measurement)
- okr-development.js (integration)

---

### AG-009: M&A Strategy Expert Agent
**Slug**: `ma-strategist`
**Category**: Corporate Development

**Description**: Expert in mergers, acquisitions, and corporate development strategy.

**Expertise Areas**:
- M&A strategy development
- Target identification and screening
- Strategic fit assessment
- Synergy analysis
- Deal structuring
- Due diligence oversight
- Integration planning
- Portfolio optimization

**Persona**:
- Role: VP Corporate Development / M&A Director
- Experience: 15+ years M&A experience
- Background: Investment banking + corporate development

**Process Integration**:
- ma-target-screening.js (all phases)
- due-diligence-framework.js (strategic DD)
- post-merger-integration.js (planning)
- growth-strategy-ansoff.js (inorganic options)

---

### AG-010: Due Diligence Expert Agent
**Slug**: `due-diligence-expert`
**Category**: Transaction Analysis

**Description**: Expert in comprehensive due diligence across all functional areas.

**Expertise Areas**:
- Financial due diligence
- Commercial due diligence
- Operational due diligence
- Legal/regulatory DD coordination
- Technology due diligence
- HR/cultural due diligence
- Risk identification
- Deal breaker identification

**Persona**:
- Role: Due Diligence Lead / Transaction Advisor
- Experience: 12+ years DD experience
- Background: Big Four transaction services

**Process Integration**:
- due-diligence-framework.js (all phases)
- ma-target-screening.js (preliminary DD)
- post-merger-integration.js (DD findings)
- business-case-development.js (investment DD)

---

### AG-011: Post-Merger Integration Expert Agent
**Slug**: `pmi-expert`
**Category**: Integration

**Description**: Expert in post-merger integration planning and execution.

**Expertise Areas**:
- Integration strategy and approach
- Day 1 readiness planning
- Synergy capture planning
- Cultural integration
- Organizational design post-merger
- IT systems integration
- Customer retention strategies
- Communication planning

**Persona**:
- Role: PMI Program Director
- Experience: 15+ years integration experience
- Background: Multiple large-scale integrations

**Process Integration**:
- post-merger-integration.js (all phases)
- due-diligence-framework.js (integration planning)
- kotter-change-management.js (change aspects)
- operating-model-redesign.js (org design)

---

### AG-012: Lean/Six Sigma Expert Agent
**Slug**: `lean-six-sigma`
**Category**: Operational Excellence

**Description**: Expert in Lean, Six Sigma, and continuous improvement methodologies.

**Expertise Areas**:
- Lean principles and tools
- Six Sigma DMAIC methodology
- Value stream mapping
- Root cause analysis
- Statistical process control
- Kaizen facilitation
- Waste elimination
- Process capability analysis

**Persona**:
- Role: Lean Six Sigma Master Black Belt
- Experience: 15+ years process improvement
- Background: Toyota Production System + Six Sigma certification

**Process Integration**:
- lean-process-optimization.js (all phases)
- six-sigma-dmaic.js (all phases)
- value-stream-mapping.js (all phases)
- business-process-reengineering.js (methodology)

---

### AG-013: Change Management Expert Agent
**Slug**: `change-expert`
**Category**: Transformation

**Description**: Expert in organizational change management and transformation.

**Expertise Areas**:
- Kotter 8-step change model
- ADKAR methodology
- Change readiness assessment
- Stakeholder management
- Resistance management
- Communication planning
- Training and enablement
- Sustainability planning

**Persona**:
- Role: Chief Transformation Officer / Change Lead
- Experience: 15+ years change management
- Background: Prosci certified, large transformation experience

**Process Integration**:
- kotter-change-management.js (all phases)
- digital-transformation-roadmap.js (change aspects)
- operating-model-redesign.js (change management)
- post-merger-integration.js (cultural change)

---

### AG-014: Digital Transformation Strategist Agent
**Slug**: `digital-transformation`
**Category**: Digital Strategy

**Description**: Expert in digital transformation strategy and execution.

**Expertise Areas**:
- Digital maturity assessment
- Digital strategy development
- Technology architecture planning
- Data strategy
- Digital operating model
- Innovation and experimentation
- Digital capability building
- Agile transformation

**Persona**:
- Role: Chief Digital Officer / Digital Strategy Lead
- Experience: 15+ years digital transformation
- Background: Technology + business strategy hybrid

**Process Integration**:
- digital-transformation-roadmap.js (all phases)
- operating-model-redesign.js (digital aspects)
- core-competency-assessment.js (digital capabilities)
- annual-strategic-planning.js (digital strategy)

---

### AG-015: Financial Strategist Agent
**Slug**: `financial-strategist`
**Category**: Financial Analysis

**Description**: Expert in strategic finance, valuation, and business case development.

**Expertise Areas**:
- Valuation methodologies
- Financial modeling
- Business case development
- Investment analysis
- Capital allocation
- Portfolio optimization
- Financial risk assessment
- Shareholder value creation

**Persona**:
- Role: VP Finance / Strategic Finance Director
- Experience: 15+ years strategic finance
- Background: Investment banking + corporate finance

**Process Integration**:
- business-case-development.js (all phases)
- ma-target-screening.js (valuation)
- due-diligence-framework.js (financial DD)
- annual-strategic-planning.js (financial planning)

---

### AG-016: Operating Model Expert Agent
**Slug**: `operating-model-expert`
**Category**: Organization Design

**Description**: Expert in operating model design and organizational transformation.

**Expertise Areas**:
- Operating model frameworks
- Organizational structure design
- Process architecture
- Governance design
- Role and responsibility definition
- Capability mapping
- Sourcing strategy
- Performance management design

**Persona**:
- Role: Operating Model Consultant / Org Design Lead
- Experience: 12+ years organization design
- Background: Strategy consulting (operating model practice)

**Process Integration**:
- operating-model-redesign.js (all phases)
- digital-transformation-roadmap.js (operating model)
- post-merger-integration.js (org design)
- core-competency-assessment.js (capability design)

---

### AG-017: Growth Strategist Agent
**Slug**: `growth-strategist`
**Category**: Growth Strategy

**Description**: Expert in growth strategy development and execution.

**Expertise Areas**:
- Ansoff matrix application
- Organic growth strategy
- Inorganic growth evaluation
- Market expansion strategy
- Product portfolio strategy
- Geographic expansion
- Diversification strategy
- Growth initiative prioritization

**Persona**:
- Role: VP Growth Strategy / Growth Lead
- Experience: 12+ years growth strategy
- Background: Strategy consulting + business development

**Process Integration**:
- growth-strategy-ansoff.js (all phases)
- ma-target-screening.js (inorganic growth)
- blue-ocean-strategy.js (market creation)
- annual-strategic-planning.js (growth planning)

---

### AG-018: Risk Analyst Agent
**Slug**: `risk-analyst`
**Category**: Risk Management

**Description**: Expert in strategic and operational risk assessment.

**Expertise Areas**:
- Strategic risk identification
- Risk assessment methodology
- Risk mitigation planning
- Scenario risk analysis
- Competitive risk assessment
- Operational risk evaluation
- Risk monitoring framework
- Risk appetite definition

**Persona**:
- Role: Chief Risk Officer / Strategic Risk Director
- Experience: 15+ years risk management
- Background: Enterprise risk management

**Process Integration**:
- swot-analysis.js (threat analysis)
- scenario-planning.js (risk scenarios)
- due-diligence-framework.js (risk DD)
- business-case-development.js (risk assessment)

---

### AG-019: Macro-Economist Agent
**Slug**: `macro-economist`
**Category**: Economic Analysis

**Description**: Expert in macroeconomic analysis and impact assessment.

**Expertise Areas**:
- Economic indicator analysis
- GDP and growth forecasting
- Interest rate and monetary policy
- Currency and exchange rate analysis
- Inflation and price dynamics
- Labor market analysis
- Industry economic drivers
- Geographic economic analysis

**Persona**:
- Role: Chief Economist / Economic Advisor
- Experience: 15+ years economic analysis
- Background: Central bank + corporate economics

**Process Integration**:
- pestel-analysis.js (economic factors)
- scenario-planning.js (economic scenarios)
- annual-strategic-planning.js (economic assumptions)
- ma-target-screening.js (economic context)

---

### AG-020: Political Risk Analyst Agent
**Slug**: `political-risk`
**Category**: Political Analysis

**Description**: Expert in political risk assessment and geopolitical analysis.

**Expertise Areas**:
- Political stability assessment
- Regulatory change prediction
- Government policy analysis
- Geopolitical risk evaluation
- Trade policy impact
- Country risk assessment
- Political stakeholder mapping
- Sanctions and compliance

**Persona**:
- Role: Political Risk Advisor / Geopolitical Analyst
- Experience: 12+ years political risk
- Background: Government affairs + risk consulting

**Process Integration**:
- pestel-analysis.js (political factors)
- scenario-planning.js (political scenarios)
- ma-target-screening.js (country risk)
- competitive-intelligence.js (regulatory context)

---

---

## Process-to-Skill/Agent Mapping

| Process File | Primary Skills | Primary Agents |
|-------------|---------------|----------------|
| swot-analysis.js | SK-001, SK-005, SK-015 | AG-001, AG-002, AG-018 |
| porters-five-forces.js | SK-002, SK-016 | AG-003, AG-002 |
| pestel-analysis.js | SK-003, SK-004 | AG-019, AG-020, AG-004 |
| scenario-planning.js | SK-004, SK-003 | AG-004, AG-001 |
| competitive-intelligence.js | SK-005, SK-016, SK-001 | AG-002, AG-003 |
| business-model-canvas.js | SK-006, SK-007, SK-011 | AG-005, AG-015 |
| value-proposition-design.js | SK-007, SK-006 | AG-005, AG-006 |
| blue-ocean-strategy.js | SK-008, SK-007, SK-005 | AG-006, AG-005 |
| core-competency-assessment.js | SK-020, SK-001 | AG-001, AG-016 |
| annual-strategic-planning.js | SK-001, SK-017, SK-015 | AG-001, AG-007 |
| okr-development.js | SK-009, SK-010 | AG-007, AG-008 |
| balanced-scorecard.js | SK-010, SK-009, SK-015 | AG-008, AG-007 |
| strategy-map-creation.js | SK-015, SK-010 | AG-008, AG-001 |
| strategic-initiative-portfolio.js | SK-017, SK-011 | AG-001, AG-015 |
| lean-process-optimization.js | SK-013 | AG-012 |
| six-sigma-dmaic.js | SK-013 | AG-012 |
| business-process-reengineering.js | SK-013, SK-020 | AG-012, AG-016 |
| value-stream-mapping.js | SK-013 | AG-012 |
| kotter-change-management.js | SK-014 | AG-013 |
| digital-transformation-roadmap.js | SK-018, SK-014, SK-017 | AG-014, AG-013, AG-016 |
| operating-model-redesign.js | SK-020, SK-014 | AG-016, AG-013 |
| ma-target-screening.js | SK-012, SK-005, SK-011, SK-016 | AG-009, AG-015, AG-002 |
| due-diligence-framework.js | SK-012, SK-011 | AG-010, AG-009, AG-015 |
| post-merger-integration.js | SK-012, SK-014 | AG-011, AG-013 |
| growth-strategy-ansoff.js | SK-019, SK-016, SK-012 | AG-017, AG-009 |
| business-case-development.js | SK-011, SK-016, SK-017 | AG-015, AG-001 |

---

## Shared Candidates

These skills and agents are strong candidates for extraction to a shared library as they apply across multiple specializations.

### Shared Skills

| ID | Skill | Potential Shared Specializations |
|----|-------|----------------------------------|
| SK-005 | Competitive Intelligence | Product Management, Software Architecture |
| SK-011 | Financial Modeling | Product Management, Data Science/ML |
| SK-013 | Process Improvement | DevOps/SRE, QA Testing |
| SK-014 | Change Management | All organizational transformation contexts |
| SK-015 | Strategy Visualization | Product Management, Technical Documentation |
| SK-016 | Market Sizing | Product Management |
| SK-017 | Strategic Initiative Prioritization | Product Management, Software Architecture |
| SK-018 | Digital Maturity Assessment | DevOps/SRE, Software Architecture |

### Shared Agents

| ID | Agent | Potential Shared Specializations |
|----|-------|----------------------------------|
| AG-001 | Chief Strategy Officer | Product Management (executive strategy) |
| AG-012 | Lean/Six Sigma Expert | DevOps/SRE, QA Testing |
| AG-013 | Change Management Expert | All transformation specializations |
| AG-014 | Digital Transformation Strategist | DevOps/SRE, Software Architecture |
| AG-015 | Financial Strategist | Product Management (business cases) |
| AG-019 | Macro-Economist | All business-facing specializations |

---

## Implementation Priority

### Phase 1: Core Strategic Analysis (High Impact)
1. **SK-001**: SWOT/TOWS Analysis - Foundation for situation analysis
2. **SK-005**: Competitive Intelligence - Cross-cutting market need
3. **SK-011**: Financial Modeling - Essential for all business decisions
4. **AG-001**: Chief Strategy Officer - Highest process coverage
5. **AG-002**: Competitive Intelligence Analyst - Foundation for external analysis

### Phase 2: Strategic Frameworks (High Impact)
1. **SK-002**: Porter's Five Forces Calculator - Core industry analysis
2. **SK-006**: Business Model Canvas Generator - Business design foundation
3. **SK-009**: OKR Framework - Goal setting and alignment
4. **AG-005**: Business Model Innovation Expert - Business design expertise
5. **AG-007**: OKR and Performance Management Expert - Execution support

### Phase 3: Planning and Execution
1. **SK-003**: PESTEL Environmental Scanning
2. **SK-004**: Scenario Planning
3. **SK-010**: Balanced Scorecard Design
4. **AG-004**: Strategic Foresight Expert
5. **AG-008**: Balanced Scorecard Expert

### Phase 4: Transformation and Operations
1. **SK-013**: Process Improvement
2. **SK-014**: Change Management
3. **SK-018**: Digital Maturity Assessment
4. **AG-012**: Lean/Six Sigma Expert
5. **AG-013**: Change Management Expert
6. **AG-014**: Digital Transformation Strategist

### Phase 5: Corporate Development and Growth
1. **SK-012**: M&A Analysis
2. **SK-019**: Ansoff Growth Strategy
3. **SK-016**: Market Sizing
4. **AG-009**: M&A Strategy Expert
5. **AG-010**: Due Diligence Expert
6. **AG-011**: Post-Merger Integration Expert
7. **AG-017**: Growth Strategist

### Phase 6: Specialized Analysis
1. **SK-007**: Value Proposition Design
2. **SK-008**: Blue Ocean Strategy
3. **SK-020**: Core Competency Analysis
4. **AG-006**: Blue Ocean Strategist
5. **AG-016**: Operating Model Expert
6. **AG-018**: Risk Analyst
7. **AG-019**: Macro-Economist
8. **AG-020**: Political Risk Analyst

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Skills Identified | 20 |
| Agents Identified | 20 |
| Shared Skill Candidates | 8 |
| Shared Agent Candidates | 6 |
| Total Processes Covered | 26 |

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 4 - Skills and Agents Identified
**Next Step**: Phase 5 - Implement specialized skills and agents
