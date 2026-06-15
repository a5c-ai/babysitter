# Issue #443: Track OpenClaw 2026.5.26 upstream release

Labels: `agent-version-update`, `graph-update`.

Research from the 2026-05-27 upstream-agent version sweep.

- Old graph version: OpenClaw >=2026.5.22
- Latest upstream npm version: openclaw 2026.5.26
- Package/install: openclaw, unchanged
- Release notes: https://github.com/openclaw/openclaw/releases/tag/v2026.5.26-beta.2

Real release changes read:

- Gateway/reply paths avoid repeated plugin, channel, session, usage-cost, warning, scheduled-service, and filesystem scans.
- Transcript-backed meeting summaries, source-provider chunks, cleaned user turns, media provenance, Codex mirrors, WebChat replies, and CLI/TUI replay converge on a core transcript path.
- Telegram, iMessage, WhatsApp, Discord, Signal, and mobile approval flows got channel-specific reliability and reaction approval improvements.
- Realtime Talk runs can be inspected, steered, cancelled, or followed up from Web UI and Discord voice.
- Browser snapshot reads honor SSRF policy; fetched file text is wrapped as external content; serialized tool-call text is scrubbed from replies.
- Provider/Codex/local-model recovery improved: named auth profiles, OpenAI sampling params, Codex app-server resume/timeout/usage-limit recovery, dynamic tool-schema guards, xAI usage-limit surfacing, Ollama top-p normalization.
- Install/update paths hardened for Alpine, runtime fallback roots, stable channels, Docker/package timeouts, Windows Scheduled Tasks, Windows/macOS proof lanes, and plugin publish checks.

Likely affected surfaces:

- Gateway readiness/cache modeling: update startup and reply-path cache metadata.
- Transcript/meeting-notes graph: core transcript path now backs meeting summaries and replay surfaces.
- Channel adapters: reaction approval primitives for Signal/iMessage/WhatsApp and Discord voice/Talk surfaces.
- Security policy: browser snapshot SSRF and external-content wrapping affect fetch/browser tool metadata.
- Provider auth/transport: named auth profiles, OpenAI sampling params, Codex app-server recovery, xAI usage-limit surfacing.

Install/package changes: package name unchanged; release notes mention install/update hardening but no package-name change.
Migration steps mentioned: none explicit.

Assimilation checklist:

- [ ] Update OpenClaw gateway metadata: add cache coverage for plugin/channel/session/usage-cost/warning/scheduled-service/filesystem scans.
- [ ] Update transcript metadata: mark meeting summaries, source-provider chunks, Codex mirrors, WebChat replies, CLI/TUI replay as transcript-backed.
- [ ] Update channel approval metadata: add Signal/iMessage/WhatsApp reaction approvals and Discord voice/Talk follow-up controls.
- [ ] Update security metadata: add SSRF enforcement for browser snapshots and external-content wrapping for fetched files.
- [ ] Update provider metadata: add named auth profiles, OpenAI sampling params, Codex app-server resume/timeout/usage-limit recovery, and xAI usage-limit surfacing.

Acceptance:

- Atlas graph current OpenClaw agent-version surfaces consistently target `agentVersion:openclaw:ge-2026-5-26`, except explicitly historical aliases or compatibility notes.
- OpenClaw version metadata records release-specific gateway/reply cache coverage, transcript-backed surfaces, channel reaction approvals and Talk controls, browser snapshot SSRF/external-content security, and provider/Codex/local recovery changes where matching graph surfaces exist.
- Package/install metadata continues to use the unchanged `openclaw` package name.
- Deterministic metadata verification passes.
- Work is committed and pushed to `agent/issue-443`, a PR is opened against `staging`, and issue #443 receives a summary comment.
