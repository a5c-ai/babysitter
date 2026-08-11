# Daily Model Version Tracker - 2026-08-07

Atlas build completed after restoring the missing local `tsx` binary. Provider research covered every requested provider. One new uncovered model was found and tracked: xAI `grok-voice-think-fast-2.0`.

| Provider | Model | Latest Version | In Graph? | Status |
|----------|-------|---------------|-----------|--------|
| Anthropic | Claude Opus / Sonnet / Fable / Mythos / Haiku | Claude Opus 5 open issue; Sonnet 5, Fable 5, Mythos 5, Haiku 4.5 already represented | Partial | Existing graph covers Sonnet/Fable/Mythos/Haiku records; open issue #1621 covers Opus 5 follow-up. No new issue created. |
| OpenAI | GPT / o-series / GPT-4o | GPT-5.6 Sol/Terra/Luna candidate | Issue-backed | Existing open duplicate issue #1622 covers GPT-5.6. No new graph edit in this run. |
| Google Gemini | Gemini Pro / Flash / image/live variants | Gemini 3.1 and Gemini 3.6 candidates | Partial | Graph includes Gemini 3.1 records and image/live variants; issues #1623, #1626, #1639 cover newer Gemini follow-up. |
| xAI | Grok | Grok 4.5 / 4.20 family plus `grok-voice-think-fast-2.0` | Updated | Existing graph covers Grok 4.3/4.5; issue #1624 covers Grok 4.20 variants. Created #1681 and added graph records for `grok-voice-think-fast-2.0`. |
| Meta | Llama | Llama 4 Scout / Maverick | Yes | Graph includes Llama 4 family and Scout/Maverick records. No new official 2026 Llama release requiring a new issue found. |
| DeepSeek | DeepSeek-V4 / R1 / Coder | DeepSeek-V4-Flash-0731 candidate | Issue-backed | Graph includes DeepSeek V4 Flash/Pro records; open issue #1638 covers the newer V4 Flash 0731 update. |
| Mistral | Mistral Large / Small / Codestral / Pixtral | Mistral Large 3 / Small 4 candidates | Partial | Graph includes Mistral Large 3; issues #1625/#1640 cover Small 4/Large 3 follow-up. |
| Alibaba Qwen | Qwen / Qwen Coder | Qwen3.8-Max / qwen3.8-max-preview candidate | Issue-backed | Existing issue #1627 covers Qwen3.8-Max and preview. No duplicate created. |
| Amazon Nova | Nova Pro / Lite / Sonic / Omni / Premier | Nova 2 family and Premier lifecycle | Partial | Graph includes Nova 2 Lite/Sonic/Omni and issue-scoped Nova 2 Pro Preview; issue #1655 covers Nova Premier lifecycle/EOL. |
| Cohere | Command / Embed / Transcribe | Command A+ 05-2026, Embed v4.0, Transcribe 03-2026 | Yes | Graph includes Command A+ and Embed v4.0 with evidence; issue #1641 covers Transcribe 03-2026. |
| Together AI | Serverless catalog | Thinking Machines Inkling / 2026-08 refresh | Issue-backed | Existing issues #1642 and #1656 cover serverless catalog refresh and Inkling. |
| Fireworks AI | Serverless catalog | 2026-08 refresh | Issue-backed | Existing issue #1658 covers Fireworks serverless model catalog refresh. |
| Groq | Hosted inference catalog | August 2026 model refresh/deprecations | Issue-backed | Existing issues #1643 and #1657 cover catalog refresh and deprecations. |

## Issues

- Created: #1681 - Track xAI Grok Voice Think Fast 2.0
- Existing/deduped: #1621, #1622, #1623, #1624, #1625, #1626, #1627, #1638, #1639, #1640, #1641, #1642, #1643, #1655, #1656, #1657, #1658

## Graph Changes

Added issue-scoped xAI voice records:

- `packages/atlas/graph/compute/models/grok-voice-think-fast-2-0-issue-1681.yaml`
- `packages/atlas/graph/compute/model-families/grok-voice-issue-1681.yaml`
- `packages/atlas/graph/compute/providers/xai-voice-issue-1681.yaml`
- `packages/atlas/graph/compute/model-transport-protocols/xai-realtime-voice-issue-1681.yaml`
- `packages/atlas/graph/catalog-meta/evidence-sources/xai-grok-voice-think-fast-2-issue-1681.yaml`
- `packages/atlas/graph/catalog-meta/claims/model-version-grok-voice-think-fast-2-issue-1681.yaml`

## Verification

- `npm run build --workspace=@a5c-ai/atlas` passed.
- `npm run validate:edges` passed with pre-existing dangling edge report; the new xAI records no longer add a dangling trust-level edge.
- `git diff --check` passed.
- `npm run verify:metadata` failed due unrelated pre-existing `.agents/plugins/marketplace.json` metadata (`babysitter` version expected `6.0.2` but found undefined).
