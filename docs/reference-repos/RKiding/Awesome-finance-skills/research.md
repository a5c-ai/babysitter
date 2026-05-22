# RKiding/Awesome-finance-skills

## Metadata
- **Stars:** 1,766
- **License:** Apache-2.0
- **Last pushed:** 2026-03-29
- **Topics:** agent, agent-skills, finances, fintech
- **Fork:** No

## Archetype: domain-skill-pack

A collection of finance-specific SKILL.md-based agent skills for stock analysis, news aggregation, sentiment analysis, and market prediction. Targets OpenClaw, Claude Code, Codex, and other agent frameworks.

## Structure
- `skills/` directory with 10 skills, each containing SKILL.md:
  - alphaear-news (real-time financial news from 10+ sources)
  - alphaear-stock (A-Share, HK, US stock data)
  - alphaear-sentiment (FinBERT/LLM sentiment scoring)
  - alphaear-predictor (Kronos time-series forecasting)
  - alphaear-signal-tracker (investment signal evolution)
  - alphaear-logic-visualizer (transmission chain diagrams)
  - alphaear-reporter (professional report generation)
  - alphaear-search (web search + local RAG)
  - alphaear-deepear-lite (lite demo)
  - skill-creator (meta-skill for creating skills)
- `tests/` directory
- Compatible with `npx skills add` (Vercel skills CLI)

## Extractable Value

### Processes
- **Financial analysis workflow** (specializations/business/finance/): The reporter skill describes a Plan->Write->Edit->Chart pipeline that maps well to a babysitter process for structured financial report generation.
- **Signal tracking methodology** (specializations/business/finance/): The signal-tracker pattern of tracking investment signals through strengthen/weaken/falsify states is a domain-specific state-machine process.
- **Multi-source aggregation pattern** (specializations/shared/): The news skill's approach of aggregating 10+ sources with deduplication and ranking could generalize to a "multi-source research" process.

### Plugin Ideas
- **Finance data connector plugin:** A babysitter marketplace plugin that wraps the alphaear-stock and alphaear-news APIs as task definitions, providing financial data access within babysitter processes. Install.md would configure API keys for data sources (Cailian, WSJ, Polymarket).
- **Sentiment analysis plugin:** Wraps FinBERT scoring as a babysitter task kind, useful for any process that needs sentiment-aware decision gates.

### SKIP
- Individual SKILL.md files (skill-management pattern, not babysitter-native)
- The skill-creator meta-skill (SDK-covered primitive)

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Financial Analysis Workflow | NEW | Plan→Write→Edit→Chart pipeline for structured financial report generation | - | specializations/business/finance/financial-analysis-workflow.js |
| Signal Tracking Methodology | NEW | Investment signal state-machine process through strengthen/weaken/falsify states | - | specializations/business/finance/signal-tracking-methodology.js |
| Multi-Source Aggregation Pattern | NEW | Aggregating 10+ sources with deduplication and ranking for comprehensive research | - | specializations/shared/multi-source-aggregation-pattern.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Finance Data Connector | NEW | Financial data access via alphaear-stock and alphaear-news APIs with key configuration | - | plugins/a5c/marketplace/plugins/finance-data-connector/ |
| Sentiment Analysis Integration | NEW | FinBERT scoring as babysitter task kind for sentiment-aware decision gates | - | plugins/a5c/marketplace/plugins/sentiment-analysis-integration/ |
