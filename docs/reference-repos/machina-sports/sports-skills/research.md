# machina-sports/sports-skills

- **Archetype:** domain-skill-pack
- **Stars:** 66
- **Last pushed:** 2026-04-12
- **License:** MIT
- **Discovered:** 2026-04-12
- **Source**: gh-search

## Summary

Open-source sports data and prediction market skills. 19 SKILL.md files covering 14+ sports (NFL, NBA, MLB, NHL, WNBA, tennis, golf, F1, college sports, volleyball, football/soccer across 13 leagues) plus prediction markets (Kalshi, Polymarket) and betting analytics. Published as both npm (`npx skills add`) and Python (`pip install sports-skills`) packages.

Key differentiators: zero API keys required (wraps public ESPN, FPL, Understat, Transfermarkt, Kalshi, Polymarket APIs), includes a markets orchestration skill that bridges live ESPN schedules with prediction market odds, a betting analysis module (pure computation: odds conversion, de-vigging, Kelly criterion, arbitrage detection), and a sports reporter skill for generating journalism from live data.

Includes automated nightly health checks that test all upstream endpoints and generate structured reports with GitHub issue auto-filing on failures.

## Assessment

Moderate extractable value. The betting analysis workflow (fetch odds -> de-vig -> compute edge -> Kelly sizing -> arbitrage scan) is a clear multi-phase analytical pipeline. The markets orchestration (ESPN schedule -> match to prediction markets -> normalize prices -> evaluate) is another. The nightly health check for upstream API monitoring is a reusable process pattern.

The skills themselves are primarily data-access wrappers (API reference + CLI commands) with limited multi-phase logic, but the orchestration and analysis layers on top are genuinely novel.

## Extraction Priority

**MEDIUM** - The betting/markets analysis pipeline and API health monitoring process are extractable. The data-access skills themselves are reference material rather than processes.

---

## Processes

### 1. Sports Betting Edge Analysis Pipeline

**Placement:** `specializations/sports-analytics/betting-edge-analysis.js`

Multi-phase analytical pipeline for evaluating betting opportunities across sportsbooks and prediction markets.

**Phases:**
1. **Data Collection** - Fetch odds from multiple sources: ESPN (American odds), Kalshi (integer probabilities), Polymarket (decimal probabilities)
2. **Normalization** - Convert all odds to implied probabilities. De-vig sportsbook lines to extract fair probabilities (remove the house edge)
3. **Edge Detection** - Compare fair probabilities against prediction market prices. Calculate edge percentage and expected value per dollar
4. **Sizing & Arbitrage** - Apply Kelly criterion for optimal bet sizing. Scan cross-platform price combinations for arbitrage (total implied probability < 1.0)
5. **Report** - Present findings with fair probability, edge, EV, Kelly fraction, arbitrage ROI if found, and line movement classification

**Tasks:**
- `fetch-odds` (node) - collect odds from configured sources for a given event
- `normalize-devig` (node) - convert formats, remove vig, compute fair probabilities
- `compute-edge` (node) - compare fair vs market, calculate EV and Kelly
- `detect-arbitrage` (node) - cross-platform arbitrage scan
- `generate-report` (node) - synthesize findings into actionable output

### 2. Upstream API Health Monitor

**Placement:** `specializations/shared/api-health-monitor.js`

Automated health monitoring process for multi-source data pipelines. Extracted from sports-skills' nightly health check but generalizable to any system that depends on multiple external APIs.

**Phases:**
1. **Endpoint Discovery** - Enumerate all configured upstream endpoints with expected response characteristics
2. **Parallel Probe** - Hit each endpoint with timeout, measure latency, validate response structure
3. **Classification** - Categorize each source as OK (responsive + valid), Degraded (responsive but slow > threshold), or Down (unreachable / invalid response)
4. **Report Generation** - Produce structured JSON results + human-readable markdown summary
5. **Alert** - If failures detected, generate GitHub issue body for auto-filing

**Tasks:**
- `enumerate-endpoints` (node) - load endpoint config, return probe list
- `probe-endpoint` (node) - HTTP request with timeout, return latency + status + body sample
- `classify-results` (node) - apply thresholds, categorize health status
- `generate-health-report` (node) - structured JSON + markdown output
- `file-alert` (node, conditional) - create GitHub issue if degraded/down sources found

## Plugin Ideas

### 1. Sports Data Integration Plugin

**Format:** Babysitter marketplace plugin with install.md

**install.md description:** Installs sports data access skills for AI agents. Provides structured CLI interfaces to public ESPN, FPL, Understat, Transfermarkt, Kalshi, and Polymarket APIs. Includes 14+ sport modules (NFL, NBA, MLB, NHL, football/soccer, F1, tennis, golf, college sports), prediction market integration, betting analytics (odds conversion, de-vigging, Kelly criterion, arbitrage), and a sports reporter for generating journalism from live data. Zero API keys required.

**Key components:**
- Skills: per-sport data access (19 skills), markets orchestration, betting analysis, sports reporter
- Commands: sport-specific data queries, market comparison, edge analysis
- Scripts: nightly health check for upstream API monitoring
- References: per-skill API reference docs, team/player ID lookups, conference mappings

**Why this is a plugin:** Persistent data access tooling that agents use on-demand, not a one-shot workflow. The skills activate contextually when users ask about sports data or betting analysis.

## Implicit Procedural Knowledge

- **De-vigging as a prerequisite:** Never compare raw sportsbook odds directly against prediction market prices. Always de-vig first to extract fair probability, then compare. This is the single most common analytical error in sports betting.
- **Source-aware price normalization:** ESPN uses American odds (-150/+130), Polymarket uses 0-1 decimals, Kalshi uses 0-100 integers. Normalization to implied probability must happen before any cross-source comparison.
- **Nightly health checks with threshold-based classification:** The OK/Degraded/Down trichotomy (using a 3-second latency threshold) is more useful than binary up/down for services that gracefully degrade.
- **Sport-aware entity search:** When bridging ESPN schedules to prediction markets, map through sport codes (e.g., NBA -> `KXNBA` for Kalshi, NBA -> series_id for Polymarket) rather than free-text search. Structured mapping eliminates false matches.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Sports Betting Edge Analysis Pipeline | NEW | Multi-phase betting opportunity evaluation with de-vigging and Kelly criterion | - | specializations/business/sports-betting-edge-analysis.js |
| Upstream API Health Monitor | NEW | Automated health monitoring for multi-source data pipelines with structured reporting | - | specializations/shared/upstream-api-health-monitor.js |
| De-Vigging and Odds Normalization | NEW | Sports betting odds conversion and fair probability extraction | - | specializations/shared/devigging-odds-normalization.js |
| Cross-Platform Arbitrage Detection | NEW | Price comparison across prediction markets and sportsbooks for arbitrage opportunities | - | specializations/shared/cross-platform-arbitrage-detection.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Sports Data Integration | NEW | Zero-API-key sports data access across 14+ sports with betting analytics and market integration | - | plugins/a5c/marketplace/blueprints/sports-data-integration/ |
