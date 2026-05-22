# Agent tools, MCP, and skills spec

## Purpose

This document defines how Krate should manage native tools, MCP servers, and skills as first-class system capabilities. Tools, MCP servers, and skills are not just UI settings; they affect launch options, permission review, Secret/ConfigMap requirements, audit, and dispatch readiness.

## Resource ownership

| Capability | Resource | Scope |
| --- | --- | --- |
| Native tools and shell/filesystem/network policy | `AgentToolProfile` | stack/repository/org |
| MCP server endpoint and discovered tools | `AgentMcpServer` | global/org/repository/stack |
| Reusable runbook or prompt/tool bundle | `AgentSkill` | global/org/repository/stack |
| Required roles/secrets/configs | `AgentCapabilityRequirement` | computed per stack/capability |
| Secret access | `AgentSecretGrant` | subject + purpose + source scope |
| Config access | `AgentConfigGrant` | subject + purpose + source scope |

## `AgentToolProfile`

Tool profiles should describe categories, not raw prompt text.

Required concerns:

- native tool enablement: shell, filesystem, browser, code search, git, test runner, package manager;
- filesystem scope: no-fs, read-only, repo-write, workspace-write;
- network scope: deny, allowlist, repository-host-only, unrestricted-with-approval;
- command allow/deny lists;
- approval policy by tool class;
- required roles;
- required Secret/ConfigMap refs;
- audit level.

Readiness checks:

- command deny patterns compile;
- filesystem policy compatible with runner trust tier;
- network policy compatible with repository policy;
- required roles admitted;
- required Secret/ConfigMap grants admitted;
- adapter supports requested native tools.

## `AgentMcpServer`

MCP servers should be managed as runtime dependencies with health and permission state.

Required concerns:

- transport: stdio, SSE, streamable HTTP;
- command/args or URL;
- env refs and header refs;
- Secret/ConfigMap refs;
- discovered tools and schemas;
- allowed stacks/orgs/[org]/repositories;
- network policy;
- approval policy;
- health and last probe.

MCP health states:

- `Unknown`: not probed yet;
- `Ready`: reachable and schema discovered;
- `Degraded`: reachable but some tools unavailable;
- `Denied`: policy/RBAC/grant blocked;
- `Failed`: probe failed;
- `Disabled`: lifecycle disabled.

## `AgentSkill`

Skills should behave like reusable capability bundles.

Skill fields:

- description and owner;
- source format: file, directory, package, inline;
- source ref and version;
- prompt fragment;
- required tools;
- required MCP servers;
- required Secret/ConfigMap refs;
- compatible base agents/adapters;
- task kinds;
- output contract;
- validation status.

Skill validation:

1. Source exists and version resolves.
2. Prompt fragment passes policy checks.
3. Required tools/MCP servers exist and are admitted.
4. Required Secret/ConfigMap grants exist for selected stack identity.
5. Output contract is compatible with task kind and UI projection.

## Capability requirement graph

Every stack should have a computed dependency graph:

```text
AgentStack
  -> AgentToolProfile
    -> required roles/secrets/configs
  -> AgentMcpServer
    -> transport/network/secrets/configs/discovered tools
  -> AgentSkill
    -> prompt fragment/tools/MCP/secrets/configs/output contract
  -> AgentSubagent
    -> tool subset/skill subset/MCP subset
```

The graph should produce `AgentCapabilityRequirement` records and UI warnings.

## UI requirements

### Tools page

- list tool profiles;
- show allowed/denied commands;
- show filesystem/network policy;
- show consuming stacks;
- show required grants and missing grants;
- preview launch impact.

### MCP page

- list servers and health;
- show discovered tools;
- show Secret/ConfigMap refs without values;
- show allowed stacks and denied stacks;
- run probe/dry-run when authorized.

### Skills page

- list skills by task kind;
- show prompt fragment preview;
- show required tools/MCP/secrets/configs;
- show consuming stacks;
- show validation errors and output contract.

### Stack builder integration

The stack builder must show tools/MCP/skills as dependency cards with:

- readiness;
- missing roles/secrets/configs;
- adapter support;
- approval requirements;
- launch option preview;
- audit level.

## Dispatch-time behavior

At dispatch launch:

1. Expand selected tools, MCP servers, and skills.
2. Re-run permission review.
3. Materialize only admitted launch options.
4. Snapshot dependency graph digest.
5. Send admitted tool/MCP/skill configuration to Agent Mux.
6. Record tool/MCP/skill versions in attempt status.

## Security rules

- A skill cannot grant tools, roles, secrets, configs, or approval mode by prompt text.
- MCP server command/env/header refs must use grants and policy.
- Shell tools default to approval for privileged commands.
- Network access defaults to deny or allowlist.
- Tool output containing suspected secrets must be redacted before transcript/artifact persistence.

## Acceptance criteria

- A stack cannot dispatch with a tool requiring an ungranted Secret.
- MCP health and discovered tools are visible before dispatch.
- Skills show required tools/MCP/secrets/configs and output contract.
- Tool/MCP/skill launch options are snapshotted into dispatch attempts.
- UI can explain exactly why a capability is disabled or approval-gated.

## Company brain memory tools

Memory tools are normal tool capabilities and require the same stack admission, permission review, audit, and Agent Mux launch gating as other tools.

| Tool | Purpose | Required grant |
| --- | --- | --- |
| `memory.graph.search` | search graph records by text, kind, edge, owner, repo, stack, or association | memory query grant for allowed kinds/paths. |
| `memory.record.read` | read a graph or Markdown record by ID/path at the dispatch memory ref | memory read grant. |
| `memory.docs.grep` | grep allowed free-form Markdown paths at the pinned commit | memory grep grant. |
| `memory.snapshot.diff` | compare pinned memory with current or another ref | memory diff grant. |
| `memory.update.propose` | create a proposed memory patch artifact | memory propose-update grant. |
| `memory.ontology.validate` | validate proposed graph/frontmatter changes | memory validation grant. |

Tools default to the dispatch `AgentMemorySnapshot`. Accessing current memory from a historical-memory run requires explicit refresh or approval so agents cannot silently escape the pinned context.
