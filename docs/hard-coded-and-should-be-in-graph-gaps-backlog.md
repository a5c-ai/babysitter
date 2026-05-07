# Hardcoded Harness/Target Gaps — Should Be Derived from Atlas Graph

> All data should flow: **Atlas graph → agent-catalog (bridge) → consumer packages**
>
> Generated 2026-05-06. Updated 2026-05-07.
>
> **Progress: P1 ✅, P2 ✅, P3 ✅, P4 ✅, P5 ⬜ (by design), P6 🟡 (1 remaining), P7 ✅**

## Priority 1: Master Target Registries — ✅ Complete

| Item | Status | Commit |
|------|--------|--------|
| P1.1 — `buildPluginTargetDescriptors()` | ✅ Reads from Atlas | d30b5d08 |
| P1.2 — SDK discovery specs | ✅ `buildDiscoverySpecs()` from catalog | abb240e9 |
| P1.3 — `deriveProcessNames()` | ✅ Queries catalog `processNames` | abb240e9 |
| P1.4 — adapter registry | ✅ Built from `listPluginTargetDescriptors()` | 0d56cc84 (earlier) |

**Residual:** P1.3 has 3 hardcoded alias fallbacks (`claude`→`claude-code`, `gemini`→`gemini-cli`, `copilot`→`github-copilot`) for when exact match fails. Low priority.

## Priority 2: Per-Target Type Definitions — ✅ Complete

| Item | Status | Commit |
|------|--------|--------|
| P2.1 — `HookRegistrationFormat` | ✅ Changed to `string` | 12b07f8e |
| P2.2 — `HARNESS_ALIASES` | ✅ Dynamic from catalog | 12b07f8e |

## Priority 3: Per-Target Special Cases — ✅ Complete

| Item | Status | Commit |
|------|--------|--------|
| P3.1 — openclaw Stop hook | ✅ Checks `adapterFamily === 'programmatic'` | c0d76911 |
| P3.2 — codex marketplace | ✅ Checks `activationMessage` | c0d76911 |
| P3.3 — copilot bin scripts | ✅ Checks `componentSupport + lifecycle` | c0d76911 |
| P3.4 — oh-my-pi adapter name | ✅ Uses `targetProfile.adapterName` | c0d76911 |

**Zero `targetProfile.name ===` checks remain in agent-plugins-mux production code.**

## Priority 4: Env Vars and Install Paths — ✅ Complete (via P1.2)

Discovery specs now read `callerEnvVars` and `configPaths` from Atlas PluginTarget records. Hardcoded values remain only as fallback defaults in lazy getters.

## Priority 5: agent-mux Dispatch — ⬜ By Design

| Item | Status | Note |
|------|--------|------|
| P5.1 — translate-for-harness | ⬜ Code | Adapter self-identification — each adapter knows what it is |
| P5.2 — CLI launch routing | ⬜ Code | Launch commands are inherently per-adapter code |
| P5.3 — interactive-mode targets | ⬜ Code | Process definition, not data lookup |

These are **code dispatches**, not data lookups. Each adapter file (`claude-adapter.ts`, `codex-adapter.ts`) must identify itself. A registry pattern could replace the switch statements but the individual adapter imports would still be hardcoded.

## Priority 6: Scripts and CI — 🟡 Mostly Complete

| Item | Status | Note |
|------|--------|------|
| P6.1 — Architecture boundaries | ✅ | Removed plugin bundle entries (938924c3) |
| P6.2 — Bump version targets | ✅ | Plugin bundles removed — no paths to maintain |
| P6.3 — Sync external repos | 🔴 | `targets` array with repo URLs still hardcoded |
| P6.4 — Docs freshness | ✅ | Queries catalog with fallback (ecbc2c59) |

**P6.3 remaining:** `scripts/sync-external-plugin-repos.mjs` has a hardcoded array mapping target IDs to external repo URLs (`a5c-ai/babysitter-codex`, etc.). Fix: add `externalRepo` field to Atlas PluginTarget records.

## Priority 7: Tests — ✅ Acceptable

| Item | Status | Note |
|------|--------|------|
| P7.1 — Transform tests | ✅ | Tests validate specific behavior — hardcoded assertions are correct |
| P7.2 — Contract tests | ✅ | Already catalog-driven |

## Summary

| Priority | Items | Done | Remaining |
|----------|-------|------|-----------|
| P1 — Master registries | 4 | 4 ✅ | 0 |
| P2 — Type definitions | 2 | 2 ✅ | 0 |
| P3 — Special cases | 4 | 4 ✅ | 0 |
| P4 — Env vars / paths | 2 | 2 ✅ | 0 |
| P5 — agent-mux dispatch | 3 | 0 (by design) | 0 |
| P6 — Scripts / CI | 4 | 3 ✅ | 1 (P6.3) |
| P7 — Tests | 2 | 2 ✅ | 0 |
| **Total** | **21** | **17 ✅** | **1 remaining + 3 by-design** |
