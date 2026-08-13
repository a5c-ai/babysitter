# Release incident record — stale `latest` dist-tags (2026-08-13)

Status: WAVE-0 containment record (remediation program, `fix/remediation-program`)
Incident IDs: FIX-001 (stale `latest` promotion), with directly observed side findings FIX-002, FIX-004, FIX-005
Registry snapshot captured: 2026-08-13 (read-only `npm view` queries; no registry state was mutated to produce this record)
Snapshot method: for every public workspace package, `npm view <name> dist-tags versions time.modified --json`

## Summary

The intended production-current release of the babysitter monorepo is **6.0.3** (root `package.json` version on `main` at commit `120926cf0`). Registry observation shows that publication of 6.0.3 partially succeeded but channel promotion did not: **37 of 43** public packages still resolve `latest` to the stale **6.0.0** artifact even though a 6.0.3 artifact exists for them, **5** packages already resolve `latest=6.0.3`, and **1** package (`@a5c-ai/hooks-adapter-genty`) has never been published at all. One additional package (`@a5c-ai/genty-ui`) has no 6.0.3 release version on the registry (only `6.0.3-staging.*` prereleases), so it cannot be promoted to 6.0.3 as-is.

This split-brain state is the concrete manifestation of FIX-001 in the remediation plan: the release tag path can reassign `latest` to the stale version read from checked-out workspace manifests (which are still 6.0.0) instead of the synchronized release version (6.0.3).

## Containment decisions (in force as of 2026-08-13)

1. **Production promotion is PAUSED.** No automated or manual promotion of any production channel dist-tag (`latest`) may occur until FIX-001 has a passing regression test and the release owner approves the corrected flow. This pause applies to all publish paths: `.github/workflows/publish.yml`, `.github/workflows/publish-packages-from-tag.yml`, `.github/workflows/release-tags.yml`, and any manual `npm dist-tag` invocation.
2. **No overwrites, no unpublish.** Existing npm versions (including the broken `@a5c-ai/tasks-adapter@6.0.0` and `@a5c-ai/extensions-adapter@6.0.0` artifacts) must NOT be overwritten, unpublished, or force-republished. Recovery goes through a **new patch version** (a version unused across all 43 public packages, i.e. 6.0.4 or later at the time of the recovery release) followed by **explicit dist-tag correction** once the new version passes exact-version clean-consumer validation.
3. **Registry mutations require explicit approval.** Any `npm publish`, `npm unpublish`, `npm deprecate`, or `npm dist-tag` action against `@a5c-ai/*` is an operational change, not an ordinary code-review step. Each such action requires prior sign-off from the release owner and must be recorded (command, actor, timestamp, result) in this incident record or the recovery release issue.
4. **Snapshot must be refreshed before recovery.** Registry state is time-sensitive. The table below is authoritative for 2026-08-13 only; re-run the snapshot immediately before executing the recovery release.

## Intended production-current release

- **Intended version: 6.0.3** — the root `package.json` version on `main`.
- Checked-in workspace package manifests are still mostly `6.0.0` (two exceptions: `@a5c-ai/babysitter-observer-dashboard` and the root manifest are `6.0.3`); manifest synchronization to the release version happens only in temporary publication workspaces. This divergence is the FIX-001 root cause and must be closed before promotion resumes.
- **Release owner for FIX-001 and the recovery release: Yossi Elkrief** (repository release manager, per the remediation program kickoff).

## Registry snapshot — all 43 public packages

Inventory basis: every tracked workspace `package.json` where `private !== true` and `publishConfig.access === "public"` (43 packages; this matches the audit count exactly). Coverage is complete — this is a full census, not a sample.

Dist-tags observed on the registry were `latest` and `staging` only; no package carried any other dist-tag. All 42 published packages share the same staging tag value, `6.0.3-staging.f5f113c68e2c` (staging prerelease of commit `f5f113c68`).

| Package | Workspace dir | Manifest version | `latest` | `staging` | 6.0.3 on registry | State |
| --- | --- | --- | --- | --- | --- | --- |
| `@a5c-ai/adapters` | `packages/adapters/sdk` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/adapters-cli` | `packages/adapters/cli` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/adapters-codecs` | `packages/adapters/codecs` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/adapters-gateway` | `packages/adapters/gateway` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/adapters-harness-mock` | `packages/adapters/harness-mock` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/adapters-observability` | `packages/adapters/observability` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/atlas` | `packages/atlas` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/babysitter` | `packages/babysitter` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/babysitter-observer-dashboard` | `packages/observer-dashboard` | 6.0.3 | 6.0.3 | 6.0.3-staging.f5f113c68e2c | yes | latest already current |
| `@a5c-ai/babysitter-sdk` | `packages/babysitter-sdk` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/channels-adapter` | `packages/adapters/channels` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/comm-adapter` | `packages/adapters/core` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/config-adapter` | `packages/adapters/config` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/extensions-adapter` | `packages/adapters/extensions` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged; 6.0.0 tarball is known-broken (FIX-004) |
| `@a5c-ai/genty` | `packages/genty/cli` | 6.0.0 | 6.0.3 | 6.0.3-staging.f5f113c68e2c | yes | latest already current |
| `@a5c-ai/genty-core` | `packages/genty/core` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/genty-platform` | `packages/genty/platform` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/genty-runtime` | `packages/genty/runtime` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/genty-tui` | `packages/genty/tui` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/genty-ui` | `packages/genty/ui` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | no | stale latest; no 6.0.3 release exists (only 6.0.3-staging.* prereleases) |
| `@a5c-ai/hooks-adapter-antigravity` | `packages/adapters/hooks/adapter-antigravity` | 6.0.0 | 6.0.3 | 6.0.3-staging.f5f113c68e2c | yes | latest already current |
| `@a5c-ai/hooks-adapter-claude` | `packages/adapters/hooks/adapter-claude` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/hooks-adapter-cli` | `packages/adapters/hooks/cli` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/hooks-adapter-codex` | `packages/adapters/hooks/adapter-codex` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/hooks-adapter-copilot` | `packages/adapters/hooks/adapter-copilot` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/hooks-adapter-core` | `packages/adapters/hooks/core` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/hooks-adapter-cursor` | `packages/adapters/hooks/adapter-cursor` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/hooks-adapter-gemini` | `packages/adapters/hooks/adapter-gemini` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/hooks-adapter-genty` | `packages/adapters/hooks/adapter-genty` | 6.0.0 | (absent) | (absent) | no | package has never been published (FIX-005); hooks CLI declares an exact dependency on it |
| `@a5c-ai/hooks-adapter-hermes` | `packages/adapters/hooks/adapter-hermes` | 6.0.0 | 6.0.3 | 6.0.3-staging.f5f113c68e2c | yes | latest already current |
| `@a5c-ai/hooks-adapter-oh-my-pi` | `packages/adapters/hooks/adapter-oh-my-pi` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/hooks-adapter-openclaw` | `packages/adapters/hooks/adapter-openclaw` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/hooks-adapter-opencode` | `packages/adapters/hooks/adapter-opencode` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/hooks-adapter-pi` | `packages/adapters/hooks/adapter-pi` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/kradle` | `packages/kradle/core` | 6.0.0 | 6.0.3 | 6.0.3-staging.f5f113c68e2c | yes | latest already current |
| `@a5c-ai/kradle-installer` | `packages/kradle/installer` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/launch-adapter` | `packages/adapters/launch` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/policy-adapter` | `packages/adapters/policy` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/tasks-adapter` | `packages/adapters/tasks` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged; 6.0.0 omits its MCP SDK runtime dependency (FIX-002) |
| `@a5c-ai/tools-adapter` | `packages/adapters/tools` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/transport-adapter` | `packages/adapters/transport` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/triggers-adapter` | `packages/adapters/triggers` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |
| `@a5c-ai/trust-core` | `packages/trust-core` | 6.0.0 | 6.0.0 | 6.0.3-staging.f5f113c68e2c | yes | stale latest; 6.0.3 exists but is untagged |

Tally: 43 public packages total — 37 stale `latest=6.0.0`, 5 `latest=6.0.3`, 1 never published. 41 packages have a 6.0.3 release version on the registry; `@a5c-ai/genty-ui` and `@a5c-ai/hooks-adapter-genty` do not.

## Recovery plan (requires release-owner approval before execution)

Recovery is Wave 5 of the remediation program and must not begin until FIX-001 (Wave 4) has a passing regression test and Waves 1-3 close the known-broken package artifacts. The recovery release will:

1. Refresh this registry snapshot (npm state is time-sensitive).
2. Select a new patch version unused across all 43 public packages (6.0.4 or later; verify against the refreshed snapshot).
3. Build, run all fast checks and the FIX-011 packed-artifact matrix, and publish dependency-ordered candidates under a **non-production** dist-tag — publishing `@a5c-ai/hooks-adapter-genty` for the first time, and before `@a5c-ai/hooks-adapter-cli`.
4. Validate the exact candidate version via the published-consumer workflow (FIX-010).
5. Only then move `latest` to the tested exact version via explicit, approved `npm dist-tag` corrections, and assert every public package's channel tag equals that version.
6. Consider `npm deprecate` notices for the known-broken `@a5c-ai/tasks-adapter@6.0.0` and `@a5c-ai/extensions-adapter@6.0.0` artifacts (separate approval; never unpublish as ordinary remediation).

## Containment exit criteria status

- [x] Production promotion pause is documented and in force (this record). Operational enforcement in CI/GitHub settings (e.g. environment protection on the publish workflows) is a release-owner action tracked for FIX-001.
- [x] The intended release version (6.0.3) is documented.
- [x] A release owner is assigned to FIX-001 and the final recovery release (Yossi Elkrief).
- [x] Current versions and dist-tags for every public package are recorded (full 43-package census above; not a sample).
- [x] Recovery is planned through a new patch version and explicit dist-tag correction; no overwrite or unpublish of existing versions.
