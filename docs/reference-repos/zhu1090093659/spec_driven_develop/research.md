# zhu1090093659/spec_driven_develop

- **Archetype:** methodology-repo
- **Stars:** 676
- **Last pushed:** 2026-04-11
- **License:** MIT
- **Discovered:** 2026-04-12
- **URL:** https://github.com/zhu1090093659/spec_driven_develop
- **Source**: gh-search

## Summary

Spec-Driven Develop is a platform-agnostic AI agent methodology implemented as pure Markdown files. It provides a 7-phase preparation pipeline (with additional development and archive phases) for large-scale AI-assisted development tasks. Built around the S.U.P.E.R architectural philosophy (Single Purpose, Unidirectional Flow, Ports over Implementation, Environment-Agnostic, Replaceable Parts). Packaged as a Claude Code plugin marketplace with sub-agents (project-analyzer, task-architect, task-executor).

## Assessment

This is primarily a development methodology competitor to babysitter's existing spec-driven and TDD methodologies. The core 7-phase pipeline overlaps significantly with what babysitter already provides in `methodologies/`. However, there are two novel elements worth extracting:

1. **S.U.P.E.R scoring system:** Per-module, per-principle compliance scoring (S-green U-yellow P-red E-green R-yellow) as a structured quality assessment. This is a concrete, enforceable architecture quality rubric that could be extracted as a process.

2. **10-point code review checklist tied to architectural principles:** Each check maps to a S.U.P.E.R principle with explicit pass/fail thresholds (all pass = proceed, 1-2 fail = fix, 3+ fail = stop and refactor).

The sub-SKILL generation pattern (Phase 5) where the process generates a project-specific SKILL with inlined principles is interesting but specific to the Claude Code skill format.

## Extraction Priority

**LOW** -- The overall methodology overlaps heavily with existing babysitter processes. The S.U.P.E.R scoring rubric and the code review checklist are the only novel elements worth extracting, and they are assessment tools rather than full processes.

---

## Processes

### 1. Architecture Quality Assessment Process (S.U.P.E.R Scoring)

**Source:** `plugins/spec-driven-develop/skills/spec-driven-develop/references/super-philosophy.md`
**Placement:** `specializations/shared/architecture-quality-assessment`

A structured architecture quality assessment that scores each module against 5 principles:

- **S (Single Purpose):** One module, one job. Rate single-responsibility compliance.
- **U (Unidirectional Flow):** Data flows one way. Flag circular dependencies.
- **P (Ports over Implementation):** Contracts before code. Evaluate schema-defined I/O.
- **E (Environment-Agnostic):** Runs anywhere. Catch hardcoded config and platform-specific assumptions.
- **R (Replaceable Parts):** Swap without ripple. Rate replacement cost per module.

Each module gets a per-principle traffic-light score. Violation hotspots are identified for prioritized remediation.

Process phases:
1. Module inventory with dependency mapping
2. Per-module S.U.P.E.R scoring
3. Violation hotspot identification
4. Remediation priority ranking
5. Architecture health summary report

### 2. Architecture-Gated Code Review Process

**Source:** `plugins/spec-driven-develop/skills/spec-driven-develop/references/super-philosophy.md`
**Placement:** `specializations/shared/architecture-gated-review`

10-point code review checklist with explicit pass/fail thresholds:

| Check | Principle |
|-------|-----------|
| Every new module/file has exactly one responsibility | S |
| No function does more than one conceptual thing | S |
| Data flows input -> processing -> output, no reverse deps | U |
| No circular imports introduced | U |
| Cross-module interfaces are schema-defined | P |
| Module I/O is serializable | P |
| No hardcoded paths, URLs, keys, or config values | E |
| All new dependencies explicitly declared | E |
| New modules can be replaced without changes to others | R |
| All tests pass after the change | -- |

Thresholds: All pass = proceed. 1-2 fail = fix before marking complete. 3+ fail = stop and refactor.

Could be codified as a post-task verification step or standalone review process.

## Plugin Ideas

None. The repo is pure methodology (Markdown files). No tool integrations or installable packages.

## Implicit Procedural Knowledge

- **Per-principle traffic-light scoring:** Scoring modules against multiple named principles with visual indicators is a reusable assessment pattern. Could be generalized beyond S.U.P.E.R to any principle set.
- **Threshold-based gating:** The 0/1-2/3+ failure threshold model for deciding proceed/fix/stop is a clean, concrete quality gate pattern applicable to any review process.
- **Cross-conversation memory anchoring:** Using a master progress file (MASTER.md) as the agent's memory anchor across sessions. Babysitter already handles this via journal/state, but the explicit "memory anchor" framing is useful.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Architecture Quality Assessment Process | NEW | S.U.P.E.R scoring system for module assessment against 5 architectural principles | - | specializations/shared/architecture-quality-assessment.js |
| Architecture-Gated Code Review Process | NEW | 10-point code review checklist with explicit pass/fail thresholds and gating logic | - | specializations/shared/architecture-gated-review.js |
| Per-Principle Traffic-Light Scoring | NEW | Visual assessment pattern scoring modules against named principles with traffic-light indicators | - | specializations/shared/per-principle-traffic-light-scoring.js |
| Threshold-Based Gating | NEW | Quality gate pattern with 0/1-2/3+ failure thresholds for proceed/fix/stop decisions | - | specializations/shared/threshold-based-gating.js |
| Cross-Conversation Memory Anchoring | NEW | Master progress file pattern for agent memory persistence across sessions | - | specializations/shared/cross-conversation-memory-anchoring.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Architecture Quality Assessment | NEW | S.U.P.E.R scoring system implementation with traffic-light visualization and remediation prioritization | - | plugins/a5c/marketplace/plugins/architecture-quality-assessment/ |
