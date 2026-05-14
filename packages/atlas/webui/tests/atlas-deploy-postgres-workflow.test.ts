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
    expect(workflow).toContain("--from-literal=DATABASE_URL=\"$DATABASE_URL\"");
    expect(workflow).toContain("name: Initialize Atlas database");
    expect(workflow).toContain("job/atlas-webui-db-init");
    expect(workflow).toContain("db:init");
    expect(workflow).toContain("name: atlas-postgres");
  });
});
