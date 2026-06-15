# chainstacklabs/polyclaw

- **Archetype**: domain-skill-pack
- **Stars**: 301
- **Last pushed**: 2026-02-27
- **License**: Apache-2.0
- **Discovered**: 2026-04-12
- **Source**: ClawHub skills (published as "chainstacklabs/polyclaw", maps to "joelchance/polymarket" ClawHub listing)
- **Skills found**: 1 SKILL.md
- **Fork**: No

## Summary

Trading-enabled Polymarket prediction markets skill for OpenClaw. Written in Python with uv dependency management. Provides market browsing, wallet management, on-chain trading (split + CLOB execution on Polygon), position tracking with P&L, and LLM-powered hedge discovery.

Key features:
- Market browsing (trending, search, details) with JSON output
- On-chain trading via split + CLOB execution (buy YES/NO positions)
- Position tracking with entry price, current price, P&L (stored in ~/.openclaw/polyclaw/positions.json)
- Wallet management (status, approvals)
- Hedge discovery using LLM-powered contrapositive logic (coverage tiers T1-T3)
- Requires Chainstack node, private key, and OpenRouter API key

## Assessment

LOW extractable value for babysitter. This is a domain-specific financial trading skill. The hedge discovery using LLM-powered logical analysis is intellectually interesting but highly niche. The on-chain trading patterns are not generalizable. However, the prediction market data could be useful as a signal source in research processes.

**Extraction priority**: LOW

# Extractable Value: chainstacklabs/polyclaw

## Processes

### 1. Prediction Market Research
- **Source**: Market browsing + hedge discovery analysis
- **Placement**: `specializations/business/prediction-market-research.js`
- **Description**: Process for researching prediction markets: search for markets by topic -> fetch market details and current prices -> analyze correlated markets for hedging opportunities -> generate research briefing with probability assessments and market sentiment. Breakpoint for user review before any position-taking recommendations. Read-only, no trading.

## Plugin Ideas

### 1. Prediction Market Signal Plugin
- **Category**: Knowledge Management
- **install.md**: Installs polyclaw Python dependencies (uv sync), configures Chainstack node URL (free tier). Read-only mode: provides babysitter tasks for browsing Polymarket markets, fetching current probabilities, and searching by topic. No trading keys required for read-only use. Useful as a probability signal source in research and decision-making processes.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Prediction Market Research | NEW | Research prediction markets for probability assessments and market sentiment analysis | - | specializations/business/prediction-market-research.js |
| LLM-Powered Logical Analysis | NEW | Contrapositive analysis pattern for distinguishing causation from correlation | - | specializations/shared/llm-logical-analysis.js |
| Coverage Tier Risk Assessment | NEW | Graduated confidence levels (T1/T2/T3) for risk assessment processes | - | specializations/shared/coverage-tier-risk-assessment.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Prediction Market Signal | NEW | Read-only market browsing and probability signal sourcing for research processes | - | plugins/a5c/marketplace/blueprints/prediction-market-signal/ |

## Implicit Procedural Knowledge

- **LLM-powered logical analysis for hedging**: Using an LLM to find contrapositive implications between prediction markets (only logically necessary implications accepted, not correlations). This strict logical filtering pattern is applicable to any LLM-powered analysis where you need to distinguish causation from correlation.
- **Coverage tier classification**: The T1/T2/T3 tier system for rating hedge quality (>=95%, 90-95%, 85-90%) is a pattern for graduated confidence levels in any risk assessment process.
