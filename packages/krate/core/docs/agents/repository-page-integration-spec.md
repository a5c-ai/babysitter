# Agent repository page integration spec

## Purpose

Agent orchestration should feel native to Krate's GitHub-like repository experience. This document maps agent capabilities into the current repository routes and `ui-shell.jsx` page patterns.

Current routes:

- `/orgs/[org]/repositories/[repo]/code`
- `/orgs/[org]/repositories/[repo]/issues`
- `/orgs/[org]/repositories/[repo]/pull-requests`
- `/orgs/[org]/repositories/[repo]/runs`
- `/orgs/[org]/repositories/[repo]/hooks`
- `/orgs/[org]/repositories/[repo]/settings`

Future agent-specific repository settings should extend this hierarchy, not replace it.

## Shared repository affordances

Every repository page should be able to show:

- active agent runs for the repository;
- pending approvals related to the repository;
- missing permission warnings for enabled stacks;
- linked workspaces/sessions;
- dispatch composer entry point when policy allows;
- watch stream link for relevant resource type;
- breadcrumbs back to repository and source object.

These should be added to the controller UI model as repository-scoped agent affordances so server components do not invent local state.

## Code page

Route: `/orgs/[org]/repositories/[repo]/code`

Current role:

- browse files;
- choose branch/path;
- copy clone/open code commands;
- inspect repository plan.

Agent additions:

- `Dispatch agent` button scoped to selected path/ref;
- stack selector filtered by repository permission;
- context preview with selected files and `AGENTS.md`/instructions;
- active workspace chip for the same branch/path;
- active session chip for same workspace;
- missing permission warning if selected stack cannot read required Secret/ConfigMap/Role;
- create workspace action when dispatch needs isolated worktree.

Writes:

- `AgentContextBundle` preview;
- `AgentDispatchRun` on confirm;
- optional `AgentWorkspace`/`WorkItemWorkspaceLink`.

## Issues page

Route: `/orgs/[org]/repositories/[repo]/issues`

Current role:

- issue/work item lifecycle and triage surface.

Agent additions:

- issue board/list cards show dispatch readiness;
- context label chips per issue;
- linked session/workspace/run list;
- create/link workspace from issue;
- dispatch from issue with prompt template;
- child issue/subtask association for subagents;
- review artifacts or patch suggestions linked back to issue.

Writes:

- `AgentContextLabel` refs;
- `WorkItemSessionLink`;
- `WorkItemWorkspaceLink`;
- `AgentDispatchRun`;
- `AgentArtifact` links.

## Pull requests page

Route: `/orgs/[org]/repositories/[repo]/pull-requests`

Current role:

- review pull requests, checks, and merge readiness.

Agent additions:

- diagnose failed checks;
- attempt repair;
- review diff with agent;
- summarize discussion;
- produce patch/review artifacts;
- request write-back approval for comments, branch pushes, review submissions, check reruns;
- show agent run rows linked to PR and checks.

Writes:

- `AgentDispatchRun` from PR/check context;
- `AgentReviewArtifact`;
- `AgentApproval`;
- write-back action after approval.

## Runs page

Route: `/orgs/[org]/repositories/[repo]/runs`

Current role:

- list/follow runs and jobs;
- debug failures;
- watch pipeline resources.

Agent additions:

- show `AgentDispatchRun` rows beside `Pipeline` and `Job` rows;
- `Diagnose with agent` from failed job;
- `Repair with agent` when policy allows;
- show source pipeline/job link in run row;
- show dedupe/coalesced runs;
- show agent run status in CI-like phases.

Run row fields:

- status;
- task kind;
- stack;
- source job/check;
- branch/SHA;
- runner pool;
- ServiceAccount;
- duration;
- approvals;
- artifacts;
- linked session.

## Hooks page

Route: `/orgs/[org]/repositories/[repo]/hooks`

Current role:

- inspect webhook subscriptions and deliveries.

Agent additions:

- trigger rule matches for each delivery;
- dry-run delivery against selected rule;
- replay delivery;
- show rejected/coalesced/created dispatch decision;
- link to resulting `AgentTriggerExecution` and `AgentDispatchRun`.

Writes:

- `AgentTriggerExecution` on replay/dry-run;
- `AgentDispatchRun` when admitted;
- rule lifecycle changes from settings.

## Settings page

Route: `/orgs/[org]/repositories/[repo]/settings`

Future sub-route: `/orgs/[org]/repositories/[repo]/settings/agents`

Agent settings sections:

- enabled stacks;
- stack permissions;
- trigger rules;
- runner pools;
- runtime ServiceAccounts;
- runner ServiceAccounts;
- role bindings;
- Secret grants;
- ConfigMap grants;
- write-back policies;
- dry-run permission review;
- generated YAML preview.

This page should use progressive disclosure: safe forms first, YAML/advanced plans in expandable panels, matching current `PlanCard` conventions.

## Inbox integration

Global route: `/inbox`

Agent additions:

- pending `AgentApproval` items;
- failed dispatches requiring action;
- missing permission warnings assigned to current user/team;
- workspace rebase conflicts;
- review artifacts awaiting decision.

## Controller UI model additions

Suggested shape:

```json
{
  "views": {
    "agents": {
      "repositories": {
        "krate": {
          "activeRuns": [],
          "pendingApprovals": [],
          "missingPermissions": [],
          "enabledStacks": [],
          "dispatchActions": []
        }
      }
    }
  }
}
```

Repository pages can consume this alongside existing `repositories`, `pullRequests`, `issues`, `pipelines`, `runnerPools`, and `webhooks` arrays.

## Empty states

When no agent stack exists:

- Code page: `Create an agent stack to dispatch from this repository.`
- PR page: `Create a reviewer or CI repair stack to diagnose pull requests.`
- Runs page: `Create a CI diagnosis stack to attach agents to failed jobs.`
- Settings page: show stack creation path and YAML preview.

When permissions are missing:

- Show exact missing ServiceAccount/Role/Secret/ConfigMap grant.
- Link to `/orgs/[org]/repositories/[repo]/settings/agents` or global permissions page.
- Do not show a generic disabled button without explanation.

## Acceptance criteria

- Agent entry points appear in existing repository hierarchy, not only global `/agents` pages.
- Repository pages consume server-projected agent affordances.
- Dispatch rows in pipelines feel like CI runs while linking to Agent Mux chat.
- Denied actions explain policy/RBAC/Secret/ConfigMap blockers.
- Settings page lets users manage repository-scoped stacks, triggers, ServiceAccounts, grants, and runner policy without hand-writing YAML for common paths.

## Repository memory integration

Repository pages should surface company brain associations without forcing users to leave repository context.

- Code page: show applicable runbooks, decisions, services, and agent practices for the selected path/ref; dispatch composer can include them in memory context.
- Issues/PRs: show related incidents, decisions, previous agent practices, and proposed memory updates linked to the work item.
- Pipelines: show CI runbooks and previous remediation memories for failed jobs.
- Settings/Agents: configure `AgentMemorySource` path/kind scopes, default query mode, and required approvals.
- Run detail: show memory snapshot, selected records/excerpts, stale warning, diff against current, and propose-update action.
