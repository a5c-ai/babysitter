# 01 — Azure inventory (subscription `794e33cd-…` + AKS `aks-hub-development-westus3-v2`)

Date: **2026-09-16**. Read-only survey with `az` (user `tmuskal@gmail.com`, Owner), `kubectl --context aks-hub-development-westus3-v2`, `helm`, `gh`, `nslookup`/`curl`. Raw command outputs live under [`raw/`](./raw/README.md) (Azure JSON in `raw/azure/`, cluster JSON in `raw/k8s/`, DNS/HTTP probes in `raw/dns/`, GitHub metadata in `raw/github/`). Machine-readable twin: [`01-azure-inventory.json`](./01-azure-inventory.json). This document extends and, where they disagree, supersedes [`00-discovery-snapshot.md`](./00-discovery-snapshot.md).

No secret **values** appear here or in `raw/`; secrets are referenced by namespace/name only (literal env values found in pod/deployment dumps were redacted to `<redacted>` before commit).

## 0. Headline findings (read these before planning)

1. **The AKS cluster is unrepairable in place.** `provisioningState = Failed`; both managed identities the cluster references (control-plane `aks-hub-development-westus3-v2-identity`, kubelet `aks-hub-development-westus3-v2-agentpool`) return `ResourceNotFound` and their principals do not exist in tenant `5aa70b65` (`az identity list` → 0). This is why Azure-disk PVCs hang forever (3 Pending PVCs), why `emptyDir` workarounds exist in the kradle controller, and why ARC runners and new LoadBalancer IPs cannot be provisioned. The hub Key Vault sits in tenant `85f6b733` — the fingerprint of a **subscription tenant transfer** that orphaned every identity. Kubernetes **1.30.12 is EOL** (only 1.34.x upgrades offered). Treat the cluster as a read-only source of *state* (etcd CRD objects, PV data), never as something to fix or clone.
2. **Only two systems are actively deployed from git today**: `kradle` (prod + staging) and `atlas` (prod + staging), both from `a5c-ai/babysitter` `.github/workflows/publish.yml` (last successful AKS deploys 2026-09-05 staging, 2026-08-13 main). `content-studio` (a5c-ai/company, workflow disabled), `babysitter-web-staging` (a5c-ai/claude-web, Apr 2026), `aeq` (a5c-ai/askExpertQuestion, workflow failing since Aug 2026), `a5c-app` (a5c-ai/a5c, manual script, 2025), `hub` (a5c-ai/hub, 2025, backend 0/3) and `osb` (a5c-ai/osb, Feb 2026) are stale or broken.
3. **Every AI consumer is already broken**: all 7 Cognitive/AI accounts have **0 deployments** (re-verified today) while kradle (`kradle-assistant-keys`), content-studio (`AZURE_OPENAI_ENDPOINT`), osb (`ANTHROPIC_FOUNDRY_*`), geekonomy-transcriber and 12+ GitHub workflows still point at them.
4. **DNS is a GoDaddy wildcard**: `*.a5c.ai → 135.234.117.214` (any label resolves; verified with a random one); the apex `a5c.ai → 76.76.21.21` (Vercel), not the Azure static web app that still claims the custom domain.
5. **Persistent data that must be exported from Azure**: atlas prod/staging + content-studio Postgres (3 Azure Files shares in `a5catlaspg794e33cd`), aeq Azure Postgres `aeqpg0316203042`, kradle CRD objects (etcd, both namespaces), a5c-app Postgres disks (prod/staging), hub 100 Gi Postgres disk + 1 TiB repositories share, litellm spend-log Postgres ×2, geekonomy Postgres, **Terraform state in `a5ctfstorage`**, `babysitterarchive2608/trial-telemetry`, mantis evidence containers. Everything else is ephemeral or dead.
6. **Sources not found in git** (owner answer needed): geekonomy stack, tb-fleet VMs, `babysitter-benchmarks` + `a5c-proxy-894866` static apps, `promoted-idle-a1cef5` web app, mantis album/odoo storage, `babysitterarchive2608`, litellm config.

## 1. Executive table

| System | Azure resources (RG) | Cluster namespaces | Hostnames | State / persistence | Health (today) | Git origin · last deploy |
|---|---|---|---|---|---|---|
| **kradle-prod** | ACR repos `kradle-controller`, `kradle-web`, `adapters-agent`, `jitsi-agent-sidecar` (rg-hub…); secret `kradle-assistant-keys` → Azure Foundry | `kradle`, `kradle-org-a5c-ai`, `kradle-org-default`, `kradle-org-knack`, `kradle-org-commander-verify` | kradle.a5c.ai, gitea.kradle.a5c.ai, meet.kradle.local | ~95 `kradle.a5c.ai` CRD kinds in etcd; Gitea on **emptyDir**; prosody PVC 3G **Pending**; dispatch Jobs emptyDir | degraded — api/web/controllers/webhook/gitea/jitsi 1/1, prosody 0/1; prod web → `atlas-staging` | a5c-ai/babysitter `publish.yml#deploy_kradle` + `packages/kradle/charts` · helm rev 1 **2026-08-13**, image `21ded0e5` (= tag `babysitter/main/v6.0.3`) |
| **kradle-staging** | same ACR repos | `kradle-staging` | kradle-staging.a5c.ai, gitea.kradle-staging.a5c.ai | same; extra runtime secret `kradle-gitea-agent-token`, legacy `krate-tls` | degraded (prosody 0/1) | same · helm rev 1 **2026-09-05**, image `57b13a4c` (= origin/staging HEAD) |
| krate-legacy-residue | ACR `krate-controller`, `krate-web` | `krate-org-a5c-ai`, `krate-org-default` (empty) | – | 100 `krate.a5c.ai` CRDs | residue | pre-rename chart, gone from tree |
| **atlas-prod** | ACR `atlas-webui`; storage `a5catlaspg794e33cd` share `atlas-atlas-postgres` 8 GB | `atlas` | atlas.a5c.ai | PG16 sts on Azure Files (static PV, Retain) | healthy (200) | a5c-ai/babysitter `publish.yml#deploy_atlas_webui` · **2026-08-13** `b3c3cd97` |
| **atlas-staging** | share `atlas-staging-atlas-postgres` 8 GB | `atlas-staging` | atlas-staging.a5c.ai | PG16 on Azure Files | healthy, probe timeouts (rev 1515) | same · **2026-09-05** `57b13a4c` |
| **content-studio** | ACR `content-studio` + token `content-studio-ci`; share `content-studio-postgres` 8 GB (in the *atlas* account); Azure OpenAI `a5c-sw-resource` | `content-studio` | studio.a5c.ai | PG16 on Azure Files | running (307→auth); AI calls broken | a5c-ai/company `apps/content-studio/deploy/k8s` + `content-studio-deploy.yml` (**disabled**) · **2026-07-01** `589e29f73f93` |
| **babysitter-web-staging** | ACR `babysitter-web`, `babysitter-web-runner` (+ dead `claude-web*`); SPN `claude-web-acr-push` | `staging` | staging.web.a5c.ai | bundled PG16 + Redis **no PVC → ephemeral** | healthy (200), stale | a5c-ai/claude-web chart `babysitter-web 1.1.0` · helm rev 15 **2026-04-12** `staging-18addbf7` |
| **a5c-app-prod** | ACR `a5c-app`; disks 10 Gi + 1 Gi | `app` | app.a5c.ai, app-jaeger.a5c.ai | PG15 sts 10 Gi disk; redis sts 1 Gi | partial — app 2/2, **redis 0/1** | a5c-ai/a5c `scripts/deploy-azure.sh` (manual) · rev 1404, image `369bdcaf3dc0` |
| **a5c-app-staging** | ACR `a5c-app`, `a5c-install`; disks 10 Gi + 1 Gi | `app-staging` | app-staging.a5c.ai, app-jaeger-staging.a5c.ai, install-staging.a5c.ai (no TLS) | PG15 10 Gi | partial — app **1/2**, redis 0/1, install 2/2 | same · `21bf6e7df269`, install `20250913172226` |
| **aeq** (askExpertQuestion / bmux) | Azure PG `aeqpg0316203042` (db `aeq`); ACR `aeq-server/-dashboard/-mcp`, `bmux-server`; SPN `askExpertQuestion-github-actions` (**Contributor + UAA on subscription**) | `aeq` | bmux.a5c.ai (aeq.a5c.ai → 404, no ingress) | Azure PG (SSL); PVC `aeq-data-pvc` 1 Gi **Pending since 2026-03-24** | healthy 1/1 ×4 | a5c-ai/askExpertQuestion `k8s/*.yaml`, `deploy.yml` (failing since 2026-08-08), `terraform.yml` (failing since 2026-03-24) · images Mar–Apr 2026 |
| **hub** | AKS/VNet/ACR/LA/KV terraform (tags `ManagedBy=terraform Project=hub`); Azure PG `psql-hub-development-westus3-v2` (**unreferenced**); storage `sthubdevelopmentwestu3v2`; KV `kv-hubdevelopmentwest3v2` (foreign tenant); disks 100 Gi + 10 Gi Premium; 1 TiB Azure Files share; tfstate in `a5ctfstorage` | `hub-development`, `hub` (empty) | hub.a5c.ai | in-cluster PG15 100 Gi, redis 10 Gi, repos 1 TiB RWX | **broken** — backend 0/3 (rev 149), frontend 2/2 | a5c-ai/hub terraform + `scripts/deploy.sh` · images `1b76672-dirty`, last CI 2025-08-22 |
| osb-staging | – (ghcr image); `osb-secrets` → Foundry names | `osb-staging` | – | none | idle 1/1 (`sleep infinity`) | a5c-ai/osb `cd.yml` · 2026-02-22 `master-b0370ba` |
| arc-runners | – | `arc-systems`, `arc-runners`, `actions-runner-system` | – | `github-secret`; work PVC class `managed-csi-premium` (cannot provision) | idle, 0 runners | a5c-ai/hub `runners/README.md` manual helm · rev 39 2025-08-22 |
| platform-addons | LB frontends 135.234.117.214 + **134.33.26.182 (unused addon)**; LA Container Insights; azurepolicy addon | `ingress-nginx`, `cert-manager`, `kyverno`, `vela-system`, `gatekeeper-system`, `app-routing-system`, `aks-command`, `kube-system` | – | 3 ClusterIssuers (HTTP-01) | nginx/cert-manager OK; **kyverno release failed**; vela absent; gatekeeper 0 constraints | manual helm + kradle chart subcharts; a5c-ai/infra `envs/azure-dev` (never applied) |
| aks-cluster-and-hub-rg | AKS (Failed), VMSS 4×D2s_v5, LB, 3 PIPs, VNet 10.0.0.0/16 (aks/db/pe/appgw subnets), 3 NSGs, orphan AppGW PIP `4.242.238.192` + WAF policy, 2 private DNS zones, LA ×2 (+3 solutions), App Insights + DCR + action group | all | API `hub-dev-7zjxqq33.hcp.westus3.azmk8s.io` (public, local accounts) | etcd | running but unrepairable | a5c-ai/hub `terraform/environments/development` |
| acr-hub-registry | `acrhubdevelopmentwestus3` Standard, 63.9/100 GB, 24 repos, admin user on, tokens `aks-pull`, `content-studio-ci` | – | acrhubdevelopmentwestus3.azurecr.io | 8 dead repos | n/a | a5c-ai/hub terraform; images from 5 repos' workflows |
| ai-accounts | 7 Cognitive accounts (+4 projects) in rg-tmuskal-7935/-9340/personoids — **0 deployments each**; App Insights `ai`; LA `DefaultWorkspace-cb17b37c` | – | *.cognitiveservices.azure.com | – | empty shells; all consumers broken | portal-created |
| litellm-archive | rg-litellm-proxy: PG `litellm-pgdb`, `litellm-pgdb2`, storage `stlitellmproxy2026` (6 shares + `$web`) | – | – | spend-log archive | archive | not found (candidates a5c-ai/mantis, mantis-proxy) |
| geekonomy | geekonomy-prod (northeurope): 3 Container Apps + job + env, ACR Basic 7.5 GB, PG16, Redis C0, LA | – | geekonomy-web.yellowwater-3ed650dd.northeurope.azurecontainerapps.io (200) | Azure PG + Redis | running (scale-to-zero); transcriber → dead Azure OpenAI | **not found in a5c-ai** · images 2026-01-12 |
| personoids-residue | personoids_sponsorship (3 KVs in 2 foreign tenants, 3 storage, 3 AI accounts, 6 ML workspaces + 4 serverless endpoints, Grafana, monitor ws, 6 Prometheus rule groups, alerts, VNet, `documentdb` connection, SWA); DNS zone `i.personoids.com`; DefaultResourceGroup-* ; MA_*; NetworkWatcherRG | – | *.i.personoids.com → 52.183.102.215 (dead) | idle | residue | none |
| static-sites | SWA `a5c-website` (GitHub a5c-ai/a5c-website; custom domain a5c.ai — stale), `a5c-proxy-894866` (SWA CLI), `babysitter-benchmarks` (SWA CLI, 2026-08-18), `intuitive-website-new` (a5c-labs repo, never deployed), personoids `a5c-website`; `$web` storage `a5cstatic` (404), **`mantisb131bfc8` (new 2026-09-11)**, `stlitellmproxy2026` | – | *.azurestaticapps.net | – | reachable; apex a5c.ai served by **Vercel** | a5c-ai/a5c-website `azure-static-web-apps.yml`; others not found |
| web-app-promoted-idle | rg-promoted-idle: `promoted-idle-a1cef5` (F1 Linux Node 20) | – | promoted-idle-a1cef5.azurewebsites.net | – | no HTTP response | not found |
| dev-vms | `a5c-dev-vm`, `a5c-dev-vm-2` (E8s_v5), `ubuntu-large-02` (E4s_v5), `vm-odoo-validation` (D4s_v5, `auto-delete-after=2026-07-16` expired) + Premium OS disks, 3 PIPs, NSGs, VNets; mantis-odoo storage ×2 (`evidence`), SPN `vm-odoo-validation` | – | 20.110.38.197, 20.94.74.76, 20.110.105.86 | disks retained | all deallocated | none |
| tb-fleet | rg-tb-fleet-{0,1,2,4,5,6,7,8}: D4ads_v5 VM + Premium disk + PIP + NSG + VNet + ext `terminal-bench-bootstrap`; rg-tb-fleet-3 empty | – | 8 PIPs | – | deallocated since 2026-08-11 | not found |
| archives-and-tfstate | `babysitterarchive2608` (GRS Cool, `trial-telemetry`); **`a5ctfstorage` (`tf-main`, `tfstate` = hub terraform state)**; `a5c-mantis-workshop` empty RG | – | – | – | archive | a5c-ai/hub `scripts/first_init.sh` (tfstate) |
| monitoring | LA ×5, App Insights ×2, Monitor ws ×2, Grafana, Prom rule groups ×6, DCR ×5, DCE ×3, alerts ×5, action groups ×3; Advisor 132 recs | `kube-system` ama-logs | – | – | n/a | hub terraform / portal |

Resource-type totals (202 resources, 33 RGs): 18 disks · 15 NSGs · 15 public IPs · 14 VNets · 13 storage accounts · 12 VMs (+8 extensions) · 12 NICs · 7 Cognitive accounts (+4 projects) · 6 Prometheus rule groups · 6 ML workspaces (+4 serverless endpoints) · 5 Postgres flexible servers · 5 DCRs · 5 network watchers · 5 Log Analytics · 5 static web apps · 4 Key Vaults · 3 Container Apps (+1 job +1 env) · 3 DCEs · 3 OMS solutions · 2 ACRs · 2 App Insights · 2 private DNS zones (+2 links) · 2 Monitor accounts · 2 metric alerts · 2 smart detectors · 3 action groups · 1 each: AKS, VMSS, LB, Redis, DNS zone, WAF policy, Grafana, activity-log alert, web app, app-service plan, API connection.

## 2. The cluster (`aks-hub-development-westus3-v2`)

| Property | Value (verified) |
|---|---|
| RG / region / SKU | `rg-hub-development-westus3` / westus3 / Base **Free** tier |
| Kubernetes | 1.30.12 (EOL); `az aks get-upgrades` offers only 1.34.0–1.34.10 |
| provisioningState / powerState | **Failed** / Running |
| Node pool | `default` System, Standard_D2s_v5 ×4 (autoscale 1–6), 128 GB OS, maxPods 30, no zones; VMSS `aks-default-28513622-vmss`; allocatable 1900m CPU / 7.0 GiB per node |
| Identity | UserAssigned → `aks-hub-development-westus3-v2-identity` **ResourceNotFound**; kubelet `…-agentpool` **ResourceNotFound**; OIDC issuer off; workload identity off; local accounts on; no AAD; API server public, no authorized ranges |
| Network | Azure CNI + Azure NPM, service CIDR 10.1.0.0/16, node subnet 10.0.1.0/24, outbound via LB PIP 20.14.43.47 |
| Addons | azureKeyvaultSecretsProvider (0 `SecretProviderClass`), azurepolicy (gatekeeper v3.23.1, 0 templates/constraints), omsagent (ama-logs 3.3.0 → LA `aks-hub-development-westus3-v2-logs`), extensionManager; ingressApplicationGateway **disabled** (AppGW deleted 2026-04-19); webAppRouting disabled but `app-routing-system/nginx` still runs with LB 134.33.26.182 |
| Ingress | `ingress-nginx` 4.13.1 (controller v1.13.1, **1 replica**) LB **135.234.117.214**, IngressClass `nginx`; dangling classes `webapprouting.kubernetes.azure.com`, `azure-application-gateway` |
| TLS | cert-manager v1.15.3; ClusterIssuers `letsencrypt-prod`, `letsencrypt-production`, `letsencrypt-staging` (all Ready, HTTP-01); 14 Certificates, 13 Ready (see §4.10) |
| Storage classes | disk CSI: `default` (StandardSSD, default), `managed`, `managed-csi`, `managed-csi-premium`, `managed-premium`; file CSI: `azure-files` (WaitForFirstConsumer), `azurefile`, `azurefile-csi`, `azurefile-csi-premium`, `azurefile-premium`, `content-studio-azurefile`; static: `atlas-postgres-static`, `content-studio-postgres-static` (no-provisioner) |
| Helm | kradle@kradle rev1 2026-08-13 · kradle@kradle-staging rev1 2026-09-05 · babysitter-web-staging rev15 2026-04-12 · arc-controller 0.12.1 rev4 · hub-dev-runners rev39 (36–37 failed) · cert-manager rev1 · ingress-nginx rev3 · **kyverno 3.8.1 rev2 FAILED** (both revisions "context deadline exceeded") · 2 AKS-managed addon releases |
| CRD groups | `krate.a5c.ai` 100, `kradle.a5c.ai` 99, `policies.kyverno.io` 11, `core.oam.dev` 11 (KubeVela, no controller running), kyverno 7+2+2, gatekeeper 20, `actions.summerwind.dev` 5 (legacy ARC), `actions.github.com` 4, cert-manager 6, snapshot 3, secrets-store 2, aks/azurepolicy/approuting/appgw 5 |
| Webhooks | aks-node, azure-policy, cert-manager, gatekeeper (mutating+validating), ingress-nginx-admission, kyverno ×10 |
| Node load | vmss000000 **2000m/1900m (105 %)** CPU, 75 % mem; vmss000001 20 %/61 % (9 OOMKilling events); vmss000002 41 %/58 %; vmss000005 10 %/49 % (6 OOMKilling; 3 pods stuck) |
| Requests by ns (m / Mi) | kube-system 2840/5698 · hub-development 1300/1408 · app-routing-system 1000/254 · app 350/1664 · staging 350/704 · kyverno 325/320 · gatekeeper 300/768 · app-staging 250/1152 · aeq 200/256 · osb 100/512 · ingress-nginx 100/90 · content-studio 10/256 · kradle, kradle-staging, atlas, atlas-staging, cert-manager, arc **0/0 (no requests set)** |

Namespaces (32): `actions-runner-system` `aeq` `aks-command` `app` `app-routing-system` `app-staging` `arc-runners` `arc-systems` `atlas` `atlas-staging` `cert-manager` `content-studio` `default` `gatekeeper-system` `hub` `hub-development` `ingress-nginx` `kradle` `kradle-org-a5c-ai` `kradle-org-commander-verify` `kradle-org-default` `kradle-org-knack` `kradle-staging` `krate-org-a5c-ai` `krate-org-default` `kube-node-lease` `kube-public` `kube-system` `kyverno` `osb-staging` `staging` `vela-system`.

### 2.1 Persistent volumes

| Namespace / PVC | Status | Class | Size | Backing |
|---|---|---|---|---|
| atlas / data-atlas-postgres-0 | Bound | atlas-postgres-static | 8 Gi RWX | Azure Files share `atlas-atlas-postgres` @ `a5catlaspg794e33cd` (PV Retain) |
| atlas-staging / data-atlas-postgres-0 | Bound | atlas-postgres-static | 8 Gi RWX | share `atlas-staging-atlas-postgres` @ `a5catlaspg794e33cd` |
| content-studio / data-content-studio-postgres-0 | Bound | content-studio-postgres-static | 8 Gi RWX | share `content-studio-postgres` @ **`a5catlaspg794e33cd`** |
| hub-development / hub-database-pvc | Bound | managed-premium | 100 Gi | disk `pvc-59ccf124…` Premium (MC RG) |
| hub-development / hub-redis-pvc | Bound | managed-premium | 10 Gi | disk `pvc-f9e96cba…` Premium |
| hub-development / hub-repositories-pvc | Bound | azure-files | **1 Ti** RWX | share `pvc-7c8e1234…` @ `fc3e7eef89d6645fbae772d` (MC RG; reclaim Delete) |
| app / data-a5c-app-postgres-0 | Bound | default | 10 Gi | disk `pvc-66704332…` StandardSSD |
| app / data-a5c-app-redis-0 | Bound | default | 1 Gi | disk `pvc-0dde3922…` |
| app-staging / data-a5c-app-postgres-0 | Bound | default | 10 Gi | disk `pvc-c3ee816e…` |
| app-staging / data-a5c-app-redis-0 | Bound | default | 1 Gi | disk `pvc-1cd94e10…` |
| aeq / aeq-data-pvc | **Pending** (2026-03-24) | managed-csi | 1 Gi | never provisioned |
| kradle / prosody-data-kradle-prosody-0 | **Pending** | default | 3 G | `ProvisioningFailed: context deadline exceeded` |
| kradle-staging / prosody-data-kradle-prosody-0 | **Pending** | default | 3 G | same |

### 2.2 Secrets referenced by workloads vs. ownership

Chart-owned (helm manifest): kradle → `acr-pull`, `kradle-assistant-keys`, `kradle-kradle-auth`, `kradle-kradle-gitea-admin`, `kradle-kradle-jitsi-jwt`, `kradle-prosody{,-jibri,-jicofo,-jigasi,-jvb,-transcriber}`; babysitter-web-staging → only `babysitter-web-staging-secrets-placeholder`. cert-manager-owned TLS: `aeq-tls`, `app-azure-ssl-certificate` ×2, `atlas-webui-tls` ×2, `content-studio-tls`, `hub-azure-ssl-certificate`, `kradle-tls` ×2, `kradle-gitea-tls` ×2, `babysitter-web-staging-tls`.

**Referenced but owned by no chart (created by workflows or by hand — each needs a source in the target):** `aeq/{acr-pull-secret, aeq-postgres, aeq-secrets}`, `app/{a5c-app-secret, a5c-app-pg-secret, a5c-app-redis}`, `app-staging/{a5c-app-secret, a5c-app-pg-secret, a5c-app-redis, app-secret}`, `atlas*/{acr-pull, atlas-auth, atlas-postgres, atlas-postgres-azure-file}` (+ `atlas-staging/atlas-webui-auth`), `content-studio/{acr-pull, content-studio-secrets, content-studio-postgres, content-studio-azure-file}`, `hub-development/{acr-auth, hub-secrets, azure-storage-account-fc3e7eef89d6645fbae772d-secret}`, `osb-staging/{ghcr-pull-secret, osb-secrets}`, `staging/{acr-secret, babysitter-web-staging-secrets, -postgresql, -redis}`, `arc-runners/github-secret`, `kradle-staging/kradle-gitea-agent-token` (runtime self-heal; optional in prod), `kradle-org-a5c-ai/{acr-pull, kradle-assistant-keys}` (copied by the controller). Unreferenced leftovers: `staging/claude-web-staging-*` ×5, `kradle-staging/krate-tls`, `vela-system/*` ×2, `app-staging/a5c-app-jaeger-tls`. `kube-system/ama-logs-rs` references `ama-logs-adx-secret`, which does not exist.

## 3. DNS and public surface

- `a5c.ai` NS = `ns41/ns42.domaincontrol.com` (GoDaddy). Apex and `www` → **76.76.21.21 (Vercel)**. **Wildcard `*.a5c.ai` → 135.234.117.214** (random label resolves; so `chat`, `docs`, `benchmarks`, `geekonomy`, `intuitive`, `web`, `aeq`.a5c.ai all hit ingress-nginx's default backend). No external-dns controller runs; the `external-dns.alpha.kubernetes.io/hostname` annotations on 14 ingresses are inert.
- HTTPS probes (raw/dns/http-probes.tsv): app 307 · app-staging 307 · install-staging 200 · bmux 307 · aeq **404** · atlas 200 · atlas-staging 200 · studio 307 · hub 200 · kradle 307 · gitea.kradle 200 · kradle-staging 307 · gitea.kradle-staging 200 · staging.web 200 · a5c.ai 200 (Vercel) · geekonomy container app 200 · promoted-idle **000** · 5 SWAs 200/302 · `a5cstatic` $web 404.
- `i.personoids.com` (Azure DNS, 17 record sets): A `gengenai`, `main-api`, `main-personoids-api`, `main-personoids-ui`, `main-ui` → 52.183.102.215 (cluster deleted 2026-04-19) + 10 externaldns TXT owner records.
- Private DNS: `privatelink.blob.core.windows.net`, `privatelink.vaultcore.azure.net` linked to `vnet-hub-development-westus3` (1 record each).

## 4. Per-system detail

### 4.1 kradle (prod `kradle`, staging `kradle-staging`, org namespaces)
- Images: `acrhubdevelopmentwestus3.azurecr.io/kradle-controller` and `/kradle-web` — prod tag `21ded0e52f96e1f49c735b66dc494883ecead408` (commit exists on `origin/main`, tagged `babysitter/main/v6.0.3-21ded0e52f96`, 2026-08-13), staging tag `57b13a4c535633fef005e1660996cfdb3629fbbd` (= `origin/staging` HEAD, 2026-09-05). Third-party: `gitea/gitea:1.22-rootless`, `jitsi/{web,jicofo,jvb,prosody}:stable-10590`. Dispatch jobs: `adapters-agent:<sha>` (also `yolo-test`, `y2`, `latest`).
- Workloads per env: Deployments `kradle-kradle-api` (`node bin/kradle-server.mjs --port=3080`), `-controllers`, `-webhook-worker`, `-web`, `-gitea`, `kradle-jitsi-subchart-{web,jicofo,jvb}` (all 1/1); StatefulSet `kradle-prosody` 0/1 (PVC Pending). Services ClusterIP except `kradle-jitsi-subchart-jvb` NodePort 10000/UDP. Ingresses (nginx, letsencrypt-production): `kradle.a5c.ai`, `gitea.kradle.a5c.ai` (proxy-body-size 512m), plus class-less `meet.kradle.local`.
- Config (non-secret): `KRADLE_NAMESPACE`, `KRADLE_KUBEVELA_NAMESPACE=vela-system`, `KRADLE_KYVERNO_NAMESPACE=kyverno`, `KRADLE_KYVERNO_POLICY_NAMESPACE=kradle-system`, `KRADLE_GITEA_HTTP_URL=http://kradle-kradle-gitea-http.<ns>.svc.cluster.local:3000/kradle`, `KRADLE_CONTROLLER_URL`, `KRADLE_CALLBACK_URL`, **prod `ATLAS_BASE_URL=http://atlas-webui.atlas-staging.svc.cluster.local`**. Helm values (redacted shape in `raw/k8s/helm-values-redacted-kradle-*.json`): `gitea.persistence.type=emptyDir`, `externalDependencies.kyverno.enabled=true`, `image.pullPolicy=Always`.
- State: CRDs `kradle.a5c.ai` (99) with objects (Repository/Org/User/Run/Dispatch/…) in etcd for both envs; Gitea repos on emptyDir (lost on restart); org namespaces `kradle-org-a5c-ai` (helm-labelled, 10 dispatch Jobs Jun–Jul 2026: 7 succeeded/3 failed), `kradle-org-default`, `kradle-org-knack` (2026-09-01), `kradle-org-commander-verify`; Kyverno ClusterPolicy `knack-manual-dispatch-only` (no ready status).
- Origin: `a5c-ai/babysitter` `.github/workflows/publish.yml` job `deploy_kradle` (lines ≈2205–2544: `azure/login`, `az acr login`, buildx push, `KUBE_CONFIG`, `acr-pull` secret from scope-map token, `kradle-assistant-keys` with Azure Foundry endpoint, `helm upgrade --install` of `packages/kradle/charts` with `--set image.*.repository/tag`, `global.imagePullSecrets[0].name=acr-pull`), plus vendored `packages/kradle/core/.github/workflows/publish.yml`. Chart deps: `jitsi-meet-1.5.2.tgz`, `kyverno-3.8.1.tgz`, `vela-core-1.10.8.tgz`. CD active (staging run 33971785709 → Deploy Kradle To AKS success, Kradle E2E Smoke Test success, G0-RT Live Jitsi E2E skipped).

### 4.2 atlas (prod `atlas`, staging `atlas-staging`)
- Image `atlas-webui:<40-char sha>` (22 tags, all SHAs); prod `b3c3cd97…` (main 2026-08-13, deployment rev 34), staging `57b13a4c…` (rev **1515** — every staging publish rolls it). Job `atlas-webui-db-init` (succeeded). StatefulSet `atlas-postgres` `postgres:16-alpine` 1/1 on static PV (`file.csi.azure.com`, share `<ns>-atlas-postgres` in `a5catlaspg794e33cd`, class `atlas-postgres-static`, Retain).
- Ingress nginx `atlas.a5c.ai` / `atlas-staging.a5c.ai`, TLS `atlas-webui-tls` letsencrypt-production (exp 2026-11-27 / 2026-12-02). Health: 200; staging shows liveness/readiness `context deadline exceeded` warnings.
- Secrets (workflow-created): `acr-pull`, `atlas-auth`, `atlas-postgres`, `atlas-postgres-azure-file`; staging also `atlas-webui-auth`.
- Origin: `a5c-ai/babysitter` `publish.yml` job `deploy_atlas_webui` (≈1748–2203): heredoc manifests; provisions the storage account `a5catlaspg<sub-hash>` via `az storage account create` / `keys list` / `share create --quota 8` unless `ATLAS_POSTGRES_STORAGE_ACCOUNT`/`_KEY` are set; static PV + `atlas-postgres-static`. Related: `packages/atlas/webui`, tests `packages/atlas/webui/tests/atlas-deploy-postgres-workflow.test.ts`. Note `Publish Foundation - atlas` job failed in the latest staging run.

### 4.3 content-studio (`content-studio`)
- Image `content-studio:589e29f73f93` (a5c-ai/company main 2026-07-01 "Add warm launch red-team reviews…"), deployment rev 50, 1/1; `content-studio-postgres` `postgres:16-alpine` on static PV `content-studio-postgres-pv` (share `content-studio-postgres` in **`a5catlaspg794e33cd`**). Ingress `studio.a5c.ai` (307 → auth), TLS letsencrypt-production exp 2026-11-06.
- Env: `NEXTAUTH_URL=https://studio.a5c.ai`, `STORAGE_BACKEND`, `KNOWLEDGE_BACKEND`, `AZURE_OPENAI_ENDPOINT=https://a5c-sw-resource.openai.azure.com/openai`, `AZURE_OPENAI_MODEL=gpt-5.4` (**no such deployment exists**), `CS_GITHUB_REPO/WORKFLOW/REF`. Secrets `content-studio-secrets`, `content-studio-postgres`, `content-studio-azure-file`, `acr-pull`.
- Origin: `a5c-ai/company` `apps/content-studio/deploy/k8s/{app,postgres,postgres-pv}.yaml` (`envsubst` + `kubectl apply`), `.github/workflows/content-studio-deploy.yml` (needs `ACR_TOKEN_USER/PASSWORD`, `KUBE_CONFIG`, var `AZURE_ACR_NAME`; context `aks-hub-development-westus3-v2-admin`) — **disabled_manually**; runbook `docs/content-studio/deploy-runbook.md`. ACR token `content-studio-ci` (scope-map push/pull on `content-studio`).

### 4.4 babysitter-web-staging (`staging`)
- Helm `babysitter-web-staging` chart `babysitter-web-1.1.0` rev 15 (2026-04-12). Deployments `babysitter-web-staging` 2/2 (HPA 1–3, rev 23) image `babysitter-web:staging-18addbf7…`, `-postgresql` `postgres:16-alpine`, `-redis-master` `redis:7-alpine` — **no PVC in the namespace** (ephemeral data). NetworkPolicy enabled. Ingress `staging.web.a5c.ai` (letsencrypt-prod issuer, 200).
- Values (redacted shape): `config.appUrl`, `runner.image.repository=…/babysitter-web-runner` (no runner workload exists), `stagingPostgresql.enabled`, `stagingRedis.enabled`. Secret `babysitter-web-staging-secrets` keys: `DATABASE_URL`, `REDIS_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ANTHROPIC_API_KEY`, `S3_ENDPOINT/ACCESS_KEY/SECRET_KEY/BUCKET`.
- Origin: `a5c-ai/claude-web` (private; workflows `deploy-staging.yml` — last runs **failed 2026-04-12**, `deploy-production.yml`, `byod-runner.yml`); SPN `claude-web-acr-push`. Legacy `claude-web*` ACR repos and `claude-web-staging-*` secrets are the pre-rename residue.

### 4.5 a5c-app (`app`, `app-staging`)
- Prod: `a5c-app:369bdcaf3dc0` 2/2 (rev **1404**), `a5c-app-jaeger` (`jaegertracing/all-in-one:1.51`), `a5c-app-otel-collector` (`otel/opentelemetry-collector-contrib:0.98.0`), sts `a5c-app-postgres` `postgres:15-alpine` 10 Gi disk, sts `a5c-app-redis` `bitnami/redis:7.2` **0/1** (pod waiting on node vmss000005 since 2025-11-09). Ingresses `app.a5c.ai`, `app-jaeger.a5c.ai` (TLS `app-azure-ssl-certificate`, exp 2026-11-20).
- Staging: `a5c-app:21bf6e7df269` **1/2** (second pod waiting since 2026-02-27), `a5c-install:20250913172226` 2/2 (ingress `install-staging.a5c.ai`, **no TLS**), jaeger/otel 1/1, postgres 1/1 (10 Gi), redis 0/1. Extra secrets `app-secret`, `a5c-app-jaeger-tls`; configmap `app-config`.
- Origin: `a5c-ai/a5c` (public, last push 2025-12-21) `scripts/deploy-azure.sh` per snapshot; no workflow deploys it (repo workflows: Release, Dependabot, CodeQL). Tag format 12-char short SHA (repo not cloned locally; unverified).

### 4.6 aeq — askExpertQuestion / bmux (`aeq`)
- `aeq-server:4f1f1b99…` (rev 93), `aeq-dashboard:54a0641b…` (rev 80), `aeq-mcp:54a0641b…` (rev 38), `bmux-server:54a0641b…` (rev 2) — all 1/1, all 40-char SHAs. Ingress `aeq-ingress` host **bmux.a5c.ai** (TLS `aeq-tls`, exp 2026-11-17); `aeq.a5c.ai` no longer has an ingress (404 via wildcard).
- Backing: Azure PG `aeqpg0316203042` (PG16, B1ms, 32 GB, 7-day backup, public access, firewall `AllowAllAzureServicesAndResourcesWithinAzureIps`), db `aeq`; `AEQ_DATABASE_SSL=true`, `BMUX_PUBLIC_URL=https://bmux.a5c.ai`; credentials in secret `aeq-postgres`; PVC `aeq-data-pvc` (1 Gi managed-csi) Pending since 2026-03-24.
- Origin: `a5c-ai/askExpertQuestion` (private) `k8s/*.yaml`, `infra/terraform` (azurerm), workflows `deploy.yml` (last runs failed 2026-08-08), `terraform.yml` (failing since 2026-03-24). Its SPN `askExpertQuestion-github-actions` (appId `610b95c2-…`) holds **Contributor + User Access Administrator on the subscription** + AcrPush — almost certainly the org-wide `AZURE_APPLICATION_CLIENT_ID` used by every Azure deploy.

### 4.7 hub (`hub-development`, `hub`)
- `hub-backend:1b76672-dirty` **0/3** (rev 149, containers never ready; HPA 3–10 cannot read metrics), `hub-frontend:1b76672-dirty` 2/2, `postgresql` `postgres:15-alpine` 1/1 (PVC 100 Gi Premium), `redis` `redis:7-alpine` 1/1 (10 Gi Premium), `hub-repositories-pvc` 1 TiB Azure Files. Ingress `hub.a5c.ai` (200 = frontend shell), Certificate `hub-azure-ssl-certificate` Ready=False while duplicate `hub-tls` Ready=True (same secret).
- Config `hub-config`: `DB_HOST=postgresql` (in-cluster), `REDIS_HOST=redis`, `BACKEND_URL=https://hub.a5c.ai/api`, `GIT_DATA_PATH=/repositories`. **Azure PG `psql-hub-development-westus3-v2` (dbs `hub`, `hub_test`) is not referenced anywhere and has no firewall rules.** Storage `sthubdevelopmentwestu3v2` containers `artifacts`, `backups`, `packages`, `repositories` (last modified 2025-08-22). KV `kv-hubdevelopmentwest3v2` (tenant 85f6b733, RBAC, purge protection) unreadable.
- Origin: `a5c-ai/hub` (public, last push 2025-09-08): `terraform/environments/development` + `terraform/modules/aks` created the cluster, VNet, PG, KV, storage, LA, App Insights, DCR (tags `ManagedBy=terraform`, `Owner=hub-development-team`, `Project=hub`); state backend `a5ctfstorage` (`tf-main`, `tfstate`; see `scripts/first_init.sh`); `scripts/deploy.sh`; workflows `infrastructure.yml` (last success 2025-08-22), `main.yml`; `runners/README.md` (ARC). `-dirty` tags mean the running images were built from an uncommitted worktree and cannot be reproduced from git.

### 4.8 osb-staging, ARC runners, platform add-ons
- `osb-staging/osb-cli` `ghcr.io/a5c-ai/osb/benchmark-cli:master-b0370ba` 1/1, command `sleep infinity`; secrets `ghcr-pull-secret`, `osb-secrets` (`ANTHROPIC_API_KEY`, `ANTHROPIC_FOUNDRY_API_KEY`, `ANTHROPIC_FOUNDRY_RESOURCE`, `ANTHROPIC_DEFAULT_SONNET_MODEL`), configmap `osb-config`. Origin `a5c-ai/osb` `cd.yml`/`build-images.yml` (2026-02-22).
- ARC: `arc-systems/arc-controller-gha-rs-controller` 0.12.1; `arc-runners/hub-dev-runners` AutoscalingRunnerSet (`https://github.com/a5c-ai`, min 0 / max 20, runner image `ghcr.io/actions/actions-runner:2.328.0`, containerMode kubernetes, work PVC 10 Gi `managed-csi-premium`), 0 ephemeral runners; secret `github-secret`; helm rev 39 (36–37 failed "cannot patch"); legacy `actions.summerwind.dev` CRDs. Origin: manual helm per `a5c-ai/hub runners/README.md`. No babysitter workflow uses these runners.
- ingress-nginx (helm rev 3, 1 replica, Azure LB health-probe annotations), cert-manager v1.15.3 (rev 1, default values), kyverno 3.8.1 (release **failed**, pods 1/1 ×4, 10 webhooks), gatekeeper (azurepolicy addon, 0 constraints), `vela-system` (no workloads; 11 `core.oam.dev` CRDs + 2 secrets), `app-routing-system/nginx` (2/2, HPA 2–100, LB 134.33.26.182, nothing routes to it), `aks-command` (az aks command residue), `default` (1 service), kube-system (coredns, konnectivity, metrics-server, azure-npm, ip-masq, cloud-node-manager, CSI disk/file/secrets-store, ama-logs).

### 4.9 Registry `acrhubdevelopmentwestus3`
Standard SKU, westus3, created 2025-07-31, **63.9 GB / 100 GB**, admin user **enabled**, anonymous pull off, 2 tokens (`aks-pull` → `_repositories_pull`; `content-studio-ci` → push/pull `content-studio`), 0 webhooks. 24 repositories (`raw/azure/_acr-hub-summary.tsv`, per-repo tags in `raw/azure/acr-tags/`):

| Repo | Tags / manifests | Newest tag | Consumer |
|---|---|---|---|
| kradle-controller, kradle-web | 21 / 74 | `57b13a4c…` (2026-09-05) | kradle |
| adapters-agent, jitsi-agent-sidecar | 22 / 74 | `57b13a4c…`, `latest` | kradle dispatch |
| atlas-webui | 22 / 77 | `57b13a4c…` | atlas |
| content-studio | 5 / 20 | `589e29f73f93` | content-studio |
| babysitter-web, babysitter-web-runner | 5 / 17 | `staging-18addbf7…`, `staging-latest` | staging |
| a5c-app | 5 / 10 | `21bf6e7df269` | app, app-staging |
| a5c-install | 5 / 10 | `20250913172226` | app-staging |
| aeq-server, aeq-dashboard, aeq-mcp | 5 / 9 | `54a0641b…`/`4f1f1b99…` | aeq |
| bmux-server | 2 / 1 | `54a0641b…` | aeq |
| hub/backend, hub/frontend, hub/github-runner | 5 / 10 | `1b76672-dirty` | hub |
| krate-controller, krate-web | 5 / 20 | `9d8c031b…` | none (dead) |
| claude-web, claude-web-runner | 5 / 17 | `staging-0fe2b27a…` | none (dead) |
| budgets, onboard, tokens-dispenser | 5 / 10 | short SHAs | none (namespaces deleted 2026-04-19) |

`lastUpdateTime = 2026-08-27` on every inactive repo is the ACR cleanup that pruned them to 5 tags. Second registry `geekonomyacrmkb5l5` (Basic, 7.5 GB / 10 GB, admin user on, repos `geekonomy-{web,worker,transcriber,migrator}`, last push 2026-01-12).

### 4.10 TLS certificates (cert-manager)
`aeq-tls` 2026-11-17 · `app-azure-ssl-certificate` (app) 2026-11-20, (app-staging) 2026-11-26 · `atlas-webui-tls` 2026-11-27 / 2026-12-02 · `content-studio-tls` 2026-11-06 · `hub-azure-ssl-certificate` **False** + `hub-tls` True 2026-10-26 · `kradle-tls` 2026-11-27 / 2026-11-01 · `kradle-gitea-tls` 2026-11-27 / 2026-11-23 · `babysitter-web-staging-tls` (issuer `letsencrypt-prod`) 2026-11-18. All HTTP-01 through ingress-nginx — the GCP side needs the same hostnames routed before issuance.

### 4.11 Data stores outside the cluster
| Server / account | Type | Details | Used by |
|---|---|---|---|
| `aeqpg0316203042` | PG 16 flexible, B1ms, 32 GB, 7-day backup, public | db `aeq`; rule AllowAllAzureServices | aeq |
| `psql-hub-development-westus3-v2` | PG 15 flexible, B1ms, 32 GB | dbs `hub`, `hub_test`; **no firewall rules** | nothing (hub uses in-cluster PG) |
| `litellm-pgdb`, `litellm-pgdb2` | PG 16 flexible, B1ms (swedencentral) | dbs `flexibleserverdb`+`litellm` / `litellm` | archive of proxy spend logs |
| `geekonomy-pg-mkb5l5` | PG 16 flexible, B1ms (northeurope) | db `geekonomy`; 5 firewall rules incl. personal IPs | geekonomy |
| `geekonomy-redis-mkb5l5` | Redis Basic C0 6.0 | | geekonomy |
| `a5catlaspg794e33cd` | Storage (Files) | shares `atlas-atlas-postgres`, `atlas-staging-atlas-postgres`, `content-studio-postgres` (8 GB each) | atlas ×2, content-studio |
| `fc3e7eef89d6645fbae772d` (MC RG) | Storage (Files) | share `pvc-7c8e1234…` 1 TiB | hub repositories |
| `sthubdevelopmentwestu3v2` | Storage (Blob) | `artifacts`, `backups`, `packages`, `repositories` (2025-08-22) | hub (historic) |
| `a5ctfstorage` | Storage (Blob) | `tf-main`, `tfstate` | **hub Terraform state** |
| `babysitterarchive2608` | Storage GRS Cool | `trial-telemetry` (2026-08-13) | unknown |
| `stlitellmproxy2026` | Storage | shares `caddy-config`, `caddy-data`, `litellm-config`, `litellm-config-v2`, `mantis-job`, `postgres-data`; `$web` | litellm archive |
| `a5cstatic` | Storage RAGRS | `$web` (404) | legacy static site |
| `mantisb131bfc8` | Storage (**created 2026-09-11**, public blob access on) | `$web` | unknown |
| `mantisodoo913061`, `mantisodooevid1868` | Storage | `evidence` (tagged private-evidence, retain=true) | odoo validation |
| `stpersonoids…`, `sttalai…`, `sttmuskal…` | Storage | AzureML code shares (100 TB quota) + blobstore containers | personoids ML |
| Key Vaults ×4 | KV | tenants 85f6b733 (`kv-hubdevelopmentwest3v2`, `kv-tmuskal2530339506822`), 0c79caa9 (`kv-personoi362519582270`, `kv-talai084044774586`) — **unreadable** | unknown |

### 4.12 Compute outside the cluster
12 VMs, **all deallocated**: `tb-fleet-{0,1,2,4,5,6,7,8}` (D4ads_v5, swedencentral, 2026-08-11, tags `lifecycle=persistent-manual`, `terminal-bench-owner=<hash>`, extension `terminal-bench-bootstrap`, own VNet/NSG/PIP each), `a5c-dev-vm` + `a5c-dev-vm-2` (E8s_v5, eastus2, Feb 2026), `ubuntu-large-02` (E4s_v5, 2026-08-08), `vm-odoo-validation` (D4s_v5, 2026-07-12, `auto-delete-after=2026-07-16`). 12 Premium OS disks (state Reserved), 11 static Standard PIPs, 15 NSGs, 13 VNets attached to these. Container Apps: geekonomy-web (0.5 CPU/1 GiB, 0–3, external), -worker (0.25/0.5 GiB), -transcriber (1/2 GiB, internal), job `geekonomy-db-migrate` (manual), env `geekonomy-cae-mkb5l5`. Web app `promoted-idle-a1cef5` (F1, Node 20, Running, no response). Static Web Apps: `a5c-website` ×2, `a5c-proxy-894866`, `babysitter-benchmarks`, `intuitive-website-new` (all Free).

### 4.13 GitHub → Azure credentials in use
| Principal | appId | Rights | Used by |
|---|---|---|---|
| `askExpertQuestion-github-actions` | `610b95c2-…` | Contributor + User Access Administrator (subscription), AcrPush | org `AZURE_APPLICATION_CLIENT_ID`/`_SECRET` (babysitter publish.yml, aeq workflows) |
| `claude-web-acr-push` | `22bb9d17-…` | AcrPush | claude-web workflows |
| `vm-odoo-validation` | `6805e2c1-…` | Storage Blob Data Contributor (mantis-odoo RG) | codex evidence upload |
| org secret `KUBE_CONFIG` | – | cluster-admin (local account) kubeconfig | babysitter, company, aeq, claude-web workflows |
| ACR tokens `aks-pull`, `content-studio-ci` | – | pull / push | `acr-pull*` k8s secrets, company CI |

## 5. Anomalies (explicit)

1. **AKS provisioningState=Failed; both managed identities missing** (`ResourceNotFound`; principals absent; `az identity list` = 0) → disk CSI `ProvisioningFailed: context deadline exceeded`, 3 PVCs Pending (kradle ×2 prosody, aeq-data-pvc since 2026-03-24), ARC work volumes impossible, no new LB IPs. Cluster cannot be upgraded/repaired in place. Kubernetes 1.30.12 EOL.
2. **Key Vaults in 3 tenants** (85f6b733, 0c79caa9 vs. subscription 5aa70b65) — AKV10032 on every read; secret names unknown.
3. **hub-backend 0/3** since creation (rev 149); images `-dirty` (non-reproducible); duplicate Certificate objects on one secret.
4. **Stuck pods on node vmss000005**: `app/a5c-app-redis-0`, `app-staging/a5c-app-redis-0` (since 2025-11-09), `app-staging/a5c-app` 2nd replica (since 2026-02-27) — all "waiting" with no reason.
5. **Node pressure**: vmss000000 at 105 % CPU; 15 OOMKilling events (Next.js `next-server` processes) on vmss000001/000005; atlas-staging probe timeouts; kradle/atlas/cert-manager pods set **no resource requests**.
6. **kyverno helm release failed** (rev 1 and 2) though pods run; ClusterPolicy `knack-manual-dispatch-only` not ready; `KRADLE_KUBEVELA_NAMESPACE=vela-system` but no vela controller; gatekeeper with 0 constraints; kyverno installed twice (kradle chart dependency + standalone release).
7. **Second nginx LB** (`app-routing-system`, 134.33.26.182, HPA to 100) with `webAppRouting.enabled=false` — pure waste.
8. **AppGW residue**: unattached PIP `4.242.238.192`, WAF policy, NSG + subnet, IngressClass `azure-application-gateway`, `appgw.ingress.azure.io` CRD.
9. **Orphan Azure PG** `psql-hub-development-westus3-v2` (hub, hub_test) — unreferenced, no firewall rules; content unknown.
10. **content-studio** share lives in the atlas storage account; deploy workflow disabled; points at Azure OpenAI with 0 deployments.
11. **kradle prod depends on atlas-staging** (`ATLAS_BASE_URL`).
12. **Gitea emptyDir** in both kradle envs; runtime-created `kradle-gitea-agent-token` only in staging.
13. **babysitter-web-staging** Postgres/Redis have no PVC; 5 stale `claude-web-staging-*` secrets.
14. **22 workload-referenced secrets owned by no chart** (§2.2); `ama-logs-adx-secret` referenced but absent.
15. **Wildcard DNS** `*.a5c.ai → 135.234.117.214`; apex on Vercel while SWA `a5c-website` still binds `a5c.ai`; `aeq.a5c.ai` 404.
16. **`i.personoids.com`**: 5 A records → dead IP 52.183.102.215 + stale externaldns TXT.
17. **ACR**: admin user enabled (both registries); 8 dead repos; non-SHA tags `yolo-test`, `y2`, `latest` on `adapters-agent`; `-dirty` hub tags; timestamp tags `a5c-install`.
18. **ARC runners** unusable (managed-csi-premium work PVC); helm revs 36–37 failed; legacy summerwind CRDs.
19. **Over-privileged CI SPN** `askExpertQuestion-github-actions`: Contributor + User Access Administrator on the whole subscription.
20. **Public API server, local accounts, no AAD**; org secret `KUBE_CONFIG` = cluster-admin.
21. **12 deallocated VMs** keep 12 Premium disks + 11 static PIPs + NSGs/VNets; `vm-odoo-validation` past its `auto-delete-after`; empty RGs `rg-tb-fleet-3`, `a5c-mantis-workshop`.
22. **New since 2026-09-05 report**: storage `mantisb131bfc8` (2026-09-11, `$web`, public blob access) — origin unknown.
23. **Unknown-origin surfaces**: `promoted-idle-a1cef5`, SWA `babysitter-benchmarks` (2026-08-18), SWA `a5c-proxy-894866`, SWA `intuitive-website-new` (repo outside org, never deployed).
24. **4 AzureML serverless endpoints** (Cohere ×2, Phi ×2) still provisioned; AzureML shares at 100 TB quota.
25. **Terraform state** for the whole hub RG sits in `a5ctfstorage` — must be exported before any teardown.
26. No AKS diagnostic settings, 0 budgets, `az consumption` unsupported for this offer → no CLI cost visibility.
27. Latest staging publish (2026-09-05): `Deploy Docs Site` and `Publish Foundation - atlas` failed while both AKS deploys succeeded.

## 6. Blockers encountered

| Blocker | Exact symptom | Needed |
|---|---|---|
| Second subscription `1a6a4872-…` (tenant `85f6b733-…`) | not in `az account list --all`; not attempted per instructions | owner: `az login --tenant 85f6b733-81c9-4249-b305-5fb7292db22b`, then `az group list`/`az keyvault list` there |
| Key Vault reads (all 4) | `(Unauthorized) AKV10032: Invalid issuer. Expected … 85f6b733 / 0c79caa9 …, found … 5aa70b65` | owner login to those tenants to enumerate secret names |
| AKS identities | `az identity show … ResourceNotFound`; `az ad sp show <principalId>` "does not exist" | none — design the target without repairing AKS |
| Cost data | `az consumption usage list` → `(400) Billing Period is not supported … Web Direct Offer` | use `C:\work\company\artifacts\research\azure-finops-status-2026-09-05.md` figures |
| `az staticwebapp show` for `babysitter-benchmarks` | non-JSON output (jq parse error); env list captured (`default` Ready 2026-08-18) | portal check if needed |
| `az aks show --query {oidc…}` / `az aks addon list` | aks-preview 19.0.0b5 traceback `'NoneType' object has no attribute '__name__'` | used full `az aks show` (addonProfiles) instead |
| Sources not in git | gh code search (org a5c-ai) has no hits for geekonomy, `terminal-bench-bootstrap`/`rg-tb-fleet`, `babysitter-benchmarks`, `a5c-proxy-894866`, `promoted-idle`, `rg-mantis-album`/`mantisodoo`, `babysitterarchive2608`/`trial-telemetry` | owner answers: keep (then create a repo + IaC for each) or export-and-decommission |
| Tooling | Windows `jq` emits CRLF; `$(jq -r …)` word lists silently broke every `az` loop in pass 1 (empty files for all but the last item) | fixed in `_collect-detail2.sh`/foreground reruns with `tr -d '\r'`; keep the rule for later scripts |

## 7. Raw appendix — resources by resource group

Full list: `raw/azure/_resources-by-rg.tsv` (202 rows) and `raw/azure/resources.json`.

| RG (location) | Resources |
|---|---|
| `rg-hub-development-westus3` (westus3) | AKS `aks-hub-development-westus3-v2`; ACR `acrhubdevelopmentwestus3`; PG `aeqpg0316203042`, `psql-hub-development-westus3-v2`; storage `a5catlaspg794e33cd`, `sthubdevelopmentwestu3v2`; KV `kv-hubdevelopmentwest3v2`; VNet `vnet-hub-development-westus3`; NSGs `vnet-hub-development-westus3-aks-nsg`, `-database-nsg`, `appgw-hub-development-westus3-v2-nsg`; PIP `appgw-hub-development-westus3-v2-pip`; WAF policy `appgw-hub-development-westus3-v2-wafpolicy`; private DNS `privatelink.blob.core.windows.net`, `privatelink.vaultcore.azure.net` (+links); LA `aks-hub-development-westus3-v2-logs`, `log-hub-development-westus3-v2`; solutions ContainerInsights ×2, Security; App Insights `appi-hub-development-westus3-v2`; smart detector; action group `ag-hub-development-westus3-v2`; DCR `hub-development-westus3-dcr` |
| `MC_rg-hub-development-westus3_aks-hub-development-westus3-v2_westus3` | VMSS `aks-default-28513622-vmss`; LB `kubernetes`; PIPs `f964f80d…` (20.14.43.47), `kubernetes-a77bc…` (135.234.117.214), `kubernetes-a92fa…` (134.33.26.182); NSG `aks-agentpool-12828736-nsg`; storage `fc3e7eef89d6645fbae772d`; disks `pvc-{0dde3922,1cd94e10,59ccf124,66704332,c3ee816e,f9e96cba}` |
| `geekonomy-prod` (northeurope) | Container Apps `geekonomy-web`, `-worker`, `-transcriber`; job `geekonomy-db-migrate`; env `geekonomy-cae-mkb5l5`; ACR `geekonomyacrmkb5l5`; PG `geekonomy-pg-mkb5l5`; Redis `geekonomy-redis-mkb5l5`; LA `geekonomy-law-mkb5l5` |
| `rg-litellm-proxy` (swedencentral) | PG `litellm-pgdb`, `litellm-pgdb2`; storage `stlitellmproxy2026` |
| `rg-tmuskal-7935` (swedencentral) | Cognitive `a5c-sw-resource` (+project `a5c-sw`), `tmusk-mdk7huum-eastus2` (+project), `tmusk-mdk89kro-norwayeast` (+project); App Insights `ai`; LA `DefaultWorkspace-cb17b37c-…`; smart detector; action group |
| `rg-tmuskal-9340` (eastus2) | Cognitive `a5c-us-east-resource` (+project `a5c-us-east`) |
| `personoids_sponsorship` (eastus) | Cognitive `swedenpersonoids`, `contentsafetypersonoids`, `tmusk-ma0twksa-westus3`; KVs `kv-personoi362519582270`, `kv-talai084044774586`, `kv-tmuskal2530339506822`; storage `stpersonoids362519582270`, `sttalai084044774586`, `sttmuskal214530339506822`; ML workspaces `personoids_ai`, `tal_ai`, `tmuskal-2145_ai` (hubs), `tal-0301`, `tal-0653`, `tmuskal-2447` (projects); serverless endpoints `tal-0301/Cohere-command-r-plus-vbenr`, `tal-0301/Cohere-rerank-v3-english-gnzej`, `tal-0301/Phi-3-medium-128k-instruct-mdbjo`, `tal-0653/Phi-3-5-mini-instruct-azxsa`; VNet `personoidsVnet`; Grafana `grafana-20250126104729`; monitor account `defaultazuremonitorworkspace-wus2`; Prometheus rule groups ×6; DCE/DCR `MSProm-westus2-personoids`, DCR `MSCI-westus2-personoids`; metric alerts `CPU Usage Percentage - personoids`, `Memory Working Set Percentage - personoids`; activity log alert `Azure Wide Alert`; action group `RecommendedAlertRules-AG-1`; API connection `documentdb`; SWA `a5c-website` |
| `PersonoidsClusterDnsResourceGroup` | DNS zone `i.personoids.com` |
| `DefaultResourceGroup-westus2` | storage `a5cstatic`; monitor account `DefaultAzureMonitorWorkspace-westus2` |
| `DefaultResourceGroup-WUS2` | LA `DefaultWorkspace-794e33cd-…-WUS2` |
| `MA_defaultazuremonitorworkspace-westus2_westus2_managed`, `MA_…-wus2_westus2_managed` | DCE + DCR each |
| `NetworkWatcherRG` | NetworkWatcher eastus, eastus2, swedencentral, westus2, westus3 |
| `a5c-website-rg` (eastus) | SWA `a5c-website`, `a5c-proxy-894866` |
| `intuitive-website-rg` | SWA `intuitive-website-new` |
| `rg-babysitter-portal` (eastus2) | SWA `babysitter-benchmarks` |
| `rg-promoted-idle` (eastus) | web app `promoted-idle-a1cef5`; ASP `asp-promoted-idle` (F1) |
| `rg-babysitter-archive` (swedencentral) | storage `babysitterarchive2608` |
| `a5ctf-rg` (eastus) | storage `a5ctfstorage` |
| `rg-mantis-album` (eastus) | storage `mantisb131bfc8` |
| `rg-mantis-odoo-validation-eastus2` | VM `vm-odoo-validation` (+OS disk, NIC, VNet); storage `mantisodoo913061`, `mantisodooevid1868` |
| `a5c-dev-rg` / `A5C-DEV-RG` (eastus2) | VMs `a5c-dev-vm`, `a5c-dev-vm-2` (+OS disks, NICs, NSGs, PIPs, VNets `a5c-dev-vmVNET`, `a5c-dev-vnet`) |
| `rg-ubuntu-ssh-20260806` (eastus2) | VM `ubuntu-large-02` (+OS disk, NIC, NSG, PIP, VNet `ubuntu-ssh-01VNET`) |
| `rg-tb-fleet-{0,1,2,4,5,6,7,8}` (swedencentral) | VM `tb-fleet-N` + extension `terminal-bench-bootstrap` + disk `tb-fleet-N-os` + NIC + NSG + PIP + VNet (7 resources each) |
| `rg-tb-fleet-3`, `a5c-mantis-workshop` | empty |

Role assignments (subscription): Owners `tmuskal`, `benihakak`; Contributor `elad.benisrael`; SPN `askExpertQuestion-github-actions` Contributor + User Access Administrator; group `a5c-mantis-workshop-users` Contributor on `a5c-mantis-workshop`; Foundry User ×3; AcrPush ×2; Storage Blob Data Contributor ×1. Last AKS control-plane activity in 30 days: `listClusterUserCredential` by `benihakak@gmail.com` on 2026-08-27. Azure Advisor: 132 recommendations (Cost 9, HighAvailability 100, OperationalExcellence 18, Performance 5).
