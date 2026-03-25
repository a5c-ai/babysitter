# Skills and Agents Backlog - Venture Capital

## Overview

This document catalogs specialized skills and agents that would enhance the Venture Capital processes beyond general-purpose capabilities. These represent opportunities for deeper automation, specialized analysis, and domain-specific tooling across the VC investment lifecycle.

## Summary Statistics

| Category | Count |
|----------|-------|
| **Skills** | 42 |
| **Agents** | 28 |
| **Shared Candidates** | 15 |

---

## Skills

### Deal Flow & Pipeline Management

| Skill ID | Name | Description | Used By Processes |
|----------|------|-------------|-------------------|
| vc-skill-001 | deal-flow-tracker | CRM integration for tracking deals through pipeline stages with automated status updates | deal-flow-tracking, proactive-deal-sourcing |
| vc-skill-002 | investor-network-mapper | Maps co-investor relationships, syndication history, and network connections | co-investor-syndication, deal-flow-tracking |
| vc-skill-003 | deal-scoring-engine | Automated deal scoring based on thesis alignment, market size, team, and traction metrics | deal-flow-tracking, proactive-deal-sourcing |
| vc-skill-004 | thesis-matching | Matches inbound deals against investment thesis criteria and fund strategy | proactive-deal-sourcing |
| vc-skill-005 | outreach-sequencer | Manages multi-touch outreach sequences to founders and referral sources | proactive-deal-sourcing |
| vc-skill-006 | meeting-scheduler | Intelligent scheduling with partner/associate availability and timezone management | deal-flow-tracking, board-engagement |

### Due Diligence

| Skill ID | Name | Description | Used By Processes |
|----------|------|-------------|-------------------|
| vc-skill-007 | market-sizer | TAM/SAM/SOM calculation with data source integration (CB Insights, PitchBook, etc.) | commercial-due-diligence, vc-method-valuation |
| vc-skill-008 | competitive-landscape-analyzer | Automated competitive mapping with funding history, product positioning, market share | commercial-due-diligence |
| vc-skill-009 | customer-reference-tracker | Manages customer reference calls, NPS analysis, and churn pattern detection | commercial-due-diligence |
| vc-skill-010 | financial-model-validator | Validates financial model assumptions, checks formula integrity, stress tests scenarios | financial-due-diligence, dcf-analysis |
| vc-skill-011 | cohort-analyzer | Analyzes revenue cohorts, retention curves, LTV/CAC trends over time | financial-due-diligence, quarterly-portfolio-reporting |
| vc-skill-012 | audit-trail-verifier | Verifies financial data against source documents, bank statements, contracts | financial-due-diligence |
| vc-skill-013 | tech-stack-scanner | Automated technical architecture review, security assessment, scalability analysis | technical-due-diligence |
| vc-skill-014 | code-quality-analyzer | Static code analysis, technical debt assessment, engineering velocity metrics | technical-due-diligence |
| vc-skill-015 | ip-patent-analyzer | Patent landscape analysis, IP strength assessment, freedom to operate review | technical-due-diligence, legal-due-diligence |
| vc-skill-016 | contract-extractor | Extracts key terms from contracts, identifies risks, flags unusual provisions | legal-due-diligence, definitive-document-negotiation |
| vc-skill-017 | cap-table-validator | Validates cap table accuracy, identifies issues, models option pool impact | legal-due-diligence, cap-table-modeling |
| vc-skill-018 | background-checker | Integrates with background check services, social media analysis, reference verification | management-team-assessment |
| vc-skill-019 | esg-scorer | ESG rating calculation based on environmental, social, governance metrics | esg-due-diligence |
| vc-skill-020 | carbon-footprint-estimator | Estimates company carbon footprint and environmental impact | esg-due-diligence |

### Valuation & Modeling

| Skill ID | Name | Description | Used By Processes |
|----------|------|-------------|-------------------|
| vc-skill-021 | comparable-transaction-finder | Searches M&A and funding databases for relevant comparable transactions | comparable-analysis, vc-method-valuation |
| vc-skill-022 | multiple-calculator | Calculates valuation multiples (EV/Revenue, EV/EBITDA, P/E) with sector adjustments | comparable-analysis, dcf-analysis |
| vc-skill-023 | dcf-modeler | Builds DCF models with terminal value, WACC calculation, sensitivity tables | dcf-analysis |
| vc-skill-024 | scenario-modeler | Monte Carlo simulations for exit scenarios, return distributions | vc-method-valuation, cap-table-modeling |
| vc-skill-025 | waterfall-calculator | Calculates distribution waterfalls per LPA terms, carry, clawback | distribution-waterfall-calculation, cap-table-modeling |
| vc-skill-026 | dilution-analyzer | Models dilution impact across funding rounds, option pool expansions | cap-table-modeling |

### Deal Structuring

| Skill ID | Name | Description | Used By Processes |
|----------|------|-------------|-------------------|
| vc-skill-027 | term-sheet-generator | Generates term sheets from templates with standard and custom provisions | term-sheet-drafting |
| vc-skill-028 | term-comparator | Compares term sheets against market standards, identifies outliers | term-sheet-drafting, definitive-document-negotiation |
| vc-skill-029 | document-redliner | Automated document comparison, redline generation, change tracking | definitive-document-negotiation |
| vc-skill-030 | closing-checklist-tracker | Tracks closing conditions, deliverables, sign-offs across parties | definitive-document-negotiation |
| vc-skill-031 | ic-memo-generator | Generates investment committee memos from due diligence artifacts | investment-committee-process |
| vc-skill-032 | vote-tracker | Tracks IC voting, approvals, conditions, follow-up items | investment-committee-process |

### Portfolio Management

| Skill ID | Name | Description | Used By Processes |
|----------|------|-------------|-------------------|
| vc-skill-033 | kpi-aggregator | Aggregates KPIs from portfolio companies, normalizes metrics | quarterly-portfolio-reporting |
| vc-skill-034 | portfolio-dashboard-builder | Generates portfolio dashboards with visualizations, trends | quarterly-portfolio-reporting, exit-readiness-assessment |
| vc-skill-035 | valuation-updater | Marks portfolio positions to fair value per ASC 820/IPEV guidelines | quarterly-portfolio-reporting |
| vc-skill-036 | board-deck-analyzer | Analyzes board decks for trends, flag issues, prepare discussion points | board-engagement |
| vc-skill-037 | action-item-tracker | Tracks board action items, follow-ups, commitments across companies | board-engagement |
| vc-skill-038 | network-matcher | Matches portfolio company needs with investor network resources | portfolio-value-creation |

### Exit Planning

| Skill ID | Name | Description | Used By Processes |
|----------|------|-------------|-------------------|
| vc-skill-039 | buyer-universe-builder | Builds and maintains buyer lists with acquisition history, strategic fit | exit-readiness-assessment |
| vc-skill-040 | exit-readiness-scorer | Scores company readiness across financial, operational, governance dimensions | exit-readiness-assessment |
| vc-skill-041 | k1-generator | Generates K-1 schedules for partner distributions with tax allocations | distribution-waterfall-calculation |
| vc-skill-042 | escrow-tracker | Tracks escrow releases, holdbacks, earnout milestones | distribution-waterfall-calculation |

---

## Agents

### Deal Sourcing Agents

| Agent ID | Name | Role | Specialization | Used By Processes |
|----------|------|------|----------------|-------------------|
| vc-agent-001 | deal-scout | Proactive deal sourcing | Identifies target companies, monitors signals, initiates outreach | proactive-deal-sourcing |
| vc-agent-002 | pipeline-coordinator | Pipeline management | Coordinates deal flow, assigns coverage, tracks timing | deal-flow-tracking |
| vc-agent-003 | syndicate-manager | Co-investor relations | Manages syndicate formation, allocation negotiations | co-investor-syndication |

### Due Diligence Agents

| Agent ID | Name | Role | Specialization | Used By Processes |
|----------|------|------|----------------|-------------------|
| vc-agent-004 | market-analyst | Commercial DD lead | Market sizing, competitive analysis, customer insights | commercial-due-diligence |
| vc-agent-005 | financial-analyst | Financial DD lead | Financial model review, quality of earnings, working capital | financial-due-diligence |
| vc-agent-006 | technical-assessor | Technical DD lead | Architecture review, team assessment, IP evaluation | technical-due-diligence |
| vc-agent-007 | legal-reviewer | Legal DD lead | Corporate structure, contracts, litigation, IP | legal-due-diligence |
| vc-agent-008 | people-evaluator | Management assessment lead | Team evaluation, background checks, culture fit | management-team-assessment |
| vc-agent-009 | esg-analyst | ESG DD lead | Environmental, social, governance assessment | esg-due-diligence |
| vc-agent-010 | dd-coordinator | Due diligence orchestrator | Coordinates all DD workstreams, synthesizes findings | All DD processes |

### Valuation Agents

| Agent ID | Name | Role | Specialization | Used By Processes |
|----------|------|------|----------------|-------------------|
| vc-agent-011 | valuation-specialist | Valuation lead | VC method, DCF, comparables analysis | vc-method-valuation, dcf-analysis, comparable-analysis |
| vc-agent-012 | cap-table-modeler | Cap table specialist | Waterfall modeling, dilution analysis, scenario planning | cap-table-modeling |
| vc-agent-013 | sensitivity-analyst | Scenario analysis | Stress testing, sensitivity analysis, Monte Carlo | dcf-analysis, vc-method-valuation |

### Deal Execution Agents

| Agent ID | Name | Role | Specialization | Used By Processes |
|----------|------|------|----------------|-------------------|
| vc-agent-014 | term-sheet-negotiator | Term negotiation | Term sheet drafting, negotiation strategy | term-sheet-drafting |
| vc-agent-015 | deal-counsel-coordinator | Legal coordination | Manages outside counsel, document negotiation | definitive-document-negotiation |
| vc-agent-016 | closing-manager | Deal closing | Closing checklist, fund flows, execution | definitive-document-negotiation |
| vc-agent-017 | ic-presenter | IC preparation | Memo drafting, presentation prep, Q&A anticipation | investment-committee-process |

### Portfolio Management Agents

| Agent ID | Name | Role | Specialization | Used By Processes |
|----------|------|------|----------------|-------------------|
| vc-agent-018 | portfolio-reporter | Reporting lead | Quarterly reporting, LP communications | quarterly-portfolio-reporting |
| vc-agent-019 | board-member-assistant | Board preparation | Board deck review, question preparation, follow-up | board-engagement |
| vc-agent-020 | value-creation-lead | Portfolio support | Strategic planning, talent, customer intros, operations | portfolio-value-creation |
| vc-agent-021 | fundraising-advisor | Follow-on support | Next round preparation, investor introductions | portfolio-value-creation |
| vc-agent-022 | kpi-analyst | Performance tracking | Metric analysis, benchmarking, trend identification | quarterly-portfolio-reporting |

### Exit Agents

| Agent ID | Name | Role | Specialization | Used By Processes |
|----------|------|------|----------------|-------------------|
| vc-agent-023 | exit-planner | Exit strategy | Readiness assessment, buyer mapping, timing | exit-readiness-assessment |
| vc-agent-024 | m-and-a-advisor | M&A execution | Process management, buyer engagement, negotiation | exit-readiness-assessment |
| vc-agent-025 | distribution-manager | Distribution execution | Waterfall calculation, LP distributions, tax reporting | distribution-waterfall-calculation |

### Fund Operations Agents

| Agent ID | Name | Role | Specialization | Used By Processes |
|----------|------|------|----------------|-------------------|
| vc-agent-026 | fund-accountant | Fund accounting | NAV calculation, partnership accounting, audit support | distribution-waterfall-calculation, quarterly-portfolio-reporting |
| vc-agent-027 | tax-coordinator | Tax compliance | K-1 preparation, tax allocations, carried interest | distribution-waterfall-calculation |
| vc-agent-028 | lp-relations | LP communications | Reporting, capital calls, distributions, inquiries | quarterly-portfolio-reporting, distribution-waterfall-calculation |

---

## Process to Skills/Agents Mapping

| Process | Primary Skills | Primary Agents |
|---------|----------------|----------------|
| deal-flow-tracking | deal-flow-tracker, deal-scoring-engine, meeting-scheduler | pipeline-coordinator |
| proactive-deal-sourcing | thesis-matching, outreach-sequencer, deal-scoring-engine | deal-scout |
| co-investor-syndication | investor-network-mapper | syndicate-manager |
| commercial-due-diligence | market-sizer, competitive-landscape-analyzer, customer-reference-tracker | market-analyst, dd-coordinator |
| financial-due-diligence | financial-model-validator, cohort-analyzer, audit-trail-verifier | financial-analyst, dd-coordinator |
| technical-due-diligence | tech-stack-scanner, code-quality-analyzer, ip-patent-analyzer | technical-assessor, dd-coordinator |
| legal-due-diligence | contract-extractor, cap-table-validator, ip-patent-analyzer | legal-reviewer, dd-coordinator |
| management-team-assessment | background-checker | people-evaluator, dd-coordinator |
| esg-due-diligence | esg-scorer, carbon-footprint-estimator | esg-analyst, dd-coordinator |
| vc-method-valuation | comparable-transaction-finder, scenario-modeler, market-sizer | valuation-specialist |
| dcf-analysis | dcf-modeler, multiple-calculator, financial-model-validator | valuation-specialist, sensitivity-analyst |
| comparable-analysis | comparable-transaction-finder, multiple-calculator | valuation-specialist |
| cap-table-modeling | cap-table-validator, waterfall-calculator, dilution-analyzer | cap-table-modeler |
| term-sheet-drafting | term-sheet-generator, term-comparator | term-sheet-negotiator |
| definitive-document-negotiation | document-redliner, contract-extractor, closing-checklist-tracker | deal-counsel-coordinator, closing-manager |
| investment-committee-process | ic-memo-generator, vote-tracker | ic-presenter |
| quarterly-portfolio-reporting | kpi-aggregator, portfolio-dashboard-builder, valuation-updater, cohort-analyzer | portfolio-reporter, kpi-analyst, lp-relations |
| board-engagement | board-deck-analyzer, action-item-tracker, meeting-scheduler | board-member-assistant |
| portfolio-value-creation | network-matcher | value-creation-lead, fundraising-advisor |
| exit-readiness-assessment | buyer-universe-builder, exit-readiness-scorer, portfolio-dashboard-builder | exit-planner, m-and-a-advisor |
| distribution-waterfall-calculation | waterfall-calculator, k1-generator, escrow-tracker | distribution-manager, fund-accountant, tax-coordinator |

---

## Shared Candidates (Cross-Specialization)

These skills and agents could be shared with other business domain specializations:

| ID | Type | Name | Shareable With |
|----|------|------|----------------|
| shared-001 | skill | financial-model-validator | Finance & Accounting, Investment Banking, Private Equity |
| shared-002 | skill | contract-extractor | Legal, Corporate Development, Private Equity |
| shared-003 | skill | market-sizer | Strategy Consulting, Corporate Development, Product Management |
| shared-004 | skill | competitive-landscape-analyzer | Strategy Consulting, Marketing, Product Management |
| shared-005 | skill | dcf-modeler | Finance & Accounting, Investment Banking, Private Equity |
| shared-006 | skill | cap-table-validator | Legal, Finance & Accounting, Startup Operations |
| shared-007 | skill | background-checker | HR, Legal, Executive Recruiting |
| shared-008 | skill | esg-scorer | ESG/Sustainability, Corporate Governance, Impact Investing |
| shared-009 | skill | document-redliner | Legal, M&A, Contract Management |
| shared-010 | skill | kpi-aggregator | Finance & Accounting, Business Intelligence, Operations |
| shared-011 | agent | financial-analyst | Investment Banking, Private Equity, Corporate Finance |
| shared-012 | agent | legal-reviewer | Corporate Law, M&A, Contract Management |
| shared-013 | agent | valuation-specialist | Investment Banking, Private Equity, Corporate Development |
| shared-014 | agent | tax-coordinator | Tax, Finance & Accounting, Fund Administration |
| shared-015 | agent | m-and-a-advisor | Investment Banking, Corporate Development, Private Equity |

---

## Implementation Priority

### High Priority (Core VC Workflows)
1. **deal-flow-tracker** - Central to pipeline management
2. **market-sizer** - Critical for investment thesis validation
3. **financial-model-validator** - Essential for due diligence
4. **valuation-specialist** (agent) - Core investment decision support
5. **waterfall-calculator** - Required for fund operations
6. **kpi-aggregator** - Portfolio monitoring foundation

### Medium Priority (Enhanced Automation)
7. **comparable-transaction-finder** - Improves valuation accuracy
8. **tech-stack-scanner** - Technical DD automation
9. **contract-extractor** - Legal DD acceleration
10. **ic-memo-generator** - IC process efficiency
11. **portfolio-reporter** (agent) - LP reporting automation
12. **dd-coordinator** (agent) - DD process orchestration

### Lower Priority (Advanced Features)
13. **scenario-modeler** - Sophisticated return modeling
14. **esg-scorer** - ESG integration
15. **buyer-universe-builder** - Exit planning enhancement
16. **carbon-footprint-estimator** - Advanced ESG metrics
17. **code-quality-analyzer** - Deep technical DD
18. **network-matcher** - Value creation optimization

---

## Notes

### Integration Considerations
- **CRM Integration**: deal-flow-tracker, investor-network-mapper, and outreach-sequencer should integrate with Salesforce, Affinity, or similar VC CRM platforms
- **Data Provider Integration**: market-sizer, comparable-transaction-finder, and competitive-landscape-analyzer require integration with PitchBook, CB Insights, Crunchbase, or similar data providers
- **Document Management**: contract-extractor, document-redliner, and closing-checklist-tracker should integrate with Dropbox, Box, or DocuSign
- **Accounting Integration**: waterfall-calculator, k1-generator, and valuation-updater should integrate with fund administration systems (Carta, Juniper Square, etc.)
- **Portfolio Data**: kpi-aggregator should support common data collection formats and integrate with portfolio company reporting tools

### Agent Orchestration Patterns
- **Due Diligence Hub**: dd-coordinator orchestrates specialized DD agents (market-analyst, financial-analyst, technical-assessor, legal-reviewer, people-evaluator, esg-analyst)
- **Investment Committee Workflow**: ic-presenter coordinates with valuation-specialist and dd-coordinator for memo generation
- **Portfolio Operations**: portfolio-reporter coordinates with kpi-analyst, fund-accountant, and lp-relations for quarterly reporting
- **Exit Execution**: exit-planner coordinates with m-and-a-advisor, distribution-manager, and tax-coordinator

### Regulatory and Compliance
- All agents handling LP data must comply with SEC regulations for registered investment advisers
- Tax-related skills and agents must align with current IRS guidance on carried interest (IRC Section 1061)
- ESG agents should support multiple reporting frameworks (SASB, GRI, TCFD, UN PRI)

### VC-Specific Considerations
- Valuation skills should support both early-stage (qualitative factors, option pricing) and late-stage (DCF, comparable) methodologies
- Cap table modeling must handle complex structures: SAFEs, convertible notes, participating preferred, anti-dilution provisions
- Distribution waterfall must support various waterfall structures: American, European, deal-by-deal, whole-fund
- LP reporting should support ILPA templates and GIPS compliance where required
