import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// The public repository publishes npm packages and the GitHub Pages docs site only.
// Cluster deployment (Atlas WebUI, Kradle, cloud installer) runs from a private
// deployment repository, so publish.yml must carry no deploy jobs and no cluster or
// cloud-provider credentials.
const repoRoot = path.resolve(__dirname, "../../../..");
const workflowsDir = path.join(repoRoot, ".github/workflows");
const workflowPath = path.join(workflowsDir, "publish.yml");

const REMOVED_JOBS = [
  "deploy_atlas_webui",
  "deploy_kradle",
  "e2e_smoke_kradle",
  "g0_rt_jitsi_e2e",
  "deploy_staging_cloud",
];

const RETAINED_JOBS = [
  "lint",
  "build_all",
  "prepare_staging_publish",
  "publish_staging_sdk",
  "deploy_docs_site",
  "publish_staging_metapackage",
  "create_release_tag",
  "sync_external_plugins",
  "sync_atlas_plugins",
];

const CLUSTER_CREDENTIAL_PATTERN =
  /AZURE_|KUBE_CONFIG|ACR_NAME|ACR_TOKEN|ATLAS_POSTGRES_|azurecr\.io|azure\/login|az aks|az acr|A5C_CLOUD_/;

describe("publish workflow has no deploy pipeline", () => {
  const workflow = readFileSync(workflowPath, "utf8");

  it("defines none of the removed deploy jobs", () => {
    for (const job of REMOVED_JOBS) {
      expect(workflow, `job ${job} must be absent`).not.toMatch(new RegExp(`^  ${job}:`, "m"));
      expect(workflow, `needs edge to ${job} must be absent`).not.toMatch(new RegExp(`^      - ${job}$`, "m"));
    }
    expect(workflow).not.toContain("run_g0rt");
    expect(workflow).not.toContain("Deploy Atlas WebUI To AKS");
    expect(workflow).not.toContain("Deploy Kradle To AKS");
    expect(workflow).not.toContain("Provision Atlas Postgres");
  });

  it("references no cluster or cloud-provider credentials", () => {
    expect(workflow).not.toMatch(CLUSTER_CREDENTIAL_PATTERN);
    expect(workflow).not.toContain("kubectl");
    expect(workflow).not.toContain("helm upgrade");
  });

  it("keeps npm publishing, release tags, plugin syncs and the docs site", () => {
    for (const job of RETAINED_JOBS) {
      expect(workflow, `job ${job} must be retained`).toMatch(new RegExp(`^  ${job}:`, "m"));
    }
    expect(workflow).toContain("actions/deploy-pages");
    expect(workflow).toContain("scripts/publish-package-from-tag.mjs --workspace=@a5c-ai/babysitter");
  });
});

describe("workflows directory has no cluster deploy lane", () => {
  it("does not ship the G0-RT live Jitsi E2E workflow", () => {
    expect(existsSync(path.join(workflowsDir, "g0-rt-jitsi-e2e.yml"))).toBe(false);
  });

  it("has no workflow that reads cluster credentials", () => {
    const offenders = readdirSync(workflowsDir)
      .filter((name) => /\.ya?ml$/.test(name))
      .filter((name) => /KUBE_CONFIG|AZURE_ACR|AZURE_CLIENT_ID|AZURE_TENANT_ID|AZURE_SUBSCRIPTION_ID|azurecr\.io/.test(
        readFileSync(path.join(workflowsDir, name), "utf8"),
      ));
    expect(offenders).toEqual([]);
  });
});
