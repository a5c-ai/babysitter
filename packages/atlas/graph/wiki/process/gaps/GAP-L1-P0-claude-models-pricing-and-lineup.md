---
id: page:process-gaps-GAP-L1-P0-claude-models-pricing-and-lineup
nodeKind: Page
title: "GAP-L1-P0-claude-models-pricing-and-lineup"
slug: "process/gaps/GAP-L1-P0-claude-models-pricing-and-lineup"
articlePath: "wiki/process/gaps/GAP-L1-P0-claude-models-pricing-and-lineup.md"
documents: []
---
# GAP-L1-P0-claude-models-pricing-and-lineup

| Field | Value |
|---|---|
| id | gap:claude-models-pricing-and-lineup |
| title | Claude model pricing and current lineup wrong/missing — Opus 4.7 priced at \$15/\$75 (correct is \$5/\$25); Sonnet 4.6 + Haiku 4.5 absent |
| level | 1 |
| priority | P0 |
| discoveredAt | 2026-04-28T00:00:00Z |
| source | https://platform.claude.com/docs/en/docs/about-claude/models/overview |
| status | open |
| owner | tbd |

## Current state
- `schema/examples/compute/models/claude-opus-4-7.yaml` has `costPer1kInputTokens: 15.0` and `costPer1kOutputTokens: 75.0` with TODO. Real pricing is **\$5 / \$25 per MTok** (i.e. 0.005 / 0.025 per 1k).
- Attribute name says "per1k" but the schema's attributeType is `cost-per-million-tokens` — naming mismatch.
- No example for Claude Sonnet 4.6 (`claude-sonnet-4-6`, $3/$15, 1M ctx, released ~Q1 2026 with extended thinking).
- No example for Claude Haiku 4.5 (`claude-haiku-4-5-20251001`, $1/$5, 200k ctx).
- No example for Opus 4.6, Opus 4.5, Sonnet 4.5, Opus 4.1.
- `releaseDate: "2026-01-15"` for Opus 4.7 is a placeholder.

## Desired state
- Correct Opus 4.7 pricing: `costPer1kInputTokens: 0.005`, `costPer1kOutputTokens: 0.025` (or rename attribute to `costPerMTokInput/Output` to match attribute-type name).
- Add 5 ModelVersion examples: `claude-sonnet-4-6`, `claude-haiku-4-5`, `claude-opus-4-6`, `claude-opus-4-5`, `claude-sonnet-4-5` (legacy still served).
- Add `adaptiveThinking: bool` attribute on ModelVersion (Opus 4.7 + Sonnet 4.6 = true; Haiku 4.5 = false). Distinguish from `supportsThinking` (extended thinking).
- Add `tokenizerVersion` attribute (Opus 4.7 uses a new tokenizer per Anthropic docs — affects context window vs char count).
- Add `aliasIds: list<string>` (e.g. `claude-opus-4-7` alias vs. dated snapshot).
- Add `bedrockId`, `vertexId` as first-class attributes (currently only in `regions`).

## Evidence
- https://platform.claude.com/docs/en/docs/about-claude/models/overview (confirms Opus 4.7 = \$5/\$25, 1M ctx, no extended thinking but adaptive thinking, training cutoff Jan 2026)
- https://platform.claude.com/docs/en/about-claude/model-deprecations (Sonnet 4 / Opus 4 retire 2026-06-15)

## Propagation status
- Level 1 (real-world vs graph): open
- Level 2 (graph vs docs): not-started — add `adaptiveThinking` invariant row to `02-node-kinds/compute-path.md` and to coverage-checklist Layer 1 row
- Level 3+: cascade

## Propagation chain
- Level 1: fix pricing typo, add new example files, add 2 attributes (`adaptiveThinking`, `tokenizerVersion`).
- Level 2: rename `costPer1k*` → `costPerMTok*` OR change attributeType reference; either way the markdown spec disagrees with the YAML.

## Notes
The pricing typo by itself makes derived cost calculations wrong by 3000x. P0.
