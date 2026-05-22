# Agent workspace lifecycle spec

## Purpose

Agent workspaces connect repository state, issue/PR work, Agent Mux sessions, runtime previews, and write-back artifacts. This document defines workspace lifecycle and associations in Krate while preserving repository-native navigation.

## Workspace resource model

`AgentWorkspace` represents a git worktree or workspace projection.

Important fields:

- repository;
- workspace path or external workspace ID;
- branch/ref/SHA;
- ownership: host, project, issue, PR, dispatch run;
- trust tier;
- runtime ServiceAccount;
- runner pool;
- active sessions;
- active dispatch runs;
- git status;
- runtime surfaces;
- lifecycle state;
- retention/cleanup policy.

## Workspace ownership

Ownership sources:

- repository host workspace;
- issue-created workspace;
- PR repair workspace;
- pipeline failure workspace;
- manual dispatch workspace;
- project/board workspace.

Ownership must be visible from both workspace page and source object page.

## Associations

| Link | Meaning |
| --- | --- |
| `WorkItemWorkspaceLink` | issue/work item owns or references workspace |
| `WorkItemSessionLink` | issue/work item has active agent chat/session |
| `AgentDispatchRun.spec.workspaceRef` | run used a workspace |
| `AgentSession.status.workspaceRef` | chat/session attached to workspace |
| `AgentArtifact.spec.workspaceRef` | artifact was produced from workspace state |

## Lifecycle actions

Actions:

- provision;
- link existing;
- pin;
- unpin;
- archive;
- cleanup;
- recover;
- notes-save;
- rebase-start;
- rebase-auto-resolve;
- rebase-open-in-editor;
- rebase-mark-resolved;
- rebase-abort.

Each action should be an API action that writes a resource/action record and is audited.

## Git state

Workspace status should include:

- branch;
- head SHA;
- tracking branch;
- ahead/behind;
- dirty state;
- uncommitted count;
- conflicting files;
- rebase status;
- last activity time;
- missing path state;
- editor link where safe.

## Runtime surfaces

Runtime surfaces may include:

- preview URL;
- dev server URL;
- terminal/session status;
- logs;
- health probe;
- port forwards;
- MCP/runtime state.

These are metadata and links; sensitive tokens must not be exposed.

## Trust and isolation

- Untrusted/forked refs require isolated workspace and unprivileged ServiceAccount.
- Trusted branch workspaces may use broader caches/secrets only through policy.
- Workspace reuse must check repository/ref/trust compatibility.
- Cleanup must not delete user-managed paths outside the workspace root.
- Missing workspace path should not delete records automatically; user can recover/archive/cleanup.

## UI surfaces

### Repository Code

- show active workspace for branch/path;
- create workspace for dispatch;
- open session/runtime links.

### Issues and PRs

- show linked workspace/session/run/artifacts;
- create workspace from issue/PR;
- show rebase/conflict state before write-back.

### Run detail

- show workspace card with git/runtime state;
- link artifacts to workspace diff;
- show workspace missing/rebase states.

### Global workspaces

- inventory by repository, status, owner, last activity, trust tier;
- attention mode for missing, dirty, conflicted, approval-blocked, archived.

## Controller behavior

Future file:

- `src/agent-workspace-controller.js`

Responsibilities:

- provision/link workspaces;
- validate workspace policy and trust tier;
- inventory git/runtime status;
- handle lifecycle actions;
- maintain association links;
- publish watch events for UI;
- prevent unsafe cleanup/deletion.

## Failure modes

| Failure | Behavior |
| --- | --- |
| path missing | mark missing and offer recover/archive/cleanup |
| dirty workspace | block unsafe cleanup and write-back until reviewed |
| rebase conflict | show conflict files and rebase actions |
| runtime unavailable | keep workspace usable and show runtime degraded |
| workspace belongs to different trust tier | block reuse |
| cleanup outside root | deny and audit policy violation |

## Acceptance criteria

- Issue/PR/run/session/workspace associations are visible from every related page.
- Workspace lifecycle actions are policy-checked and audited.
- Missing/rebase/dirty states block unsafe write-back with clear UI reasons.
- Untrusted work never reuses trusted workspaces.
- Workspace records survive controller restarts and can recover from missing paths.