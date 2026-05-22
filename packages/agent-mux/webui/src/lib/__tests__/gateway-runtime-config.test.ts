import { describe, expect, it } from "vitest";

import {
  buildGatewayTargetUrl,
  extractBootstrapToken,
  gatewayProxyPath,
  resolveGatewayRuntimeConfig,
} from "../gateway-runtime-config";

describe("gateway runtime config", () => {
  it("prefers explicit browser and proxy gateway urls", () => {
    const config = resolveGatewayRuntimeConfig({
      KANBAN_DEFAULT_GATEWAY_URL: "https://gateway.staging.a5c.ai/",
      KANBAN_GATEWAY_PROXY_URL: "http://agent-mux-gateway:7878/",
      KANBAN_GATEWAY_AUTH_MODE: "bootstrap-admin",
      KANBAN_BOOTSTRAP_ADMIN_USERNAME: "admin",
      KANBAN_GATEWAY_BOOTSTRAP_LOGIN_PATH: "/api/bootstrap/login",
    });

    expect(config.defaultGatewayUrl).toBe("https://gateway.staging.a5c.ai");
    expect(config.proxyGatewayUrl).toBe("http://agent-mux-gateway:7878");
    expect(config.authMode).toBe("bootstrap-admin");
    expect(config.bootstrapAdminUsername).toBe("admin");
    expect(config.bootstrapLoginPath).toBe("/api/bootstrap/login");
  });

  it("falls back to manual mode and a local proxy target", () => {
    const config = resolveGatewayRuntimeConfig({});

    expect(config.defaultGatewayUrl).toBeNull();
    expect(config.proxyGatewayUrl).toBe("http://127.0.0.1:7878");
    expect(config.authMode).toBe("manual");
  });

  it("builds stable proxy and target paths", () => {
    expect(gatewayProxyPath("/api/v1/sessions")).toBe("/api/gateway-proxy/api/v1/sessions");
    expect(
      buildGatewayTargetUrl("https://gateway.staging.a5c.ai/base/", "/api/v1/sessions", "?limit=5"),
    ).toBe("https://gateway.staging.a5c.ai/base/api/v1/sessions?limit=5");
  });

  it("extracts bootstrap tokens from direct and nested payloads", () => {
    expect(extractBootstrapToken({ token: "plain-token" })).toBe("plain-token");
    expect(extractBootstrapToken({ issuedToken: { plaintext: "nested-token" } })).toBe("nested-token");
    expect(extractBootstrapToken({ ok: true })).toBeNull();
  });
});
