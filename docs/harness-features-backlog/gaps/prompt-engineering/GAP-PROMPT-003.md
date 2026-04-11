# GAP-PROMPT-003: Runtime Personality Overlays

| Field | Value |
|-------|-------|
| Category | prompt-engineering |
| Priority | Medium |
| Effort | M |
| Status | Partial |

## Description
Adapt prompt personality and style per orchestration mode (interactive, headless, resume, worker, plan-only) so that harness behavior matches the operational context.

## Current State
Interactive/non-interactive/resume prompts exist but are bespoke. The wrapper aliases (`harness:plan`, `harness:yolo`, `harness:forever`) imply different modes but prompt adaptation is minimal.

## Target State
Formal personality overlays per mode. A `plan` overlay emphasizes exploration and analysis. A `yolo` overlay emphasizes speed and action. A `resume` overlay emphasizes context restoration. A `worker` overlay emphasizes task focus and output quality.

## Dependencies
- [GAP-PROMPT-001](../prompt-engineering/GAP-PROMPT-001.md) -- strata model for overlay placement

## Key Files
| Component | Path |
|-----------|------|
| Prompts module | `packages/sdk/src/prompts/` |
| Instructions CLI | `packages/sdk/src/cli/` |
| CC prompt phrasing analysis | [`11-prompt-phrasing-analysis.md`](../../11-prompt-phrasing-analysis.md) -- Section 10 (Proactive Mode) and Section 8 (Compaction Protocol) document personality-varying prompt patterns |

## Recommendation
Phase 3 implementation. Define personality overlay templates per mode and inject them into the runtime stratum during prompt composition.
