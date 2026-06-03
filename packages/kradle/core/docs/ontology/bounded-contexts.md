# Bounded Contexts

## Control plane

Owns resource verbs, storage routing, RBAC checks, admission decisions, audit records, status patches, lists, and watches. It depends on `resource-model` for kind classification and `identity-policy` for authorization and admission evaluation.

## Data plane

Owns Gitea repository hosting, warm Git receive routing, object storage metadata, search indexing hooks, `RefPolicy`, and `BranchProtection` enforcement. It writes `Repository` config and emits Git events through the control-plane event stream.

## Identity and policy

Owns OIDC identity mapping, Kubernetes groups, default RBAC roles, service-account scope profiles, trust tiers, admission policies, and audit/enforce rollout lifecycle.

## Runners and CI

Owns `RunnerPool`, `Pipeline`, and `Job` resources, queue-depth scaling, fork isolation, cache configuration, and rerun/resume semantics.

## Hooks and events

Owns outbound `WebhookSubscription` and `WebhookDelivery` resources, HMAC signing, retry/failure status, replay records, and the distinction between server-side Git hooks, outbound webhooks, and Kubernetes admission hooks.

## Web UI

Owns resource-backed view models for dashboards, PR review, runner pool editing, webhook inspection, YAML previews, and excellent flows. It must not invent hidden state that cannot be mapped back to resources.

## Operations and publishing

Owns install manifests, CRD/APIService publication, observability surfaces, backup/restore order, upgrade gates, smoke tests, and release readiness checks.
