# truongduy2611/app-store-preflight-skills

## Metadata
- **Stars**: 1,065
- **Description**: AI agent skill to scan iOS/macOS projects for App Store rejection patterns before submission
- **License**: MIT
- **Last pushed**: 2026-03-20
- **Topics**: (none)
- **Fork**: No

## Classification
- **Archetype**: utility-with-skill
- **Domain**: iOS/macOS App Store submission

## Structure
- `SKILL.md` -- comprehensive preflight skill instructions
- `references/` -- structured reference materials:
  - `guidelines/` -- 100+ Apple Review Guidelines indexed
  - `guidelines/by-app-type/` -- 10 app-type specific checklists (all_apps, subscription_iap, social_ugc, kids, health_fitness, games, macos, ai_apps, crypto_finance, vpn)
  - `rules/` -- rejection rules organized by category:
    - `metadata/` -- competitor terms, Apple trademark, China storefront, accurate metadata, subscription metadata
    - `subscription/` -- missing ToS/PP, misleading pricing
    - `privacy/` -- unnecessary data, privacy manifest
    - `design/` -- Sign in with Apple, minimum functionality
    - `entitlements/` -- unused entitlements
- Integrates with `asc` CLI (App Store Connect CLI)
- Install via: `npx skills add truongduy2611/app-store-preflight-skills`

## Key Observations
- Highly structured compliance checking workflow
- Clear process: identify app type -> load checklist -> pull metadata -> scan against rules -> report -> autofix
- Rule-based architecture with severity levels (REJECTION vs WARNING)
- The workflow is inherently a process: sequential phases with clear inputs/outputs
- MIT license -- permissive
- Relatively focused scope (pre-submission only)

## Extractable Value

### Processes
- **App Store preflight workflow** -- placement: `specializations/mobile/app-store-preflight.js`
  - App type classification
  - Metadata pull and validation
  - Rule-based scanning against Apple guidelines
  - Finding report with severity/resolution
  - Autofix and re-validation
  - Breakpoints: human review of findings before autofix
- **Compliance checklist orchestration** -- placement: `specializations/shared/compliance-checklist.js`
  - Generic pattern extractable from this: load checklist by type -> scan -> report -> fix -> verify
  - Applicable beyond App Store to any compliance domain

### Plugin Ideas
- **app-store-preflight plugin** -- babysitter marketplace plugin
  - install.md: install `asc` CLI (`brew install asc`), configure App Store Connect credentials
  - Skills: preflight scan, metadata validation, rule checking
  - References: bundled Apple guidelines and rejection rules
  - Hooks: pre-commit hook to run preflight before submission-related commits

### SKIP
- Individual Apple guideline content (reference knowledge)
- asc CLI integration details (external tool, not babysitter primitive)

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| App Store Preflight Workflow | NEW | iOS/macOS App Store compliance checking with app type classification and rule-based scanning | - | specializations/mobile/app-store-preflight.js |
| Compliance Checklist Orchestration | NEW | Generic compliance pattern: load checklist by type → scan → report → fix → verify | - | specializations/shared/compliance-checklist.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| App Store Preflight Plugin | NEW | iOS/macOS App Store compliance checking with ASC CLI integration and pre-commit hooks | - | plugins/a5c/marketplace/blueprints/app-store-preflight/ |
