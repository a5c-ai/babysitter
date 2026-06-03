import type { CloudConfig, KradleHelmPlan } from "../types.js";

export function buildKradleHelmPlan(config: CloudConfig): KradleHelmPlan {
  const values: Record<string, unknown> = {
    image: {
      repository: config.image?.repository ?? "ghcr.io/a5c-ai/kradle/kradle-controller",
      tag: config.image?.tag ?? config.releaseTag ?? "latest",
      pullPolicy: config.image?.pullPolicy ?? "IfNotPresent",
    },
    api: { replicas: config.kradle.api.replicas, resources: config.kradle.api.resources ?? {} },
    controllers: { replicas: config.kradle.controllers.replicas, resources: config.kradle.controllers.resources ?? {} },
    web: { replicas: config.kradle.web.replicas, resources: config.kradle.web.resources ?? {} },
    webhookWorker: { replicas: config.kradle.webhookWorker.replicas, resources: config.kradle.webhookWorker.resources ?? {} },
    ingress: {
      enabled: config.ingress.hostnames.length > 0,
      className: config.ingress.ingressClassName ?? "nginx",
      hosts: config.ingress.hostnames.map(h => ({ host: h, paths: [{ path: "/", pathType: "Prefix" }] })),
      tls: config.ingress.tls
        ? config.ingress.hostnames.map(h => ({ hosts: [h], secretName: `kradle-${h.replace(/\./g, "-")}-tls` }))
        : [],
    },
    gitea: {
      enabled: config.kradle.gitea.enabled,
      admin: config.kradle.gitea.admin,
      persistence: config.kradle.gitea.persistence,
    },
    demo: config.kradle.demo,
    agents: config.kradle.agents,
    auth: {
      github: config.kradle.auth.github,
      sso: { enabled: config.kradle.auth.sso.enabled },
      delegatedIdentity: { enabled: config.kradle.auth.delegatedIdentity.enabled },
    },
    argocd: { enabled: config.kradle.argocd.enabled, namespace: config.kradle.argocd.namespace },
    storage: { className: config.storage.className ?? "standard" },
  };

  return {
    releaseName: "kradle",
    chartPath: "packages/kradle/charts",
    namespace: config.namespace,
    values,
    summary: [
      `helm upgrade --install kradle in ${config.namespace}`,
      `api: ${config.kradle.api.replicas} replicas`,
      `controllers: ${config.kradle.controllers.replicas} replicas`,
      `web: ${config.kradle.web.replicas} replicas`,
      `gitea: ${config.kradle.gitea.enabled ? "enabled" : "disabled"}`,
      `agents: ${config.kradle.agents.enabled ? "enabled" : "disabled"}`,
    ],
  };
}

function yamlValue(value: unknown, indent: number): string {
  const pad = "  ".repeat(indent);
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (typeof value === "string") return value.includes(":") || value.includes("#") ? `"${value}"` : value;
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return "\n" + value.map(item => {
      if (typeof item === "object" && item !== null) {
        const entries = Object.entries(item);
        const first = entries[0];
        const rest = entries.slice(1);
        let result = `${pad}- ${first[0]}: ${yamlValue(first[1], indent + 2)}`;
        for (const [k, v] of rest) {
          result += `\n${pad}  ${k}: ${yamlValue(v, indent + 2)}`;
        }
        return result;
      }
      return `${pad}- ${yamlValue(item, indent + 1)}`;
    }).join("\n");
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    return "\n" + entries.map(([k, v]) => `${pad}${k}: ${yamlValue(v, indent + 1)}`).join("\n");
  }
  return String(value);
}

export function renderHelmValuesYaml(plan: KradleHelmPlan): string {
  const entries = Object.entries(plan.values);
  return entries.map(([k, v]) => `${k}: ${yamlValue(v, 1)}`).join("\n") + "\n";
}
