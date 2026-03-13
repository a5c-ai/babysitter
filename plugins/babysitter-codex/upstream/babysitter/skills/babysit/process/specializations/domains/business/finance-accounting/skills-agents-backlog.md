# Finance, Accounting, and Economics - Skills and Agents Backlog (Phase 4)

## Overview

This backlog identifies specialized skills and agents that could enhance the Finance, Accounting, and Economics processes beyond general-purpose capabilities. Each skill or agent is designed to provide domain-specific tooling, validation, or automation for financial workflows.

## Summary Statistics

- **Total Skills Identified**: 28
- **Total Agents Identified**: 22
- **Shared Candidates (Cross-Specialization)**: 9
- **Categories**: 7 (Financial Modeling, Accounting/Compliance, Tax, Treasury, Investment Analysis, Audit, Economic Analysis)

---

## Skills

### Financial Modeling Skills

#### 1. dcf-valuation-modeler
**Description**: Discounted Cash Flow model builder for comprehensive company valuations with WACC calculation, terminal value estimation, and sensitivity analysis.

**Capabilities**:
- Free cash flow projection modeling
- WACC calculation (cost of equity via CAPM, cost of debt)
- Terminal value estimation (perpetuity growth, exit multiple)
- Sensitivity tables and tornado charts
- Monte Carlo simulation integration
- Multi-scenario analysis

**Used By Processes**:
- Discounted Cash Flow (DCF) Valuation
- Capital Investment Appraisal
- M&A Financial Due Diligence

**Tools/Libraries**: Excel/Python financial libraries, numpy-financial, scipy

---

#### 2. three-statement-model-builder
**Description**: Integrated three-statement financial model builder linking income statement, balance sheet, and cash flow statement with circular reference handling.

**Capabilities**:
- Income statement projection
- Balance sheet forecasting
- Cash flow statement derivation
- Circular reference resolution (debt/interest)
- Working capital modeling
- Capex and depreciation schedules

**Used By Processes**:
- Financial Statement Preparation
- Financial Modeling and Scenario Planning
- Annual Budget Development

**Tools/Libraries**: Python pandas, openpyxl, financial modeling templates

---

#### 3. budget-forecasting-engine
**Description**: Driver-based budgeting and forecasting skill with rolling forecast support and variance analysis.

**Capabilities**:
- Driver-based model construction
- Top-down and bottom-up consolidation
- Rolling forecast extension
- What-if scenario modeling
- Seasonality adjustment
- Automatic variance calculation

**Used By Processes**:
- Annual Budget Development
- Rolling Forecast Management
- Variance Analysis and Reporting

**Tools/Libraries**: Anaplan connectors, Adaptive Insights API, Excel automation

---

#### 4. monte-carlo-financial-simulator
**Description**: Stochastic simulation skill for financial modeling with probability distributions and risk quantification.

**Capabilities**:
- Probability distribution fitting
- Correlation matrix handling
- Convergence analysis
- Value at Risk (VaR) calculation
- Confidence interval generation
- Crystal Ball/ModelRisk integration

**Used By Processes**:
- Financial Modeling and Scenario Planning
- Cash Flow Forecasting and Liquidity Management
- Foreign Exchange Risk Management

**Tools/Libraries**: numpy, scipy.stats, Monte Carlo libraries

---

#### 5. lbo-model-builder
**Description**: Leveraged Buyout model construction skill for private equity transaction analysis.

**Capabilities**:
- Sources and uses of funds
- Debt schedule construction
- PIK toggle modeling
- Equity waterfall calculations
- IRR and MOIC computation
- Exit scenario analysis

**Used By Processes**:
- M&A Financial Due Diligence
- Capital Investment Appraisal
- Discounted Cash Flow (DCF) Valuation

**Tools/Libraries**: Python financial libraries, Excel automation

---

### Accounting and Compliance Skills

#### 6. gaap-ifrs-compliance-checker
**Description**: Automated compliance validation skill for GAAP and IFRS accounting standards with codification references.

**Capabilities**:
- ASC topic validation
- IFRS standard compliance checking
- Disclosure requirement verification
- Policy consistency analysis
- Footnote completeness checking
- SEC regulation compliance

**Used By Processes**:
- Financial Statement Preparation
- Revenue Recognition and ASC 606 Compliance
- Lease Accounting and ASC 842 Implementation

**Tools/Libraries**: FASB ASC database, IFRS taxonomy, SEC EDGAR

---

#### 7. revenue-recognition-analyzer
**Description**: ASC 606 five-step model implementation skill for revenue recognition analysis and documentation.

**Capabilities**:
- Contract identification
- Performance obligation analysis
- Transaction price determination
- Allocation calculation
- Revenue timing assessment
- Variable consideration estimation

**Used By Processes**:
- Revenue Recognition and ASC 606 Compliance
- Financial Statement Preparation
- External Audit Coordination

**Tools/Libraries**: Contract analysis tools, revenue recognition templates

---

#### 8. lease-accounting-calculator
**Description**: ASC 842/IFRS 16 lease accounting skill for right-of-use asset and liability calculations.

**Capabilities**:
- Lease classification determination
- Right-of-use asset calculation
- Lease liability amortization
- Modification accounting
- Discount rate determination
- Embedded lease identification

**Used By Processes**:
- Lease Accounting and ASC 842 Implementation
- Financial Statement Preparation
- Month-End Close Process

**Tools/Libraries**: Lease accounting software APIs, Excel templates

---

#### 9. intercompany-eliminator
**Description**: Automated intercompany transaction identification and elimination skill for consolidated reporting.

**Capabilities**:
- Intercompany matching
- Elimination entry generation
- Currency translation
- Minority interest calculation
- Investment elimination
- Unrealized profit elimination

**Used By Processes**:
- Intercompany Accounting and Consolidation
- Financial Statement Preparation
- Month-End Close Process

**Tools/Libraries**: ERP APIs (SAP, Oracle), consolidation software

---

#### 10. account-reconciliation-automator
**Description**: Automated account reconciliation skill with matching algorithms and exception handling.

**Capabilities**:
- Bank reconciliation automation
- Subledger to GL matching
- Three-way match processing
- Exception identification
- Aging analysis
- Variance threshold alerting

**Used By Processes**:
- Month-End Close Process
- External Audit Coordination
- SOX Compliance and Testing

**Tools/Libraries**: BlackLine API, Trintech, reconciliation platforms

---

### Tax Skills

#### 11. tax-provision-calculator
**Description**: ASC 740 income tax provision calculation skill with deferred tax analysis.

**Capabilities**:
- Current tax expense calculation
- Deferred tax asset/liability computation
- Permanent vs. temporary difference classification
- Valuation allowance assessment
- Rate reconciliation
- FIN 48/ASC 740-10 uncertain tax position analysis

**Used By Processes**:
- Income Tax Provision and ASC 740
- Tax Return Preparation and Filing
- Financial Statement Preparation

**Tools/Libraries**: Tax provision software APIs, ONESOURCE, Corptax

---

#### 12. transfer-pricing-analyzer
**Description**: Intercompany transfer pricing analysis skill with benchmarking and documentation generation.

**Capabilities**:
- Comparable company search
- Arm's length price determination
- Profit split analysis
- TNMM/CPM calculations
- Documentation template generation
- Country-by-country reporting

**Used By Processes**:
- Transfer Pricing Documentation
- Intercompany Accounting and Consolidation
- Income Tax Provision and ASC 740

**Tools/Libraries**: TP databases (BvD, S&P), benchmarking tools

---

#### 13. multi-jurisdiction-tax-calculator
**Description**: Multi-state and international tax calculation skill with nexus analysis.

**Capabilities**:
- State apportionment calculation
- Nexus determination
- Treaty benefit analysis
- Withholding tax calculation
- Indirect tax (VAT/GST) computation
- Tax calendar management

**Used By Processes**:
- Tax Return Preparation and Filing
- Income Tax Provision and ASC 740
- Transfer Pricing Documentation

**Tools/Libraries**: Tax software APIs, jurisdiction databases

---

### Treasury Skills

#### 14. cash-flow-forecaster
**Description**: Daily, weekly, and monthly cash forecasting skill with scenario analysis and liquidity stress testing.

**Capabilities**:
- Direct method cash forecasting
- Indirect method reconciliation
- Working capital optimization modeling
- Liquidity stress scenarios
- Bank balance aggregation
- Cash position optimization

**Used By Processes**:
- Cash Flow Forecasting and Liquidity Management
- Debt Facility Management and Covenant Compliance
- Annual Budget Development

**Tools/Libraries**: Treasury management system APIs, Kyriba, GTreasury

---

#### 15. fx-hedging-strategy-modeler
**Description**: Foreign exchange exposure analysis and hedging strategy skill with hedge effectiveness testing.

**Capabilities**:
- Exposure identification and quantification
- Hedge instrument selection (forwards, options, swaps)
- Hedge ratio optimization
- Hedge effectiveness testing (ASC 815)
- Mark-to-market valuation
- VaR calculation for FX

**Used By Processes**:
- Foreign Exchange Risk Management
- Cash Flow Forecasting and Liquidity Management
- Financial Modeling and Scenario Planning

**Tools/Libraries**: Bloomberg API, Reuters, FX pricing models

---

#### 16. debt-covenant-monitor
**Description**: Automated covenant compliance monitoring and calculation skill with early warning alerts.

**Capabilities**:
- Financial covenant calculation (leverage, coverage ratios)
- Covenant headroom analysis
- Pro forma compliance testing
- Early warning threshold alerts
- Compliance certificate generation
- Cure mechanism modeling

**Used By Processes**:
- Debt Facility Management and Covenant Compliance
- Financial Statement Preparation
- Cash Flow Forecasting and Liquidity Management

**Tools/Libraries**: Loan agreement parsing, covenant templates

---

### Investment Analysis Skills

#### 17. comparable-company-analyzer
**Description**: Public company comparable analysis skill with peer selection, multiple calculation, and football field visualization.

**Capabilities**:
- Peer universe selection
- Trading multiple calculation (EV/EBITDA, P/E, etc.)
- LTM and NTM metric normalization
- Outlier identification
- Football field chart generation
- Equity value bridge

**Used By Processes**:
- Comparable Company Analysis
- M&A Financial Due Diligence
- Discounted Cash Flow (DCF) Valuation

**Tools/Libraries**: Capital IQ API, FactSet, Bloomberg Terminal

---

#### 18. precedent-transaction-analyzer
**Description**: M&A precedent transaction analysis skill with deal sourcing and premium analysis.

**Capabilities**:
- Transaction database search
- Deal multiple extraction
- Control premium analysis
- Synergy consideration
- Deal structure comparison
- Timeline and sector filtering

**Used By Processes**:
- M&A Financial Due Diligence
- Comparable Company Analysis
- Capital Investment Appraisal

**Tools/Libraries**: M&A databases (Refinitiv, PitchBook), deal comps tools

---

#### 19. merger-model-builder
**Description**: M&A merger model construction skill with accretion/dilution analysis and synergy modeling.

**Capabilities**:
- Purchase price allocation
- Goodwill calculation
- Accretion/dilution analysis
- Synergy modeling
- Pro forma financials
- Contribution analysis

**Used By Processes**:
- M&A Financial Due Diligence
- Comparable Company Analysis
- Discounted Cash Flow (DCF) Valuation

**Tools/Libraries**: Financial modeling templates, deal structuring tools

---

#### 20. capital-budgeting-analyzer
**Description**: Capital investment appraisal skill with NPV, IRR, payback, and real options analysis.

**Capabilities**:
- NPV calculation with multiple discount rates
- IRR and MIRR computation
- Payback and discounted payback
- Profitability index
- Real options valuation
- Sensitivity and break-even analysis

**Used By Processes**:
- Capital Investment Appraisal
- Financial Modeling and Scenario Planning
- Annual Budget Development

**Tools/Libraries**: numpy-financial, scipy, decision tree libraries

---

### Audit Skills

#### 21. sox-control-tester
**Description**: SOX Section 404 control testing skill with workpaper generation and deficiency classification.

**Capabilities**:
- Control walkthrough documentation
- Sample selection methodology
- Test of design effectiveness
- Test of operating effectiveness
- Deficiency evaluation (significant/material)
- Remediation tracking

**Used By Processes**:
- SOX Compliance and Testing
- Internal Audit Planning and Execution
- External Audit Coordination

**Tools/Libraries**: GRC platforms (Workiva, AuditBoard), control libraries

---

#### 22. audit-sampling-calculator
**Description**: Statistical and non-statistical audit sampling skill with sample size determination and evaluation.

**Capabilities**:
- Attribute sampling
- Monetary unit sampling (MUS)
- Classical variables sampling
- Sample size calculation
- Projection of errors
- Confidence level analysis

**Used By Processes**:
- Internal Audit Planning and Execution
- SOX Compliance and Testing
- External Audit Coordination

**Tools/Libraries**: IDEA, ACL Analytics, statistical sampling libraries

---

#### 23. fraud-risk-assessor
**Description**: Fraud risk assessment skill based on the fraud triangle with red flag detection.

**Capabilities**:
- Fraud triangle analysis (pressure, opportunity, rationalization)
- Red flag identification
- Data analytics for anomaly detection
- Benford's law analysis
- Duplicate detection
- Journal entry testing

**Used By Processes**:
- Fraud Risk Assessment and Investigation
- Internal Audit Planning and Execution
- SOX Compliance and Testing

**Tools/Libraries**: Forensic analytics tools, Benford's law libraries

---

### Economic Analysis Skills

#### 24. economic-indicator-tracker
**Description**: Macroeconomic indicator monitoring and analysis skill with trend identification and forecasting.

**Capabilities**:
- GDP, inflation, employment tracking
- Leading/lagging indicator analysis
- Interest rate forecasting
- Yield curve analysis
- Sector correlation analysis
- Economic calendar integration

**Used By Processes**:
- Economic Forecasting and Indicator Analysis
- Industry and Competitive Analysis
- Financial Modeling and Scenario Planning

**Tools/Libraries**: FRED API, BLS API, economic databases

---

#### 25. industry-analysis-engine
**Description**: Industry and competitive analysis skill with Porter's Five Forces and market structure analysis.

**Capabilities**:
- Porter's Five Forces analysis
- Market share analysis
- Concentration ratios (HHI)
- Industry lifecycle assessment
- Competitive positioning maps
- SWOT synthesis

**Used By Processes**:
- Industry and Competitive Analysis
- Economic Forecasting and Indicator Analysis
- M&A Financial Due Diligence

**Tools/Libraries**: IBISWorld API, industry databases, market research platforms

---

### Reporting and Analytics Skills

#### 26. financial-dashboard-generator
**Description**: Automated financial dashboard and KPI visualization skill with executive reporting capabilities.

**Capabilities**:
- KPI calculation and trending
- Variance waterfall charts
- Executive summary generation
- Board deck automation
- Drill-down report creation
- Mobile-responsive dashboards

**Used By Processes**:
- Variance Analysis and Reporting
- Month-End Close Process
- Annual Budget Development

**Tools/Libraries**: Power BI API, Tableau API, financial visualization libraries

---

#### 27. xbrl-filing-generator
**Description**: XBRL financial statement tagging and SEC filing preparation skill.

**Capabilities**:
- XBRL taxonomy mapping
- Inline XBRL generation
- SEC filing validation
- Extension taxonomy creation
- Calculation and presentation linkbase
- Filing deadline tracking

**Used By Processes**:
- Financial Statement Preparation
- External Audit Coordination
- SOX Compliance and Testing

**Tools/Libraries**: XBRL libraries, SEC EDGAR, filing platforms

---

#### 28. audit-workpaper-generator
**Description**: Automated audit workpaper preparation skill with PBC list management.

**Capabilities**:
- PBC list generation and tracking
- Workpaper template population
- Tickmark documentation
- Cross-reference linking
- Support schedule creation
- Document organization

**Used By Processes**:
- External Audit Coordination
- Internal Audit Planning and Execution
- SOX Compliance and Testing

**Tools/Libraries**: Audit workpaper platforms, document management APIs

---

## Agents

### Financial Planning Agents

#### 1. fp-and-a-analyst
**Description**: Agent specialized in financial planning and analysis, budgeting, forecasting, and variance analysis.

**Responsibilities**:
- Annual budget coordination
- Rolling forecast maintenance
- Variance analysis and commentary
- Driver identification
- Management reporting
- Scenario development

**Used By Processes**:
- Annual Budget Development
- Rolling Forecast Management
- Variance Analysis and Reporting
- Financial Modeling and Scenario Planning

**Required Skills**: budget-forecasting-engine, three-statement-model-builder, financial-dashboard-generator

---

#### 2. financial-modeler
**Description**: Agent specialized in building complex financial models including DCF, LBO, and merger models.

**Responsibilities**:
- Model architecture design
- Assumption development
- Formula construction
- Error checking and validation
- Scenario structuring
- Output presentation

**Used By Processes**:
- Discounted Cash Flow (DCF) Valuation
- M&A Financial Due Diligence
- Capital Investment Appraisal

**Required Skills**: dcf-valuation-modeler, lbo-model-builder, merger-model-builder, three-statement-model-builder

---

#### 3. scenario-planner
**Description**: Agent specialized in scenario planning, sensitivity analysis, and strategic decision support.

**Responsibilities**:
- Scenario definition and structuring
- Key variable identification
- Probability weighting
- Impact quantification
- Decision tree construction
- Recommendation formulation

**Used By Processes**:
- Financial Modeling and Scenario Planning
- Capital Investment Appraisal
- Cash Flow Forecasting and Liquidity Management

**Required Skills**: monte-carlo-financial-simulator, capital-budgeting-analyzer, budget-forecasting-engine

---

### Accounting Agents

#### 4. technical-accounting-specialist
**Description**: Agent specialized in complex accounting issues, GAAP/IFRS interpretation, and technical memo preparation.

**Responsibilities**:
- Accounting standard research
- Technical memo drafting
- Policy interpretation
- Complex transaction analysis
- Disclosure review
- Position documentation

**Used By Processes**:
- Revenue Recognition and ASC 606 Compliance
- Lease Accounting and ASC 842 Implementation
- Financial Statement Preparation

**Required Skills**: gaap-ifrs-compliance-checker, revenue-recognition-analyzer, lease-accounting-calculator

---

#### 5. close-process-coordinator
**Description**: Agent specialized in financial close process management, timeline coordination, and quality control.

**Responsibilities**:
- Close calendar management
- Task assignment and tracking
- Bottleneck identification
- Quality review coordination
- Flux analysis
- Certification preparation

**Used By Processes**:
- Month-End Close Process
- Financial Statement Preparation
- Intercompany Accounting and Consolidation

**Required Skills**: account-reconciliation-automator, intercompany-eliminator, financial-dashboard-generator

---

#### 6. consolidation-specialist
**Description**: Agent specialized in multi-entity consolidation, intercompany eliminations, and segment reporting.

**Responsibilities**:
- Subsidiary data collection
- Intercompany reconciliation
- Elimination entry preparation
- Currency translation
- Segment allocation
- Consolidated reporting

**Used By Processes**:
- Intercompany Accounting and Consolidation
- Financial Statement Preparation
- Month-End Close Process

**Required Skills**: intercompany-eliminator, gaap-ifrs-compliance-checker, three-statement-model-builder

---

### Audit and Compliance Agents

#### 7. internal-auditor
**Description**: Agent specialized in risk-based audit planning, fieldwork execution, and finding documentation.

**Responsibilities**:
- Risk assessment
- Audit program development
- Control testing execution
- Finding documentation
- Recommendation development
- Follow-up coordination

**Used By Processes**:
- Internal Audit Planning and Execution
- SOX Compliance and Testing
- Fraud Risk Assessment and Investigation

**Required Skills**: sox-control-tester, audit-sampling-calculator, fraud-risk-assessor

---

#### 8. sox-compliance-manager
**Description**: Agent specialized in SOX 404 compliance, control documentation, and deficiency remediation.

**Responsibilities**:
- Control inventory maintenance
- Risk and control matrix updates
- Testing coordination
- Deficiency evaluation
- Remediation tracking
- Management certification support

**Used By Processes**:
- SOX Compliance and Testing
- Internal Audit Planning and Execution
- External Audit Coordination

**Required Skills**: sox-control-tester, audit-workpaper-generator, fraud-risk-assessor

---

#### 9. external-audit-liaison
**Description**: Agent specialized in external audit coordination, PBC list management, and auditor communication.

**Responsibilities**:
- PBC list preparation
- Document organization
- Auditor inquiry response
- Testing support
- Finding discussion
- Audit committee presentation support

**Used By Processes**:
- External Audit Coordination
- SOX Compliance and Testing
- Financial Statement Preparation

**Required Skills**: audit-workpaper-generator, account-reconciliation-automator, sox-control-tester

---

#### 10. fraud-investigator
**Description**: Agent specialized in fraud detection, investigation procedures, and forensic analysis.

**Responsibilities**:
- Red flag investigation
- Data analytics execution
- Interview coordination
- Evidence documentation
- Finding reporting
- Control recommendation

**Used By Processes**:
- Fraud Risk Assessment and Investigation
- Internal Audit Planning and Execution

**Required Skills**: fraud-risk-assessor, audit-sampling-calculator

---

### Treasury Agents

#### 11. treasury-analyst
**Description**: Agent specialized in cash management, liquidity planning, and working capital optimization.

**Responsibilities**:
- Daily cash positioning
- Cash forecast preparation
- Working capital analysis
- Bank relationship management
- Payment processing oversight
- Investment placement

**Used By Processes**:
- Cash Flow Forecasting and Liquidity Management
- Debt Facility Management and Covenant Compliance

**Required Skills**: cash-flow-forecaster, debt-covenant-monitor

---

#### 12. fx-risk-manager
**Description**: Agent specialized in foreign exchange exposure management and hedging strategy implementation.

**Responsibilities**:
- Exposure identification
- Hedge strategy development
- Instrument execution
- Effectiveness monitoring
- Mark-to-market tracking
- Hedge accounting support

**Used By Processes**:
- Foreign Exchange Risk Management
- Cash Flow Forecasting and Liquidity Management

**Required Skills**: fx-hedging-strategy-modeler, cash-flow-forecaster, gaap-ifrs-compliance-checker

---

#### 13. debt-portfolio-manager
**Description**: Agent specialized in debt facility management, covenant compliance, and capital structure optimization.

**Responsibilities**:
- Debt portfolio tracking
- Covenant calculation
- Compliance monitoring
- Refinancing analysis
- Amendment negotiation support
- Capital structure modeling

**Used By Processes**:
- Debt Facility Management and Covenant Compliance
- Cash Flow Forecasting and Liquidity Management

**Required Skills**: debt-covenant-monitor, cash-flow-forecaster, dcf-valuation-modeler

---

### Tax Agents

#### 14. tax-provision-specialist
**Description**: Agent specialized in income tax provision preparation, deferred tax analysis, and ASC 740 compliance.

**Responsibilities**:
- Provision calculation
- Deferred tax schedule maintenance
- Rate reconciliation preparation
- FIN 48 analysis
- Return-to-provision true-up
- Tax footnote preparation

**Used By Processes**:
- Income Tax Provision and ASC 740
- Tax Return Preparation and Filing
- Financial Statement Preparation

**Required Skills**: tax-provision-calculator, multi-jurisdiction-tax-calculator, gaap-ifrs-compliance-checker

---

#### 15. tax-compliance-coordinator
**Description**: Agent specialized in tax return preparation, filing coordination, and deadline management.

**Responsibilities**:
- Return preparation coordination
- Filing deadline tracking
- Extension management
- Payment scheduling
- Authority communication
- Document retention

**Used By Processes**:
- Tax Return Preparation and Filing
- Income Tax Provision and ASC 740

**Required Skills**: multi-jurisdiction-tax-calculator, tax-provision-calculator

---

#### 16. transfer-pricing-specialist
**Description**: Agent specialized in transfer pricing policy development, documentation, and compliance.

**Responsibilities**:
- Policy development
- Benchmarking study preparation
- Documentation maintenance
- Country-by-country reporting
- Audit defense support
- Intercompany agreement review

**Used By Processes**:
- Transfer Pricing Documentation
- Intercompany Accounting and Consolidation

**Required Skills**: transfer-pricing-analyzer, comparable-company-analyzer

---

### Investment Analysis Agents

#### 17. valuation-analyst
**Description**: Agent specialized in company valuation using DCF, comparable company, and precedent transaction methodologies.

**Responsibilities**:
- Valuation methodology selection
- Peer company identification
- Multiple calculation and application
- DCF model construction
- Football field preparation
- Valuation conclusion synthesis

**Used By Processes**:
- Discounted Cash Flow (DCF) Valuation
- Comparable Company Analysis
- M&A Financial Due Diligence

**Required Skills**: dcf-valuation-modeler, comparable-company-analyzer, precedent-transaction-analyzer

---

#### 18. due-diligence-analyst
**Description**: Agent specialized in M&A financial due diligence, quality of earnings analysis, and deal support.

**Responsibilities**:
- Financial data analysis
- Quality of earnings review
- Working capital analysis
- Pro forma adjustments
- Red flag identification
- Management Q&A preparation

**Used By Processes**:
- M&A Financial Due Diligence
- Comparable Company Analysis

**Required Skills**: merger-model-builder, comparable-company-analyzer, three-statement-model-builder

---

#### 19. capital-investment-analyst
**Description**: Agent specialized in capital expenditure evaluation, investment appraisal, and project prioritization.

**Responsibilities**:
- Business case review
- NPV/IRR calculation
- Risk-adjusted returns
- Project ranking
- Post-implementation review
- Capital allocation support

**Used By Processes**:
- Capital Investment Appraisal
- Financial Modeling and Scenario Planning
- Annual Budget Development

**Required Skills**: capital-budgeting-analyzer, monte-carlo-financial-simulator, dcf-valuation-modeler

---

### Economic Analysis Agents

#### 20. economic-analyst
**Description**: Agent specialized in macroeconomic analysis, forecasting, and business impact assessment.

**Responsibilities**:
- Indicator monitoring
- Trend analysis
- Forecast development
- Business impact assessment
- Scenario construction
- Research publication

**Used By Processes**:
- Economic Forecasting and Indicator Analysis
- Financial Modeling and Scenario Planning

**Required Skills**: economic-indicator-tracker, monte-carlo-financial-simulator

---

#### 21. competitive-intelligence-analyst
**Description**: Agent specialized in industry analysis, competitive positioning, and market research.

**Responsibilities**:
- Industry research
- Competitor profiling
- Market share analysis
- Trend identification
- Strategic implications
- Benchmarking

**Used By Processes**:
- Industry and Competitive Analysis
- M&A Financial Due Diligence

**Required Skills**: industry-analysis-engine, comparable-company-analyzer, economic-indicator-tracker

---

### Reporting Agents

#### 22. sec-reporting-specialist
**Description**: Agent specialized in SEC filing preparation, XBRL tagging, and regulatory compliance.

**Responsibilities**:
- 10-K/10-Q preparation
- 8-K drafting
- Proxy statement support
- XBRL tagging review
- Disclosure checklist completion
- Filing deadline management

**Used By Processes**:
- Financial Statement Preparation
- External Audit Coordination

**Required Skills**: xbrl-filing-generator, gaap-ifrs-compliance-checker, audit-workpaper-generator

---

## Process to Skills/Agents Mapping

| Process | Recommended Skills | Recommended Agents |
|---------|-------------------|-------------------|
| Annual Budget Development | budget-forecasting-engine, three-statement-model-builder, financial-dashboard-generator | fp-and-a-analyst |
| Rolling Forecast Management | budget-forecasting-engine, monte-carlo-financial-simulator | fp-and-a-analyst |
| Variance Analysis and Reporting | budget-forecasting-engine, financial-dashboard-generator | fp-and-a-analyst |
| Financial Modeling and Scenario Planning | monte-carlo-financial-simulator, three-statement-model-builder, dcf-valuation-modeler | financial-modeler, scenario-planner |
| Month-End Close Process | account-reconciliation-automator, intercompany-eliminator | close-process-coordinator |
| Financial Statement Preparation | gaap-ifrs-compliance-checker, three-statement-model-builder, xbrl-filing-generator | technical-accounting-specialist, sec-reporting-specialist |
| Revenue Recognition and ASC 606 Compliance | revenue-recognition-analyzer, gaap-ifrs-compliance-checker | technical-accounting-specialist |
| Intercompany Accounting and Consolidation | intercompany-eliminator, gaap-ifrs-compliance-checker | consolidation-specialist |
| Lease Accounting and ASC 842 Implementation | lease-accounting-calculator, gaap-ifrs-compliance-checker | technical-accounting-specialist |
| Internal Audit Planning and Execution | sox-control-tester, audit-sampling-calculator, fraud-risk-assessor | internal-auditor |
| SOX Compliance and Testing | sox-control-tester, audit-workpaper-generator | sox-compliance-manager |
| External Audit Coordination | audit-workpaper-generator, account-reconciliation-automator | external-audit-liaison |
| Fraud Risk Assessment and Investigation | fraud-risk-assessor, audit-sampling-calculator | fraud-investigator |
| Cash Flow Forecasting and Liquidity Management | cash-flow-forecaster, debt-covenant-monitor | treasury-analyst |
| Foreign Exchange Risk Management | fx-hedging-strategy-modeler, cash-flow-forecaster | fx-risk-manager |
| Debt Facility Management and Covenant Compliance | debt-covenant-monitor, cash-flow-forecaster | debt-portfolio-manager |
| Discounted Cash Flow (DCF) Valuation | dcf-valuation-modeler, comparable-company-analyzer | valuation-analyst, financial-modeler |
| Comparable Company Analysis | comparable-company-analyzer, precedent-transaction-analyzer | valuation-analyst |
| M&A Financial Due Diligence | merger-model-builder, comparable-company-analyzer, precedent-transaction-analyzer | due-diligence-analyst, valuation-analyst |
| Capital Investment Appraisal | capital-budgeting-analyzer, monte-carlo-financial-simulator, dcf-valuation-modeler | capital-investment-analyst |
| Income Tax Provision and ASC 740 | tax-provision-calculator, multi-jurisdiction-tax-calculator | tax-provision-specialist |
| Tax Return Preparation and Filing | multi-jurisdiction-tax-calculator, tax-provision-calculator | tax-compliance-coordinator |
| Transfer Pricing Documentation | transfer-pricing-analyzer, comparable-company-analyzer | transfer-pricing-specialist |
| Economic Forecasting and Indicator Analysis | economic-indicator-tracker, monte-carlo-financial-simulator | economic-analyst |
| Industry and Competitive Analysis | industry-analysis-engine, comparable-company-analyzer | competitive-intelligence-analyst |

---

## Shared Candidates (Cross-Specialization)

These skills and agents could be shared with other specializations:

### Shared Skills

1. **monte-carlo-financial-simulator** - Useful for risk analysis in Data Science/ML, Insurance, and Engineering domains
2. **economic-indicator-tracker** - Applicable to Supply Chain, Real Estate, and Business Strategy specializations
3. **industry-analysis-engine** - Useful for Product Management and Business Strategy domains
4. **financial-dashboard-generator** - Applicable to any domain requiring executive reporting and KPI visualization
5. **audit-sampling-calculator** - Useful for QA Testing Automation and Data Quality domains

### Shared Agents

1. **economic-analyst** - Economic expertise applicable to Supply Chain, Real Estate specializations
2. **competitive-intelligence-analyst** - Market research applicable to Product Management, Business Strategy
3. **due-diligence-analyst** - Analysis expertise applicable to Legal, Compliance specializations
4. **fraud-investigator** - Investigation skills applicable to Security, Compliance specializations

---

## Implementation Priority

### High Priority (Core Finance Workflows)
1. gaap-ifrs-compliance-checker
2. account-reconciliation-automator
3. budget-forecasting-engine
4. tax-provision-calculator
5. dcf-valuation-modeler
6. close-process-coordinator (agent)
7. fp-and-a-analyst (agent)
8. technical-accounting-specialist (agent)

### Medium Priority (Advanced Capabilities)
1. three-statement-model-builder
2. revenue-recognition-analyzer
3. sox-control-tester
4. cash-flow-forecaster
5. comparable-company-analyzer
6. financial-modeler (agent)
7. internal-auditor (agent)
8. valuation-analyst (agent)

### Lower Priority (Specialized Use Cases)
1. lbo-model-builder
2. transfer-pricing-analyzer
3. fx-hedging-strategy-modeler
4. xbrl-filing-generator
5. precedent-transaction-analyzer
6. transfer-pricing-specialist (agent)
7. sec-reporting-specialist (agent)
8. fx-risk-manager (agent)

---

## Notes

- All skills should implement standardized input/output schemas for composability with financial data formats
- Skills should support both real-time and batch processing modes for close and reporting cycles
- Agents should maintain audit trails for all financial calculations and decisions
- Error handling should include materiality thresholds and escalation procedures
- Skills should support SOX compliance requirements including change management and access controls
- Integration with common ERP systems (SAP, Oracle, NetSuite) should be prioritized
- All numerical calculations should maintain precision appropriate for financial reporting
- Skills should support multiple currencies and handle currency conversion appropriately
- Agents should provide detailed documentation for their recommendations to support audit requirements
- Time-sensitive processes (close, filings) should include deadline awareness and prioritization

---

*Last Updated: January 2026*
