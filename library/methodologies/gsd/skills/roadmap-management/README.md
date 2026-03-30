# roadmap-management

Roadmap parsing, phase operations, and requirements coverage analysis for GSD projects.

## Quick Start

ROADMAP.md is the master plan. This skill reads, modifies, and analyzes the roadmap.

### Parse the Roadmap

Read `.planning/ROADMAP.md` and extract milestones, phases, statuses, and requirement mappings.

### Add a Phase

Append a new phase at the end of the current milestone with the next sequential number.

### Insert a Decimal Phase

Insert urgent work between existing phases (e.g., Phase 72.1 between 72 and 73).

### Check Requirements Coverage

Verify every requirement in REQUIREMENTS.md is mapped to at least one phase.

## Examples

### Roadmap Structure

```markdown
## Milestone v1.0: MVP

### Phase 70: Setup
- **Status**: completed
- **Requirements**: R1, R2

### Phase 71: Database
- **Status**: in-progress
- **Requirements**: R3, R4
```

### Phase Status Flow

`planned` -> `in-progress` -> `completed` -> `verified`

### Coverage Report

```
Requirements: 13 total
Mapped: 13 (100%)
Gaps: none
```

## Troubleshooting

### Phase numbering is wrong after removal
- Phase removal triggers automatic renumbering
- Check that all references to old phase numbers have been updated
- Run `gsd health` to verify roadmap consistency

### Cannot remove a phase
- Only `planned` phases can be removed
- In-progress and completed phases are protected
- Complete the phase first or mark it as skipped

### Requirements coverage below 100%
- List unmapped requirements with `coverage_analysis()`
- Add new phases or update existing phases to cover gaps
- Newly added requirements after initial roadmap creation need manual mapping
