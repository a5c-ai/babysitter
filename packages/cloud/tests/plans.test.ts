import { describe, expect, it } from "vitest";

import { buildAgentInstallPlan, buildDeploymentPlan, configureProviders, environmentPreset, renderKubernetes, renderTerraform } from "../src/index.js";

describe("cloud deployment plan", () => {
  it("builds a working minikube plan", () => {
    const config = environmentPreset("minikube");
    const plan = buildDeploymentPlan(config);
    expect(plan.components.map((component) => component.id)).toEqual(["gateway", "kanban"]);
    expect(plan.kubernetes.manifests.some((manifest) => manifest.kind === "Ingress")).toBe(true);
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

  it("renders kubernetes deployment manifests", () => {
    const config = {
      ...environmentPreset("minikube"),
      components: {
        ...environmentPreset("minikube").components,
        babysitterAgent: {
          enabled: true,
          replicas: 1,
          providers: [
            {
              id: "openai",
              credentials: [{ envVar: "OPENAI_API_KEY", value: "test-key" }],
            },
          ],
          modelRouting: [{ provider: "openai", model: "gpt-5.4" }],
        },
      },
    };
    const plan = buildDeploymentPlan(config);
    const rendered = renderKubernetes(plan);
    expect(rendered.content).toContain("kind: Deployment");
    expect(rendered.content).toContain("name: babysitter-agent");
    expect(rendered.content).toContain("BABYSITTER_AGENT_AMUX_INVOCATION_MODE");
    expect(rendered.content).toContain("KANBAN_GATEWAY_PROXY_URL");
    expect(rendered.content).toContain("KANBAN_GATEWAY_AUTH_MODE");
    expect(rendered.content).toContain("AMUX_GATEWAY_BOOTSTRAP_ADMIN_PASSWORD");
    expect(rendered.content).toContain("secretKeyRef");
  });

  it("builds machine-usable provider automation output", () => {
    const config = {
      ...environmentPreset("minikube"),
      components: {
        ...environmentPreset("minikube").components,
        babysitterAgent: {
          enabled: true,
          replicas: 1,
          providers: [
            {
              id: "openai",
              credentials: [{ envVar: "OPENAI_API_KEY", value: "test-key" }],
              defaultModel: "gpt-5.4",
            },
          ],
          modelRouting: [{ provider: "openai", model: "gpt-5.4-mini", agent: "codex" }],
        },
      },
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
