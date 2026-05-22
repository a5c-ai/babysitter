# @a5c-ai/cloud

Deployment SDK and CLI for installing Babysitter repo services into Kubernetes.

This package implements the spec in [SPEC.md](./SPEC.md) with:

- environment-aware config loading and validation
- deployment plan construction
- Terraform rendering for Minikube, existing clusters, EKS, AKS, and GKE
- Kubernetes manifest rendering for `kanban`, `agent-mux-gateway`, and optional `babysitter-agent`
- install, upgrade, status, auth bootstrap, provider configuration, and agent install workflows
- a `cloud` CLI built on the SDK

Current scope deliberately excludes the separately tracked upstream dependency tickets referenced in the spec.

<!-- docs-status:start -->
> Status: Public package.
> Canonical docs home: [Package and Plugin Docs Map](../../docs/package-and-plugin-map.md).
> This README is the canonical package contract until a dedicated docs-site guide exists.
<!-- docs-status:end -->

## Package scripts

```bash
npm run build --workspace=@a5c-ai/cloud
npm run test --workspace=@a5c-ai/cloud
npm run test:coverage --workspace=@a5c-ai/cloud
```

## CLI examples

```bash
cloud init --env minikube
cloud plan --env staging --provider eks --set target.region=us-east-1
cloud render terraform --config cloud.config.json
cloud render kubernetes --config cloud.config.json
cloud install --config cloud.config.json --dry-run
cloud status --config cloud.config.json
```

