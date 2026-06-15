import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const workflowPath = path.resolve(__dirname, "../../../..", ".github/workflows/publish.yml");

describe("Atlas WebUI deploy workflow", () => {
  it("provisions PostgreSQL, initializes schema, and injects DATABASE_URL", () => {
    const workflow = readFileSync(workflowPath, "utf8");

    expect(workflow).toContain("name: Deploy Atlas WebUI To AKS");
    expect(workflow).toContain("name: Provision Atlas Postgres");
    expect(workflow).toContain("kind: StatefulSet");
    expect(workflow).toContain("name: atlas-postgres");
    expect(workflow).toContain("name: PGDATA");
    expect(workflow).toContain("value: /var/lib/postgresql/data/pgdata");
    expect(workflow).toContain("--from-literal=DATABASE_URL=\"$DATABASE_URL\"");
    expect(workflow).toContain("ATLAS_POSTGRES_STORAGE_ACCOUNT");
    expect(workflow).toContain("ATLAS_POSTGRES_STORAGE_KEY");
    expect(workflow).toContain("Using configured Atlas Postgres storage account");
    expect(workflow).toContain("AZURE_RESOURCE_GROUP=$RG");
    expect(workflow).toContain("A5C_CLOUD_STAGING_RESOURCE_GROUP");
    expect(workflow).toContain("NODE_PROVIDER_ID=$(kubectl get nodes");
    expect(workflow).toContain("Using AKS cluster resource group");
    expect(workflow).toContain("NODE_RESOURCE_GROUP=$(echo");
    expect(workflow).toContain("AZURE_LOCATION=$(echo");
    expect(workflow).toContain("az storage account create");
    expect(workflow).toContain("az storage share create");
    expect(workflow).toContain("kind: PersistentVolume");
    expect(workflow).toContain("storageClassName: ${POSTGRES_STORAGE_CLASS}");
    expect(workflow).toContain("nodeStageSecretRef");
    expect(workflow).toContain("atlas-postgres-azure-file");
    expect(workflow).toContain("Deleting non-bound Atlas Postgres PVC");
    expect(workflow).toContain("delete statefulset \"$POSTGRES_APP\"");
    expect(workflow).toContain("describe pods -l app=\"$POSTGRES_APP\"");
    expect(workflow).toContain("describe pvc \"$POSTGRES_PVC\"");
    expect(workflow).toContain("describe pv \"$POSTGRES_PV\"");
    expect(workflow).toContain("name: Initialize Atlas database");
    expect(workflow).toContain("job/atlas-webui-db-init");
    expect(workflow).toContain("describe pods -l app=atlas-webui-db-init");
    expect(workflow).toContain("logs job/atlas-webui-db-init");
    expect(workflow).toContain("db:init");
    expect(workflow).toContain('"@a5c-ai/atlas-webui"');
    expect(workflow).toContain("name: atlas-postgres");
  });
});