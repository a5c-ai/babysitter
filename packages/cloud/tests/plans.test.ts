import { describe, expect, it } from "vitest";

import { buildDeploymentPlan, environmentPreset, renderKubernetes, renderTerraform } from "../src/index.js";

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
  });
});

