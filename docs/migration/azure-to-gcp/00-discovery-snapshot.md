# Azure → GCP migration — discovery snapshot (2026-09-16)

Frozen input for the `azure-to-gcp-migration` babysitter run. Taken by the orchestrator with `az`, `kubectl`, `helm`, `gh`, `gcloud` and repo search before the run started. Later documents (01–07) are produced by the run and supersede this file where they disagree.

Target: **Google Cloud project `boot-464019`**. Rule: **source first** — every deployed thing must be traced to its git origin and the origin changed; no payload copying (no `az acr import`, no `kubectl get -o yaml | kubectl apply`).

## 1. Azure account state

| Item | Value |
|---|---|
| Subscription in use | `Microsoft Azure Sponsorship` `794e33cd-48ba-4654-8cd9-b6cf2715e097`, tenant `5aa70b65-…`, 100 % credit (invoice is $0) |
| Second subscription | `Azure subscription 1` `1a6a4872-…`, tenant `85f6b733-…` — not listable from this session (needs interactive `az login`); the hub Key Vault `kv-hubdevelopmentwest3v2` belongs to that tenant and is unusable from the sponsorship tenant |
| Prior audits | `C:\work\company\infra\*.md` (2026-04-19 cleanup: 92→17 RGs), `artifacts/research/azure-finops-status-2026-09-05.md` (AI teardown: all 40 model deployments deleted, 6 dispatch workflows disabled, LiteLLM proxy deleted; residue ≈ $760–1,160/mo list) |
| Resource groups now | 33 (see `az group list` in raw appendix) |

### 1.1 Resource-type counts (sponsorship subscription)

18 disks · 15 public IPs · 15 NSGs · 14 VNets · 13 storage accounts · 12 NICs · 12 VMs (**all deallocated**) · 7 Cognitive/AI accounts (**0 deployments**) · 6 ML workspaces (+4 serverless endpoints) · 5 static web apps · 5 Log Analytics · 5 Postgres flexible servers · 4 Key Vaults · 3 Container Apps + 1 job + 1 env (geekonomy) · 2 ACRs · 1 AKS · 1 Redis · 1 Web app · 1 DNS zone · 1 LB · 1 Grafana · monitoring rule groups/alerts.

### 1.2 The production-bearing system: AKS `aks-hub-development-westus3-v2`

| Property | Value |
|---|---|
| RG / region | `rg-hub-development-westus3` / westus3 |
| K8s | 1.30.12, free tier, 1 system pool `default` Standard_D2s_v5 ×4 (autoscale 1–6), 128 GB OS disks |
| Network | Azure CNI, Azure network policy, user-assigned identity, OIDC issuer **off**, workload identity **off** |
| Addons | azureKeyvaultSecretsProvider (no SecretProviderClass in use), azurepolicy (gatekeeper), ingressApplicationGateway (AppGW deleted 2026-04-19 → addon orphaned), omsagent, extensionManager |
| Ingress | `ingress-nginx` LB **135.234.117.214** (all `*.a5c.ai` hosts); AKS app-routing addon LB 134.33.26.182 (unused) |
| TLS | cert-manager v1.15.3, ClusterIssuers `letsencrypt-prod`, `letsencrypt-production`, `letsencrypt-staging` (HTTP-01) |
| DNS | `a5c.ai` zone is at **GoDaddy** (ns41/ns42.domaincontrol.com); records are manual A records → 135.234.117.214. No external-dns controller runs (annotations are inert). `i.personoids.com` is an Azure DNS zone (17 records, personoids legacy) |
| Helm releases | arc-controller 0.12.1, hub-dev-runners (0–20 runners, `https://github.com/a5c-ai`), babysitter-web-staging (chart babysitter-web 1.1.0, rev 15, 2026-04-12), cert-manager, ingress-nginx 4.13.1, kradle (ns kradle, 2026-08-13), kradle (ns kradle-staging, 2026-09-05), kyverno 3.8.1 **failed** |
| Storage classes | Azure disk CSI (`default`, `managed*`), Azure Files CSI (`azurefile*`), static PV classes `atlas-postgres-static`, `content-studio-postgres-static` |
| Origin of the cluster | **a5c-ai/hub** `terraform/environments/development` + `terraform/modules/aks` (naming `hub-development-westus3`); a5c-ai/infra `terraform/envs/azure-dev` + `modules/azure-host` is a second, later IaC that also targets AKS+nginx+cert-manager. Neither is applied by CI today (hub last pushed 2025-09-08). |

### 1.3 Cluster workloads → source origins

| Namespace | Workloads (image) | Hostnames | State | Health | Origin (git) |
|---|---|---|---|---|---|
| `kradle` (prod) | kradle-api/controllers/webhook-worker (`acr…/kradle-controller:21ded0e5`), kradle-web (`acr…/kradle-web:21ded0e5`), gitea 1.22 (**emptyDir**), prosody sts, jitsi web/jicofo/jvb | kradle.a5c.ai, gitea.kradle.a5c.ai, meet.kradle.local | CRDs in etcd (~95 kinds `kradle.a5c.ai` + legacy `krate.a5c.ai`); prosody PVC **Pending** | api/web/controllers 1/1; prosody 0/1 | **a5c-ai/babysitter** `.github/workflows/publish.yml` job `deploy_kradle` + `packages/kradle/charts` (+ vendored `packages/kradle/core/.github/workflows/publish.yml`) |
| `kradle-staging` | same at `57b13a4c` | kradle-staging.a5c.ai, gitea.kradle-staging.a5c.ai | same | same | same |
| `kradle-org-*`, `krate-org-*` | per-org namespaces for dispatched agent Jobs (emptyDir workspaces) | – | – | – | kradle controllers (same repo) |
| `atlas` / `atlas-staging` | atlas-webui (`acr…/atlas-webui:<sha>`), atlas-postgres sts (PV on **Azure Files** share in storage account `a5catlaspg794e33cd`, 8 Gi RWX) | atlas.a5c.ai / atlas-staging.a5c.ai | Postgres data | 1/1 | **a5c-ai/babysitter** `publish.yml` job `deploy_atlas_webui` (heredoc manifests + `az storage` provisioning, lines ~1748–2203) |
| `staging` | babysitter-web-staging (`acr…/babysitter-web:staging-18addbf7`), bundled postgres 16 + redis | staging.web.a5c.ai | PG in-cluster (default disk) | 2/2 | **a5c-ai/claude-web** (chart `babysitter-web` 1.1.0; secrets also named `claude-web-staging-*`) — STALE (Apr 2026) |
| `app` / `app-staging` | a5c-app (`acr…/a5c-app`), jaeger, otel-collector, a5c-install (staging), postgres 15 sts, redis sts (0/1) | app.a5c.ai, app-jaeger.a5c.ai, app-staging.a5c.ai, app-jaeger-staging.a5c.ai, install-staging.a5c.ai (HTTP only) | PG in-cluster 10 Gi | app 2/2 prod, 1/2 staging; redis 0/1 | **a5c-ai/a5c** `scripts/deploy-azure.sh` (manual script) |
| `aeq` | aeq-server/dashboard/mcp, bmux-server (`acr…/aeq-*`, `bmux-server`) | bmux.a5c.ai | Azure PG `aeqpg0316203042` (db `aeq`); `aeq-data-pvc` **Pending** | 1/1 | **a5c-ai/askExpertQuestion** `k8s/*.yaml`, `infra/terraform` (azurerm), workflows `deploy.yml`, `terraform.yml` |
| `hub-development` | hub-backend **0/3**, hub-frontend 2/2, postgresql, redis (`acr…/hub/*:1b76672-dirty`) | hub.a5c.ai | PVCs 100 Gi + 10 Gi disk, **1 Ti Azure Files** `hub-repositories-pvc`; Azure PG `psql-hub-development-westus3-v2` (dbs `hub`, `hub_test`); storage `sthubdevelopmentwestu3v2` (artifacts/backups/packages/repositories) | broken | **a5c-ai/hub** `scripts/deploy.sh`, `infrastructure.yml` — STALE (2025-09) |
| `content-studio` | content-studio (`acr…/content-studio`), postgres 16 sts on Azure Files static PV | studio.a5c.ai | PG 8 Gi RWX | 1/1 | **a5c-ai/company** `apps/content-studio/deploy/k8s/app.yaml`, `.github/workflows/content-studio-deploy.yml`, `docs/content-studio/deploy-runbook.md` |
| `osb-staging` | osb-cli (`ghcr.io/a5c-ai/osb/benchmark-cli`) | – | – | 1/1 | **a5c-ai/osb** `.github/workflows/cd.yml` |
| `arc-systems`, `arc-runners` | ARC controller + `hub-dev-runners` scale set (0 running) | – | – | idle | manual helm (no workflow in babysitter uses self-hosted runners) |
| `aks-command`, `krate-org-*`, `vela-system`, `kyverno`, `gatekeeper-system`, `app-routing-system` | platform residue | – | – | kyverno release failed | kradle chart subcharts / AKS addons |

Image registry for everything above except osb: **`acrhubdevelopmentwestus3.azurecr.io`** (Standard, 60 GB, 24 repositories, pull via scope-map token `aks-pull` stored as k8s `acr-pull` secrets; CI token `content-studio-ci`).

### 1.4 Other Azure resources (outside the cluster)

| Group | Resources | Notes / disposition candidate |
|---|---|---|
| `rg-hub-development-westus3` | ACR, 2 Postgres flex (B1ms, 32 GB, 7-day backup), KV (foreign tenant), storage ×2, VNet + NSGs, Log Analytics, App Insights, DCR, private DNS zones (KV/blob links) | Cluster support — migrate/decommission with the cluster |
| `geekonomy-prod` | Container Apps web/worker/transcriber + migrate job, ACR `geekonomyacrmkb5l5`, Postgres `geekonomy-pg-mkb5l5`, Redis Basic | Separate product; source repo not in a5c-ai org listing → **owner decision** |
| `rg-litellm-proxy` | storage `stlitellmproxy2026`, Postgres `litellm-pgdb`, `litellm-pgdb2` | Spend-log archive of the $136k engagement; planned "dump then delete" |
| `personoids_sponsorship` (+ DNS RG) | 3 KVs, 3 storage, 4 AI accounts, ML workspaces + serverless endpoints, Grafana, Monitor workspaces, VNet, `documentdb`, static site `a5c-website` | Legacy personoids; mostly idle |
| `rg-tmuskal-7935`, `rg-tmuskal-9340` | AI Services `a5c-sw-resource` (**= `AZURE_OPENAI_PROJECT_NAME`, the Foundry mux CI used**), `tmusk-*`, ML projects, App Insights | 0 deployments since 2026-09-05 |
| Static web apps | `a5c-website` ×2 (a5c-website-rg, personoids), `intuitive-website-new`, `babysitter-benchmarks` (rg-babysitter-portal), `a5c-proxy-894866` | Origins: a5c-ai/a5c-website, a5c-ai/website-a5c or site, babysitter benchmarks portal (find) |
| Web app | `promoted-idle-a1cef5` (rg-promoted-idle) | unknown owner |
| VMs (all deallocated) | tb-fleet-0..8 (terminal-bench), a5c-dev-vm ×2, vm-odoo-validation, ubuntu-large-02 | orphaned disks/IPs ≈ $112/mo; decommission candidates |
| Storage | `babysitterarchive2608` (GRS, container `trial-telemetry`), `a5cstatic` (`$web`), `a5ctfstorage`, mantis ×3 | archive / static hosting |
| DNS | `i.personoids.com` Azure DNS zone | legacy |
| Monitoring | Azure Monitor workspaces, Prometheus rule groups, Grafana, alerts | replace with Cloud Monitoring |

## 2. GitHub wiring (names only)

- Org variables: `AZURE_ACR_NAME=acrhubdevelopmentwestus3`, `AZURE_AKS_CLUSTER_NAME`, `AZURE_APPLICATION_CLIENT_ID`, `AZURE_OPENAI_PROJECT_NAME=a5c-sw-resource`, `AZURE_RESOURCE_GROUP_NAME`, `AZURE_SUBSCRIPTION_ID`, `AZURE_TENANT_ID`, `KRATE_GITHUB_CLIENT_ID`, `SUPABASE_ORG_ID`, `DISCORD_GUILD_ID`.
- Org secrets (relevant): `AZURE_APPLICATION_CLIENT_SECRET`, `AZURE_OPENAI_API_KEY`, `KUBE_CONFIG`, `KRATE_GITHUB_CLIENT_SECRET`, `KRADLE_TEST_AUTH_SECRET`, `GOOGLE_CLOUD_PROJECT` (already exists), `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `NPM_TOKEN`, `A5C_AGENT_GITHUB_TOKEN`, `RUNNER_GITHUB_TOKEN`.
- babysitter repo secrets: `AZURE_ACR_PULL_PASSWORD`, `ATLAS_POSTGRES_STORAGE_KEY`, `ATLAS_GITHUB_CLIENT_SECRET`, `KRADLE_TEST_AUTH_SECRET`, `CLAUDE_CODE_OAUTH_TOKEN`; variables `A5C_PROVIDER_NAME=azure_openai`, `A5C_SELECTED_CLI_COMMAND=azure_codex`, `ATLAS_POSTGRES_STORAGE_ACCOUNT`, `ATLAS_GITHUB_CLIENT_ID`, `KRADLE_GITHUB_CLIENT_ID`.
- Environments: atlas-production/staging, kradle-production/staging, krate-staging, production, staging, copilot, github-pages.

## 3. Azure couplings in the babysitter repo (from source scan)

- `.github/workflows/publish.yml`: `deploy_atlas_webui` (≈1748–2203) and `deploy_kradle` (≈2205–2544): `azure/login@v2` (SPN), `az acr login`, buildx push to `${AZURE_ACR_NAME}.azurecr.io/{atlas-webui,kradle-controller,adapters-agent,kradle-web,jitsi-agent-sidecar}`, `KUBE_CONFIG` base64 kubeconfig, `acr-pull` docker-registry secret from scope-map token, Azure Files Postgres provisioning (`az storage account create/keys list/share create`, static PV `file.csi.azure.com`, class `atlas-postgres-static`), `kradle-assistant-keys` with `AZURE_API_KEY` + `AGENT_MUX_API_BASE=https://<proj>.services.ai.azure.com`, helm `--set image.*.repository=…azurecr.io/…`, `global.imagePullSecrets[0].name=acr-pull`. `g0_rt_jitsi_e2e` + `.github/workflows/g0-rt-jitsi-e2e.yml` use `KUBE_CONFIG`. `deploy_staging_cloud` already carries GCP-shaped vars (`A5C_CLOUD_*_PROJECT_ID/REGION/CLUSTER_NAME`).
- Vendored second deploy origin: `packages/kradle/core/.github/workflows/publish.yml` ("Deploy Kradle To AKS", ghcr chart push).
- 12 agent workflows inject `AZURE_API_KEY` / `AGENT_MUX_API_BASE`; live-stack matrices pin provider `foundry-openai` (`required_env: AZURE_API_KEY,AGENT_MUX_API_BASE`).
- `packages/adapters/core/src/provider-config.ts:48-49` (`azure`, `foundry` endpoint templates), transport `azure-foundry` across adapters/transport + proxy; `packages/kradle/core/src/assistant-runtime.js` hard-codes the Azure `/openai/deployments/<model>/chat/completions?api-version=…` shape; `packages/kradle/charts/values.yaml:478-492` documents the "Azure foundry mux"; controller code carries AKS workarounds (`agent-workspace-controller.js` storage class omission, `emptyDir` dispatch workspaces).
- IaC generator `packages/kradle/installer/src/terraform/root.ts` has `renderAks()` and an existing `renderGke()`; `types.ts`/`sdk/config.ts` already accept target `gke`.
- Tests pinning Azure text: `packages/atlas/webui/tests/atlas-deploy-postgres-workflow.test.ts`, `packages/kradle/core/tests/deployment.test.js` (~470–518), `packages/kradle/installer/tests/plans.test.ts` (~306–320), `packages/adapters/cli/tests/live-stack/*` + `scenario-contract.test.ts` fixtures.
- Docs claiming AKS: `docs/development/06-kradle-cloud-platform.md:35`, `docs/research/g0-rt-live-validation-runbook.md` (emptyDir-on-AKS), `docs/github-actions-setup-babysitter.md` (Azure OpenAI inputs), `action.yml` inputs `azure-openai-*`.
- GCP already present: `GOOGLE_CLOUD_PROJECT`/`GOOGLE_GENAI_USE_VERTEXAI` in live-stack workflows, `docs/github-actions-setup-gemini-cli.md` WIF pattern (`google-github-actions/auth@v2`), `vertex` provider in installer/adapters. **No `gcloud`, `pkg.dev`, GKE auth, or `boot-464019` in any workflow.**

## 4. GCP state on this machine

- `gcloud` account `tal@muskal.net`, project `muskaltech`; **token expired** (`invalid_grant`). `gcloud projects describe boot-464019` fails. The owner must run `gcloud auth login` (account that owns `boot-464019`), `gcloud config set project boot-464019`, `gcloud auth application-default login` before Phase B.
- GitHub org secret `GOOGLE_CLOUD_PROJECT` already exists (live-stack Vertex lanes captured `boot-464019`).

## 5. Reference IaC available for the target

- a5c-ai/infra-seed `terraform/cloud/gcp/` (main, addons: cert-manager-gcp, external-dns-gcp, tekton), `terraform/modules/{k8s-cluster,artifact-registry,addons/*}`.
- a5c-ai/infra `terraform/envs/azure-dev` + `modules/azure-host` (structure to mirror as `envs/gcp-boot` + `modules/gcp-host`).
- babysitter `packages/kradle/installer` `renderGke()`.

## 6. Raw command appendix

See `raw/azure/` produced by task `azure-inventory` (this snapshot's commands: `az account list`, `az group list`, `az resource list`, `az acr list`, `az aks show`, `az postgres flexible-server list/db list`, `az storage account list`, `az keyvault list`, `az cognitiveservices account list`, `az staticwebapp list`, `az webapp list`, `az vm list -d`, `az containerapp list`, `az redis list`, `az network dns zone list`, `kubectl get ns/deploy/sts/ing/pvc/sc/certificate/clusterissuer/secret(names)/autoscalingrunnersets -A`, `helm list -A`, `helm get values kradle -n kradle`, `nslookup`, `gh secret/variable list`, `gh api orgs/a5c-ai/actions/{secrets,variables}`, `gh search code`).
