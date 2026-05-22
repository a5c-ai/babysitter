# ADR-001: Babysitter-Agent Seam Contract As The First Executable V6 Slice

## Status

- Status: Accepted
- Date: 2026-04-24
- Scope: `packages/babysitter-agent`

## Context

V6 says the first executable slice must be small, validated, and reversible. The current repository already contains a real seam candidate inside `@a5c-ai/babysitter-agent`: `packages/babysitter-agent/src/seams/contract.ts`.

That contract assigns every top-level runtime domain under `src/` to one owned slice, binds those slices to public subpath exports, and defines validation commands. The missing piece was not the seam manifest itself. The missing piece was the architecture record that promotes this work from "candidate implementation detail" into the explicit first executable V6 slice the roadmap requires.

Without that record, the monorepo reorg remains underspecified in three ways:

- the first executable slice is described in docs but not formally selected,
- there is no single repo-level command that proves the slice still holds,
- rollback and kill criteria are implied rather than written.

## Decision

V6 accepts the `babysitter-agent` seam contract as the first executable slice of the monorepo reorg.

The slice is defined as:

- keeping `@a5c-ai/babysitter-agent` as the current package boundary,
- making seam ownership explicit through `packages/babysitter-agent/src/seams/contract.ts`,
- validating that ownership through seam tests and package build output,
- avoiding any new top-level package creation or rename in this slice.

The repo-level validation command for this slice is:

```bash
npm run verify:v6:seams
```

That command currently expands to:

```bash
npm run test:seams --workspace=@a5c-ai/babysitter-agent
```

The seam contract itself still records the broader package-level validation commands that should remain true for the package over time:

```bash
npm run build --workspace=@a5c-ai/babysitter-agent
npm run test --workspace=@a5c-ai/babysitter-agent
```

The repo-level gate intentionally stays narrower so the ownership contract can be checked independently of unrelated package-typecheck churn.

## Consequences

### Positive

- The V6 roadmap now has a concrete first executable slice instead of only a future requirement.
- The monorepo reorg stays narrow: internal seam clarification, not speculative package expansion.
- Runtime-domain ownership, public exports, and V6 documentation now share one validation path.

### Negative

- The seam manifest adds maintenance overhead whenever top-level `src/` domains move.
- The slice does not by itself prove that deeper extraction is worthwhile.
- Package-level complexity inside `@a5c-ai/babysitter-agent` still exists; this only constrains it.

## Validation

Use these commands when editing this slice:

```bash
npm run verify:v6:seams
```

Supporting evidence lives in:

- `packages/babysitter-agent/src/seams/contract.ts`
- `packages/babysitter-agent/src/seams/contract.test.ts`
- `docs/v6-spec-and-roadmap/current-state.md`
- `docs/v6-spec-and-roadmap/v6-implementation-roadmap.md`

## Rollback

Rollback is intentionally cheap:

1. Revert the seam-contract manifest, tests, and repo-level validation command.
2. Remove the ADR and revert the V6 docs back to candidate-slice language.
3. Keep `@a5c-ai/babysitter-agent` as the unchanged package/runtime surface.

This rollback does not require package renames, install migration, or cross-repo choreography.

## Kill Criteria

Stop expanding this slice if any of the following becomes true:

- top-level runtime domains churn faster than the seam manifest can stay trustworthy,
- maintaining public seam exports adds more release risk than it removes,
- the validation command begins requiring unrelated package coordination,
- the next proposed move depends on new package creation instead of a proved internal seam.

## Alternatives Considered

### 1. Do nothing and leave the seam contract undocumented

Rejected because V6 explicitly requires a decision record for structural moves.

### 2. Promote a new `agent-runtime` or `agent-platform` package immediately

Rejected because the core V6 docs classify those names as deferred vocabulary and require stronger evidence first.

### 3. Treat plugin packaging or manifest validation as the first slice instead

Deferred. Those are still valid candidate slices, but the seam contract already exists in code and is cheaper to validate and roll back.
