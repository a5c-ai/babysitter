import type {
  CloudConfig,
  ComponentPlan,
  KubernetesManifest,
  ProviderConfigurationResult,
} from "../types.js";

function resolveImage(config: CloudConfig, releaseTag: string): string {
  return config.images?.babysitterAgent ?? `${config.imageRegistry ?? "ghcr.io/a5c-ai/babysitter"}/babysitter-agent:${releaseTag}`;
}

export function buildBabysitterAgentPlan(config: CloudConfig, releaseTag: string): ComponentPlan {
  return {
    id: "babysitter-agent",
    enabled: config.components.babysitterAgent?.enabled ?? false,
    image: {
      image: resolveImage(config, releaseTag),
      pullPolicy: "IfNotPresent",
    },
    replicas: config.components.babysitterAgent?.replicas ?? 1,
    serviceName: "babysitter-agent",
    port: 7788,
    internalUrl: "http://babysitter-agent:7788",
    summary: [
      "optional babysitter-agent service",
      "configured for agent-mux Kubernetes mode",
    ],
  };
}

export function buildBabysitterAgentManifests(
  config: CloudConfig,
  plan: ComponentPlan,
  gatewayInternalUrl: string,
  providers: ProviderConfigurationResult,
): readonly KubernetesManifest[] {
  if (!plan.enabled) {
    return [];
  }

  return [
    {
      apiVersion: "apps/v1",
      kind: "Deployment",
      metadata: {
        name: plan.serviceName,
        namespace: config.namespace,
        labels: {
          "app.kubernetes.io/name": plan.serviceName,
          "app.kubernetes.io/component": "agent-runtime",
        },
      },
      spec: {
        replicas: plan.replicas,
        selector: {
          matchLabels: {
            "app.kubernetes.io/name": plan.serviceName,
          },
        },
        template: {
          metadata: {
            labels: {
              "app.kubernetes.io/name": plan.serviceName,
              "app.kubernetes.io/component": "agent-runtime",
            },
          },
          spec: {
            containers: [
              {
                name: "babysitter-agent",
                image: plan.image.image,
                imagePullPolicy: plan.image.pullPolicy,
                command: ["babysitter-agent"],
                args: ["start-server", "--transport", "websocket", "--port", String(plan.port)],
                ports: [{ containerPort: plan.port, name: "ws" }],
                env: [
                  { name: "BABYSITTER_AGENT_GATEWAY_URL", value: gatewayInternalUrl },
                  { name: "BABYSITTER_AGENT_AMUX_INVOCATION_MODE", value: "k8s" },
                  ...Object.entries(providers.env).map(([name, value]) => ({ name, value })),
                ],
              },
            ],
          },
        },
      },
    },
    {
      apiVersion: "v1",
      kind: "Service",
      metadata: {
        name: plan.serviceName,
        namespace: config.namespace,
      },
      spec: {
        selector: {
          "app.kubernetes.io/name": plan.serviceName,
        },
        ports: [
          {
            name: "ws",
            port: plan.port,
            targetPort: plan.port,
          },
        ],
      },
    },
  ];
}
