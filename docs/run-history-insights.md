# Babysitter Run History Insights

> Generated on 2026-03-19 by /babysitter:cleanup

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total runs scanned | 87 |
| Completed | 63 |
| Failed | 6 |
| Active/In-progress | 18 |
| Eligible for cleanup (terminal, >7 days) | 61 |
| Orphaned process files | 4 |

## Run Categories

### SDK & CLI Development (15 runs)
Core SDK improvements including CLI bash migration, shell-to-CLI refactor, DX optimization, path resolution utilities, completionSecret rename, prompt persistence, staging versioning, and hook thin-shell refactors. **All completed successfully.**

### Process Library & Specializations (18 runs)
Building out the methodology and specialization library: methodology backlogs (4 runs, 2 failed before v4 succeeded), DS/ML processes, QA testing, engineering/science/business/social-sciences specializations, and process creation tooling. **16 completed, 2 failed (early methodology backlog iterations).**

### Plugin Ecosystem (5 runs)
Plugin DX optimization, plugins feature-complete, marketplace plugin creation, and meta plugin creation. **All completed.**

### Harness & Assimilation (4 runs)
Harness integration docs, antigravity/process harnesses, methodology assimilation, and batch AI workflow assimilation. **All completed.**

### Testing & CI (5 runs)
CI test assertion fixes, packaging/test convergence, and fix-gitignore. **All completed.**

### Catalog & Documentation (4 runs)
Process library catalog, catalog sci-fi theme, README compaction, CLAUDE.md quality convergence. **All completed.**

### Bug Fixes & Maintenance (7 runs)
Bug fix run analysis, skill discovery fix, staging vulnerabilities, docs inconsistencies, breakpoint rejection docs, doubled A5C paths. **All completed.**

### Feature Development (3 runs)
Observer tooling experiments, SDK language porting analysis, cradle gap closure. **All completed.**

## Key Patterns & Insights

1. **Iterative convergence works**: The methodology backlog went through 4 iterations (v1-v4) before succeeding. Failed runs informed the next attempt, leading to eventual success.

2. **Specialization builds are reliable**: All phase1-phase2 specialization builds (engineering, science, business, social-sciences, humanities) completed successfully on first attempt.

3. **Most runs complete on first attempt**: 63/69 terminal runs (91%) completed successfully, indicating the orchestration process is mature.

4. **Deprecation tasks are risky**: The breakpoints package deprecation failed twice before being abandoned — suggests deprecation processes need extra care.

5. **Plugin/harness development is stable**: Zero failures across plugin, harness, and assimilation runs.

## What Worked Well

- **Phased specialization builds**: Breaking domain knowledge into phase1 (research) + phase2 (implementation) produced reliable results across all domains
- **SDK DX optimization**: Single-pass improvements to CLI, plugins, and developer experience all succeeded
- **Testing infrastructure**: CI test assertions and packaging checks converged successfully
- **Process library expansion**: The methodology and specialization library grew from ~8 to 30+ entries reliably

## What Didn't Work

- **Methodology backlog v1-v3**: Three failures before v4 succeeded — the scope was too large for a single run, needed incremental approach
- **Deprecation processes**: breakpoints package deprecation failed twice — removal of existing functionality needs more careful orchestration
- **Milestone-1 E2E iteration**: The early E2E test milestone failed, likely due to immature infrastructure

## Recommendations

1. **Break large scope into incremental runs** rather than attempting everything in one process
2. **Add deprecation-specific methodology** with rollback gates and compatibility checks
3. **Keep using phased specialization patterns** (phase1 research + phase2 implementation) — proven reliable
4. **Archive run insights periodically** (this cleanup process) to prevent .a5c/runs/ from growing unbounded
5. **Consider auto-cleanup hook** that runs after each completed run to prevent accumulation

---

## Cleanup Round 2 — 2026-05-06

### Summary
- **240 terminal runs removed** (older than 7 days, ~80MB freed)
- **359 orphaned process files removed** (~3.8MB freed)
- **23 recent runs retained** (2026-04-30 to 2026-05-06)
- Post-cleanup: 2.6MB runs, 919KB processes

### Run Categories (2026-04-30 to 2026-05-06)

**agent-mux webui convergence** (5 runs) — iterative compendium design kit migration with live gateway validation. Multi-batch approach, each run picking up where the last left off.

**Release infrastructure** (4 runs) — release-artifact-reproducibility migration needed 4 attempts to converge. Publish tag fixes, version sync across external plugin repos.

**Triggers package** (3 runs) — refactor, hardening, gap closure. Sequential refinement pattern.

**Atlas migration** (2 runs) — monorepo migration from v6 repo, domain enrichment. Manual orchestration (no hook-driven continuation available).

**Adapter refactoring** (1 run) — agent-plugins-mux per-harness adapter extraction. Partially manual.

**SDK enhancements** (1 run) — version markers in run artifacts.

**Documentation** (2 runs) — overview.md generation, v6 announcement doc.

### Patterns

- **Multi-batch convergence** continues to be the dominant pattern — webui usability used 5 sequential runs
- **Release pipeline work** is high-retry — 4 attempts for artifact reproducibility
- **Atlas integration** required manual orchestration due to hook limitations in the current environment
- **Most runs hit 8 journal events** (typical phase ceiling)

### Data Loss Notice

240 runs were removed before insights were fully aggregated from their journals. Future cleanups must run `aggregate-insights` BEFORE `remove-runs`.
