# GAP-PROMPT-002: Deterministic Capability Projection

| Field | Value |
|-------|-------|
| Category | prompt-engineering |
| Priority | High |
| Effort | M |
| Status | Partial |

## Description
Ensure that prompts deterministically reflect all available capabilities (installed plugins, active process library, available harnesses, feature flags) so that orchestrated harnesses have accurate knowledge of what they can do.

## Current State
Capability projection is inconsistent. Skills from `skill:discover` may or may not appear in prompts. Plugin hooks influence behavior but are not projected. Process library binding changes available processes but prompts may not reflect this.

## Target State
A capability collector queries all installed surfaces (plugins, skills, process library bindings, harness adapters, feature flags) and projects them into the runtime stratum of the prompt. Capabilities are deterministic -- same inputs always produce same prompt.

## Dependencies
- [GAP-PROMPT-001](../prompt-engineering/GAP-PROMPT-001.md) -- needs strata model for runtime stratum
- [GAP-ECO-004](../ecosystem/GAP-ECO-004.md) -- feature registry for flag projection

## Key Files
| Component | Path |
|-----------|------|
| Prompts module | `packages/sdk/src/prompts/` |
| Skill discovery | `packages/sdk/src/cli/` |
| Plugin package reader | `packages/sdk/src/plugins/packageReader.ts` |
| Process library | `packages/sdk/src/processLibrary/` |
| CC prompt phrasing analysis | [`11-prompt-phrasing-analysis.md`](../../11-prompt-phrasing-analysis.md) -- Section 11 (Environment Context Assembly) documents capability injection patterns |

## Recommendation
Phase 2 implementation. Build a capability collector that queries all installed surfaces and projects collected capabilities into the runtime stratum of the prompt.
