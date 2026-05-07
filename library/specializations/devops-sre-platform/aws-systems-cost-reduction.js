/**
 * @process contrib/devops/aws-systems-cost-reduction
 * @description End-to-end AWS cost-reduction workflow. All tasks are
 *              agent-driven; no inter-task filesystem contract — agents
 *              self-manage state under their task-scoped directory and pass
 *              typed results forward as JSON. Caller controls the report
 *              destination via `inputs.outputDir`.
 *
 *              Risk tiers:
 *                1 - cosmetic (Route53 dangling, untagged, log retention=Never)
 *                2 - rightsize (Compute Optimizer EC2; gp2->gp3; S3 lifecycle)
 *                3 - reservations / Savings Plans (irreversible 1y/3y commit)
 *                4 - decommission (REQUIRES backup unless waived)
 *                5 - cluster-level (EKS shrink/delete)
 *
 *              AWS-specific waste patterns to detect:
 *                - NAT Gateways at $32+/mo + per-GB processed
 *                - gp2 EBS (gp3 always cheaper, same perf)
 *                - Old AMI snapshots from terminated instances (often 100s GB)
 *                - Idle ALBs (zero ProcessedBytes 30d)
 *                - Lambda provisioned concurrency on funcs w/ no invocations
 *                - VPC Interface endpoints at $7.20/mo each
 *                - CloudWatch Logs retention=Never on high-ingestion groups
 *                - Unattached EIPs at $3.60/mo each
 *
 * @inputs {
 *   accountId: string,
 *   outputDir?: string,
 *   regions?: string[],
 *   discoveryManifest?: object | null,    // from aws-systems-discovery; null = minimal inventory
 *   targetSavingsPercent?: number,
 *   maxRiskTier?: number,
 *   defaultBackupBeforeDestroy?: boolean,
 *   backupS3Bucket?: string | null,
 *   currency?: string,
 *   installPolicy?: 'ask'|'auto'|'never',
 *   authMethod?: 'use-existing'|'sso'|'static'|'assume-role',
 *   ssoProfile?: string | null,
 *   assumeRoleArn?: string | null,
 *   staticCredentials?: object | null
 * }
 * @outputs {
 *   success: boolean,
 *   recommendationsCount: number,
 *   actionsApplied: number,
 *   actionsSkipped: number,
 *   estimatedSavingsUsd: number,
 *   reportFile: string
 * }
 *
 * @skill cloud-cost-analysis specializations/devops-sre-platform/skills/cloud-cost-analysis/SKILL.md
 * @skill aws-cloud specializations/devops-sre-platform/skills/aws-cloud/SKILL.md
 * @agent finops-expert specializations/devops-sre-platform/agents/finops-expert/AGENT.md
 *
 * Pricing source priority: Cost Explorer (actual) > Compute Optimizer (ML
 * rightsize) > Trusted Advisor (Business Support req) > Pricing API (catalog
 * list) > direct waste detection (unattached/idle resources).
 *
 * Backup methodology (Tier 4): EBS->create-snapshot, EC2->create-image,
 * RDS->create-db-snapshot, DynamoDB->create-backup or PITR, S3->s3 sync to
 * backupS3Bucket, Lambda->download code+config to local, Secrets/Params->
 * retrieve to encrypted local file.
 *
 * Drift defense: the recs executor re-reads recs.json via a small inline cat
 * agent rather than receiving inlined bytes through the prompt.
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
// Bootstrap
// ---------------------------------------------------------------------------

const cliBootstrapTask = defineTask('aws-cli-bootstrap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Probe + install aws + jq',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cloud-CLI installer',
      task: 'Detect aws + jq. Install missing tools per installPolicy.',
      context: { installPolicy: args.installPolicy },
      instructions: [
        'For each tool (aws, jq): `which <tool>` + version probe.',
        'installPolicy=="never": mark missing as skipped-by-policy, continue.',
        'installPolicy=="ask": DO NOT install — return early with `pendingInstall: [...]` so orchestrator can raise a breakpoint. The orchestrator will re-call with installPolicy="auto".',
        'installPolicy=="auto": install non-sudo where possible.',
        '  - aws (Linux x86_64): `curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip && unzip -q /tmp/awscliv2.zip -d /tmp && /tmp/aws/install -i $HOME/.local/aws-cli -b $HOME/.local/bin`',
        '  - aws (Linux aarch64): same with `awscli-exe-linux-aarch64.zip`',
        '  - aws (macOS): `brew install awscli` or AWSCLIV2.pkg',
        '  - jq: apt-get / brew / static binary from github.com/jqlang/jq',
        'Re-probe after install.',
        'Return ONLY: {"aws":{"present":<bool>,"version":"<v>","path":"<p>","action":"already-present"|"installed"|"skipped-by-policy"|"failed","error"?:"<m>"},"jq":{...same},"pendingInstall"?:[...],"ready":<bool>}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['aws', 'jq', 'ready'] },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

const awsAuthTask = defineTask('aws-auth', (args, taskCtx) => ({
  kind: 'agent',
  title: `Authenticate to AWS (${args.authMethod})`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'AWS auth assistant',
      task: 'Authenticate the local aws CLI; resolve account + enabled regions.',
      context: {
        authMethod: args.authMethod,
        ssoProfile: args.ssoProfile,
        assumeRoleArn: args.assumeRoleArn,
        staticCredentials: args.staticCredentials,
        accountIdHint: args.accountIdHint,
        regionsHint: args.regionsHint,
      },
      instructions: [
        '`use-existing`: `aws sts get-caller-identity`. Fail soft if no session.',
        '`sso`: `aws sso login --profile <ssoProfile>` then verify with `--profile <ssoProfile>`.',
        '`static`: write creds to `~/.aws/credentials` profile `[a5c-temp]` (NEVER log secret); verify.',
        '`assume-role`: `aws sts assume-role --role-arn <arn> --role-session-name a5c-finops`; write temp creds to `[a5c-assumed]`; verify.',
        'After auth: `aws ec2 describe-regions` to list enabled regions; intersect with regionsHint if provided.',
        'If accountIdHint provided and resolved Account differs: return loggedIn:false with error "account-mismatch".',
        'Return ONLY: {"loggedIn":<bool>,"method":"<m>","account":{"id":"<id>","arn":"<arn>","userId":"<u>"},"enabledRegions":[...],"profileToUse":"<p>","error"?:"<m>"}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['loggedIn'] },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

// ---------------------------------------------------------------------------
// Phase 1: pull all FinOps data
// ---------------------------------------------------------------------------

const finopsDataTask = defineTask('aws-finops-data', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pull FinOps data for ${args.accountId} (${args.regions.join(',')})`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'AWS FinOps data collector',
      task: 'Pull Cost Explorer + Compute Optimizer + Trusted Advisor + per-region waste candidates. Emit a manifest of artifact paths.',
      context: {
        accountId: args.accountId,
        regions: args.regions,
        profile: args.profile,
        artifactsDir: `tasks/${taskCtx.effectId}/artifacts`,
      },
      instructions: [
        'Write all JSON to `tasks/<effectId>/artifacts/`. Never assume a fixed shared dir.',
        'Use `aws --profile <profile>` (or default). Tolerate AccessDenied / OptInRequired / SubscriptionRequired per call: record in manifest with `note`, do not crash.',
        'Window: START=$(date -u -d "30 days ago" +%Y-%m-%d 2>/dev/null || date -u -v-30d +%Y-%m-%d); END=$(date -u +%Y-%m-%d).',
        'Cost Explorer (us-east-1 endpoint):',
        '  - get-cost-and-usage --granularity MONTHLY --metrics UnblendedCost --group-by SERVICE/USAGE_TYPE/REGION (3 calls) -> ce-by-{service,usage-type,region}.json',
        '  - get-reservation-utilization -> ce-reservation-util.json',
        '  - get-reservation-purchase-recommendation --service "Amazon Elastic Compute Cloud - Compute" -> ce-ri-recs.json',
        '  - get-savings-plans-purchase-recommendation --savings-plans-type COMPUTE_SP --term-in-years ONE_YEAR --payment-option NO_UPFRONT -> ce-sp-recs.json',
        'Compute Optimizer: get-{ec2-instance,ebs-volume,lambda-function,auto-scaling-group}-recommendations -> co-{ec2,ebs,lambda,asg}.json. If OptInRequired record and continue.',
        'Trusted Advisor (us-east-1, Business Support req): describe-trusted-advisor-checks -> ta-checks.json; for each cost_optimizing check id describe-trusted-advisor-check-result -> ta-result-<id>.json.',
        'Per-region waste candidates (loop regions):',
        '  - ec2 describe-volumes --filters Name=status,Values=available -> unattached-volumes-$r.json',
        '  - ec2 describe-addresses -> eips-$r.json (downstream filters AssociationId is null)',
        '  - ec2 describe-snapshots --owner-ids self -> snapshots-$r.json',
        '  - ec2 describe-images --owners self -> amis-$r.json (cross-ref to detect orphan-AMI snaps)',
        '  - ec2 describe-nat-gateways -> natgw-$r.json',
        '  - ec2 describe-vpc-endpoints --filters Name=vpc-endpoint-type,Values=Interface -> vpc-endpoints-$r.json',
        '  - elbv2 describe-load-balancers -> elbv2-$r.json',
        '  - lambda list-functions -> lambda-$r.json; per-fn list-provisioned-concurrency-configs -> lambda-pc-$r.json',
        '  - logs describe-log-groups -> log-groups-$r.json (capture retentionInDays + storedBytes)',
        '  - rds describe-db-instances -> rds-$r.json',
        '  - ec2 describe-volumes --filters Name=volume-type,Values=gp2 -> gp2-volumes-$r.json',
        'Per-resource CloudWatch sampling (30d):',
        '  - ALB ProcessedBytes Sum/86400 -> alb-metrics-$r-<lb>.json',
        '  - Lambda Invocations Sum/86400 (only for fns with PC config) -> lambda-inv-$r-<fn>.json',
        'Return ONLY: {"accountId":"<id>","regions":[...],"windowStart":"<d>","windowEnd":"<d>","manifest":{"costExplorer":{...paths},"computeOptimizer":{"ec2":"<p>"|null,...,"note"?:"<m>"},"trustedAdvisor":{"checks":"<p>"|null,"results":{"<id>":"<p>"},"note"?:"<m>"},"wasteCandidates":{"<region>":{"unattachedVolumes":"<p>","eips":"<p>","snapshots":"<p>","amis":"<p>","natgw":"<p>","vpcEndpoints":"<p>","elbv2":"<p>","lambda":"<p>","lambdaProvisionedConcurrency":"<p>","logGroups":"<p>","rds":"<p>","gp2Volumes":"<p>","albMetrics":{...},"lambdaInvocations":{...}}}},"headlineCounts":{"unattachedVolumes":<i>,"unattachedEips":<i>,"ownedSnapshots":<i>,"natGateways":<i>,"vpcEndpointsInterface":<i>,"albs":<i>,"lambdaPCConfigs":<i>,"gp2Volumes":<i>,"logGroupsNeverExpire":<i>}}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['accountId', 'manifest', 'headlineCounts'] },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

// ---------------------------------------------------------------------------
// Phase 2: per-resource cost estimation
// ---------------------------------------------------------------------------

const costEstimationTask = defineTask('aws-cost-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Per-resource monthly cost estimation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'AWS pricing analyst',
      task: 'Compute per-resource monthly USD from finops manifest + (optional) discoveryManifest. Emit cost-table artifacts; return headlines.',
      context: {
        finopsManifest: args.finopsManifest,
        discoveryManifest: args.discoveryManifest,
        artifactsDir: `tasks/${taskCtx.effectId}/artifacts`,
        currency: args.currency,
      },
      instructions: [
        'Read each manifest path with Bash `cat` at execution time.',
        'Allocate cost by joining Cost Explorer USAGE_TYPE rows to resource IDs where possible; fall back to Pricing API list for the SKU.',
        'Pricing rule-of-thumb fallbacks:',
        '  - NAT Gateway: $0.045/hr (~$32.40/mo) + $0.045/GB processed',
        '  - EIP unattached: $0.005/hr (~$3.60/mo)',
        '  - VPC Interface endpoint: $0.01/hr (~$7.20/mo) per AZ + $0.01/GB',
        '  - gp3: $0.08/GB-mo  vs  gp2: $0.10/GB-mo',
        '  - Snapshots: $0.05/GB-mo',
        '  - ALB: $0.0225/hr (~$16.20/mo) + LCU',
        '  - Lambda PC: $0.0000041667/GB-s reserved (128MB always-on ~ $1.36/mo)',
        '  - CloudWatch Logs: $0.50/GB ingest + $0.03/GB-mo storage',
        'If discoveryManifest is null: minimal inventory, just trust waste-candidate artifacts. Otherwise cross-ref discovery resource IDs for system attribution.',
        'Write `cost-table-<region>.json` per region + `cost-table-summary.json` under artifactsDir.',
        'Return ONLY: {"estimationArtifact":"<path>","perRegionArtifacts":{"<region>":"<p>"},"headlines":{"totalMonthlyUsdObserved":<n>,"addressableMonthlyUsd":<n>,"topServices":[{"service":"<n>","monthlyUsd":<n>}]}}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['estimationArtifact', 'headlines'] },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

// ---------------------------------------------------------------------------
// Phase 3: build prioritized recommendations
// ---------------------------------------------------------------------------

const recommendationsBuildTask = defineTask('aws-recommendations-build', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build prioritized recommendations (maxTier=${args.maxRiskTier})`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'AWS FinOps consultant',
      task: 'Synthesize prioritized 5-tier recommendations. Emit recommendations.json + recommendations.md.',
      context: {
        finopsManifest: args.finopsManifest,
        costEstimationArtifact: args.costEstimationArtifact,
        discoveryManifest: args.discoveryManifest,
        artifactsDir: `tasks/${taskCtx.effectId}/artifacts`,
        maxRiskTier: args.maxRiskTier,
        backupS3Bucket: args.backupS3Bucket,
        defaultBackupBeforeDestroy: args.defaultBackupBeforeDestroy,
        targetSavingsPercent: args.targetSavingsPercent,
      },
      instructions: [
        'Read each manifest path with Bash `cat` at execution time.',
        'Each recommendation MUST be: {id, tier(1-5), category("orphan"|"rightsize"|"reservation"|"savings-plan"|"decommission"|"tier-down"|"storage-class"|"cluster-shrink"), resource:{kind,id,name?,region,account?}, currentMonthlyUsd, projectedMonthlyUsd, savingsUsd, description, consequences:[], suggestedAction (aws CLI), backupNeeded, backupCommand?, verifyCommand?, reversibility("reversible"|"destructive-with-backup"|"destructive-permanent")}',
        'Tier 1: dangling Route53 records, untagged resources, log groups retention=Never on low-value logs (suggest set retention=30).',
        'Tier 2: Compute Optimizer EC2 family downgrades; gp2->gp3 via `aws ec2 modify-volume --volume-id <id> --volume-type gp3 --region <r>`; S3 lifecycle to Intelligent-Tiering for mixed-age buckets.',
        'Tier 3: consume ce-ri-recs + ce-sp-recs. Quote $ savings + break-even months. reversibility="destructive-permanent" (commitment cannot be cancelled). consequences MUST include "1y/3y commitment, capacity locked in".',
        'Tier 4 (REQUIRES backup):',
        '  - Unattached EBS: backupCommand=`aws ec2 create-snapshot --region <r> --volume-id <id> --description pre-delete-$(date +%s)`; suggestedAction waits for snap then `aws ec2 delete-volume`.',
        '  - Unattached EIPs: `aws ec2 release-address --region <r> --allocation-id <id>`. backupNeeded=false (record IP in description).',
        '  - Orphan AMI snapshots: `aws ec2 deregister-image` then `aws ec2 delete-snapshot` per BlockDeviceMappings snap. backupNeeded=false (the AMI WAS the backup).',
        '  - Idle NAT Gateway: `aws ec2 delete-nat-gateway --region <r> --nat-gateway-id <id>`. consequences: "private subnets lose internet egress; verify route tables".',
        '  - Idle ALB: backupCommand captures listeners + target groups to JSON; `aws elbv2 delete-load-balancer --region <r> --load-balancer-arn <arn>`.',
        '  - Lambda PC w/ no invocations: `aws lambda delete-provisioned-concurrency-config --function-name <fn> --qualifier <q>`. backupNeeded=false (config-only).',
        '  - Unused VPC Interface endpoints: `aws ec2 delete-vpc-endpoints --vpc-endpoint-ids <id>`.',
        '  - RDS: backupCommand=`aws rds create-db-snapshot --db-instance-identifier <id> --db-snapshot-identifier <id>-pre-delete-$(date +%s)`; `aws rds delete-db-instance --skip-final-snapshot --delete-automated-backups`.',
        '  - DynamoDB: backupCommand=`aws dynamodb create-backup --table-name <t> --backup-name <t>-pre-delete-$(date +%s)`; `aws dynamodb delete-table`.',
        '  - S3 bucket: backupCommand=`aws s3 sync s3://<bucket> s3://' + (args.backupS3Bucket || '<MISSING-BACKUP-BUCKET>') + '/<bucket>/`; `aws s3 rb s3://<bucket> --force` (only if backup bucket configured).',
        '  - Lambda: backupCommand fetches code zip + config to artifactsDir; `aws lambda delete-function --function-name <fn>`.',
        '  - Secrets/Parameters: backupCommand=`aws secretsmanager get-secret-value --secret-id <id> --query SecretString --output text > artifactsDir/backups/<id>.txt && chmod 600 ...`; `aws secretsmanager delete-secret --force-delete-without-recovery`.',
        'Tier 5 (cluster-level): EKS managed node-group shrink (`aws eks update-nodegroup-config --scaling-config minSize=0,maxSize=2,desiredSize=0`); convert dev to Fargate Spot; delete clusters with all-empty namespaces. Always backup cluster + node-group JSON. consequences: "all workloads go offline; verify zero traffic 7d minimum".',
        'For Tier 4/5 where defaultBackupBeforeDestroy=true and backupCommand is missing: insert WARNING in description.',
        'verifyCommand examples:',
        '  - EBS deleted: `aws ec2 describe-volumes --volume-ids <id> 2>&1 | grep -q InvalidVolume.NotFound`',
        '  - NAT gw deleted: `aws ec2 describe-nat-gateways --nat-gateway-ids <id> --query "NatGateways[].State" --output text` returns "deleted"',
        '  - gp2->gp3 modified: `aws ec2 describe-volumes --volume-ids <id> --query "Volumes[].VolumeType" --output text` returns "gp3"',
        'Cap recs at maxRiskTier=' + args.maxRiskTier + '. Sort by savingsUsd desc within each tier.',
        'Write `recommendations.json` (the canonical array) + `recommendations.md` (grouped tables) under artifactsDir.',
        'Return ONLY: {"recommendationsArtifact":"<path>","recommendationsMarkdown":"<path>","recommendationsCount":<i>,"totalAddressableSavingsUsd":<n>,"byTier":{"1":<i>,"2":<i>,"3":<i>,"4":<i>,"5":<i>}}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['recommendationsArtifact', 'recommendationsCount'] },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

// Drift defense: re-read recs.json fresh
const readRecsTask = defineTask('aws-read-recs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Read ${args.recommendationsArtifact}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'JSON loader',
      task: `cat ${args.recommendationsArtifact} and return parsed JSON.`,
      context: { recommendationsArtifact: args.recommendationsArtifact },
      instructions: [
        `Run \`cat ${args.recommendationsArtifact}\`; parse the array.`,
        'If missing/unparseable: {"recommendations":[],"error":"<m>"}.',
        'Return ONLY: {"recommendations":[...],"count":<i>}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['recommendations'] },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

// ---------------------------------------------------------------------------
// Per-recommendation executors (all agents — they shell out via Bash)
// ---------------------------------------------------------------------------

const backupTask = defineTask('aws-backup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Backup ${args.resourceKind}/${args.resourceId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'AWS backup operator',
      task: 'Execute backupCommand and confirm success.',
      context: { backupCommand: args.backupCommand, resourceKind: args.resourceKind, resourceId: args.resourceId, artifactsDir: `tasks/${taskCtx.effectId}/artifacts` },
      instructions: [
        'If backupCommand non-empty: run via Bash; capture exit + stderr.',
        'For snapshot-style backups: poll until completed (max 10 min), e.g. `aws ec2 describe-snapshots --snapshot-ids <id> --query "Snapshots[0].State"`.',
        'If backupCommand empty: write `tasks/<effectId>/artifacts/no-backup-<kind>-<id>.txt` marker; return success=true, backedUp=false.',
        'Return ONLY: {"success":<bool>,"backedUp":<bool>,"backupArtifact"?:"<id-or-path>","stderr"?:"<m>"}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['success'] },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

const applyTask = defineTask('aws-apply', (args, taskCtx) => ({
  kind: 'agent',
  title: `Apply: ${(args.suggestedAction || '').slice(0, 100)}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'AWS change operator',
      task: 'Execute suggestedAction; report result.',
      context: { suggestedAction: args.suggestedAction },
      instructions: [
        'Run suggestedAction via Bash; capture exitCode + stdout + stderr.',
        'Return ONLY: {"success":<bool>,"exitCode":<i>,"stdout"?:"<truncated>","stderr"?:"<truncated>"}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['success'] },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

const verifyTask = defineTask('aws-verify', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify ${args.resourceKind}/${args.resourceId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'AWS change verifier',
      task: 'Run verifyCommand to confirm action took effect.',
      context: { verifyCommand: args.verifyCommand, resourceKind: args.resourceKind, resourceId: args.resourceId },
      instructions: [
        'verifyCommand empty: {"verified":false,"skipped":true}.',
        'Else: run via Bash; verified iff exitCode===0 AND stdout matches expected sentinel implied by command.',
        'Return ONLY: {"verified":<bool>,"skipped"?:<bool>,"stdout"?:"<truncated>","stderr"?:"<truncated>"}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['verified'] },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

// Final report — only task that writes to user-controlled outputDir
const finalReportTask = defineTask('aws-final-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compose ${args.outputDir}/cost-reduction-report.md`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FinOps analyst',
      task: `Generate ${args.outputDir}/cost-reduction-report.md`,
      context: {
        outputDir: args.outputDir,
        applied: args.applied,
        skipped: args.skipped,
        savingsUsd: args.savingsUsd,
        recommendationsArtifact: args.recommendationsArtifact,
        finopsManifest: args.finopsManifest,
        costEstimationArtifact: args.costEstimationArtifact,
        accountId: args.accountId,
        regions: args.regions,
        currency: args.currency,
      },
      instructions: [
        `\`mkdir -p ${args.outputDir}\`.`,
        'Sections: 1) Executive summary (account, regions, window, total monthly observed, addressable, applied savings, residual). 2) Applied actions table (id|tier|category|resource|savingsUsd|backedUp|verified|timestamp). 3) Skipped actions table (id|tier|category|resource|savingsUsd|reason). 4) Pending follow-ups (Tier 4/5 needing 30d monitoring). 5) Backup inventory (snap/AMI/file IDs+locations). 6) Methodology + caveats (CE attribution limits, CO opt-in, TA support tier, regional scope).',
        'Pull data via Bash `cat` from recommendationsArtifact + costEstimationArtifact + finopsManifest. Do not paraphrase counts.',
        'Return ONLY: {"reportFile":"<path>","actionsApplied":<i>,"actionsSkipped":<i>,"savingsUsd":<n>}',
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
    accountId,
    outputDir = 'aws-cost-reduction',
    regions = ['us-east-1'],
    discoveryManifest = null,
    targetSavingsPercent = 25,
    maxRiskTier = 4,
    defaultBackupBeforeDestroy = true,
    backupS3Bucket = null,
    currency = 'USD',
    installPolicy = 'ask',                  // 'ask' | 'auto' | 'never'
    authMethod = 'use-existing',            // 'use-existing' | 'sso' | 'static' | 'assume-role'
    ssoProfile = null,
    assumeRoleArn = null,
    staticCredentials = null,
  } = inputs;

  if (!accountId) throw new Error('accountId is required');
  const empty = { success: false, recommendationsCount: 0, actionsApplied: 0, actionsSkipped: 0, estimatedSavingsUsd: 0, reportFile: null };

  // ---- Bootstrap: CLI -----------------------------------------------------
  let bootstrap = await ctx.task(cliBootstrapTask, { installPolicy: 'never' });
  if (!bootstrap?.value?.ready) {
    const missing = bootstrap.value?.pendingInstall || ['aws', 'jq'].filter(t => !bootstrap.value?.[t]?.present);
    if (installPolicy === 'never') throw new Error(`Required CLIs missing: ${missing.join(', ')}.`);
    const ok = await ctx.breakpoint({
      title: 'Install missing AWS CLIs',
      breakpointId: 'aws-systems-cost-reduction.install-clis',
      question: `Missing: ${missing.join(', ')}. Approve install?`,
      options: ['Approve install', 'Skip (run will fail)', 'Cancel'],
      expert: 'owner', tags: ['install-gate', 'pre-bootstrap'],
    });
    if (!ok?.approved || ok.response === 'Cancel') return empty;
    if (ok.response === 'Approve install') {
      bootstrap = await ctx.task(cliBootstrapTask, { installPolicy: 'auto' });
      if (!bootstrap?.value?.ready) throw new Error('Bootstrap install failed.');
    }
  }

  // ---- Bootstrap: auth ----------------------------------------------------
  let auth = await ctx.task(awsAuthTask, { authMethod, ssoProfile, assumeRoleArn, staticCredentials, accountIdHint: accountId, regionsHint: regions });
  if (!auth?.value?.loggedIn) {
    const pick = await ctx.breakpoint({
      title: 'Pick AWS authentication method',
      breakpointId: 'aws-systems-cost-reduction.auth-method',
      question: `No usable AWS session (error: ${auth?.value?.error || 'unknown'}). How should I authenticate?`,
      options: ['SSO login', 'Static access keys', 'Assume role', 'Cancel'],
      expert: 'owner', tags: ['auth-gate'],
    });
    if (!pick?.approved || pick.response === 'Cancel') return empty;
    let m = 'use-existing', sso = ssoProfile, arn = assumeRoleArn, creds = staticCredentials;
    if (pick.response.includes('SSO')) {
      m = 'sso';
      const r = await ctx.breakpoint({ title: 'AWS SSO profile name', breakpointId: 'aws-systems-cost-reduction.sso-profile', question: 'Enter SSO profile name (configured via `aws configure sso`).', options: ['Submitted', 'Cancel'], expert: 'owner', tags: ['auth-gate'] });
      sso = r?.feedback || r?.response || null;
    } else if (pick.response.includes('Static')) {
      m = 'static';
      const r = await ctx.breakpoint({ title: 'AWS static credentials', breakpointId: 'aws-systems-cost-reduction.static-creds', question: 'Paste JSON {accessKeyId, secretAccessKey, sessionToken?, region?}.', options: ['Submitted', 'Cancel'], expert: 'owner', tags: ['auth-gate', 'sensitive-input'] });
      try { creds = JSON.parse(r?.feedback || r?.response || '{}'); } catch { creds = null; }
    } else if (pick.response.includes('Assume')) {
      m = 'assume-role';
      const r = await ctx.breakpoint({ title: 'AWS role ARN to assume', breakpointId: 'aws-systems-cost-reduction.assume-arn', question: 'Enter role ARN (arn:aws:iam::<account>:role/<name>).', options: ['Submitted', 'Cancel'], expert: 'owner', tags: ['auth-gate'] });
      arn = r?.feedback || r?.response || null;
    }
    auth = await ctx.task(awsAuthTask, { authMethod: m, ssoProfile: sso, assumeRoleArn: arn, staticCredentials: creds, accountIdHint: accountId, regionsHint: regions });
    if (!auth?.value?.loggedIn) throw new Error(`AWS login failed: ${auth?.value?.error || 'unknown'}`);
  }

  const profileToUse = auth.value.profileToUse || 'default';
  const resolvedRegions = (regions && regions.length) ? regions : (auth.value.enabledRegions || ['us-east-1']);

  // ---- Scope confirmation -------------------------------------------------
  const scope = await ctx.breakpoint({
    title: 'Confirm AWS cost-reduction scope',
    breakpointId: 'aws-systems-cost-reduction.scope',
    question: [
      `Account: ${auth.value.account?.id} (${auth.value.account?.arn})`,
      `Regions: ${resolvedRegions.join(', ')}`,
      `Target savings: ${targetSavingsPercent}%`,
      `Max risk tier: ${maxRiskTier} (1=cosmetic, 5=cluster delete)`,
      `Default backup before destroy: ${defaultBackupBeforeDestroy}`,
      `Backup S3 bucket: ${backupS3Bucket || '<none — S3 sync backups unavailable>'}`,
      `Discovery manifest: ${discoveryManifest ? 'provided' : 'absent (minimal inventory mode)'}`,
      `Output dir: ${outputDir}`,
      ``, `Each destructive action gates on its own breakpoint.`,
    ].join('\n'),
    options: ['Approve', 'Cancel'], expert: 'owner', tags: ['scope-gate'],
  });
  if (!scope?.approved || scope.response === 'Cancel') return empty;

  // ---- Phases 1-3: data, estimation, recs --------------------------------
  const finops = await ctx.task(finopsDataTask, {
    accountId: auth.value.account?.id || accountId,
    regions: resolvedRegions,
    profile: profileToUse,
    discoveryManifest,
  });
  const estimation = await ctx.task(costEstimationTask, {
    finopsManifest: finops?.value?.manifest,
    discoveryManifest,
    currency,
  });
  const recsResult = await ctx.task(recommendationsBuildTask, {
    finopsManifest: finops?.value?.manifest,
    costEstimationArtifact: estimation?.value?.estimationArtifact,
    discoveryManifest,
    maxRiskTier,
    backupS3Bucket,
    defaultBackupBeforeDestroy,
    targetSavingsPercent,
  });

  // ---- Phase 4: drift-defense read of recs --------------------------------
  const recsRead = await ctx.task(readRecsTask, { recommendationsArtifact: recsResult?.value?.recommendationsArtifact });
  const recs = Array.isArray(recsRead?.value?.recommendations) ? recsRead.value.recommendations : [];

  // ---- Phase 5: per-rec execution loop with 4-option breakpoint -----------
  const applied = [];
  const skipped = [];
  const skippedTiers = new Set();
  let totalSavings = 0;

  for (const rec of recs) {
    if (rec.tier > maxRiskTier) { skipped.push({ ...rec, reason: 'above-max-tier' }); continue; }
    if (skippedTiers.has(rec.tier)) { skipped.push({ ...rec, reason: 'tier-skipped-by-user' }); continue; }

    const decision = await ctx.breakpoint({
      title: `[Tier ${rec.tier}] ${rec.category}: ${rec.resource?.kind || '?'}/${rec.resource?.id || rec.resource?.name || '?'}`,
      breakpointId: `aws-systems-cost-reduction.action.${rec.id}`,
      question: [
        `${rec.description}`,
        `Region: ${rec.resource?.region || 'n/a'}`,
        ``,
        `Current: $${rec.currentMonthlyUsd}/mo  ->  Projected: $${rec.projectedMonthlyUsd}/mo  (saves $${rec.savingsUsd})`,
        `Reversibility: ${rec.reversibility}`,
        ``,
        `Suggested action: ${rec.suggestedAction}`,
        `Backup command:   ${rec.backupCommand || '(none — destructive without backup)'}`,
        ``,
        `Consequences:`,
        ...((rec.consequences || []).map(c => `  - ${c}`)),
      ].join('\n'),
      options: ['Apply with backup', 'Apply WITHOUT backup', 'Skip', 'Skip all in this tier'],
      expert: 'owner',
      tags: ['action-gate', `tier-${rec.tier}`, rec.category],
    });

    const choice = decision?.response || 'Skip';
    if (choice === 'Skip') { skipped.push({ ...rec, reason: 'user-skip' }); continue; }
    if (choice === 'Skip all in this tier') { skippedTiers.add(rec.tier); skipped.push({ ...rec, reason: 'tier-skipped-by-user' }); continue; }

    let backedUp = false;
    if (choice === 'Apply with backup' && rec.backupNeeded !== false) {
      const bk = await ctx.task(backupTask, { backupCommand: rec.backupCommand, resourceKind: rec.resource?.kind, resourceId: rec.resource?.id || rec.resource?.name });
      if (bk?.value?.success === false) { skipped.push({ ...rec, reason: `backup-failed: ${bk?.value?.stderr || 'unknown'}` }); continue; }
      backedUp = bk?.value?.backedUp === true;
    }
    try {
      const ap = await ctx.task(applyTask, { suggestedAction: rec.suggestedAction });
      if (ap?.value?.success === false) { skipped.push({ ...rec, reason: `apply-failed: ${ap?.value?.stderr || 'unknown'}`, backedUp }); continue; }
      const ve = await ctx.task(verifyTask, { verifyCommand: rec.verifyCommand, resourceKind: rec.resource?.kind, resourceId: rec.resource?.id || rec.resource?.name });
      applied.push({ ...rec, backedUp, verified: ve?.value?.verified === true, appliedAt: new Date().toISOString() });
      totalSavings += Number(rec.savingsUsd) || 0;
    } catch (e) {
      ctx.log?.('warn', `Action ${rec.id} failed: ${e.message}`);
      skipped.push({ ...rec, reason: `apply-failed: ${e.message}`, backedUp });
    }
  }

  // ---- Phase 6: final report ---------------------------------------------
  const report = await ctx.task(finalReportTask, {
    outputDir, applied, skipped, savingsUsd: totalSavings,
    recommendationsArtifact: recsResult?.value?.recommendationsArtifact,
    finopsManifest: finops?.value?.manifest,
    costEstimationArtifact: estimation?.value?.estimationArtifact,
    accountId: auth.value.account?.id || accountId,
    regions: resolvedRegions, currency,
  });

  // ---- Phase 7: final review ---------------------------------------------
  const approval = await ctx.breakpoint({
    title: 'Review cost-reduction output',
    breakpointId: 'aws-systems-cost-reduction.final-review',
    question: [
      `Cost-reduction run complete.`,
      `Applied: ${applied.length}, Skipped: ${skipped.length}, Estimated savings: $${totalSavings}/mo`,
      `Report: ${report?.value?.reportFile || `${outputDir}/cost-reduction-report.md`}`,
    ].join('\n'),
    options: ['Approve', 'Request changes'],
    expert: 'owner', tags: ['final-review'],
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
