import type { CloudConfig, DeploymentEnvironment } from "../types.js";

const BASE_CONFIG: CloudConfig = {
  environment: "custom",
  namespace: "babysitter",
  releaseTag: "latest",
  imageRegistry: "ghcr.io/a5c-ai/krate",
  target: {
    type: "existing",
    kubeContext: "default",
    namespace: "babysitter",
  },
  ingress: {
    hostnames: ["krate.localdev.me"],
    tls: false,
    ingressClassName: "nginx",
  },
  auth: {
    mode: "local-dev",
    adminUsername: "admin",
    defaultAdminPassword: "admin",
  },
  krate: {
    api: { replicas: 1 },
    controllers: { replicas: 1 },
    web: { replicas: 1 },
    webhookWorker: { replicas: 1 },
    gitea: {
      enabled: true,
      persistence: { size: "10Gi" },
      admin: { username: "gitea_admin", password: "admin" },
    },
    agents: { enabled: false, agentMux: { enabled: false, gateway: "" } },
    demo: { enabled: false, postgres: { mode: "embedded" }, objectStore: { mode: "minio" } },
    argocd: { enabled: false, namespace: "argocd" },
    auth: {
      github: { enabled: false, clientId: "", clientSecret: "" },
      sso: { enabled: false },
      delegatedIdentity: { enabled: false },
    },
  },
  agents: {
    install: false,
    targets: [],
    installBabysitterPlugins: true,
    scope: "workspace",
  },
  storage: {
    className: "standard",
    gatewayStateSize: "5Gi",
  },
  execution: {
    stateDir: ".cloud",
    autoApplyTerraform: true,
    autoApplyKubernetes: true,
    installAgentsOnApply: false,
    configureProvidersOnApply: false,
    providerConfigScope: "project",
  },
};

function cloneConfig<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function defaultReleaseTagForEnvironment(environment: DeploymentEnvironment): string {
  switch (environment) {
    case "staging":
      return "staging";
    case "prod":
      return "production";
    case "minikube":
      return "local";
    case "custom":
    default:
      return "latest";
  }
}

export function environmentPreset(environment: DeploymentEnvironment): CloudConfig {
  const preset = cloneConfig(BASE_CONFIG);
  preset.environment = environment;
  preset.releaseTag = defaultReleaseTagForEnvironment(environment);

  switch (environment) {
    case "minikube":
      preset.target = { type: "minikube", profile: "babysitter" };
      preset.namespace = "babysitter-local";
      preset.ingress = {
        hostnames: ["krate.localdev.me"],
        tls: false,
        ingressClassName: "nginx",
      };
      preset.auth = {
        mode: "local-dev",
        adminUsername: "admin",
        defaultAdminPassword: "admin",
      };
      preset.storage = {
        className: "standard",
        gatewayStateSize: "2Gi",
      };
      preset.krate = {
        ...preset.krate,
        api: { replicas: 1 },
        controllers: { replicas: 1 },
        web: { replicas: 1 },
        webhookWorker: { replicas: 1 },
        gitea: { ...preset.krate.gitea, enabled: true },
        demo: { ...preset.krate.demo, enabled: true },
        agents: { ...preset.krate.agents, enabled: false },
      };
      break;
    case "staging":
      preset.target = { type: "existing", kubeContext: "staging", namespace: "babysitter-staging" };
      preset.namespace = "babysitter-staging";
      preset.ingress = {
        hostnames: ["krate.staging.a5c.ai"],
        tls: true,
        ingressClassName: "nginx",
      };
      preset.auth = {
        mode: "bootstrap-admin",
        adminUsername: "admin",
      };
      preset.krate = {
        ...preset.krate,
        api: { replicas: 2 },
        controllers: { replicas: 2 },
        web: { replicas: 2 },
        webhookWorker: { replicas: 2 },
        gitea: { ...preset.krate.gitea, enabled: true },
        demo: { ...preset.krate.demo, enabled: false },
        agents: { ...preset.krate.agents, enabled: true },
      };
      break;
    case "prod":
      preset.target = { type: "existing", kubeContext: "prod", namespace: "babysitter-prod" };
      preset.namespace = "babysitter-prod";
      preset.ingress = {
        hostnames: ["krate.a5c.ai"],
        tls: true,
        ingressClassName: "nginx",
      };
      preset.auth = {
        mode: "bootstrap-admin",
        adminUsername: "admin",
      };
      preset.krate = {
        ...preset.krate,
        api: { replicas: 3 },
        controllers: { replicas: 3 },
        web: { replicas: 3 },
        webhookWorker: { replicas: 3 },
        gitea: { ...preset.krate.gitea, enabled: true },
        demo: { ...preset.krate.demo, enabled: false },
        agents: { ...preset.krate.agents, enabled: true },
      };
      break;
    case "custom":
    default:
      break;
  }

  return preset;
}
