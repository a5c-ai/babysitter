# User Stories

## Developer stories

### Open and review a PR

As a developer, I want to review a PR in a three-pane view with file tree, diff, conversation, inline comments, suggested edits, and CI status so that I can complete reviews quickly.

Acceptance criteria:

- Given I open a PR, when the page loads, then I see changed files, diff, discussion, reviewers, merge state, and related pipeline runs.
- Given I use keyboard shortcuts, when I press navigation keys, then I can move between files and comments without leaving the keyboard.
- Given I add a suggested edit, when I submit it, then the UI exposes the equivalent resource/YAML mutation.

### Debug a failing run

As a developer, I want a live run view with step navigation, log streaming, failure copy, similar-run search, and rerun controls so that I can diagnose failures without switching tools.

Acceptance criteria:

- Given a job is running, when logs are emitted, then the UI streams them through SSE without polling.
- Given a step fails, when I click find similar runs, then Krate queries pipelines by failure signature labels.
- Given I rerun from a step, when I submit, then Krate creates a new `Pipeline` with `resumeFrom`.

## Platform engineer stories

### Configure a runner pool

As a platform engineer, I want a split form/YAML runner pool editor so that pool configuration is easy to edit and still GitOps-auditable.

Acceptance criteria:

- Given I edit image, resources, node selector, warm replicas, max replicas, trust tier, and cache backend, when fields change, then YAML updates live.
- Given I save, when the operation succeeds, then the same manifest can be copied as `kubectl apply`.
- Given I click save to repo, when configured, then Krate opens a PR against the platform config repo.

### Roll out PR policy safely

As a platform engineer, I want policy templates, CEL/raw modes, audit preview, and enforcement controls so that I can govern PRs without breaking teams unexpectedly.

Acceptance criteria:

- Given I select a policy template, when I preview it, then existing PRs that would violate the policy are listed.
- Given the policy is in audit mode, when a violating PR is created, then it is recorded but not blocked.
- Given I switch to enforce mode, when a violating PR is created, then admission blocks it with an actionable message.

## Repo admin stories

### Add and verify a webhook

As a repo admin, I want to create a webhook, send a test delivery, inspect failures, and replay deliveries so integrations are operationally transparent.

Acceptance criteria:

- Given I create a subscription, when I send a test delivery, then a `WebhookDelivery` resource appears within seconds.
- Given delivery fails, when I open the log, then I see request headers, body, response, latency, retries, and error details.
- Given I click replay, when secrets are current, then Krate re-fires the event and records a new delivery attempt.

## Team lead stories

### Cross-repo triage

As a team lead, I want inbox filters and saved views stored as resources so that triage workflows can be versioned and shared.

Acceptance criteria:

- Given I create a filter for priority issues and PRs, when I save it, then Krate stores a `Selector` or `View` resource.
- Given another user applies the resource, when they open the inbox, then they see the same triage view.
- Given the view is exported, when committed to Git, then it can be reviewed and applied like any other config.

## Excellent-flow coverage

- Open and review a PR.
- Debug a failing run.
- Configure a runner pool.
- Add a webhook and verify it works.
- Write a PR policy with audit-to-enforce rollout.
- Cross-repo triage with saved filters.
