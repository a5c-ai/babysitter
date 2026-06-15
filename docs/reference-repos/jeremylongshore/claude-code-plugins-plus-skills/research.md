# jeremylongshore/claude-code-plugins-plus-skills

- **Archetype**: plugin-marketplace
- **Stars**: 1,909
- **Last pushed**: 2026-04-09
- **License**: MIT
- **Discovered**: 2026-04-12
- **Skills found**: 1,367+ (claimed), ~2 unique plugin skills in plugins/, massive backup tree

## Summary

A large-scale open-source marketplace claiming 340 plugins and 1,367 agent skills for Claude Code. Includes a CCPI package manager, interactive tutorials, and production orchestration patterns. Monorepo structure with pnpm workspaces, Firebase hosting, and a custom plugin system. Contains plugins organized by domain (ai-agency, ai-ml, api-development, automation, business-tools, community, crypto, database, design, devops, finance, performance), a `marketplace/` directory, planned-skills backlog, tutorials, and workflows. The massive `backups/` directory contains timestamped snapshots of enhanced plugins. Ships with CLAUDE.md, AGENTS.md, and Gemini integration.

## Assessment

Ambitious scope but quality is uncertain given the backup-heavy repository structure. The domain categorization of plugins (ai-agency, crypto, finance, devops, design) covers business domains not typically seen in developer-focused collections. The CCPI package manager concept is relevant to babysitter's plugin management system. The sheer volume (340 plugins claimed) makes this a potential bulk-assimilation target, though quality filtering would be essential.

## Extraction Priority
- Medium
- Rationale: Large volume of plugins/skills across diverse domains. Quality is variable (many backup copies suggest iterative refinement). The domain categories (crypto, finance, business-tools) cover areas underrepresented in babysitter's process library. Needs quality filtering before extraction.

## Processes

### 1. Plugin Enhancement Pipeline
- **Source**: backup/enhancement pattern observed in repo
- **Placement**: `specializations/shared/plugin-enhancement-pipeline.js`
- **Description**: Iterative plugin improvement process: analyze existing plugin -> identify enhancement areas -> implement improvements -> backup previous version -> validate enhanced plugin -> publish.

### 2. Crypto/Finance Workflow
- **Source**: crypto/, finance/ plugin categories
- **Placement**: `specializations/business/crypto-finance-workflow.js`
- **Description**: Domain processes for crypto/finance: market analysis, portfolio tracking, DeFi interaction, financial reporting. Extracted from domain-specific plugins.

## Plugin Ideas

- **Plugin Migration Tool plugin**: Migrate CCPI-format plugins to babysitter marketplace format (install.md-driven). Category: DevX.
- **Bulk Skill Importer plugin**: Scan external skill/plugin repos, quality-filter, and batch-import compatible skills into babysitter's process library. Category: workflow automation.

## Patterns

- Timestamped backup snapshots for plugin version history (alternative to git-based versioning)
- Domain-organized plugin directories (ai-ml, crypto, finance, devops)
- Custom package manager (CCPI) for skill distribution
- Firebase hosting for marketplace frontend
- Multi-harness support (CLAUDE.md + AGENTS.md + Gemini)
- Planned-skills backlog directory for roadmap tracking

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Plugin Enhancement Pipeline | NEW | Iterative plugin improvement with backup versioning and validation | - | specializations/shared/plugin-enhancement-pipeline.js |
| Crypto/Finance Workflow | NEW | Market analysis, portfolio tracking, DeFi interaction, and financial reporting | - | specializations/business/crypto-finance-workflow.js |
| Marketplace Management | NEW | Plugin categorization, quality filtering, and distribution management | - | specializations/shared/marketplace-management.js |
| Multi-Harness Plugin Distribution | NEW | Cross-platform plugin compatibility and distribution patterns | - | specializations/shared/multi-harness-plugin-distribution.js |
| Plugin Version Backup System | NEW | Timestamped backup snapshots for plugin version history | - | specializations/shared/plugin-version-backup-system.js |
| Domain-Organized Plugin Classification | NEW | Business domain categorization for plugin organization | - | specializations/shared/domain-plugin-classification.js |
| Bulk Quality Assessment | NEW | Quality filtering and validation for large-scale plugin collections | - | specializations/shared/bulk-quality-assessment.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| N/A | N/A | Repository focuses on plugin organization rather than external integrations | - | N/A |
