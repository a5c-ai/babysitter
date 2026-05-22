# CI/CD interface

## Purpose

The CI/CD interface syncs external workflow/check/pipeline state into Krate and can trigger or control external runs when allowed. It covers workflows, workflow runs, jobs, logs, artifacts, checks, commit statuses, runner groups, and self-hosted runners.

## Provider contract

```ts
interface CicdProvider {
  listPipelines(cursor): Page<ExternalPipeline>;
  getPipeline(ref): ExternalPipeline;
  listJobs(pipelineRef, cursor): Page<ExternalJob>;
  getJobLog(jobRef): ExternalLogRef;
  listArtifacts(pipelineRef, cursor): Page<ExternalArtifact>;
  rerunPipeline(ref, options): ExternalPipeline;
  cancelPipeline(ref): ExternalPipeline;
  listRunners(cursor): Page<ExternalRunner>;
  registerRunner(scope, options): RunnerRegistration;
  createCheck(input): ExternalCheck;
  updateCheck(ref, patch): ExternalCheck;
}
```

Providers can implement checks/statuses without implementing runner management.

## Resource mapping

| External concept | Krate resource/projection |
| --- | --- |
| workflow/workflow definition | `PipelineTemplate` projection or provider metadata |
| workflow run/pipeline | `Pipeline` |
| job/step | `Job` |
| check run/status | `CheckRun` projection or `Job.status.checks` |
| runner | `RunnerPool` / `Runner` projection |
| artifact/log | `Artifact` / object-storage reference |
| trigger event | `WebhookDelivery` / `ExternalSyncEvent` |

## GitHub mapping

GitHub Actions workflow runs map to `Pipeline`; workflow jobs map to `Job`; check runs and commit statuses map to check projections and PR gates. GitHub self-hosted runners map to runner inventory and runner registration flows when Krate is allowed to manage them.

## Sync rules

- Webhooks handle `workflow_run`, `workflow_job`, `check_run`, `check_suite`, `status`, and `push` events.
- Backfill periodically lists workflow runs/jobs by repository and updated timestamp.
- Logs and artifacts are lazy-loaded and stored by digest or external URL depending on retention policy.
- Rerun/cancel actions require permission review and provider capability.
- External runner registration tokens are short-lived and never stored as plain status.

## User-facing changes

- Repository Runs page shows external pipelines next to Krate-native runs.
- Run detail badges show external provider and native link.
- Rerun/cancel buttons are disabled unless provider and RBAC allow them.
- Runner pages distinguish Krate-managed, provider-managed, and mirrored runners.
- Agent triggers can subscribe to external CI failure events through the same trigger rule model.

## Acceptance criteria

- A CI-only provider can sync pipelines/jobs without repo/issue ownership.
- GitHub workflow jobs converge through webhook and backfill.
- Logs/artifacts are fetched lazily and redacted according to policy.
- Rerun/cancel actions are audited and idempotent.
