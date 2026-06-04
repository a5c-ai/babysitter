# Genty Features Backlog: Adversarial Gap Analysis

> Comprehensive audit of 147 feature gaps from the original genty backlog, verified against the current codebase with adversarial rigor. Every "implemented" claim was verified with file-level evidence; every "partial" was stress-tested for wiring gaps.

## Key Findings

| Metric | Value |
|--------|-------|
| **Total gaps analyzed** | 147 |
| **CLOSED** | 69 (47%) |
| **IN_PROGRESS** | 49 (33%) |
| **OPEN** | 22 (15%) |
| **NEEDS_RESPEC** | 7 (5%) |
| **Actionable (non-CLOSED)** | 78 |

### The backlog was massively stale

94 of 147 gaps were upgraded from their original status. The original inventory classified many features as "Missing" that had since been fully or partially implemented. The codebase has advanced far beyond what the backlog reflected.

### Critical path

**GAP-SUBOBS-001** (Streaming Output Capture from Invoked Harnesses) is the single most impactful foundation gap, with **22 downstream dependents** spanning subagent observability, parallelization, performance, and UX domains. It is the #1 priority for unblocking maximum downstream work.

### Quick wins

**11 quick wins** are available immediately -- High/Critical priority, S remaining effort, no blockers. These represent ~2-3 M-equivalent sprints of work but unblock the majority of the downstream backlog.

### Parallel work streams

**8 independent tracks** identified that can proceed concurrently:
1. Subagent Observability + Parallelization Core (16 gaps, Critical)
2. Ecosystem and Plugin Platform (9 gaps)
3. Remote and Host Integration (4 gaps)
4. Prompt Engineering and Caching (6 gaps)
5. Process Composition and State Lifecycle (10 gaps)
6. UI/UX Rendering -- blocked on GAP-UX-001 respec (10 gaps)
7. Security, Privacy, and Auth (4 gaps)
8. Independent Leaf Gaps (19 gaps)

### Roadmap

**6 milestones (M0-M5)**, estimated **6-8 months with 2-3 parallel contributors**:

| Milestone | Theme | Gap Count | Key Metric |
|-----------|-------|-----------|------------|
| M0 | Quick wins + foundation | 16 + respec | Unblocks 50+ downstream gaps |
| M1 | Critical path | 7 | Concurrent execution works |
| M2 | Parallel tracks | 16 | 5 independent streams progress |
| M3 | Integration | 11 | Cross-track features work |
| M4 | Polish and UX | 12 | Rich rendering and interaction |
| M5 | Ecosystem + long-tail | 16 | Backlog closed |

---

## Analysis Phases

This analysis was conducted in 6 adversarial phases. Each phase output is linked below.

### Phase 1: Inventory

- **[phase1-inventory.json](phase1-inventory.json)** -- Raw inventory of all 147 gaps with original status, category, effort, and target state descriptions.
- **[phase1-category-summary.md](phase1-category-summary.md)** -- Category-level summary of the original backlog distribution.
- **[phase1-corrections.md](phase1-corrections.md)** -- Corrections and normalization applied during inventory extraction.

### Phase 2: Codebase Audit

- **[phase2-codebase-audit.json](phase2-codebase-audit.json)** -- Per-gap audit results with file-level evidence, audit status (IMPLEMENTED / PARTIALLY_IMPLEMENTED / NOT_STARTED), and adversarial notes.
- **[phase2-stale-paths.md](phase2-stale-paths.md)** -- File paths referenced in the original backlog that no longer exist or have moved.
- **[phase2-corrections.md](phase2-corrections.md)** -- Corrections applied during the codebase audit.

### Phase 3: Reclassification

- **[phase3-reclassified.json](phase3-reclassified.json)** -- Final status for all 147 gaps (CLOSED / IN_PROGRESS / OPEN / NEEDS_RESPEC) with adversarial justification for each status change.
- **[phase3-status-changes.md](phase3-status-changes.md)** -- All status transitions documented with reasoning.
- **[phase3-closed-gaps.md](phase3-closed-gaps.md)** -- The 69 closed gaps with file-level evidence, grouped by category.

### Phase 4: Dependency Graph

- **[phase4-dependency-graph.json](phase4-dependency-graph.json)** -- Dependency edges between all non-CLOSED gaps.
- **[phase4-critical-path.md](phase4-critical-path.md)** -- Critical path analysis: 6-node chain through SUBOBS-001 to SESSION-003, plus foundation gap rankings by downstream impact.
- **[phase4-parallel-tracks.md](phase4-parallel-tracks.md)** -- 8 independent parallel work streams with internal execution order.

### Phase 5: Effort Recalibration

- **[phase5-effort-recalibration.json](phase5-effort-recalibration.json)** -- Recalibrated effort estimates for all 78 actionable gaps, accounting for partial progress and risk.
- **[phase5-quick-wins.md](phase5-quick-wins.md)** -- 11 quick wins (High/Critical, S effort, no blockers) with suggested PR titles and files to modify.
- **[phase5-risk-register.md](phase5-risk-register.md)** -- Risk register: 15 High, 17 Medium, 18 Low risk gaps with mitigation strategies.

### Phase 6: Roadmap

- **[phase6-roadmap.md](phase6-roadmap.md)** -- M0-M5 milestone plan with dependencies, parallelism, and success criteria.
- **[phase6-task-definitions.json](phase6-task-definitions.json)** -- Detailed task definitions for all 78 actionable gaps: acceptance criteria, files to modify, suggested PR scope.
- **[phase6-milestone-summary.md](phase6-milestone-summary.md)** -- Executive milestone summary with effort distribution, risk profile, and recommended cadence.

### Final Assembly

- **[gap-status-matrix.md](gap-status-matrix.md)** -- Full 147-gap matrix table with all columns, sorted by status and priority.
- **[next-steps.md](next-steps.md)** -- Concrete next actions: first 5 PRs, respec decisions, ongoing triage process.
