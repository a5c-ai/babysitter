import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
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
}));

vi.mock("@/lib/server/db", () => ({
  isDatabaseConfigured: isDatabaseConfiguredMock,
}));

vi.mock("@/lib/server/user-graphs", () => ({
  listUserGraphUploads: listUserGraphUploadsMock,
}));

vi.mock("@/lib/server/company-builder", () => ({
  COMPANY_LAYER_DEFS: [
    { key: "agents", label: "Agents" },
    { key: "tools", label: "Tools" },
  ],
  listCompanyBlueprints: listCompanyBlueprintsMock,
  getCompanyBlueprint: getCompanyBlueprintMock,
  getCompanyLayerPalette: getCompanyLayerPaletteMock,
}));

function resetWorkspaceMocks() {
  authMock.mockReset();
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
});

describe("private workspace pages", () => {
  it("redirects unauthenticated workspace overview requests", async () => {
    authMock.mockResolvedValue(null);

    await expect(renderWorkspaceOverview()).rejects.toThrow("REDIRECT:/");
    expect(redirectMock).toHaveBeenCalledWith("/");
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

  it("renders workspace overview with company builder available in local mock mode", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
        email: "atlas@example.com",
        name: "Atlas User",
      },
    });
    isDatabaseConfiguredMock.mockReturnValue(false);

    const html = await renderWorkspaceOverview();

    expect(html).toContain("company builder now uses local file-backed storage");
    expect(html).toContain("Company builder remains available with local file-backed storage");
    expect(html).toContain("User graph uploads are still disabled");
    expect(html).toContain("Builder local fallback");
  });

  it("redirects unauthenticated workspace graph requests", async () => {
    authMock.mockResolvedValue(null);

    await expect(renderWorkspaceGraphs()).rejects.toThrow("REDIRECT:/");
    expect(redirectMock).toHaveBeenCalledWith("/");
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

  it("redirects unauthenticated company builder requests", async () => {
    authMock.mockResolvedValue(null);

    await expect(renderCompanyBuilder()).rejects.toThrow("REDIRECT:/");
    expect(redirectMock).toHaveBeenCalledWith("/");
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
      lastExportYaml: "nodeKind: CompanyBlueprint",
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
            selections: [
              {
                id: "selection-1",
                layerKey: "agents",
                atlasRecordId: "agent:codex",
                selectionRole: "primary coding agent",
                notes: "Main operator",
                coversLayers: ["agents", "tools"],
              },
            ],
            assetIds: ["asset-1"],
          },
        ],
        assets: [
          {
            id: "asset-1",
            displayName: "GitHub org",
            assetKind: "vcs-host",
            environment: "production",
            provider: "GitHub",
            notes: "",
          },
        ],
        integrations: [
          {
            id: "integration-1",
            fromSystemId: "system-1",
            toType: "asset",
            toId: "asset-1",
            integrationKind: "syncs-to",
            triggerKind: "webhook",
            notes: "Syncs changes",
          },
        ],
      },
    });
    getCompanyLayerPaletteMock.mockResolvedValue([
      {
        key: "agents",
        label: "Agents",
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
        key: "tools",
        label: "Tools",
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
  });

  it("renders company builder in local mock mode when the database is unavailable", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    isDatabaseConfiguredMock.mockReturnValue(false);
    listCompanyBlueprintsMock.mockResolvedValue([]);
    getCompanyLayerPaletteMock.mockResolvedValue([
      {
        key: "agents",
        label: "Agents",
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

    expect(html).toContain("Local mock mode is active");
    expect(html).toContain("Create blueprint");
    expect(html).toContain("File-backed storage");
    expect(html).toContain("Layer palette");
    expect(html).toContain("Codex");
  });
});
