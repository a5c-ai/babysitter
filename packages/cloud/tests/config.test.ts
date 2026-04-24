import { describe, expect, it } from "vitest";

import { loadCloudConfig, parseSetOverrides, validateCloudConfig } from "../src/index.js";

describe("cloud config", () => {
  it("loads minikube preset by default", async () => {
    const config = await loadCloudConfig({ env: {} });
    expect(config.environment).toBe("minikube");
    expect(config.target.type).toBe("minikube");
    expect(config.namespace).toBe("babysitter-local");
  });

  it("accepts gks alias through overrides", async () => {
    const config = await loadCloudConfig({
      environment: "custom",
      overrides: {
        target: {
          type: "gke",
          projectId: "demo-project",
          region: "us-central1",
          clusterName: "demo",
        },
      },
    });
    expect(config.target.type).toBe("gke");
    expect(config.target.clusterName).toBe("demo");
  });

  it("parses --set overrides", () => {
    const parsed = parseSetOverrides([
      "namespace=demo",
      "components.babysitterAgent.enabled=true",
      "target.clusterName=test-cluster",
    ]);
    expect(parsed.namespace).toBe("demo");
    expect(parsed.components?.babysitterAgent?.enabled).toBe(true);
    expect((parsed.target as { clusterName?: string }).clusterName).toBe("test-cluster");
  });

  it("validates required fields", async () => {
    const config = await loadCloudConfig({
      environment: "custom",
      overrides: {
        ingress: { hostnames: [] },
        target: {
          type: "eks",
          clusterName: "",
          region: "",
        },
      },
    });
    const result = validateCloudConfig(config);
    expect(result.ok).toBe(false);
    expect(result.errors.some((entry) => entry.path === "target.region")).toBe(true);
  });
});

