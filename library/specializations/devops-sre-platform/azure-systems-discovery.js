/**
 * @process contrib/devops/azure-systems-discovery
 * @description End-to-end Azure subscription discovery, system attribution, AKS
 *              deep-dive, network/gateway/listener attribution, external exposure
 *              map, and per-system topology diagrams. All tasks are agent-driven;
 *              there is no inter-task filesystem contract — agents self-manage
 *              working state under their task-scoped directory and pass typed
 *              results forward as JSON. The caller controls where the final
 *              reports land via `inputs.outputDir`.
 *
 * @inputs {
 *   subscriptionIds?: string[],   // omit to use current az account
 *   scopeMode?: 'current'|'all-in-tenant'|'list',
 *   systemUnit?: 'resource-group'|'tag'|'aks-namespace',
 *   systemTagKey?: string,
 *   includeAksDeepDive?: boolean,
 *   includeDnsRecords?: boolean,
 *   probeExternalEndpoints?: boolean,  // curl public hostnames to detect dead surfaces
 *   diagrams?: 'mermaid'|'mermaid+png'|'none',
 *   outputDir?: string,
 *   serviceCategories?: string[]       // restrict scan; default = all
 * }
 * @outputs {
 *   success: boolean,
 *   subscriptions: string[],
 *   resources: number,
 *   systems: number,
 *   aksClusters: number,
 *   appGateways: number,
 *   externalHostnames: number,
 *   reportFiles: string[]
 * }
 *
 * @skill azure-cloud specializations/devops-sre-platform/skills/azure-cloud/SKILL.md
 * @skill kubernetes-ops specializations/devops-sre-platform/skills/kubernetes-ops/SKILL.md
 * @agent infra-architect specializations/devops-sre-platform/agents/infra-architect/AGENT.md
 *
 * Service coverage (the discovery agent will probe ALL of these unless
 * `serviceCategories` is provided):
 *   - Compute: VMs, VMSS, Disks, Snapshots, Image Galleries, AVS, Bastion
 *   - Containers: AKS (incl. namespaces/workloads/services/ingresses), Container
 *     Apps + Environments, Container Instances, ACR
 *   - Web: App Service Plans + Webapps + Function Apps + Static Web Apps,
 *     API Management, Logic Apps
 *   - Data: SQL Server (single+elastic), Postgres (single+flexible), MySQL
 *     (single+flexible), Cosmos DB, Redis, Storage Accounts, Synapse, Data
 *     Factory, Databricks, HDInsight, Stream Analytics, Data Explorer
 *   - Messaging/Eventing: Service Bus, Event Hub, Event Grid, IoT Hub, SignalR,
 *     Communication Services, Web PubSub
 *   - AI/ML: Cognitive Services accounts (incl. OpenAI), Cognitive Search, ML
 *     Workspaces (incl. serverless endpoints), Document Intelligence
 *   - Networking: VNets, Subnets, Peerings, NSGs, Public IPs, Application
 *     Gateways (incl. WAF policies), Load Balancers, Front Door, AFD profiles,
 *     CDN, Traffic Manager, Azure Firewall, VPN Gateways, ExpressRoute, Private
 *     Endpoints, Private DNS Zones, DNS Zones
 *   - Identity/Secrets: Key Vaults, Managed Identities, Confidential Ledger
 *   - Observability: Log Analytics, App Insights, Monitor Action Groups, Alerts,
 *     Workbooks, Dashboards, Grafana
 *   - Security: Sentinel, Defender for Cloud, DDoS Plans, Bastion
 *   - Edge/Other: Maps, Static Web Apps, Spring Apps, Batch, Quantum, Azure Arc
 *
 * Agent-task design notes:
 *   - Every task is `kind: 'agent'`. Discovery agents run `az` (and `kubectl`
 *     where reachable) internally via Bash. Composition agents read the
 *     upstream agent's returned value plus any task-scoped artifacts whose
 *     paths are passed forward explicitly.
 *   - Agents that produce large intermediate state write under their own
 *     `tasks/<effectId>/artifacts/` directory and return paths to those
 *     artifacts. Downstream agents are passed those paths verbatim — there is
 *     no shared "raw/" directory anyone has to know about.
 *   - The single global path the user controls is `inputs.outputDir`, which is
 *     ONLY where the final composed reports land. Intermediate state stays
 *     under the run's `tasks/` tree.
 *   - Drift defense: composition agents read source data via Bash `cat` at
 *     execution time rather than receiving inlined bytes through the prompt.
 * @graph
 *   domains: [domain:devops]
 *   specializations: [specialization:devops-sre-platform]
 *   workflows: [workflow:capacity-planning]
 *   roles: [role:platform-engineer, role:devops-engineer]
 *   skillAreas: [skill-area:deployment-infrastructure-management]
 *   topics: [topic:infrastructure-as-code]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ---------------------------------------------------------------------------
// Bootstrap — ensure az CLI is installed and an identity is authenticated.
// Runs before discovery on a fresh machine. On a machine that's already set
// up, all phases short-circuit to "already-present".
// ---------------------------------------------------------------------------

const cliBootstrapTask = defineTask('azure-cli-bootstrap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Probe + install Azure CLI (az), kubectl, kubelogin, jq',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cloud-CLI installer',
      task: 'Detect whether az / kubectl / kubelogin / jq are installed and runnable. Install any missing tool, asking the user before installing if installPolicy is "ask".',
      context: {
        installPolicy: args.installPolicy,                    // 'ask' | 'auto' | 'never'
        preferredAzInstallMethod: args.preferredAzInstallMethod, // 'apt' | 'brew' | 'pip' | 'curl-script'
        platform: '<auto-detect via uname>',
      },
      instructions: [
        'Detect platform with `uname -s` and `uname -m`. Respect the user\'s preferredAzInstallMethod when possible.',
        'For each tool (az, kubectl, kubelogin, jq):',
        '  1. Run `which <tool>` and capture version. If present, mark `present: true`.',
        '  2. If missing and installPolicy=="never": mark `present: false, action: "skipped-by-policy"` and continue.',
        '  3. If missing and installPolicy=="ask": **DO NOT install yet** — return early with `pendingInstall: ["<tool>", ...]` so the orchestrator can raise a breakpoint. The orchestrator will re-call you with installPolicy="auto" once approved.',
        '  4. If missing and installPolicy=="auto": install via the preferred method:',
        '     - az: `curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash` (Linux apt) | `brew install azure-cli` (macOS) | `pip install azure-cli` (fallback). On Linux non-apt: try `curl https://azurecliprod.blob.core.windows.net/install | bash`.',
        '     - kubectl + kubelogin: `az aks install-cli --install-location $HOME/.local/bin/kubectl --kubelogin-install-location $HOME/.local/bin/kubelogin` (requires az to already be installed).',
        '     - jq: `apt-get install -y jq` | `brew install jq` | static binary download from github.com/stedolan/jq.',
        '  5. After install, re-probe to confirm.',
        'Always prefer non-sudo install paths (`$HOME/.local/bin`) when possible. Add to PATH instructions if needed.',
        'Return ONLY:',
        '{',
        '  "az": {"present": <bool>, "version": "<v>", "path": "<path>", "action": "already-present"|"installed"|"skipped-by-policy"|"failed", "error"?: "<msg>"},',
        '  "kubectl": {...same shape},',
        '  "kubelogin": {...same shape},',
        '  "jq": {...same shape},',
        '  "pendingInstall"?: [<tool-names>],',
        '  "ready": <bool>',
        '}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['az', 'jq', 'ready'] },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const azLoginTask = defineTask('azure-login', (args, taskCtx) => ({
  kind: 'agent',
  title: `Authenticate to Azure (method: ${args.authMethod})`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Azure auth assistant',
      task: 'Authenticate the local az CLI session using the chosen method.',
      context: {
        authMethod: args.authMethod,                  // 'use-existing' | 'interactive' | 'device-code' | 'service-principal' | 'managed-identity'
        servicePrincipal: args.servicePrincipal,      // {appId, tenantId, password|certificateFile} when authMethod=service-principal
        tenantHint: args.tenantHint,
      },
      instructions: [
        'Method `use-existing`: run `az account show` and confirm there is an active session. If not, fail and ask the user to switch authMethod.',
        'Method `interactive`: run `az login --tenant <hint>?` (omit --tenant if not provided). Requires a browser on the host running this process.',
        'Method `device-code`: run `az login --use-device-code --tenant <hint>?`. Print the device-code URL + code prominently — the user pastes it on another device.',
        'Method `service-principal`: run `az login --service-principal -u <appId> -p <password> --tenant <tenantId>` OR `az login --service-principal -u <appId> --certificate <path> --tenant <tenantId>`. Never log the password.',
        'Method `managed-identity`: run `az login --identity` (works inside Azure VMs / GH Actions OIDC).',
        'After login, run `az account list --output json` and `az account show --output json`. Return both.',
        'Return ONLY:',
        '{',
        '  "loggedIn": <bool>,',
        '  "method": "<method-actually-used>",',
        '  "currentAccount": {"id": "<sub-id>", "name": "<name>", "tenantId": "<tid>", "user": {"name": "<email>", "type": "user"|"servicePrincipal"}},',
        '  "availableAccounts": [{"id": "<sub-id>", "name": "<name>", "tenantId": "<tid>", "isDefault": <bool>, "state": "Enabled"|...}]',
        '}',
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

// ---------------------------------------------------------------------------
// Discovery — one comprehensive agent task that owns its own working dir.
// ---------------------------------------------------------------------------
// The agent's mission is the contract; how it organizes its own scratch space
// is its concern. It returns a manifest of artifact paths plus headline counts.

const discoveryTask = defineTask('azure-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Inventory subscription ${args.subscriptionId} (${args.serviceCategories?.length ? args.serviceCategories.join(',') : 'all categories'})`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Azure cloud auditor',
      task: 'Inventory every Azure resource in the target subscription and emit a manifest of artifact files (one per service category) under your task-scoped artifacts directory.',
      context: {
        subscriptionId: args.subscriptionId,
        serviceCategories: args.serviceCategories,
        artifactsDir: `tasks/${taskCtx.effectId}/artifacts`,
        includeAksDeepDive: args.includeAksDeepDive,
        includeDnsRecords: args.includeDnsRecords,
      },
      instructions: [
        'You own your own scratch directory. Write all intermediate JSON to `tasks/<effectId>/artifacts/`. Return a manifest of paths so downstream tasks can read what you produced. Never assume a fixed location like `infra/raw/` exists.',
        'Use `az account set --subscription <id>` first. Then walk every service category listed in the @description block of this process file. For each category:',
        '  - Azure CLI list/show commands first; fall back to `az resource list --resource-type ...` for any service the dedicated subcommand does not cover.',
        '  - For services that vary by region (e.g. Cognitive Services accounts), iterate regions or use the global list.',
        '  - For multi-tenant services (ML workspaces, Synapse, Databricks workspaces), pull child resources too (compute clusters, endpoints, datasets-by-name where cheap).',
        '  - Tolerate AccessDenied / Feature-Not-Registered per service. Record the failure in the manifest with reason; do not crash the loop.',
        'For AKS deep-dive (only if includeAksDeepDive): for each AKS cluster, attempt direct kubectl with `--admin` credentials + `kubelogin convert-kubeconfig -l azurecli`. If unreachable (private cluster), fall back to `az aks command invoke -c "<kubectl-cmd>"`. If PowerState is Stopped, record metadata only and skip kubectl. Always remove kubeconfig files from disk after use.',
        'For DNS (only if includeDnsRecords): pull every record set across every Azure DNS zone and Private DNS zone. Flag wildcards with `isWildcard: true`.',
        'Detect and record:',
        '  - VM power state (deallocated VMs cost $0 compute)',
        '  - AKS power state (Stopped clusters cost ~$25/mo not the full estimate)',
        '  - Unattached disks, unattached public IPs (waste candidates)',
        '  - Empty AppGW backend pools (broken backends)',
        '  - Webapp container image references (parse linuxFxVersion / windowsFxVersion); record source ACR name when present',
        '  - App Service Plan -> Webapp count (orphan ASPs are pure waste)',
        '  - AGIC backend pool naming convention (`pool-<ns>-<svc>-<port>-bp-<port>`) so attribution agents can cross-reference',
        'Return ONLY this JSON:',
        '{',
        '  "subscriptionId": "<id>",',
        '  "subscriptionName": "<name>",',
        '  "tenantId": "<tenantId>",',
        '  "manifest": {',
        '    "<category>": {"path": "<artifact-path>", "count": <int>, "note"?: "<error-or-warning>"}',
        '  },',
        '  "headlineCounts": {"resources": <int>, "resourceGroups": <int>, "aksClusters": <int>, "appGateways": <int>, "webapps": <int>, "asps": <int>, "publicIps": <int>, "loadBalancers": <int>, "vnets": <int>, "dnsZones": <int>}',
        '}',
        'Do not write to any path outside `tasks/<effectId>/artifacts/`. Do not assume the user has a particular output directory until the composition phase.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['subscriptionId', 'manifest', 'headlineCounts'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ---------------------------------------------------------------------------
// Composition agents. Each takes:
//   - the discovery manifest (paths to category JSON, NOT the bytes)
//   - the destination outputDir (the only path the user cares about)
// and produces output report files there.
// ---------------------------------------------------------------------------

const systemReportComposerTask = defineTask('azure-system-reports', (args, taskCtx) => ({
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
        systemTagKey: args.systemTagKey,
        outputDir: args.outputDir,
      },
      instructions: [
        'Read the discovery manifest. Each category points at a JSON artifact under the discovery task\'s scratch dir; `cat` those at execution time, do not assume their layout.',
        `System grouping (\`systemUnit\`):`,
        `  - 'resource-group': one report per RG`,
        `  - 'tag': group by tag value of '${args.systemTagKey}'; resources missing the tag go to a single 'untagged' report`,
        `  - 'aks-namespace': one report per AKS namespace (across all clusters), plus one per non-AKS RG`,
        `For each system: header (name, location(s), resource count), inventory grouped by category (Compute, Containers, Web, Data, Messaging, AI/ML, Networking, Identity, Observability, Security, Other), AKS subsection if any, networking subsection (VNets, AppGWs with listener counts, LBs, PIPs, NSGs), data subsection (with SKUs/tiers), cross-system dependencies (scan resource IDs).`,
        'Skip empty groupings with a single-line stub file. Do not paraphrase counts; compute them with jq from the artifacts.',
        `Use Read/Write/Glob/Bash freely. Write markdown files into ${args.outputDir}/systems/ — that path is the user-facing destination and the only fixed location in this process.`,
        'Return ONLY this JSON:',
        '{"systemsCount": <int>, "reportFiles": [<paths>]}',
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

const aksUsageReportTask = defineTask('azure-aks-usage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compose ${args.outputDir}/aks-usage.md`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Kubernetes platform engineer',
      task: `Generate ${args.outputDir}/aks-usage.md`,
      context: { manifest: args.manifest, outputDir: args.outputDir },
      instructions: [
        'Read the AKS artifact paths from the manifest. Each cluster has its own subdir with namespaces.json, workloads.json, services.json, ingresses.json, pods.json, top-pods.txt, top-nodes.txt, status.txt.',
        'Top: cluster summary table (name, RG, location, k8s version, node count, status: reachable-direct/reachable-cmd-invoke/unreachable/stopped).',
        'Per reachable cluster: per-namespace table sorted desc by summed CPU requests (cols: ns | pods | CPU req | mem req GiB | CPU lim | mem lim | actual CPU | actual mem | workloads). Skip pods with .status.phase in [Succeeded, Failed]. Parse pod resource strings ("100m"=0.1c, "1"=1c, "128Mi"=0.125GiB, "1Gi"=1GiB).',
        'Per-namespace detail (only non-system namespaces with workloads): workload list (kind/name/replicas/image), services, ingresses (with hosts/paths/backends), Gateway API resources.',
        'Detect ingress controllers (nginx-ingress / istio / appgw-ingress / contour / traefik) by namespace name + pod image patterns.',
        'Top 10 pods by CPU request and top 10 by mem request across all clusters.',
        'Recent Warning events grouped by reason.',
        'Return ONLY: {"clusters": <int>, "totalNamespaces": <int>, "totalWorkloads": <int>, "outputFile": "<path>"}',
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

const networkAttributionTask = defineTask('azure-network-attribution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compose ${args.outputDir}/network/`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Network architect',
      task: `Generate ${args.outputDir}/network/README.md plus one ${args.outputDir}/network/appgw-<name>.md per AppGW with non-empty config.`,
      context: { manifest: args.manifest, outputDir: args.outputDir },
      instructions: [
        'Use the AppGW, LB, PIP, VNet, Front Door, Traffic Manager artifacts from the manifest.',
        'Per AppGW with non-empty listeners: full chain table — listener (hostNames/protocol/port/SSL cert) -> rule (type, path map) -> backend pool -> backend addresses. Attribute each backend: FQDN ending `.azurewebsites.net` -> webapp; private IP -> AKS service (cross-ref against AKS services artifact); FQDN matching container app -> attribute to that; empty pool -> "unused/broken".',
        'Recognize the AGIC pool naming convention `pool-<ns>-<svc>-<port>-bp-<port>` and call out the AppGW as "AGIC-managed" when it dominates.',
        'LBs: classify AKS-managed (RG starts with MC_) vs user. List rules + backend pool members for user LBs.',
        'PIPs: every PIP with attribution (NIC->VM, AppGW frontend, LB frontend, container app env outbound, or unattached).',
        'Front Door / AFD / CDN / Traffic Manager: list each profile with origin/backend.',
        `Top-level network/README.md: VNets table, peering map, AppGW summary, LB summary, PIP inventory, DNS zones with record-set counts.`,
        'All counts via jq, not estimates.',
        'Return ONLY: {"vnets": <int>, "appGateways": <int>, "totalListeners": <int>, "loadBalancers": <int>, "publicIps": <int>, "files": [<paths>]}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['appGateways', 'totalListeners', 'files'] },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const exposureMapTask = defineTask('azure-exposure-map', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compose ${args.outputDir}/external-exposure.md`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security architect',
      task: `Generate ${args.outputDir}/external-exposure.md`,
      context: { manifest: args.manifest, outputDir: args.outputDir, probeExternalEndpoints: args.probeExternalEndpoints },
      instructions: [
        'Enumerate every public surface from the manifest:',
        '  1. Webapp hostnames (each .hostNames[] entry from the webapps artifact)',
        '  2. Container App FQDNs (incl. customDomains)',
        '  3. Static Web App default + custom domains',
        '  4. Function App URLs',
        '  5. Public IPs with .dnsLabel (resolves to <label>.<region>.cloudapp.azure.com)',
        '  6. AppGW listener hostNames grouped under their frontend public IP',
        '  7. AKS LoadBalancer services (.spec.type=LoadBalancer with .status.loadBalancer.ingress[].ip)',
        '  8. API Management gateway URLs + custom domains',
        '  9. Front Door / AFD endpoints + custom domains',
        '  10. Traffic Manager endpoints',
        '  11. Cognitive Services / OpenAI endpoint URLs (if enabled for public network)',
        '  12. DNS A/CNAME records from the DNS-zones artifact (Azure DNS + Private DNS)',
        '**Wildcard handling**: if a DNS record is a wildcard (.isWildcard==true OR .name=="*"), call out "Any subdomain not listed above also reaches <backend>" — this is OPEN SURFACE.',
        'Cross-reference each public hostname against an underlying Azure resource (matching IPs/FQDNs). Flag dangling DNS (target doesn\'t match any current resource) and broken backends (AppGW listener with empty backend pool, ingress with no service).',
        args.probeExternalEndpoints ? 'For each external HTTPS hostname, run `curl -sS -o /dev/null -w "%{http_code}" --max-time 15 -k https://<host>/` and add the response code as a column. Annotate 5xx as broken, 000 as timeout.' : 'Skip live probing.',
        'Cols: hostname | DNS source | resolves to | backing system | HTTPS? | status (active/broken/dormant/dangling).',
        'Headline counts at top.',
        'Return ONLY: {"externalHostnames": <int>, "broken": <int>, "danglingDns": <int>, "wildcardZones": <int>, "outputFile": "<path>"}',
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

const diagramsTask = defineTask('azure-diagrams', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compose mermaid diagrams under ${args.outputDir}/diagrams/`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cloud diagram author',
      task: `Generate mermaid diagrams under ${args.outputDir}/diagrams/.`,
      context: { manifest: args.manifest, outputDir: args.outputDir },
      instructions: [
        '1. global-topology.md — subscription-wide flowchart LR. Group RGs into subgraphs by location. Inside each RG show top-level resources by category. Edges between RG subgraphs for VNet peerings.',
        '2. network.md — networking flowchart LR: VNets+subnets, AppGWs (listener fan-out), LBs (frontend->rule->backend), Front Door, public IPs.',
        '3. <system-name>.md per system with >=3 resources (use the systemUnit grouping).',
        '4. aks-<cluster>.md per reachable AKS cluster (subgraphs per namespace with workload nodes).',
        'Cap each diagram at ~80 nodes; if larger, split or summarize "+N more".',
        'Return ONLY: {"diagramsWritten": <int>, "files": [<paths>]}',
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

const indexTask = defineTask('azure-index', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compose ${args.outputDir}/README.md`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical documentation author',
      task: `Generate ${args.outputDir}/README.md`,
      context: { outputDir: args.outputDir, summary: args.summary },
      instructions: [
        `Index sections: title + survey date + subscription identity + headline counts + per-system reports list (use Glob on ${args.outputDir}/systems/) + AKS link + Networking link + External exposure link + Diagrams list + Refresh instructions.`,
        'Use Glob to enumerate actual files; do not invent paths.',
        'Return ONLY: {"indexFile": "<path>", "linkedFiles": <int>}',
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

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    subscriptionIds = [],
    scopeMode = 'current',
    systemUnit = 'resource-group',
    systemTagKey = 'system',
    includeAksDeepDive = true,
    includeDnsRecords = true,
    probeExternalEndpoints = false,
    diagrams = 'mermaid',
    outputDir = 'azure-discovery',
    serviceCategories = null,
    installPolicy = 'ask',                  // 'ask' | 'auto' | 'never'
    preferredAzInstallMethod = null,        // 'apt' | 'brew' | 'pip' | 'curl-script'
    authMethod = 'use-existing',            // 'use-existing' | 'interactive' | 'device-code' | 'service-principal' | 'managed-identity'
    servicePrincipal = null,                // {appId, tenantId, password|certificateFile}
    tenantHint = null,
  } = inputs;

  // ---- Bootstrap: CLI install ---------------------------------------------
  let bootstrap = await ctx.task(cliBootstrapTask, { installPolicy: 'never', preferredAzInstallMethod });
  if (!bootstrap?.value?.ready) {
    const missing = bootstrap.value?.pendingInstall || ['az', 'jq'].filter(t => !bootstrap.value?.[t]?.present);
    if (installPolicy === 'never') {
      throw new Error(`Required CLIs missing: ${missing.join(', ')}. Re-run with installPolicy=ask or auto.`);
    }
    const installApproval = await ctx.breakpoint({
      title: 'Install missing Azure CLIs',
      breakpointId: 'azure-systems-discovery.install-clis',
      question: `Missing tools: ${missing.join(', ')}. Approve installation via ${preferredAzInstallMethod || 'auto-detected method'}?`,
      options: ['Approve install', 'Skip (run will fail)', 'Cancel'],
      expert: 'owner',
      tags: ['install-gate', 'pre-bootstrap'],
    });
    if (!installApproval?.approved || installApproval?.response === 'Cancel') {
      return { success: false, subscriptions: [], resources: 0, systems: 0, aksClusters: 0, appGateways: 0, externalHostnames: 0, reportFiles: [] };
    }
    if (installApproval.response === 'Approve install') {
      bootstrap = await ctx.task(cliBootstrapTask, { installPolicy: 'auto', preferredAzInstallMethod });
      if (!bootstrap?.value?.ready) throw new Error('Bootstrap install failed; see task output.');
    }
  }

  // ---- Bootstrap: login + account selection -------------------------------
  let auth = await ctx.task(azLoginTask, { authMethod, servicePrincipal, tenantHint });
  if (!auth?.value?.loggedIn) {
    // Re-ask for an explicit method
    const methodChoice = await ctx.breakpoint({
      title: 'Pick Azure authentication method',
      breakpointId: 'azure-systems-discovery.auth-method',
      question: 'No active az session found. How should I authenticate?',
      options: ['Interactive browser login', 'Device-code login', 'Use service principal (will ask for creds)', 'Cancel'],
      expert: 'owner',
      tags: ['auth-gate'],
    });
    if (!methodChoice?.approved || methodChoice.response === 'Cancel') {
      return { success: false, subscriptions: [], resources: 0, systems: 0, aksClusters: 0, appGateways: 0, externalHostnames: 0, reportFiles: [] };
    }
    const chosenMethod = methodChoice.response.includes('device') ? 'device-code'
      : methodChoice.response.includes('service') ? 'service-principal'
      : 'interactive';
    let chosenSp = servicePrincipal;
    if (chosenMethod === 'service-principal' && !chosenSp) {
      const spInput = await ctx.breakpoint({
        title: 'Provide Azure service principal credentials',
        breakpointId: 'azure-systems-discovery.sp-creds',
        question: 'Paste a JSON object {appId, tenantId, password OR certificateFile}. (Stored only in this task input.json — handle accordingly.)',
        options: ['I have pasted the JSON', 'Cancel'],
        expert: 'owner',
        tags: ['auth-gate', 'sensitive-input'],
      });
      try { chosenSp = JSON.parse(spInput?.feedback || spInput?.response || '{}'); } catch { chosenSp = null; }
    }
    auth = await ctx.task(azLoginTask, { authMethod: chosenMethod, servicePrincipal: chosenSp, tenantHint });
    if (!auth?.value?.loggedIn) throw new Error('Azure login failed.');
  }

  // ---- Subscription selection breakpoint ----------------------------------
  let resolvedSubs = subscriptionIds;
  if (resolvedSubs.length === 0) {
    if (scopeMode === 'all-in-tenant') {
      resolvedSubs = (auth.value.availableAccounts || []).filter(a => a.state === 'Enabled').map(a => a.id);
    } else {
      // 'current' or 'list' with empty subscriptionIds — confirm with user
      const subPick = await ctx.breakpoint({
        title: 'Confirm subscription(s) to scan',
        breakpointId: 'azure-systems-discovery.subscription-pick',
        question: [
          `Current default: ${auth.value.currentAccount.name} (${auth.value.currentAccount.id})`,
          `Available:`,
          ...((auth.value.availableAccounts || []).map(a => `  - ${a.name} (${a.id})${a.isDefault ? ' [default]' : ''}`)),
          ``,
          'Pick: use the default, scan ALL enabled subscriptions, or cancel.',
        ].join('\n'),
        options: ['Use current default', 'Scan ALL enabled subscriptions', 'Cancel'],
        expert: 'owner',
        tags: ['scope-gate', 'subscription-pick'],
      });
      if (!subPick?.approved || subPick.response === 'Cancel') {
        return { success: false, subscriptions: [], resources: 0, systems: 0, aksClusters: 0, appGateways: 0, externalHostnames: 0, reportFiles: [] };
      }
      resolvedSubs = subPick.response === 'Scan ALL enabled subscriptions'
        ? (auth.value.availableAccounts || []).filter(a => a.state === 'Enabled').map(a => a.id)
        : [auth.value.currentAccount.id];
    }
  }
  const subs = resolvedSubs;

  // Phase 0: scope confirmation
  const scopeApproval = await ctx.breakpoint({
    title: 'Confirm Azure discovery scope',
    breakpointId: 'azure-systems-discovery.scope',
    question: [
      `Subscriptions: ${subs.join(', ')}`,
      `System unit: ${systemUnit}${systemUnit === 'tag' ? ` (tag: ${systemTagKey})` : ''}`,
      `AKS deep-dive: ${includeAksDeepDive}`,
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
  if (!scopeApproval?.approved) {
    return { success: false, subscriptions: [], resources: 0, systems: 0, aksClusters: 0, appGateways: 0, externalHostnames: 0, reportFiles: [] };
  }

  // Discovery: one agent per subscription. Their result manifests are passed
  // forward as JSON; no shared filesystem location is assumed.
  const discoveries = [];
  for (const subscriptionId of subs) {
    const result = await ctx.task(discoveryTask, {
      subscriptionId,
      serviceCategories,
      includeAksDeepDive,
      includeDnsRecords,
    });
    discoveries.push(result?.value);
  }

  // Composition (parallel) — each composer takes the manifest and writes
  // markdown into the user's chosen outputDir.
  const compositionResults = await Promise.all(
    discoveries.map(d => Promise.all([
      ctx.task(systemReportComposerTask, { manifest: d.manifest, outputDir, systemUnit, systemTagKey }),
      includeAksDeepDive
        ? ctx.task(aksUsageReportTask, { manifest: d.manifest, outputDir })
        : Promise.resolve({ value: { clusters: 0 } }),
      ctx.task(networkAttributionTask, { manifest: d.manifest, outputDir }),
      ctx.task(exposureMapTask, { manifest: d.manifest, outputDir, probeExternalEndpoints }),
      diagrams !== 'none'
        ? ctx.task(diagramsTask, { manifest: d.manifest, outputDir })
        : Promise.resolve({ value: { diagramsWritten: 0 } }),
    ]))
  );

  // Index
  const summary = {
    subscriptions: discoveries.map(d => ({ id: d.subscriptionId, name: d.subscriptionName })),
    headlineCounts: discoveries.reduce((acc, d) => {
      for (const [k, v] of Object.entries(d.headlineCounts || {})) {
        acc[k] = (acc[k] || 0) + (v || 0);
      }
      return acc;
    }, {}),
  };
  const idx = await ctx.task(indexTask, { outputDir, summary });

  // Final review
  const approval = await ctx.breakpoint({
    title: 'Review discovery output',
    breakpointId: 'azure-systems-discovery.final-review',
    question: `Discovery complete. Review files under ${outputDir}/.`,
    options: ['Approve', 'Request changes'],
    expert: 'owner',
    tags: ['final-review'],
  });

  return {
    success: approval?.approved === true,
    subscriptions: subs,
    resources: summary.headlineCounts.resources || 0,
    systems: compositionResults.reduce((s, [sys]) => s + (sys?.value?.systemsCount || 0), 0),
    aksClusters: summary.headlineCounts.aksClusters || 0,
    appGateways: summary.headlineCounts.appGateways || 0,
    externalHostnames: compositionResults.reduce((s, [, , , exp]) => s + (exp?.value?.externalHostnames || 0), 0),
    reportFiles: compositionResults.flatMap(([sys]) => sys?.value?.reportFiles || []),
    indexFile: idx?.value?.indexFile ?? null,
  };
}

export default process;
