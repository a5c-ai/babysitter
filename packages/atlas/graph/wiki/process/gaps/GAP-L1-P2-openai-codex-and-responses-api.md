---
id: page:process-gaps-GAP-L1-P2-openai-codex-and-responses-api
nodeKind: Page
title: "GAP-L1-P2-openai-codex-and-responses-api"
slug: "process/gaps/GAP-L1-P2-openai-codex-and-responses-api"
articlePath: "wiki/process/gaps/GAP-L1-P2-openai-codex-and-responses-api.md"
documents: []
---
# GAP-L1-P2-openai-codex-and-responses-api

| Field | Value |
|---|---|
| id | gap:openai-codex-and-responses-api |
| title | OpenAI Codex (CLI) Skills + Responses API + GPT-5 family stub-only in examples |
| level | 1 |
| priority | P2 |
| discoveredAt | 2026-04-28T00:00:00Z |
| source | platform.openai.com/docs |
| status | open |
| owner | tbd |

## Current state
- `schema/examples/compute/models/gpt-5.yaml` exists; gpt-5-codex, gpt-5-mini, o3, o4-mini absent.
- `schema/examples/agent-stack/products/codex.yaml` exists but no skills/plugins/hooks examples for Codex CLI.
- `ModelTransportProtocol` `model-transport:openai-responses` example is presumably present but Responses API features (streamed reasoning, tool-call grammar, function-calling-with-thinking) are not modeled as Capabilities.

## Desired state
- Add ModelVersion examples: `gpt-5-codex`, `gpt-5-mini`, `o3`, `o4-mini`.
- Add `Capability` instances for Responses-API-specific features: `cap:streamed-reasoning`, `cap:parallel-tool-calls`, `cap:strict-json-schema`.
- Add Codex CLI skills/hooks examples (Codex now supports ~/.codex/agents.md, ~/.codex/skills/).

## Evidence
- platform.openai.com/docs/api-reference/responses
- packages/agent-catalog evidence files referencing OpenAI

## Propagation status
- Level 1: open
- Level 2: not-started

## Propagation chain
- Level 1: 4 ModelVersion + 3 Capability + 2 Codex extension example files.
- Level 2: capabilities.md grows.

## Notes
Lower priority than Anthropic gaps because Codex's surface evolves slower, but coverage parity matters.
