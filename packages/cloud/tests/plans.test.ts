import { describe, expect, it } from "vitest";

import { buildAgentInstallPlan, buildDeploymentPlan, buildKrateHelmPlan, configureProviders, environmentPreset, renderHelmValuesYaml, renderKubernetes, renderTerraform } from "../src/index.js";

describe("buildKrateHelmPlan", () => {
  it("produces correct replica counts from config", () => {
    const config = environmentPreset("minikube");
    const plan = buildKrateHelmPlan(config);
    const values = plan.values as Record<string, Record<string, unknown>>;
    expect(values.api.replicas).toBe(1);
    expect(values.controllers.replicas).toBe(1);
    expect(values.web.replicas).toBe(1);
    expect(values.webhookWorker.replicas).toBe(1);
  });

  it("uses staging replicas (2) for staging preset", () => {
    const config = environmentPreset("staging");
    const plan = buildKrateHelmPlan(config);
    const values = plan.values as Record<string, Record<string, unknown>>;
    expect(values.api.replicas).toBe(2);
    expect(values.controllers.replicas).toBe(2);
    expect(values.web.replicas).toBe(2);
    expect(values.webhookWorker.replicas).toBe(2);
  });

  it("uses prod replicas (3) for prod preset", () => {
    const config = environmentPreset("prod");
    const plan = buildKrateHelmPlan(config);
    const values = plan.values as Record<string, Record<string, unknown>>;
    expect(values.api.replicas).toBe(3);
    expect(values.controllers.replicas).toBe(3);
    expect(values.web.replicas).toBe(3);
    expect(values.webhookWorker.replicas).toBe(3);
  });

  it("maps ingress hostnames to helm host entries", () => {
    const config = environmentPreset("minikube");
    const plan = buildKrateHelmPlan(config);
    const ingress = plan.values.ingress as Record<string, unknown>;
    expect(ingress.enabled).toBe(true);
    expect(ingress.className).toBe("nginx");
    const hosts = ingress.hosts as Array<{ host: string; paths: Array<{ path: string; pathType: string }> }>;
    expect(hosts).toHaveLength(1);
    expect(hosts[0].host).toBe("krate.localdev.me");
    expect(hosts[0].paths).toEqual([{ path: "/", pathType: "Prefix" }]);
  });

  it("maps multiple ingress hostnames correctly", () => {
    const config = environmentPreset("custom");
    config.ingress = { hostnames: ["api.example.com", "web.example.com"], tls: true, ingressClassName: "traefik" };
    const plan = buildKrateHelmPlan(config);
    const ingress = plan.values.ingress as Record<string, unknown>;
    expect(ingress.enabled).toBe(true);
    expect(ingress.className).toBe("traefik");
    const hosts = ingress.hosts as Array<{ host: string }>;
    expect(hosts).toHaveLength(2);
    expect(hosts[0].host).toBe("api.example.com");
    expect(hosts[1].host).toBe("web.example.com");
  });

  it("generates TLS secret names from hostnames when TLS is enabled", () => {
    const config = environmentPreset("staging");
    const plan = buildKrateHelmPlan(config);
    const ingress = plan.values.ingress as Record<string, unknown>;
    const tls = ingress.tls as Array<{ hosts: string[]; secretName: string }>;
    expect(tls).toHaveLength(1);
    expect(tls[0].hosts).toEqual(["krate.staging.a5c.ai"]);
    expect(tls[0].secretName).toBe("krate-krate-staging-a5c-ai-tls");
  });

  it("produces empty TLS array when TLS is disabled", () => {
    const config = environmentPreset("minikube");
    const plan = buildKrateHelmPlan(config);
    const ingress = plan.values.ingress as Record<string, unknown>;
    expect(ingress.tls).toEqual([]);
  });

  it("disables ingress when no hostnames are configured", () => {
    const config = environmentPreset("custom");
    config.ingress = { hostnames: [] };
    const plan = buildKrateHelmPlan(config);
    const ingress = plan.values.ingress as Record<string, unknown>;
    expect(ingress.enabled).toBe(false);
    expect(ingress.hosts).toEqual([]);
  });

  it("includes gitea config from krate config", () => {
    const config = environmentPreset("minikube");
    const plan = buildKrateHelmPlan(config);
    const gitea = plan.values.gitea as Record<string, unknown>;
    expect(gitea.enabled).toBe(true);
    expect(gitea.admin).toEqual({ username: "gitea_admin", password: "admin" });
    expect(gitea.persistence).toEqual({ size: "10Gi" });
  });

  it("includes agents config", () => {
    const config = environmentPreset("staging");
    const plan = buildKrateHelmPlan(config);
    const agents = plan.values.agents as Record<string, unknown>;
    expect(agents.enabled).toBe(true);
  });

  it("includes demo config", () => {
    const config = environmentPreset("minikube");
    const plan = buildKrateHelmPlan(config);
    const demo = plan.values.demo as Record<string, unknown>;
    expect(demo.enabled).toBe(true);
  });

  it("includes argocd config", () => {
    const config = environmentPreset("minikube");
    const plan = buildKrateHelmPlan(config);
    const argocd = plan.values.argocd as Record<string, unknown>;
    expect(argocd.enabled).toBe(false);
    expect(argocd.namespace).toBe("argocd");
  });

  it("includes auth config", () => {
    const config = environmentPreset("minikube");
    const plan = buildKrateHelmPlan(config);
    const auth = plan.values.auth as Record<string, unknown>;
    expect(auth.github).toEqual({ enabled: false, clientId: "", clientSecret: "" });
    expect(auth.sso).toEqual({ enabled: false });
    expect(auth.delegatedIdentity).toEqual({ enabled: false });
  });

  it("uses custom image config when provided", () => {
    const config = environmentPreset("minikube");
    config.image = { repository: "my-registry.io/krate", tag: "v2.0.0", pullPolicy: "Always" };
    const plan = buildKrateHelmPlan(config);
    const image = plan.values.image as Record<string, unknown>;
    expect(image.repository).toBe("my-registry.io/krate");
    expect(image.tag).toBe("v2.0.0");
    expect(image.pullPolicy).toBe("Always");
  });

  it("falls back to default image when not specified", () => {
    const config = environmentPreset("minikube");
    const plan = buildKrateHelmPlan(config);
    const image = plan.values.image as Record<string, unknown>;
    expect(image.repository).toBe("ghcr.io/a5c-ai/krate/krate-controller");
    expect(image.tag).toBe("local");
    expect(image.pullPolicy).toBe("IfNotPresent");
  });

  it("uses releaseName krate and chart path packages/krate/charts", () => {
    const config = environmentPreset("minikube");
    const plan = buildKrateHelmPlan(config);
    expect(plan.releaseName).toBe("krate");
    expect(plan.chartPath).toBe("packages/krate/charts");
    expect(plan.namespace).toBe("babysitter-local");
  });

  it("produces human-readable summary lines", () => {
    const config = environmentPreset("staging");
    const plan = buildKrateHelmPlan(config);
    expect(plan.summary).toContain("helm upgrade --install krate in babysitter-staging");
    expect(plan.summary).toContain("api: 2 replicas");
    expect(plan.summary).toContain("controllers: 2 replicas");
    expect(plan.summary).toContain("web: 2 replicas");
    expect(plan.summary).toContain("gitea: enabled");
    expect(plan.summary).toContain("agents: enabled");
  });
});

describe("renderHelmValuesYaml", () => {
  it("produces valid YAML with expected top-level keys", () => {
    const config = environmentPreset("minikube");
    const plan = buildKrateHelmPlan(config);
    const yaml = renderHelmValuesYaml(plan);
    expect(yaml).toContain("image:");
    expect(yaml).toContain("api:");
    expect(yaml).toContain("controllers:");
    expect(yaml).toContain("web:");
    expect(yaml).toContain("webhookWorker:");
    expect(yaml).toContain("ingress:");
    expect(yaml).toContain("gitea:");
    expect(yaml).toContain("demo:");
    expect(yaml).toContain("agents:");
    expect(yaml).toContain("auth:");
    expect(yaml).toContain("argocd:");
    expect(yaml).toContain("storage:");
  });

  it("renders replica counts as numbers", () => {
    const config = environmentPreset("prod");
    const plan = buildKrateHelmPlan(config);
    const yaml = renderHelmValuesYaml(plan);
    expect(yaml).toContain("replicas: 3");
  });

  it("renders boolean values correctly", () => {
    const config = environmentPreset("minikube");
    const plan = buildKrateHelmPlan(config);
    const yaml = renderHelmValuesYaml(plan);
    expect(yaml).toMatch(/enabled: true/);
    expect(yaml).toMatch(/enabled: false/);
  });

  it("renders ingress hosts as YAML array entries", () => {
    const config = environmentPreset("minikube");
    const plan = buildKrateHelmPlan(config);
    const yaml = renderHelmValuesYaml(plan);
    expect(yaml).toContain("host: krate.localdev.me");
    expect(yaml).toContain("path: /");
    expect(yaml).toContain("pathType: Prefix");
  });

  it("renders empty arrays as []", () => {
    const config = environmentPreset("minikube");
    const plan = buildKrateHelmPlan(config);
    const yaml = renderHelmValuesYaml(plan);
    expect(yaml).toContain("tls: []");
  });

  it("renders empty objects as {}", () => {
    const config = environmentPreset("minikube");
    const plan = buildKrateHelmPlan(config);
    const yaml = renderHelmValuesYaml(plan);
    expect(yaml).toContain("resources: {}");
  });

  it("ends with a trailing newline", () => {
    const config = environmentPreset("minikube");
    const plan = buildKrateHelmPlan(config);
    const yaml = renderHelmValuesYaml(plan);
    expect(yaml.endsWith("\n")).toBe(true);
  });

  it("does not contain undefined values", () => {
    const config = environmentPreset("minikube");
    const plan = buildKrateHelmPlan(config);
    const yaml = renderHelmValuesYaml(plan);
    expect(yaml).not.toContain("undefined");
  });
});

describe("cloud deployment plan", () => {
  it("builds a working minikube plan with helm", () => {
    const config = environmentPreset("minikube");
    const plan = buildDeploymentPlan(config);
    expect(plan.helm.releaseName).toBe("krate");
    expect(plan.helm.namespace).toBe("babysitter-local");
    expect(plan.helm.summary.length).toBeGreaterThan(0);
    expect(plan.kubernetes.manifests.some((manifest) => manifest.kind === "Secret")).toBe(true);
  });

  it("renders terraform for eks", () => {
    const config = {
      ...environmentPreset("custom"),
      target: {
        type: "eks" as const,
        region: "us-east-1",
        clusterName: "babysitter-staging",
      },
    };
    const plan = buildDeploymentPlan(config);
    const rendered = renderTerraform(plan);
    const main = rendered.files.find((file) => file.path === "main.tf");
    expect(main?.content).toContain("terraform-aws-modules/eks/aws");
    expect(main?.content).toContain("babysitter-staging");
  });

  it("renders kubernetes with helm values", () => {
    const config = environmentPreset("minikube");
    const plan = buildDeploymentPlan(config);
    const rendered = renderKubernetes(plan);
    expect(rendered.content).toContain("Helm values for krate");
    expect(rendered.content).toContain("image:");
    expect(rendered.content).toContain("api:");
    expect(rendered.content).toContain("controllers:");
    expect(rendered.content).toContain("web:");
  });

  it("builds machine-usable provider automation output", () => {
    const config = {
      ...environmentPreset("minikube"),
      providerConfigs: [
        {
          id: "openai",
          credentials: [{ envVar: "OPENAI_API_KEY", value: "test-key" }],
          defaultModel: "gpt-5.4",
        },
      ],
      modelRouting: [{ provider: "openai", model: "gpt-5.4-mini", agent: "codex" }],
    };

    const providers = configureProviders(config);
    expect(providers.automation.filePath).toBe(".amux/providers.json");
    expect(providers.automation.providersFile.defaults).toEqual({
      provider: "openai",
      model: "gpt-5.4",
    });
    expect(providers.automation.credentials).toEqual([
      {
        providerId: "openai",
        envVar: "OPENAI_API_KEY",
        value: "test-key",
        required: true,
      },
    ]);
    expect(providers.env.BABYSITTER_AGENT_AMUX_PROVIDERS_FILE_JSON).toContain("\"profiles\"");
    expect(providers.env.BABYSITTER_AGENT_AMUX_MODEL_ROUTING_JSON).toContain("\"codex\"");
  });

  it("renders terraform for aks", () => {
    const config = {
      ...environmentPreset("custom"),
      target: {
        type: "aks" as const,
        subscriptionId: "sub-123",
        resourceGroup: "rg-babysitter",
        clusterName: "babysitter-aks",
      },
    };
    const plan = buildDeploymentPlan(config);
    const rendered = renderTerraform(plan);
    const main = rendered.files.find((file) => file.path === "main.tf");
    expect(main?.content).toContain("azurerm");
    expect(main?.content).toContain("babysitter-aks");
    expect(main?.content).toContain("sub-123");
  });

  it("renders terraform for gke", () => {
    const config = {
      ...environmentPreset("custom"),
      target: {
        type: "gke" as const,
        projectId: "my-project",
        region: "us-central1",
        clusterName: "babysitter-gke",
      },
    };
    const plan = buildDeploymentPlan(config);
    const rendered = renderTerraform(plan);
    const main = rendered.files.find((file) => file.path === "main.tf");
    expect(main?.content).toContain("google");
    expect(main?.content).toContain("babysitter-gke");
    expect(main?.content).toContain("my-project");
  });

  it("renders terraform for minikube", () => {
    const config = environmentPreset("minikube");
    const plan = buildDeploymentPlan(config);
    const rendered = renderTerraform(plan);
    const main = rendered.files.find((file) => file.path === "main.tf");
    expect(main?.content).toContain("minikube start");
    expect(main?.content).toContain("babysitter");
    expect(rendered.files.some((f) => f.path === "terraform.tfvars.json")).toBe(true);
  });

  it("builds structured agent install plans with canonical targets", () => {
    const config = {
      ...environmentPreset("minikube"),
      agents: {
        install: true,
        targets: ["copilot", "codex"] as const,
        installBabysitterPlugins: true,
        scope: "workspace" as const,
      },
    };

    const plan = buildAgentInstallPlan(config);
    expect(plan?.scope).toBe("workspace");
    expect(plan?.steps).toEqual([
      {
        requestedTarget: "copilot",
        target: "github-copilot",
        harnessInstaller: "agent-mux",
        pluginInstall: {
          installerPackage: "@a5c-ai/babysitter-github",
          scope: "workspace",
        },
      },
      {
        requestedTarget: "codex",
        target: "codex",
        harnessInstaller: "agent-mux",
        pluginInstall: {
          installerPackage: "@a5c-ai/babysitter-codex",
          scope: "workspace",
        },
      },
    ]);
  });
});
