import { describe, expect, it, vi } from "vitest";

import { loadGatewayBootstrapSnapshot } from "../gateway-snapshot";

describe("loadGatewayBootstrapSnapshot", () => {
  it("keeps agent discovery available when runs and sessions fail", async () => {
    const fetcher = vi.fn(async (pathname: string) => {
      switch (pathname) {
        case "/api/v1/agents":
          return { agents: ["codex"] };
        case "/api/v1/runs":
          throw new Error("runs failed");
        case "/api/v1/sessions":
          throw new Error("sessions failed");
        default:
          throw new Error(`unexpected path: ${pathname}`);
      }
    });

    await expect(loadGatewayBootstrapSnapshot(fetcher)).resolves.toEqual({
      agents: { agents: ["codex"] },
      runs: undefined,
      sessions: undefined,
    });
  });
});
