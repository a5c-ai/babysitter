# AIPMAndy/dna-memory
- **Archetype**: utility-with-skill
- **Stars**: 53
- **Last pushed**: 2026-04-01
- **License**: Apache-2.0
- **Discovered**: 2026-04-12
- **Skills found**: 1
- **Source**: gh-search

## Summary

A three-tier memory system for AI agents (working/short-term/long-term) with weight-based reinforcement, time-based decay/forgetting, reflection-driven pattern extraction, and memory promotion. Built on SQLite with FTS5 search. Originally designed for the OpenClaw ecosystem but the memory architecture and lifecycle patterns are transferable.

## Assessment

The memory lifecycle patterns (remember, recall, reflect, decay, promote, link) are transferable as a process definition. The three-tier architecture with weight decay and promotion thresholds encodes a well-defined state machine. The daemon pattern for background maintenance (auto-reflect, auto-decay) maps to a monitoring/maintenance process.

Repo-specific: Python implementation, OpenClaw-specific installation paths, Chinese-language documentation. The SQLite schema and Python scripts are implementation details -- the *process patterns* are what we want.

## Extraction Priority
- Medium
- Rationale: The memory lifecycle (remember -> reinforce -> reflect -> promote -> decay) is a clean process pattern applicable to any agent memory system. However, the babysitter SDK already has some memory/context management patterns, and this would primarily be useful as a specialization process for "agent memory maintenance" rather than a core methodology. The reflection/promotion cycle is the most novel extractable pattern.

---

## Processes

(No extractable processes -- memory systems are plugin territory, not process library entries.)

## Plugin Ideas

- **Agent Memory Plugin** (Context & Memory category): Installs a structured three-tier memory system (working/short-term/long-term) with weight-based decay, reflection-driven pattern extraction, and automatic promotion/demotion.
  - What install.md would do: Create memory/ directory structure with tier-specific storage, configure decay/reflect intervals in .a5c/config (auto_reflect_interval_minutes: 30, auto_decay_interval_hours: 24), set up session lifecycle hooks, install maintenance scripts for periodic memory hygiene.
  - Processes it would copy: None (plugin-internal logic)
  - Configs/hooks it would create: on-session-start hook to load relevant long-term memories; on-session-end hook to filter and persist working memory; periodic maintenance cron for decay/reflect/promote/dedupe cycle; memory type taxonomy config (fact/preference/skill/error/pattern/insight); `.a5c/commands/memory-evolve.md` slash command for manual maintenance.
  - Source evidence: SKILL.md three-tier architecture, scripts/evolve.py (reflect, decay, promote, dedupe commands), daemon section with configurable intervals. The weight-based promotion criteria (weight > threshold + stable over time + verified by reflection) and reflection-driven pattern extraction (gather recent high-weight items -> cluster -> synthesize -> store) are the core novel patterns.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| N/A | N/A | No extractable processes - memory systems belong in plugin territory, not process library | - | N/A |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Agent Memory System | UPGRADE | Enhance existing context/memory with three-tier architecture and decay patterns | claude-mem | plugins/a5c/marketplace/blueprints/agent-memory-system/ |

## Implicit Procedural Knowledge

(No extractable procedures -- all memory-related patterns belong in the plugin above.)
