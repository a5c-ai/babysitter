# verification-suite

Plan validation, phase completeness checks, reference integrity, and milestone audit reporting.

## Quick Start

The verification suite is the quality gate for GSD artifacts. It validates structure, completeness, and integrity.

### Validate a Plan

Check that a PLAN.md has correct frontmatter, well-formed XML tasks, and required elements.

### Check Phase Completeness

Verify all expected artifacts exist for a phase: plans executed, summary written, state updated.

### Run Health Check

Scan the entire `.planning/` directory for issues: orphaned files, broken references, stale state.

### Generate Milestone Audit

Produce a comprehensive readiness report covering phase completion, requirements coverage, and integration.

## Examples

### Plan Validation Output

```
[PASS] Frontmatter with required fields
[PASS] 4 XML tasks found, matches task_count
[FAIL] Task 3 missing <acceptance_criteria>
Result: FAIL (1 issue)
```

### Phase Completeness

```
Phase 72:
  Plans: 2/2 executed
  Summary: present
  Verification: missing
  State: updated
Result: INCOMPLETE (verification needed)
```

### Health Check

```
.planning/ health:
  5 checks passed
  1 warning (orphaned phase directory)
  1 failure (broken file reference)
```

## Troubleshooting

### Plan validation fails on XML
- Ensure tasks use `<task id="N" title="...">` format
- Each task must have `<context>` and `<acceptance_criteria>` children
- Check for unclosed XML tags

### Phase shows incomplete but all work is done
- Verify SUMMARY.md exists in the phase directory
- Check STATE.md lists the phase in completed_phases
- Run verification if VERIFICATION.md is required

### Health check reports orphaned files
- Orphaned files are in phase directories not referenced by ROADMAP.md
- Review and either delete or add to roadmap
- Usually caused by manual file creation outside GSD workflow
