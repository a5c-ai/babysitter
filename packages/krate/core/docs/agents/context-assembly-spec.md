# Agent context assembly and prompt safety spec

## Purpose

Agent dispatch is only safe if Krate can explain exactly what context entered the prompt and launch options. This document defines how to assemble `AgentContextBundle` resources from repository pages, CI events, issues, PRs, artifacts, context labels, skills, tools, and user prompts.

It is grounded in the current Krate UI structure: repository routes already provide Code, Issues, Pull Requests, Runs, Hooks, and Settings surfaces, and `ui-shell.jsx` exposes YAML plan panels for advanced resource visibility.

## Context assembly principles

- Context is a durable resource, not a transient UI string.
- Every prompt fragment must have provenance.
- Context labels are reviewed prompt fragments, not hidden commands.
- Secret values are never included in prompt, preview, transcript, artifact, or audit records.
- Redaction happens before the bundle is snapshotted.
- Retries should use the original context snapshot unless the user explicitly refreshes it.
- Prompt preview must show all included sources, labels, skills, and attachments before dispatch.

## `AgentContextBundle` schema

Important fields:

```yaml
spec:
  dispatchRun: adr-01hx
  sourceRefs:
    repository: krate
    pullRequest: krate/42
    pipeline: pipeline-01hx
    job: job-01hx-test
    issue: krate/91
    path: docs/agents
  prompt:
    user: string
    renderedSystemDigest: sha256:...
    renderedDeveloperDigest: sha256:...
    renderedTaskDigest: sha256:...
  contextLabels:
    - name: ci-failure-summary
      generation: 4
      digest: sha256:...
  sources:
    - kind: repository-file
      ref: refs/heads/staging
      path: docs/agents/README.md
      digest: sha256:...
    - kind: pipeline-log
      name: job-01hx-test
      redactionStatus: redacted
  attachments:
    - kind: log-excerpt
      artifactRef: artifact-01hx-log
      digest: sha256:...
  redactions:
    - kind: secret-pattern
      count: 3
      replacement: "[REDACTED:secret]"
  limits:
    maxBytes: 750000
    truncated: false
status:
  phase: Ready
  digest: sha256:...
  conditions: []
```

## Context sources by route

| Route/surface | Default context | Optional context |
| --- | --- | --- |
| `/orgs/[org]/repositories/[repo]/code` | repo, branch/ref, selected path, file metadata, repository instructions | selected file contents, recent commits, workspace state |
| `/orgs/[org]/repositories/[repo]/issues` | issue title/body/labels/comments, context labels, linked workspace/session/runs | child issues, related PRs, artifacts |
| `/orgs/[org]/repositories/[repo]/pull-requests` | PR title/body, source/target branch, changed files, checks, review state | diff hunks, comments, previous agent artifacts |
| `/orgs/[org]/repositories/[repo]/runs` | pipeline/job status, failed step, runner pool, logs, artifacts | similar failures, rerun history, cache metadata |
| `/orgs/[org]/repositories/[repo]/hooks` | webhook delivery, headers metadata, event type, matched rule | replay history, dedupe/coalescing records |
| `/agents/rules` dry-run | sample event, matched rule, rendered prompt, permission review | fixture payloads, expected dedupe key |
| `/agents/runs/[run]` continuation | previous context digest, transcript summary, current artifacts | new user-provided context, selected files/logs |

## Prompt layers

Krate should render prompt layers separately:

1. stack system prompt;
2. stack developer prompt;
3. skill prompt fragments;
4. context label prompt fragments;
5. trigger prompt template;
6. user task prompt;
7. bounded source summaries and attachments.

Each layer gets a digest and provenance entry. The UI can show rendered text where safe, but large attachments should show summaries and digests.

## Redaction policy

Redaction happens in this order:

1. explicit Secret/ConfigMap deny list from permission review;
2. known secret key names and token patterns;
3. provider credentials and OAuth tokens;
4. private keys and kubeconfigs;
5. webhook signatures and auth headers;
6. repository policy-defined patterns;
7. user-specified redaction patterns.

Redaction output records counts and categories, not raw values.

## Size and truncation policy

Default limits:

- prompt text: 64 KiB;
- log excerpts: 256 KiB per job;
- diff context: 256 KiB;
- total bundle: 750 KiB for standard dispatch;
- max attachment count: 32.

When truncation happens:

- mark `limits.truncated=true`;
- include what was omitted and why;
- prefer keeping first actionable error, changed-file summary, and source breadcrumbs;
- allow user to attach more context explicitly from the run detail page.

## Context label safety

`AgentContextLabel` must include:

- reviewed prompt fragment;
- allowed source types;
- owner/reviewer metadata;
- generation and digest;
- allowed stacks or repositories;
- unsafe phrase/pattern validation status.

Labels cannot:

- reference Secret values;
- grant tools or permissions;
- change approval mode;
- override runner pool or ServiceAccount;
- hide prompt text from preview.

## Context bundle lifecycle

1. User or trigger proposes context.
2. Context assembler resolves sources and permissions.
3. Redactor removes sensitive values.
4. Bundle digest is computed.
5. Permission review digest is attached.
6. Bundle is snapshotted before dispatch attempt creation.
7. Retry uses the same bundle unless user selects refresh.
8. Refreshed context creates a new digest and attempt reason.

## UI requirements

The dispatch composer and run detail page must show:

- source refs and route origin;
- selected stack and prompt layers;
- context labels and generation/digest;
- attachments and truncation state;
- redaction summary;
- permission review summary;
- final context digest.

Denied or warning states:

- source unavailable;
- attachment too large;
- redaction failed;
- context label drifted;
- selected label not allowed for route/source;
- prompt template field missing;
- refreshed context differs from original run.

## Controller responsibilities

Future file:

- `src/agent-context-bundles.js`

Responsibilities:

- collect sources from Krate resources;
- render prompt layers;
- redact sensitive values;
- produce digest and manifest;
- write `AgentContextBundle` metadata and object storage attachments;
- expose preview for UI without launching an agent.

## Acceptance criteria

- A dispatch can be recreated from context bundle metadata without secret values.
- Prompt preview shows every injected context label and skill fragment.
- A missing or drifted context label blocks dispatch or retry according to policy.
- Large logs are truncated with visible explanation.
- Redaction failures fail closed.
- Context bundle digest appears on dispatch run, attempt, approval, artifacts, and audit events.

## Company brain memory sources

`AgentContextBundle` must support company brain memory as a dedicated source family. Memory sources include Atlas-style graph YAML records, Markdown records with YAML frontmatter, free-form Markdown grep excerpts, ontology reports, and generated indexes tied to a Git commit.

Required memory fields inside a bundle:

```yaml
memory:
  repositoryRef: org-company-brain
  requestedRef: main
  resolvedCommit: abcdef1234567890
  snapshotRef: memory-snapshot-01hx
  queryManifestDigest: sha256:...
  ontologyDigest: sha256:...
  indexDigest: sha256:...
  selectedRecordsDigest: sha256:...
  selectedExcerptsDigest: sha256:...
```

A retry uses the original memory snapshot unless the user explicitly refreshes memory. A dispatch may also specify `refAt` to run with memory from a prior timestamp; Krate resolves that timestamp to the latest approved commit at or before it and records both the historical commit and the current commit for diff warnings.
