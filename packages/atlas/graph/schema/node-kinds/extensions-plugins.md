# NodeKinds: Extensions & Plugins

> Cluster 7 — Extension primitives. See [`README.md`](./README.md) for the full
> catalog and [`../../schema/meta-schema.md`](../../schema/meta-schema.md) for the standard node-kind
> file shape.

## Purpose

This file specifies the node kinds that compose the atlas extension stack: the universal
`Plugin`, the per-host `NativeExtension` and the cross-host `PortableExtension`, the
content shapes (`Skill`, `Subagent`, `ToolServer`, `ToolDescriptor`), the a5c-flavored
`Blueprint` install bundle, and the 13 `ExtensionInterface`s that named extensions
implement. (The 14th interface, `trust-interface`, has been removed: cross-stack
signing / attestation is out-of-scope for the Phase 1 ontology.)

The shape mirrors the legacy "skills + MCP + hooks union" model but lifts it from prose
into typed graph nodes so `applies_to`, `requires_capability`, `implements`, and
`installs_into` can be queried, validated, and rendered uniformly across hosts. A
`Plugin` is the package; a `NativeExtension` or `PortableExtension` records *how* the
package is delivered to a particular host; the content shapes (`Skill`, `Subagent`,
`ToolServer`) describe *what* is delivered; `ToolDescriptor` is the unit of callable
behaviour; `ExtensionInterface` is the contract such content fulfils.

---

## NodeKind: `Plugin`

The universal plugin — a union of skills, MCP servers, subagents, hooks, and blueprints
delivered as a single installable unit.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `plugin:<slug>`. |
| `displayName` | string | yes | Human-readable. |
| `vendor` | string | yes | Publisher. |
| `homepageUrl` | url | yes | **Evidence-bound at vendor-doc-or-better** when the plugin claims to be vendor-published. |
| `installFormats` | list<enum<npm,marketplace,git,manual>> | yes | Supported install formats. |
| `description` | markdown | yes | One-paragraph description. |
| `manifestPath` | string | no | Path to the host-specific manifest in the package. For Claude Code plugins this is `.claude-plugin/plugin.json`; legacy examples used `plugin.json` at the package root. |
| `provenance` | enum<built-in,custom,mixed> | no | Generalized from Subagent.provenance (remodel 2026-04-29). built-in = vendor-shipped plugin; custom = user-installed; mixed = vendor ships defaults the user can override. Default `custom`. |
| `version` | semver | no | Current canonical version of this Plugin. Single-version-at-a-time pattern (remodel 2026-04-29 — change B); see [../../schema/meta-schema.md §Version-tracking pattern](../../schema/meta-schema.md#version-tracking-pattern). |
| `releasedAt` | iso-date | no | Release date of the current version. |
| `supersededBy` | ref<`Plugin`> | no | When this Plugin has been deprecated in favor of another, point to the replacement. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `installs_into` | `AgentProduct` | N:N | Carries `installMethod`. |
| `contains_skill` | `Skill` | 1:N | Skills bundled in this plugin. |
| `contains_subagent` | `Subagent` | 1:N | Subagents bundled. |
| `contains_tool_server` | `ToolServer` | 1:N | Tool servers bundled. |
| `contains_tool_descriptor` | `ToolDescriptor` | 1:N | Tool descriptors bundled (catalog pass 50 — replaces the deleted catalog pass 47 `bundles_tool_descriptor`). |
| `contains_lsp_server` | `LSPServer` | 1:N | LSP servers bundled (Claude Code `.lsp.json`). |
| `contains_monitor` | `BackgroundMonitor` | 1:N | Background monitors bundled (Claude Code `monitors/monitors.json`). |
| `contains_bin` | `BinaryProvider` | 1:N | `bin/` directory of executables added to PATH. |
| `ships_settings` | `SettingsTemplate` | 1:N | Plugin-shipped `settings.json` fragments merged into host settings on install. |
| `implements` | `ExtensionInterface` | N:N | The 14 a5c interfaces this plugin satisfies. |
| `applies_to` | `Domain` \| `Specialization` \| `Topic` | N:N | Carries `confidence`. |
| `requires_capability` | `Capability` | N:N | Carries `level`. |
| `sourced_from` | `SourceRef` | N:1 | Upstream source pointer. |

### Evidence

`homepageUrl` is evidence-bound at vendor-doc-or-better when the plugin is vendor-
published. Community-published plugins may carry community-trust evidence sources for
the same field.

### Invariants

1. A `Plugin` MUST contain at least one of skill / subagent / tool-server.
2. Every `installFormats` entry MUST be supported by at least one `installs_into` edge
   carrying that `installMethod`.

---

## NodeKind: `NativeExtension` (deprecated; subsumed by `Plugin.nativeFormat`)

Removed in catalog pass 21 hygiene (2026-05-01). The host-specific plugin-format
information is now carried by the `Plugin.nativeFormat` enum attribute (values
mirror `AgentPlatformImpl.nativeExtensionFormat`: `claude-plugin`,
`cursor-extension`, `codex-extension`, `gemini-extension`, `opencode-acp`,
`gh-copilot-plugin`, `omp-plugin`, `openclaw-plugin`, `pi-plugin`, `a5c-plugin`,
`babysitter-plugin`, `none`). A former `NativeExtension` becomes a `Plugin` with
`portability: native` and the appropriate `nativeFormat`.

---

## NodeKind: `PortableExtension` (deprecated; subsumed by `Plugin.portability`)

Removed in catalog pass 21 hygiene (2026-05-01). Cross-host portability is now carried
by the `Plugin.portability` enum (`portable | native | hybrid`). A former
`PortableExtension` becomes a `Plugin` with `portability: portable`; the
`compiles_to` edge still records the per-host outputs (now `Plugin → Plugin`,
where the target Plugin has `portability: native`).

---

## NodeKind: `Skill`

A directory of markdown plus optional scripts, named and discoverable by an agent host.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `skill:<slug>`. |
| `displayName` | string | yes | Human-readable. |
| `description` | markdown | yes | One-paragraph description (the trigger description). |
| `keyword` | string | no | Slash-command keyword (e.g. `react-tdd`). |
| `entrypoint` | string | yes | Default `SKILL.md`. |
| `domains` | list<ref<`Domain`> \| ref<`Specialization`> \| ref<`Topic`>> | yes | Where the skill applies. |
| `roles` | list<ref<`Role`>> | yes | Roles the skill is intended for. |
| `requiresLanguages` | list<ref<`Language`>> | no | Required programming languages. |
| `requiresFrameworks` | list<ref<`Framework`>> | no | Required frameworks. |
| `sourceRef` | ref<`SourceRef`> | yes | Upstream source. |
| `scopeBoundary` | ref<`ScopeBoundary`> | no | In-scope / out-of-scope declaration. |
| `provenance` | enum<built-in,custom,mixed> | no | Generalized from Subagent.provenance (remodel 2026-04-29). built-in = vendor-shipped (e.g. Claude Code's bundled skills). custom = user-installed. mixed = vendor ships defaults the user can override. Default `custom`. |
| `version` | semver | no | Current canonical version of this Skill. Single-version-at-a-time pattern (remodel 2026-04-29 — change B); see [../../schema/meta-schema.md §Version-tracking pattern](../../schema/meta-schema.md#version-tracking-pattern). |
| `releasedAt` | iso-date | no | Release date of the current version. |
| `supersededBy` | ref<`Skill`> | no | When this Skill has been deprecated in favor of another, point to the replacement. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `applies_to` | `Domain` \| `Specialization` \| `Topic` | N:N | Carries `confidence`. |
| `requires_capability` | `Capability` | N:N | Capabilities the host MUST provide. |
| `requires_skill` | `Skill` \| `Domain` \| `Specialization` | N:N | Carries `level`. |
| `contained_in_plugin` | `Plugin` | N:1 | Inverse of `contains_skill`. |
| `implements` | `ExtensionInterface` | N:N | The interface(s) the skill realizes. |
| `sourced_from` | `SourceRef` | N:1 | Source-of-truth pointer. |

### Evidence

`description` and `domains` are descriptive editorial values gated by the default
policy; no additional evidence beyond schema base rules. Capability requirements
on the skill are evidenced via the standard `requires_capability` claim path.

### Invariants

1. `keyword` (when present) MUST be unique within a containing `Plugin`.
2. `entrypoint` defaults to `SKILL.md`; non-default values MUST exist on disk.
3. `requiresFrameworks` non-empty implies `requiresLanguages` covers the framework's
   language(s).

---

## NodeKind: `Subagent`

A specialized worker / persona an agent runtime can dispatch alongside its primary
loop. Canonical term follows Anthropic Claude Code ("subagent", one word;
[docs.anthropic.com/en/docs/claude-code/sub-agents][cc-sub]). The same NodeKind
covers two **provenance** variants:

- **`built-in`** — vendor-shipped (Claude Code's bundled `general-purpose`,
  `Explore`, `Plan`; OpenAI Agents SDK built-in handoff patterns).
- **`custom`** — user-installable definition (Claude Code
  `.claude/agents/<name>.md`, parallel to a Skill's `SKILL.md`).
- **`mixed`** — vendor ships defaults that the user may override.

The dispatch *mechanism* a runtime uses to invoke a subagent is recorded on
[`AgentRuntimeImpl.subagentDispatchMechanism`](agent-stack.md) (`task-tool` /
`handoff` / `sub_agents-array` / `agent-as-tool` / `none`). The on-disk
*definition format* a platform loads custom subagents from is recorded on
[`AgentPlatformImpl.subagentDefinitionFormat`](agent-stack.md) (`claude-code-md`
/ `none`).

[cc-sub]: https://docs.anthropic.com/en/docs/claude-code/sub-agents

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `subagent:<slug>`. |
| `displayName` | string | yes | Human-readable. |
| `provenance` | enum<built-in,custom,mixed> | yes | See description above. Default `custom`. Phase-2 backfill flips to evidence-bound at vendor-doc-or-better when `provenance != custom`. |
| `subjectId` | id | conditional | When `provenance=built-in`: ref<`AgentVersion`> \| ref<`AgentProduct`> the subagent ships with. When `provenance=custom`: typically unset. |
| `roleId` | ref<`Role`> | yes | Which `Role` the subagent fulfils. |
| `systemPrompt` | markdown | yes | The subagent's system prompt. |
| `tools` | list<ref<`ToolDescriptor`>> | yes | Allowed tools. |
| `disallowedTools` | list<ref<`ToolDescriptor`>> | no | Explicitly disallowed tools. |
| `modelPreference` | ref<`ModelVersion`> | no | Preferred model when not overridden. |
| `triggers` | markdown | yes | When the subagent should be invoked. |
| `description` | markdown | yes | One-paragraph description. |
| `version` | semver | no | Current canonical version of this Subagent. Single-version-at-a-time pattern (remodel 2026-04-29 — change B); see [../../schema/meta-schema.md §Version-tracking pattern](../../schema/meta-schema.md#version-tracking-pattern). |
| `releasedAt` | iso-date | no | Release date of the current version. |
| `supersededBy` | ref<`Subagent`> | no | When this Subagent has been deprecated in favor of another, point to the replacement. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `roles_played_by` | `Role` | N:N | Inverse: `played_by`. |
| `applies_to` | `Domain` \| `Specialization` \| `Topic` | N:N | Carries `confidence`. |
| `contained_in_plugin` | `Plugin` | N:1 | Inverse of `contains_subagent`. |
| `implements` | `ExtensionInterface` | N:N | E.g., a code-reviewer subagent implementing `governance`. |
| `requires_capability` | `Capability` | N:N | Carries `level`; e.g. `capability:supports-subagent-dispatch`, `capability:supports-custom-subagents`. |
| `sourced_from` | `SourceRef` | N:1 | Source-of-truth pointer. |

### Evidence

No evidence-bound attributes by default. Phase-2 backfill adds an evidence
binding on `provenance` (vendor-doc-or-better) when `provenance != custom`,
since the claim "this subagent ships with vendor X" should be backed by the
vendor's docs. The `Role` / `Capability` references are evidenced via their
own claim paths.

### Invariants

1. `tools` and `disallowedTools` MUST be disjoint.
2. The `Role` referenced by `roleId` MUST have `isAgentic = true`.
3. `provenance = built-in` implies `subjectId` is set and resolves to an
   `AgentVersion` or `AgentProduct`.

---

## NodeKind: `ToolServer`

An external process speaking a tool protocol (MCP, A2A, AnyCLI, custom).

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `tool-server:<slug>`. |
| `displayName` | string | yes | Human-readable. |
| `protocol` | enum<mcp,a2a,anycli,custom> | yes | The protocol this server speaks. |
| `mcpTransports` | list<ref<`MCPTransport`>> | conditional | Required when `protocol = mcp`. |
| `tools` | list<ref<`ToolDescriptor`>> | yes | Tools the server exposes. |
| `sourceRef` | ref<`SourceRef`> | yes | Source-of-truth pointer. |
| `provenance` | enum<built-in,custom,mixed> | no | Generalized from Subagent.provenance (remodel 2026-04-29). built-in = vendor-shipped tool server; custom = user-installed. Default `custom`. |
| `version` | semver | no | Current canonical version of this ToolServer. Single-version-at-a-time pattern (remodel 2026-04-29 — change B); see [../../schema/meta-schema.md §Version-tracking pattern](../../schema/meta-schema.md#version-tracking-pattern). |
| `releasedAt` | iso-date | no | Release date of the current version. |
| `supersededBy` | ref<`ToolServer`> | no | When this ToolServer has been deprecated in favor of another, point to the replacement. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `contained_in_plugin` | `Plugin` | N:1 | Inverse of `contains_tool_server`. |
| `implements` | `ExtensionInterface` | N:N | E.g., a memory tool-server implementing `memory`. |
| `requires_capability` | `Capability` | N:N | Carries `level`. |
| `sourced_from` | `SourceRef` | N:1 | Source-of-truth pointer. |

### Evidence

`protocol` and `mcpTransports` are evidence-bound at **vendor-doc-or-better**
when the tool server is vendor-published; community servers may carry
`community` evidence.

### Invariants

1. `mcpTransports` MUST be non-empty iff `protocol = mcp`.
2. Every entry in `tools` MUST be uniquely referenced (no duplicate `ToolDescriptor`s).

---

## NodeKind: `LSPServer`

A language server bundled in a plugin. Claude Code plugins declare these via `.lsp.json`.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `lsp-server:<slug>`. |
| `displayName` | string | yes | Human-readable. |
| `manifestPath` | string | yes | Default `.lsp.json` for Claude Code plugins. |
| `command` | string | yes | The LSP launch command. |
| `args` | list<string> | no | Command args. |
| `languages` | list<ref<`Language`>> | yes | Languages this LSP serves. |
| `frameworks` | list<ref<`Framework`>> | no | Frameworks the LSP is tuned for. |
| `transport` | enum<stdio,tcp,websocket,ipc> | yes | LSP wire transport. |
| `description` | markdown | no | One-line. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `contained_in_plugin` | `Plugin` | N:1 | Inverse of `contains_lsp_server`. |
| `serves_language` | `Language` | N:N | Mirrors `languages`. |
| `sourced_from` | `SourceRef` | N:1 | Source-of-truth pointer. |

### Evidence

`command`, `args`, and `transport` describe a launchable artifact; no evidence
binding by default beyond the standard `sourced_from` requirement.

### Invariants

1. `manifestPath` MUST exist within the containing plugin's package path.
2. `languages` MUST be non-empty.

---

## NodeKind: `BackgroundMonitor`

A long-running monitor process bundled in a plugin. Claude Code plugins declare these
via `monitors/monitors.json`.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `background-monitor:<slug>`. |
| `displayName` | string | yes | Human-readable. |
| `manifestPath` | string | yes | E.g. `monitors/monitors.json`. |
| `command` | string | yes | Launch command. |
| `args` | list<string> | no | Command args. |
| `triggers` | list<enum<session-start,file-change,git-event,timer,custom>> | yes | What starts the monitor. |
| `lifecycle` | enum<persistent,per-session,on-demand> | yes | Monitor lifetime. |
| `outputs` | list<enum<notification,file,hook-event,custom>> | yes | What the monitor emits. |
| `description` | markdown | no | One-line. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `contained_in_plugin` | `Plugin` | N:1 | Inverse of `contains_monitor`. |
| `emits_hook` | `HookSurface` | N:N | Hook events the monitor produces. |
| `sourced_from` | `SourceRef` | N:1 | |

### Evidence

No evidence-bound attributes by default beyond the standard `sourced_from`
requirement.

### Invariants

1. `lifecycle` and `triggers` MUST be coherent (e.g., `on-demand` lifecycle implies the
   monitor isn't auto-started by `session-start`).

---

## NodeKind: `BinaryProvider`

A `bin/` directory of executables a plugin adds to `PATH` on install. Claude Code plugins
support a `bin/` folder whose contents become callable from the agent's shell environment.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `binary-provider:<slug>`. |
| `displayName` | string | yes | Human-readable. |
| `binDir` | string | yes | Relative path within plugin (default `bin/`). |
| `executables` | list<map<name,platform,target>> | yes | Per-executable metadata. `platform` ∈ {darwin,linux,win32,all}. |
| `pathPolicy` | enum<prepend,append,session-only> | yes | Where on `PATH` and for what scope. |
| `description` | markdown | no | |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `contained_in_plugin` | `Plugin` | N:1 | Inverse of `contains_bin`. |
| `provides_executable` | `ToolDescriptor` | N:N | Each executable optionally also a callable tool. |

### Evidence

`executables[*].target` (binary checksum/version) is evidence-bound at
**community-or-better** when claimed; otherwise descriptive.

### Invariants

1. Every entry in `executables` MUST exist on disk under `binDir` for at least one
   declared platform.
2. `pathPolicy: session-only` MUST be supported by the host platform; otherwise the
   declaration falls back to `prepend` with a warning recorded as evidence.

---

## NodeKind: `SettingsTemplate`

A plugin-shipped `settings.json` fragment merged into the host's settings on install.
Claude Code plugins can ship per-platform settings overrides; the merge is structural
(deep-merge) with conflict-resolution rules declared on the template.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `settings-template:<slug>`. |
| `displayName` | string | yes | Human-readable. |
| `targetSettingsPath` | string | yes | Where to merge (e.g. `~/.claude/settings.json`, `.claude/settings.json`). |
| `fragmentPath` | string | yes | Path within plugin to the template fragment. |
| `mergeStrategy` | enum<deep-merge,replace,append-only,prepend-only> | yes | How to combine with existing settings. |
| `conflictPolicy` | enum<keep-existing,overwrite,prompt-user,fail> | yes | What to do on key collision. |
| `scope` | enum<user,project,both> | yes | Settings scope the fragment targets. |
| `revertOnUninstall` | bool | yes | Whether the merge can be cleanly undone. |
| `description` | markdown | no | |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `contained_in_plugin` | `Plugin` | N:1 | Inverse of `ships_settings`. |
| `merges_into` | `PathDescriptor` | N:1 | Typed path to the host settings file. |

### Evidence

No evidence-bound attributes by default; the merge semantics are catalog-internal.

### Invariants

1. `targetSettingsPath` MUST resolve to a `PathDescriptor` of `pathKind: settings-file`.
2. `revertOnUninstall: true` requires `mergeStrategy: deep-merge` with `conflictPolicy ∈ {keep-existing, overwrite}` (not `prompt-user`).

---

## NodeKind: `ToolDescriptor`

A single callable tool exposed by a `ToolServer` (or natively by an `AgentVersion`).

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `tool:<slug>`. |
| `displayName` | string | yes | Human-readable. |
| `inputSchema` | json | yes | JSON Schema for the input. |
| `outputSchema` | json | yes | JSON Schema for the output. |
| `timeoutMs` | int | no | Optional default timeout. |
| `mode` | enum<normal,direct,background> | yes | How the tool is dispatched. |
| `streamable` | bool | yes | Whether outputs can stream. |
| `description` | markdown | yes | What the tool does. |
| `requiresPermissionGate` | bool | no | catalog pass 53 — claude-code `CanUseToolFn` per-call permission hook. |
| `supportsCancellation` | bool | no | catalog pass 53 — honors AbortSignal mid-call. |
| `abortPropagation` | enum&lt;immediate,cooperative,delayed,none&gt; | no | catalog pass 53 — abort delivery semantics. |
| `errorBehavior` | enum&lt;retryable,fatal,user-handled,returns-tool-error&gt; | no | catalog pass 53 — thrown error vs structured tool_error result. |
| `isSynthetic` | bool | no | catalog pass 53 — claude-code `SYNTHETIC_OUTPUT_TOOL_NAME` runtime-inserted wrapper. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `requires_capability` | `Capability` | N:N | E.g., `capability:supports-tool-call-streaming` when `streamable = true`. |

### Evidence

`inputSchema`, `outputSchema`, and `mode` are evidence-bound at
**vendor-doc-or-better** when the descriptor is published by a vendor; otherwise
sourced from `repo-inspection` evidence on the tool server's source tree.

### Invariants

1. If `streamable = true`, the descriptor MUST `requires_capability` ↦
   `capability:supports-tool-call-streaming`.
2. `mode = background` requires the host runtime to expose a background-tool capability;
   the validator checks via `requires_capability`.

---

## NodeKind: `Blueprint`

An a5c-flavored markdown bundle the *agent* reads to install or configure a *project*.
Blueprints are NOT extensions for an agent — they are project-level setup recipes that an
agent executes (the SDK does not run them; the agent is the runtime). Concrete examples
live in the a5c marketplace at `plugins/a5c/marketplace/plugins/<slug>/` in the babysitter
repo: `a11y`, `basic-security`, `adr`, `auto-labeler`, `feature-flags`, `dora-metrics`,
`db-migrations-safety`, `i18n`, `helm-chart`, `iac-quality`, `branch-protection`,
`devcontainer`, `dependency-hygiene`, `data-privacy`, `community-health`, `changelog-enforcer`,
`changesets`, `sound-hooks`, etc. (~68 in total).

A Blueprint typically targets a **project** (scope), is **agent-agnostic** (any agent that
can read markdown and execute filesystem/CLI/git operations can run it), and has a fixed
on-disk shape under its package path.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `blueprint:<slug>`, slug matching the marketplace plugin name (e.g. `blueprint:a11y`). |
| `displayName` | string | yes | Human-readable name (typically the plugin's `name` field). |
| `description` | markdown | yes | One-paragraph description. Sourced from the marketplace `description` field. |
| `installMd` | markdown | yes | The full text of `install.md` — natural-language install instructions the agent executes. |
| `configureMd` | markdown | no | The full text of `configure.md` if present. |
| `uninstallMd` | markdown | yes | The full text of `uninstall.md`. |
| `latestVersion` | semver | yes | The newest released version. |
| `versions` | list<semver> | yes | All released versions. |
| `migrations` | list<map<string,markdown>> | no | Per-version migration steps (BFS upgrade-path resolution). |
| `tags` | list<string> | yes | Marketplace tags for discovery (e.g. `[accessibility, a11y, wcag, lint, ci, quality]`). |
| `author` | string | yes | Marketplace `author` field (e.g. `a5c-ai`). |
| `packagePath` | string | yes | Path within the marketplace repo to this blueprint (e.g. `plugins/a11y`). |
| `marketplaceUrl` | url | no | Marketplace homepage (evidence-bound when the blueprint claims to be marketplace-published). |
| `scope` | enum<project,user,global> | yes | Where the blueprint installs to. Most blueprints are `project` scope. |
| `domains` | list<ref<`Domain`> \| ref<`Specialization`> \| ref<`Topic`>> | no | Domain ontology tags. Derived from blueprint subject matter (`a11y` → `topic:accessibility`; `basic-security` → `domain:security`). |
| `requiresLanguages` | list<ref<`Language`>> | no | Languages a blueprint can act on (a Python-only blueprint declares `language:python`). |
| `requiresFrameworks` | list<ref<`Framework`>> | no | Frameworks the blueprint targets. |
| `targetSurface` | list<enum<filesystem,git-hooks,ci,github-actions,gitlab-ci,settings,package-json,readme,other>> | yes | Which project surfaces the blueprint touches. |
| `breakpoints` | list<markdown> | no | Phases where the blueprint pauses for user input (most a5c blueprints have a "Stage 1: Project Analysis" + interview phase). |
| `outOfScope` | ref<`ScopeBoundary`> | no | What the blueprint deliberately does not do. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `executable_by` | `AgentProduct` | N:N | Any AgentProduct that can read markdown + execute fs/CLI/git ops. Most blueprints work on any reasonable agent. |
| `applies_to` | `Domain` \| `Specialization` \| `Topic` | N:N | Carries `confidence`. |
| `sourced_from` | `SourceRef` | N:N | Source-of-truth pointer(s). One ref points at the blueprint package path; an additional ref MAY point at the marketplace `SourceRef` the blueprint is published in (e.g. `source-ref:a5c-marketplace`). The dedicated `published_in` edge was removed when `Marketplace` was folded into `SourceRef`. |
| `requires_blueprint` | `Blueprint` | N:N | Some blueprints depend on others being installed first. |
| `conflicts_with` | `Blueprint` | N:N | Blueprints that should not be installed together. |
| `out_of_scope` | `ScopeBoundary` | N:1 | Explicit non-goals. |

### Evidence

`marketplaceUrl` is evidence-bound at **vendor-doc-or-better** when set; the
marketplace listing serves as the canonical source. `installMd` / `uninstallMd`
are tied to the blueprint's `sourced_from` ref for verification.

### Invariants

1. `installMd` and `uninstallMd` MUST be present and non-empty.
2. Every entry in `migrations` MUST be keyed by a versionRange parseable by the
   schema's versionRange type.
3. `latestVersion` MUST appear in `versions`.
4. `packagePath` MUST be a valid relative path (typically `plugins/<slug>`).
5. `tags` SHOULD be non-empty for discoverability.

### Note on `installs_into` (legacy)

Earlier drafts had `installs_into AgentProduct` carrying `installMethod`. This was
incorrect — Blueprints don't install into agents; they install into *projects* that an
agent operates on. The renamed `executable_by` edge captures the correct relationship:
which AgentProducts can serve as the runtime that executes the blueprint's markdown.

---

## NodeKind: `Marketplace` (folded into `SourceRef`)

The standalone `Marketplace` NodeKind was removed in the 2026-04-29 remodel
(Change F). Marketplace registries — for example the a5c-ai blueprint
marketplace — are now represented as `SourceRef` nodes with
`kind: git-marketplace` (e.g. `source-ref:a5c-marketplace`). A `Blueprint`
links to its marketplace via `sourced_from` rather than the now-removed
`published_in` edge. Vendor / curated / npm-registry marketplaces use the
existing `SourceRef.kind` enum.

---

## NodeKind: `ExtensionInterface`

An a5c-flavored contract an extension fulfils. Exactly 13 such interfaces exist.
(`trust-interface` was removed when Trust Chain was deferred out of Phase 1.)

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `extension-interface:<slug>`, e.g. `extension-interface:reliability`. |
| `displayName` | string | yes | Human-readable. |
| `concern` | string | yes | One-sentence concern statement. |
| `surface` | markdown | yes | What the interface exposes (signatures, hooks, expectations). |
| `builtInDefault` | markdown | yes | The default implementation if no extension is installed. |
| `notableImpls` | list<string> | yes | Known implementations (refs to `Plugin` / `Skill` ids). |

### The 13 interfaces

`reliability`, `memory`, `secrets`, `identity`, `governance`, `telemetry`,
`sandbox`, `reflection`, `orchestration`, `reactor`, `sleep-cycle`, `compression`,
`optimization`.

(`trust` removed; cross-stack signing/attestation is deferred out of Phase 1.)

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `implemented_by` | `Plugin` \| `Skill` \| `Subagent` \| `ToolServer` | N:N | Inverse of `implements`. Carries `implementationDetail` (markdown). |

The `implements` edge (Plugin/Skill/Subagent/ToolServer → ExtensionInterface) carries
the implementation detail. The `targets` notion (a Plugin packages content) is encoded
via `contains_skill` / `contains_subagent` / `contains_tool_server` rather than a
separate edge.

### Evidence

`ExtensionInterface` is a catalog-internal contract; `surface` and
`builtInDefault` are descriptive markdown gated by the default policy only.

### Invariants

1. Exactly 13 `ExtensionInterface` nodes MUST exist (catalog-level invariant); the
   slugs MUST match the canonical list above. (Was 14 before `trust-interface` was
   removed in the Trust Chain de-scope.)
2. Every `notableImpls` entry MUST resolve to a real id once the catalog is populated.

---

## NodeKind: `PluginArtifact`

A single deliverable file (or container image) that a `PluginTarget` / `AgentVersion`
expects on disk after installation — e.g. a Claude Code `plugin.json` manifest, a
`commands/*.md` slash-command file, a `hooks/*.sh` script, a Codex
`hooks.json`, or a published container image. `PluginArtifact` makes the per-host
filesystem layout queryable so plugin compilers and validators can confirm every
required artifact is present.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `plugin-artifact:<slug>`, e.g. `plugin-artifact:claude-code:manifest`. |
| `artifactId` | string | yes | Stable artifact identifier (typically equals `id`). |
| `displayName` | string | no | Human-readable label. |
| `targetId` | ref<`PluginTarget`> \| ref<`AgentVersion`> | yes | The target this artifact belongs to. |
| `artifactKind` | enum<manifest,command,hook-script,skill-md,subagent-md,mcp-config,settings-fragment,container-image> | yes | What sort of artifact. |
| `pathPattern` | string | yes | **Evidence-bound.** Path glob or container-image reference (e.g. `.claude-plugin/plugin.json`, `ghcr.io/anthropics/claude-code`). |
| `installerSurface` | string | yes | Which surface installs the artifact (e.g. `plugin.json`, `package.json + hooks.json`, `fs`, `settings-merge`, `gh-secret`, `env-var`). |
| `scriptVariants` | list<string> | no | Permitted variants (e.g. `markdown-commands`, `package-json commands`, `extension-manifest`, `preinstalled`). |
| `contextFiles` | list<string> | no | Repo-relative source files that own this artifact's compilation. |
| `requiredAttributes` | list<string> | no | Attribute names the artifact must define on disk. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `emits_artifact` | `PluginTarget` | N:1 | Inverse of the target's `emits_artifact` edge. |
| `references_path` | `PathDescriptor` | N:N | The on-disk path(s) the artifact occupies. |
| `sourced_from` | `SourceRef` | N:1 | Where the artifact's compiler lives. |

### Evidence

`pathPattern` and `installerSurface` are evidence-bound at **vendor-doc-or-better**
when the artifact targets a vendor product; community evidence is sufficient for a
third-party `PluginTarget`.

### Invariants

1. `targetId` MUST resolve.
2. When `artifactKind = container-image`, `pathPattern` MUST be a container image
   reference (registry + path).
3. When `artifactKind = manifest`, the artifact MUST be referenced by exactly one
   `PluginTarget.manifestFormat`.

---

## NodeKind: `PluginTarget`

The per-agent target spec used by the `extension-mux` / `extension-mux` to know
*how* to compile a `Plugin` or `PortableExtension` into a `NativeExtension` for one
specific agent host. A `PluginTarget` is the **target descriptor** — manifest format,
command format, script variants, install layout, package metadata, distribution model.
It is distinct from `AgentPlatformImpl` (the platform itself); a single
`AgentPlatformImpl` is wired to one `PluginTarget` via `targets`.

Sourced from the legacy agent-catalog ontology
(`packages/agent-catalog/graph/schema/ontology-schema.yaml :: PluginTarget`).

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `plugin-target:<slug>`, e.g. `plugin-target:claude-code`. |
| `targetId` | string | no | Stable target identifier; typically equals the id slug. Optional in atlas because `id` is the canonical handle (legacy schema marked it required). |
| `displayName` | string | yes | Human-readable, e.g. `"Claude Code"`. |
| `hostAgent` | ref<`AgentProduct`> | yes | The `AgentProduct` this target compiles for. |
| `adapterName` | string | no | Internal adapter id used by `extension-mux` (e.g. `claude-code`, `codex`, `omp`). Legacy required; atlas optional pending evidence. |
| `adapterFamily` | enum<claude-code-native,shell-hook,programmatic,extension-manifest> | yes | **Evidence-bound at vendor-doc-or-better.** Declared family the adapter belongs to. |
| `manifestFormat` | string | no | **Evidence-bound at vendor-doc-or-better.** E.g. `"package.json + hooks.json"`, `"state-only"`, `"extension-manifest"`. Optional because some hosts (claude-code-native) use `manifestPath` only. |
| `manifestPath` | string | no | Direct path to the host-specific manifest, e.g. `.claude-plugin/plugin.json`. |
| `commandFormat` | enum<package-json-commands,markdown-commands,extension-manifest,preinstalled,none> | no | How the host loads slash-commands. |
| `skillHandling` | enum<native,markdown-fallback,unsupported> | no | Whether the host supports skills natively, via markdown fallback, or not at all. |
| `hookRegistrationFormat` | string | no | Hook-registration adapter id (e.g. `claude-code`, `codex`, `opencode`, `copilot-cli`, `none`). |
| `scriptVariants` | list<enum<bash,javascript,typescript,powershell>> | no | Script variants the target accepts on disk. |
| `distribution` | list<enum<npm-cli,github-repo,marketplace,container-image,manual>> | yes | Supported distribution channels. |
| `distributionModel` | enum<workspace-generated,vendor-hosted,marketplace-managed,user-installed> | no | High-level model for *how* targets are produced and shipped. |
| `installLayout` | map<string,string> | no | Layout-slot → relative-path map (`manifest`, `commands`, `agents`, `skills`, `hooks`, `mcp`, `harnessHomeRelative`, `pluginsDirRelative`, `marketplacePathRelative`). |
| `packageMetadata` | map<string,any> | no | Per-target npm package metadata: `moduleType`, `binScriptExt`, `installLifecycle`, `activationMessage`, `peerDependencyPackage`, `emitCjsWrappers`. |
| `componentSupport` | map<string,enum<native,unsupported,markdown-fallback>> | no | Per-component support map (`agents`, `context`, `skills`, `hooks`). |
| `npmPublishable` | bool | no | Whether the target's emitted package is publishable to npm. |
| `pluginRootEnvVar` | string | no | Env var the *host* exposes to point at an installed plugin's root (e.g. `CLAUDE_PLUGIN_ROOT`). |
| `pluginRootEnvVarForExtension` | string | no | Env var a generated *extension* uses to find its own root (e.g. `OMP_PLUGIN_ROOT`). |
| `marketplacePath` | string | no | Repo-relative path to the marketplace manifest if the target uses a marketplace registry. |
| `description` | markdown | no | One-paragraph description. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `targets` | `AgentPlatformImpl` | 1:1 | The platform impl this target binds to. (Existing `targets` edge — extended to accept `PluginTarget` source.) |
| `hosted_by` | `AgentProduct` | N:1 | Mirrors `hostAgent`. Used by every imported example. |
| `emits_artifact` | `PluginArtifact` | 1:N | Inverse of `PluginArtifact.targetId`. The set of artifacts a compiled extension for this target must produce. |
| `pairs_with` | `PortableExtension` | N:N | Records that a `PortableExtension` compiles to this target via the extension-mux. |
| `sourced_from` | `SourceRef` | N:1 | Source-of-truth for the target spec (typically `packages/extension-mux/src/targets/<adapter>.ts`). |

### Evidence

`adapterFamily` and `manifestFormat` are evidence-bound at **vendor-doc-or-better**:
the host's plugin documentation (or a verifiable in-repo target index) is the
authoritative source. `componentSupport.skills`, `componentSupport.agents`, etc. are
descriptive editorial values gated by the default policy.

### Invariants

1. `id` MUST start with `plugin-target:`.
2. `hostAgent` MUST resolve to an `AgentProduct`.
3. `distribution` MUST be non-empty.
4. `scriptVariants` present implies `hookRegistrationFormat` or `commandFormat` is
   also set (a target that emits scripts MUST declare how the host loads them).

### Examples

The 9 imported targets in `graph/extensions/plugin-artifacts/`:
`plugin-target-claude-code.yaml`, `plugin-target-codex.yaml`,
`plugin-target-copilot-cli.yaml`, `plugin-target-cursor.yaml`,
`plugin-target-gemini-cli.yaml`, `plugin-target-omp.yaml`,
`plugin-target-openclaw.yaml`, `plugin-target-opencode.yaml`,
`plugin-target-pi.yaml`.

### Related

- `PluginArtifact` — files a `PluginTarget` emits for an installed extension.
- `AgentPlatformImpl` — the platform impl this target binds to via `targets`.
- `PortableExtension` — single-source extension compiled to multiple targets.
- `NativeExtension` — the per-target compiled output the extension-mux produces.

---

## Examples

```yaml
- id: plugin:react-tdd
  displayName: "React TDD"
  vendor: "a5c-ai"
  homepageUrl: "https://github.com/a5c-ai/plugins/react-tdd"
  installFormats: [npm, marketplace]
  description: |
    A skill bundle that runs a TDD loop for React components, paired with an
    MCP tool server for component-level test discovery.
  edges:
    installs_into:
      - target: agent:claude-code
        installMethod: marketplace
      - target: agent:codex
        installMethod: npm
    contains_skill:
      - target: skill:react-tdd
    contains_tool_server:
      - target: tool-server:react-test-discover
    implements:
      - target: extension-interface:reliability
      - target: extension-interface:reflection
    applies_to:
      - target: specialization:frontend-react
        confidence: primary
    requires_capability:
      - target: capability:supports-mcp
        level: required
      - target: capability:supports-text-streaming
        level: recommended
    sourced_from:
      - target: source-ref:a5c-plugins-react-tdd
```

```yaml
- id: subagent:code-reviewer
  displayName: "Code Reviewer"
  roleId: role:code-reviewer
  systemPrompt: |
    You are a senior code reviewer. Read the diff. Identify correctness,
    security, and performance issues. Quote line numbers. Be concise.
  tools:
    - tool:read-file
    - tool:grep
    - tool:run-static-analysis
  disallowedTools:
    - tool:write-file
    - tool:run-shell
  modelPreference: model:claude-opus-4-7
  triggers: |
    Invoke when the user asks for a review on staged changes, an open PR,
    or a specific commit range.
  description: |
    Read-only reviewer subagent that produces structured review comments.
  edges:
    roles_played_by:
      - target: role:code-reviewer
    applies_to:
      - target: domain:software-engineering
        confidence: primary
    contained_in_plugin:
      - target: plugin:a5c-quality
    implements:
      - target: extension-interface:governance
    requires_capability:
      - target: capability:parallel-tool-calls
        level: recommended
    sourced_from:
      - target: source-ref:a5c-plugins-quality
```

---

## Planning / board surfaces (issue-first product model)

The following NodeKinds extend cluster 7 with the board-first, issue-first product
model surveyed from `packages/agent-mux/webui` (KanbanLayout, dashboard/backlog-overview,
PairDevicePage) and `packages/agent-mux/ui/src/session-flow` (transcript→lane projection,
file-attention, per-segment cost). Each is a derived/projected entity above `Issue` and
`Session` — the canonical store-of-record stays in those NodeKinds; these wrap them for
UI consumption and queryability.

## NodeKind: `Project`

Planning grouping above `Workspace`. An `Issue` belongs to a `Project`; a `Project` may
map to one or more `Workspace`s. Bound optionally to a single `IssueTracker`.

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `project:<slug>`. |
| `displayName` | string | yes | |
| `slug` | string | no | Short kebab-case identifier used in URLs. |
| `description` | markdown | no | |
| `trackerKind` | ref<`IssueTracker`> | no | Originating tracker, when bound to one. |
| `defaultWorkspaceId` | ref<`Workspace`> | no | |
| `archived` | bool | no | |

## NodeKind: `BoardSnapshot`

Point-in-time projection of a kanban board (columns, swimlanes, WIP policy, current
issue placement).

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `board-snapshot:<slug>`. |
| `generatedAt` | iso-timestamp | yes | |
| `columnIds` | list<ref<`BoardColumn`>> | no | |
| `swimlanes` | list<string> | no | Free-form swimlane keys. |
| `wipPolicy` | enum | no | `none` \| `per-column` \| `per-swimlane` \| `per-column-and-swimlane`. |
| `moveValidation` | list<string> | no | Move-validation rule descriptors (UI-enforced). |
| `issueCount` | int | no | |

## NodeKind: `BoardColumn`

A single workflow column on a kanban board.

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `board-column:<slug>`. |
| `displayName` | string | yes | |
| `order` | int | yes | 1-based ordering within its board. |
| `workflowState` | string | no | Tracker-native state this column maps to. |
| `wipLimit` | int | no | Maximum issues allowed (null = no limit). |
| `terminalForCompleted` | bool | no | True for "done" columns. |

## NodeKind: `BacklogSnapshot`

Point-in-time projection of a project backlog with priority ordering, dependency,
decomposition, and acceptance-criteria coverage.

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `backlog-snapshot:<slug>`. |
| `generatedAt` | iso-timestamp | yes | |
| `issueCount` | int | no | |
| `priorityScheme` | enum | no | `int` \| `fibonacci` \| `t-shirt` \| `bucket`. |
| `hasDependencyData` | bool | no | |
| `hasDecompositionData` | bool | no | |
| `hasAcceptanceCriteriaData` | bool | no | |

## NodeKind: `AcceptanceCriterion`

A single checkable predicate that must hold for an issue to be considered done.

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `acceptance-criterion:<slug>`. |
| `text` | markdown | yes | |
| `order` | int | no | |
| `status` | enum | no | `pending` \| `met` \| `not-met` \| `n-a`. |
| `verifiedBy` | enum | no | `human` \| `ci` \| `test` \| `manual` \| `unknown`. |

## NodeKind: `IssueDecomposition`

A parent-issue→child-issue decomposition (one issue split into typed subtasks).

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `issue-decomposition:<slug>`. |
| `strategy` | enum | no | `linear` \| `parallel` \| `phased` \| `exploratory`. |
| `rationale` | markdown | no | |
| `generatedBy` | enum | no | `human` \| `agent` \| `llm` \| `unknown`. |

## NodeKind: `SessionFlowProjection`

A derived projection of a `Session` into agent flow lanes, timeline items, and
per-lane segments suitable for UI visualization.

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `session-flow:<slug>`. |
| `generatedAt` | iso-timestamp | no | |
| `laneCount` | int | no | |
| `segmentKinds` | list<enum> | no | `user`, `assistant`, `thinking`, `tool`, `system`, `lifecycle`, `branch`, `error`. |
| `hasFileAttention` | bool | no | |
| `hasCostBreakdown` | bool | no | |

## NodeKind: `AgentFlowLane`

A single lane within a `SessionFlowProjection` (e.g. agent-action, tool-call,
thinking, human-turn, subagent-call, error). Promoted in catalog pass 39 from inline
projection data to a first-class NodeKind.

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `agent-flow-lane:<slug>`. |
| `displayName` | string | yes | |
| `laneKind` | enum | yes | `agent-action` \| `tool-call` \| `thinking` \| `human-turn` \| `subagent-call` \| `error`. |
| `agentVersionId` | ref<`AgentVersion`> | no | Owner agent for the lane (when applicable). |
| `description` | markdown | no | |

## NodeKind: `AgentFlowSegment`

A single timeline segment within an `AgentFlowLane` — a message, tool-call,
tool-result, thinking block, or error. Optionally projects from a `Span` for
the observability bridge. Promoted in catalog pass 39.

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `agent-flow-segment:<slug>`. |
| `laneId` | ref<`AgentFlowLane`> | yes | |
| `startedAt` | iso-timestamp | no | |
| `endedAt` | iso-timestamp | no | |
| `kind` | enum | yes | `message` \| `tool-call` \| `tool-result` \| `thinking` \| `error`. |
| `parentSpanId` | ref<`Span`> | no | Optional link to the underlying observability span. |
| `description` | markdown | no | |

## NodeKind: `FileAttention`

A record of which files an agent read or wrote during a session.

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `file-attention:<slug>`. |
| `path` | string | yes | |
| `kind` | enum | yes | `read` \| `write` \| `both`. |
| `firstTouchedAt` | iso-timestamp | no | |
| `lastTouchedAt` | iso-timestamp | no | |
| `touchCount` | int | no | |
| `toolNames` | list<string> | no | Names of tools that touched this file. |

## NodeKind: `DevicePair`

A paired remote device (typically mobile) bound to an agent-mux gateway account.

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `device-pair:<slug>`. |
| `deviceKind` | enum | no | `mobile` \| `desktop` \| `tablet` \| `watch` \| `unknown`. |
| `platform` | enum | no | `ios` \| `android` \| `web` \| `desktop` \| `unknown`. |
| `pairingMethod` | enum | no | `qr-code` \| `short-code` \| `deep-link` \| `oauth` \| `unknown`. |
| `pairedAt` | iso-timestamp | no | |
| `pushCapable` | bool | no | |
| `revoked` | bool | no | |

## Related

- [`README.md`](./README.md) — full node-kind catalog and cluster index.
- [`agent-stack.md`](./agent-stack.md) — `AgentProduct` / `AgentVersion` targets of
  `installs_into` and `compiles_to`.
- [`capabilities.md`](./capabilities.md) — `Capability`, `InstallMethod` referenced
  by `requires_capability` and `installs_into`.
- [`../../schema/edge-kinds.md`](../../schema/edge-kinds.md) — edge specs for `installs_into`,
  `compiles_to`, `contains_skill`, `contains_subagent`, `contains_tool_server`,
  `implements`, `applies_to`, `requires_capability`, `sourced_from`.
- [`../../schema/evidence-model.md`](../../schema/evidence-model.md) — evidence-binding rules.

---

## catalog pass 47 — Subagent / Skill / Plugin / ToolDescriptor boundary clarifications

The four NodeKinds in cluster 7-extensions that govern dispatchable / installable
extension surfaces have been clarified as follows:

### Subagent vs Skill — dispatchable worker vs procedural artifact

A **Subagent** is a *dispatchable worker* — an entity invoked by an agent
runtime's dispatch mechanism (claude-code's Task tool, OpenAI Agents SDK
handoff, etc.). A **Skill** is a *procedural artifact* — a directory-of-
markdown describing a workflow.

The two are NOT synonyms. A Subagent CAN run a Skill inside a `ChildSession`
(see the `runs_skill` edge from `ChildSession` to `Skill`). The same Skill
may be loaded by multiple Subagents.

### Subagent.dispatchPattern

Subagent gains a per-instance `dispatchPattern` attribute
(`task-tool` / `handoff` / `sub-agents-array` / `agent-as-tool` /
`slash-command` / `subprocess-task` / `custom`). Most subagents inherit
the runtime default declared on `AgentRuntimeImpl.subagentDispatchMechanism`;
the per-subagent attribute is an explicit override for cases where one
specific subagent uses a different dispatch path.

### Plugin bundling vocabulary

The `contains_*` family is the canonical Plugin → bundled-extension
vocabulary (`contains_skill`, `contains_subagent`, `contains_tool_server`,
`contains_tool_descriptor`, `contains_lsp_server`, `contains_monitor`,
`contains_bin`). Each forward edge has a matching `<thing>_contained_in_plugin`
inverse — see catalog pass 50 in `../edge-kinds.md` for the consolidation note.

### ToolDescriptor → Subagent dispatch edge

When a Subagent is invoked via a specific named tool (e.g. claude-code's
Task tool dispatching the `general-purpose` subagent), the relationship
is captured by `dispatched_via_tool` (Subagent → ToolDescriptor) /
`dispatches_subagent` (ToolDescriptor → Subagent).

## catalog pass 49 addition: babysitter Subagent canonicals

Three representative `Subagent` canonicals authored at
`graph/extensions/subagents/babysitter-subagents.yaml` to satisfy the
catalog pass 47 placeholder in `child-session:babysitter-task-001`:

- `subagent:babysitter-define-task` — generic shape covering any
  user-authored `defineTask(id, impl)` export. Each invocation spawns a
  `kind: 'agent'` subtask in its own subprocess (a `ChildSession` with
  `lifecyclePolicy: persistent`).
- `subagent:babysitter-research-task` — pattern for multi-step research /
  audit subtasks (read-only investigation tools).
- `subagent:babysitter-implementer-task` — pattern for TDD-style
  feature-implementation subtasks (edit / run / test access).

All three carry `provenance: custom`,
`dispatchPattern: subprocess-task`. The canonical ChildSession example
(`graph/lifecycle/child-sessions/canonical-child-sessions.yaml`) now
points at `subagent:babysitter-define-task` instead of the
`subagent:claude-code.general-purpose` placeholder.

## catalog pass 52 — Kanban TaskTag and Label NodeKinds

catalog pass 52 extracts canonical kanban entities from agent-mux's
`packages/agent-mux/core/src/kanban.ts` (real production source).

### TaskTag

#### Purpose

A **`TaskTag`** is a user-defined free-form team-vocabulary tag attached
to an `Issue`, `BoardSnapshot` entry, or other kanban work-item. It is
distinct from `Label` (system / repo-level classification with color);
TaskTags are typically free-form team vocabulary like `tech-debt`,
`needs-design`, `frontend`, or `security-review`, scoped to global,
project, or workspace.

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `task-tag:<slug>`. |
| `displayName` | string | yes | |
| `name` | string | no | Display name (often slug-ified). Mirrors `KanbanTaskTag.label`. |
| `key` | string | no | Slug / stable key (`KanbanTaskTag.key`). |
| `content` | markdown | no | Free-form content/instruction body. |
| `scope` | enum&lt;global, team, project, workspace&gt; | yes | |
| `scopeId` | string | no | When `scope!=global`, the id of the team/project/workspace. |
| `color` | string | no | Optional CSS color/hex. |
| `description` | markdown | no | |
| `order` | int | no | |

#### Invariants

1. `id` MUST start with `task-tag:`.

#### Relationships

- `tagged_with` — incoming from `Issue` (inverse `tags_issue`)
- `scoped_to_team` → `OrgUnit` (only when `scope=team`)
- `scoped_to_project` → `Project` (only when `scope=project`)
- `scoped_to_workspace` → `Workspace` (only when `scope=workspace`)

### Label

#### Purpose

A **`Label`** is a repository or board-scoped classification with color
+ name (parallel to GitHub/GitLab labels). It is distinct from `TaskTag`
(free-form team vocabulary). Labels are typically owned by a `Project`
or repository.

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `label:<slug>`. |
| `displayName` | string | yes | |
| `name` | string | no | Mirrors `KanbanLabel.name`. |
| `color` | string | no | Optional CSS color/hex. |
| `description` | markdown | no | |
| `ownerProjectId` | ref&lt;Project&gt; | no | |

#### Invariants

1. `id` MUST start with `label:`.

#### Relationships

- `labeled_with` — incoming from `Issue` (inverse `labels_issue`)
- `owned_by_project` → `Project` (inverse `owns_label`)

