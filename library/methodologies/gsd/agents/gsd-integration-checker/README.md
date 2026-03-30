# GSD Integration Checker Agent

## Overview

The `gsd-integration-checker` agent verifies cross-phase integration and end-to-end flows. While gsd-verifier checks individual phases, this agent ensures components built across different phases work together -- checking data flow, API contracts, cross-cutting concerns, and complete user journeys.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Senior Integration Engineer |
| **Scope** | Cross-phase boundaries and E2E flows |
| **Philosophy** | "Individual correctness does not guarantee system correctness" |

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Integration Points** | API calls, data sharing, UI composition, config |
| **E2E Validation** | Complete user journey tracing through code |
| **Contract Consistency** | Request/response shapes, error formats |
| **Cross-Cutting** | Auth, logging, error handling, validation |
| **User Journeys** | Registration-to-completion flow verification |

## Usage

### Within Babysitter Processes

```javascript
const result = await ctx.task(integrationTask, {
  agentName: 'gsd-integration-checker',
  prompt: {
    role: 'Senior Integration Engineer',
    task: 'Verify cross-phase integration and E2E flows',
    context: {
      roadmapFile: '.planning/ROADMAP.md',
      requirementsFile: '.planning/REQUIREMENTS.md',
      summaryFiles: [
        '.planning/phases/01-1-SUMMARY.md',
        '.planning/phases/02-1-SUMMARY.md',
        '.planning/phases/03-1-SUMMARY.md'
      ]
    },
    outputFormat: 'Integration report'
  }
});
```

### Direct Invocation

```bash
# Check integration for a milestone
/agent gsd-integration-checker check \
  --milestone "v1.0" \
  --roadmap ".planning/ROADMAP.md"

# Check specific phase interactions
/agent gsd-integration-checker check \
  --phases "1,2,3" \
  --focus "api-contracts"
```

## Integration Report Format

```markdown
# Milestone v1.0 Integration Report

## Integration Points (12 found)
| # | Type | From | To | Status |
|---|------|------|----|--------|
| 1 | API | Phase 2 auth | Phase 3 orders | PASS |
| 2 | Data | Phase 1 users | Phase 2 auth | PASS |
| 3 | Event | Phase 3 orders | Phase 4 email | FAIL |

## E2E Flow Results
### Flow 1: User Registration to Order [PASS]
All integration points verified.

### Flow 2: Order to Email Confirmation [FAIL]
- **Issue**: Order event missing `customerEmail` field
- **Files**: src/events/order.ts:15, src/handlers/email.ts:22
- **Remediation**: Add customerEmail to OrderCreated event payload

## Cross-Cutting Concerns
### Authentication [PASS]
JWT middleware consistent across all protected routes.

### Error Handling [WARNING]
Phase 3 uses different error format than Phase 1-2.

## Summary
- Integration Points: 12
- Passed: 10
- Failed: 1
- Warnings: 1
- Overall: NEEDS ATTENTION
```

## Common Tasks

### 1. Milestone Audit Support

During gsd:audit-milestone, verify all phases integrate correctly.

### 2. Cross-Phase Wiring Check

Verify that components from different phases connect properly.

### 3. E2E Journey Validation

Trace complete user journeys through the entire codebase.

## Process Integration

| Process | Agent Role |
|---------|------------|
| `audit-milestone.js` | Cross-phase integration verification |

## Related Resources

- [gsd-verifier agent](../gsd-verifier/) -- Individual phase verification
- [gsd-executor agent](../gsd-executor/) -- Built the components being verified

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-02 | Initial release |

---

**Backlog ID:** AG-GSD-011
**Category:** Verification
**Status:** Active
