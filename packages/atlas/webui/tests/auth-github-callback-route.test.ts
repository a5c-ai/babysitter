import { beforeEach, describe, expect, it, vi } from "vitest";
import { ATLAS_GITHUB_STATE_COOKIE, createOAuthStateToken } from "../auth";

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  upsertGitHubUser: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mocks.cookies,
}));

vi.mock("@/lib/server/user-store", () => ({
  upsertGitHubUser: mocks.upsertGitHubUser,
}));

describe("GitHub auth callback route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    mocks.cookies.mockReset();
    mocks.upsertGitHubUser.mockReset();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_SECRET", "atlas-test-secret");
    vi.stubEnv("GITHUB_CLIENT_ID", "github-client-id");
    vi.stubEnv("GITHUB_CLIENT_SECRET", "github-client-secret");
    vi.stubEnv("DATABASE_URL", "");
  });

  it("creates a signed session after GitHub OAuth when PostgreSQL is not configured", async () => {
    const state = createOAuthStateToken("/workspace");
    mocks.cookies.mockResolvedValue({
      get: vi.fn((name: string) => (name === ATLAS_GITHUB_STATE_COOKIE ? { value: state } : undefined)),
    });
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({
            access_token: "github-token",
            scope: "read:user,user:email",
            token_type: "bearer",
          }),
        )
        .mockResolvedValueOnce(
          Response.json({
            id: 123,
            login: "atlas-user",
            name: "Atlas User",
            email: "atlas@example.com",
            avatar_url: "https://avatars.example/atlas.png",
          }),
        ),
    );
    const { GET } = await import("../app/api/auth/callback/github/route");

    const response = await GET(
      new Request(`https://atlas-staging.a5c.ai/api/auth/callback/github?code=abc&state=${state}`),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://atlas-staging.a5c.ai/workspace");
    expect(response.cookies.get("atlas_session")?.value).toBeTruthy();
    expect(mocks.upsertGitHubUser).not.toHaveBeenCalled();
  });

  it("redirects OAuth callback failures instead of surfacing a 500", async () => {
    const state = createOAuthStateToken("/workspace");
    mocks.cookies.mockResolvedValue({
      get: vi.fn((name: string) => (name === ATLAS_GITHUB_STATE_COOKIE ? { value: state } : undefined)),
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(Response.json({ error: "bad_verification_code" })),
    );
    const { GET } = await import("../app/api/auth/callback/github/route");

    const response = await GET(
      new Request(`https://atlas-staging.a5c.ai/api/auth/callback/github?code=bad&state=${state}`),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://atlas-staging.a5c.ai/?authError=bad_verification_code");
  });
});
