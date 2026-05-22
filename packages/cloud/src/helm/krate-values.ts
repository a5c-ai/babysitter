import type { CloudConfig, KrateHelmPlan } from "../types.js";

export function buildKrateHelmPlan(config: CloudConfig): KrateHelmPlan {
  const values: Record<string, unknown> = {
    image: {
      repository: config.image?.repository ?? "ghcr.io/a5c-ai/krate/krate-controller",
      tag: config.image?.tag ?? config.releaseTag ?? "latest",
      pullPolicy: config.image?.pullPolicy ?? "IfNotPresent",
    },
    api: { replicas: config.krate.api.replicas, resources: config.krate.api.resources ?? {} },
    controllers: { replicas: config.krate.controllers.replicas, resources: config.krate.controllers.resources ?? {} },
    web: { replicas: config.krate.web.replicas, resources: config.krate.web.resources ?? {} },
    webhookWorker: { replicas: config.krate.webhookWorker.replicas, resources: config.krate.webhookWorker.resources ?? {} },
    ingress: {
      enabled: config.ingress.hostnames.length > 0,
      className: config.ingress.ingressClassName ?? "nginx",
      hosts: config.ingress.hostnames.map(h => ({ host: h, paths: [{ path: "/", pathType: "Prefix" }] })),
      tls: config.ingress.tls
        ? config.ingress.hostnames.map(h => ({ hosts: [h], secretName: `krate-${h.replace(/\./g, "-")}-tls` }))
        : [],
    },
    gitea: {
      enabled: config.krate.gitea.enabled,
      admin: config.krate.gitea.admin,
      persistence: config.krate.gitea.persistence,
    },
    demo: config.krate.demo,
    agents: config.krate.agents,
    auth: {
      github: config.krate.auth.github,
      sso: { enabled: config.krate.auth.sso.enabled },
      delegatedIdentity: { enabled: config.krate.auth.delegatedIdentity.enabled },
    },
    argocd: { enabled: config.krate.argocd.enabled, namespace: config.krate.argocd.namespace },
    storage: { className: config.storage.className ?? "standard" },
  };

  return {
    releaseName: "krate",
    chartPath: "packages/krate/charts",
    namespace: config.namespace,
    values,
    summary: [
      `helm upgrade --install krate in ${config.namespace}`,
      `api: ${config.krate.api.replicas} replicas`,
      `controllers: ${config.krate.controllers.replicas} replicas`,
      `web: ${config.krate.web.replicas} replicas`,
      `gitea: ${config.krate.gitea.enabled ? "enabled" : "disabled"}`,
      `agents: ${config.krate.agents.enabled ? "enabled" : "disabled"}`,
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

export function renderHelmValuesYaml(plan: KrateHelmPlan): string {
  const entries = Object.entries(plan.values);
  return entries.map(([k, v]) => `${k}: ${yamlValue(v, 1)}`).join("\n") + "\n";
}
