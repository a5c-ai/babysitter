import type { AuthBootstrapResult, CloudConfig, ComponentPlan, KubernetesManifest } from "../types.js";

function resolveImage(config: CloudConfig, releaseTag: string): string {
  return config.images?.gateway ?? `${config.imageRegistry ?? "ghcr.io/a5c-ai/babysitter"}/agent-mux:${releaseTag}`;
}

export function buildGatewayPlan(config: CloudConfig, releaseTag: string, publicUrl: string | undefined): ComponentPlan {
  return {
    id: "gateway",
    enabled: config.components.gateway.enabled,
    image: {
      image: resolveImage(config, releaseTag),
      pullPolicy: "IfNotPresent",
    },
    replicas: config.components.gateway.replicas ?? 1,
    serviceName: "agent-mux-gateway",
    port: 7878,
    internalUrl: "http://agent-mux-gateway:7878",
    ...(publicUrl ? { publicUrl } : {}),
    summary: [
      "agent-mux gateway exposed through service `agent-mux-gateway`",
      "runs with SQLite token store and persistent event log volume",
    ],
  };
}

export function buildGatewayManifests(config: CloudConfig, plan: ComponentPlan, auth: AuthBootstrapResult): readonly KubernetesManifest[] {
  if (!plan.enabled) {
    return [];
  }

  return [
    {
      apiVersion: "v1",
      kind: "PersistentVolumeClaim",
      metadata: {
        name: `${plan.serviceName}-state`,
        namespace: config.namespace,
      },
      spec: {
        accessModes: ["ReadWriteOnce"],
        ...(config.storage.className ? { storageClassName: config.storage.className } : {}),
        resources: {
          requests: {
            storage: config.storage.gatewayStateSize ?? "5Gi",
          },
        },
      },
    },
    {
      apiVersion: "apps/v1",
      kind: "Deployment",
      metadata: {
        name: plan.serviceName,
        namespace: config.namespace,
        labels: {
          "app.kubernetes.io/name": plan.serviceName,
          "app.kubernetes.io/component": "gateway",
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
              "app.kubernetes.io/component": "gateway",
            },
          },
          spec: {
            containers: [
              {
                name: "gateway",
                image: plan.image.image,
                imagePullPolicy: plan.image.pullPolicy,
                command: ["amux"],
                args: [
                  "gateway",
                  "serve",
                  "--host",
                  "0.0.0.0",
                  "--port",
                  String(plan.port),
                  "--no-webui",
                ],
                ports: [{ containerPort: plan.port, name: "http" }],
                env: [
                  { name: "AMUX_GATEWAY_TOKEN_DB_PATH", value: "/var/lib/amux-gateway/tokens.db" },
                  { name: "AMUX_GATEWAY_EVENT_LOG_DIR", value: "/var/lib/amux-gateway/events" },
                  { name: "CLOUD_BOOTSTRAP_AUTH_SECRET", value: auth.secretName },
                  { name: "CLOUD_BOOTSTRAP_ADMIN_USERNAME", value: auth.username },
                  { name: "CLOUD_BOOTSTRAP_AUTH_MODE", value: config.auth.mode },
                ],
                volumeMounts: [
                  {
                    name: "gateway-state",
                    mountPath: "/var/lib/amux-gateway",
                  },
                ],
              },
            ],
            volumes: [
              {
                name: "gateway-state",
                persistentVolumeClaim: {
                  claimName: `${plan.serviceName}-state`,
                },
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
            name: "http",
            port: plan.port,
            targetPort: plan.port,
          },
        ],
      },
    },
  ];
}

