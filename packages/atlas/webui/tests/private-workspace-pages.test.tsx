import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const isDevelopmentMockLoginEnabledMock = vi.fn();
const isDatabaseConfiguredMock = vi.fn();
const listUserGraphUploadsMock = vi.fn();
const listCompanyBlueprintsMock = vi.fn();
const getCompanyBlueprintMock = vi.fn();
const getCompanyLayerPaletteMock = vi.fn();
const redirectMock = vi.fn((href: string) => {
  throw new Error(`REDIRECT:${href}`);
});

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/AtlasDocsScaffold", () => ({
  AtlasDocsScaffold: ({
    runningTitle,
    articleTitle,
    lead,
    meta,
    children,
  }: {
    runningTitle: React.ReactNode;
    articleTitle: React.ReactNode;
    lead: React.ReactNode;
    meta: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <main>
      <header>{runningTitle}</header>
      <section>{articleTitle}</section>
      <p>{lead}</p>
      <div>{meta}</div>
      <div>{children}</div>
    </main>
  ),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
  isDevelopmentMockLoginEnabled: isDevelopmentMockLoginEnabledMock,
}));

vi.mock("@/lib/server/db", () => ({
  isDatabaseConfigured: isDatabaseConfiguredMock,
}));

vi.mock("@/lib/server/user-graphs", () => ({
  listUserGraphUploads: listUserGraphUploadsMock,
}));

vi.mock("@/lib/server/company-builder", () => ({
  COMPANY_STACK_LAYERS: [
    { key: "layer:5-agent-runtime", label: "Agent Runtime" },
    { key: "layer:10-interaction", label: "Interaction" },
  ],
  COMPANY_COMPOSITION_FACETS: [
    { key: "facet:roles-and-teams", label: "Roles and Teams" },
  ],
  COMPANY_LAYER_DEFS: [
    { key: "layer:5-agent-runtime", label: "Agent Runtime" },
    { key: "layer:10-interaction", label: "Interaction" },
    { key: "facet:roles-and-teams", label: "Roles and Teams" },
  ],
  listCompanyBlueprints: listCompanyBlueprintsMock,
  getCompanyBlueprint: getCompanyBlueprintMock,
  getCompanyLayerPalette: getCompanyLayerPaletteMock,
}));

function resetWorkspaceMocks() {
  authMock.mockReset();
  isDevelopmentMockLoginEnabledMock.mockReset();
  isDatabaseConfiguredMock.mockReset();
  listUserGraphUploadsMock.mockReset();
  listCompanyBlueprintsMock.mockReset();
  getCompanyBlueprintMock.mockReset();
  getCompanyLayerPaletteMock.mockReset();
  redirectMock.mockClear();
}

async function renderWorkspaceOverview() {
  const mod = await import("../app/workspace/page");
  return renderToStaticMarkup(await mod.default());
}

async function renderWorkspaceGraphs() {
  const mod = await import("../app/workspace/graphs/page");
  return renderToStaticMarkup(await mod.default());
}

async function renderCompanyBuilder(searchParams?: { blueprint?: string }) {
  const mod = await import("../app/workspace/company-builder/page");
  return renderToStaticMarkup(
    await mod.default({
      searchParams: Promise.resolve(searchParams ?? {}),
    }),
  );
}

beforeEach(() => {
  vi.resetModules();
  resetWorkspaceMocks();
  isDatabaseConfiguredMock.mockReturnValue(true);
  isDevelopmentMockLoginEnabledMock.mockReturnValue(false);
});

describe("private workspace pages", () => {
  it("redirects unauthenticated workspace overview requests", async () => {
    authMock.mockResolvedValue(null);

    await expect(renderWorkspaceOverview()).rejects.toThrow("REDIRECT:/");
    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("auto-redirects unauthenticated workspace overview requests into mock login when enabled", async () => {
    authMock.mockResolvedValue(null);
    isDevelopmentMockLoginEnabledMock.mockReturnValue(true);

    await expect(renderWorkspaceOverview()).rejects.toThrow("REDIRECT:/api/auth/github?callbackUrl=%2Fworkspace");
    expect(redirectMock).toHaveBeenCalledWith("/api/auth/github?callbackUrl=%2Fworkspace");
  });

  it("renders authenticated workspace overview content", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
        email: "atlas@example.com",
        name: "Atlas User",
      },
    });
    listUserGraphUploadsMock.mockResolvedValue([
      {
        id: "upload-1",
        title: "Private Overlay",
        recordCount: 12,
        edgeCount: 5,
        status: "ready",
      },
    ]);

    const html = await renderWorkspaceOverview();

    expect(html).toContain("private workspace");
    expect(html).toContain("Signed in as atlas@example.com.");
    expect(html).toContain("Private Overlay");
    expect(html).toContain("12 records");
  });

  it("renders workspace overview with local SQLite-backed private tools when postgres is unavailable", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
        email: "atlas@example.com",
        name: "Atlas User",
      },
    });
    isDatabaseConfiguredMock.mockReturnValue(false);
    listUserGraphUploadsMock.mockResolvedValue([
      {
        id: "upload-1",
        title: "Local Overlay",
        recordCount: 4,
        edgeCount: 2,
        status: "ready",
      },
    ]);

    const html = await renderWorkspaceOverview();

    expect(html).toContain("Private workspace data persists in local SQLite only for ad-hoc local runs");
    expect(html).toContain("This local process is using SQLite because `DATABASE_URL` is not configured.");
    expect(html).toContain("Development, staging, and production deploy jobs provision Atlas PostgreSQL");
    expect(html).toContain("SQLite-backed local dev");
    expect(html).toContain("Local Overlay");
  });

  it("redirects unauthenticated workspace graph requests", async () => {
    authMock.mockResolvedValue(null);

    await expect(renderWorkspaceGraphs()).rejects.toThrow("REDIRECT:/");
    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("auto-redirects unauthenticated workspace graph requests into mock login when enabled", async () => {
    authMock.mockResolvedValue(null);
    isDevelopmentMockLoginEnabledMock.mockReturnValue(true);

    await expect(renderWorkspaceGraphs()).rejects.toThrow("REDIRECT:/api/auth/github?callbackUrl=%2Fworkspace%2Fgraphs");
    expect(redirectMock).toHaveBeenCalledWith("/api/auth/github?callbackUrl=%2Fworkspace%2Fgraphs");
  });

  it("renders authenticated workspace graph upload controls and entries", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    listUserGraphUploadsMock.mockResolvedValue([
      {
        id: "upload-1",
        title: "Ops Overlay",
        recordCount: 7,
        edgeCount: 3,
        sourceFilename: "ops.yaml",
        status: "warning",
      },
    ]);

    const html = await renderWorkspaceGraphs();

    expect(html).toContain("Current uploads");
    expect(html).toContain("Upload graph");
    expect(html).toContain("Ops Overlay");
    expect(html).toContain("ops.yaml");
    expect(html).toContain("Rebuild");
    expect(html).toContain("Delete");
  });

  it("renders workspace graph uploads in local SQLite mode when postgres is unavailable", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    isDatabaseConfiguredMock.mockReturnValue(false);
    listUserGraphUploadsMock.mockResolvedValue([
      {
        id: "upload-1",
        title: "Ops Overlay",
        recordCount: 7,
        edgeCount: 3,
        sourceFilename: "ops.yaml",
        status: "warning",
      },
    ]);

    const html = await renderWorkspaceGraphs();

    expect(html).toContain("Private YAML uploads use local SQLite only for ad-hoc local runs");
    expect(html).toContain("This local process is using SQLite because `DATABASE_URL` is not configured.");
    expect(html).toContain("Development, staging, and production deploy jobs provision Atlas PostgreSQL");
    expect(html).toContain("SQLite-backed local dev");
    expect(html).toContain("Ops Overlay");
    expect(html).toContain("Upload graph");
  });

  it("redirects unauthenticated company builder requests", async () => {
    authMock.mockResolvedValue(null);

    await expect(renderCompanyBuilder()).rejects.toThrow("REDIRECT:/");
    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("auto-redirects unauthenticated company builder requests into mock login when enabled", async () => {
    authMock.mockResolvedValue(null);
    isDevelopmentMockLoginEnabledMock.mockReturnValue(true);

    await expect(renderCompanyBuilder()).rejects.toThrow("REDIRECT:/api/auth/github?callbackUrl=%2Fworkspace%2Fcompany-builder");
    expect(redirectMock).toHaveBeenCalledWith("/api/auth/github?callbackUrl=%2Fworkspace%2Fcompany-builder");
  });

  it("renders authenticated company builder blueprint and palette content", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    listCompanyBlueprintsMock.mockResolvedValue([
      {
        id: "bp-1",
        name: "Acme Agentic Stack",
      },
    ]);
    getCompanyBlueprintMock.mockResolvedValue({
      id: "bp-1",
      slug: "acme-agentic-stack",
      name: "Acme Agentic Stack",
      lastExportYaml: "nodeKind: CompanyGraph",
      draft: {
        company: {
          displayName: "Acme Agentic Stack",
          description: "Private blueprint",
          slug: "acme-agentic-stack",
          status: "draft",
        },
        systems: [
          {
            id: "system-1",
            displayName: "Customer Ops",
            description: "Handles customer requests",
            systemKind: "customer-ops",
            outcome: "Resolve inbound customer requests",
            lifecycleStage: "production",
            layerBindings: [
              {
                id: "binding-1",
                primaryLayerId: "layer:5-agent-runtime",
                atlasRecordId: "agent:codex",
                selectionRole: "primary coding agent",
                rationale: "Main operator",
                coverageLayerIds: ["layer:5-agent-runtime", "layer:10-interaction"],
                importance: "primary",
              },
            ],
          },
        ],
        resources: [
          {
            id: "resource-1",
            displayName: "GitHub org",
            resourceClass: "workspace",
            environment: "production",
            provider: "GitHub",
            atlasRecordId: "tool:github",
            externalId: "",
            notes: "",
          },
        ],
        resourceBindings: [
          {
            id: "resource-binding-1",
            systemId: "system-1",
            resourceId: "resource-1",
            bindingKind: "uses",
            environmentStage: "production",
            criticality: "critical",
            notes: "Primary workspace",
          },
        ],
        integrations: [
          {
            id: "integration-1",
            sourceType: "system",
            sourceId: "system-1",
            targetType: "resource",
            targetId: "resource-1",
            integrationKind: "syncs-to",
            triggerKind: "webhook",
            interfaceKind: "api",
            direction: "outbound",
            notes: "Syncs changes",
          },
        ],
        teamCells: [],
        roleAssignments: [],
      },
    });
    getCompanyLayerPaletteMock.mockResolvedValue([
      {
        key: "layer:5-agent-runtime",
        label: "Agent Runtime",
        kind: "stack-layer",
        options: [
          {
            id: "agent:codex",
            label: "Codex",
            kind: "AgentProduct",
            description: "Coding agent",
          },
        ],
      },
      {
        key: "layer:10-interaction",
        label: "Interaction",
        kind: "stack-layer",
        options: [
          {
            id: "tool:github",
            label: "GitHub",
            kind: "Tool",
            description: "Repository host",
          },
        ],
      },
    ]);

    const html = await renderCompanyBuilder({ blueprint: "bp-1" });

    expect(html).toContain("company builder");
    expect(html).toContain("Acme Agentic Stack");
    expect(html).toContain("Customer Ops");
    expect(html).toContain("GitHub org");
    expect(html).toContain("syncs-to");
    expect(html).toContain("Layer palette");
    expect(html).toContain("Codex");
    expect(html).toContain("Choose a starter pattern");
    expect(html).toContain("Customer operations team");
    expect(html).toContain("Layer roadmap");
    expect(html).toContain("Choose a resource starter");
    expect(html).toContain("GitHub workspace");
    expect(html).toContain("Reusable integration target");
    expect(html).toContain("Choose a dependency pattern");
    expect(html).toContain("Workspace tool surface");
    expect(html).toContain("Reusable system dependency");
    expect(html).toContain("Search Atlas entities");
    expect(html).toContain("Extra coverage");
    expect(html).toContain("Save to private graphs");
    expect(html).toContain("Copy YAML");
    expect(html).toContain("Download YAML");
    expect(html).toContain("Generated company graph YAML");
  });

  it("renders company builder in local SQLite mode when the database is unavailable", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    isDatabaseConfiguredMock.mockReturnValue(false);
    listCompanyBlueprintsMock.mockResolvedValue([]);
    getCompanyLayerPaletteMock.mockResolvedValue([
      {
        key: "layer:5-agent-runtime",
        label: "Agent Runtime",
        kind: "stack-layer",
        options: [
          {
            id: "agent:codex",
            label: "Codex",
            kind: "AgentProduct",
            description: "Coding agent",
          },
        ],
      },
    ]);

    const html = await renderCompanyBuilder();

    expect(html).toContain("This local process is using SQLite because `DATABASE_URL` is not configured.");
    expect(html).toContain("Development, staging, and production deploy jobs provision Atlas PostgreSQL");
    expect(html).toContain("Create company graph");
    expect(html).toContain("SQLite-backed local dev");
    expect(html).toContain("Layer palette");
    expect(html).toContain("Codex");
  });
});
