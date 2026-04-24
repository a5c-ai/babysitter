import type { CloudConfig, ComponentPlan, DeploymentPlan, KubernetesManifest } from "../types.js";
import { buildGatewayManifests, buildGatewayPlan } from "../adapters/agent-mux-gateway.js";
import { buildBabysitterAgentManifests, buildBabysitterAgentPlan } from "../adapters/babysitter-agent.js";
import { buildKanbanManifests, buildKanbanPlan } from "../adapters/kanban.js";
import { bootstrapAuth } from "./auth.js";
import { defaultReleaseTagForEnvironment } from "./environments.js";
import { buildAgentInstallPlan } from "./agents.js";
import { configureProviders } from "./providers.js";

function kanbanPublicUrl(config: CloudConfig): string | undefined {
  const host = config.ingress.hostnames[0];
  if (!host) return undefined;
  return `${config.ingress.tls ? "https" : "http"}://${host}`;
}

function gatewayPublicUrl(config: CloudConfig): string | undefined {
  const explicit = config.ingress.hostnames[1];
  const primary = config.ingress.hostnames[0];
  const host = explicit ?? (primary ? `gateway.${primary}` : undefined);
  if (!host) return undefined;
  return `${config.ingress.tls ? "https" : "http"}://${host}`;
}

function namespaceManifest(namespace: string): KubernetesManifest {
  return {
    apiVersion: "v1",
    kind: "Namespace",
    metadata: {
      name: namespace,
    },
  };
}

function ingressManifest(config: CloudConfig, serviceName: string, port: number, host: string): KubernetesManifest {
  return {
    apiVersion: "networking.k8s.io/v1",
    kind: "Ingress",
    metadata: {
      name: `${serviceName}-ingress`,
      namespace: config.namespace,
      ...(config.ingress.ingressClassName ? {
        annotations: {
          "kubernetes.io/ingress.class": config.ingress.ingressClassName,
        },
      } : {}),
    },
    spec: {
      ...(config.ingress.tls ? {
        tls: [
          {
            hosts: [host],
            secretName: `${serviceName}-tls`,
          },
        ],
      } : {}),
      rules: [
        {
          host,
          http: {
            paths: [
              {
                path: "/",
                pathType: "Prefix",
                backend: {
                  service: {
                    name: serviceName,
                    port: { number: port },
                  },
                },
              },
            ],
          },
        },
      ],
    },
  };
}

export function buildDeploymentPlan(config: CloudConfig): DeploymentPlan {
  const releaseTag = config.releaseTag ?? defaultReleaseTagForEnvironment(config.environment);
  const auth = bootstrapAuth(config);
  const providers = configureProviders(config);
  const gateway = buildGatewayPlan(config, releaseTag, gatewayPublicUrl(config));
  const kanban = buildKanbanPlan(config, releaseTag, gateway.serviceName, kanbanPublicUrl(config));
  const babysitterAgent = buildBabysitterAgentPlan(config, releaseTag);

  const manifests: KubernetesManifest[] = [
    namespaceManifest(config.namespace),
    ...auth.manifests,
    ...providers.manifests,
    ...buildGatewayManifests(config, gateway, auth),
    ...buildKanbanManifests(config, kanban, gateway.internalUrl),
    ...buildBabysitterAgentManifests(config, babysitterAgent, gateway.internalUrl, providers),
  ];

  const ingressHosts = config.ingress.hostnames;
  if (kanban.enabled && ingressHosts[0]) {
    manifests.push(ingressManifest(config, kanban.serviceName, kanban.port, ingressHosts[0]));
  }
  if (gateway.enabled) {
    const gatewayHost = ingressHosts[1] ?? (ingressHosts[0] ? `gateway.${ingressHosts[0]}` : undefined);
    if (gatewayHost) {
      manifests.push(ingressManifest(config, gateway.serviceName, gateway.port, gatewayHost));
    }
  }

  const components: ComponentPlan[] = [gateway, kanban];
  if (babysitterAgent.enabled) {
    components.push(babysitterAgent);
  }

  return {
    config,
    namespace: config.namespace,
    releaseTag,
    components,
    auth,
    providers,
    kubernetes: {
      manifests,
      summary: {
        namespace: config.namespace,
        manifestCount: manifests.length,
        summary: [
          `namespace ${config.namespace}`,
          `${components.filter((component) => component.enabled).length} enabled components`,
          ...(config.ingress.hostnames.length > 0 ? [`${config.ingress.hostnames.length} ingress hostnames`] : []),
        ],
      },
    },
    terraform: {
      provider: config.target.type,
      clusterName: config.target.type === "existing"
        ? config.target.kubeContext
        : config.target.type === "minikube"
        ? (config.target.profile ?? "babysitter")
        : config.target.clusterName,
      summary: [
        `provider ${config.target.type}`,
        config.target.type === "existing"
          ? `reuse kube context ${config.target.kubeContext}`
          : "cluster creation and handoff managed via Terraform",
      ],
    },
    ...(buildAgentInstallPlan(config) ? { agents: buildAgentInstallPlan(config) } : {}),
    statusQueries: [
      `kubectl get deploy,svc,ingress,pvc -n ${config.namespace}`,
      ...(config.target.type === "existing" ? [`kubectl config use-context ${config.target.kubeContext}`] : []),
    ],
  };
}

