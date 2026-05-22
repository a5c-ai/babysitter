/**
 * @process contrib/devops/gcp-systems-cost-reduction
 * @description End-to-end GCP cost-reduction. All tasks are `kind: 'agent'`;
 *              agents run `gcloud`/`bq`/`jq` via Bash and own their scratch
 *              dirs under `tasks/<effectId>/artifacts/`. NO inter-task
 *              filesystem contract — data flows as JSON results + explicit
 *              artifact paths. The single user-controlled path is
 *              `inputs.outputDir`, where the final report lands.
 *
 * Tiers: 1 cosmetic (dangling DNS, missing labels) / 2 rightsize (GCE
 * machine-type, pd-ssd->pd-balanced, GCS Standard->Nearline->Coldline->
 * Archive, HA Cloud SQL->zonal in dev) / 3 CUDs 1y/3y IRREVERSIBLE / 4
 * decommission with backup (orphan static IPs $7.30/mo, unattached PDs,
 * snapshots of deleted VMs, TERMINATED GCE with attached disks billing,
 * idle Cloud SQL) / 5 cluster (shrink GKE node pool, delete dev cluster,
 * Autopilot switch, Cloud Run min-instances=0).
 *
 * GCP waste patterns: orphan reserved static IPs (huge sleeper), unattached
 * PDs, snapshots of deleted VMs, TERMINATED GCE with attached disks, GCS
 * Standard on cold objects, Cloud SQL HA in dev (2x cost), GKE node pool
 * min>0 in dev, Pub/Sub subs with no subscribers (msgs accumulate, billed).
 *
 * @inputs {
 *   projectId: string,
 *   outputDir?: string,
 *   discoveryManifest?: object|null,
 *   billingAccount?: string|null,
 *   billingExportDataset?: string|null,   // <project>.<dataset>
 *   targetSavingsPercent?: number,
 *   maxRiskTier?: number,
 *   defaultBackupBeforeDestroy?: boolean,
 *   backupGcsBucket?: string|null,
 *   currency?: string,
 *   installPolicy?: 'ask'|'auto'|'never',
 *   authMethod?: 'use-existing'|'gcloud-login'|'service-account',
 *   serviceAccountKeyFile?: string|null
 * }
 * @outputs {
 *   success: boolean, recommendationsCount: number, actionsApplied: number,
 *   actionsSkipped: number, estimatedSavingsUsd: number, reportFile: string|null
 * }
 *
 * @skill cloud-cost-analysis specializations/devops-sre-platform/skills/cloud-cost-analysis/SKILL.md
 * @skill gcp-cloud specializations/devops-sre-platform/skills/gcp-cloud/SKILL.md
 * @agent finops-expert specializations/devops-sre-platform/agents/finops-expert/AGENT.md
 *
 * Cost data priority: (1) Cloud Billing BigQuery export — actual line-item
 * cost; requires export enabled + dataset via `billingExportDataset`.
 * (2) Recommender API: google.compute.instance.MachineTypeRecommender,
 * google.compute.disk.IdleResourceRecommender,
 * google.compute.address.IdleResourceRecommender,
 * google.compute.image.IdleResourceRecommender,
 * google.cloudsql.instance.IdleRecommender,
 * google.cloudsql.instance.OutOfDiskRecommender,
 * google.gke.cluster.MachineTypeRecommender,
 * google.compute.commitment.UsageCommitmentRecommender. (3) Cloud Pricing
 * API list price. (4) Active Assist (org).
 *
 * Backup (Tier 4): disk -> `gcloud compute disks snapshot`; GCE -> stop +
 * per-disk snapshot; Cloud SQL -> `gcloud sql backups create` + `gcloud sql
 * export sql` to GCS; GCS -> `gcloud storage cp -r` to backup bucket;
 * BigQuery -> `bq cp`/`bq extract` to GCS; Pub/Sub -> schema + sub config
 * capture; Firestore -> `gcloud firestore export gs://<bucket>`.
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
// Bootstrap — gcloud + bq + jq install, then auth + project select.
// ---------------------------------------------------------------------------

const cliBootstrapTask = defineTask('gcp-cli-bootstrap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Probe + install gcloud, bq, jq',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cloud-CLI installer',
      task: 'Probe gcloud / bq / jq; install whatever is missing per installPolicy.',
      context: { installPolicy: args.installPolicy },
      instructions: [
        'For each tool (gcloud, bq, jq): `which <tool>` + capture version.',
        'If missing and installPolicy=="never": mark action="skipped-by-policy".',
        'If missing and installPolicy=="ask": return early with `pendingInstall:[...]` so the orchestrator can raise a breakpoint. Do NOT install yet.',
        'If missing and installPolicy=="auto":',
        '  - gcloud: `curl -sSL https://sdk.cloud.google.com | bash -s -- --disable-prompts --install-dir=$HOME` then source `$HOME/google-cloud-sdk/path.bash.inc`. macOS fallback: `brew install --cask google-cloud-sdk`. Apt fallback: cloud-sdk repo + `apt-get install -y google-cloud-cli`.',
        '  - bq: bundled with gcloud; if missing `gcloud components install bq`.',
        '  - jq: `apt-get install -y jq` | `brew install jq` | static binary from github.com/jqlang/jq.',
        'Prefer non-sudo install paths (`$HOME/google-cloud-sdk`, `$HOME/.local/bin`). Re-probe after install.',
        'Return ONLY: { "gcloud": {present, version, path, action, error?}, "bq": {...}, "jq": {...}, "pendingInstall"?: [<tool>], "ready": <bool> }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['gcloud', 'bq', 'jq', 'ready'] },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

const gcloudAuthTask = defineTask('gcp-auth', (args, taskCtx) => ({
  kind: 'agent',
  title: `Authenticate to GCP (${args.authMethod}) + select project`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GCP auth assistant',
      task: 'Authenticate gcloud and set the active project.',
      context: { authMethod: args.authMethod, serviceAccountKeyFile: args.serviceAccountKeyFile, projectId: args.projectId },
      instructions: [
        '`use-existing`: `gcloud auth list --format=json` + `gcloud config get-value account`. Fail if no active account.',
        '`gcloud-login`: `gcloud auth login --no-launch-browser` (prints URL + verification code). Then `gcloud auth application-default login --no-launch-browser`.',
        '`service-account`: `gcloud auth activate-service-account --key-file=<path>`. Never log file contents.',
        'After auth: `gcloud config set project <projectId>`, `gcloud projects describe <projectId> --format=json`, `gcloud projects list --format=json`.',
        'Return ONLY: { "loggedIn": <bool>, "method": "<m>", "currentAccount": {email, type}, "currentProject": {projectId, projectNumber, name}, "availableProjects": [{projectId, name, lifecycleState}] }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['loggedIn', 'currentProject'] },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

// ---------------------------------------------------------------------------
// FinOps data — Recommender + billing BQ + direct waste detection.
// ---------------------------------------------------------------------------

const finopsDataTask = defineTask('gcp-finops-data', (args, taskCtx) => ({
  kind: 'agent',
  title: `Collect Recommender + billing BQ + waste candidates for ${args.projectId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GCP FinOps data collector',
      task: 'Pull every cost-relevant signal for the target project. Write artifacts under your task scratch dir; return a manifest.',
      context: {
        projectId: args.projectId,
        billingExportDataset: args.billingExportDataset,
        artifactsDir: `tasks/${taskCtx.effectId}/artifacts`,
        discoveryManifest: args.discoveryManifest,
      },
      instructions: [
        '`gcloud config set project <projectId>` first. All JSON to `tasks/<effectId>/artifacts/` only.',
        'Recommender API — one file per category. Tolerate API-not-enabled / permission errors per category (record in manifest, keep going). Call: `gcloud recommender recommendations list --project <p> --location global --recommender <id> --format=json`. For zonal/regional recommenders that reject `--location global`, iterate active zones/regions and concatenate. Categories -> files: google.compute.instance.MachineTypeRecommender->rec-gce-rightsize.json, google.compute.disk.IdleResourceRecommender->rec-disk-idle.json, google.compute.address.IdleResourceRecommender->rec-address-idle.json, google.compute.image.IdleResourceRecommender->rec-image-idle.json, google.cloudsql.instance.IdleRecommender->rec-sql-idle.json, google.cloudsql.instance.OutOfDiskRecommender->rec-sql-disk.json, google.gke.cluster.MachineTypeRecommender->rec-gke-machinetype.json, google.compute.commitment.UsageCommitmentRecommender->rec-cud.json.',
        'Direct waste detection (no Recommender required):',
        '  `gcloud compute addresses list --project <p> --filter="status=RESERVED AND -users:*" --format=json` -> orphan-static-ips.json (huge sleeper)',
        '  `gcloud compute disks list --project <p> --filter="-users:*" --format=json` -> orphan-disks.json',
        '  `gcloud compute instances list --project <p> --filter="status=TERMINATED" --format=json` -> terminated-instances.json (attached disks still bill)',
        '  `gcloud compute snapshots list --project <p> --format=json` -> snapshots.json (flag those whose sourceDisk no longer exists)',
        '  `gcloud sql instances list --project <p> --format=json` -> sql-instances.json (flag HA: settings.availabilityType=REGIONAL)',
        '  `gcloud pubsub subscriptions list --project <p> --format=json` -> pubsub-subs.json',
        '  `gcloud container clusters list --project <p> --format=json` -> gke-clusters.json (incl. node pools)',
        '  `gcloud storage buckets list --project <p> --format=json` -> gcs-buckets.json',
        'Billing BQ export (only if billingExportDataset provided, e.g. "my-project.billing_export"): `bq query --project_id=<p> --use_legacy_sql=false --format=json` against `<dataset>.gcp_billing_export_v1_*` for the last 30 days filtered by `project.id="<projectId>"`. Three rollups: billing-30d-by-service.json (group by service.description), billing-30d-by-sku.json (top 100 sku.description), billing-30d-by-resource.json (top 200 resource.name). If unreachable/empty: write `[]` + note reason.',
        'Return ONLY: { "projectId": "<id>", "manifest": { "<category>": {path, count, note?} }, "headlineCounts": {recsTotal, orphanStaticIps, orphanDisks, terminatedInstances, idleSqlInstances, rightsizeCandidates, cudOpportunities}, "billingExportUsed": <bool> }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['projectId', 'manifest', 'headlineCounts'] },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

// ---------------------------------------------------------------------------
// Cost estimation — agent annotates each candidate with monthly USD.
// ---------------------------------------------------------------------------

const costEstimationTask = defineTask('gcp-cost-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Estimate per-resource monthly USD',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GCP pricing estimator',
      task: 'Annotate each waste candidate with currentMonthlyUsd, projectedMonthlyUsd, savingsUsd. Prefer billing-export; fall back to Pricing API list price.',
      context: { manifest: args.manifest, billingExportUsed: args.billingExportUsed, currency: args.currency, artifactsDir: `tasks/${taskCtx.effectId}/artifacts` },
      instructions: [
        '`cat` each artifact path from the manifest at execution time.',
        'Floor cost rules: Static IP orphan $7.30/mo; PD-standard $0.040/GB/mo, PD-balanced $0.10, PD-SSD $0.17 (× .sizeGb); Snapshot $0.026/GB/mo (fallback .diskSizeGb*0.5); TERMINATED GCE: compute=$0, sum attached-disk costs; Cloud SQL: prefer rec-sql-idle.json `primaryImpact.costProjection.cost.units`, else from .settings.tier (db-n1-standard-1 ~$50/mo zonal, ~$100 HA); GKE node pool: sum machine-type × nodes, prefer rec-gke-machinetype.json projection; GCS bucket: billing-30d-by-resource.json line items, else mark "needs-billing-export"; CUDs from rec-cud.json: `primaryImpact.costProjection.cost.units`+`.cost.nanos`.',
        'When billingExportUsed==true and a billing line matches the resource name, prefer that 30d figure.',
        'Write `tasks/<effectId>/artifacts/candidates-priced.json` as an array of: { id, source: "recommender"|"direct-detect", category, resource: {kind, name, project, location?}, currentMonthlyUsd, projectedMonthlyUsd, savingsUsd, costSource: "billing-export"|"pricing-api"|"recommender-projection"|"estimated", confidence: "high"|"medium"|"low" }',
        'Return ONLY: { "candidatesFile": "<path>", "candidatesCount": <int>, "totalAddressableSavings": <number>, "byCategory": {"<cat>": {count, savings}} }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['candidatesFile', 'candidatesCount'] },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

// ---------------------------------------------------------------------------
// Recommendations — tiered, executable, with backup + apply + verify cmds.
// ---------------------------------------------------------------------------

const recommendationsBuildTask = defineTask('gcp-recommendations-build', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build prioritized GCP cost-reduction recommendations',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GCP FinOps consultant',
      task: 'Translate priced candidates into tiered, executable recommendations.',
      context: {
        candidatesFile: args.candidatesFile,
        manifest: args.manifest,
        maxRiskTier: args.maxRiskTier,
        backupGcsBucket: args.backupGcsBucket,
        defaultBackupBeforeDestroy: args.defaultBackupBeforeDestroy,
        artifactsDir: `tasks/${taskCtx.effectId}/artifacts`,
      },
      instructions: [
        '`cat` candidatesFile + manifest paths at execution time.',
        'Each rec: { id, tier (1-5), category, resource:{kind,name,project,location?}, currentMonthlyUsd, projectedMonthlyUsd, savingsUsd, description, consequences:[], suggestedAction (single-line gcloud/bq/gsutil, idempotent), backupNeeded, backupCommand?, verifyCommand?, reversibility: "reversible"|"reversible-with-backup"|"irreversible" }',
        'Tier mapping: T1 dangling Cloud DNS, missing labels (backupNeeded=false). T2 GCE rightsize via `gcloud compute instances set-machine-type`, pd-ssd->pd-balanced (~30% cheaper), GCS class transitions, HA Cloud SQL->zonal. T3 CUDs (rec-cud.json) 1y/3y resource- or spend-based; reversibility=irreversible; consequences:["locked-in capacity for term","cannot reduce mid-term"]. T4 orphan static IPs ($7.30/mo), unattached disks, snapshots from deleted VMs, terminated instances (delete + orphan disks), idle Cloud SQL; backupNeeded=true unless reversible. T5 GKE node pool shrink, delete dev cluster, switch to Autopilot, Cloud Run min-instances=0; backupNeeded=true for cluster delete.',
        'Backup commands (use literal `<backupGcsBucket>` placeholder — applier substitutes; refuses if null):',
        '  Disk: `gcloud compute disks snapshot <name> --zone <z> --project <p> --snapshot-names=<name>-pre-delete-$(date +%s)`',
        '  GCE: `gcloud compute instances stop <name> --zone <z> --project <p>` then per-disk snapshot (separate apply hop)',
        '  Cloud SQL: `gcloud sql backups create --instance=<name> --project=<p>` then `gcloud sql export sql gs://<backupGcsBucket>/sql/<name>-$(date +%s).sql.gz <name> --database=<db>`',
        '  GCS: `gcloud storage cp -r gs://<source> gs://<backupGcsBucket>/<source>/`',
        '  BigQuery: `bq extract --destination_format=AVRO <project>:<ds>.<table> gs://<backupGcsBucket>/bq/<ds>/<table>/*.avro`',
        '  Firestore: `gcloud firestore export gs://<backupGcsBucket>/firestore-$(date +%s) --project=<p>`',
        '  Pub/Sub: `gcloud pubsub subscriptions describe <sub> --format=json | gcloud storage cp - gs://<backupGcsBucket>/pubsub/<sub>.json`',
        'Verify commands (exit 0 ONLY when action took effect):',
        '  Static IP delete: `! gcloud compute addresses describe <name> --region <r> --project <p> >/dev/null 2>&1`',
        '  Disk delete: `! gcloud compute disks describe <name> --zone <z> --project <p> >/dev/null 2>&1`',
        '  Machine-type: `gcloud compute instances describe <name> --zone <z> --project <p> --format="value(machineType.basename())" | grep -q "^<new-type>$"`',
        '  SQL HA->zonal: `gcloud sql instances describe <name> --project <p> --format="value(settings.availabilityType)" | grep -q "^ZONAL$"`',
        `Cap at maxRiskTier=${args.maxRiskTier}. Sort by savingsUsd desc within tier; output order 1..5.`,
        'Write `tasks/<effectId>/artifacts/recommendations.json` + human `recommendations.md` (per-tier tables, totals, top-10 wins).',
        'Return ONLY: { "recommendationsFile":"<abs>", "recommendationsMarkdown":"<abs>", "recommendationsCount":<int>, "totalAddressableSavings":<number>, "byTier":{"1":n,"2":n,"3":n,"4":n,"5":n} }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['recommendationsFile', 'recommendationsCount'] },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

// ---------------------------------------------------------------------------
// Inline read-back agent (no shell-kind tasks anywhere in this process).
// ---------------------------------------------------------------------------

const readRecsTask = defineTask('gcp-read-recs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Read ${args.recommendationsFile}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'JSON loader',
      task: `\`cat\` ${args.recommendationsFile} via Bash and return its JSON inside an envelope.`,
      context: { recommendationsFile: args.recommendationsFile },
      instructions: [
        'Run `cat <recommendationsFile>`. Validate JSON parse.',
        'On parse error: return {"recommendations": [], "parseError": "<msg>", "count": 0}.',
        'Return ONLY: {"recommendations": [<...array...>], "count": <int>}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['recommendations'] },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

// ---------------------------------------------------------------------------
// Per-action: backup, apply, verify (all agents — invoke gcloud/bq via Bash).
// ---------------------------------------------------------------------------

const backupTask = defineTask('gcp-backup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Backup ${args.resourceKind}/${args.resourceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GCP backup operator',
      task: 'Execute the supplied backup command and confirm the artifact exists.',
      context: { resourceKind: args.resourceKind, resourceName: args.resourceName, backupCommand: args.backupCommand, backupGcsBucket: args.backupGcsBucket, artifactsDir: `tasks/${taskCtx.effectId}/artifacts` },
      instructions: [
        'If backupCommand is empty/null: write a `no-backup-waived` marker JSON to artifactsDir; return success=false reason="no-backup-command-supplied".',
        'If backupCommand contains `<backupGcsBucket>` and backupGcsBucket is null: refuse, success=false reason="missing-backup-gcs-bucket".',
        'Substitute `<backupGcsBucket>` then run via Bash. Capture stdout/stderr.',
        'Confirm: snapshots via `gcloud compute snapshots describe`; GCS exports via `gcloud storage ls`; SQL backups via `gcloud sql backups list`.',
        'Return ONLY: {"success": <bool>, "backupRef": "<snapshot|gcs-uri|backup-id>", "reason"?: "<msg>"}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['success'] },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

const applyTask = defineTask('gcp-apply', (args, taskCtx) => ({
  kind: 'agent',
  title: `Apply: ${args.suggestedAction}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GCP change operator',
      task: 'Execute the supplied gcloud/bq/gsutil command verbatim.',
      context: { suggestedAction: args.suggestedAction },
      instructions: [
        'Run suggestedAction verbatim via Bash. Do not modify. Do not add `--quiet` unless already present.',
        'Capture stdout, stderr, exit code.',
        'Return ONLY: {"success": <bool>, "exitCode": <int>, "stdoutTail": "<last-2KB>", "stderrTail": "<last-2KB>"}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['success', 'exitCode'] },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

const verifyTask = defineTask('gcp-verify', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify ${args.resourceKind}/${args.resourceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GCP change verifier',
      task: 'Run the verifyCommand; report whether the change took effect.',
      context: { resourceKind: args.resourceKind, resourceName: args.resourceName, verifyCommand: args.verifyCommand },
      instructions: [
        'If verifyCommand is empty/null: return {"success": true, "verified": false, "reason": "no-verify-command"}.',
        'Else run via Bash. Exit 0 means verified.',
        'Return ONLY: {"success": <bool>, "verified": <bool>, "exitCode": <int>, "reason"?: "<msg>"}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['success', 'verified'] },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

// ---------------------------------------------------------------------------
// Final report — under the user's outputDir (the only fixed path).
// ---------------------------------------------------------------------------

const finalReportTask = defineTask('gcp-final-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compose ${args.outputDir}/cost-reduction-report.md`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FinOps analyst',
      task: `Generate ${args.outputDir}/cost-reduction-report.md plus a copy of recommendations.md.`,
      context: { outputDir: args.outputDir, projectId: args.projectId, recommendationsFile: args.recommendationsFile, recommendationsMarkdown: args.recommendationsMarkdown, applied: args.applied, skipped: args.skipped, savingsUsd: args.savingsUsd, billingExportUsed: args.billingExportUsed },
      instructions: [
        'Create outputDir if missing. `cat` recommendationsFile + recommendationsMarkdown at execution time.',
        'Sections: (1) executive summary (project, target%, achieved $/mo, % of bill captured); (2) applied actions table grouped by tier (id | resource | category | savings $/mo | backupRef | verified); (3) skipped actions with reason column (above-max-tier, tier-skipped-by-user, user-skip, apply-failed:<msg>, backup-failed:<msg>, missing-backup-gcs-bucket, no-backup-command-supplied); (4) pending follow-ups needing humans (CUD purchase via console, dev cluster delete with sign-off); (5) backup inventory (every backupRef captured); (6) methodology + caveats (billing-export vs Pricing API, sustained-use vs CUD, recommender confidence, location-scoped recommenders).',
        `Also write ${args.outputDir}/recommendations.md (copy of upstream markdown).`,
        'Return ONLY: {"reportFile": "<abs>", "actionsApplied": <int>, "actionsSkipped": <int>, "savingsUsd": <number>}',
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
    projectId,
    outputDir = 'gcp-cost-reduction',
    discoveryManifest = null,
    billingAccount = null,
    billingExportDataset = null,
    targetSavingsPercent = 25,
    maxRiskTier = 4,
    defaultBackupBeforeDestroy = true,
    backupGcsBucket = null,
    currency = 'USD',
    installPolicy = 'ask',                  // 'ask' | 'auto' | 'never'
    authMethod = 'use-existing',            // 'use-existing' | 'gcloud-login' | 'service-account'
    serviceAccountKeyFile = null,
  } = inputs;

  if (!projectId) throw new Error('projectId is required');
  const emptyResult = { success: false, recommendationsCount: 0, actionsApplied: 0, actionsSkipped: 0, estimatedSavingsUsd: 0, reportFile: null };

  // ---- Bootstrap: CLI install --------------------------------------------
  let bootstrap = await ctx.task(cliBootstrapTask, { installPolicy: 'never' });
  if (!bootstrap?.value?.ready) {
    const missing = bootstrap.value?.pendingInstall || ['gcloud', 'bq', 'jq'].filter(t => !bootstrap.value?.[t]?.present);
    if (installPolicy === 'never') throw new Error(`Required CLIs missing: ${missing.join(', ')}. Re-run with installPolicy=ask or auto.`);
    const installApproval = await ctx.breakpoint({
      title: 'Install missing GCP CLIs',
      breakpointId: 'gcp-systems-cost-reduction.install-clis',
      question: `Missing tools: ${missing.join(', ')}. Approve installation?`,
      options: ['Approve install', 'Skip (run will fail)', 'Cancel'],
      expert: 'owner',
      tags: ['install-gate', 'pre-bootstrap'],
    });
    if (!installApproval?.approved || installApproval?.response === 'Cancel') return emptyResult;
    if (installApproval.response === 'Approve install') {
      bootstrap = await ctx.task(cliBootstrapTask, { installPolicy: 'auto' });
      if (!bootstrap?.value?.ready) throw new Error('Bootstrap install failed; see task output.');
    }
  }

  // ---- Bootstrap: login + project select ---------------------------------
  let auth = await ctx.task(gcloudAuthTask, { authMethod, serviceAccountKeyFile, projectId });
  if (!auth?.value?.loggedIn) {
    const methodChoice = await ctx.breakpoint({
      title: 'Pick GCP authentication method',
      breakpointId: 'gcp-systems-cost-reduction.auth-method',
      question: 'No active gcloud session. How should I authenticate?',
      options: ['Browser login (gcloud auth login)', 'Service account key file', 'Cancel'],
      expert: 'owner',
      tags: ['auth-gate'],
    });
    if (!methodChoice?.approved || methodChoice.response === 'Cancel') return emptyResult;
    const chosenMethod = methodChoice.response.includes('Service') ? 'service-account' : 'gcloud-login';
    let chosenKey = serviceAccountKeyFile;
    if (chosenMethod === 'service-account' && !chosenKey) {
      const keyInput = await ctx.breakpoint({
        title: 'Provide service-account key file path',
        breakpointId: 'gcp-systems-cost-reduction.sa-key',
        question: 'Absolute path to the service-account JSON key file on this host.',
        options: ['I have entered the path', 'Cancel'],
        expert: 'owner',
        tags: ['auth-gate', 'sensitive-input'],
      });
      chosenKey = (keyInput?.feedback || keyInput?.response || '').trim();
    }
    auth = await ctx.task(gcloudAuthTask, { authMethod: chosenMethod, serviceAccountKeyFile: chosenKey, projectId });
    if (!auth?.value?.loggedIn) throw new Error('GCP login failed.');
  }

  // ---- Project confirmation ----------------------------------------------
  if (auth.value.currentProject?.projectId !== projectId) {
    const projPick = await ctx.breakpoint({
      title: 'Confirm GCP project',
      breakpointId: 'gcp-systems-cost-reduction.project-pick',
      question: [
        `Requested: ${projectId}`,
        `gcloud-active: ${auth.value.currentProject?.projectId}`,
        `Available:`,
        ...((auth.value.availableProjects || []).map(p => `  - ${p.projectId} (${p.name}) [${p.lifecycleState}]`)),
      ].join('\n'),
      options: ['Use requested', 'Use gcloud-active', 'Cancel'],
      expert: 'owner',
      tags: ['scope-gate', 'project-pick'],
    });
    if (!projPick?.approved || projPick.response === 'Cancel') return emptyResult;
  }

  // ---- Scope confirmation ------------------------------------------------
  const scopeApproval = await ctx.breakpoint({
    title: 'Confirm GCP cost-reduction scope',
    breakpointId: 'gcp-systems-cost-reduction.scope',
    question: [
      `Project: ${projectId}`,
      `Billing account: ${billingAccount || '<inferred>'}`,
      `Billing export dataset: ${billingExportDataset || '<not configured — falling back to Recommender + Pricing API>'}`,
      `Target savings: ${targetSavingsPercent}%`,
      `Max risk tier: ${maxRiskTier} (1=cosmetic, 5=cluster delete)`,
      `Default backup before destroy: ${defaultBackupBeforeDestroy}`,
      `Backup GCS bucket: ${backupGcsBucket || '<none — destructive actions referencing it will be refused>'}`,
      `Output dir: ${outputDir}`,
      ``,
      `Each destructive action gates on its own breakpoint.`,
    ].join('\n'),
    options: ['Approve', 'Adjust'],
    expert: 'owner',
    tags: ['scope-gate'],
  });
  if (!scopeApproval?.approved) return emptyResult;

  // ---- Phases 1-4: data, pricing, recs, read-back ------------------------
  const data = await ctx.task(finopsDataTask, { projectId, billingExportDataset, discoveryManifest });
  const dataValue = data?.value || {};

  const priced = await ctx.task(costEstimationTask, { manifest: dataValue.manifest, billingExportUsed: !!dataValue.billingExportUsed, currency });
  const pricedValue = priced?.value || {};

  const recsBuilt = await ctx.task(recommendationsBuildTask, { candidatesFile: pricedValue.candidatesFile, manifest: dataValue.manifest, maxRiskTier, backupGcsBucket, defaultBackupBeforeDestroy });
  const recsBuiltValue = recsBuilt?.value || {};

  const recsRead = await ctx.task(readRecsTask, { recommendationsFile: recsBuiltValue.recommendationsFile });
  const recs = recsRead?.value?.recommendations || [];

  // ---- Phase 5: per-action loop with breakpoints -------------------------
  const applied = [];
  const skipped = [];
  const skippedTiers = new Set();
  let totalSavings = 0;

  for (const rec of recs) {
    if (rec.tier > maxRiskTier) { skipped.push({ ...rec, reason: 'above-max-tier' }); continue; }
    if (skippedTiers.has(rec.tier)) { skipped.push({ ...rec, reason: 'tier-skipped-by-user' }); continue; }

    const decision = await ctx.breakpoint({
      title: `[Tier ${rec.tier}] ${rec.category}: ${rec.resource.kind}/${rec.resource.name}`,
      breakpointId: `gcp-systems-cost-reduction.action.${rec.id}`,
      question: [
        `${rec.description}`,
        `Project: ${rec.resource.project}${rec.resource.location ? ' (' + rec.resource.location + ')' : ''}`,
        ``,
        `Current: $${rec.currentMonthlyUsd}/mo  ->  Projected: $${rec.projectedMonthlyUsd}/mo  (saves $${rec.savingsUsd})`,
        `Reversibility: ${rec.reversibility}`,
        `Backup needed: ${rec.backupNeeded}${rec.backupNeeded && !backupGcsBucket ? '  (no backupGcsBucket — backup will be refused)' : ''}`,
        ``,
        `Action: ${rec.suggestedAction}`,
        ``,
        `Consequences:`,
        ...(rec.consequences || []).map(c => `  - ${c}`),
      ].join('\n'),
      options: ['Apply with backup', 'Apply WITHOUT backup', 'Skip', 'Skip all in this tier'],
      expert: 'owner',
      tags: ['action-gate', `tier-${rec.tier}`, rec.category],
    });

    const choice = decision?.response || 'Skip';
    if (choice === 'Skip') { skipped.push({ ...rec, reason: 'user-skip' }); continue; }
    if (choice === 'Skip all in this tier') { skippedTiers.add(rec.tier); skipped.push({ ...rec, reason: 'tier-skipped-by-user' }); continue; }

    let backupRef = null;
    if (choice === 'Apply with backup' && rec.backupNeeded !== false) {
      const bk = await ctx.task(backupTask, { resourceKind: rec.resource.kind, resourceName: rec.resource.name, backupCommand: rec.backupCommand, backupGcsBucket });
      if (!bk?.value?.success) { skipped.push({ ...rec, reason: `backup-failed: ${bk?.value?.reason || 'unknown'}` }); continue; }
      backupRef = bk.value.backupRef;
    }

    try {
      const ap = await ctx.task(applyTask, { suggestedAction: rec.suggestedAction });
      if (!ap?.value?.success) { skipped.push({ ...rec, reason: `apply-failed: exit=${ap?.value?.exitCode} ${ap?.value?.stderrTail || ''}` }); continue; }
      const vf = await ctx.task(verifyTask, { resourceKind: rec.resource.kind, resourceName: rec.resource.name, verifyCommand: rec.verifyCommand });
      applied.push({ ...rec, backupRef, verified: !!vf?.value?.verified });
      totalSavings += rec.savingsUsd || 0;
    } catch (e) {
      ctx.log('warn', `Action ${rec.id} failed: ${e.message}`);
      skipped.push({ ...rec, reason: `apply-exception: ${e.message}` });
    }
  }

  // ---- Phase 6: final report ---------------------------------------------
  const report = await ctx.task(finalReportTask, {
    outputDir, projectId,
    recommendationsFile: recsBuiltValue.recommendationsFile,
    recommendationsMarkdown: recsBuiltValue.recommendationsMarkdown,
    applied, skipped, savingsUsd: totalSavings,
    billingExportUsed: !!dataValue.billingExportUsed,
  });

  // ---- Final review breakpoint -------------------------------------------
  const approval = await ctx.breakpoint({
    title: 'Review GCP cost-reduction output',
    breakpointId: 'gcp-systems-cost-reduction.final-review',
    question: [
      `Recommendations built: ${recs.length}`,
      `Actions applied: ${applied.length}`,
      `Actions skipped: ${skipped.length}`,
      `Estimated monthly savings: $${totalSavings.toFixed(2)} ${currency}`,
      `Report: ${report?.value?.reportFile}`,
    ].join('\n'),
    options: ['Approve', 'Request changes'],
    expert: 'owner',
    tags: ['final-review'],
  });

  return {
    success: approval?.approved === true,
    recommendationsCount: recs.length,
    actionsApplied: applied.length,
    actionsSkipped: skipped.length,
    estimatedSavingsUsd: totalSavings,
    reportFile: report?.value?.reportFile ?? null,
  };
}

export default process;
