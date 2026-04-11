# GAP-PROMPT-012: Git Safety Protocol Prompt Section

| Field | Value |
|-------|-------|
| Category | prompt-engineering |
| Priority | Medium |
| Effort | S |
| Status | Missing |

## Description
Inject git safety protocol rules into task prompts for effects that involve version control operations. Prevents delegated agents from destructive git operations, hook-skipping, force-pushing, amending published commits, and other git mishaps during orchestrated code tasks.

## Current State
CC includes detailed git safety rules in its system prompt (never update git config, never skip hooks, always create new commits instead of amending, prefer specific file staging over `git add -A`). When babysitter delegates to CC, these rules apply. When delegating to other harnesses, no git safety rules exist in the task prompt. Process definitions that involve code changes have no standardized git protocol.

## Target State
A `gitSafety` prompt section injected when task context indicates version control operations (code modification tasks, commit/push tasks, branch management). Content: never force-push to main, never skip hooks, create new commits not amends, stage specific files not everything, check for secrets before committing. Configurable per process definition (some processes may need to amend commits intentionally).

## Dependencies
- [GAP-PROMPT-001](../prompt-engineering/GAP-PROMPT-001.md) -- strata model for section placement
- [GAP-PROMPT-010](../prompt-engineering/GAP-PROMPT-010.md) -- safety framework for blast radius reasoning

## Key Files
| Component | Path |
|-----------|------|
| Prompts module | `packages/sdk/src/prompts/` |
| CC prompt phrasing analysis | [`11-prompt-phrasing-analysis.md`](../../11-prompt-phrasing-analysis.md) -- Section 6 (Git Operations Protocol) has exact CC phrasing for commit protocol and safety rules |

## Recommendation
Phase 2-3 implementation. Small effort -- extract git safety protocol from CC analysis, add as conditional prompt section for code tasks.
