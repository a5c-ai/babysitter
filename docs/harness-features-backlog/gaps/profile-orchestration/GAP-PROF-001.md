# GAP-PROF-001: Auto-Configure Orchestration from User Profile

| Field | Value |
|-------|-------|
| Category | profile-orchestration |
| Priority | Medium |
| Effort | M |
| Status | Missing |

## Description
Use user profile (expertise, preferences, tech stack) to auto-select processes, models, breakpoint thresholds, and verbosity.

## Current State
Profile system exists but not used for orchestration decisions.

## Target State
User profile drives orchestration defaults: expert users get fewer breakpoints, preferred model selected based on tech stack, process recommendations based on expertise, verbosity matched to preferences.

## Dependencies
- [GAP-ECO-004](../ecosystem/GAP-ECO-004.md) -- feature registry for profile-driven feature selection

## Key Files
| Component | Path |
|-----------|------|
| Profiles | `packages/sdk/src/profiles/` |
| Breakpoint evaluator | `packages/sdk/src/breakpoints/evaluator.ts` |
| Prompts module | `packages/sdk/src/prompts/` |

## Recommendation
Phase 3 implementation. Wire user profile into orchestration initialization. Auto-configure breakpoint thresholds, model selection, and verbosity from profile.
