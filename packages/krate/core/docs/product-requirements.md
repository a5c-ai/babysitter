# Product Requirements

## Product summary

Krate is a Kubernetes-native forge for platform engineering teams. It extends the Kubernetes API with repository, pull request, issue, pipeline, runner, hook, and policy resources so Git workflows compose directly with RBAC, admission webhooks, Argo, Crossplane, ARC, Kyverno, and Gatekeeper.

## Problem

Existing Kubernetes-hosted forges are usually monoliths packaged in Helm. They still bring a separate identity model, permission model, webhook system, CI security surface, and integration layer. The naive Kubernetes-native design also fails if every issue/comment is stored in etcd, every repository gets its own PVC, or push traffic is cold-started.

## Goals

- Provide a forge where repos, PRs, CI, hooks, and policy share one Kubernetes identity and RBAC model.
- Make forge resources queryable and automatable with `kubectl`.
- Support admission-webhook policy for PRs, issues, and CI without custom integration glue.
- Keep high-cardinality social data out of etcd while preserving Kubernetes API semantics.
- Make GitOps transparency a first-class UX pattern for every mutation.
- Ship an MVP that proves policy, Git push, PR review, and CI identity end to end.

## Non-goals for MVP

- Scaled Gitea-backed production data plane beyond the single-backend MVP.
- Full native runner abstraction if ARC integration is sufficient for the first demo.
- Built-in code search beyond design-ready interfaces.
- Multi-cluster federation.
- Replacing Kyverno or Gatekeeper with a bespoke policy language.

## Personas

### Developer

Developers review PRs, browse code, debug failing runs, and need fast keyboard-first workflows. They should not need to understand cluster internals to use the forge, but should always be able to reveal the underlying resource and command.

### Platform engineer

Platform engineers own runner pools, policy, identity, storage, hooks, tenancy, install, upgrade, and cost. They need auditability, safe rollout modes, and GitOps-managed configuration.

### Repo admin

Repo admins configure repository settings, branch protection, webhooks, runner permissions, and policy overrides. They use the same IA as developers with additional settings access.

## Product principles

- Kubernetes is the backend. Krate should not recreate permission, policy, audit, and identity systems already present in Kubernetes.
- CRDs are contracts, not a database. High-cardinality records must live behind the aggregated API server.
- Push paths must stay warm. Reads can scale elastically; writes cannot impose cold-start latency on `git push`.
- UI state can be declarative. Saved views and selectors should be resources that teams can commit, share, and apply.
- Policy rollout must be observable. Audit mode and violation preview are required for PR policy authoring.

## Success metrics

- Time from `helm install krate` to first repository push is under 15 minutes in a documented environment.
- A Kyverno policy can block or audit PR creation without custom Krate code.
- A developer can open, review, and merge a PR with CI status from the UI.
- A platform engineer can configure a runner pool and export/save its YAML.
- Webhook failures are inspectable and replayable from both UI and `kubectl`.

## Organization-scoped tenancy

Krate is organization-first. Every repository, deployment, runner pool, agent stack, trigger, company brain memory repository, session, workspace, secret grant, and config grant belongs to an org. Each org maps to its own Kubernetes namespace so Kubernetes RBAC, ServiceAccounts, Secrets, ConfigMaps, admission, and audit remain the isolation boundary.

The UI should feel like GitHub organization navigation: select an org, then browse repositories, deployments, agents, memory, settings, runners, and audit for that org. Cross-org sharing is explicit policy, not an accidental reference.
