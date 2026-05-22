# eugeniughelbur/obsidian-second-brain

- **Archetype:** utility-with-skill
- **Stars:** 126
- **Last pushed:** 2026-04-09
- **License:** MIT
- **Discovered:** 2026-04-12
- **Source**: gh-search

## Summary

A Claude Code skill that operates an Obsidian vault as a living knowledge management system. 25 commands across 3 layers: Operations (save, ingest, synthesize, reconcile, export, daily, log, task, person, decide, capture, find, recap, review, board, project, health, adr, visualize, init), Thinking Tools (challenge, emerge, connect, graduate), and Context Engine (world). Includes 4 scheduled agents (nightly maintenance: close day, reconcile contradictions, synthesize patterns, heal orphans, rebuild index). Has Python bootstrap scripts, vault health checker, and structured vault schema with bi-temporal fact tracking.

## Assessment

Per instructions, memory systems are ALWAYS plugins, never processes. This is squarely a memory/knowledge-management system. The extractable value is as a **plugin idea**, not as processes.

The system has genuine sophistication: bi-temporal fact tracking, contradiction reconciliation, cross-source synthesis, scheduled maintenance agents, 4 role presets (executive/builder/creator/researcher), and assistant mode. The vault schema and operating principles are well-defined. The nightly 5-phase maintenance agent is a real multi-phase workflow but it's vault maintenance, not a domain process.

The Python tooling (bootstrap_vault.py, vault_health.py, setup.sh) and MCP integration (mcp-obsidian) provide concrete installation and operational scripts.

## Extraction Priority

**Medium.** Strong plugin candidate with well-defined installation path, concrete tooling, and clear value proposition. The vault schema and operating principles are reusable knowledge.

---

## Processes

None. Memory systems are plugins, not processes.

## Plugin Ideas

### 1. Obsidian Second Brain

- **Name:** `obsidian-second-brain`
- **install.md description:** Installs an Obsidian vault integration as a babysitter plugin. The install process:
  1. Checks for Python 3 availability (required for bootstrap and health scripts).
  2. Prompts user for Obsidian vault path (or creates new vault).
  3. Runs `bootstrap_vault.py` with user-selected preset (executive/builder/creator/researcher) to create vault structure: `_CLAUDE.md`, `index.md`, `log.md`, folder hierarchy, kanban boards, and template files.
  4. Configures MCP server for vault access: `claude mcp add obsidian-vault -s user -- npx -y mcp-obsidian "/path/to/vault"`.
  5. Installs the SKILL.md with 25 commands into the harness skill directory.
  6. Optionally configures scheduled agents (nightly vault maintenance) as babysitter hooks.
  7. Creates `CRITICAL_FACTS.md` from user profile for fast session context loading (~120 tokens).
- **Key features to preserve:**
  - **Bi-temporal fact tracking:** Facts have both "when it was true" and "when the vault learned it" timestamps.
  - **Contradiction reconciliation:** `/obsidian-reconcile` finds and resolves conflicting facts across notes.
  - **Cross-source synthesis:** `/obsidian-synthesize` auto-finds patterns across ingested sources.
  - **Nightly 5-phase maintenance:** Close day, reconcile contradictions, synthesize patterns, heal orphans, rebuild index.
  - **Multi-format ingestion:** URLs, PDFs, audio (Whisper transcription), screenshots (OCR), YouTube videos.
  - **Progressive context loading:** `/obsidian-world` with L0-L3 token budgets for session startup.
  - **Never-create-in-isolation principle:** Every write propagates to all related notes (kanban, daily, project, person).
- **Vault presets as plugin configuration:**
  - `executive` -- Decisions, people, meetings, OKRs
  - `builder` -- Projects, dev logs, architecture decisions, sprints
  - `creator` -- Content calendar, ideas pipeline, audience notes
  - `researcher` -- Sources, literature notes, hypotheses, methodology
- **Dependencies:** Python 3, mcp-obsidian (npm), Whisper (optional, for audio ingestion)

### 2. Vault Health Monitor

- **Name:** `vault-health-monitor`
- **install.md description:** Lightweight plugin that installs `vault_health.py` as a periodic health check for Obsidian vaults. Reports: contradictions count, orphan notes, stale claims, gap analysis, structural issues. Could be wired into babysitter hooks for automated vault quality monitoring.
- **Source:** `scripts/vault_health.py`

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| N/A | N/A | No multi-step processes identified - memory systems are plugins, not processes | - | N/A |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Obsidian Second Brain Integration | UPGRADE | Comprehensive Obsidian vault management beyond existing basic integrations | plugins/a5c/marketplace/plugins/claude-mem/ | plugins/a5c/marketplace/plugins/obsidian-second-brain/ |
| Vault Health Monitor | NEW | Periodic health checks for Obsidian vaults with automated quality monitoring | - | plugins/a5c/marketplace/plugins/vault-health-monitor/ |

## Implicit Procedural Knowledge

- **Never-create-in-isolation pattern:** Every data write must propagate to all related entities. When creating a project note, also update the kanban board and daily note. This is a reusable principle for any process that generates artifacts -- always update all related indexes/boards/logs.
- **Progressive context loading (L0-L3):** Load identity and state at increasing detail levels based on token budget. L0 = critical facts only (~120 tokens), L3 = full vault state. Applicable to babysitter session context management.
- **Preset-driven initialization:** 4 role presets customize the entire vault structure at bootstrap time. This pattern (preset -> structural template) is reusable for any process that needs domain-specific scaffolding.
- **Bi-temporal fact model:** Tracking both "when was this true" and "when did we learn this" is applicable to any knowledge management or audit trail system.
