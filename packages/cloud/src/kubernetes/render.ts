import type { DeploymentPlan, KubernetesManifest, KubernetesRenderResult } from "../types.js";
import { renderHelmValuesYaml } from "../helm/krate-values.js";

function yamlScalar(value: unknown): string {
  if (typeof value === "string") {
    if (value.length === 0) return "\"\"";
    if (/^[A-Za-z0-9._/-]+$/.test(value)) return value;
    return JSON.stringify(value);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value === null) {
    return "null";
  }
  return JSON.stringify(value);
}

function renderYaml(value: unknown, indent = 0): string {
  const pad = " ".repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}[]`;
    return value.map((entry) => {
      if (typeof entry === "object" && entry !== null) {
        const nested = renderYaml(entry, indent + 2);
        const trimmed = nested.startsWith(" ".repeat(indent + 2))
          ? nested.slice(indent + 2)
          : nested;
        const [firstLine, ...rest] = trimmed.split("\n");
        return `${pad}- ${firstLine}${rest.length > 0 ? `\n${rest.map((line) => `${" ".repeat(indent + 2)}${line}`).join("\n")}` : ""}`;
      }
      return `${pad}- ${yamlScalar(entry)}`;
    }).join("\n");
  }
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, entry]) => entry !== undefined);
    if (entries.length === 0) return `${pad}{}`;
    return entries.map(([key, entry]) => {
      if (Array.isArray(entry)) {
        if (entry.length === 0) return `${pad}${key}: []`;
        return `${pad}${key}:\n${renderYaml(entry, indent + 2)}`;
      }
      if (typeof entry === "object" && entry !== null) {
        return `${pad}${key}:\n${renderYaml(entry, indent + 2)}`;
      }
      return `${pad}${key}: ${yamlScalar(entry)}`;
    }).join("\n");
  }
  return `${pad}${yamlScalar(value)}`;
}

export function serializeManifest(manifest: KubernetesManifest): string {
  return renderYaml(manifest);
}

export function renderKubernetes(plan: DeploymentPlan): KubernetesRenderResult {
  const helmValuesYaml = renderHelmValuesYaml(plan.helm);
  const manifestContent = plan.kubernetes.manifests.map((manifest) => serializeManifest(manifest)).join("\n---\n");
  const content = manifestContent
    ? `# Helm values for krate\n${helmValuesYaml}\n---\n# Additional manifests\n${manifestContent}`
    : `# Helm values for krate\n${helmValuesYaml}`;

  return {
    fileName: "manifests.yaml",
    manifests: plan.kubernetes.manifests,
    content,
    summary: plan.kubernetes.summary.summary,
  };
}
