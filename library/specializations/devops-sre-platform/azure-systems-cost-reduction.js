/**
 * @process contrib/devops/azure-systems-cost-reduction
 * @description Azure cost-reduction workflow. Bootstraps az CLI + auth + sub
 *              selection (pattern from azure-systems-discovery), pulls
 *              pricing/advisor/cost-mgmt/reservation data, estimates per-
 *              resource monthly $, builds prioritized recommendations across
 *              5 risk tiers, walks each through a per-action breakpoint with
 *              mandatory backup-before-destroy on Tier 4. Every task is
 *              `kind:'agent'`; agents run `az`/`jq` via Bash in their own
 *              `tasks/<effectId>/` scratch dir. Tasks pass JSON forward via
 *              `result.value` — no shared FS contract. The only user-
 *              controlled path is `inputs.outputDir` (final report only).
 *
 * @inputs {
 *   subscriptionId?: string, outputDir?: string,
 *   discoveryManifest?: object|null,             // if null, run minimal local inventory
 *   targetSavingsPercent?: number=25, maxRiskTier?: 1|2|3|4|5=4,
 *   defaultBackupBeforeDestroy?: boolean=true,
 *   backupContainerStorageAccount?: string|null, // SA where blob/SQL backups land
 *   currency?: string='USD',
 *   installPolicy?: 'ask'|'auto'|'never', preferredAzInstallMethod?: 'apt'|'brew'|'pip'|'curl-script'|null,
 *   authMethod?: 'use-existing'|'interactive'|'device-code'|'service-principal'|'managed-identity',
 *   servicePrincipal?: {appId,tenantId,password|certificateFile}|null, tenantHint?: string|null
 * }
 * @outputs {
 *   success: boolean, recommendationsCount: number,
 *   actionsApplied: number, actionsSkipped: number,
 *   estimatedSavingsUsd: number, reportFile: string|null
 * }
 *
 * @skill azure-cloud specializations/devops-sre-platform/skills/azure-cloud/SKILL.md
 * @skill finops      specializations/devops-sre-platform/skills/finops/SKILL.md
 * @agent infra-architect specializations/devops-sre-platform/agents/infra-architect/AGENT.md
 *
 * Coverage: Compute (VMs/VMSS/Disks/Bastion), Containers (AKS, Container
 * Apps, ACI, ACR), Web (ASP/Webapps/Functions/SWA, APIM, Logic Apps), Data
 * (SQL, Postgres, MySQL, Cosmos, Redis, Storage, Synapse, Data Factory,
 * Databricks, HDInsight), Messaging (Service Bus, Event Hub, Event Grid,
 * IoT Hub, SignalR, Web PubSub), AI/ML (Cognitive incl. OpenAI, Cognitive
 * Search, ML workspaces), Networking (VNets, NSGs, PIPs, AppGW, LB, Front
 * Door, AFD, CDN, Traffic Manager, Azure Firewall, Bastion, VPN/ER, Private
 * Endpoints, DNS), Identity (Key Vaults), Observability (Log Analytics, App
 * Insights, Grafana), Security (Sentinel, Defender, DDoS).
 *
 * Risk tiers: 1=cosmetic (empty RGs, dangling DNS) | 2=rightsize (SKU down,
 * ZRS->LRS, scale, Spot) | 3=reservations/savings plans (irreversible) |
 * 4=decommission (delete idle; backup default) | 5=cluster-level (AKS shrink/
 * delete, ML compute removal).
 *
 * Backup methodology (Tier 4): Disk->`az snapshot create`; VM->`az group
 * export` + disk snapshots; SQL DB->`az sql db export`; Postgres->`az postgres
 * flexible-server backup`; Cosmos->continuous-backup note or container export;
 * Storage->`az storage blob copy` to backup container; Webapp->config + image
 * ref capture; ACR->repo+manifest list; Network resources->`az group export`
 * (config-only, recreatable).
 * @graph
 *   domains: [domain:devops]
 *   specializations: [specialization:devops-sre-platform]
 *   workflows: [workflow:capacity-planning]
 *   roles: [role:platform-engineer, role:devops-engineer]
 *   skillAreas: [skill-area:capacity-planning-ops]
 *   topics: [topic:platform-engineering-practices]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ---------------------------------------------------------------------------
// Bootstrap — identical pattern to azure-systems-discovery.
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
        installPolicy: args.installPolicy,                       // 'ask' | 'auto' | 'never'
        preferredAzInstallMethod: args.preferredAzInstallMethod, // 'apt' | 'brew' | 'pip' | 'curl-script'
        platform: '<auto-detect via uname>',
      },
      instructions: [
        'Detect platform via `uname -s/-m`; respect preferredAzInstallMethod. For each tool (az, kubectl, kubelogin, jq): probe with `which`, capture version.',
        'Missing handling: never -> `action:"skipped-by-policy"`; ask -> return early with `pendingInstall:["<tool>",...]` so orchestrator raises a breakpoint (it will re-call with installPolicy="auto"); auto -> install:',
        '  az: `curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash` (apt) | `brew install azure-cli` | `pip install azure-cli` | curl install script.',
        '  kubectl+kubelogin: `az aks install-cli --install-location $HOME/.local/bin/kubectl --kubelogin-install-location $HOME/.local/bin/kubelogin`.',
        '  jq: apt/brew or static binary from github.com/stedolan/jq.',
        'Prefer non-sudo paths (`$HOME/.local/bin`). Re-probe after install.',
        'Return ONLY: {"az":{"present":<b>,"version":"<v>","path":"<p>","action":"already-present"|"installed"|"skipped-by-policy"|"failed","error"?:"<m>"}, "kubectl":{...same shape}, "kubelogin":{...same shape}, "jq":{...same shape}, "pendingInstall"?:[<tool-names>], "ready":<b>}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['az', 'jq', 'ready'] },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
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
        authMethod: args.authMethod,             // 'use-existing' | 'interactive' | 'device-code' | 'service-principal' | 'managed-identity'
        servicePrincipal: args.servicePrincipal, // {appId, tenantId, password|certificateFile}
        tenantHint: args.tenantHint,
      },
      instructions: [
        'Methods: `use-existing` -> `az account show` (fail+ask user to switch if empty); `interactive` -> `az login --tenant <hint>?` (browser); `device-code` -> `az login --use-device-code --tenant <hint>?` (print URL+code prominently); `service-principal` -> `az login --service-principal -u <appId> -p <password> --tenant <tenantId>` OR `--certificate <path>` (NEVER log password); `managed-identity` -> `az login --identity`.',
        'After login: `az account list -o json` + `az account show -o json`.',
        'Return ONLY: {"loggedIn":<b>,"method":"<used>","currentAccount":{"id":"<sub>","name":"<n>","tenantId":"<t>","user":{"name":"<e>","type":"user"|"servicePrincipal"}},"availableAccounts":[{"id":"<sub>","name":"<n>","tenantId":"<t>","isDefault":<b>,"state":"Enabled"|...}]}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['loggedIn', 'currentAccount'] },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

// ---------------------------------------------------------------------------
// Pricing data — public retail prices + advisor + cost mgmt + reservations.
// ---------------------------------------------------------------------------

const pricingDataTask = defineTask('azure-pricing-data', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pull pricing + advisor + cost-mgmt + reservation utilization (sub ${args.subscriptionId})`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Azure FinOps data collector',
      task: 'Collect all data needed to estimate monthly $ per resource and to surface cost recommendations. Write to your task scratch dir; return a manifest of artifact paths.',
      context: {
        subscriptionId: args.subscriptionId,
        currency: args.currency,
        artifactsDir: `tasks/${taskCtx.effectId}/artifacts`,
      },
      instructions: [
        '`az account set --subscription <id>` first. Write everything under artifactsDir; do not write outside it. Tolerate AccessDenied/FeatureNotRegistered per call (record reason; never crash).',
        '1. Retail Prices API (public, no auth) — `https://prices.azure.com/api/retail/prices` with `$filter=` per category: serviceFamily=Compute; serviceName in {Storage, Azure SQL Database, Azure Database for PostgreSQL, Cognitive Services, Service Bus, Event Hubs, API Management, Container Apps, Front Door, Azure Bastion, Azure Firewall, Virtual Network}. Follow NextPageLink (cap ~10k rows/category). Keep currencyCode==<currency> & priceType==Consumption. Save as `prices/<service-slug>.json`.',
        '2. Advisor: `az advisor recommendation list --category Cost -o json > advisor-cost.json`.',
        '3. Cost Mgmt (best-effort; sponsorship/EA scopes often return 0 rows): `az rest --method post --uri "https://management.azure.com/subscriptions/<id>/providers/Microsoft.CostManagement/query?api-version=2023-11-01" --body @body.json` grouped by ResourceId, last 30d, ActualCost, granularity=None -> `costmgmt-by-resource.json`. On 4xx/empty save `{"rows":[],"note":"<reason>"}`.',
        '4. Reservations: `az reservations reservation-order list -o json > reservation-orders.json`; per-order `az reservations reservation list --reservation-order-id <id>` and `az consumption reservation summary list --grain monthly --reservation-order-id <id>`.',
        '5. Savings plans (best-effort): `az rest --method get --uri "https://management.azure.com/providers/Microsoft.BillingBenefits/savingsPlans?api-version=2022-11-01"`.',
        'Return ONLY: {"subscriptionId":"<id>","currency":"<c>","manifest":{"prices":{"dir":"<d>","files":[<p>],"totalRows":<n>},"advisor":{"path":"<p>","count":<n>,"note"?:"<m>"},"costMgmt":{"path":"<p>","rowCount":<n>,"note"?:"<m>"},"reservations":{"path":"<p>","orders":<n>,"note"?:"<m>"},"savingsPlans":{"path":"<p>","count":<n>,"note"?:"<m>"}}}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['subscriptionId', 'manifest'] },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

// ---------------------------------------------------------------------------
// Cost estimation — joins pricing data with inventory (discovery manifest if
// provided, else a minimal local inventory).
// ---------------------------------------------------------------------------

const costEstimationTask = defineTask('azure-cost-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Estimate monthly $ per resource (sub ${args.subscriptionId})`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Azure FinOps estimator',
      task: 'Compute a monthlyUsd estimate for every billable resource. If `discoveryManifest` is null, run a minimal inventory yourself with `az resource list` + targeted `az <svc> list` calls.',
      context: {
        subscriptionId: args.subscriptionId,
        currency: args.currency,
        pricingManifest: args.pricingManifest,
        discoveryManifest: args.discoveryManifest,
        artifactsDir: `tasks/${taskCtx.effectId}/artifacts`,
      },
      instructions: [
        '`az account set --subscription <id>` first.',
        'Inventory: if discoveryManifest provided, `cat` its category artifacts (`test -r` first; fall back to direct `az` calls on miss). Else run minimal inventory: `az resource list -o json` plus targeted lists for VMs (`az vm list -d`), disks, AKS, ASPs, webapps, SQL, Postgres flexible, Cosmos, storage, Service Bus, Event Hub, AppGW, LB, PIP, Front Door, APIM, Container Apps envs, Cognitive Services, ML/Synapse/Databricks workspaces, Bastion, Azure Firewall, VPN, Log Analytics.',
        'Estimate monthlyUsd at 730h/mo using prices manifest. Per-service rules:',
        '  VM: armSkuName+region+OS hourly*730 (0 if powerState==deallocated). Disk: skuName+sizeGB tier; unattached=full+waste. AKS: sum(node-pool VM)+control plane (Standard ~$73, Free $0; Stopped+Standard ~$25). ASP: tier+sku+instanceCount*730 (webapps free). SQL DB: edition+serviceObjective hourly. Postgres flex: tier+sku hourly. Cosmos: provisioned RU/s, else "consumption-billed". Storage: redundancy+tier/TB (low confidence w/o usedCapacity). PIP: ~$3.65 std-static, ~$0 basic-dynamic; flag unattached. AppGW: tier base+capacity-units. LB: Std rule-count, Basic free. Bastion: ~$140 Std, ~$87 Basic. Azure Firewall: ~$912 Std, ~$1462 Prem+per-GB. VPN GW: SKU-based (VpnGw1 ~$140, VpnGw2 ~$370). ExpressRoute: SKU+bandwidth. Front Door/AFD: base+per-GB (low confidence). APIM: Dev ~$50, Basic ~$150, Std ~$700, Prem ~$2900/unit. Container Apps env: per-vCPU-s+per-GiB-s active (low confidence). Cognitive/OpenAI: consumption-only -> null+note. Log Analytics/App Insights: ingestion -> use costMgmt rows or null. Default no-match: null + confidence="unknown".',
        'If costMgmt has rows for a resourceId, OVERRIDE estimate with actual 30d spend (source:"actual" vs "estimate").',
        'Waste signals: `unattached`, `idle` (vm deallocated >7d), `orphan-asp` (ASP w/ 0 webapps), `empty-aks` (0 user ns or non-system pods), `oversized` (sku above costMgmt util), `wrong-redundancy` (ZRS/GRS w/o need), `no-recent-traffic` ($0/30d but provisioned).',
        'Write `estimated-resources.json` rows `{id,name,type,rg,location,sku,monthlyUsd,monthlyUsdConfidence,source,wasteSignals[],notes?}` sorted desc by monthlyUsd.',
        'Return ONLY: {"subscriptionId":"<id>","estimatedResourcesPath":"<p>","totalMonthlyUsd":<n>,"byCategory":{"<cat>":<n>},"wasteCandidates":<n>,"resourcesEstimated":<n>,"resourcesUnknown":<n>}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['estimatedResourcesPath', 'totalMonthlyUsd'] },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

// ---------------------------------------------------------------------------
// Recommendations build.
// ---------------------------------------------------------------------------

const recommendationsBuildTask = defineTask('azure-recommendations-build', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build prioritized cost recommendations (target ${args.targetSavingsPercent}%)`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Azure FinOps strategist',
      task: 'Read the estimated-resources.json + advisor JSON + reservation utilization, then emit a prioritized recommendations.json with one entry per actionable item across the 5 risk tiers.',
      context: {
        estimatedResourcesPath: args.estimatedResourcesPath,
        pricingManifest: args.pricingManifest,
        targetSavingsPercent: args.targetSavingsPercent,
        defaultBackupBeforeDestroy: args.defaultBackupBeforeDestroy,
        backupContainerStorageAccount: args.backupContainerStorageAccount,
        artifactsDir: `tasks/${taskCtx.effectId}/artifacts`,
      },
      instructions: [
        '`cat` estimated-resources.json + advisor + reservation artifacts at execution time.',
        'Row schema: {id:"rec-<hash>", tier:1..5, title, resourceId, resourceName, resourceType, rg, location, currentSku, proposedSku, estimatedMonthlySavingsUsd, confidence:"high|medium|low", rationale, consequences, reversibility:"trivial|medium|hard|irreversible", backupNeeded:<b>, backupKind:"snapshot|sql-export|pg-backup|cosmos-export|blob-copy|webapp-export|acr-manifest|arm-export|none", backupCommand, suggestedAction, verifyCommand} — every command a single shell line.',
        'Tier rules:',
        '  T1 cosmetic: empty RG (`az group delete -n <rg> --yes --no-wait`), dangling DNS (`az network dns record-set <type> delete`). reversibility=trivial; backupNeeded=false.',
        '  T2 rightsize: lower ASP SKU; storage ZRS/GRS->LRS (`az storage account update --sku Standard_LRS`); lower SQL objective (`az sql db update --service-objective`); shrink AKS pool (`az aks nodepool scale --node-count`); VMSS Spot (`az vmss update --priority Spot`). reversibility=medium.',
        '  T3 reservations/savings plans: suggestedAction `az reservations reservation-order purchase ...`. reversibility=irreversible; backupNeeded=false.',
        '  T4 decommission: unattached disk/PIP delete; orphan ASP; VM deallocated >30d; empty AppGW; unused Bastion/Firewall/VPN/Front Door. reversibility=hard|irreversible; backupNeeded=defaultBackupBeforeDestroy && data-bearing.',
        '  T5 cluster-level: AKS pool shrink, `az aks stop`, `az aks delete`, `az ml compute delete`, `az databricks workspace delete`. reversibility=hard; backupNeeded=true for clusters with PVCs (backup must ARM-export cluster + snapshot every PVC-attached managed disk).',
        'Backup command authoring per backupKind:',
        '  snapshot (Disk) -> `az snapshot create -g <rg> -n <name>-pre-delete-snap --source <disk-id>`',
        '  arm-export (VM) -> `az group export -n <rg> --resource-ids <vm-id> > <backupsDir>/<vm>.json` + snapshot every attached managed disk',
        '  sql-export -> `az sql db export -s <srv> -n <db> -g <rg> --storage-key-type StorageAccessKey --storage-key <key> --storage-uri https://<sa>.blob.core.windows.net/sqlbackups/<db>.bacpac --admin-user <u> --admin-password <p>`. If backupContainerStorageAccount unset, FAIL with note "no backup SA configured".',
        '  pg-backup -> `az postgres flexible-server backup create -g <rg> -n <srv> --backup-name pre-delete-<ts>`',
        '  cosmos-export -> if continuous-backup on, note "PITR available"; else `az cosmosdb sql container ... export` per container.',
        '  blob-copy (Storage) -> `az storage blob copy start-batch --source-account-name <a> --source-container <c> --destination-container <backupContainerStorageAccount>/<a>-<c>-bak`',
        '  webapp-export -> `az webapp config show ... > <backupsDir>/<app>-config.json` + `az webapp config container show ... > <backupsDir>/<app>-image.json`',
        '  acr-manifest -> `az acr repository list -n <acr> > <backupsDir>/<acr>-repos.json` + per-repo `az acr repository show-manifests`',
        '  arm-export (network AppGW/LB/PIP/NSG/FW/VPN) -> `az group export -g <rg> --resource-ids <id> > <backupsDir>/<name>-arm.json` (config-only, recreatable)',
        'Sort recs desc by estimatedMonthlySavingsUsd within each tier; emit T1..T5 in order. Aim for targetSavingsPercent but never fabricate savings. Write `recommendations.json` to artifactsDir.',
        'Return ONLY: {"recommendationsPath":"<p>","countsByTier":{"1":<n>,"2":<n>,"3":<n>,"4":<n>,"5":<n>},"totalRecommendations":<n>,"totalEstimatedSavingsUsd":<n>}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['recommendationsPath', 'totalRecommendations'] },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

// ---------------------------------------------------------------------------
// Tiny JSON-loader agent so the orchestrator never inlines artifact bytes.
// ---------------------------------------------------------------------------

const loadJsonTask = defineTask('azure-load-json', (args, taskCtx) => ({
  kind: 'agent',
  title: `Load JSON: ${args.path}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'JSON loader',
      task: `Read the JSON file at ${args.path} and return its parsed contents under the key "data". If the file is missing or unreadable, return {"data": null, "error": "<msg>"}.`,
      context: { path: args.path },
      instructions: [
        '`cat` the file via Bash; return parsed JSON wrapped as `{"data":<contents>}`. Do NOT summarize/paraphrase/reformat — preserve every field. If missing or invalid, return `{"data":null,"error":"<reason>"}`.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object' },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

// ---------------------------------------------------------------------------
// Backup / Apply / Verify — generic agents driven by the recommendation row.
// ---------------------------------------------------------------------------

const backupTask = defineTask('azure-backup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Backup ${args.recommendation?.resourceName} (${args.recommendation?.backupKind})`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Azure backup operator',
      task: 'Run the recommendation\'s backupCommand to capture state before a destructive action. Write outputs under your task scratch dir.',
      context: {
        recommendation: args.recommendation,
        subscriptionId: args.subscriptionId,
        backupContainerStorageAccount: args.backupContainerStorageAccount,
        backupsDir: `tasks/${taskCtx.effectId}/backups`,
      },
      instructions: [
        '`az account set --subscription <id>`. `mkdir -p <backupsDir>`.',
        'If `recommendation.backupKind=="none"` OR `recommendation.backupCommand` empty: return `{"success":true,"skipped":true,"reason":"no backup needed"}`.',
        'If backupCommand needs `<backupContainerStorageAccount>` and none configured: return `{"success":false,"skipped":true,"reason":"no backup storage account configured"}`.',
        'Substitute `<backupsDir>` for path placeholders and `<backupContainerStorageAccount>` for the SA placeholder. Run backupCommand via Bash; capture stdout/stderr/exitCode. For ARM exports/config dumps verify output file is non-empty and parseable. For snapshots re-run `az snapshot show` to confirm provisioningState==Succeeded.',
        'Return ONLY: {"success":<b>,"skipped":<b>,"backupKind":"<k>","backupArtifacts":[<paths-or-resource-ids>],"stdoutTail":"<~40 lines>","stderrTail":"<~40 lines>","exitCode":<n>,"reason"?:"<m>"}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['success'] },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

const applyTask = defineTask('azure-apply', (args, taskCtx) => ({
  kind: 'agent',
  title: `Apply: ${args.recommendation?.title}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Azure change operator',
      task: 'Execute the recommendation\'s suggestedAction against Azure via the az CLI.',
      context: {
        recommendation: args.recommendation,
        subscriptionId: args.subscriptionId,
      },
      instructions: [
        '`az account set --subscription <id>`. Run `recommendation.suggestedAction` verbatim via Bash. Do not improvise extra deletes.',
        'For long-poll ops (delete/update VM, AKS), prefer `--no-wait` then poll `az resource show --ids <id> --query "provisioningState"` until Succeeded/NotFound or 5min timeout.',
        'Return ONLY: {"success":<b>,"exitCode":<n>,"stdoutTail":"<~40 lines>","stderrTail":"<~40 lines>","summary":"<one-line>"}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['success'] },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

const verifyTask = defineTask('azure-verify', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify: ${args.recommendation?.title}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Azure change verifier',
      task: 'Re-query the resource to confirm the change took effect.',
      context: {
        recommendation: args.recommendation,
        subscriptionId: args.subscriptionId,
      },
      instructions: [
        '`az account set --subscription <id>`. Run `recommendation.verifyCommand` via Bash. If absent, infer from resourceId: `az resource show --ids <id> -o json` and inspect expected delta.',
        'Decision rules: T1/T4 delete verified if ResourceNotFound or provisioningState==Deleting/Succeeded; T2 verified if observed sku matches proposedSku; T3 verified if `az reservations reservation list` shows the new order id; T5 verified if observed nodeCount/powerState matches expectation.',
        'Return ONLY: {"verified":<b>,"observed":<obj>,"note"?:"<m>"}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['verified'] },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

// ---------------------------------------------------------------------------
// Final report.
// ---------------------------------------------------------------------------

const finalReportTask = defineTask('azure-cost-final-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compose ${args.outputDir}/cost-reduction-report.md`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FinOps report author',
      task: `Compose ${args.outputDir}/cost-reduction-report.md plus ${args.outputDir}/cost-reduction-actions.json from the run log.`,
      context: {
        outputDir: args.outputDir,
        subscriptionId: args.subscriptionId,
        currency: args.currency,
        recommendationsPath: args.recommendationsPath,
        estimatedResourcesPath: args.estimatedResourcesPath,
        actionLog: args.actionLog,
        totals: args.totals,
      },
      instructions: [
        '`cat` recommendationsPath + estimatedResourcesPath at execution time. `mkdir -p <outputDir>`.',
        'Markdown sections: 1) title+date+sub+currency; 2) headline (total monthly spend est, total est savings, % vs target, applied/skipped counts); 3) spend-by-category table + top-20 most expensive resources; 4) per-tier (1..5) table with cols rec-id|resource|savings|confidence|reversibility|status|backup-status; 5) backups produced (rec-id|kind|artifacts); 6) failures+reasons; 7) Tier 3 reservation candidates flagged "decisions, not deletions"; 8) reversal hints per applied T4 action (exact `az` restore command); 9) next-run suggestions.',
        'Also write `cost-reduction-actions.json` with full structured action log so next run can diff. Counts via jq.',
        'Return ONLY: {"reportFile":"<p>","actionsJsonFile":"<p>","appliedCount":<n>,"skippedCount":<n>,"estimatedSavingsUsd":<n>}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['reportFile'] },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    subscriptionId = null, outputDir = 'azure-cost-reduction', discoveryManifest = null,
    targetSavingsPercent = 25, maxRiskTier = 4, defaultBackupBeforeDestroy = true,
    backupContainerStorageAccount = null, currency = 'USD',
    installPolicy = 'ask', preferredAzInstallMethod = null,
    authMethod = 'use-existing', servicePrincipal = null, tenantHint = null,
  } = inputs;

  const emptyResult = { success: false, recommendationsCount: 0, actionsApplied: 0, actionsSkipped: 0, estimatedSavingsUsd: 0, reportFile: null };

  // ---- Bootstrap: CLI install ---------------------------------------------
  let bootstrap = await ctx.task(cliBootstrapTask, { installPolicy: 'never', preferredAzInstallMethod });
  if (!bootstrap?.value?.ready) {
    const missing = bootstrap.value?.pendingInstall || ['az', 'jq'].filter(t => !bootstrap.value?.[t]?.present);
    if (installPolicy === 'never') throw new Error(`Required CLIs missing: ${missing.join(', ')}. Re-run with installPolicy=ask or auto.`);
    const installApproval = await ctx.breakpoint({
      title: 'Install missing Azure CLIs',
      breakpointId: 'azure-systems-cost-reduction.install-clis',
      question: `Missing tools: ${missing.join(', ')}. Approve installation via ${preferredAzInstallMethod || 'auto-detected method'}?`,
      options: ['Approve install', 'Skip (run will fail)', 'Cancel'],
      expert: 'owner', tags: ['install-gate', 'pre-bootstrap'],
    });
    if (!installApproval?.approved || installApproval?.response === 'Cancel') return emptyResult;
    if (installApproval.response === 'Approve install') {
      bootstrap = await ctx.task(cliBootstrapTask, { installPolicy: 'auto', preferredAzInstallMethod });
      if (!bootstrap?.value?.ready) throw new Error('Bootstrap install failed; see task output.');
    }
  }

  // ---- Bootstrap: login + account selection -------------------------------
  let auth = await ctx.task(azLoginTask, { authMethod, servicePrincipal, tenantHint });
  if (!auth?.value?.loggedIn) {
    const methodChoice = await ctx.breakpoint({
      title: 'Pick Azure authentication method',
      breakpointId: 'azure-systems-cost-reduction.auth-method',
      question: 'No active az session found. How should I authenticate?',
      options: ['Interactive browser login', 'Device-code login', 'Use service principal (will ask for creds)', 'Cancel'],
      expert: 'owner', tags: ['auth-gate'],
    });
    if (!methodChoice?.approved || methodChoice.response === 'Cancel') return emptyResult;
    const chosenMethod = methodChoice.response.includes('device') ? 'device-code'
      : methodChoice.response.includes('service') ? 'service-principal' : 'interactive';
    let chosenSp = servicePrincipal;
    if (chosenMethod === 'service-principal' && !chosenSp) {
      const spInput = await ctx.breakpoint({
        title: 'Provide Azure service principal credentials',
        breakpointId: 'azure-systems-cost-reduction.sp-creds',
        question: 'Paste a JSON object {appId, tenantId, password OR certificateFile}.',
        options: ['I have pasted the JSON', 'Cancel'],
        expert: 'owner', tags: ['auth-gate', 'sensitive-input'],
      });
      try { chosenSp = JSON.parse(spInput?.feedback || spInput?.response || '{}'); } catch { chosenSp = null; }
    }
    auth = await ctx.task(azLoginTask, { authMethod: chosenMethod, servicePrincipal: chosenSp, tenantHint });
    if (!auth?.value?.loggedIn) throw new Error('Azure login failed.');
  }

  // ---- Subscription confirmation ------------------------------------------
  let resolvedSub = subscriptionId;
  if (!resolvedSub) {
    const subPick = await ctx.breakpoint({
      title: 'Confirm subscription to optimize',
      breakpointId: 'azure-systems-cost-reduction.subscription-pick',
      question: [
        `Current default: ${auth.value.currentAccount.name} (${auth.value.currentAccount.id})`,
        `Available:`,
        ...((auth.value.availableAccounts || []).map(a => `  - ${a.name} (${a.id})${a.isDefault ? ' [default]' : ''}`)),
        ``, 'Use the default, or cancel to re-run with explicit subscriptionId.',
      ].join('\n'),
      options: ['Use current default', 'Cancel'],
      expert: 'owner', tags: ['scope-gate', 'subscription-pick'],
    });
    if (!subPick?.approved || subPick.response === 'Cancel') return emptyResult;
    resolvedSub = auth.value.currentAccount.id;
  }

  // ---- Scope confirmation -------------------------------------------------
  const scopeApproval = await ctx.breakpoint({
    title: 'Confirm cost-reduction scope',
    breakpointId: 'azure-systems-cost-reduction.scope',
    question: [
      `Subscription: ${resolvedSub}`,
      `Target savings: ${targetSavingsPercent}%   Max risk tier: ${maxRiskTier} (1=cosmetic, 5=cluster-level)`,
      `Backup before destroy: ${defaultBackupBeforeDestroy}   Backup SA: ${backupContainerStorageAccount || '(none — data backups via blob-copy/SQL-export will be skipped)'}`,
      `Currency: ${currency}   Discovery manifest: ${discoveryManifest ? 'provided' : 'absent (will run minimal local inventory)'}   Output dir: ${outputDir}`,
    ].join('\n'),
    options: ['Approve', 'Adjust'],
    expert: 'owner', tags: ['scope-gate'],
  });
  if (!scopeApproval?.approved) return emptyResult;

  // ---- Pricing data + cost estimation + recommendations build -------------
  const pricing = await ctx.task(pricingDataTask, { subscriptionId: resolvedSub, currency });
  const estimation = await ctx.task(costEstimationTask, {
    subscriptionId: resolvedSub, currency, pricingManifest: pricing?.value?.manifest, discoveryManifest,
  });
  const recsBuild = await ctx.task(recommendationsBuildTask, {
    estimatedResourcesPath: estimation?.value?.estimatedResourcesPath,
    pricingManifest: pricing?.value?.manifest,
    targetSavingsPercent, defaultBackupBeforeDestroy, backupContainerStorageAccount,
  });

  // ---- Load recommendations via tiny agent (drift defense) ----------------
  const recsLoad = await ctx.task(loadJsonTask, { path: recsBuild?.value?.recommendationsPath });
  const recommendations = Array.isArray(recsLoad?.value?.data)
    ? recsLoad.value.data
    : (recsLoad?.value?.data?.recommendations || []);

  // ---- Loop recommendations -----------------------------------------------
  const skippedTiers = new Set();
  const actionLog = [];
  let actionsApplied = 0, actionsSkipped = 0, estimatedSavingsUsd = 0;
  const logSkip = (rec, status) => { actionsSkipped++; actionLog.push({ recId: rec.id, status, tier: rec.tier }); };

  for (const rec of recommendations) {
    if (rec.tier > maxRiskTier) { logSkip(rec, 'skipped-by-tier-cap'); continue; }
    if (skippedTiers.has(rec.tier)) { logSkip(rec, 'skipped-tier-bulk'); continue; }

    const decision = await ctx.breakpoint({
      title: `Tier ${rec.tier}: ${rec.title}`,
      breakpointId: `azure-systems-cost-reduction.action.${rec.id}`,
      question: [
        `Resource: ${rec.resourceName} (${rec.resourceType}) in ${rec.rg}/${rec.location}`,
        `SKU: ${rec.currentSku || '(n/a)'} -> ${rec.proposedSku || '(delete)'}`,
        `Est. monthly savings: ${currency} ${rec.estimatedMonthlySavingsUsd}    Confidence: ${rec.confidence}    Reversibility: ${rec.reversibility}`,
        `Rationale: ${rec.rationale}`,
        `Consequences: ${rec.consequences}`,
        `Backup needed: ${rec.backupNeeded} (kind: ${rec.backupKind})`,
        `Action: ${rec.suggestedAction}`,
      ].join('\n'),
      options: ['Apply with backup', 'Apply WITHOUT backup', 'Skip', `Skip ALL tier ${rec.tier} actions`],
      expert: 'owner',
      tags: ['cost-action', `tier-${rec.tier}`],
    });

    if (!decision?.approved) { logSkip(rec, 'skipped-no-approval'); continue; }
    if (decision.response.startsWith('Skip ALL')) { skippedTiers.add(rec.tier); logSkip(rec, 'skipped-tier-bulk'); continue; }
    if (decision.response === 'Skip') { logSkip(rec, 'skipped'); continue; }

    const withBackup = decision.response === 'Apply with backup';
    const entry = { recId: rec.id, tier: rec.tier, title: rec.title, withBackup };

    if (withBackup && rec.backupNeeded) {
      const backupRes = await ctx.task(backupTask, { recommendation: rec, subscriptionId: resolvedSub, backupContainerStorageAccount });
      entry.backup = backupRes?.value;
      if (!backupRes?.value?.success && !backupRes?.value?.skipped) {
        actionsSkipped++; entry.status = 'backup-failed'; actionLog.push(entry); continue;
      }
    }

    const applyRes = await ctx.task(applyTask, { recommendation: rec, subscriptionId: resolvedSub });
    entry.apply = applyRes?.value;
    if (!applyRes?.value?.success) {
      actionsSkipped++; entry.status = 'apply-failed'; actionLog.push(entry); continue;
    }

    const verifyRes = await ctx.task(verifyTask, { recommendation: rec, subscriptionId: resolvedSub });
    entry.verify = verifyRes?.value;
    entry.status = verifyRes?.value?.verified ? 'applied' : 'applied-unverified';
    actionsApplied++;
    estimatedSavingsUsd += Number(rec.estimatedMonthlySavingsUsd) || 0;
    actionLog.push(entry);
  }

  // ---- Final report -------------------------------------------------------
  const report = await ctx.task(finalReportTask, {
    outputDir, subscriptionId: resolvedSub, currency,
    recommendationsPath: recsBuild?.value?.recommendationsPath,
    estimatedResourcesPath: estimation?.value?.estimatedResourcesPath,
    actionLog,
    totals: {
      totalMonthlyUsd: estimation?.value?.totalMonthlyUsd || 0,
      totalEstimatedSavingsUsd: recsBuild?.value?.totalEstimatedSavingsUsd || 0,
      appliedSavingsUsd: estimatedSavingsUsd,
      actionsApplied, actionsSkipped,
      countsByTier: recsBuild?.value?.countsByTier || {},
    },
  });

  // ---- Final review breakpoint --------------------------------------------
  const finalApproval = await ctx.breakpoint({
    title: 'Review cost-reduction report',
    breakpointId: 'azure-systems-cost-reduction.final-review',
    question: `Cost-reduction run complete. Applied ${actionsApplied}, skipped ${actionsSkipped}, est. savings ${currency} ${estimatedSavingsUsd}/mo. Report: ${report?.value?.reportFile}`,
    options: ['Approve', 'Request changes'],
    expert: 'owner', tags: ['final-review'],
  });

  return {
    success: finalApproval?.approved === true,
    recommendationsCount: recommendations.length,
    actionsApplied, actionsSkipped,
    estimatedSavingsUsd: report?.value?.estimatedSavingsUsd ?? estimatedSavingsUsd,
    reportFile: report?.value?.reportFile ?? null,
  };
}

export default process;
