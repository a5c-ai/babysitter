import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildAppOrigin,
  createDevelopmentSessionUser,
  createOAuthStateToken,
  createSessionToken,
  isDevelopmentMockLoginEnabled,
  normalizeCallbackUrl,
  verifyOAuthStateToken,
  verifySessionToken,
} from "../auth";

describe("atlas auth helpers", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_SECRET", "atlas-test-secret");
  });

  it("normalizes callback URLs to local application paths", () => {
    expect(normalizeCallbackUrl("/workspace/graphs")).toBe("/workspace/graphs");
    expect(normalizeCallbackUrl("https://evil.example")).toBe("/workspace");
    expect(normalizeCallbackUrl("//evil.example")).toBe("/workspace");
    expect(normalizeCallbackUrl("workspace")).toBe("/workspace");
    expect(normalizeCallbackUrl(undefined, "/workspace/company-builder")).toBe("/workspace/company-builder");
  });

  it("round-trips session and OAuth state tokens and rejects tampering", () => {
    const sessionToken = createSessionToken({
      id: "user-1",
      email: "user@example.com",
      name: "Atlas User",
      image: null,
      login: "atlas-user",
    });
    expect(verifySessionToken(sessionToken)).toEqual({
      user: {
        id: "user-1",
        email: "user@example.com",
        name: "Atlas User",
        image: null,
        login: "atlas-user",
      },
    });

    const [body, signature] = sessionToken.split(".");
    const tamperedSignature = `${signature.slice(0, -1)}${signature.endsWith("A") ? "B" : "A"}`;
    expect(verifySessionToken(`${body}.${tamperedSignature}`)).toBeNull();

    const stateToken = createOAuthStateToken("https://bad.example/workspace");
    expect(verifyOAuthStateToken(stateToken)).toMatchObject({
      callbackUrl: "/workspace",
    });
  });

  it("builds the app origin from forwarded headers when present", () => {
    const request = new Request("http://internal.local/api/auth/github", {
      headers: {
        host: "internal.local",
        "x-forwarded-host": "atlas.a5c.ai",
        "x-forwarded-proto": "https",
      },
    });

    expect(buildAppOrigin(request)).toBe("https://atlas.a5c.ai");
  });

  it("enables development-only mock login when GitHub OAuth is absent", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("GITHUB_CLIENT_ID", "");
    vi.stubEnv("GITHUB_CLIENT_SECRET", "");

    expect(isDevelopmentMockLoginEnabled()).toBe(true);
    expect(createDevelopmentSessionUser()).toEqual({
      id: "atlas-dev-user",
      email: "dev@localhost",
      name: "Atlas Dev",
      image: null,
      login: "atlas-dev",
    });
  });

  it("allows explicit local mock login outside development mode", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ATLAS_DEV_LOGIN", "1");
    vi.stubEnv("GITHUB_CLIENT_ID", "");
    vi.stubEnv("GITHUB_CLIENT_SECRET", "");

    expect(isDevelopmentMockLoginEnabled()).toBe(true);
    const token = createSessionToken(createDevelopmentSessionUser());
    expect(token).toBeTruthy();
    expect(verifySessionToken(token ?? undefined)?.user.id).toBe("atlas-dev-user");
  });
});
