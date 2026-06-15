import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

describe("GitHub auth route", () => {
  beforeEach(() => {
    vi.resetModules();
    cookiesMock.mockReset();
    cookiesMock.mockResolvedValue({
      set: vi.fn(),
      get: vi.fn(),
    });
    vi.stubEnv("AUTH_SECRET", "");
    vi.stubEnv("GITHUB_CLIENT_ID", "");
    vi.stubEnv("GITHUB_CLIENT_SECRET", "");
  });

  it("creates a mock development session when auth is not configured in dev mode", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { GET } = await import("../app/api/auth/github/route");

    const response = await GET(new Request("http://localhost:3000/api/auth/github?callbackUrl=/workspace"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/workspace");
    const cookie = response.cookies.get("atlas_session");
    expect(cookie?.value).toBeTruthy();
  });

  it("returns 503 outside development when auth is not configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { GET } = await import("../app/api/auth/github/route");

    const response = await GET(new Request("https://atlas-staging.a5c.ai/api/auth/github?callbackUrl=/workspace"));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Authentication is not configured" });
  });

  it("creates a mock session when explicitly enabled outside development", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ATLAS_DEV_LOGIN", "1");
    const { GET } = await import("../app/api/auth/github/route");

    const response = await GET(new Request("http://localhost:3010/api/auth/github?callbackUrl=/workspace"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3010/workspace");
    expect(response.cookies.get("atlas_session")?.value).toBeTruthy();
  });
});
