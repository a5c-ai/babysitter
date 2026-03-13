# Features 1-10 Implementation Notes

This document maps the requested features (1-10) to shipped runtime behavior in `babysitter-codex`.

## 1) Session management UX

- Session index persisted at `.a5c/index/sessions.json`.
- Resume selectors:
  - `recent`
  - `tag:<tag>`
  - `search:<query>`
  - `list`
  - `name <alias>`
  - `tag +<tag>` / `tag -<tag>`

## 2) Notifications + event stream

- Event stream file: `.a5c/events/events.jsonl`
- Event shape: `{ version, id, seq, ts, type, runId, payload }`
- Notification sinks:
  - `webhook` (`BABYSITTER_NOTIFY_WEBHOOK_URL`)
  - `slack` (`BABYSITTER_NOTIFY_SLACK_WEBHOOK`)
  - `desktop` (`BABYSITTER_NOTIFY_DESKTOP=1`)
  - `file` (`.a5c/events/notifications.jsonl`)
- Configure sinks with `BABYSITTER_NOTIFY_SINKS=webhook,slack,desktop,file`.

## 3) Long-task autonomous mode + approval policies

Policy config file: `.a5c/config/policies.json`

```json
{
  "planModeImmutable": true,
  "approvalPolicy": "interactive",
  "longTaskMode": "strict",
  "allowShellCommands": ["npm test", "npm run lint", "git status"],
  "allowNodeScripts": ["scripts/check.js"],
  "stagedApprovals": [
    { "iterationLte": 3, "mode": "auto-approve" },
    { "iterationLte": 15, "mode": "interactive" }
  ]
}
```

## 4) Multi-repo workspace orchestration

Workspace file: `.a5c/workspace/repos.json`

```json
{
  "version": 1,
  "repos": [
    { "alias": "default", "scope": "core", "path": "." },
    { "alias": "web", "scope": "frontend", "path": "../web-app" }
  ]
}
```

Tasks can use `task.repoAlias`/`task.repo` to route execution.

## 5) Mid-session model switching + routing

Use command phrase: `babysitter model set plan=gpt-5 execute=gpt-5-codex`

Persisted file: `.a5c/config/model-policy.json`

## 6) Plan/Act contract hardening

- In `plan` mode, mutating tasks are blocked (`agent`, `shell`, `node`, `skill`).
- Block events trigger `on-policy-block` hooks and trace entries.

## 7) Richer hook lifecycle

- New hooks supported:
  - `on-tool-error`
  - `on-policy-block`
  - `on-retry`
- Optional hook transform config: `.a5c/config/hook-transforms.json`

```json
{
  "*": { "maxStringLength": 500 },
  "on-tool-error": { "stripFields": ["stack"] }
}
```

## 8) MCP reliability + auth toolkit

`babysitter doctor mcp` checks:
- codex config file presence
- OAuth env
- transport env
- MCP server command path availability
- auth token env
- MCP hints in `.codex/config.toml`

## 9) Native GitHub issue/PR workflow

`babysitter issue` now supports:
- `--apply` (generate apply-mode prompt)
- `--pr <number>` (post plan comment to PR)
- `--open-pr` (attempt `gh pr create --fill`)
- includes issue comments snippets in output context

## 10) Cost/token telemetry + budgets

- Telemetry aggregate: `<runDir>/state/telemetry.json`
- Telemetry history: `<runDir>/state/telemetry-history.jsonl`
- Budget phases:
  - `normal`
  - `soft-limit` (prompt shrinking enabled)
  - `hard-stop` (policy block + run halt)
