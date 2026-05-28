# Issue #500: Track OpenClaw 2026.5.27 upstream release

Labels: `agent-version-update`, `graph-update`.

Issue context:

- Old recorded version: 2026.5.26
- New upstream version: 2026.5.27
- Package/install: `npm install -g openclaw`, unchanged
- Release notes: https://github.com/openclaw/openclaw/releases/tag/v2026.5.27
- Prior graph PR: https://github.com/a5c-ai/babysitter/pull/495

Research summary from the issue:

- Security/content boundaries were tightened: group prompt text kept out of system prompts, repeated-dot hostnames normalized, side-effecting command wrappers and unsafe Node runtime env overrides blocked, no-auth Tailscale exposure rejected, and node/device-role approvals require admin authority.
- Codex app-server reliability improved: runtime models resolve first, workspace memory routes through tools, shared app-server clients survive startup/helper failures, hook relay generations survive restarts, and false runtime live switches are avoided.
- Gateway/reply paths now reuse more session/plugin/auth/tool-search/metadata caches, while visible replies avoid hidden cleanup timeouts.
- OpenAI-compatible embedding providers moved into core; DeepInfra catalog browsing, Pixverse video generation, VLLM thinking params, Claude CLI OAuth overlays, and bare direct Anthropic model IDs were updated.
- Channel delivery fixes cover Telegram, iMessage, Slack, Matrix, QQBot, Discord, and Google Chat.
- Release/package paths now honor npm dist exclusions, package Docker runtime workspace templates, and run stricter postpublish checks.

Likely affected areas:

- Transport/runtime-mux proxying for Codex app-server should account for the new model-resolution and workspace-memory-through-tools behavior.
- Security policy mappings should include the new blocked wrappers/env overrides and admin-gated node/device-role approvals.
- Provider catalog modeling should include core OpenAI-compatible embeddings, Pixverse video, VLLM thinking params, and Claude CLI OAuth overlays if exposed to agents.
- Channel integration tests may need updates for approval and delivery behavior changes.

Migration/install changes:

- Install package and method unchanged.
- No migration steps listed.

Assimilation checklist:

- [ ] Update OpenClaw security policy graph notes for blocked command wrappers, unsafe Node env overrides, and admin-gated node/device approvals.
- [ ] Verify Codex app-server adapter/proxy assumptions against model-first resolution and workspace-memory-through-tools routing.
- [ ] Add provider metadata for core OpenAI-compatible embeddings, Pixverse video, VLLM thinking params, and Claude CLI OAuth overlays where applicable.
- [ ] Refresh channel delivery/approval tests for Telegram, iMessage, Slack, Matrix, QQBot, Discord, and Google Chat behavior changes.

Acceptance:

- Atlas graph current OpenClaw agent-version surfaces consistently target `agentVersion:openclaw:ge-2026-5-27`, except explicitly historical aliases or compatibility notes.
- OpenClaw version metadata records release-specific security/content boundary updates, Codex app-server model/workspace-memory behavior, gateway/reply cache coverage, provider catalog changes, channel delivery fixes, and release/package hardening where matching graph surfaces exist.
- Package/install metadata continues to use the unchanged `openclaw` package name.
- `agent-catalog` remains consistent with the graph; update generated/catalog-facing files only if the graph verification shows they are required.
- Deterministic metadata verification passes.
- Work is committed and pushed to `agent/issue-500`, a PR is opened against `staging`, and issue #500 receives a summary comment.
