# Agent CI orchestration spec

## Purpose

CI is one source of agent work in the broader Krate agent orchestration model. Failed checks, pipeline events, flaky-test clusters, release gates, and artifact reviews should select a configured `AgentStack` and create an `AgentDispatchRun` that appears beside normal `Pipeline` and `Job` records.

The canonical stack/resource model lives in [Agent stack management spec](./agent-stack-management-spec.md). This document defines the CI-specific trigger, context, runner, and acceptance requirements.

## Primary CI use cases

### Failed PR check diagnosis

1. A `Pipeline` or `Job` fails for a PR.
2. Krate extracts the failed job, step, log window, failure signature, artifacts, changed files, branch, commit SHA, and related PR discussion.
3. The PR check panel offers `Diagnose with agent`.
4. A trigger rule or manual action selects an `AgentStack` such as `claude-code-ci-diagnoser`.
5. The agent receives a bounded context bundle with logs, artifacts, diff context, repo policy, and requested output format.
6. The agent returns a diagnosis, likely fix paths, subagent findings, and optional patch artifact.

### Failed PR check repair

1. A maintainer chooses `Attempt repair` from a failed check or comments `@agent fix failing check`.
2. Krate creates an `AgentDispatchRun` linked to the failed `Pipeline`, `Job`, PR, and commit SHA.
3. The run is scheduled on a runner pool compatible with the PR trust tier.
4. The selected stack may invoke subagents such as diagnoser, test-fixer, reviewer, or validator.
5. The agent produces a patch artifact, branch proposal, suggested diff, or PR update request.
6. Krate requires approval before pushing commits, updating the PR, submitting a review, or rerunning privileged workflows.

### Flaky test triage

1. Krate groups recent failures by `failure.signature`, job metadata, test names, and affected paths.
2. A scheduled or manual trigger runs a triage stack against failed and passing runs.
3. The agent summarizes suspected flake source, affected tests, owners, confidence, and recommended next actions.
4. Krate writes findings to an issue/work item/saved triage view only when policy allows.

### Release gate review

1. Develop, staging, main, or tag publish workflows produce chart, image, UI, package-validation, checksum artifacts, and branch deployments where configured.
2. A release-review stack inspects artifact completeness, checksum consistency, package/chart/image version alignment, release note gaps, and deployment policy.
3. The agent cannot publish directly; it produces a release-readiness report unless a privileged approval path is configured.

## CI signals agents need

Agents should not scrape CI pages. Krate should pass structured context from its own resources and artifacts.

Required context bundle fields:

- `repository`: name, default branch, clone URL, visibility, trust tier;
- `ref`: branch, commit SHA, PR head/base, fork status;
- `source`: failed check, manual, PR comment, issue comment, label, scheduled scan, webhook;
- `actor`: user, bot, team, permission decision;
- `pullRequest`: title, body, labels, changed files, review state, mergeability;
- `pipeline`: workflow name, run ID, status, conclusion, check name, URL;
- `job`: job ID, step name, exit code, runner pool, image, duration;
- `logs`: bounded log excerpts with redaction status;
- `artifacts`: artifact names, types, URLs, digests, retention;
- `failure`: signature, stack trace, test names, file paths, similar runs;
- `stack`: selected `AgentStack`, tool profile, MCP servers, skills, subagents, approval mode;
- `policy`: allowed tools, write-back mode, approval mode, network/secret restrictions;
- `identity`: runtime ServiceAccount, runner ServiceAccount, native roles, Secret grants, and ConfigMap grants;
- `contextLabels`: selected prompt fragments and provenance.

## CI trigger contracts

### Failed check trigger

- Input: `Pipeline` or `Job` status transitions to failed.
- Match keys: repository, PR, workflow, job, step, branch, path filters, failure signature.
- Dedupe key: repository + PR/check source + commit SHA + job + step + failure signature + rule.
- Default action: create a diagnosis suggestion; auto-run only if repository policy enables it.
- Required context: failed log excerpt, job metadata, changed files, artifacts, similar failures.

### Check rerun trigger

- Input: rerun requested by human, rule, or approved agent output.
- Match keys: previous dispatch run, target pipeline/job/step, actor, approval record.
- Dedupe key: original run + approved artifact digest + target check.
- Default action: create a new `Pipeline` resource or external workflow rerun and link it back to the agent dispatch.

### Release trigger

- Input: tag push, main publish workflow, or release-candidate schedule.
- Match keys: version, chart package, npm artifact, image tag, checksum artifact, release branch.
- Dedupe key: version + commit SHA + artifact digest set.
- Default action: produce a release-readiness report and approval item for privileged publishing gaps.

### Flaky triage trigger

- Input: scheduled scan or repeated failure signature threshold.
- Match keys: failure signature, job name, test name, branch, path, owner, time window.
- Dedupe key: signature + query digest + result set digest.
- Default action: summarize, create/update work item, and optionally dispatch repair after approval.

## Runner and execution requirements

- Agent dispatch attempts must schedule through `RunnerPool` policy or an explicitly configured external Agent Mux gateway.
- Fork PRs and untrusted refs must use untrusted pools and receive no privileged secrets.
- Trusted agents may receive scoped secrets only through runner policy and only for approved task kinds.
- Runner pods must use a policy-selected Kubernetes ServiceAccount, and untrusted/forked refs must not receive privileged ServiceAccounts.
- CI-triggered agents must validate `AgentSecretGrant`, `AgentConfigGrant`, and native RBAC before launch.
- Tool, MCP, skill, and model-provider Secret/ConfigMap requirements must be shown in the run context snapshot.
- Agent workspaces must be isolated per dispatch attempt and bound to repository/ref/pipeline identity.
- Long-running sessions must publish queue, start, heartbeat, token/cost, subagent, artifact, approval, and terminal events.
- Cancelling an `AgentDispatchRun` must cancel the active Agent Mux run/session and mark the current attempt cancelled.
- Rerun-from-step or rerun-after-fix must create new `Pipeline` resources or external workflow attempts and link them to the agent dispatch.

## Approval and write-back requirements

- Diagnosis summaries can be posted automatically only when repository policy allows bot comments.
- Pushing commits, updating PR branches, opening PRs, approving reviews, rerunning privileged workflows, publishing release artifacts, or accessing privileged MCP/tool/secret/network capabilities must require explicit approval unless a repository admin configures a narrower exception.
- Every write-back records actor, approving user, trigger rule, agent stack snapshot, dispatch attempt, context bundle digest, prompt hash, artifact digest, and target object.
- Approval UI must show assembled prompt, context labels, stack/tools/MCP/skills/subagents, runner pool, runtime ServiceAccount, runner ServiceAccount, requested Secret/ConfigMap access, requested action, and target branch/PR/check.

## Chat and run view requirements

The run detail page should feel like a CI check page plus an Agent Mux transcript.

Recommended layout:

- Header: repository, source object, task kind, status, agent stack, runner pool, runtime ServiceAccount, runner ServiceAccount, linked check, branch/SHA, approval state.
- Left panel: PR/check context, failed step, changed files, labels, context labels, logs, artifacts.
- Center panel: Agent Mux transcript and live event stream.
- Right panel: attempts, queue timing, runner pod/job, ServiceAccounts, native RBAC, tools/actions, MCP servers, skills, Secret/ConfigMap grants, subagents, approvals, artifacts, write-back controls.
- Footer/composer: continuation prompt, attach more context, approve/reject action, cancel/retry/resume/fork when supported.

## Observability requirements

- Metrics: queued dispatches, wait latency, duration, cancellation count, approval wait time, token/cost estimate, subagent count, write-back count, failed dispatches, dedupe drops.
- Events: trigger matched, dispatch skipped, context assembled, approval requested, run queued, run started, subagent started/completed, artifact produced, write-back requested, write-back completed.
- Logs: Agent Mux gateway calls, runner scheduling decisions, ServiceAccount selection, RBAC admission decisions, Secret/ConfigMap grant decisions, context redaction decisions, webhook/CI event correlation IDs, MCP health checks.

## Acceptance criteria

- A failed PR check can create a linked agent diagnosis run with bounded logs, artifact references, and selected `AgentStack` snapshot.
- A maintainer can dispatch an agent from a PR comment or label and see resolved prompt/context/tools/subagents before privileged work starts.
- Fork PR agent runs are forced onto untrusted runner pools, unprivileged ServiceAccounts, and cannot receive privileged secrets.
- A repair attempt can produce a patch artifact without automatically pushing it.
- A human approval can convert an approved patch artifact into a branch update, PR comment, review, or workflow rerun.
- Agent run detail streams transcript/events and links back to source PR, check, pipeline, job, workspace, session, and artifacts.
- Repeated CI failures are deduped by source object, commit SHA, failed job/step, failure signature, context digest, and rule.
