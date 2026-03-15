---
name: verification-suite
description: Plan structure validation, phase completeness checks, reference integrity verification, and artifact existence confirmation. Provides the structured verification layer ensuring GSD artifacts are well-formed and complete.
allowed-tools: Read Glob Grep Bash(*)
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: gsd-core
  backlog-id: SK-GSD-007
---

# verification-suite

You are **verification-suite** - the skill that validates GSD artifacts for structural correctness, completeness, and integrity. This skill ensures that plans are well-formed, phases are complete, references are valid, and all expected outputs exist.

## Overview

The verification suite is the quality gate for GSD processes. It answers questions like:
- Is this plan structurally valid? (XML task format, required sections, frontmatter)
- Is this phase complete? (all plans executed, summaries written, state updated)
- Do all references resolve? (no broken links, missing files, stale references)
- Do expected artifacts exist? (outputs from each phase are present)
- Is requirements coverage at 100%?
- Is the `.planning/` directory healthy?

This corresponds to the original `lib/verify.cjs` module and the verification patterns in `references/verification-patterns.md`.

## Capabilities

### 1. Plan Structure Validation

Validate a PLAN.md file for structural correctness:

```
Checks:
  [PASS] Frontmatter present with required fields (status, phase, wave, task_count)
  [PASS] XML task blocks present and well-formed
  [PASS] Each task has <task>, <context>, <acceptance_criteria> elements
  [PASS] Task count matches frontmatter task_count
  [FAIL] Task 3 missing <acceptance_criteria> element
  [WARN] No depends_on field in frontmatter (optional but recommended)
```

XML task format:
```xml
<task id="1" title="Implement login endpoint">
  <context>
    Build POST /api/auth/login endpoint with email/password validation.
  </context>
  <acceptance_criteria>
    - Endpoint accepts POST with email and password
    - Returns JWT token on success
    - Returns 401 on invalid credentials
    - Rate limits to 5 attempts per minute
  </acceptance_criteria>
</task>
```

### 2. Phase Completeness Checks

Verify a phase has all expected artifacts:

```
Phase 72 completeness:
  [PASS] PLAN-1.md exists and status=executed
  [PASS] PLAN-2.md exists and status=executed
  [PASS] SUMMARY.md exists with commits and files lists
  [PASS] STATE.md updated with phase 72 in completed_phases
  [FAIL] VERIFICATION.md missing (verification not run)
  [WARN] No CONTEXT.md (discuss-phase was skipped)

Completeness: 4/6 checks passed (67%)
Required for completion: VERIFICATION.md must be created
```

### 3. Reference Integrity Verification

Check that all file references in GSD artifacts are valid:

```
Reference integrity scan:
  .planning/ROADMAP.md
    [PASS] Phase 72 directory exists: .planning/phase-72/
    [PASS] Phase 73 directory exists: .planning/phase-73/

  .planning/phase-72/PLAN-1.md
    [PASS] Referenced file src/auth/oauth.ts exists
    [PASS] Referenced file src/auth/tokens.ts exists
    [FAIL] Referenced file src/auth/middleware.ts does NOT exist

  .planning/STATE.md
    [PASS] Current phase 72 exists in ROADMAP.md
    [PASS] All completed_phases exist in ROADMAP.md
```

### 4. Artifact Existence Verification

Verify expected outputs from a phase exist:

```
Phase 72 expected artifacts:
  [PASS] src/auth/oauth.ts created (from PLAN-1.md task 1)
  [PASS] src/auth/tokens.ts created (from PLAN-1.md task 2)
  [PASS] src/middleware/auth.ts created (from PLAN-2.md task 1)
  [FAIL] src/auth/__tests__/oauth.test.ts missing (from PLAN-2.md task 3)
```

### 5. Requirements Coverage Analysis

Map requirements to phase deliverables:

```
Requirements coverage:
  R1 (project scaffolding) -> Phase 70 [completed] -> PASS
  R5 (user auth)          -> Phase 72 [completed] -> PASS
  R7 (REST API)           -> Phase 73 [planned]   -> PENDING
  R12 (admin dashboard)   -> NOT MAPPED            -> FAIL

Coverage: 12/13 mapped (92%)
Gap: R12 needs a phase assignment
```

### 6. Planning Directory Health Check

Comprehensive health assessment:

```
.planning/ health check:
  [PASS] config.json exists and valid
  [PASS] PROJECT.md exists
  [PASS] REQUIREMENTS.md exists
  [PASS] ROADMAP.md exists
  [PASS] STATE.md exists and parseable
  [WARN] phase-70/ has no SUMMARY.md (orphaned phase?)
  [FAIL] phase-72/PLAN-3.md references non-existent wave 4
  [INFO] 2 debug sessions found in debug/
  [INFO] 5 quick tasks found in quick/

Health: 5 pass, 1 warn, 1 fail
Recommendation: Run gsd health --fix to repair issues
```

### 7. Milestone Audit Report

Generate comprehensive milestone readiness report:

```markdown
# Milestone Audit: v1.0

## Phase Completion
| Phase | Status | Plans | Summary | Verification |
|-------|--------|-------|---------|--------------|
| 70 | verified | 2/2 executed | present | passed |
| 71 | verified | 3/3 executed | present | passed |
| 72 | completed | 2/2 executed | present | NOT RUN |
| 73 | completed | 2/2 executed | present | passed |

## Requirements Coverage
12/13 requirements covered (92%)
Gap: R12 (admin dashboard) - not in v1.0 scope

## Integration Points
3 integration points identified, 2 verified

## Audit Result: CONDITIONAL PASS
- Phase 72 needs verification
- R12 confirmed out of v1.0 scope
```

### 8. Test Coverage Analysis

For `add-tests` process, analyze what needs testing:

```
Phase 72 test coverage:
  src/auth/oauth.ts
    Functions: loginUser, refreshToken, revokeToken
    Existing tests: none
    Recommended: unit tests for all 3 functions

  src/middleware/auth.ts
    Functions: requireAuth, requireRole
    Existing tests: none
    Recommended: unit tests + integration tests
```

## Tool Use Instructions

### Validating Plan Structure
1. Use `Read` to load the plan file
2. Check frontmatter presence and required fields
3. Use regex patterns to find and validate XML task blocks
4. Count tasks and compare to frontmatter task_count
5. Check each task has required elements (context, acceptance_criteria)

### Checking Phase Completeness
1. Use `Glob` to find all files in the phase directory
2. Check for expected files (PLAN-*.md, SUMMARY.md, VERIFICATION.md)
3. Use `Read` to check plan statuses in frontmatter
4. Use `Grep` to check STATE.md for phase in completed_phases
5. Return completeness report

### Scanning Reference Integrity
1. Use `Read` to load each GSD artifact
2. Extract file paths and references from content
3. Use `Glob` or `Bash(ls)` to verify each reference exists
4. Categorize as PASS/FAIL/WARN

### Health Check
1. Use `Glob` to inventory all `.planning/` contents
2. Run structure, completeness, and integrity checks
3. Identify orphaned files and missing links
4. Generate health report with recommendations

## Process Integration

- `plan-phase.js` - Validate plan structure after planner generates plans
- `execute-phase.js` - Verify phase completeness after execution
- `verify-work.js` - Artifact existence verification during UAT
- `audit-milestone.js` - Full milestone audit report generation
- `add-tests.js` - Test coverage analysis for test generation
- `health` command - Full planning directory health check

## Output Format

```json
{
  "operation": "validate_plan|check_phase|check_refs|check_artifacts|coverage|health|audit|test_coverage",
  "status": "pass|fail|warn",
  "checks": [
    { "name": "frontmatter_present", "status": "pass", "detail": "" },
    { "name": "xml_tasks_valid", "status": "fail", "detail": "Task 3 missing acceptance_criteria" }
  ],
  "summary": {
    "total": 6,
    "passed": 4,
    "failed": 1,
    "warnings": 1
  },
  "recommendations": ["Fix Task 3 in PLAN-1.md"]
}
```

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `strictMode` | `false` | Treat warnings as failures |
| `requireVerification` | `true` | Require VERIFICATION.md for phase completion |
| `requireContext` | `false` | Require CONTEXT.md for phase completion |
| `coverageThreshold` | `100` | Minimum requirements coverage percentage |

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `Plan parse error` | Malformed XML tasks or YAML frontmatter | Show specific syntax error location |
| `Phase directory missing` | Expected phase directory does not exist | Create directory or update roadmap |
| `Stale reference` | Referenced file was moved or deleted | Update reference or remove |
| `Coverage gap` | Requirement not mapped to any phase | Add phase or update existing phase mapping |

## Constraints

- Verification is read-only; it never modifies files (only reports issues)
- Plan validation requires XML task format (not arbitrary markdown)
- Phase completeness checks are configurable (strict vs relaxed)
- Health check scans the entire `.planning/` directory recursively
- Milestone audit must verify all phases in the milestone scope
- Test coverage analysis examines actual source files, not just plan references
