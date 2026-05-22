import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const createUserGraphUploadMock = vi.fn();
const exportCompanyBlueprintYamlMock = vi.fn();
const revalidatePathMock = vi.fn();
const redirectMock = vi.fn((href: string) => {
  throw new Error(`REDIRECT:${href}`);
});

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/server/user-graphs", () => ({
  createUserGraphUpload: createUserGraphUploadMock,
}));

vi.mock("@/lib/server/company-builder", () => ({
  addCompanyIntegration: vi.fn(),
  addCompanyLayerBinding: vi.fn(),
  addCompanyResource: vi.fn(),
  addCompanyResourceBinding: vi.fn(),
  addCompanySystem: vi.fn(),
  createCompanyBlueprint: vi.fn(),
  deleteCompanyBlueprint: vi.fn(),
  deleteCompanyIntegration: vi.fn(),
  deleteCompanyLayerBinding: vi.fn(),
  deleteCompanyResource: vi.fn(),
  deleteCompanyResourceBinding: vi.fn(),
  deleteCompanySystem: vi.fn(),
  exportCompanyBlueprintYaml: exportCompanyBlueprintYamlMock,
  saveCompanyBlueprintMetadata: vi.fn(),
}));

describe("company-builder export actions", () => {
  beforeEach(() => {
    vi.resetModules();
    authMock.mockReset();
    createUserGraphUploadMock.mockReset();
    exportCompanyBlueprintYamlMock.mockReset();
    revalidatePathMock.mockReset();
    redirectMock.mockClear();
  });

  it("saves the generated company-builder YAML as a private graph upload", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    exportCompanyBlueprintYamlMock.mockResolvedValue("nodeKind: CompanyGraph\nid: graph:acme");
    const formData = new FormData();
    formData.set("blueprintId", "blueprint-1");
    formData.set("graphTitle", "Acme Agentic Stack export");
    formData.set("graphDescription", "Generated from the company-builder graph Acme Agentic Stack.");
    formData.set("sourceFilename", "acme-agentic-stack.yaml");

    const { saveCompanyBlueprintExportToPrivateGraphAction } = await import("../app/workspace/company-builder/actions");

    await expect(saveCompanyBlueprintExportToPrivateGraphAction(formData)).rejects.toThrow("REDIRECT:/workspace/graphs");

    expect(exportCompanyBlueprintYamlMock).toHaveBeenCalledWith("user-1", "blueprint-1");
    expect(createUserGraphUploadMock).toHaveBeenCalledWith({
      userId: "user-1",
      title: "Acme Agentic Stack export",
      description: "Generated from the company-builder graph Acme Agentic Stack.",
      sourceFilename: "acme-agentic-stack.yaml",
      rawYaml: "nodeKind: CompanyGraph\nid: graph:acme",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/workspace");
    expect(revalidatePathMock).toHaveBeenCalledWith("/workspace/company-builder");
    expect(revalidatePathMock).toHaveBeenCalledWith("/workspace/graphs");
    expect(redirectMock).toHaveBeenCalledWith("/workspace/graphs");
  });
});
