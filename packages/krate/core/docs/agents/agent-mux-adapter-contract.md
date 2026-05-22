# Agent Mux adapter contract spec

## Purpose

Krate should integrate Agent Mux without copying its whole UI or owning adapter internals. This document defines the boundary between Krate controllers and Agent Mux gateway/session/runtime capabilities.

## Ownership split

| Concern | Krate | Agent Mux |
| --- | --- | --- |
| Repository graph | source of truth | receives context only |
| Agent stack policy | source of truth | validates adapter-specific launch options |
| RBAC/Secret/Config grants | source of truth | receives admitted references only |
| Runner/workspace policy | source of truth | may use provided cwd/runtime metadata |
| Session/chat transcript | projection/link | source of truth |
| Tool/runtime events | normalizes into run events | source of truth |
| Cancellation/resume/fork/continue | policy gate and audit | execution primitive |
| Subagents | stack definitions and telemetry projection | native or emulated dispatch mechanism |

## Required client module

Future file:

- `src/agent-mux-client.js`

Responsibilities:

- discover adapter capabilities;
- validate launch options before dispatch;
- launch a run/session;
- bind Agent Mux run/session IDs to `AgentDispatchAttempt`;
- subscribe to events/transcript updates;
- submit continuation messages;
- cancel, retry, resume, or fork where supported;
- forward approved tool/secret/network decisions;
- normalize runtime surfaces into Krate event/artifact/workspace projections.

The module should be a thin adapter. It should not contain repository policy, RBAC decisions, trigger matching, or write-back logic.

## Capability handshake

Krate should request capabilities for:

- supported base agents;
- models/providers;
- session persistence;
- structured event stream;
- continuation/cancel/resume/fork support;
- approval modes;
- native tools;
- MCP support;
- skill loading;
- subagent dispatch;
- workspace/cwd support;
- transcript export;
- cost/token reporting.

Capability result should be snapshotted into `AgentStack.status.capabilities` and `AgentDispatchAttempt.spec.agentStackSnapshot`.

## Launch request contract

Krate sends only admitted, redacted launch options:

```json
{
  "agent": "claude-code",
  "adapter": "agent-mux.claude-code",
  "model": "claude-sonnet-4-5",
  "approvalMode": "prompt",
  "prompt": {
    "system": "...",
    "developer": "...",
    "task": "..."
  },
  "cwd": "/workspaces/krate-pr-42",
  "contextBundle": {
    "digest": "sha256:...",
    "attachments": []
  },
  "tools": [],
  "mcpServers": [],
  "skills": [],
  "subagents": [],
  "runtimeIdentity": {
    "serviceAccountRef": "agent-claude-code-ci-repair"
  },
  "secretRefs": [
    {
      "grant": "claude-code-anthropic-api-key",
      "secretRef": "krate-secrets/anthropic-provider",
      "keys": ["api-key"],
      "mountPolicy": "env"
    }
  ],
  "configRefs": [],
  "metadata": {
    "krateDispatchRun": "adr-01hx",
    "krateAttempt": "ada-01hx-1",
    "repository": "krate",
    "sourceRef": "pullrequest/42"
  }
}
```

Secret values are never in the request body unless the Agent Mux deployment mode explicitly requires value materialization inside a trusted server-side process; even then values must not pass through browser/UI APIs.

## Launch response contract

```json
{
  "agentMuxRunId": "run_01hx",
  "agentMuxSessionId": "ses_01hx",
  "status": "running",
  "eventCursor": "0000001",
  "capabilitiesSnapshotDigest": "sha256:..."
}
```

Krate persists these IDs in `AgentDispatchAttempt.status` and renders links into run/session pages.

## Event normalization

Agent Mux events should map into Krate event types:

| Agent Mux event | Krate projection |
| --- | --- |
| run queued/started | attempt phase, queue timing |
| session created | `AgentSession` link and `AgentMuxSessionBound=True` |
| assistant/user message | transcript projection only |
| tool call started/completed | event timeline and optional `AgentApproval` |
| subagent started/completed | child subagent lane/event/artifact |
| file changed/patch produced | `AgentArtifact` |
| runtime preview/dev server | `AgentWorkspace.status.runtime` |
| approval requested | `AgentApproval` |
| cost/tokens | `AgentDispatchRun.status.cost` |
| terminal result | attempt/run terminal phase |

## Error handling

| Error | Krate behavior |
| --- | --- |
| gateway unavailable | keep attempt queued/starting with retry condition. |
| capability unavailable | stack `CapabilitiesResolved=False`. |
| launch rejected | fail attempt with adapter rejection and snapshot request digest. |
| session binding missing | show pending handoff and retry binding. |
| event stream disconnect | mark stream stale and reconnect from cursor when possible. |
| unsupported action | disable action based on capability, not UI-only logic. |

## Security requirements

- Agent Mux receives only resources admitted by Krate policy.
- Krate stores Agent Mux IDs but does not treat Agent Mux storage as repository source of truth.
- Continuation messages must run permission review if they request new tools, files, secrets, configs, or write-back targets.
- Agent Mux transcript must not expose Secret values.
- Agent Mux approval prompts must map back to `AgentApproval` for audit when they affect Krate-owned actions.

## UI embedding

Krate should embed Agent Mux primitives as panels:

- transcript/conversation panel;
- event/observability timeline;
- runtime/workspace panel;
- approval/tool activity panel;
- subagent tree/lane panel.

Krate navigation, breadcrumbs, permissions, and source-object hierarchy remain native Krate UI.