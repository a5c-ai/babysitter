# GSD Verifier Agent

## Overview

The `gsd-verifier` agent verifies phase goal achievement through goal-backward analysis. It starts from the stated phase goal, decomposes it into verifiable sub-goals, and checks each against actual implementation artifacts to produce a structured VERIFICATION.md report.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Senior QA Engineer |
| **Methodology** | Goal-backward verification |
| **Philosophy** | "Verify what matters, not what was done" |

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Goal-Backward Analysis** | Decompose goals into verifiable sub-goals |
| **Artifact Verification** | Functional correctness, stub detection |
| **Integration Testing** | Cross-component wiring verification |
| **Regression Detection** | Existing functionality preservation |
| **Traceability** | Requirements-to-implementation mapping |

## Usage

### Within Babysitter Processes

```javascript
const result = await ctx.task(verifierTask, {
  agentName: 'gsd-verifier',
  prompt: {
    role: 'Senior QA Engineer',
    task: 'Verify phase goal achievement through goal-backward analysis',
    context: {
      phase: 3,
      roadmapFile: '.planning/ROADMAP.md',
      requirementsFile: '.planning/REQUIREMENTS.md',
      summaryFiles: ['.planning/phases/03-1-SUMMARY.md', '.planning/phases/03-2-SUMMARY.md']
    },
    outputFormat: 'VERIFICATION.md'
  }
});
```

### Direct Invocation

```bash
# Verify a completed phase
/agent gsd-verifier verify-phase \
  --phase 3 \
  --roadmap ".planning/ROADMAP.md"

# Verify specific sub-goals
/agent gsd-verifier verify \
  --phase 3 \
  --sub-goals "authentication,authorization,token-refresh"
```

## Common Tasks

### 1. Post-Execution Verification

After execute-phase completes, verify the phase goal was achieved.

### 2. UAT Support

Support verify-work by providing structured sub-goal analysis for conversational testing.

### 3. Gap Identification

Identify specific sub-goals that failed for gap-closure planning.

## Process Integration

| Process | Agent Role |
|---------|------------|
| `execute-phase.js` | Post-execution verification |
| `verify-work.js` | Structured UAT support |
| `quick.js` | Post-execution verification (--full mode) |
| `add-tests.js` | Test adequacy verification |

## VERIFICATION.md Output Format

```markdown
# Phase 3 Verification Report

## Phase Goal
Users can authenticate and access protected resources

## Sub-Goal Results

### SG-1: User Registration [PASS]
- **Artifact**: src/routes/auth.ts (lines 15-42)
- **Evidence**: POST /auth/register endpoint with validation

### SG-2: JWT Token Generation [FAIL]
- **Issue**: Token expiry not configured
- **File**: src/middleware/jwt.ts (line 28)
- **Remediation**: Set expiresIn option in jwt.sign() call

## Summary
- Passed: 4/5 sub-goals
- Failed: 1/5 sub-goals
- Overall: FAIL (requires gap closure)
```

## Related Resources

- [gsd-executor agent](../gsd-executor/) -- Produces the artifacts this agent verifies
- [gsd-plan-checker agent](../gsd-plan-checker/) -- Pre-execution plan validation
- [gsd-integration-checker agent](../gsd-integration-checker/) -- Cross-phase verification

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-02 | Initial release |

---

**Backlog ID:** AG-GSD-003
**Category:** Verification
**Status:** Active
