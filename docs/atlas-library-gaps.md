# Atlas Graph ↔ Library Gap Report

Generated: 2026-05-07

## Summary

- Records: 13,043
- Edges: 67,283
- Edge validity: 100.0% (18 dangling / 67,283 total — all from pre-existing hook-surface/lifecycle-state/graph prefixes)
- Skill-areas: 456/456 connected (100%)
- Roles: 106/133 connected (79.7%)

## Remaining Gaps

### Skill Areas Without Library Implementations

None — all 456 skill-area graph nodes now have at least one library skill pointing to them.

### Roles Without Library Agents

The following 29 roles remain without library agent implementations. These are **intentionally skipped** as they are bot/automation roles, convergent variants, or highly generic utility roles not suitable for standalone agent stubs:

**Bot / automation roles (intentionally skipped):**
- `role:release-manager-bot`
- `role:dependency-updater-bot`
- `role:security-scanner-bot`
- `role:changelog-writer`
- `role:adr-writer`
- `role:flaky-test-detector`
- `role:perf-regression-detector`
- `role:cost-tracker`
- `role:sre-runbook-author`
- `role:typo-fixer`

**Convergent/specialized variants (intentionally skipped):**
- `role:ml-engineer-convergent`
- `role:technical-writer-convergent`
- `role:engineering-manager-convergent`
- `role:staff-engineer-convergent`

**Generic utility roles (intentionally skipped):**
- `role:implementer`
- `role:planner`
- `role:explorer`
- `role:end-user`
- `role:debugger`
- `role:test-writer`

**Specialist roles without clear domain home (future work):**
- `role:on-call`
- `role:technical-artist`
- `role:ai-champion`
- `role:code-reviewer`
- `role:db-migrator`
- `role:doc-generator`
- `role:operational-risk-analyst`
- `role:i18n-extractor`
- `role:bug-triager`

### Dangling Edges

18 dangling edges (0.03% of total):

| Target Prefix | Count | Notes |
|---------------|-------|-------|
| `hook-surface:` | 7 | Pre-existing — hook surface nodes not indexed |
| `lifecycle-state:` | 6 | Pre-existing — lifecycle state nodes not indexed |
| `role:` | 3 | Pre-existing references to roles not yet in graph |
| `graph:` | 2 | Pre-existing — graph meta references |

These dangling edges are all pre-existing and not introduced by this change.
