export type DeploymentEnvironment = "minikube" | "staging" | "prod" | "custom";

export type TargetType = "minikube" | "existing" | "eks" | "aks" | "gke";
export type AutomationScope = "global" | "workspace";
export type ProviderAutomationScope = "global" | "project";

export interface ProviderCredentialConfig {
  envVar: string;
  value?: string;
  secretRef?: string;
  required?: boolean;
}

export interface ProviderConfig {
  id: string;
  credentials?: readonly ProviderCredentialConfig[];
  defaultModel?: string;
  models?: readonly string[];
  extraEnv?: Readonly<Record<string, string>>;
}

export interface ModelRoutingConfig {
  agent?: string;
  provider: string;
  model: string;
}

export interface MinikubeTargetConfig {
  type: "minikube";
  profile?: string;
}

export interface ExistingClusterTargetConfig {
  type: "existing";
  kubeContext: string;
  namespace?: string;
}

export interface EksTargetConfig {
  type: "eks";
  region: string;
  clusterName: string;
}

export interface AksTargetConfig {
  type: "aks";
  subscriptionId: string;
  resourceGroup: string;
  clusterName: string;
}

export interface GkeTargetConfig {
  type: "gke";
  projectId: string;
  region: string;
  clusterName: string;
}

export type TargetConfig =
  | MinikubeTargetConfig
  | ExistingClusterTargetConfig
  | EksTargetConfig
  | AksTargetConfig
  | GkeTargetConfig;

export interface IngressConfig {
  hostnames: readonly string[];
  tls?: boolean;
  ingressClassName?: string;
}

export interface AuthConfig {
  mode: "local-dev" | "bootstrap-admin";
  adminUsername: string;
  adminPasswordSecretRef?: string;
  defaultAdminPassword?: string;
}

export interface KrateComponentConfig {
  replicas: number;
  resources?: Record<string, unknown>;
}

export interface KrateGiteaConfig {
  enabled: boolean;
  persistence: { size: string; storageClassName?: string };
  admin: { username: string; password: string };
}

export interface KrateAgentsConfig {
  enabled: boolean;
  agentMux: { enabled: boolean; gateway: string };
}

export interface KrateDemoConfig {
  enabled: boolean;
  postgres: { mode: string };
  objectStore: { mode: string };
}

export interface KrateAuthConfig {
  github: { enabled: boolean; clientId: string; clientSecret: string };
  sso: { enabled: boolean };
  delegatedIdentity: { enabled: boolean };
}

export interface KrateConfig {
  api: KrateComponentConfig;
  controllers: KrateComponentConfig;
  web: KrateComponentConfig;
  webhookWorker: KrateComponentConfig;
  gitea: KrateGiteaConfig;
  agents: KrateAgentsConfig;
  demo: KrateDemoConfig;
  argocd: { enabled: boolean; namespace: string };
  auth: KrateAuthConfig;
}

export interface KrateImageConfig {
  repository: string;
  tag: string;
  pullPolicy: "IfNotPresent" | "Always";
}

export interface KrateHelmPlan {
  readonly releaseName: string;
  readonly chartPath: string;
  readonly namespace: string;
  readonly values: Readonly<Record<string, unknown>>;
  readonly summary: readonly string[];
}

export interface AgentInstallConfig {
  install: boolean;
  targets: readonly HarnessTarget[];
  installBabysitterPlugins: boolean;
  scope?: AutomationScope;
}

export interface StorageConfig {
  className?: string;
  gatewayStateSize?: string;
}

export interface ExecutionConfig {
  stateDir?: string;
  autoApplyTerraform?: boolean;
  autoApplyKubernetes?: boolean;
  installAgentsOnApply?: boolean;
  configureProvidersOnApply?: boolean;
  providerConfigScope?: ProviderAutomationScope;
}

export interface CloudConfig {
  environment: DeploymentEnvironment;
  namespace: string;
  releaseTag?: string;
  imageRegistry?: string;
  image?: KrateImageConfig;
  target: TargetConfig;
  ingress: IngressConfig;
  auth: AuthConfig;
  krate: KrateConfig;
  agents?: AgentInstallConfig;
  storage: StorageConfig;
  execution?: ExecutionConfig;
}

export interface ValidationMessage {
  readonly path: string;
  readonly message: string;
}

export interface ValidationResult {
  readonly ok: boolean;
  readonly errors: readonly ValidationMessage[];
  readonly warnings: readonly ValidationMessage[];
}

export type HarnessTarget =
  | "claude-code"
  | "codex"
  | "cursor"
  | "copilot"
  | "github-copilot"
  | "gemini-cli"
  | "openclaw"
  | "oh-my-pi"
  | "opencode"
  | "pi";

export type CanonicalHarnessTarget = Exclude<HarnessTarget, "copilot">;

export interface KubernetesManifest {
  readonly apiVersion: string;
  readonly kind: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly [key: string]: unknown;
}

export interface AuthBootstrapResult {
  readonly secretName: string;
  readonly username: string;
  readonly password: string;
  readonly tokenSeed: string;
  readonly manifests: readonly KubernetesManifest[];
  readonly env: Readonly<Record<string, string>>;
}

export interface ProviderConfigurationResult {
  readonly manifests: readonly KubernetesManifest[];
  readonly env: Readonly<Record<string, string>>;
  readonly summary: readonly string[];
  readonly automation: ProviderAutomationPlan;
}

export interface ProviderCredentialBinding {
  readonly providerId: string;
  readonly envVar: string;
  readonly value?: string;
  readonly secretRef?: string;
  readonly required: boolean;
}

export interface ProviderAutomationPlan {
  readonly scope: "project";
  readonly filePath: string;
  readonly providersFile: AgentMuxProvidersFile;
  readonly modelRouting: readonly ModelRoutingConfig[];
  readonly credentials: readonly ProviderCredentialBinding[];
}

export interface ProviderConfigurationApplyResult {
  readonly success: boolean;
  readonly scope: ProviderAutomationScope;
  readonly filePath: string;
  readonly providersFile: AgentMuxProvidersFile;
  readonly modelRouting: readonly ModelRoutingConfig[];
  readonly credentials: readonly ProviderCredentialBinding[];
  readonly summary: readonly string[];
}

export interface ProviderProfileAuth {
  readonly type?: string;
  readonly apiKey?: string;
  readonly token?: string;
  readonly command?: string;
  readonly awsProfile?: string;
  readonly awsRoleArn?: string;
  readonly awsSessionToken?: string;
  readonly gcpCredentialsFile?: string;
  readonly azureTenantId?: string;
  readonly azureClientId?: string;
  readonly azureClientSecret?: string;
}

export interface ProviderProfileEntry {
  readonly provider?: string;
  readonly model?: string;
  readonly transport?: string;
  readonly auth?: ProviderProfileAuth;
  readonly params?: Readonly<Record<string, unknown>>;
}

export interface AgentMuxProvidersFile {
  readonly version: number;
  readonly defaults?: {
    readonly provider?: string;
    readonly model?: string;
  };
  readonly profiles: Readonly<Record<string, ProviderProfileEntry>>;
}

export interface HarnessInstallOperationResult {
  readonly harness: string;
  readonly dryRun?: boolean;
  readonly success?: boolean;
  readonly status?: "planned" | "installed" | "skipped" | "unsupported" | "failed";
  readonly installer?: string;
  readonly scope?: AutomationScope;
  readonly warning?: string;
  readonly summary?: string;
  readonly command?: string;
  readonly output?: string;
  readonly location?: string;
  readonly exitCode?: number;
  readonly error?: string;
}

export interface SupportedHarnessInstallTarget {
  readonly target: CanonicalHarnessTarget;
  readonly aliases?: readonly HarnessTarget[];
  readonly harnessInstaller: "agent-mux";
  readonly pluginInstallerPackage?: string;
  readonly pluginScopes: readonly AutomationScope[];
}

export interface AgentInstallStep {
  readonly requestedTarget: HarnessTarget;
  readonly target: CanonicalHarnessTarget;
  readonly harnessInstaller: "agent-mux";
  readonly pluginInstall?: {
    readonly installerPackage: string;
    readonly scope: AutomationScope;
  };
}

export interface AgentInstallPlan {
  readonly enabled: boolean;
  readonly scope: AutomationScope;
  readonly supportedTargets: readonly SupportedHarnessInstallTarget[];
  readonly steps: readonly AgentInstallStep[];
  readonly summary: readonly string[];
}

export interface AgentInstallStepResult {
  readonly requestedTarget: HarnessTarget;
  readonly target: CanonicalHarnessTarget;
  readonly harness: HarnessInstallOperationResult;
  readonly plugin?: HarnessInstallOperationResult;
  readonly success: boolean;
}

export interface AgentInstallResult {
  readonly executed: boolean;
  readonly success: boolean;
  readonly scope: AutomationScope;
  readonly steps: readonly AgentInstallStepResult[];
  readonly summary: readonly string[];
}

export interface TerraformPlanSummary {
  readonly provider: TargetType;
  readonly clusterName: string;
  readonly summary: readonly string[];
}

export interface KubernetesPlanSummary {
  readonly namespace: string;
  readonly manifestCount: number;
  readonly summary: readonly string[];
}

export interface DeploymentPlan {
  readonly config: CloudConfig;
  readonly namespace: string;
  readonly releaseTag: string;
  readonly helm: KrateHelmPlan;
  readonly auth: AuthBootstrapResult;
  readonly providers: ProviderConfigurationResult;
  readonly kubernetes: {
    readonly manifests: readonly KubernetesManifest[];
    readonly summary: KubernetesPlanSummary;
  };
  readonly terraform: TerraformPlanSummary;
  readonly agents?: AgentInstallPlan;
  readonly statusQueries: readonly string[];
}

export interface RenderedFile {
  readonly path: string;
  readonly content: string;
}

export interface TerraformRenderResult {
  readonly directoryName: string;
  readonly files: readonly RenderedFile[];
  readonly summary: readonly string[];
}

export interface KubernetesRenderResult {
  readonly fileName: string;
  readonly manifests: readonly KubernetesManifest[];
  readonly content: string;
  readonly summary: readonly string[];
}

export interface CommandExecution {
  readonly command: string;
  readonly args: readonly string[];
  readonly cwd?: string;
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export interface InstallOptions {
  readonly dryRun?: boolean;
  readonly renderOnly?: boolean;
  readonly workingDirectory?: string;
}

export interface InstallResult {
  readonly plan: DeploymentPlan;
  readonly terraform: TerraformRenderResult;
  readonly kubernetes: KubernetesRenderResult;
  readonly terraformApply?: readonly CommandExecution[];
  readonly kubernetesApply?: readonly CommandExecution[];
  readonly providerConfiguration?: ProviderConfigurationApplyResult;
  readonly agentInstalls?: AgentInstallResult;
  readonly status?: EnvironmentStatus;
}

export interface StatusResource {
  readonly kind: string;
  readonly name: string;
  readonly namespace: string;
  readonly ready?: string;
  readonly status?: string;
}

export interface EnvironmentStatus {
  readonly namespace: string;
  readonly resources: readonly StatusResource[];
  readonly commands: readonly string[];
}

export interface LoadCloudConfigInput {
  readonly configPath?: string;
  readonly environment?: DeploymentEnvironment;
  readonly overrides?: Partial<CloudConfig>;
  readonly set?: readonly string[];
  readonly env?: Readonly<NodeJS.ProcessEnv>;
}
