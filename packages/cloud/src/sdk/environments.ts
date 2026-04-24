import type { CloudConfig, DeploymentEnvironment } from "../types.js";

const BASE_CONFIG: CloudConfig = {
  environment: "custom",
  namespace: "babysitter",
  releaseTag: "latest",
  imageRegistry: "ghcr.io/a5c-ai/babysitter",
  target: {
    type: "existing",
    kubeContext: "default",
    namespace: "babysitter",
  },
  ingress: {
    hostnames: ["kanban.localdev.me", "gateway.localdev.me"],
    tls: false,
    ingressClassName: "nginx",
  },
  auth: {
    mode: "local-dev",
    adminUsername: "admin",
    defaultAdminPassword: "admin",
  },
  components: {
    kanban: { enabled: true, replicas: 1 },
    gateway: { enabled: true, replicas: 1 },
    babysitterAgent: { enabled: false, replicas: 1, providers: [], modelRouting: [] },
  },
  agents: {
    install: false,
    targets: [],
    installBabysitterPlugins: true,
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
        hostnames: ["kanban.localdev.me", "gateway.localdev.me"],
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
      break;
    case "staging":
      preset.target = { type: "existing", kubeContext: "staging", namespace: "babysitter-staging" };
      preset.namespace = "babysitter-staging";
      preset.ingress = {
        hostnames: ["kanban.staging.a5c.ai", "gateway.staging.a5c.ai"],
        tls: true,
        ingressClassName: "nginx",
      };
      preset.auth = {
        mode: "bootstrap-admin",
        adminUsername: "admin",
      };
      preset.components = {
        ...preset.components,
        kanban: { enabled: true, replicas: 2 },
        gateway: { enabled: true, replicas: 2 },
      };
      break;
    case "prod":
      preset.target = { type: "existing", kubeContext: "prod", namespace: "babysitter-prod" };
      preset.namespace = "babysitter-prod";
      preset.ingress = {
        hostnames: ["kanban.a5c.ai", "gateway.a5c.ai"],
        tls: true,
        ingressClassName: "nginx",
      };
      preset.auth = {
        mode: "bootstrap-admin",
        adminUsername: "admin",
      };
      preset.components = {
        ...preset.components,
        kanban: { enabled: true, replicas: 3 },
        gateway: { enabled: true, replicas: 3 },
      };
      break;
    case "custom":
    default:
      break;
  }

  return preset;
}

