# Issue #320: Assimilate OpenClaw 2026.5.22

Upstream version: 2026.5.20 -> 2026.5.22.

Release: `openclaw` npm package version `2026.5.22`, GitHub tag `v2026.5.22`, published 2026-05-24.

Labels: `agent-version-update`, `graph-update`.

Issue body checklist:

- Smoke-test OpenClaw Gateway startup readiness on `openclaw@2026.5.22`.
- Add plugin SDK metadata coverage for channel-message poll sender if indexed.
- Update launchBehavior notes for bare `openclaw` classic onboarding before config exists.
- Map xAI/Grok `web_search` auth-profile reuse in provider metadata.

Release notes that should be reflected where this graph has matching surfaces:

- Gateway startup and performance now cache channel catalog reads and plugin metadata snapshots, lazy-load plugin work, core gateway method handlers, and embedded ACPX runtime, and avoid repeated filesystem probes.
- Meeting Notes adds a source-provider contract, read-only `openclaw meeting-notes` CLI access, manual transcript imports, auto-start capture config, and Discord voice source.
- Plugin SDK adds a generic channel-message poll sender.
- Control UI chat adds session search/load more.
- Bare `openclaw` starts classic onboarding before an authored config exists.
- xAI/Grok reuses xAI OAuth auth profiles for Grok `web_search`; Grok aliases and media provider timeout metadata were added.

Acceptance:

- Atlas graph references to the current OpenClaw agent version must consistently target `agentVersion:openclaw:ge-2026-5-22`, unless the reference is explicitly a historical alias.
- OpenClaw version metadata must include version-specific notes for Gateway readiness/startup behavior, plugin SDK channel-message poll sender, meeting-notes source provider surface, bare CLI onboarding behavior, and xAI/Grok auth reuse when those surfaces are modeled.
- Deterministic metadata verification must pass.
- Work must be committed, pushed to `agent/issue-320`, and summarized on issue #320.
