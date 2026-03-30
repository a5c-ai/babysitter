# GSD Debugger Agent

## Overview

The `gsd-debugger` agent investigates bugs using the scientific method with persistent debug sessions. It maintains a .planning/debug/{slug}.md tracking file across context resets, following a rigorous hypothesis-test-conclude cycle until root cause is identified.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Expert Debugging Engineer |
| **Method** | Scientific debugging (hypothesis -> test -> conclude) |
| **Persistence** | Debug session file survives context resets |
| **Philosophy** | "Never guess. Hypothesize, test, conclude." |

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Scientific Method** | Hypothesis formation, test design, evidence evaluation |
| **Persistent Sessions** | Session files that survive context resets |
| **Root Cause Analysis** | Code-level identification with evidence chain |
| **Reproduction** | Minimal test case creation |
| **Fix Proposals** | Solution with regression risk assessment |
| **Bisection** | Git bisect for introducing commit identification |

## Usage

### Within Babysitter Processes

```javascript
const result = await ctx.task(debuggerTask, {
  agentName: 'gsd-debugger',
  prompt: {
    role: 'Expert Debugging Engineer',
    task: 'Investigate bug using scientific method',
    context: {
      issue: 'Login returns 500 error with valid credentials',
      sessionFile: '.planning/debug/login-500-error.md',
      relevantFiles: ['src/routes/auth.ts', 'src/middleware/jwt.ts']
    },
    outputFormat: 'Updated debug session file'
  }
});
```

### Direct Invocation

```bash
# Start new debug session
/agent gsd-debugger investigate \
  --issue "Login returns 500 with valid credentials"

# Resume existing session
/agent gsd-debugger resume \
  --session ".planning/debug/login-500-error.md"
```

## Debug Session File Format

```markdown
---
issue: "Login returns 500 error with valid credentials"
status: "root-cause-found"
created: "2026-03-02T10:00:00Z"
updated: "2026-03-02T10:45:00Z"
---

# Debug Session: Login 500 Error

## Issue Description
POST /auth/login returns 500 Internal Server Error
when valid email/password submitted.

## Observations
- Error occurs in jwt.sign() call (src/middleware/jwt.ts:28)
- JWT_SECRET environment variable referenced

## Hypothesis Chain

### Hypothesis 1: JWT_SECRET is undefined
- **Test**: console.log(process.env.JWT_SECRET) in auth route
- **Result**: Prints "undefined"
- **Conclusion**: CONFIRMED

## Root Cause
JWT_SECRET not set in .env file. jwt.sign() throws
when secret is undefined.

## Proposed Fix
- Add JWT_SECRET to .env and .env.example
- Add startup validation for required env vars
- **Regression Risk**: Low -- additive change only
```

## Common Tasks

### 1. Standalone Debug Session

Full investigation from issue report to fix proposal.

### 2. UAT Issue Diagnosis

Investigate failures found during verify-work UAT testing.

### 3. Resumed Investigation

Continue from a previous session after context reset.

## Process Integration

| Process | Agent Role |
|---------|------------|
| `debug.js` | Standalone debugging sessions |
| `verify-work.js` | Issue diagnosis during UAT |

## Related Resources

- [gsd-executor agent](../gsd-executor/) -- Implements proposed fixes
- [gsd-verifier agent](../gsd-verifier/) -- Verifies fix resolves issue

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-02 | Initial release |

---

**Backlog ID:** AG-GSD-010
**Category:** Debugging
**Status:** Active
