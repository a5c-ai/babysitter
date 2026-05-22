# Agent dispatching integration design

## Goal

Integrate Agent Mux into Krate as a system-wide agent orchestration capability. Krate should let users define reusable agent stacks, attach tools/skills/MCP/subagents, connect those stacks to triggers, run dispatches on policy-controlled workspaces/runners, and observe each dispatch like a CI pipeline run with live Agent Mux chat/session access.

The canonical resource model for stacks, tools, skills, subagents, trigger rules, dispatch runs, attempts, and work-item/session/workspace links is defined in [Agent stack management spec](./agent-stack-management-spec.md). The route, screen, custom-resource, controller, API, and watch contracts are defined in [UI/UX system spec](./ui-ux-system-spec.md). This document focuses on product surfaces, source-object flows, integration boundaries, and implementation phases.

## Product model

Krate should treat agent work as a graph, not a chat-only surface:

- `AgentStack`: reusable runtime definition such as Claude Code plus model, prompt, tools, MCP servers, skills, subagents, approval mode, runner policy, and write-back policy.
- `AgentTriggerRule`: connects CI events, webhooks, comments, labels, schedules, pushes, tags, repository dispatch, and manual actions to an agent stack.
- `AgentDispatchRun`: CI-like logical run tied to repository/ref/source event, visible beside `Pipeline` and `Job` runs.
- `AgentDispatchAttempt`: concrete execution attempt with Agent Mux run/session IDs, runner placement, context digest, artifacts, and subagent events.
- `WorkItem`: issue, PR task, failed check, flaky-test cluster, release gate, or internal card.
- `Workspace`: repo checkout/worktree with git state, runtime surfaces, lifecycle actions, and linked sessions/runs.
- `ReviewArtifact`: diff/comments/decision output linked to issue, PR, workspace, run, or session.

## Primary user flows

### Define stack and connect trigger

1. Maintainer creates an `AgentStack` such as `claude-code-release-reviewer`.
2. They attach a model, prompt, AGENTS doc, skills, MCP servers, subagents, tool profile, approval policy, runner pool, and write-back policy.
3. Krate validates the stack against Agent Mux adapter capabilities and repository policy.
4. Maintainer creates an `AgentTriggerRule` for failed checks, incoming webhooks, PR comments, `agent:*` labels, or schedules.
5. A dry-run preview shows matched source events, context bundle, selected stack snapshot, dedupe policy, approval behavior, and expected dispatch output.

### Failed CI to agent run

1. `Pipeline` or `Job` transitions to failed.
2. Krate captures workflow/job/step, bounded logs, artifacts, failure signature, PR/ref, runner pool, and source actor.
3. Matching trigger rule creates or links a work item and materializes a context bundle.
4. Krate creates an `AgentDispatchRun` displayed beside pipeline/job runs.
5. Agent Mux starts the adapter session and streams transcript/events back to Krate.
6. Agent output produces diagnosis, patch artifact, subagent reports, or rerun request.
7. Write-back to PR/check/branch/workflow requires policy approval.

### Issue/PR to workspace/session

1. User comments `@agent fix`, applies an `agent:*` label, or manually dispatches from an issue/PR.
2. Krate resolves context labels, source discussion, changed files, linked checks, and repository policy.
3. Krate provisions or links a workspace for the work item.
4. Agent Mux creates a session bound to that workspace and run attempt.
5. The issue/PR/workspace/session pages all show the same linked dispatch state.

### Human follow-up from dispatch run

1. User opens the `AgentDispatchRun` from a PR, pipeline, inbox, workspace, or issue.
2. The run page shows CI metadata, attempts, source refs, runner placement, artifacts, approvals, and subagent tree.
3. The center panel embeds Agent Mux chat/transcript and continuation controls.
4. User can approve/reject actions, continue the session, cancel, retry, resume, fork, link a child issue, or create a review artifact.

### Workspace lifecycle recovery

1. Workspace becomes stale, dirty, behind, missing, or blocked by rebase conflicts.
2. Krate surfaces lifecycle actions: pin, archive, cleanup, recover, rebase start, auto-resolve, open in editor, mark resolved, abort.
3. Actions are policy-checked and tied back to the work item/session/run.
4. Agent or human continuation resumes from the linked Agent Mux session.

## Product surfaces

### Repository code page

- Define/manual-run agent actions from selected paths.
- Attach files or directories to a dispatch context bundle.
- Show active agent workspaces and sessions for the repository.
- Link to stack settings and trigger rules relevant to the repo.

### Pull request page

- Show agent dispatches beside checks and reviews.
- Offer failed-check diagnosis/repair and review-agent actions.
- Show generated review artifacts, patch artifacts, subagent outputs, and approvals.
- Gate comments, reviews, branch updates, reruns, and PR updates through write-back policy.

### Pipeline and job pages

- Show `AgentDispatchRun` rows beside normal pipeline runs.
- Offer `Diagnose failure`, `Attempt repair`, `Find similar failures`, and `Summarize artifacts` actions.
- Preload failed job/step/log/artifact/failure-signature context.

### Issue/work board pages

- Show board columns, WIP/policy signals, dependencies, decomposition, acceptance criteria, dispatch readiness, and linked sessions/workspaces.
- Allow issue-to-workspace creation/linking and issue-to-session/run linking.
- Show context labels and rendered execution context.

### Workspace pages

- Inventory all active/idle/archived/missing workspaces.
- Show git state, branch, head, dirty state, notes, runtime preview, terminal/dev-server surfaces, sessions, runs, review state, and ownership.
- Provide lifecycle actions with audit and policy checks.

### Agent run page

A dispatch run page should feel like a CI run plus an Agent Mux session:

- Header: repo/ref/source, stack, task kind, status, runner, workspace, cost, approval state.
- Left panel: work item, PR/issue/check context, context labels, files/logs/artifacts.
- Center panel: Agent Mux transcript/chat with continuation composer.
- Right panel: attempts, subagents, tools/MCP/skills, runtime surfaces, artifacts, approvals, write-back controls.

### Inbox and approvals

- Pending tool approvals, write-back approvals, prompt/plan approvals, rebase conflicts, failed dispatches, and webhook/rule failures.
- Each item links to source object, stack snapshot, context preview, Agent Mux session, and policy reason.

### Agent settings

- Manage `AgentStack`, `AgentSubagent`, `AgentToolProfile`, `AgentMcpServer`, `AgentSkill`, context labels, and `AgentTriggerRule` resources.
- Show adapter capability matrix from Agent Mux.
- Support trigger dry-runs with sample CI/webhook/comment events.

## Agent Mux integration boundary

Krate owns:

- repository, issue, PR, CI, webhook, runner, workspace, policy, approval, artifact, and audit resources;
- trigger evaluation, dedupe, context assembly, source-object linking, and write-back decisions;
- display of dispatches as CI-like runs.

Agent Mux owns:

- adapter-specific run/session execution;
- transcript/event streaming;
- chat continuation and cancellation primitives;
- adapter capabilities, config schemas, MCP/plugin surfaces, and runtime projections;
- session parsing and native runtime behavior.

Adapter module proposal:

- `src/agent-mux-client.js`

Responsibilities:

- validate stack launch options against Agent Mux capabilities;
- start run/session;
- list active sessions/runs by workspace/source object;
- stream event log or proxy SSE/WebSocket;
- cancel, resume, fork, or continue when supported;
- submit approval/continuation input;
- fetch transcript summary and runtime surfaces;
- attach Agent Mux run/session IDs to `AgentDispatchAttempt` status.

## Future Krate paths

### Domain and controller

- `src/resource-model.js`: add agent stack, trigger, dispatch, attempt, context, workspace/session-link, approval, skill/tool/MCP definitions.
- `src/hooks-events.js`: normalize webhook, CI, issue, PR, label, comment, push, tag, schedule, and repository-dispatch events.
- `src/agent-trigger-rules.js`: evaluate triggers, lifecycle, dry-run, dedupe, and concurrency.
- `src/agent-context-bundles.js`: assemble bounded/redacted repo, issue, PR, CI, artifact, tool, skill, and context-label context.
- `src/agent-mux-client.js`: call Agent Mux gateway/client.
- `src/agent-dispatch-runs.js`: reconcile Krate dispatch resources with Agent Mux sessions/runs.
- `src/runners-ci.js`: place dispatch attempts on runner pools or configured external Agent Mux execution.
- `src/controller-ui.js`: project agent stack and dispatch graph into UI view models.

### Next.js app surfaces

- `apps/web/app/agents/page.jsx`
- `apps/web/app/agents/stacks/page.jsx`
- `apps/web/app/agents/runs/page.jsx`
- `apps/web/app/agents/rules/page.jsx`
- `apps/web/app/agents/tools/page.jsx`
- `apps/web/app/agents/mcp/page.jsx`
- `apps/web/app/agents/skills/page.jsx`
- `apps/web/app/orgs/[org]/repositories/[repo]/agents/page.jsx`
- `apps/web/app/orgs/[org]/repositories/[repo]/agents/[run]/page.jsx`
- `apps/web/app/orgs/[org]/repositories/[repo]/workspaces/page.jsx`
- Existing PR, issue, code, pipeline, hook, runner, inbox, and settings pages should project agent state inline.

## Security and policy requirements

- All trigger rules are explicit resources with lifecycle states: draft, active, paused, disabled, archived.
- Incoming webhooks create durable delivery records before rule evaluation.
- Context labels, skills, MCP servers, tools, and subagents must be visible in prompt/context preview.
- Fork/untrusted refs must use untrusted runner pools and receive no privileged secrets.
- Labels cannot inject secrets, raw launch commands, or hidden environment variables.
- PR comments, branch updates, review submissions, check reruns, secret/network access, and release actions require explicit policy and approval.
- Every dispatch records source event, rule, stack snapshot, context digest, prompt hash, tools/MCP/skills/subagents, runner, workspace, Agent Mux IDs, artifacts, approvals, and write-back decisions.

## MVP vertical slice contracts

The first implementation should prove one complete path instead of many partial pages.

### Slice 1: Agent stack registry

- Add read/write `AgentStack`, `AgentToolProfile`, `AgentMcpServer`, and `AgentSkill` resources.
- Resolve Agent Mux adapter capabilities and expose `Ready`/not-ready conditions.
- Show a GitHub-like settings page at `/orgs/[org]/repositories/[repo]/settings/agents` with YAML preview and policy errors.

### Slice 2: Manual dispatch from repository context

- Add a dispatch composer to `/orgs/[org]/repositories/[repo]/code`, PR detail, issue detail, and pipeline detail.
- Require selected stack, task kind, prompt, source refs, context labels, and workspace policy.
- Create durable `AgentDispatchRun`, `AgentDispatchAttempt`, and `AgentContextBundle` before calling Agent Mux.

### Slice 3: CI-like run projection

- List agent dispatches beside pipelines/jobs with status, branch/ref, actor, runner, duration, stack, and source event.
- Support cancel, retry, resume, and continue only when the adapter capability and policy allow them.
- Preserve legacy/deep links by redirecting to the canonical dispatch page.

### Slice 4: Agent Mux chat and observability embed

- Bind Agent Mux run/session IDs to the attempt status.
- Embed transcript, continuation composer, event timeline, tool/subagent tree, runtime links, and artifact shortcuts.
- Treat stream reconnect, pending handoff, missing workspace, and approval-blocked as first-class states.

### Slice 5: Basic approvals and write-back

- Create `AgentApproval` for shell/tool/network/secret/write-back/rebase/release gates.
- Keep the run blocked until a decision is recorded.
- Apply PR comments, check reruns, branch pushes, issue comments, and review submissions only through approved write-back actions.

## Implementation phases

### Phase 1: docs and architecture only

Current phase. Specs only; no resource/controller/UI implementation.

### Phase 2: read-only graph projection

Project agent stack/dispatch/workspace concepts into UI with mock-free empty states and source-object affordance slots.

### Phase 3: stack registry MVP

Add `AgentStack`, `AgentToolProfile`, `AgentMcpServer`, `AgentSkill`, and adapter capability projection.

### Phase 4: manual dispatch MVP

Create `AgentDispatchRun` and `AgentDispatchAttempt` from repository/PR/pipeline/manual action and link to Agent Mux session.

### Phase 5: live run/session page

Embed Agent Mux transcript/events and runtime state into a Krate CI-like dispatch run page.

### Phase 6: trigger management

Add CI/webhook/comment/label/schedule trigger rules, dry-run, dedupe, lifecycle, and execution summaries.

### Phase 7: work item/session/workspace graph

Add work item links, workspace lifecycle actions, review artifacts, subagent tree, and inbox approvals.

### Phase 8: production hardening

Add runner placement, secrets policy, audit, metrics, artifact retention, retries, repair/resume, and write-back gates at production scale.

## Non-goals for first implementation

- Do not copy the full Agent Mux web UI into Krate.
- Do not hide Agent Mux sessions behind opaque CI logs.
- Do not make labels auto-dispatch by default.
- Do not allow hidden prompt injection from labels, skills, or MCP config.
- Do not run untrusted repository code on privileged runners.
- Do not make Agent Mux storage the source of truth for Krate repository objects.
- Do not let agents publish release artifacts without a privileged human approval path.

