# Genty Babysitter-SDK Coupling Audit

Generated: 2026-06-07

## Summary

| Category | Imports | Classification |
|---|---|---|
| run-lifecycle | 57 | must-extract |
| types-only | 72 | should-internalize |
| harness-registry | 21 | can-keep |
| utilities | 22 | should-internalize |
| effect-orchestration | 17 | must-extract |
| process-creation | 13 | must-extract |
| journal | 5 | must-extract |
| governance | 5 | must-extract |
| session | 5 | must-extract |
| external-agents | 2 | must-extract |
| **Total** | **219** | |

**68 files** across **5 packages** import from `@a5c-ai/babysitter-sdk`.

## Imports by Package

| Package | Files | Imports |
|---|---|---|
| platform | 57 | 185 |
| cli | 9 | 22 |
| runtime | 8 | 10 |
| core | 1 | 2 |
| tui-plugins | 0 | 0 |

## Classification Detail

### must-extract (104 imports, 47.5%)

These categories represent core babysitter runtime functionality that genty uses
directly. To decouple, these must be extracted into a shared interface layer or
absorbed into genty's own runtime abstractions.

- **run-lifecycle (57)**: `createRun`, `loadJournal`, `readRunMetadata`,
  `resolveRunsDir`, `resolveExistingRunDir`, `DEFAULTS`, `createRunDir`,
  `readStateCache`, `readTaskDefinition`, `readTaskResult`,
  `serializeAndWriteTaskResult`, `withRunLock`, `callHook`,
  `loadCompressionConfig`, `createScopedRuntimeConfigState`,
  `createReplayEngine`, `createProcessContext`, `withProcessContext`,
  `getActiveProcessContext`, `requireProcessContext`,
  `STATE_CACHE_SCHEMA_VERSION`, `createStateCacheSnapshot`,
  `journalHeadsEqual`, `normalizeJournalHead`, `normalizeSnapshot`,
  `rebuildStateCache`, `writeStateCache`, `hashInvocationKey`,
  `RunFailedError`, `replaySchemaVersion`, `createBabysitterMcpServer`,
  `getRunDir`

- **effect-orchestration (17)**: `commitEffectResult`, `orchestrateIteration`,
  `buildEffectIndex`, `getEffectiveConcurrency`, `commitEffectCancellation`,
  `EffectRequestedError`, `EffectPendingError`, `EffectCancelledError`,
  `ParallelPendingError`

- **process-creation (13)**: `createPromptContextFromCatalog`,
  `composeProcessCreatePrompt`, `resolveActiveProcessLibrary`,
  `getDefaultProcessLibrarySpec`, `renderBreakpointHandling`,
  `renderResultsPosting`, `renderCommandTemplate`, `renderTemplateString`,
  `resetGlobalTaskRegistry`

- **journal (5)**: `appendEvent` (used in 3 files across platform and runtime)

- **governance (5)**: `addRule`, `readRules`, `removeRule`,
  `evaluateAutoApproval`, `isStatefulRule`

- **session (5)**: `resolveSessionIdWithMarker`, `getSessionMarkerPath`,
  `readSessionMarker`, `normalizeSessionStateDir`

- **external-agents (2)**: `discoverExternalAgents` (used in 2 files)

### can-keep (21 imports, 9.6%)

Harness-registry symbols are native to genty's adapter layer.
These re-exports and direct usages are the intended integration surface
between genty and the SDK.

- **harness-registry (21)**: `discoverHarnesses`, `detectCallerHarness`,
  `checkCliAvailable`, `KNOWN_HARNESSES`, `detectAdapter`,
  `getAdapterByName`, `listSupportedHarnesses`, `getAdapter`, `setAdapter`,
  `resetAdapter`, `createClaudeCodeAdapter`, `createInternalContext`

### should-internalize (94 imports, 42.9%)

Types and utility functions that should be copied or re-declared within genty
to eliminate the import dependency. Most are simple type re-exports or
standalone helper functions with no state.

- **types-only (72)**: `JournalEvent`, `JsonRecord`, `EffectAction`,
  `IterationResult`, `BreakpointRule`, `BreakpointConfig`,
  `AutoApprovalResult`, `ActionCategory`, `ApprovalPosture`,
  `InteractionKind`, `PromptContext`, `CompressionConfig`,
  `EffectIndex`, `AppendEventResult`, `ExternalAgentDiscovery`,
  `ExternalAgentInfo`, `ParsedArgs`, `RuntimeConfigValueType`,
  `PolicyRuleKind`, `PolicyConditionOp`, `PolicyAction`, `PolicyCondition`,
  `PolicyRule`, `StatefulPolicyRule`, `PolicyEvaluationContext`,
  `PolicyDecision`, `PolicyDecisionLog`, `PolicyEngine`,
  `OrchestrateOptions`, `CommitEffectResultOptions`,
  `CommitEffectResultArtifacts`, `ProcessContext`, `DefinedTask`,
  `CreateRunOptions`, `CreateRunResult`, `ReplayEngine`,
  `CreateReplayEngineOptions`, `StateCacheSnapshot`,
  `StateCacheJournalHead`, `DerivedEffectSummary`

- **utilities (22)**: `BabysitterRuntimeError`, `ErrorCategory`,
  `writeFileAtomic`, `parsePattern`, `matchPattern`, `nextUlid`,
  `densityFilterText`, `estimateTokens`, `formatErrorWithContext`,
  `isBabysitterError`, `suggestCommand`, `toStructuredError`,
  `applyPositionalArgs`, `BOOLEAN_FLAGS`, `FLAG_PARSERS`,
  `__resetCacheForTests`, `__setAncestorResolverForTests`

## Top 10 Most-Coupled Files

| Rank | File | Package | Symbols | Categories |
|---|---|---|---|---|
| 1 | `src/runtime/index.ts` | platform | 38 | run-lifecycle, effect-orchestration, types-only |
| 2 | `src/api/breakpoints.ts` | platform | 15 | governance, journal, run-lifecycle, types-only |
| 3 | `src/api/runs.ts` | platform | 11 | effect-orchestration, run-lifecycle, types-only |
| 4 | `src/harness/index.ts` | platform | 10 | harness-registry |
| 5 | `src/api/effects.ts` | platform | 8 | journal, run-lifecycle, types-only |
| 6 | `src/harness/internal/createRun/utils.ts` | platform | 8 | harness-registry, types-only, utilities |
| 7 | `src/harness/internal/createRun/prompts.ts` | platform | 8 | process-creation, types-only |
| 8 | `src/harness/internal/createRun/__tests__/createRun.test.ts` | platform | 8 | effect-orchestration, harness-registry, run-lifecycle, session, types-only, utilities |
| 9 | `src/cli/ui.ts` | cli | 6 | utilities |
| 10 | `src/harness/internal/createRun/output.ts` | platform | 5 | harness-registry, run-lifecycle, types-only, utilities |

## Observations

1. **platform dominates**: 84.5% of all imports (185/219) originate in
   `@a5c-ai/genty-platform`. Any decoupling effort should focus here first.

2. **runtime/index.ts is a barrel re-export**: The single file
   `platform/src/runtime/index.ts` re-exports 38 symbols. This is the
   largest coupling point and a natural extraction seam -- it effectively
   defines genty's runtime contract with the SDK.

3. **types-only is the largest category**: 72 imports (32.9%) are pure type
   imports. These are the cheapest to internalize: copy the type
   declarations into a `@a5c-ai/genty-types` package or a shared
   `types.ts` barrel, then drop the SDK dependency from those files.

4. **Duplicate modules across platform and runtime**: Several files exist in
   both `platform/src/` and `runtime/src/` with identical imports
   (e.g., `cost/effectCost.ts`, `cost/journal.ts`,
   `observability/runStatus.ts`, `observability/health.ts`,
   `observability/timeline.ts`, `session/discovery.ts`). These duplicates
   should be consolidated before decoupling.

5. **Deep path import**: `breakpoints/delegation.ts` imports from
   `@a5c-ai/babysitter-sdk/dist/storage/atomic` -- a private path that
   bypasses the SDK's public API. This is fragile and should be replaced
   with a public export or internalized.

6. **tui-plugins is fully decoupled**: Zero SDK imports -- already clean.

7. **core has minimal coupling**: Only 1 file with 2 imports
   (`createScopedRuntimeConfigState` + `RuntimeConfigValueType`).

8. **Governance types re-exported**: `governance/types.ts` re-exports 10
   policy types and 1 function from the SDK. This is a clear candidate for
   type internalization.

## Notes on String Literal References

The following files contain `@a5c-ai/babysitter-sdk` as string literals in
prompt templates or test fixtures (NOT actual imports). These are excluded
from the import counts above but are relevant for full decoupling:

- `planProcess/prompts.ts:108` -- prompt template for process authoring
- `planProcess/phase.ts:99` -- inline code example in system prompt
- `planProcess/recovery.ts:16-17` -- import path normalization regex
- `createRun.test.ts:1651,2068,2601,2826,2855,2959` -- test fixtures
- `externalTaskValidation.test.ts:34,62,98` -- test fixtures
