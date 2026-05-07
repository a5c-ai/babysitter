/**
 * @process contrib/devops/gcp-systems-discovery
 * @description End-to-end GCP project/organization discovery, system attribution,
 *              GKE deep-dive (Standard + Autopilot), network/forwarding-rule
 *              attribution, external exposure map, and per-system topology
 *              diagrams. All tasks are agent-driven; there is no inter-task
 *              filesystem contract — agents self-manage working state under
 *              their task-scoped directory and pass typed results forward as
 *              JSON. The caller controls where the final reports land via
 *              `inputs.outputDir`.
 *
 * @inputs {
 *   projectIds?: string[],          // omit to use current gcloud project
 *   organizationId?: string|null,   // when set, can scope to whole org via Cloud Asset Inventory
 *   regions?: string[],             // default ['us-central1']; some services are global
 *   scopeMode?: 'current'|'project-list'|'organization',
 *   systemUnit?: 'project'|'label'|'gke-namespace',
 *   systemLabelKey?: string,
 *   includeGkeDeepDive?: boolean,
 *   includeDnsRecords?: boolean,
 *   probeExternalEndpoints?: boolean,  // curl public hostnames to detect dead surfaces
 *   diagrams?: 'mermaid'|'mermaid+png'|'none',
 *   outputDir?: string,
 *   serviceCategories?: string[]|null, // restrict scan; default = all
 *   installPolicy?: 'ask'|'auto'|'never',
 *   authMethod?: 'use-existing'|'interactive'|'service-account-key'|'workload-identity',
 *   serviceAccountKeyFile?: string|null
 * }
 * @outputs {
 *   success: boolean,
 *   projects: string[],
 *   regions: string[],
 *   resources: number,
 *   systems: number,
 *   gkeClusters: number,
 *   loadBalancers: number,
 *   externalHostnames: number,
 *   reportFiles: string[],
 *   indexFile: string|null
 * }
 *
 * @skill gcp-cloud specializations/devops-sre-platform/skills/gcp-cloud/SKILL.md
 * @skill kubernetes-ops specializations/devops-sre-platform/skills/kubernetes-ops/SKILL.md
 * @agent infra-architect specializations/devops-sre-platform/agents/infra-architect/AGENT.md
 *
 * Service coverage (the discovery agent probes ALL unless `serviceCategories` is set):
 *   - Compute: Compute Engine VMs, MIGs, instance templates, disks, snapshots, images, sole-tenant nodes
 *   - Containers: GKE Standard + Autopilot (ns/workloads/svc/ingress/Gateway API), Cloud Run (services+jobs), Cloud Functions Gen1+Gen2, Cloud Build, Artifact Registry, Container Registry (gcr.io)
 *   - Data: Cloud SQL (Postgres/MySQL/SQL Server), Spanner, Bigtable, Memorystore Redis+Memcache, Firestore (Native+Datastore), BigQuery (datasets+jobs sample), Dataflow, Dataproc, Cloud Composer
 *   - AI/ML: Vertex AI (endpoints, models, pipelines, notebooks, workbench), legacy AI Platform models
 *   - Storage: GCS buckets (IAM, public-access), Filestore
 *   - Messaging/Eventing: Pub/Sub (topics+subs), Cloud Tasks, Cloud Scheduler, Cloud Workflows, Eventarc
 *   - Networking: VPC + subnets + peerings + Shared VPC, GCLB (HTTP(S), TCP/UDP, internal: forwarding rules + target proxies + URL maps + backend services + NEGs/MIGs), Cloud DNS (public+private), Cloud Armor, Cloud CDN, Cloud NAT, Cloud Interconnect, Cloud VPN, IAP tunnels+brand
 *   - Identity/Secrets: Cloud KMS, Secret Manager, IAM service accounts (per project)
 *   - Observability: Cloud Logging (sinks+buckets), Cloud Monitoring (alerts/dashboards/uptime), Cloud Trace, Cloud Profiler
 *   - API/Edge: Apigee orgs+envs, Cloud Endpoints
 *   - Specialty: Healthcare API datasets, Anthos / GKE on-prem registered clusters
 *
 * Agent-task design notes:
 *   - Every task is `kind: 'agent'`. Discovery agents run `gcloud`/`bq`/`gsutil` (and `kubectl` where reachable) internally via Bash. Composition agents read upstream returned JSON + task-scoped artifacts whose paths are passed forward explicitly.
 *   - Agents own their `tasks/<effectId>/artifacts/` scratch dir and return paths. No shared "raw/" location.
 *   - The single user-controlled path is `inputs.outputDir`, ONLY for final reports.
 *   - Drift defense: composition agents read source data via Bash `cat`/`jq` at execution time rather than via inlined prompt bytes.
 *   - Org-wide scope short-circuits per-project enumeration via Cloud Asset Inventory (`gcloud asset search-all-resources --scope=organizations/<id>`) — ~10x faster.
 * @graph
 *   domains: [domain:devops]
 *   specializations: [specialization:devops-sre-platform]
 *   workflows: [workflow:capacity-planning]
 *   roles: [role:platform-engineer, role:devops-engineer]
 *   skillAreas: [skill-area:deployment-infrastructure-management]
 *   topics: [topic:infrastructure-as-code]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// Bootstrap — ensure gcloud + components + jq are installed and an identity is
// authenticated. On already-set-up machines all phases short-circuit.

const cliBootstrapTask = defineTask('gcp-cli-bootstrap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Probe + install gcloud SDK, gke-gcloud-auth-plugin, kubectl, bq, gsutil, jq',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cloud-CLI installer',
      task: 'Detect whether gcloud / bq / gsutil / kubectl / gke-gcloud-auth-plugin / jq are installed and runnable. Install any missing tool, asking the user before installing if installPolicy is "ask".',
      context: {
        installPolicy: args.installPolicy,           // 'ask' | 'auto' | 'never'
        platform: '<auto-detect via uname>',
      },
      instructions: [
        'Detect platform with `uname -s -m`. For each tool (gcloud, bq, gsutil, kubectl, gke-gcloud-auth-plugin, jq): `which <tool>` + version. Mark present:true if found.',
        'If missing and installPolicy=="never": mark `action:"skipped-by-policy"` and continue.',
        'If missing and installPolicy=="ask": **DO NOT install** — return `pendingInstall:[...]` so the orchestrator can raise a breakpoint and re-invoke with installPolicy="auto".',
        'If missing and installPolicy=="auto":',
        '  - gcloud (installs bq+gsutil): Linux apt: add the `https://packages.cloud.google.com/apt cloud-sdk main` repo with apt-key, then `apt-get install -y google-cloud-cli`. macOS: `brew install --cask google-cloud-sdk`. Fallback: `curl https://sdk.cloud.google.com | bash -s -- --disable-prompts --install-dir=$HOME`.',
        '  - kubectl + gke-gcloud-auth-plugin: `gcloud components install kubectl gke-gcloud-auth-plugin --quiet`. On apt installs (read-only components) use `apt-get install -y kubectl google-cloud-cli-gke-gcloud-auth-plugin`.',
        '  - bq/gsutil: ship with gcloud; on partial install run `gcloud components install bq gsutil --quiet`.',
        '  - jq: `apt-get install -y jq` | `brew install jq` | static binary from github.com/jqlang/jq.',
        'After install re-probe. Prefer non-sudo paths ($HOME/.local/bin, $HOME/google-cloud-sdk). Hint env: USE_GKE_GCLOUD_AUTH_PLUGIN=True.',
        'Return ONLY: {"gcloud":{"present":<b>,"version":"<v>","path":"<p>","action":"already-present"|"installed"|"skipped-by-policy"|"failed","error"?:"<m>"}, "bq":{...same shape}, "gsutil":{...}, "kubectl":{...}, "gke-gcloud-auth-plugin":{...}, "jq":{...}, "pendingInstall"?:[<tool-names>], "ready":<bool>}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['gcloud', 'jq', 'ready'] },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const gcloudAuthTask = defineTask('gcp-auth', (args, taskCtx) => ({
  kind: 'agent',
  title: `Authenticate to GCP (method: ${args.authMethod})`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GCP auth assistant',
      task: 'Authenticate the local gcloud CLI session using the chosen method.',
      context: {
        authMethod: args.authMethod,                       // 'use-existing' | 'interactive' | 'service-account-key' | 'workload-identity'
        serviceAccountKeyFile: args.serviceAccountKeyFile, // path to JSON key file when authMethod=service-account-key
        organizationId: args.organizationId,
      },
      instructions: [
        '`use-existing`: `gcloud auth list --format=json`; need exactly one ACTIVE account (status="*"). Else fail.',
        '`interactive`: `gcloud auth login --update-adc --quiet`. On headless: append `--no-launch-browser` and print the URL.',
        '`service-account-key`: require serviceAccountKeyFile. `gcloud auth activate-service-account --key-file=<path>`; set ADC via `export GOOGLE_APPLICATION_CREDENTIALS=<path>`. Never log key bytes.',
        '`workload-identity`: GCE/GKE/Cloud Run/Cloud Build metadata server is auto-detected. `gcloud auth list` should show an active `.gserviceaccount.com`; else fail with hint.',
        'After login: `gcloud projects list --format=json --limit=500`. If organizationId set, also `gcloud organizations describe <orgId>` and `gcloud resource-manager folders list --organization=<orgId>` (best-effort).',
        'Return ONLY: {"loggedIn":<b>,"method":"<m>","currentAccount":{"email":"<e>","type":"user"|"service_account","adcSource":"user-creds"|"key-file"|"metadata-server"|"none"},"currentProject":"<p>"|null,"availableProjects":[{"projectId":"<id>","name":"<n>","projectNumber":"<n>","lifecycleState":"ACTIVE"|...}],"organization"?:{"id":"<o>","displayName":"<n>","folders":[{"name":"<f>","displayName":"<n>"}]}}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['loggedIn', 'currentAccount'] },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// Discovery — one comprehensive agent task per project (or one for the whole
// org when scopeMode==='organization'). Each owns its scratch dir and returns
// a manifest of artifact paths plus headline counts.

const discoveryTask = defineTask('gcp-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: args.scopeMode === 'organization'
    ? `Inventory organization ${args.organizationId} via Cloud Asset Inventory`
    : `Inventory project ${args.projectId} (${args.serviceCategories?.length ? args.serviceCategories.join(',') : 'all categories'})`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GCP cloud auditor',
      task: 'Inventory every GCP resource in scope and emit a manifest of artifact files (one per service category) under your task-scoped artifacts directory.',
      context: {
        scopeMode: args.scopeMode,                 // 'project' | 'organization'
        projectId: args.projectId,
        organizationId: args.organizationId,
        regions: args.regions,
        serviceCategories: args.serviceCategories,
        artifactsDir: `tasks/${taskCtx.effectId}/artifacts`,
        includeGkeDeepDive: args.includeGkeDeepDive,
        includeDnsRecords: args.includeDnsRecords,
      },
      instructions: [
        'Own your scratch dir. Write intermediate JSON to `tasks/<effectId>/artifacts/`. Return a manifest of paths. Never assume a fixed location like `infra/raw/`.',
        'If scopeMode=="organization" AND organizationId set — FAST PATH via Cloud Asset Inventory:',
        '  - `gcloud asset search-all-resources --scope=organizations/<orgId> --format=json --page-size=500 > artifacts/asset-inventory.json` (paginate as needed).',
        '  - `gcloud asset search-all-iam-policies --scope=organizations/<orgId> --format=json > artifacts/asset-iam.json`.',
        '  - Split asset-inventory.json by `assetType` into per-category files (compute.googleapis.com/Instance -> compute.json, container.googleapis.com/Cluster -> gke.json, etc.). For deeper config not in CAI (GKE node-pools detail, Cloud Run revisions, BigQuery stats, full backend chains), still call per-service gcloud for those objects.',
        'Else (per project): `gcloud config set project <projectId>`. Walk every category in this process file\'s @description. For each:',
        '  - Native gcloud first (e.g. `gcloud compute instances list --format=json`, `gcloud run services list --region=<r>`, `gcloud sql instances list`, `gcloud spanner instances list`, `gcloud pubsub topics list`). Iterate `inputs.regions` for regional services; some are global (DNS, GCS, IAM, KMS).',
        '  - Fallback for services without first-class subcommands: `gcloud asset search-all-resources --scope=projects/<projectId> --asset-types=<type>`.',
        '  - Pull child resources for multi-tenant services (Vertex AI, Composer envs, Dataproc clusters) where cheap.',
        '  - Tolerate `PERMISSION_DENIED` / `API not enabled` per service — record in manifest, do not crash. Track disabled APIs in `disabledApis:[]`.',
        'GKE deep-dive (only if includeGkeDeepDive): per cluster `gcloud container clusters get-credentials <name> --region|--zone=<loc> --project=<p>` to a temp KUBECONFIG. Probe `kubectl get ns,deploy,sts,ds,svc,ing,gateway -A -o json`, `kubectl top pods -A --use-protocol-buffers`, `kubectl top nodes`, `kubectl get events --field-selector type=Warning -A`. For Autopilot SKIP node-pool inspection and annotate `mode:"Autopilot"`. For Standard also `gcloud container node-pools list --cluster=<n> --location=<loc>`. If private+unreachable fall back to `clusters describe` and set `unreachable:true`. Delete kubeconfig at end.',
        'DNS (only if includeDnsRecords): `gcloud dns managed-zones list` then `gcloud dns record-sets list --zone=<z>` for each. Flag wildcards (`isWildcard: name.startsWith("*.")`).',
        'Detect+record: Compute instance status (TERMINATED=$0 compute), GKE cluster status (Stopped/Repairing/Degraded) + Autopilot vs Standard, unattached disks, unattached static external IPs, empty backend services (broken), Cloud Run image refs (parse `spec.template.spec.containers[].image`; record registry source: AR vs gcr.io vs external) + traffic split, Cloud Functions Gen1 vs Gen2 (Gen2=Cloud Run underneath), GCS public-access state (`iamConfiguration.publicAccessPrevention` + IAM bindings containing allUsers/allAuthenticatedUsers), full forwarding-rule -> target-proxy -> URL-map -> backend-service -> backend chain (GCP equivalent of AppGW listener attribution), Pub/Sub orphan topics + stale subs (`oldestUnackedMessageAge` via monitoring if reachable).',
        'Return ONLY: {"scope":"project"|"organization","projectId"?:"<id>","organizationId"?:"<id>","projectName"?:"<n>","regionsScanned":[<r>],"manifest":{"<category>":{"path":"<p>","count":<n>,"note"?:"<m>"}},"disabledApis":[<api>],"headlineCounts":{"resources":<n>,"computeInstances":<n>,"gkeClusters":<n>,"cloudRunServices":<n>,"cloudFunctions":<n>,"loadBalancers":<n>,"forwardingRules":<n>,"vpcs":<n>,"subnets":<n>,"gcsBuckets":<n>,"cloudSqlInstances":<n>,"bigqueryDatasets":<n>,"pubsubTopics":<n>,"dnsZones":<n>}}',
        'Do not write outside `tasks/<effectId>/artifacts/`. Do not assume any user outputDir until composition.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['scope', 'manifest', 'headlineCounts'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const gkeDeepDiveTask = defineTask('gcp-gke-deep-dive', (args, taskCtx) => ({
  kind: 'agent',
  title: `GKE deep-dive: ${args.clusterName} (${args.location})`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Kubernetes cluster auditor',
      task: 'Probe a single GKE cluster (Standard or Autopilot) and emit per-namespace JSON artifacts.',
      context: {
        projectId: args.projectId,
        clusterName: args.clusterName,
        location: args.location,             // region OR zone
        mode: args.mode,                     // 'Standard' | 'Autopilot'
        artifactsDir: `tasks/${taskCtx.effectId}/artifacts`,
      },
      instructions: [
        'Set KUBECONFIG to a fresh temp file under artifacts dir, then `gcloud container clusters get-credentials <clusterName> --project=<projectId>` with `--region|--zone=<location>`.',
        'Probes into per-file JSON: `kubectl get ns -o json > artifacts/namespaces.json`; `kubectl get deploy,sts,ds,job,cronjob -A -o json > artifacts/workloads.json`; `kubectl get svc -A -o json > artifacts/services.json`; `kubectl get ingress,gateway,httproute -A -o json > artifacts/ingresses.json` (tolerate 404 if Gateway CRDs absent); `kubectl get pods -A -o json > artifacts/pods.json`; `kubectl top pods -A --use-protocol-buffers > artifacts/top-pods.txt 2>&1 || true`; `kubectl top nodes > artifacts/top-nodes.txt 2>&1 || true`; `kubectl get events -A --field-selector type=Warning -o json > artifacts/events-warning.json`; `kubectl get pdb,hpa -A -o json > artifacts/policies.json`.',
        'Autopilot: SKIP node-pool inspection (system-managed nodes only); still capture top-nodes for cost approx.',
        'Standard: `gcloud container node-pools list --cluster=<n> --location=<loc> --project=<p> --format=json > artifacts/node-pools.json`.',
        'Detect ingress controllers (gke-l7/nginx-ingress/istio/contour/traefik) by ns+pod image and record `controllers:[]`. Detect addons via cluster describe `addonsConfig` (HTTP LB, network policy, GcePersistentDiskCsiDriver, etc.).',
        'Always delete kubeconfig at end-of-task.',
        'Return ONLY: {"clusterName":"<n>","location":"<loc>","mode":"Standard"|"Autopilot","reachable":<b>,"k8sVersion":"<v>","nodeCount":<n>,"namespaceCount":<n>,"workloadCount":<n>,"controllers":[<n>],"manifest":{"namespaces":"<p>","workloads":"<p>","services":"<p>","ingresses":"<p>","pods":"<p>","topPods":"<p>","topNodes":"<p>","events":"<p>","policies":"<p>","nodePools"?:"<p>"}}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['clusterName', 'reachable', 'manifest'] },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const dnsRecordsTask = defineTask('gcp-dns-records', (args, taskCtx) => ({
  kind: 'agent',
  title: `Enumerate Cloud DNS record sets across managed zones for ${args.projectId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cloud DNS auditor',
      task: 'List every record-set across every Cloud DNS managed zone in the project, flagging wildcards.',
      context: { projectId: args.projectId, artifactsDir: `tasks/${taskCtx.effectId}/artifacts` },
      instructions: [
        '`gcloud dns managed-zones list --project=<p> --format=json > artifacts/zones.json`',
        'For each zone: `gcloud dns record-sets list --zone=<z> --project=<p> --format=json > artifacts/records-<zone>.json`',
        'Combine into a single `artifacts/records-all.json` array of `{zone, visibility (public|private), name, type, ttl, rrdatas[], isWildcard}` records. `isWildcard = name.startsWith("*.")`.',
        'Tolerate `PERMISSION_DENIED` per zone; record skipped zones in `skipped: [{zone, reason}]`.',
        'Return ONLY: {"projectId": "<p>", "zones": <int>, "records": <int>, "wildcards": <int>, "manifest": {"zones": "<path>", "records": "<path>"}, "skipped": [...]}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['zones', 'records', 'manifest'] },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// Composition agents. Each takes the discovery manifest (paths to category
// JSON, NOT the bytes) plus the destination outputDir and writes report files.

const systemReportComposerTask = defineTask('gcp-system-reports', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compose per-system reports under ${args.outputDir}/systems/`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cloud infrastructure architect',
      task: `Generate one markdown report per "system" under ${args.outputDir}/systems/.`,
      context: {
        manifest: args.manifest,
        systemUnit: args.systemUnit,
        systemLabelKey: args.systemLabelKey,
        outputDir: args.outputDir,
      },
      instructions: [
        'Read the discovery manifest. Each category points at a JSON artifact under the discovery scratch dir; `cat`/`jq` at execution time, do not assume layout.',
        `System grouping (\`systemUnit\`): 'project' = one report per GCP project (natural GCP boundary); 'label' = group by label '${args.systemLabelKey}' (untagged -> single 'unlabeled' report); 'gke-namespace' = one report per GKE ns across all clusters + one per non-GKE project.`,
        `Per system: header (name, regions, resource count), inventory grouped by category (Compute, Containers, Cloud Run/Functions, Data, AI/ML, Storage, Messaging, Networking, Identity, Observability, API/Edge, Other), GKE subsection if any, networking subsection (VPCs, forwarding rules with backend chains, NEGs, NAT, peerings), data subsection (tiers/SKUs), cross-system deps (scan resource self-links).`,
        'Skip empty groupings with a single-line stub file. Counts via jq, never paraphrased.',
        `Use Read/Write/Glob/Bash freely. Write markdown into ${args.outputDir}/systems/ — the only fixed user-facing location.`,
        'Return ONLY: {"systemsCount":<n>,"reportFiles":[<p>]}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['systemsCount', 'reportFiles'] },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const gkeUsageReportTask = defineTask('gcp-gke-usage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compose ${args.outputDir}/gke-usage.md`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Kubernetes platform engineer',
      task: `Generate ${args.outputDir}/gke-usage.md from the per-cluster GKE deep-dive artifacts.`,
      context: { gkeManifests: args.gkeManifests, outputDir: args.outputDir },
      instructions: [
        'gkeManifests = array of `{clusterName,location,mode,reachable,manifest:{...paths}}`. Per reachable cluster the manifest points at namespaces/workloads/services/ingresses/pods JSON, top-pods/top-nodes txt, events-warning.json, policies.json, and (Standard only) node-pools.json.',
        'Top: cluster summary table — name | project | location | mode | k8s version | nodes | status. Autopilot rows: nodes col = "managed".',
        'Per reachable cluster: per-namespace table sorted desc by summed CPU requests. Cols: ns | pods | CPU req | mem req GiB | CPU lim | mem lim | actual CPU | actual mem | workloads. Skip pods in [Succeeded, Failed]. Parse resource strings ("100m"=0.1c, "1"=1c, "128Mi"=0.125GiB, "1Gi"=1GiB).',
        'Per-namespace detail (non-system + workloads): workloads (kind/name/replicas/image), services, ingresses (hosts/paths/backends), Gateway API HTTPRoutes.',
        'Detect ingress controllers (gke-l7/nginx-ingress/istio/contour/traefik). Top 10 pods by CPU req + top 10 by mem across all clusters. Recent Warning events grouped by reason.',
        'Autopilot: callout per-pod billing + lack of node-pool tuning levers.',
        'Return ONLY: {"clusters":<n>,"totalNamespaces":<n>,"totalWorkloads":<n>,"outputFile":"<p>"}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['clusters', 'outputFile'] },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const networkAttributionTask = defineTask('gcp-network-attribution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compose ${args.outputDir}/network/`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Network architect',
      task: `Generate ${args.outputDir}/network/README.md plus one ${args.outputDir}/network/lb-<name>.md per non-trivial Cloud Load Balancer.`,
      context: { manifest: args.manifest, outputDir: args.outputDir },
      instructions: [
        'Use forwarding-rule, target-proxy, URL-map, backend-service, NEG, MIG, VPC, subnet, peering, NAT, Cloud Armor, CDN artifacts from the manifest.',
        'GCP Cloud LB chain: forwarding rule (frontend IP+port) -> target proxy (HTTPS/TCP/SSL/UDP) -> URL map (HTTP(S) only) -> backend service -> backend (IG | NEG | serverless NEG). Render the FULL chain table per forwarding rule. Cols: frontend (IP:port, EXTERNAL/INTERNAL) | scheme | target proxy (type, SSL cert) | URL-map host/path rule | backend service (protocol, balancingMode) | backends (type+name+zone/region) | health.',
        'Attribute backends: Instance group/MIG -> name+zone+size; Zonal NEG GCE_VM_IP_PORT -> the GCE VMs (cross-ref Compute); Zonal NEG NON_GCP_PRIVATE_IP_PORT -> external/hybrid; Serverless NEG -> Cloud Run/Functions/App Engine (name the service); Internet NEG -> external FQDN/IP; PSC NEG -> producer service; empty backend service -> "unused/broken".',
        'Cloud Armor: each policy + target backend services + rules (priority, action, srcRanges). Cloud CDN: which backend services have CDN + cache-key policies. Cloud NAT: each gateway + router + log config + subnets served.',
        'VPCs: networks table, subnets per region, peerings (state, importCustomRoutes, exportCustomRoutes), Shared VPC host/service, IAP tunnels + brand.',
        'External IPs: every static external address (`gcloud compute addresses list`) with attribution (fwding rule | VM nic | NAT gw | unattached).',
        `Top-level network/README.md: VPC table, peering map, LB summary, Cloud Armor summary, NAT summary, external-IP inventory, DNS zones with record-set counts.`,
        'All counts via jq, never estimates.',
        'Return ONLY: {"vpcs":<n>,"loadBalancers":<n>,"forwardingRules":<n>,"totalUrlMapHosts":<n>,"externalIps":<n>,"files":[<p>]}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['loadBalancers', 'files'] },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const exposureMapTask = defineTask('gcp-exposure-map', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compose ${args.outputDir}/external-exposure.md`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security architect',
      task: `Generate ${args.outputDir}/external-exposure.md`,
      context: { manifest: args.manifest, outputDir: args.outputDir, probeExternalEndpoints: args.probeExternalEndpoints },
      instructions: [
        'Enumerate every public surface: (1) Cloud DNS A/CNAME from public zones; (2) forwarding rules with EXTERNAL scheme (group by frontend IP, list listener hostnames from URL-map host rules + SSL cert SAN list); (3) Cloud Run services with `ingress:all` (URL `<svc>-<hash>-<region>.a.run.app`); (4) Cloud Functions HTTP triggers (Gen1 trigger URL + Gen2 underlying Cloud Run URL); (5) App Engine default + custom domains; (6) GCE VMs with external IPs (ephemeral vs static); (7) GKE LoadBalancer services (`.spec.type=LoadBalancer` + `.status.loadBalancer.ingress[].ip`); (8) GKE Ingress public scheme; (9) GCS buckets with public IAM (`allUsers`/`allAuthenticatedUsers` — call out role); (10) Apigee envgroup hostnames + Cloud Endpoints services; (11) IAP brand applicationTitle (auth-gated but still publicly resolvable); (12) Vertex AI public endpoints (when `enable_private_service_connect=false`).',
        '**Wildcards**: if record `isWildcard==true` or name starts with `*.`, call out "Any subdomain also reaches <backend>" — OPEN SURFACE.',
        'Cross-reference each public hostname against an underlying GCP resource (forwarding-rule IPs, Cloud Run URLs, etc.). Flag dangling DNS (no matching resource) and broken backends (no healthy backends, ingress with no service).',
        args.probeExternalEndpoints ? 'Live probe: `curl -sS -o /dev/null -w "%{http_code}" --max-time 15 -k https://<host>/`. Add response code col; 5xx=broken, 000=timeout.' : 'Skip live probing.',
        'Cols: hostname/URL | source (DNS/fwding rule/Cloud Run/Function/GCS bucket/...) | resolves to | backing system | HTTPS? | status (active/broken/dormant/dangling) | auth (public/IAP/signed-URL/none).',
        'Headline counts at top.',
        'Return ONLY: {"externalHostnames":<n>,"broken":<n>,"danglingDns":<n>,"wildcardZones":<n>,"publicBuckets":<n>,"outputFile":"<p>"}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['externalHostnames', 'outputFile'] },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const diagramsTask = defineTask('gcp-diagrams', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compose mermaid diagrams under ${args.outputDir}/diagrams/`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cloud diagram author',
      task: `Generate mermaid diagrams under ${args.outputDir}/diagrams/.`,
      context: { manifest: args.manifest, outputDir: args.outputDir, gkeManifests: args.gkeManifests },
      instructions: [
        '1. global-topology.md — flowchart LR per project; subgraphs by region; top-level resources by category; edges between projects for VPC peerings + Shared VPC.',
        '2. network.md — networking LR: VPCs+subnets, forwarding rules (frontend IP -> target proxy -> URL map host -> backend service -> backend), Cloud NAT, peerings, external IPs.',
        '3. <system-name>.md per system with >=3 resources (per systemUnit grouping).',
        '4. gke-<cluster>.md per reachable GKE cluster (subgraphs per namespace with workload nodes; Autopilot omits node subgraph).',
        'Cap each diagram at ~80 nodes; split or summarize "+N more" if larger.',
        'Return ONLY: {"diagramsWritten":<n>,"files":[<p>]}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['diagramsWritten', 'files'] },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const indexTask = defineTask('gcp-index', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compose ${args.outputDir}/README.md`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical documentation author',
      task: `Generate ${args.outputDir}/README.md`,
      context: { outputDir: args.outputDir, summary: args.summary },
      instructions: [
        `Sections: title + survey date + project/org identity + headline counts + per-system reports list (Glob ${args.outputDir}/systems/) + GKE link + Networking link + External exposure link + Diagrams list + Refresh instructions (gcloud cmds to re-run).`,
        'Use Glob to enumerate actual files; never invent paths.',
        'Return ONLY: {"indexFile":"<p>","linkedFiles":<n>}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['indexFile'] },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// Process

export async function process(inputs, ctx) {
  const {
    projectIds = [],
    organizationId = null,
    regions = ['us-central1'],
    scopeMode = 'current',
    systemUnit = 'project',
    systemLabelKey = 'system',
    includeGkeDeepDive = true,
    includeDnsRecords = true,
    probeExternalEndpoints = false,
    diagrams = 'mermaid',
    outputDir = 'gcp-discovery',
    serviceCategories = null,
    installPolicy = 'ask',                      // 'ask' | 'auto' | 'never'
    authMethod = 'use-existing',                // 'use-existing' | 'interactive' | 'service-account-key' | 'workload-identity'
    serviceAccountKeyFile = null,
  } = inputs;

  const emptyResult = {
    success: false, projects: [], regions, resources: 0, systems: 0,
    gkeClusters: 0, loadBalancers: 0, externalHostnames: 0,
    reportFiles: [], indexFile: null,
  };

  // ---- Bootstrap: CLI install ---------------------------------------------
  let bootstrap = await ctx.task(cliBootstrapTask, { installPolicy: 'never' });
  if (!bootstrap?.value?.ready) {
    const missing = bootstrap.value?.pendingInstall
      || ['gcloud', 'jq'].filter(t => !bootstrap.value?.[t]?.present);
    if (installPolicy === 'never') {
      throw new Error(`Required CLIs missing: ${missing.join(', ')}. Re-run with installPolicy=ask or auto.`);
    }
    const installApproval = await ctx.breakpoint({
      title: 'Install missing GCP CLIs',
      breakpointId: 'gcp-systems-discovery.install-clis',
      question: `Missing tools: ${missing.join(', ')}. Approve installation (gcloud SDK + components + jq)?`,
      options: ['Approve install', 'Skip (run will fail)', 'Cancel'],
      expert: 'owner',
      tags: ['install-gate', 'pre-bootstrap'],
    });
    if (!installApproval?.approved || installApproval?.response === 'Cancel') {
      return emptyResult;
    }
    if (installApproval.response === 'Approve install') {
      bootstrap = await ctx.task(cliBootstrapTask, { installPolicy: 'auto' });
      if (!bootstrap?.value?.ready) throw new Error('Bootstrap install failed; see task output.');
    }
  }

  // ---- Bootstrap: login + project/org context -----------------------------
  let auth = await ctx.task(gcloudAuthTask, { authMethod, serviceAccountKeyFile, organizationId });
  if (!auth?.value?.loggedIn) {
    const methodChoice = await ctx.breakpoint({
      title: 'Pick GCP authentication method',
      breakpointId: 'gcp-systems-discovery.auth-method',
      question: 'No active gcloud session found. How should I authenticate?',
      options: ['Interactive browser login', 'Use service account key (will ask for path)', 'Workload identity (only if on GCE/GKE/Cloud Run)', 'Cancel'],
      expert: 'owner',
      tags: ['auth-gate'],
    });
    if (!methodChoice?.approved || methodChoice.response === 'Cancel') return emptyResult;
    const chosenMethod = methodChoice.response.includes('service account') ? 'service-account-key'
      : methodChoice.response.includes('Workload') ? 'workload-identity'
      : 'interactive';
    let chosenKey = serviceAccountKeyFile;
    if (chosenMethod === 'service-account-key' && !chosenKey) {
      const keyInput = await ctx.breakpoint({
        title: 'Provide GCP service-account key file path',
        breakpointId: 'gcp-systems-discovery.sa-key',
        question: 'Paste the absolute path to a service-account JSON key file. (Path is stored in this task input.json — handle accordingly. Treat the file as sensitive.)',
        options: ['I have pasted the path', 'Cancel'],
        expert: 'owner',
        tags: ['auth-gate', 'sensitive-input'],
      });
      chosenKey = (keyInput?.feedback || keyInput?.response || '').trim();
      if (!chosenKey || chosenKey === 'Cancel') return emptyResult;
    }
    auth = await ctx.task(gcloudAuthTask, { authMethod: chosenMethod, serviceAccountKeyFile: chosenKey, organizationId });
    if (!auth?.value?.loggedIn) throw new Error('GCP login failed.');
  }

  // ---- Project / scope selection breakpoint -------------------------------
  let resolvedProjects = projectIds;
  let resolvedScopeMode = scopeMode;
  if (resolvedScopeMode === 'organization' && !organizationId) {
    throw new Error('scopeMode="organization" requires organizationId.');
  }
  if (resolvedScopeMode !== 'organization' && resolvedProjects.length === 0) {
    const available = auth.value.availableProjects || [];
    const current = auth.value.currentProject;
    const projectLines = available.slice(0, 50).map(p => `  - ${p.projectId} (${p.name})${p.projectId === current ? ' [current]' : ''}`);
    if (available.length > 50) projectLines.push(`  ... and ${available.length - 50} more`);
    const subPick = await ctx.breakpoint({
      title: 'Confirm GCP scope',
      breakpointId: 'gcp-systems-discovery.scope-pick',
      question: [
        `Account: ${auth.value.currentAccount.email}`,
        `Current project: ${current || '<none>'}`,
        auth.value.organization ? `Org: ${auth.value.organization.displayName} (${auth.value.organization.id})` : 'No organization context.',
        `Available projects (${available.length}):`,
        ...projectLines,
      ].join('\n'),
      options: organizationId
        ? ['Scan ENTIRE organization (Cloud Asset Inventory)', 'Use current project only', 'Cancel']
        : ['Use current project only', 'Scan ALL active projects', 'Cancel'],
      expert: 'owner',
      tags: ['scope-gate', 'project-pick'],
    });
    if (!subPick?.approved || subPick.response === 'Cancel') return emptyResult;
    if (subPick.response.includes('ENTIRE organization')) resolvedScopeMode = 'organization';
    else if (subPick.response.includes('ALL active')) resolvedProjects = available.filter(p => p.lifecycleState === 'ACTIVE').map(p => p.projectId);
    else {
      resolvedProjects = current ? [current] : [];
      if (resolvedProjects.length === 0) throw new Error('No current project set; cannot proceed.');
    }
  }

  // ---- Phase 0: scope confirmation ----------------------------------------
  const scopeApproval = await ctx.breakpoint({
    title: 'Confirm GCP discovery scope',
    breakpointId: 'gcp-systems-discovery.scope',
    question: [
      resolvedScopeMode === 'organization'
        ? `Scope: ENTIRE ORGANIZATION ${organizationId} (Cloud Asset Inventory)`
        : `Projects (${resolvedProjects.length}): ${resolvedProjects.join(', ')}`,
      `Regions: ${regions.join(', ')} (some services are global)`,
      `System unit: ${systemUnit}${systemUnit === 'label' ? ` (label: ${systemLabelKey})` : ''}`,
      `GKE deep-dive: ${includeGkeDeepDive}`,
      `DNS records: ${includeDnsRecords}`,
      `Probe external endpoints (curl): ${probeExternalEndpoints}`,
      `Diagrams: ${diagrams}`,
      `Output dir: ${outputDir}`,
      `Service categories: ${serviceCategories ? serviceCategories.join(',') : 'all'}`,
    ].join('\n'),
    options: ['Approve', 'Adjust'],
    expert: 'owner',
    tags: ['scope-gate'],
  });
  if (!scopeApproval?.approved) return emptyResult;

  // ---- Discovery ---------------------------------------------------------
  const discoveries = [];
  const discoveryCommon = { regions, serviceCategories, includeGkeDeepDive, includeDnsRecords };
  if (resolvedScopeMode === 'organization') {
    const r = await ctx.task(discoveryTask, { scopeMode: 'organization', organizationId, ...discoveryCommon });
    discoveries.push(r?.value);
  } else {
    for (const projectId of resolvedProjects) {
      const r = await ctx.task(discoveryTask, { scopeMode: 'project', projectId, ...discoveryCommon });
      discoveries.push(r?.value);
    }
  }

  // Discovery already inlines a GKE kubectl probe + DNS records when flagged;
  // the standalone gkeDeepDiveTask + dnsRecordsTask are exposed for callers
  // that want to orchestrate them explicitly. Forward each project's GKE
  // artifact path to the gke-usage composer.
  const gkeManifests = includeGkeDeepDive
    ? discoveries.filter(d => d?.manifest?.gke?.path)
        .map(d => ({ projectId: d.projectId || null, manifestPath: d.manifest.gke.path }))
    : [];

  // ---- Composition (parallel) ---------------------------------------------
  const compositionResults = await Promise.all(
    discoveries.map(d => Promise.all([
      ctx.task(systemReportComposerTask, { manifest: d.manifest, outputDir, systemUnit, systemLabelKey }),
      includeGkeDeepDive
        ? ctx.task(gkeUsageReportTask, { gkeManifests: [{ manifestPath: d.manifest?.gke?.path, projectId: d.projectId }], outputDir })
        : Promise.resolve({ value: { clusters: 0 } }),
      ctx.task(networkAttributionTask, { manifest: d.manifest, outputDir }),
      ctx.task(exposureMapTask, { manifest: d.manifest, outputDir, probeExternalEndpoints }),
      diagrams !== 'none'
        ? ctx.task(diagramsTask, { manifest: d.manifest, outputDir, gkeManifests })
        : Promise.resolve({ value: { diagramsWritten: 0 } }),
    ]))
  );

  // ---- Index --------------------------------------------------------------
  const summary = {
    scopeMode: resolvedScopeMode,
    organizationId: resolvedScopeMode === 'organization' ? organizationId : null,
    projects: discoveries.map(d => ({ id: d.projectId || null, name: d.projectName || null })),
    headlineCounts: discoveries.reduce((acc, d) => {
      for (const [k, v] of Object.entries(d.headlineCounts || {})) {
        acc[k] = (acc[k] || 0) + (v || 0);
      }
      return acc;
    }, {}),
  };
  const idx = await ctx.task(indexTask, { outputDir, summary });

  // ---- Final review -------------------------------------------------------
  const approval = await ctx.breakpoint({
    title: 'Review discovery output',
    breakpointId: 'gcp-systems-discovery.final-review',
    question: `Discovery complete. Review files under ${outputDir}/.`,
    options: ['Approve', 'Request changes'],
    expert: 'owner',
    tags: ['final-review'],
  });

  return {
    success: approval?.approved === true,
    projects: resolvedScopeMode === 'organization'
      ? [`organizations/${organizationId}`]
      : resolvedProjects,
    regions,
    resources: summary.headlineCounts.resources || 0,
    systems: compositionResults.reduce((s, [sys]) => s + (sys?.value?.systemsCount || 0), 0),
    gkeClusters: summary.headlineCounts.gkeClusters || 0,
    loadBalancers: summary.headlineCounts.loadBalancers || 0,
    externalHostnames: compositionResults.reduce((s, [, , , exp]) => s + (exp?.value?.externalHostnames || 0), 0),
    reportFiles: compositionResults.flatMap(([sys]) => sys?.value?.reportFiles || []),
    indexFile: idx?.value?.indexFile ?? null,
  };
}

export default process;
