# sanyuan0704/sanyuan-skills

## Metadata

- **Full name**: sanyuan0704/sanyuan-skills
- **Description**: Expert code review skill: SOLID, security, performance, error handling, boundary conditions
- **Stars**: 3,181
- **License**: MIT
- **Last pushed**: 2026-03-02
- **Topics**: (none)

## Structure

```
skills/
  code-review-expert/    # Main value
    SKILL.md
    agents/
    references/
      solid-checklist.md
      removal-plan.md
      security-checklist.md
      code-quality-checklist.md
  sigma/                 # Bloom's 2-Sigma mastery learning tutor
    SKILL.md
  skill-forge/           # Meta-skill for creating skills
    SKILL.md
```

## Classification

### code-review-expert -> Process candidate: specializations/shared/code-review-expert

**Archetype**: Structured code review methodology with severity-based triage.

**Extractable value**:
- 4-severity classification system (P0-P3) with clear action thresholds (block merge / should fix / follow-up / optional)
- 5-phase review workflow: preflight context -> SOLID analysis -> removal candidates -> security scan -> code quality scan
- Reference checklists for SOLID violations, security risks, code quality issues
- Edge case handling: empty diffs, large diffs (>500 lines batching), mixed concerns grouping
- Structured output format with file:line references

**Why specializations/shared (not methodologies/)**: This is a domain-specific review protocol, not a full generic dev methodology. It's cross-domain (applies to any codebase) so it goes in shared/.

**Process extraction notes**:
- The severity system maps well to babysitter breakpoints (P0 = blocking breakpoint, P1 = should-fix breakpoint, P2-P3 = informational)
- Review phases map to sequential tasks in a babysitter process
- Reference checklists could be bundled as process inputs or embedded in task definitions

### sigma -> SKIP

Tutoring/learning skill. Not a dev methodology or plugin idea.

### skill-forge -> SKIP

Meta-skill for creating skills. SDK-covered primitive (skill management).

## Plugin Ideas

None. The code review skill is better modeled as a process.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Code Review Expert | NEW | 4-severity classification system (P0-P3) with 5-phase review workflow | - | specializations/shared/code-review-expert.js |
| SOLID Analysis Process | NEW | Systematic SOLID principles violation detection and severity assignment | - | specializations/shared/solid-analysis.js |
| Security-Focused Code Review | NEW | Security vulnerability scanning with severity classification | - | specializations/shared/security-code-review.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| N/A | N/A | No valid plugin ideas - processes cover the extractable value | - | N/A |

## Summary

One extractable process: **code-review-expert** -> `specializations/shared/code-review-expert`. Clean severity-based code review methodology with SOLID, security, and quality checklists. Good structure, well-scoped phases that map naturally to babysitter tasks.
