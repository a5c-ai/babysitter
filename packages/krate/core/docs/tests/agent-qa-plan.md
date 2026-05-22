# Agent QA plan

## Scope

Agent QA covers future agent orchestration functionality:

- agent stacks, tools, MCP servers, skills, subagents;
- triggers from CI, webhooks, issues, PRs, labels, mentions, schedules, and manual UI;
- Agent Mux run/session/chat integration;
- dispatches displayed as CI-like runs;
- context assembly, labels, memory, redaction, and snapshots;
- company brain memory and `.a5c` run imports;
- approvals, artifacts, write-back, and audit;
- org-scoped RBAC, secrets, config, service accounts, and runner placement.

## Required suites

| Suite | Tests |
| --- | --- |
| Stack schema | stack/tool/MCP/skill/subagent resource validation and readiness conditions. |
| Permission review | RBAC, secret/config grants, memory grants, missing capability explanations. |
| Context assembly | prompt layers, source provenance, labels, redaction, digest snapshots. |
| Dispatch lifecycle | create run/attempt, Agent Mux handoff, event stream, cancel/resume/retry. |
| Trigger rules | dry-run, dedupe, coalesce, branch/source filters, trusted/untrusted refs. |
| Agent Mux adapter | launch payload, capability discovery, session binding, transcript events. |
| Memory | query, historical refs, tool access, snapshot reuse, stale warnings. |
| Run import | `MEMORY.md`, sessions, `.a5c` journals/tasks/artifacts, redaction, PR review. |
| Write-back | patch/comment/check/review artifacts, approval, idempotency, rollback. |
| UI | dispatch composer, run detail/chat, memory dashboard, imports, approvals. |

## Critical negative tests

- stack references tool without required Secret grant;
- skill requires ConfigMap not granted;
- agent on fork tries to access trusted secrets;
- trigger label tries to grant permission;
- context label tries to hide instructions from preview;
- Agent Mux session ID belongs to another org/run;
- memory tool reads outside pinned snapshot;
- `.a5c` import contains secret-like content;
- write-back tries to mutate unapproved target;
- subagent requests parent-only capability.

## Browser journeys

- manual dispatch from Code page with memory preview;
- failed CI repair from Runs page;
- issue mention dispatch with linked workspace/session;
- run detail chat/session with event timeline;
- memory import review and approval;
- permission wizard fixes missing secret/config/memory grant;
- trigger rule dry-run preview.

## Done criteria

Agent functionality is not production-ready until:

- unit/integration/API tests cover resource and controller logic;
- browser tests cover the primary user journeys;
- cross-org and no-secret negative tests pass;
- Agent Mux fake/session tests pass;
- memory snapshot and import fixtures pass;
- audit/events can explain every dispatch and write-back.
