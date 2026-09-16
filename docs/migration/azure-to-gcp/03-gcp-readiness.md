# 03 — GCP readiness for project `boot-464019`

Date: **2026-09-16**. Produced by task `gcp-readiness` of the `azure-to-gcp-migration` run. Inputs: [`00-discovery-snapshot.md`](./00-discovery-snapshot.md), [`01-azure-inventory.md`](./01-azure-inventory.md), `gcloud` / `gh` on the migration workstation, and a source scan of `a5c-ai/babysitter` (branch `staging`), `a5c-ai/infra-seed`, `a5c-ai/infra`, `a5c-ai/hub` (local clones under `C:\Users\tmusk\IdeaProjects\`). Raw transcript: [`raw/gcp/gcloud-auth-check.txt`](./raw/gcp/gcloud-auth-check.txt). No secret **values** appear in this document; secrets are referenced by name and location.

## 0. Verdict

> **Superseded by §3.1 (2026-09-16):** the owner re-authenticated on this workstation as `tal@a5c.ai` with `core/project=boot-464019` (`roles/owner`), and the reuse audit ran — the project is greenfield. The table below is the state **before** that and is kept for the record. Still open per §3.1: ADC (`gcloud auth application-default login`) and the SDK/`gke-gcloud-auth-plugin` update from an elevated shell. The owner decisions of 2026-09-16 are in §3.2.

| Question | Answer |
|---|---|
| Can this machine operate `boot-464019` right now? | **No.** `authenticated = false`, `projectAccessible = false`. |
| Configured gcloud identity | `tal@muskal.net`, active configuration `default`, project `muskaltech` (a personal project, not the target). |
| Exact failure | `gcloud projects describe boot-464019` → `ERROR: (gcloud.projects.describe) There was a problem refreshing your current auth tokens: ('invalid_grant: Bad Request', …)` — the stored refresh token is revoked/expired. |
| Application Default Credentials | Stale `authorized_user` file (`%APPDATA%\gcloud\application_default_credentials.json`, dated 2026-04-14). `print-access-token` fails with *"Reauthentication required … reauth.googleapis.com API requires a quota project, which is not set"*. No service-account key file, no `GOOGLE_APPLICATION_CREDENTIALS`, no `CLOUDSDK_*` env vars, GCE metadata sentinel `False`. |
| Other credentials on the machine | None — `legacy_credentials/` holds only `tal@muskal.net`. |
| Tooling | Google Cloud SDK **405.0.1 (2022-10-14)**, components: `gcloud-crc32c` only. **`gke-gcloud-auth-plugin` is not installed** (mandatory for `kubectl` ≥ 1.26 against GKE; local kubectl is v1.32.2). helm v3.13.0, terraform v1.6.0, docker present. |
| GCP inventory (step 2 of the task) | **Not performed** — blocked by auth. A ready-to-run, read-only script is at [`raw/gcp/inventory.sh`](./raw/gcp/inventory.sh); run it once section 2 is done and paste its `_summary.tsv` into section 3.1 of this document. |
| Interactive login attempted? | No (cannot complete in this session; forbidden by the task). |

Consequence for the plan: **Phase B (build the GCP target) cannot start until an owner completes section 2 on this workstation** (or a CI identity via Workload Identity Federation exists, section 5). Everything in sections 3–6 was gathered without GCP access and is valid regardless.

## 1. What was checked (reproducible)

```bash
gcloud version                                   # 405.0.1
gcloud auth list                                 # * tal@muskal.net
gcloud config list                               # account=tal@muskal.net project=muskaltech
gcloud config configurations list                # default only
gcloud projects describe boot-464019             # invalid_grant → exit 1
gcloud auth application-default print-access-token   # Reauthentication required / no quota project → exit 1
jq -r .type "$APPDATA/gcloud/application_default_credentials.json"   # authorized_user
ls "$APPDATA/gcloud/legacy_credentials"          # tal@muskal.net
env | grep -E 'GOOGLE_APPLICATION_CREDENTIALS|CLOUDSDK_|GOOGLE_CLOUD_PROJECT'   # empty
which gke-gcloud-auth-plugin                     # not found
gh api orgs/a5c-ai/actions/{secrets,variables}   # names only, see §3.2
gh api repos/a5c-ai/<repo>/actions/{secrets,variables}   # babysitter, company, askExpertQuestion, a5c, claude-web, osb, infra, infra-seed, hub
```

Full sanitized transcript: [`raw/gcp/gcloud-auth-check.txt`](./raw/gcp/gcloud-auth-check.txt).

## 2. Owner remediation on this workstation (do this before Phase B)

Run in **Git Bash or PowerShell as the same Windows user (`tmusk`)** that runs the migration. Every step is required; do not skip the SDK update — the 2022 SDK predates several `gcloud container` / `gcloud artifacts` flags used by the plan.

```bash
# 2.1 Bring the SDK up to date and add the GKE auth plugin
gcloud components update                       # if the component manager refuses (managed install), reinstall
                                               # from https://cloud.google.com/sdk/docs/install and re-run
gcloud components install gke-gcloud-auth-plugin kubectl
gke-gcloud-auth-plugin --version               # must print a version

# 2.2 Log in with the Google account that has Owner (or the roles in §5.1) on boot-464019
#     NOTE: it is NOT known which account that is — tal@muskal.net's token is dead, and the
#     GOOGLE_CLOUD_PROJECT org secret cannot be read back. Confirm in https://console.cloud.google.com/iam-admin/iam?project=boot-464019
gcloud auth login                              # browser flow; pick the owning account
gcloud config set account <owning-account>
gcloud config set project boot-464019
gcloud config set compute/region us-central1   # matches infra-seed default; change if §3.1 shows resources elsewhere

# 2.3 Application Default Credentials (used by terraform google provider, helm/kubernetes providers, SDK clients)
gcloud auth application-default login
gcloud auth application-default set-quota-project boot-464019

# 2.4 Verify — all four must succeed
gcloud projects describe boot-464019 --format='value(projectId,lifecycleState)'
gcloud auth application-default print-access-token >/dev/null && echo ADC_OK
gcloud services list --enabled --project boot-464019 | head
gcloud projects get-iam-policy boot-464019 --flatten='bindings[].members' \
  --filter="bindings.members:$(gcloud config get-value account)" --format='value(bindings.role)'

# 2.5 Inventory what already exists (read-only; writes JSON next to the script)
bash docs/migration/azure-to-gcp/raw/gcp/inventory.sh
cat docs/migration/azure-to-gcp/raw/gcp/_summary.tsv
```

Optional but recommended: `gcloud config configurations create a5c-boot` before 2.2 so the personal `muskaltech` configuration stays untouched (`gcloud config configurations activate a5c-boot` afterwards).

If 2.2 shows the owning account is **not** one the operator controls, stop and ask the project owner to grant the operator's account the roles in §5.1 (`gcloud projects add-iam-policy-binding boot-464019 --member=user:<operator> --role=roles/owner` or the granular set).

## 3. Reuse audit — what already exists (REVIEW BEFORE PROCEEDING)

> **REVIEW BEFORE PROCEEDING.** Section 3.1 is empty because the project could not be read. The plan must not create GKE clusters, Artifact Registry repos, VPCs, static IPs, Cloud SQL, or WIF pools until 3.1 is filled from `raw/gcp/_summary.tsv`; anything already present is a **reuse candidate** and creating a duplicate would split state across two IaC roots. Sections 3.2–3.4 are complete and authoritative.

### 3.1 GCP project `boot-464019` — existing resources

| Resource kind | Command in `inventory.sh` | Found | Disposition |
|---|---|---|---|
| Enabled APIs | `services-enabled` | **not inventoried (auth blocked)** | compare with §4 |
| Billing account link | `billing-info` | not inventoried | must be linked and open, or GKE creation fails |
| Caller IAM bindings | `project-iam-policy` | not inventoried | compare with §5.1 |
| GKE clusters | `gke-clusters` | not inventoried | existing → reuse candidate (check version, WI, release channel, region) |
| Artifact Registry repos | `artifact-repos` (+ `gcr-legacy`) | not inventoried | existing DOCKER repo → reuse candidate |
| Cloud SQL | `sql-instances` | not inventoried | existing PG16 → reuse candidate for atlas / content-studio / aeq |
| Filestore | `filestore` | not inventoried | RWX replacement for Azure Files shares (atlas, content-studio, hub 1 TiB) |
| GCS buckets | `gcs-buckets` | not inventoried | terraform state bucket; archive targets for `babysitterarchive2608`, `sthubdevelopmentwestu3v2`, `a5ctfstorage` |
| Cloud DNS zones | `dns-zones` | not inventoried | only relevant if `a5c.ai` is moved off GoDaddy (see §6 note) |
| Secret Manager (names) | `secrets-names` | not inventoried | reuse for the 22 chart-less k8s secrets in `01-azure-inventory.md` §2.2 |
| WIF pools / providers | `wif-pools`, `wif-providers-*` | not inventoried | existing GitHub OIDC provider → reuse for CI auth (§5.2) |
| Service accounts | `service-accounts` | not inventoried | existing deployer / node SAs → reuse |
| VPCs / subnets / static IPs / firewall | `compute-*` | not inventoried | existing VPC + reserved external IP → reuse; the new ingress IP replaces `135.234.117.214` at GoDaddy |
| Cloud Run / Functions | `cloud-run`, `cloud-functions` | not inventoried | candidate home for `geekonomy` Container Apps if kept |
| Vertex AI usage | `vertex-endpoints`, `vertex-models` | not inventoried | live-stack `GOOGLE_GENAI_USE_VERTEXAI=True` lanes already bill this project (§3.4) |

Known from outside GCP: the GitHub org secret `GOOGLE_CLOUD_PROJECT` (updated 2026-05-12) is what the live-stack Vertex lanes use, and per the discovery snapshot its value is this project — so **`boot-464019` is already an active Vertex AI consumer**; the `aiplatform.googleapis.com` API is therefore very likely already enabled.

### 3.2 GitHub Actions — GCP-shaped secrets and variables (names only, via `gh api`, 2026-09-16)

| Scope | Item | Kind | Updated | Status / reuse |
|---|---|---|---|---|
| org `a5c-ai` | `GOOGLE_CLOUD_PROJECT` | secret (visibility `all`) | 2026-05-12 | **exists — reuse**; consumed by `live-stack.yml:475`, `live-stack-published.yml:366`. Should become a *variable* `GCP_PROJECT_ID` (a project id is not sensitive) but keep the secret until those workflows are edited. |
| org `a5c-ai` | `GOOGLE_API_KEY` | secret (`all`) | 2026-05-12 | exists — Gemini/Antigravity key; used by `live-stack*.yml`, `publish.yml:2450/2467` (`kradle-assistant-keys`). Not a deploy credential. |
| org `a5c-ai` | `GEMINI_API_KEY` | secret (`all`) | 2026-03-07 | exists — legacy duplicate of `GOOGLE_API_KEY`; no workflow in babysitter references it (only docs/blueprints). |
| org `a5c-ai` | `GCP_*`, `GKE_*`, `GOOGLE_SERVICE_ACCOUNT_KEY`, `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_SERVICE_ACCOUNT` | — | — | **do not exist** (neither secrets nor variables). `live-stack.yml:421` comments that `GOOGLE_SERVICE_ACCOUNT_KEY` is "not yet configured" — still true. |
| org `a5c-ai` variables | `AZURE_ACR_NAME`, `AZURE_AKS_CLUSTER_NAME`, `AZURE_APPLICATION_CLIENT_ID`, `AZURE_OPENAI_PROJECT_NAME`, `AZURE_RESOURCE_GROUP_NAME`, `AZURE_SUBSCRIPTION_ID`, `AZURE_TENANT_ID` (+ `DISCORD_GUILD_ID`, `KRATE_GITHUB_CLIENT_ID`, `SUPABASE_ORG_ID`, `VERCEL_ORG_ID`) | variables | 2025–2026 | Azure-only; **no GCP variable at org level**. |
| repo `babysitter` | secrets `AZURE_ACR_PULL_PASSWORD`, `ATLAS_POSTGRES_STORAGE_KEY`, `ATLAS_GITHUB_CLIENT_SECRET`, `KRADLE_TEST_AUTH_SECRET`, `CLAUDE_CODE_OAUTH_TOKEN`, `ANTHROPIC_DEFAULT_SONNET_MODEL` | secrets | — | none GCP-shaped. |
| repo `babysitter` | variables `A5C_PROVIDER_NAME=azure_openai`, `A5C_SELECTED_CLI_COMMAND=azure_codex`, `A5C_SELECTED_MODEL=gpt-5.4`, `ATLAS_POSTGRES_STORAGE_ACCOUNT=a5catlaspg794e33cd`, `ATLAS_GITHUB_CLIENT_ID`, `KRADLE_GITHUB_CLIENT_ID` | variables | — | none GCP-shaped. **No `A5C_CLOUD_*` variable exists** → the `deploy_staging_cloud` job in `publish.yml` (lines ≈2721–2770) is dormant (its `if:` on `A5C_CLOUD_STAGING_DEPLOY_ENABLED == 'true'` never fires). |
| repo `babysitter` environments | `atlas-production`, `atlas-staging`, `kradle-production`, `kradle-staging`, `krate-staging`, `production`, `staging`, `copilot`, `github-pages` | environments | — | **no environment-scoped secrets or variables** in any of them (all empty). |
| repos `company` (6 secrets / 2 vars), `askExpertQuestion` (7 / 7), `a5c` (0 / 1), `claude-web`, `osb`, `infra-seed`, `hub` (0 / 0), `infra` (`AZURE_CREDENTIALS`, `AUTH_GITHUB_*`; vars `AZURE_REGISTRY_*=acr10a932`) | — | — | **no GCP-shaped item in any candidate source repo.** |

Net: the only GCP wiring GitHub has today is *model-API* wiring (`GOOGLE_CLOUD_PROJECT` + `GOOGLE_API_KEY` for Vertex/Gemini). There is **no deploy identity** (no WIF provider, no SA key) for GCP anywhere in the org — it must be created (§5.2).

### 3.3 GCP-shaped code paths already in `a5c-ai/babysitter` (branch `staging`)

| Path | What exists | Reuse verdict |
|---|---|---|
| `packages/kradle/installer/src/terraform/root.ts:115` `renderGke()` | Renders a minimal `google_container_cluster` (name, region, `initial_node_count = 1`, `deletion_protection = false`) + `provider "google"`; dispatched from `renderTerraform()` for `target.type === "gke"`. | **Skeleton only** — no VPC/subnet, no node pool, no Workload Identity, no release channel, no Artifact Registry. Extend it or point it at the infra-seed module (below); do not ship as-is. |
| `packages/kradle/installer/src/types.ts:51-56` `GkeTargetConfig {projectId, region, clusterName}`; `src/sdk/config.ts:58,89,234` (accepts `gke` and alias `gks`, validates the three fields) | Config model and validation for a GKE target. | Reuse unchanged. |
| `packages/kradle/installer/src/sdk/config.ts:80-107` | Maps `A5C_CLOUD_ENVIRONMENT/NAMESPACE/RELEASE_TAG/IMAGE_REGISTRY/TARGET_TYPE/INGRESS_HOSTS/KUBE_CONTEXT/CLUSTER_NAME/REGION/PROJECT_ID/RESOURCE_GROUP/SUBSCRIPTION_ID` env vars onto the target. | Reuse: set `A5C_CLOUD_STAGING_TARGET_TYPE=gke`, `_PROJECT_ID=boot-464019`, `_REGION`, `_CLUSTER_NAME`, `_IMAGE_REGISTRY=<region>-docker.pkg.dev/boot-464019/<repo>` as repo variables to activate the hook. |
| `.github/workflows/publish.yml` job `deploy_staging_cloud` (≈2700–2770): `npm run build:cloud` + `npm run deploy:cloud:{staging,prod}` (= `node packages/kradle/installer/dist/cli.js install --env …`) gated on `vars.A5C_CLOUD_{STAGING,PROD}_DEPLOY_ENABLED` | The intended cloud-agnostic deploy path. | Reuse as the **replacement** for the Azure-specific `deploy_kradle` (≈2205–2544) and `deploy_atlas_webui` (≈1748–2203) jobs once it can authenticate (needs a `google-github-actions/auth@v2` step before it). |
| `.github/workflows/publish.yml:1783-1785` | `deploy_atlas_webui` already reads `vars.A5C_CLOUD_{PROD,STAGING}_RESOURCE_GROUP` for the Azure RG. | Shows the variable family is the agreed abstraction; keep the naming. |
| `.github/workflows/live-stack.yml:475-478`, `live-stack-published.yml:366-369` | `GOOGLE_CLOUD_PROJECT`, `GOOGLE_API_KEY`, `GOOGLE_CLOUD_LOCATION=global`, `GOOGLE_GENAI_USE_VERTEXAI=True` for the gemini/antigravity lanes. | Reuse; proves Vertex AI in `boot-464019` is already consumed from CI (with an API key, not an identity). |
| `packages/adapters/core/src/provider-resolver.ts:41,128` and `provider-config.ts:2`, `provider-support-matrix.ts:80-82` | `vertex` provider id; auto-upgrade `google → vertex` when a project or `GOOGLE_GENAI_USE_VERTEXAI` is set. | Reuse — this is the runtime path that replaces the Azure Foundry mux (`AZURE_API_KEY` / `AGENT_MUX_API_BASE`) for Google models. |
| `docs/github-actions-setup-gemini-cli.md:80-96,301` and blueprint `blueprints/a5c/marketplace/blueprints/github-actions-cicd-gemini-cli/` | Documented WIF pattern: `google-github-actions/auth@v2` with `vars.GCP_WORKLOAD_IDENTITY_PROVIDER`, `vars.GCP_SERVICE_ACCOUNT`, `vars.GCP_PROJECT_ID`. | **Adopt these exact variable names** for the deploy identity (§5.2) so docs, blueprint and workflows agree. |
| `library/specializations/devops-sre-platform/gcp-systems-discovery.js` | A babysitter process for GCP project discovery (Cloud Asset Inventory, GKE deep-dive, LB attribution). | Reuse after §2 to produce the GCP-side twin of `01-azure-inventory.md` if the shell script is not enough. |
| `packages/kradle/installer/SPEC.md:23,89,188,219,430` | Spec commits the installer to EKS/AKS/GKE parity (`--provider gke|gks`). | Requirement source for extending `renderGke()`. |
| `packages/kradle/core/src/assistant-runtime.js`, `packages/kradle/charts/values.yaml:478-492`, `packages/kradle/core/src/*/agent-workspace-controller.js` | Azure-only shapes (Foundry URL format, "Azure foundry mux" docs, storage-class omission / `emptyDir` AKS workarounds). | Not reusable; listed here so the source-first phase knows what to change (tracked in the plan's source-change tasks, not in this document). |

Nothing in the repo references `boot-464019`, `pkg.dev`, `gcr.io`, `gke-gcloud-auth-plugin`, or `container.googleapis.com` outside docs/blueprints/library — confirmed with ripgrep (excluding `node_modules`, `dist`, `.a5c`, `artifacts`).

### 3.4 Reference IaC in sibling repos (candidate origins for the GCP target)

| Repo / path | State (local clone) | What it provides | Verdict |
|---|---|---|---|
| `a5c-ai/infra-seed` `terraform/cloud/gcp/` (`main.tf`, `variables.tf`, `providers.tf`, `versions.tf`, `addons.tf`, `tekton.tf`, `outputs.tf`) | `main` @ `4e54c7a` 2025-12-16 | Enables `container`, `artifactregistry`, `compute`, `iam`, `cloudresourcemanager`; creates VPC `<env>-a5c-vpc` (`10.80.0.0/16`), regional subnet with `pods` (`10.81.0.0/16`) / `services` (`10.82.0.0/22`) secondary ranges; module `k8s-cluster` (cloud=`gcp`, REGULAR channel, `e2-standard-4`, 1–3 nodes/zone, 100 GB disks); module `artifact-registry` (`<env>-a5c-images`, DOCKER); addons `cert-manager-gcp` (issuer template), `external-dns-gcp`, optional Tekton and ARC. Defaults `region = us-central1`. | **Primary reuse candidate** for the cluster/registry/network layer. Missing vs. Azure parity: ingress-nginx, Filestore/RWX storage class, Cloud SQL, Secret Manager CSI, static ingress IP, WIF pool for GitHub. |
| `a5c-ai/infra-seed` `terraform/modules/{k8s-cluster,artifact-registry,addons/*}` | same | Multi-cloud modules (`aws|azure|gcp` switch). `addons/`: arc, cert-manager, cluster-autoscaler, external-dns, fluent-bit, metrics-server, namespaces, secrets-store-csi, tekton. | Reuse. |
| `a5c-ai/infra` `terraform/envs/azure-dev` + `modules/azure-host` | `08dbc87` 2025-09-30 | The later Azure host layout (AKS + nginx + cert-manager + platform-auth). | Structure to mirror as `envs/gcp-boot` + `modules/gcp-host` **if** the owner wants the host layer in `infra` rather than `infra-seed` — decide once, do not keep both. |
| `a5c-ai/hub` `terraform/environments/development` + `modules/{aks,cert-manager,container_registry,github_runner,ingress-nginx,keyvault,monitoring,networking,postgresql,resource_group,security,storage}` | `1b76672` 2025-08-22 | Origin of the current AKS cluster; state in Azure `a5ctfstorage`. | Not reusable for GCP; export its state before Azure teardown (already an inventory finding). |

## 4. APIs that must be enabled on `boot-464019`

Compare against `raw/gcp/services-enabled.json` after §2; enable only what is missing (`gcloud services enable <api>… --project boot-464019`). Terraform in infra-seed enables the first five itself (`google_project_service`, `disable_on_destroy = false`).

| API | Why |
|---|---|
| `container.googleapis.com` | GKE cluster (replaces AKS) |
| `compute.googleapis.com` | VPC, subnets, reserved external IP for ingress-nginx, PD-CSI disks |
| `artifactregistry.googleapis.com` | image registry replacing `acrhubdevelopmentwestus3` (`<region>-docker.pkg.dev/boot-464019/<repo>`) |
| `iam.googleapis.com`, `iamcredentials.googleapis.com`, `sts.googleapis.com` | service accounts, Workload Identity Federation for GitHub Actions (§5.2), GKE Workload Identity |
| `cloudresourcemanager.googleapis.com`, `serviceusage.googleapis.com` | terraform provider needs both to read the project and enable services |
| `secretmanager.googleapis.com` | replacement for the chart-less k8s secrets / Azure Key Vaults (with Secrets Store CSI or External Secrets) |
| `sqladmin.googleapis.com` | Cloud SQL for Postgres if atlas / content-studio / aeq / a5c-app databases leave in-cluster StatefulSets (plan decision) |
| `file.googleapis.com` | Filestore — the only RWX option matching the Azure Files shares (atlas ×2, content-studio, hub 1 TiB); Filestore CSI driver is a GKE addon |
| `storage.googleapis.com` | GCS: terraform state bucket, archive targets for blob containers |
| `logging.googleapis.com`, `monitoring.googleapis.com` | GKE system/workload logs and metrics (replaces Log Analytics / Azure Monitor / Grafana) |
| `dns.googleapis.com` | **only if** the `a5c.ai` zone moves from GoDaddy to Cloud DNS (enables external-dns + DNS-01). Not required for the GoDaddy-manual-A-record path. |
| `aiplatform.googleapis.com` | Vertex AI — already consumed by live-stack lanes; kradle assistant / adapters `vertex` provider |
| `cloudbilling.googleapis.com` | lets `gcloud billing projects describe` verify the billing link (read-only) |
| `certificatemanager.googleapis.com` | optional — only if Google-managed certs on a GCLB are chosen instead of cert-manager + ingress-nginx (the plan keeps cert-manager for parity) |

## 5. IAM the deploy identity will need

### 5.1 Human operator (this workstation, terraform apply, break-glass)

Simplest: `roles/owner` on `boot-464019`. Least-privilege equivalent for the migration:

`roles/serviceusage.serviceUsageAdmin`, `roles/compute.networkAdmin`, `roles/compute.securityAdmin`, `roles/container.clusterAdmin`, `roles/container.admin`, `roles/artifactregistry.admin`, `roles/iam.serviceAccountAdmin`, `roles/iam.serviceAccountUser`, `roles/iam.workloadIdentityPoolAdmin`, `roles/resourcemanager.projectIamAdmin`, `roles/secretmanager.admin`, `roles/storage.admin`, `roles/file.editor`, `roles/cloudsql.admin` (if Cloud SQL), `roles/dns.admin` (if Cloud DNS), `roles/logging.admin`, `roles/monitoring.admin`, `roles/billing.projectManager` (view/verify billing link only).

### 5.2 GitHub Actions deploy identity (replaces SPN `askExpertQuestion-github-actions` + org secret `KUBE_CONFIG`)

Create **one service account per purpose** and bind GitHub OIDC through Workload Identity Federation — no JSON keys (this also retires the "Contributor + User Access Administrator on the whole subscription" anomaly).

| Identity | Roles on `boot-464019` | Used by |
|---|---|---|
| `github-deployer@boot-464019.iam.gserviceaccount.com` | `roles/artifactregistry.writer` (push images), `roles/container.developer` (kubectl/helm into namespaces) **plus** `roles/container.admin` *only if* the chart keeps installing cluster-scoped objects (kradle CRDs `kubectl apply -f packages/kradle/charts/crds/`, kyverno, vela ClusterRoles) — prefer moving CRD install into terraform/addons so the deployer stays namespace-scoped; `roles/iam.serviceAccountTokenCreator` on itself is **not** needed with WIF | `publish.yml` `deploy_staging_cloud` (and the rewritten atlas/kradle jobs), `company` content-studio deploy, `askExpertQuestion` deploy |
| `github-terraform@…` | `roles/owner` or the §5.1 least-privilege set; state bucket `roles/storage.objectAdmin` | infra-seed / infra `terraform apply` workflow (plan-on-PR, apply-on-main) |
| `github-livestack@…` | `roles/aiplatform.user` | live-stack Vertex lanes — lets `GOOGLE_API_KEY` be retired in favour of WIF |
| WIF pool `github` / provider `a5c-ai` | attribute condition `assertion.repository_owner == "a5c-ai"`; per-SA `roles/iam.workloadIdentityUser` for `principalSet://iam.googleapis.com/projects/<num>/locations/global/workloadIdentityPools/github/attribute.repository/a5c-ai/<repo>` (one binding per source repo: `babysitter`, `company`, `askExpertQuestion`, `infra-seed`/`infra`) | `google-github-actions/auth@v2` |

Publish as GitHub **org variables** (not secrets — none of these are sensitive) using the names the repo already documents: `GCP_PROJECT_ID=boot-464019`, `GCP_WORKLOAD_IDENTITY_PROVIDER=projects/<num>/locations/global/workloadIdentityPools/github/providers/a5c-ai`, `GCP_SERVICE_ACCOUNT=github-deployer@boot-464019.iam.gserviceaccount.com`, plus per-repo `A5C_CLOUD_STAGING_*` / `A5C_CLOUD_PROD_*` for the installer hook (§3.3). Workflows then use:

```yaml
- uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: ${{ vars.GCP_WORKLOAD_IDENTITY_PROVIDER }}
    service_account: ${{ vars.GCP_SERVICE_ACCOUNT }}
- uses: google-github-actions/setup-gcloud@v2
  with: { install_components: gke-gcloud-auth-plugin }
- run: gcloud auth configure-docker ${{ vars.A5C_CLOUD_REGION }}-docker.pkg.dev --quiet
- run: gcloud container clusters get-credentials ${{ vars.A5C_CLOUD_STAGING_CLUSTER_NAME }} --region ${{ vars.A5C_CLOUD_STAGING_REGION }} --project ${{ vars.GCP_PROJECT_ID }}
```

Job-level `permissions: { id-token: write, contents: read }` is required for OIDC.

### 5.3 Runtime identities inside GKE (Workload Identity, replaces `acr-pull` secrets and static keys)

| K8s SA (namespace) | GCP SA roles | Replaces |
|---|---|---|
| GKE node service account (custom, not default compute SA) | `roles/logging.logWriter`, `roles/monitoring.metricWriter`, `roles/monitoring.viewer`, `roles/stackdriver.resourceMetadata.writer`, `roles/artifactregistry.reader` | ACR `aks-pull` token + `acr-pull` docker-registry secrets in every namespace (image pull becomes node-identity based) |
| `cert-manager` | none for HTTP-01 (current); `roles/dns.admin` on the zone only if DNS-01 via Cloud DNS | — |
| `external-dns` | `roles/dns.admin` — only if Cloud DNS is adopted | inert annotations today |
| `kradle-controllers` (`kradle`, `kradle-staging`) | `roles/aiplatform.user` (assistant via Vertex), `roles/secretmanager.secretAccessor` (assistant keys, GitHub app secrets) | `kradle-assistant-keys` literal secret, Azure Foundry key |
| `atlas-webui`, `content-studio`, `aeq-server` | `roles/cloudsql.client` (if Cloud SQL), `roles/secretmanager.secretAccessor` | `atlas-postgres`, `content-studio-secrets`, `aeq-postgres` literals |

## 6. Blockers and open decisions

| # | Blocker | Exact symptom | Needed from owner |
|---|---|---|---|
| B1 | gcloud not authenticated | `invalid_grant: Bad Request` on token refresh for `tal@muskal.net` | Run §2 on this workstation (interactive browser login). |
| B2 | Owning account unknown | No local evidence of which Google account owns `boot-464019`; `GOOGLE_CLOUD_PROJECT` secret value cannot be read; `tal@muskal.net` may or may not have access | Confirm in Cloud Console IAM; grant §5.1 roles to the operator's account if needed. |
| B3 | ADC stale + no quota project | `Reauthentication required … reauth.googleapis.com API requires a quota project` | `gcloud auth application-default login` + `set-quota-project boot-464019` (§2.3). |
| B4 | SDK 4 years old, no GKE auth plugin | `gcloud version` 405.0.1; `gke-gcloud-auth-plugin` not on PATH | §2.1. Without it `kubectl` against GKE fails with `exec plugin: invalid apiVersion` / `executable gke-gcloud-auth-plugin not found`. |
| B5 | No GCP deploy identity in GitHub | org/repo have no WIF provider variables, no SA; `live-stack.yml:421` still says `GOOGLE_SERVICE_ACCOUNT_KEY` "not yet configured" | Create pool/provider/SAs (§5.2) — via terraform in the chosen IaC repo, not by hand. |
| B6 | Reuse audit incomplete | §3.1 empty | Run `raw/gcp/inventory.sh` after B1–B4 and update §3.1 before any `terraform apply`. |
| B7 | IaC home undecided | Two candidate roots (`infra-seed/terraform/cloud/gcp` vs. a new `infra/terraform/envs/gcp-boot`); `renderGke()` in the installer is a third, skeletal generator | Pick one root for the host layer (recommendation: `infra-seed/terraform/cloud/gcp`, already GCP-complete) and make the installer's GKE target consume its outputs (cluster name/region/project) rather than render its own cluster. |
| B8 | DNS stays at GoDaddy unless decided otherwise | `*.a5c.ai → 135.234.117.214` wildcard A record, apex on Vercel | Decide: keep GoDaddy (reserve a static IP in GCP, flip the single wildcard A record at cutover, no Cloud DNS API/roles needed) **or** delegate `a5c.ai` NS to Cloud DNS (enables external-dns/DNS-01; apex/Vercel records must be recreated there). |
| B9 | Billing | Cannot verify the billing account link | Confirm `gcloud billing projects describe boot-464019` shows `billingEnabled: true` after §2. |

No fallback was applied for any of these; the run stays blocked on B1–B4 for every step that touches GCP, and proceeds only with source-side work (workflow/chart/terraform changes in git) in the meantime.

## 3.1 Reuse audit results — boot-464019 (run 2026-09-16 after owner re-authenticated as tal@a5c.ai)

`raw/gcp/inventory.sh` executed; per-command JSON under `raw/gcp/`, summary in `raw/gcp/_summary.tsv`. The project is effectively **greenfield** for this migration:

| Area | Existing | Reuse? |
|---|---|---|
| IAM | `roles/owner` = user tal@a5c.ai; SAs: Compute default, `vertex-express@` (aiplatform.expressUser) | Owner works; create dedicated deploy/terraform SAs (do not reuse `vertex-express@`) |
| Network | `default` auto-mode VPC (42 auto subnets), 4 default firewall rules incl. `default-allow-ssh`/`-rdp` from 0.0.0.0/0; 0 routers/NAT, 0 static addresses, 0 forwarding rules | Create a dedicated VPC per design; tighten/ignore the default rules (or delete after the platform VPC exists) |
| GKE / Artifact Registry / Cloud SQL / Filestore / Memorystore / Cloud DNS / Secret Manager / Cloud Run / Functions / WIF pools | **APIs not enabled** (container, artifactregistry, sqladmin, file, redis, dns, secretmanager, run, cloudfunctions); 0 WIF pools | Nothing to reuse — all created by Phase B terraform |
| Storage | 1 bucket `a5c-videos` | Unrelated to this migration; keep |
| Vertex AI | API enabled; 0 endpoints/models (Gemini used via API, `generativelanguage` enabled) | Reuse for LLM lanes (D-7) |
| Logging/Monitoring | 2 default sinks (`_Required`, `_Default`), APIs enabled | Reuse; add alert policies + budget in terraform |
| Enabled APIs (44) | compute, iam, iamcredentials, aiplatform, logging, monitoring, storage, sql-component (not sqladmin), iap, oslogin, bigquery*, dataplex, notebooks, securitycenter, texttospeech, … | `sts.googleapis.com`, `cloudresourcemanager.googleapis.com`, `container`, `artifactregistry`, `secretmanager`, `sqladmin`, `serviceusage` (present) must be enabled by terraform first |
| Billing | not verifiable from this SDK (`gcloud billing` needs the `beta` component; SDK 405.0.1) | Verify in Cloud Console or after the SDK update |

**Workstation status after the owner's `gcloud auth login`:** active account `tal@a5c.ai`, `core/project=boot-464019`. **Still missing:** Application Default Credentials (`gcloud auth application-default login` + `set-quota-project boot-464019`) — required by terraform; SDK update + `gke-gcloud-auth-plugin` blocked by directory permissions (`C:\Program Files (x86)\Google\Cloud SDK`) — run `gcloud components update && gcloud components install gke-gcloud-auth-plugin` from an elevated shell.

## 3.2 Owner decisions received in chat (2026-09-16)

- Environments are **branch-tied**: no feature branch; babysitter-repo changes go to `staging` (staging envs) and are promoted to `main` (production). Downtime is acceptable.
- **kradle state is not important — only its initial (bootstrap) state.** Supersedes D-16/D-21: no CR export/import, no freeze window; GKE kradle starts from the chart bootstrap (admin org/user, sandbox repo) for both prod and staging.
- gcloud authenticated on this machine as tal@a5c.ai (project boot-464019 reachable).
