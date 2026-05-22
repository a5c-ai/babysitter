import { describe, expect, it } from "vitest";

import { environmentPreset, loadCloudConfig, parseSetOverrides, validateCloudConfig } from "../src/index.js";

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
      "krate.api.replicas=3",
      "target.clusterName=test-cluster",
    ]);
    expect(parsed.namespace).toBe("demo");
    expect(parsed.krate?.api?.replicas).toBe(3);
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

describe("environment presets produce correct krate configs", () => {
  it("minikube preset has 1 replica, demo enabled, agents disabled", () => {
    const config = environmentPreset("minikube");
    expect(config.environment).toBe("minikube");
    expect(config.namespace).toBe("babysitter-local");
    expect(config.releaseTag).toBe("local");
    expect(config.target.type).toBe("minikube");
    expect(config.krate.api.replicas).toBe(1);
    expect(config.krate.controllers.replicas).toBe(1);
    expect(config.krate.web.replicas).toBe(1);
    expect(config.krate.webhookWorker.replicas).toBe(1);
    expect(config.krate.gitea.enabled).toBe(true);
    expect(config.krate.demo.enabled).toBe(true);
    expect(config.krate.agents.enabled).toBe(false);
    expect(config.ingress.tls).toBe(false);
    expect(config.ingress.hostnames).toContain("krate.localdev.me");
    expect(config.auth.mode).toBe("local-dev");
  });

  it("staging preset has 2 replicas, TLS enabled, agents enabled, demo disabled", () => {
    const config = environmentPreset("staging");
    expect(config.environment).toBe("staging");
    expect(config.namespace).toBe("babysitter-staging");
    expect(config.releaseTag).toBe("staging");
    expect(config.target.type).toBe("existing");
    expect(config.krate.api.replicas).toBe(2);
    expect(config.krate.controllers.replicas).toBe(2);
    expect(config.krate.web.replicas).toBe(2);
    expect(config.krate.webhookWorker.replicas).toBe(2);
    expect(config.krate.gitea.enabled).toBe(true);
    expect(config.krate.demo.enabled).toBe(false);
    expect(config.krate.agents.enabled).toBe(true);
    expect(config.ingress.tls).toBe(true);
    expect(config.ingress.hostnames).toContain("krate.staging.a5c.ai");
    expect(config.auth.mode).toBe("bootstrap-admin");
  });

  it("prod preset has 3 replicas, TLS enabled, agents enabled, demo disabled", () => {
    const config = environmentPreset("prod");
    expect(config.environment).toBe("prod");
    expect(config.namespace).toBe("babysitter-prod");
    expect(config.releaseTag).toBe("production");
    expect(config.target.type).toBe("existing");
    expect(config.krate.api.replicas).toBe(3);
    expect(config.krate.controllers.replicas).toBe(3);
    expect(config.krate.web.replicas).toBe(3);
    expect(config.krate.webhookWorker.replicas).toBe(3);
    expect(config.krate.gitea.enabled).toBe(true);
    expect(config.krate.demo.enabled).toBe(false);
    expect(config.krate.agents.enabled).toBe(true);
    expect(config.ingress.tls).toBe(true);
    expect(config.ingress.hostnames).toContain("krate.a5c.ai");
    expect(config.auth.mode).toBe("bootstrap-admin");
  });

  it("custom preset uses base defaults with latest tag", () => {
    const config = environmentPreset("custom");
    expect(config.environment).toBe("custom");
    expect(config.releaseTag).toBe("latest");
    expect(config.namespace).toBe("babysitter");
    expect(config.target.type).toBe("existing");
    expect(config.krate.api.replicas).toBe(1);
    expect(config.krate.gitea.enabled).toBe(true);
    expect(config.krate.demo.enabled).toBe(false);
    expect(config.krate.agents.enabled).toBe(false);
  });

  it("each preset returns an independent copy (no shared mutation)", () => {
    const first = environmentPreset("minikube");
    const second = environmentPreset("minikube");
    first.krate.api.replicas = 99;
    expect(second.krate.api.replicas).toBe(1);
  });
});

