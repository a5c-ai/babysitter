export type DeploymentEnvironment = "minikube" | "staging" | "prod" | "custom";

export type TargetType = "minikube" | "existing" | "eks" | "aks" | "gke";

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

export interface ComponentToggleConfig {
  enabled: boolean;
  replicas?: number;
}

export interface BabysitterAgentComponentConfig extends ComponentToggleConfig {
  providers?: readonly ProviderConfig[];
  modelRouting?: readonly ModelRoutingConfig[];
}

export interface ComponentsConfig {
  kanban: ComponentToggleConfig;
  gateway: ComponentToggleConfig;
  babysitterAgent?: BabysitterAgentComponentConfig;
}

export interface AgentInstallConfig {
  install: boolean;
  targets: readonly HarnessTarget[];
  installBabysitterPlugins: boolean;
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
}

export interface ImageOverrides {
  kanban?: string;
  gateway?: string;
  babysitterAgent?: string;
}

export interface CloudConfig {
  environment: DeploymentEnvironment;
  namespace: string;
  releaseTag?: string;
  imageRegistry?: string;
  images?: ImageOverrides;
  target: TargetConfig;
  ingress: IngressConfig;
  auth: AuthConfig;
  components: ComponentsConfig;
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
  | "gemini-cli"
  | "opencode";

export interface KubernetesManifest {
  readonly apiVersion: string;
  readonly kind: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly [key: string]: unknown;
}

export interface ComponentImage {
  readonly image: string;
  readonly pullPolicy: "IfNotPresent" | "Always";
}

export interface ComponentPlan {
  readonly id: "kanban" | "gateway" | "babysitter-agent";
  readonly enabled: boolean;
  readonly image: ComponentImage;
  readonly replicas: number;
  readonly serviceName: string;
  readonly port: number;
  readonly internalUrl: string;
  readonly publicUrl?: string;
  readonly summary: readonly string[];
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
}

export interface AgentInstallStep {
  readonly target: HarnessTarget;
  readonly command: string;
  readonly pluginCommand?: string;
}

export interface AgentInstallPlan {
  readonly enabled: boolean;
  readonly steps: readonly AgentInstallStep[];
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
  readonly components: readonly ComponentPlan[];
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
  readonly agentInstalls?: readonly CommandExecution[];
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
