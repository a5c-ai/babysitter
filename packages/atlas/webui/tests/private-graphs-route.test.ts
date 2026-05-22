import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const createUserGraphUploadMock = vi.fn();
const listUserGraphUploadsMock = vi.fn();

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/server/user-graphs", () => ({
  createUserGraphUpload: createUserGraphUploadMock,
  listUserGraphUploads: listUserGraphUploadsMock,
}));

describe("private graph uploads route", () => {
  beforeEach(() => {
    vi.resetModules();
    authMock.mockReset();
    createUserGraphUploadMock.mockReset();
    listUserGraphUploadsMock.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    authMock.mockResolvedValue(null);
    const { GET } = await import("../app/api/private/graphs/route");

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("rejects uploads that do not include a YAML file", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    const { POST } = await import("../app/api/private/graphs/route");
    const formData = new FormData();
    formData.set("title", "Private Graph");

    const response = await POST(
      new Request("http://localhost/api/private/graphs", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Missing YAML file upload." });
  });

  it("creates an upload for authenticated YAML submissions", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    createUserGraphUploadMock.mockResolvedValue({
      id: "upload-1",
      slug: "private-graph",
      title: "Private Graph",
      description: "Private graph description",
      sourceFilename: "overlay.yaml",
      status: "ready",
      recordCount: 1,
      edgeCount: 0,
      createdAt: "2026-05-07T00:00:00.000Z",
      updatedAt: "2026-05-07T00:00:00.000Z",
    });
    const { POST } = await import("../app/api/private/graphs/route");
    const formData = new FormData();
    formData.set("title", "Private Graph");
    formData.set("description", "Private graph description");
    formData.set(
      "file",
      new File(
        [
          [
            "nodeKind: Tool",
            "id: tool:private",
            "attributes:",
            "  displayName: Private Tool",
          ].join("\n"),
        ],
        "overlay.yaml",
        { type: "text/yaml" },
      ),
    );

    const response = await POST(
      new Request("http://localhost/api/private/graphs", {
        method: "POST",
        body: formData,
      }),
    );

    expect(createUserGraphUploadMock).toHaveBeenCalledWith({
      userId: "user-1",
      title: "Private Graph",
      description: "Private graph description",
      sourceFilename: "overlay.yaml",
      rawYaml: ["nodeKind: Tool", "id: tool:private", "attributes:", "  displayName: Private Tool"].join("\n"),
    });
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      upload: {
        id: "upload-1",
        title: "Private Graph",
      },
    });
  });
});
