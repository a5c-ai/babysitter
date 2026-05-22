# Solution-Space Ontology

The MVP is a deterministic Kubernetes-native contract implementation of the Krate architecture. Local tests do not require a live cluster, but the modules, chart, examples, Argo CD Application surface, and Gitea backend integration model the cluster contracts described in `docs/`.

## Architectural shape

- `src/resource-model.js` defines resource kinds, storage classes, metadata normalization, selectors, and Kubernetes-list output.
- `src/control-plane.js` models create/update/status verbs, RBAC, admission, audit, storage boundary routing, and watches.
- `src/identity-policy.js` maps OIDC identities, groups, trust tiers, service accounts, admission policies, and policy rollout.
- `src/data-plane.js` and `src/gitea-backend.js` model repository creation, Gitea-backed Git hosting, SSH keys, collaborators/teams, branch protection, ref policy, webhooks, object metadata, and search hooks.
- `src/runners-ci.js` models runner pools, pipelines, jobs, queue scaling, fork isolation, and rerun/resume.
- `src/hooks-events.js` models webhook subscriptions, signing, durable deliveries, failure inspection, and replay.
- `src/web-ui.js` models excellent UI flows as resource-backed view models.
- `src/operations.js` and `src/argocd-gitops.js` model manifests, Argo CD GitOps Applications, observability, backup/restore, release gates, and the MVP demo.

## MVP boundaries

- In scope: Kubernetes resource contracts, Argo CD Application generation, Gitea API-shaped backend integration, deterministic control-plane behavior, workflow models, tests, docs coverage, and smokeable demo output.
- Out of scope for local validation: requiring a live APIService deployment, live Argo CD controller, live Gitea server, real Postgres, real etcd, real ARC runners, and real browser rendering.
- Required fidelity: storage classes, Gitea integration calls, Argo CD Application fields, policy decisions, eventing, and operational gates must behave like the docs even when validated through deterministic JavaScript harnesses.

## Quality strategy

The solution converges through ontology authoring, module implementation, acceptance tests, doc coverage, smoke output, and final quality review.
