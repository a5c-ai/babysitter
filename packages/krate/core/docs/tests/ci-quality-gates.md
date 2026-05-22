# CI quality gates

## Gate levels

| Gate | Trigger | Required checks |
| --- | --- | --- |
| PR fast gate | pull request | install, static/docs/package checks, unit/integration tests, UI validation. |
| PR browser gate | pull request when UI changes | browser route smoke, critical UI journeys impacted by change. |
| Merge gate | main/staging merge | full `npm run check`, package/chart validation, UI build. |
| Nightly gate | schedule | live-ish integration, browser full suite, security scans, performance smoke. |
| Release gate | tag/release | Docker build, Helm package, smoke install, upgrade/rollback plan, SBOM/signing if enabled. |
| Staging gate | deployment | real cluster smoke, webhooks, runners, Gitea, Argo/KubeVela, Agent Mux if enabled. |

## Current required local gate

`npm run check` remains the all-up local gate:

```text
build -> validate:docs -> test -> e2e -> package:check -> smoke -> ui:validate -> ui:build
```

## Future gate additions

- `test:browser` for Playwright route and journey tests.
- `test:coverage` for coverage reporting.
- `test:security` for dependency, secret, and auth/RBAC checks.
- `test:charts` for rendered chart validation.
- `test:agents` for agent/company-brain vertical slice.

## CI artifact policy

CI should retain:

- test logs;
- browser traces/screenshots/videos on failure;
- coverage reports;
- rendered manifests;
- package validation report;
- memory import redaction/validation fixtures;
- smoke output;
- SBOM/signature artifacts when release gates run.

## Flake policy

- A flaky test is a failing test until triaged.
- Retries may be used only to collect evidence, not to hide failures.
- Quarantined tests need owner, expiry, issue link, and reduced gate impact.
- CI should track test duration and failure signatures.
