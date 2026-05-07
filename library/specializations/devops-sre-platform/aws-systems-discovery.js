/**
 * @process contrib/devops/aws-systems-discovery
 * @description End-to-end AWS account discovery, system attribution, EKS
 *              deep-dive, ALB/NLB target attribution, external exposure map
 *              (Route53, CloudFront, public ALBs, EIPs, API Gateway, Lambda
 *              Function URLs, S3 public ACLs/policies), and per-system mermaid
 *              topology. All tasks are agent-driven; there is no inter-task
 *              filesystem contract — agents self-manage working state under
 *              their task-scoped directory and pass typed results forward as
 *              JSON. The caller controls where the final reports land via
 *              `inputs.outputDir`.
 *
 * @inputs {
 *   accountIds?: string[],            // omit to use current creds; if set, requires assume-role
 *   regions?: string[],               // CRITICAL — confirmed via breakpoint (AWS billed per-region)
 *   scopeMode?: 'current'|'org'|'list',
 *   systemUnit?: 'vpc'|'tag'|'cf-stack'|'eks-namespace',
 *   systemTagKey?: string,
 *   includeEksDeepDive?: boolean,
 *   includeRoute53Records?: boolean,
 *   probeExternalEndpoints?: boolean, // curl public hostnames to detect dead surfaces
 *   diagrams?: 'mermaid'|'mermaid+png'|'none',
 *   outputDir?: string,
 *   serviceCategories?: string[],     // restrict scan; default = all
 *   installPolicy?: 'ask'|'auto'|'never',
 *   authMethod?: 'use-existing'|'sso'|'assume-role'|'static-keys'|'container-or-instance-role',
 *   ssoProfile?: string,
 *   assumeRoleArn?: string,
 *   staticCredentials?: { accessKeyId: string, secretAccessKey: string, sessionToken?: string }
 * }
 * @outputs {
 *   success: boolean,
 *   accounts: string[],
 *   regions: string[],
 *   resources: number,
 *   systems: number,
 *   eksClusters: number,
 *   loadBalancers: number,
 *   externalHostnames: number,
 *   reportFiles: string[],
 *   indexFile: string|null
 * }
 *
 * @skill aws-cloud specializations/devops-sre-platform/skills/aws-cloud/SKILL.md
 * @skill kubernetes-ops specializations/devops-sre-platform/skills/kubernetes-ops/SKILL.md
 * @skill generating-aws-diagrams specializations/devops-sre-platform/skills/generating-aws-diagrams/SKILL.md
 * @agent infra-architect specializations/devops-sre-platform/agents/infra-architect/AGENT.md
 *
 * Service coverage (probed unless `serviceCategories` is provided):
 *   - Compute: EC2, EBS volumes/snapshots, ASGs, Launch Templates, Outposts,
 *     Wavelength, Local Zones
 *   - Containers: EKS (clusters, nodegroups, Fargate profiles, ns/workloads/
 *     services/ingresses), ECS, Fargate, ECR
 *   - Serverless / Web: Lambda + Function URLs, API Gateway (REST + v2),
 *     AppSync, Amplify, Step Functions, Cognito (user + identity pools)
 *   - Data: RDS + Aurora, DynamoDB, ElastiCache, Redshift, OpenSearch, Glue,
 *     Athena, EMR, Kinesis, MSK, MQ
 *   - Messaging/Eventing: SQS, SNS, EventBridge, Kinesis, MSK
 *   - Storage: S3 (incl. public ACL/policy), EFS, FSx, Storage Gateway,
 *     Backup, DataSync
 *   - Networking: VPCs, subnets, route tables, IGWs, NAT GWs, EIPs, VPC
 *     endpoints, peerings, Transit Gateway, Direct Connect, Network Firewall,
 *     ALB/NLB/CLB + target groups, CloudFront, Route53, Global Accelerator,
 *     WAF, Shield
 *   - Identity/Secrets: IAM, KMS, Secrets Manager, SSM Parameter Store
 *   - Observability: CloudWatch (alarms, log groups, dashboards), X-Ray,
 *     CloudTrail, Config
 *   - AI/ML: SageMaker, Bedrock, Comprehend, Lex, Polly, Rekognition,
 *     Translate
 *   - Edge: Outposts, Wavelength, Local Zones, SSM fleet inventory
 *
 * Agent-task design:
 *   - Every task is `kind: 'agent'`. Discovery agents run `aws` (+ `kubectl`/
 *     `eksctl` where reachable) internally via Bash. Composers read upstream
 *     return values plus task-scoped artifact paths passed forward.
 *   - Agents write intermediate JSON under `tasks/<effectId>/artifacts/` and
 *     return manifests of paths. No shared "raw/" directory.
 *   - `inputs.outputDir` is the ONLY user-controlled path; only final
 *     composed reports land there.
 *   - AWS is region-scoped: regional vs. global discovery are separate calls.
 *     Global services (IAM, Route53, CloudFront, S3, WAFv2 CLOUDFRONT, Orgs)
 *     hit us-east-1 once per account.
 *   - Multi-account scans: the discovery agent STS-assumes the cross-account
 *     role and exports scoped creds before each walk.
 *   - Tolerate AccessDenied / OptInRequired per service; record in manifest.
 *   - Drift defense: composers `cat` source artifacts at execution time.
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
// Bootstrap — ensure aws CLI is installed and an identity is authenticated.
// Runs before discovery on a fresh machine. On a machine that's already set
// up, all phases short-circuit to "already-present".
// ---------------------------------------------------------------------------

const cliBootstrapTask = defineTask('aws-cli-bootstrap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Probe + install AWS CLI (aws), kubectl, eksctl, jq',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cloud-CLI installer',
      task: 'Detect whether aws / kubectl / eksctl / jq are installed and runnable. Install any missing tool, asking the user before installing if installPolicy is "ask".',
      context: {
        installPolicy: args.installPolicy,                      // 'ask' | 'auto' | 'never'
        preferredAwsInstallMethod: args.preferredAwsInstallMethod, // 'pip' | 'apt' | 'brew' | 'curl-bundle'
        platform: '<auto-detect via uname>',
      },
      instructions: [
        'Detect platform with `uname -s` and `uname -m`. Respect the user\'s preferredAwsInstallMethod when possible.',
        'For each tool (aws, kubectl, eksctl, jq):',
        '  1. Run `which <tool>` and capture version (`aws --version`, `kubectl version --client=true --short=true`, `eksctl version`, `jq --version`). If present, mark `present: true`.',
        '  2. If missing and installPolicy=="never": mark `present: false, action: "skipped-by-policy"` and continue.',
        '  3. If missing and installPolicy=="ask": **DO NOT install yet** — return early with `pendingInstall: ["<tool>", ...]` so the orchestrator can raise a breakpoint. The orchestrator will re-call you with installPolicy="auto" once approved.',
        '  4. If missing and installPolicy=="auto": install via the preferred method:',
        '     - aws: prefer `pip install --user awscli` (puts to $HOME/.local/bin, no sudo). Fallbacks: `curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip && unzip -q /tmp/awscliv2.zip -d /tmp && /tmp/aws/install -i $HOME/.local/aws-cli -b $HOME/.local/bin` (no sudo) or `apt-get install -y awscli` or `brew install awscli`.',
        '     - kubectl: `curl -LO "https://s3.us-west-2.amazonaws.com/amazon-eks/1.30.0/2024-09-12/bin/$(uname -s | tr "[:upper:]" "[:lower:]")/amd64/kubectl" && chmod +x kubectl && mv kubectl $HOME/.local/bin/`. Pin a recent version when in doubt.',
        '     - eksctl: `curl -L "https://github.com/eksctl-io/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp && mv /tmp/eksctl $HOME/.local/bin/`.',
        '     - jq: `apt-get install -y jq` | `brew install jq` | static binary download from github.com/jqlang/jq into $HOME/.local/bin.',
        '  5. After install, re-probe to confirm. Ensure $HOME/.local/bin is on PATH; if not, prepend it.',
        'Always prefer non-sudo install paths (`$HOME/.local/bin`) when possible.',
        'Return ONLY:',
        '{',
        '  "aws": {"present": <bool>, "version": "<v>", "path": "<path>", "action": "already-present"|"installed"|"skipped-by-policy"|"failed", "error"?: "<msg>"},',
        '  "kubectl": {...same shape},',
        '  "eksctl": {...same shape},',
        '  "jq": {...same shape},',
        '  "pendingInstall"?: [<tool-names>],',
        '  "ready": <bool>',
        '}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['aws', 'jq', 'ready'] },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const awsAuthTask = defineTask('aws-auth', (args, taskCtx) => ({
  kind: 'agent',
  title: `Authenticate to AWS (method: ${args.authMethod})`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'AWS auth assistant',
      task: 'Authenticate the local aws CLI session using the chosen method, then enumerate accessible accounts.',
      context: {
        authMethod: args.authMethod,                 // 'use-existing' | 'sso' | 'assume-role' | 'static-keys' | 'container-or-instance-role'
        ssoProfile: args.ssoProfile,                 // when authMethod=sso
        assumeRoleArn: args.assumeRoleArn,           // when authMethod=assume-role
        staticCredentials: args.staticCredentials,   // when authMethod=static-keys; {accessKeyId, secretAccessKey, sessionToken?}
      },
      instructions: [
        'Method `use-existing`: run `aws sts get-caller-identity --output json`. If it succeeds, that is the active identity. If it fails, return `loggedIn: false` and ask the orchestrator to pick a method.',
        'Method `sso`: run `aws sso login --profile <ssoProfile>`. After login, set `AWS_PROFILE=<ssoProfile>` and re-run `aws sts get-caller-identity`. Print the verification URL prominently.',
        'Method `assume-role`: run `aws sts assume-role --role-arn <assumeRoleArn> --role-session-name discovery-session --output json`, then export AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_SESSION_TOKEN from the response and re-run `aws sts get-caller-identity`. Persist the exports into a profile-scoped credential file under `tasks/<effectId>/artifacts/aws-creds.env` so downstream tasks can `source` it. Never log the secret access key.',
        'Method `static-keys`: run `aws configure set aws_access_key_id <id> --profile discovery && aws configure set aws_secret_access_key <secret> --profile discovery && aws configure set aws_session_token <token> --profile discovery` (only if token present). Then `AWS_PROFILE=discovery aws sts get-caller-identity`. Never log the secret.',
        'Method `container-or-instance-role`: do nothing — the SDK will pick up the IMDS or container metadata creds. Just run `aws sts get-caller-identity`.',
        'After identity is confirmed, attempt `aws organizations describe-organization --output json`. If it succeeds, run `aws organizations list-accounts --output json` and include the account list. If it fails (likely AccessDenied — caller is not in the org-management account), set `availableAccounts` to just the current identity\'s account.',
        'Return ONLY:',
        '{',
        '  "loggedIn": <bool>,',
        '  "method": "<method-actually-used>",',
        '  "currentIdentity": {"accountId": "<acct>", "userId": "<uid>", "arn": "<arn>", "type": "user"|"role"|"assumed-role"|"federated"},',
        '  "orgRoot"?: {"id": "<r-xxx>", "masterAccountId": "<acct>"},',
        '  "availableAccounts": [{"id": "<acct>", "name": "<name>", "email"?: "<e>", "status": "ACTIVE"|"SUSPENDED"}],',
        '  "credentialsArtifact"?: "<path-to-env-file>"',
        '}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['loggedIn', 'currentIdentity'] },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ---------------------------------------------------------------------------
// Discovery — one comprehensive agent task per (account, region) pair plus a
// single global pass per account. Each task owns its own working dir and
// returns a manifest of artifact paths.
// ---------------------------------------------------------------------------

const discoveryTask = defineTask('aws-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Inventory account ${args.accountId} ${args.scope === 'global' ? '(global services)' : `region ${args.region}`}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'AWS cloud auditor',
      task: 'Inventory every AWS resource in the target (account, region|global) scope and emit a manifest of artifact files (one per service category) under your task-scoped artifacts directory.',
      context: {
        accountId: args.accountId,
        region: args.region,                         // null when scope==='global'
        scope: args.scope,                           // 'regional' | 'global'
        serviceCategories: args.serviceCategories,
        artifactsDir: `tasks/${taskCtx.effectId}/artifacts`,
        includeEksDeepDive: args.includeEksDeepDive,
        credentialsArtifact: args.credentialsArtifact, // path produced by awsAuthTask, may be null
        assumeRoleArn: args.assumeRoleArn,             // when scanning a different account
      },
      instructions: [
        'You own your scratch directory. Write all intermediate JSON to `tasks/<effectId>/artifacts/`. Return a manifest of paths.',
        'If `credentialsArtifact` is set, `source` it first. If `assumeRoleArn` is set AND the account differs from the current STS identity, run `aws sts assume-role --role-arn <arn> --role-session-name discovery-<acct>` and export the creds BEFORE any list calls.',
        'Regional scope: pass `--region <region>` on every command. Global scope: target us-east-1 for IAM/Route53/CloudFront/S3-list/WAF-CLOUDFRONT/Organizations.',
        'Use the dedicated subcommand per service; fall back to `aws resourcegroupstaggingapi get-resources --resource-type-filters <type>` for cross-cutting tag inventory.',
        'REGIONAL categories to walk:',
        '  - compute: ec2 describe-instances/describe-volumes/describe-snapshots(--owner-ids self)/describe-addresses, autoscaling describe-auto-scaling-groups, ec2 describe-launch-templates',
        '  - containers: eks list-clusters (+ describe-cluster, list-nodegroups, list-fargate-profiles per cluster), ecs list-clusters/list-services/list-task-definitions, ecr describe-repositories',
        '  - serverless: lambda list-functions (+ list-function-url-configs), apigateway get-rest-apis, apigatewayv2 get-apis, appsync list-graphql-apis, amplify list-apps, stepfunctions list-state-machines, cognito-idp list-user-pools, cognito-identity list-identity-pools',
        '  - data: rds describe-db-instances + describe-db-clusters, dynamodb list-tables, elasticache describe-cache-clusters + describe-replication-groups, redshift describe-clusters, opensearch list-domain-names, glue get-databases, athena list-work-groups, emr list-clusters, kinesis list-streams, kafka list-clusters-v2, mq list-brokers',
        '  - messaging: sqs list-queues, sns list-topics, events list-event-buses + list-rules',
        '  - storage-regional: efs describe-file-systems, fsx describe-file-systems, storagegateway list-gateways, backup list-backup-vaults + list-backup-plans, datasync list-tasks',
        '  - networking: ec2 describe-vpcs/subnets/route-tables/internet-gateways/nat-gateways/vpc-endpoints/vpc-peering-connections/transit-gateways/transit-gateway-attachments, elbv2 describe-load-balancers + describe-target-groups + describe-listeners (per LB) + describe-target-health (per TG), elb describe-load-balancers, network-firewall list-firewalls, directconnect describe-connections + describe-virtual-interfaces, globalaccelerator list-accelerators (us-west-2 only), wafv2 list-web-acls --scope REGIONAL',
        '  - identity-secrets: kms list-keys, secretsmanager list-secrets, ssm describe-parameters',
        '  - observability: cloudwatch describe-alarms, logs describe-log-groups, cloudwatch list-dashboards, xray get-groups, cloudtrail describe-trails, config describe-configuration-recorders',
        '  - ai-ml: sagemaker list-notebook-instances + list-endpoints + list-training-jobs (--max-results 50), bedrock list-foundation-models + list-provisioned-model-throughputs, comprehend list-endpoints, lex-models-v2 list-bots, rekognition list-collections, translate list-terminologies',
        '  - edge: outposts list-outposts, ssm describe-instance-information',
        'GLOBAL categories (when scope==="global"):',
        '  - iam: list-users, list-roles, list-policies --scope Local',
        '  - s3: s3api list-buckets; per-bucket get-bucket-location/get-bucket-policy-status/get-public-access-block/get-bucket-acl (sample first 50; mark `truncated: true` if more)',
        '  - cloudfront: list-distributions; route53: list-hosted-zones (records pulled by r53RecordsTask)',
        '  - acm: list-certificates --region us-east-1; waf-cloudfront: wafv2 list-web-acls --scope CLOUDFRONT',
        '  - organizations: describe-organization + list-accounts (best-effort)',
        '  - ce: ce get-cost-and-usage --time-period Start=$(date -u -d "30 days ago" +%Y-%m-%d),End=$(date -u +%Y-%m-%d) --granularity MONTHLY --metrics UnblendedCost --group-by Type=DIMENSION,Key=SERVICE Type=DIMENSION,Key=REGION (AccessDenied is common)',
        'Tolerate AccessDenied / OptInRequired / UnauthorizedOperation per service. Record `note: "<reason>"` in the manifest entry; do NOT crash the loop.',
        'Record waste markers explicitly: stopped EC2 (compute=$0, EBS still bills); unattached EBS volumes; unassociated EIPs; NAT GWs (always flag — high $/mo); idle ALBs (no listeners or empty target groups); empty ASGs; Lambda Function URLs (public exposure); S3 buckets where BlockPublicAcls=false OR PolicyStatus.IsPublic=true; orphan ALBs after EKS cluster deletion.',
        'For ALB/NLB attribution, persist `lb-detail/<name>-listeners.json`, `lb-detail/<name>-targetgroups.json`, `lb-detail/<name>-tg-<tg>-health.json` under your artifactsDir.',
        'Return ONLY this JSON:',
        '{',
        '  "accountId": "<acct>",',
        '  "region": "<region-or-global>",',
        '  "scope": "regional"|"global",',
        '  "manifest": {',
        '    "<category>": {"path": "<artifact-path>", "count": <int>, "note"?: "<error-or-warning>"}',
        '  },',
        '  "wasteMarkers": {"unattachedEbs": <int>, "unassociatedEips": <int>, "natGateways": <int>, "idleAlbs": <int>, "publicS3": <int>, "stoppedEc2": <int>, "lambdaFunctionUrls": <int>},',
        '  "headlineCounts": {"resources": <int>, "vpcs": <int>, "ec2Instances": <int>, "loadBalancers": <int>, "eksClusters": <int>, "ecsClusters": <int>, "lambdaFunctions": <int>, "rdsInstances": <int>, "s3Buckets": <int>, "dynamoTables": <int>}',
        '}',
        'Do not write to any path outside `tasks/<effectId>/artifacts/`. Do not assume the user has a particular output directory until the composition phase.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['accountId', 'scope', 'manifest', 'headlineCounts'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const eksDeepDiveTask = defineTask('aws-eks-deep-dive', (args, taskCtx) => ({
  kind: 'agent',
  title: `EKS deep-dive (account ${args.accountId} region ${args.region})`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Kubernetes / EKS auditor',
      task: 'For each EKS cluster in the manifest, attempt direct kubectl access and emit per-cluster artifacts.',
      context: {
        accountId: args.accountId,
        region: args.region,
        manifest: args.manifest,                       // discovery manifest for this region
        artifactsDir: `tasks/${taskCtx.effectId}/artifacts`,
        credentialsArtifact: args.credentialsArtifact,
      },
      instructions: [
        'If credentialsArtifact is set, source it first.',
        'Read the EKS cluster list from the discovery manifest (manifest.containers.path -> JSON with cluster names). For each cluster:',
        '  1. mkdir `tasks/<effectId>/artifacts/eks/<cluster>` for output.',
        '  2. `aws eks describe-cluster --region <region> --name <cluster>` -> cluster.json.',
        '  3. `aws eks list-nodegroups --region <region> --cluster-name <cluster>` then per nodegroup `describe-nodegroup` -> nodegroups.json.',
        '  4. `aws eks list-fargate-profiles --region <region> --cluster-name <cluster>` then per profile `describe-fargate-profile` -> fargate-profiles.json.',
        '  5. `aws eks update-kubeconfig --region <region> --name <cluster> --kubeconfig <artifactsDir>/eks/<cluster>/kubeconfig`.',
        '  6. With KUBECONFIG set, run with timeout 30 each: `kubectl get ns -o json` -> namespaces.json; `kubectl get deploy,sts,ds,job,cronjob -A -o json` -> workloads.json; `kubectl get svc -A -o json` -> services.json; `kubectl get ingress -A -o json` -> ingresses.json; `kubectl get pods -A -o json` -> pods.json; `kubectl top pods -A --no-headers` -> top-pods.txt (best-effort, may fail if metrics-server absent); `kubectl top nodes --no-headers` -> top-nodes.txt.',
        '  7. If any kubectl call fails with `error: You must be logged in` / `Unauthorized` / `forbidden`, mark status as `rbac-denied` and skip the rest. If the cluster endpoint is private and unreachable, mark status `private-unreachable` and skip.',
        '  8. If the cluster status from describe-cluster is anything other than `ACTIVE`, record metadata only and mark status `not-active`.',
        '  9. Always remove the kubeconfig file from disk after the kubectl block (rm -f).',
        'Emit a per-cluster status.txt containing one of: `reachable` | `rbac-denied` | `private-unreachable` | `not-active`.',
        'Return ONLY:',
        '{',
        '  "accountId": "<acct>",',
        '  "region": "<region>",',
        '  "clusters": [',
        '    {"name": "<n>", "status": "<one of above>", "version": "<v>", "nodegroups": <int>, "fargateProfiles": <int>, "namespaces"?: <int>, "workloads"?: <int>, "services"?: <int>, "ingresses"?: <int>, "artifactDir": "<path>"}',
        '  ]',
        '}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['accountId', 'region', 'clusters'] },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const r53RecordsTask = defineTask('aws-route53-records', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Pull every Route 53 record set across all hosted zones',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DNS auditor',
      task: 'List every record set in every Route53 hosted zone (public + private), flag wildcards, emit a single normalized JSON artifact.',
      context: {
        accountId: args.accountId,
        manifest: args.manifest,                     // global discovery manifest with route53 zone path
        artifactsDir: `tasks/${taskCtx.effectId}/artifacts`,
        credentialsArtifact: args.credentialsArtifact,
      },
      instructions: [
        'If credentialsArtifact is set, source it first.',
        'Read the hosted-zone list from manifest.route53.path. For each zone (id, name, private?), call `aws route53 list-resource-record-sets --hosted-zone-id <zid>` (paginated). Normalize records to:',
        '  {zoneId, zoneName, private: <bool>, name, type, ttl, isWildcard: <name starts with "*.">, values: [<string>], alias?: {dnsName, hostedZoneId, evaluateTargetHealth}}',
        'Concatenate into `<artifactsDir>/r53-records.json`.',
        'Return ONLY:',
        '{',
        '  "accountId": "<acct>",',
        '  "recordsArtifact": "<path>",',
        '  "totalRecords": <int>,',
        '  "wildcardRecords": <int>,',
        '  "zones": <int>',
        '}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['recordsArtifact', 'totalRecords'] },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ---------------------------------------------------------------------------
// Composition agents. Each takes:
//   - the discovery manifests (paths to category JSON, NOT the bytes)
//   - the destination outputDir (the only path the user cares about)
// and produces output report files there.
// ---------------------------------------------------------------------------

const systemReportComposerTask = defineTask('aws-system-reports', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compose per-system reports under ${args.outputDir}/systems/`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'AWS infrastructure architect',
      task: `Generate one markdown report per "system" under ${args.outputDir}/systems/.`,
      context: {
        manifests: args.manifests,                    // [{accountId, region, scope, manifest, ...}, ...]
        systemUnit: args.systemUnit,
        systemTagKey: args.systemTagKey,
        outputDir: args.outputDir,
      },
      instructions: [
        'Read every per-(account,region) discovery manifest. Each category points at a JSON artifact under the discovery task\'s scratch dir; `cat` those at execution time, do not assume their layout.',
        `System grouping (\`systemUnit\`):`,
        `  - 'vpc': one report per VPC across all regions (cross-region by design)`,
        `  - 'tag': group by tag value of '${args.systemTagKey}'; resources missing the tag go to a single 'untagged' report`,
        `  - 'cf-stack': one report per CloudFormation stack name (best-effort: scan resource Tags['aws:cloudformation:stack-name'])`,
        `  - 'eks-namespace': one report per EKS namespace (across all clusters), plus one per non-EKS VPC`,
        `For each system: header (name, regions, account(s), resource count), inventory grouped by category (Compute, Containers, Serverless, Data, Storage, Messaging, AI/ML, Networking, Identity, Observability, Edge), EKS subsection if any, networking subsection (VPCs, ALB/NLB with listener counts, NAT GWs, EIPs, VPC endpoints), data subsection (with engine + class), cross-system dependencies (scan ARNs, Lambda env vars, IAM trust policies).`,
        `Skip empty groupings with a single-line stub file. Do not paraphrase counts; compute them with jq from the artifacts.`,
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

const eksUsageReportTask = defineTask('aws-eks-usage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compose ${args.outputDir}/eks-usage.md`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Kubernetes platform engineer',
      task: `Generate ${args.outputDir}/eks-usage.md`,
      context: { eksResults: args.eksResults, outputDir: args.outputDir },
      instructions: [
        'Read the per-cluster artifact dirs from `eksResults`. Each reachable cluster has namespaces.json, workloads.json, services.json, ingresses.json, pods.json, top-pods.txt, top-nodes.txt, status.txt.',
        'Top: cluster summary table (name, account, region, k8s version, nodegroup count, Fargate profile count, status: reachable / rbac-denied / private-unreachable / not-active).',
        'Per reachable cluster: per-namespace table sorted desc by summed CPU requests (cols: ns | pods | CPU req | mem req GiB | CPU lim | mem lim | actual CPU | actual mem | workloads). Skip pods with .status.phase in [Succeeded, Failed]. Parse pod resource strings ("100m"=0.1c, "1"=1c, "128Mi"=0.125GiB, "1Gi"=1GiB).',
        'Per-namespace detail (only non-system namespaces with workloads): workload list (kind/name/replicas/image), services, ingresses (with hosts/paths/backends), Gateway API resources if present.',
        'Detect ingress controllers: `aws-load-balancer-controller` in kube-system (ingressClassName=alb), nginx-ingress, istio, contour, traefik — by namespace name + pod image patterns.',
        'For each Service of type=LoadBalancer, identify the underlying ELB by matching `metadata.annotations["service.beta.kubernetes.io/aws-load-balancer-name"]` OR the auto-generated name pattern `a<hash>` against the discovery LoadBalancer list. Reverse-link to the ALB/NLB tag `kubernetes.io/cluster/<name>=owned`.',
        'Top 10 pods by CPU request and top 10 by mem request across all clusters.',
        'Recent Warning events grouped by reason (parse from pods.json status conditions if events.json absent).',
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

const networkAttributionTask = defineTask('aws-network-attribution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compose ${args.outputDir}/network/`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'AWS network architect',
      task: `Generate ${args.outputDir}/network/README.md plus one ${args.outputDir}/network/lb-<name>-<region>.md per ALB/NLB.`,
      context: { manifests: args.manifests, eksResults: args.eksResults, outputDir: args.outputDir },
      instructions: [
        'Use the networking artifacts (vpcs, subnets, route tables, ALB/NLB lb-detail/, EIPs, NAT GWs, TGW, peerings, Network Firewall) from each regional manifest.',
        'Per ALB/NLB with listeners: full chain table — listener (port/protocol/SSL cert) -> default action / rules -> target group (protocol/port/healthcheck) -> targets. Attribute each target:',
        '  - EC2 instance ID -> instance Name tag from ec2 inventory',
        '  - IP target inside a VPC subnet -> match against EKS pod IPs (services.json clusterIP / pod IPs)',
        '  - Lambda target type -> Lambda function ARN',
        '  - Empty target group -> "unused/broken"',
        'Cross-reference the ALB tag `kubernetes.io/cluster/<name>=owned` to call out AWS Load Balancer Controller-managed ALBs and link to the EKS cluster report.',
        'Classic ELBs: list rules + backend instances; flag deprecated.',
        'EIPs: every EIP with attribution (NIC->instance, NAT GW, unattached). Unattached = waste.',
        'NAT Gateways: list per-region with subnet + EIP; explicitly flag $/mo cost.',
        'Transit Gateway: list per-region with attachments (VPC ids, account ids when cross-account). Flag cross-account attachments.',
        'CloudFront / Global Accelerator / Direct Connect / Network Firewall: list each profile with origin/backend.',
        `Top-level network/README.md: VPC table (CIDR, subnets, peerings, TGW attachments), ALB/NLB summary, EIP inventory, NAT GW inventory (cost-flagged), VPC endpoint summary, Route53 zone count.`,
        'All counts via jq, not estimates.',
        'Return ONLY: {"vpcs": <int>, "loadBalancers": <int>, "totalListeners": <int>, "natGateways": <int>, "publicIps": <int>, "files": [<paths>]}',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['loadBalancers', 'totalListeners', 'files'] },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const exposureMapTask = defineTask('aws-exposure-map', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compose ${args.outputDir}/external-exposure.md`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security architect',
      task: `Generate ${args.outputDir}/external-exposure.md`,
      context: { manifests: args.manifests, r53RecordsArtifact: args.r53RecordsArtifact, outputDir: args.outputDir, probeExternalEndpoints: args.probeExternalEndpoints },
      instructions: [
        'Enumerate every public surface from the manifests:',
        '  1. Route53 records (A/AAAA/CNAME/Alias) from the r53RecordsArtifact JSON',
        '  2. CloudFront distributions: domain (d<hash>.cloudfront.net) + custom CNAMEs + viewer cert + origin',
        '  3. ALB/NLB Internet-facing: DNSName (e.g. `internal-` prefix means internal — exclude); only `scheme=internet-facing` are public',
        '  4. EC2 instances with PublicIpAddress or associated EIP',
        '  5. Elastic IPs in use as PIPs',
        '  6. API Gateway REST + HTTP/v2 execute-api endpoints + custom domains',
        '  7. AppSync GraphQL endpoints',
        '  8. Lambda Function URLs (FunctionUrlConfig.FunctionUrl)',
        '  9. Amplify app default domains + custom domains',
        '  10. EKS LoadBalancer services with ExternalIP / hostname',
        '  11. S3 buckets where get-public-access-block.PublicAccessBlockConfiguration.BlockPublicAcls=false OR get-bucket-policy-status.PolicyStatus.IsPublic=true (call out the bucket as PUBLIC)',
        '  12. Global Accelerator IPs',
        '**Wildcard handling**: if a Route53 record is a wildcard (.isWildcard==true OR .name=="*.<zone>"), call out "Any subdomain not listed above also reaches <backend>" — this is OPEN SURFACE.',
        'Cross-reference each public hostname against an underlying AWS resource (matching IPs/FQDNs/aliases). Flag dangling DNS (alias target doesn\'t match any current resource) and broken backends (ALB listener with empty target group, ingress with no service).',
        args.probeExternalEndpoints ? 'For each external HTTPS hostname, run `curl -sS -o /dev/null -w "%{http_code}" --max-time 15 -k https://<host>/` and add the response code as a column. Annotate 5xx as broken, 000 as timeout.' : 'Skip live probing.',
        'Cols: hostname | DNS source | resolves to | backing system | HTTPS? | status (active/broken/dormant/dangling/PUBLIC).',
        'Headline counts at top.',
        'Return ONLY: {"externalHostnames": <int>, "broken": <int>, "danglingDns": <int>, "wildcardZones": <int>, "publicS3Buckets": <int>, "lambdaFunctionUrls": <int>, "outputFile": "<path>"}',
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

const diagramsTask = defineTask('aws-diagrams', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compose mermaid diagrams under ${args.outputDir}/diagrams/`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'AWS diagram author',
      task: `Generate mermaid diagrams under ${args.outputDir}/diagrams/.`,
      context: { manifests: args.manifests, eksResults: args.eksResults, outputDir: args.outputDir },
      instructions: [
        '1. global-topology.md — account-wide flowchart LR. Group regions into subgraphs. Inside each region, group VPCs into subgraphs and show top-level resources by category. Edges between VPC subgraphs for peerings + TGW attachments. Edges from CloudFront to origin (ALB/S3). Edges from Route53 alias records to their target.',
        '2. network.md — networking flowchart LR per region: VPC subgraphs with subnets, ALB/NLB nodes (listener fan-out -> TG -> targets), NAT GW + EIP edges, VPC endpoints.',
        '3. <system-name>.md per system with >=3 resources (use the systemUnit grouping).',
        '4. eks-<cluster>.md per reachable EKS cluster (subgraphs per namespace with workload nodes; edges from Service(LB) to ALB).',
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

const indexTask = defineTask('aws-index', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compose ${args.outputDir}/README.md`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical documentation author',
      task: `Generate ${args.outputDir}/README.md`,
      context: { outputDir: args.outputDir, summary: args.summary },
      instructions: [
        `Index sections: title + survey date + AWS account(s) + regions surveyed + headline counts (resources, VPCs, EC2, ALB/NLB, EKS clusters, Lambda, RDS, S3, DynamoDB) + waste markers callout + per-system reports list (use Glob on ${args.outputDir}/systems/) + EKS link + Networking link + External exposure link + Diagrams list + Refresh instructions.`,
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
    accountIds = [],
    regions = ['us-east-1'],
    scopeMode = 'current',
    systemUnit = 'vpc',
    systemTagKey = 'system',
    includeEksDeepDive = true,
    includeRoute53Records = true,
    probeExternalEndpoints = false,
    diagrams = 'mermaid',
    outputDir = 'aws-discovery',
    serviceCategories = null,
    installPolicy = 'ask',                     // 'ask' | 'auto' | 'never'
    preferredAwsInstallMethod = null,          // 'pip' | 'apt' | 'brew' | 'curl-bundle'
    authMethod = 'use-existing',               // 'use-existing' | 'sso' | 'assume-role' | 'static-keys' | 'container-or-instance-role'
    ssoProfile = null,
    assumeRoleArn = null,
    staticCredentials = null,
  } = inputs;

  const emptyResult = {
    success: false, accounts: [], regions: [], resources: 0, systems: 0,
    eksClusters: 0, loadBalancers: 0, externalHostnames: 0, reportFiles: [], indexFile: null,
  };

  // ---- Bootstrap: CLI install ---------------------------------------------
  let bootstrap = await ctx.task(cliBootstrapTask, { installPolicy: 'never', preferredAwsInstallMethod });
  if (!bootstrap?.value?.ready) {
    const missing = bootstrap.value?.pendingInstall || ['aws', 'jq'].filter(t => !bootstrap.value?.[t]?.present);
    if (installPolicy === 'never') {
      throw new Error(`Required CLIs missing: ${missing.join(', ')}. Re-run with installPolicy=ask or auto.`);
    }
    const installApproval = await ctx.breakpoint({
      title: 'Install missing AWS CLIs',
      breakpointId: 'aws-systems-discovery.install-clis',
      question: `Missing tools: ${missing.join(', ')}. Approve installation via ${preferredAwsInstallMethod || 'pip --user (no sudo)'}?`,
      options: ['Approve install', 'Skip (run will fail)', 'Cancel'],
      expert: 'owner',
      tags: ['install-gate', 'pre-bootstrap'],
    });
    if (!installApproval?.approved || installApproval?.response === 'Cancel') return emptyResult;
    if (installApproval.response === 'Approve install') {
      bootstrap = await ctx.task(cliBootstrapTask, { installPolicy: 'auto', preferredAwsInstallMethod });
      if (!bootstrap?.value?.ready) throw new Error('Bootstrap install failed; see task output.');
    }
  }

  // ---- Bootstrap: auth + account enumeration ------------------------------
  let auth = await ctx.task(awsAuthTask, { authMethod, ssoProfile, assumeRoleArn, staticCredentials });
  if (!auth?.value?.loggedIn) {
    const methodChoice = await ctx.breakpoint({
      title: 'Pick AWS authentication method',
      breakpointId: 'aws-systems-discovery.auth-method',
      question: 'No active AWS session found. How should I authenticate?',
      options: ['SSO login (will ask for profile)', 'Assume role (will ask for ARN)', 'Static access keys (will ask for creds)', 'Use IMDS / container role', 'Cancel'],
      expert: 'owner',
      tags: ['auth-gate'],
    });
    if (!methodChoice?.approved || methodChoice.response === 'Cancel') return emptyResult;
    let chosenMethod = 'use-existing';
    let chosenSso = ssoProfile;
    let chosenRole = assumeRoleArn;
    let chosenStatic = staticCredentials;
    if (methodChoice.response.startsWith('SSO')) {
      chosenMethod = 'sso';
      const ssoInput = await ctx.breakpoint({
        title: 'Provide AWS SSO profile name',
        breakpointId: 'aws-systems-discovery.sso-profile',
        question: 'Enter the AWS profile name configured for SSO (must already exist in ~/.aws/config).',
        options: ['Submit', 'Cancel'],
        expert: 'owner',
        tags: ['auth-gate'],
      });
      if (!ssoInput?.approved || ssoInput.response === 'Cancel') return emptyResult;
      chosenSso = (ssoInput.feedback || ssoInput.response || '').trim() || null;
    } else if (methodChoice.response.startsWith('Assume')) {
      chosenMethod = 'assume-role';
      const roleInput = await ctx.breakpoint({
        title: 'Provide cross-account role ARN',
        breakpointId: 'aws-systems-discovery.assume-role-arn',
        question: 'Paste the role ARN to assume (arn:aws:iam::<acct>:role/<name>).',
        options: ['Submit', 'Cancel'],
        expert: 'owner',
        tags: ['auth-gate'],
      });
      if (!roleInput?.approved || roleInput.response === 'Cancel') return emptyResult;
      chosenRole = (roleInput.feedback || roleInput.response || '').trim() || null;
    } else if (methodChoice.response.startsWith('Static')) {
      chosenMethod = 'static-keys';
      const keysInput = await ctx.breakpoint({
        title: 'Provide AWS static credentials',
        breakpointId: 'aws-systems-discovery.static-creds',
        question: 'Paste a JSON object {accessKeyId, secretAccessKey, sessionToken?}. (Stored only in this task input.json — handle accordingly.)',
        options: ['I have pasted the JSON', 'Cancel'],
        expert: 'owner',
        tags: ['auth-gate', 'sensitive-input'],
      });
      if (!keysInput?.approved || keysInput.response === 'Cancel') return emptyResult;
      try { chosenStatic = JSON.parse(keysInput?.feedback || keysInput?.response || '{}'); } catch { chosenStatic = null; }
    } else {
      chosenMethod = 'container-or-instance-role';
    }
    auth = await ctx.task(awsAuthTask, { authMethod: chosenMethod, ssoProfile: chosenSso, assumeRoleArn: chosenRole, staticCredentials: chosenStatic });
    if (!auth?.value?.loggedIn) throw new Error('AWS authentication failed.');
  }
  const credentialsArtifact = auth.value.credentialsArtifact || null;

  // ---- Account selection --------------------------------------------------
  let resolvedAccounts = accountIds;
  if (resolvedAccounts.length === 0) {
    const orgAccounts = (auth.value.availableAccounts || []).filter(a => a.status === 'ACTIVE');
    const hasOrgAccess = orgAccounts.length > 1;
    if (scopeMode === 'org' && hasOrgAccess) {
      resolvedAccounts = orgAccounts.map(a => a.id);
    } else if (hasOrgAccess) {
      const acctPick = await ctx.breakpoint({
        title: 'Confirm AWS account(s) to scan',
        breakpointId: 'aws-systems-discovery.account-pick',
        question: [
          `Current identity: ${auth.value.currentIdentity.arn} (account ${auth.value.currentIdentity.accountId})`,
          `Org member accounts visible:`,
          ...orgAccounts.map(a => `  - ${a.id} ${a.name || ''}`),
          ``,
          'Pick: just current account, scan ALL org member accounts (requires cross-account role), or cancel.',
          'NOTE: scanning multiple accounts requires `assumeRoleArn` to point at a role that exists in every target account.',
        ].join('\n'),
        options: ['Use current account only', 'Scan ALL org member accounts', 'Cancel'],
        expert: 'owner',
        tags: ['scope-gate', 'account-pick'],
      });
      if (!acctPick?.approved || acctPick.response === 'Cancel') return emptyResult;
      resolvedAccounts = acctPick.response === 'Scan ALL org member accounts'
        ? orgAccounts.map(a => a.id)
        : [auth.value.currentIdentity.accountId];
    } else {
      resolvedAccounts = [auth.value.currentIdentity.accountId];
    }
  }

  // ---- Region confirmation (CRITICAL — AWS bills per region) --------------
  const regionConfirm = await ctx.breakpoint({
    title: 'Confirm AWS regions to scan',
    breakpointId: 'aws-systems-discovery.region-pick',
    question: [
      `Regions requested: ${regions.join(', ')}`,
      ``,
      'AWS bills each region independently. A typo or omission here = blind spots in cost + exposure analysis.',
      'Confirm regions explicitly. To add/remove regions, hit Adjust and edit input.regions.',
    ].join('\n'),
    options: ['Confirm regions', 'Adjust'],
    expert: 'owner',
    tags: ['scope-gate', 'region-pick'],
  });
  if (!regionConfirm?.approved || regionConfirm.response === 'Adjust') return emptyResult;

  // ---- Final scope confirmation -------------------------------------------
  const scopeApproval = await ctx.breakpoint({
    title: 'Confirm AWS discovery scope',
    breakpointId: 'aws-systems-discovery.scope',
    question: [
      `Accounts: ${resolvedAccounts.join(', ')}`,
      `Regions: ${regions.join(', ')}`,
      `System unit: ${systemUnit}${systemUnit === 'tag' ? ` (tag: ${systemTagKey})` : ''}`,
      `EKS deep-dive: ${includeEksDeepDive}`,
      `Route53 records: ${includeRoute53Records}`,
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

  // ---- Discovery: per-region (parallel) + global (single) per account -----
  const allManifests = [];
  for (const accountId of resolvedAccounts) {
    const acctAssumeArn = (accountId !== auth.value.currentIdentity.accountId) ? assumeRoleArn : null;

    const regionalResults = await Promise.all(regions.map(region =>
      ctx.task(discoveryTask, {
        accountId,
        region,
        scope: 'regional',
        serviceCategories,
        includeEksDeepDive,
        credentialsArtifact,
        assumeRoleArn: acctAssumeArn,
      })
    ));
    const globalResult = await ctx.task(discoveryTask, {
      accountId,
      region: null,
      scope: 'global',
      serviceCategories,
      includeEksDeepDive: false,
      credentialsArtifact,
      assumeRoleArn: acctAssumeArn,
    });
    allManifests.push(...regionalResults.map(r => r?.value).filter(Boolean));
    if (globalResult?.value) allManifests.push(globalResult.value);
  }

  // ---- EKS deep-dive (per account x region, if enabled) -------------------
  const eksResults = [];
  if (includeEksDeepDive) {
    const eksTargets = allManifests.filter(m => m.scope === 'regional' && (m.headlineCounts?.eksClusters || 0) > 0);
    const eksTaskResults = await Promise.all(eksTargets.map(m =>
      ctx.task(eksDeepDiveTask, {
        accountId: m.accountId,
        region: m.region,
        manifest: m.manifest,
        credentialsArtifact,
      })
    ));
    eksResults.push(...eksTaskResults.map(r => r?.value).filter(Boolean));
  }

  // ---- Route53 records (one per account, against global manifest) ---------
  let r53RecordsArtifact = null;
  if (includeRoute53Records) {
    const r53Results = await Promise.all(allManifests
      .filter(m => m.scope === 'global')
      .map(m => ctx.task(r53RecordsTask, {
        accountId: m.accountId,
        manifest: m.manifest,
        credentialsArtifact,
      }))
    );
    // Keep first artifact path; composers can read multiple if needed (we
    // pass the array on the manifest dimension instead if multi-account).
    const firstWithRecords = r53Results.map(r => r?.value).find(v => v?.recordsArtifact);
    r53RecordsArtifact = firstWithRecords?.recordsArtifact || null;
  }

  // ---- Composition (parallel) ---------------------------------------------
  const [systems, eksReport, network, exposure, diagramsResult] = await Promise.all([
    ctx.task(systemReportComposerTask, { manifests: allManifests, outputDir, systemUnit, systemTagKey }),
    includeEksDeepDive
      ? ctx.task(eksUsageReportTask, { eksResults, outputDir })
      : Promise.resolve({ value: { clusters: 0 } }),
    ctx.task(networkAttributionTask, { manifests: allManifests, eksResults, outputDir }),
    ctx.task(exposureMapTask, { manifests: allManifests, r53RecordsArtifact, outputDir, probeExternalEndpoints }),
    diagrams !== 'none'
      ? ctx.task(diagramsTask, { manifests: allManifests, eksResults, outputDir })
      : Promise.resolve({ value: { diagramsWritten: 0 } }),
  ]);

  // ---- Index --------------------------------------------------------------
  const headlineCounts = allManifests.reduce((acc, m) => {
    for (const [k, v] of Object.entries(m.headlineCounts || {})) {
      acc[k] = (acc[k] || 0) + (v || 0);
    }
    return acc;
  }, {});
  const summary = {
    accounts: resolvedAccounts,
    regions,
    headlineCounts,
    systemsCount: systems?.value?.systemsCount || 0,
    eksClusters: eksResults.reduce((s, r) => s + (r.clusters?.length || 0), 0),
    loadBalancers: network?.value?.loadBalancers || 0,
    externalHostnames: exposure?.value?.externalHostnames || 0,
  };
  const idx = await ctx.task(indexTask, { outputDir, summary });

  // ---- Final review -------------------------------------------------------
  const approval = await ctx.breakpoint({
    title: 'Review AWS discovery output',
    breakpointId: 'aws-systems-discovery.final-review',
    question: `Discovery complete (${resolvedAccounts.length} account(s), ${regions.length} region(s)). Review files under ${outputDir}/.`,
    options: ['Approve', 'Request changes'],
    expert: 'owner',
    tags: ['final-review'],
  });

  return {
    success: approval?.approved === true,
    accounts: resolvedAccounts,
    regions,
    resources: headlineCounts.resources || 0,
    systems: systems?.value?.systemsCount || 0,
    eksClusters: summary.eksClusters,
    loadBalancers: network?.value?.loadBalancers || 0,
    externalHostnames: exposure?.value?.externalHostnames || 0,
    reportFiles: systems?.value?.reportFiles || [],
    indexFile: idx?.value?.indexFile ?? null,
  };
}

export default process;
