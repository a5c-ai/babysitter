# Krate Documentation

Krate is an a5c.ai Kubernetes-native forge project.

Krate is a Kubernetes-native Git forge where repositories, pull requests, CI, hooks, and policy share Kubernetes identity, RBAC, admission, and declarative APIs.

## Reading order

1. [Product requirements](product-requirements.md) — positioning, personas, outcomes, and non-goals.
2. [System requirements](system-requirements.md) — full-system integration, publish, install, upgrade, security, and release requirements.
3. [Architecture spec](architecture-spec.md) — control-plane/data-plane decomposition and resource model.
4. [User stories](user-stories.md) — persona- and workflow-oriented stories with acceptance criteria.
5. [MVP roadmap](roadmap-mvp.md) — six-week MVP scope and release gates.
6. [Installation and local development](install.md) — quickstart, Next.js UI, validation, and minikube dry-run.

## Component specs

- [Control plane](components/control-plane.md)
- [Data plane](components/data-plane.md)
- [Identity, RBAC, and policy](components/identity-rbac-policy.md)
- [Runners and CI](components/runners-ci.md)
- [Hooks and events](components/hooks-events.md)
- [Web UI](components/web-ui.md) — implemented locally in `../apps/web`
- [Operations and publishing](components/operations-publishing.md)

## Source of truth

These specs are derived from `krate-design.md`. The key architectural commitments are:

- CRDs are the declarative API contract, not the storage engine for high-cardinality social data.
- Pull requests, issues, reviews, pipelines, jobs, and runner activity are Kubernetes API resources served by an aggregated API server backed by Postgres.
- Git repository storage is backed by Gitea plus object storage metadata, not one PVC per repository.
- Human and CI permissions use Kubernetes identity and RBAC; Krate does not introduce PATs or a parallel authorization system.
- Every mutating UI action must expose the equivalent YAML and `kubectl` command.

## Package and local lifecycle

- Product home: `https://a5c.ai/krate`
- Helm-style chart package: `../charts/krate`
- Next.js UI: `../apps/web` (`npm run dev`, `npm run ui:build`)
- Minikube setup script: `../scripts/setup-minikube.mjs`
- Demo resources: `../examples/minikube-demo.yaml`
- Deterministic gates: `npm run check`, `npm run e2e`, `npm run package:check`, `npm run ui:build`, and `npm run setup:minikube -- --dry-run`

- [KubeVela and OAM Integration](components/kubevela-oam.md)
- [OAM and KubeVela Ontology Assimilation](ontology/oam-kubevela.md)

## Organization scoping

Krate is org-first: every repository, deployment, runner, agent, memory source, session, workspace, secret, and config grant belongs to an organization, and each organization maps to a Kubernetes namespace. See `docs/gaps.md` and `docs/agents/org-scoping-namespace-spec.md` for the remaining org-scoping requirements and agent memory implications.

## QA and testing

- [QA automation and test strategy](tests/README.md) defines the product-wide test plan, framework, coverage model, E2E/browser/UI/unit strategy, CI gates, fixtures, security checks, reliability tests, and future agent QA plan.
- The current local all-up gate is `npm run check`; future gates should add browser, coverage, security, chart, and agent-specific suites without weakening the existing scripts.

## External backend integrations

- [External backend integration docs](external/README.md) define GitHub-first integration and future provider support through three independent interfaces: issue tracking, CI/CD, and git forge. The docs cover research, provider model, CRDs, controllers, bidirectional sync, user-facing changes, security, and rollout/testing.

The external backend docs include a provider catalog and UI/CRD/controller specs for pluggable backends beyond GitHub, including issue-only, CI-only, git-forge-only, and full-forge providers.
