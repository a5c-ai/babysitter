import { describe, it, expect, beforeEach } from "vitest";
import {
  getAgentMuxClient,
  isAgentMuxAvailable,
  _resetAgentMuxClientCache,
  _setAmuxModuleForTesting,
} from "../agentMuxClientFactory";

beforeEach(() => {
  _resetAgentMuxClientCache();
  _setAmuxModuleForTesting(undefined);
});

describe("getAgentMuxClient", () => {
  it("returns a client instance from an injected adapters module", async () => {
    const injectedClient = {
      run: () => {
        throw new Error("not used in this test");
      },
    };
    _setAmuxModuleForTesting({
      createClient: () => injectedClient,
    });

    const resolvedClient = await getAgentMuxClient();

    expect(resolvedClient).not.toBeNull();
    expect(resolvedClient).toBeDefined();
    expect(resolvedClient).toBe(injectedClient);
  });

  it("caches the client across calls", async () => {
    let createCalls = 0;
    _setAmuxModuleForTesting({
      createClient: () => {
        createCalls += 1;
        return {
          run: () => {
            throw new Error("not used in this test");
          },
        };
      },
    });

    const first = await getAgentMuxClient();
    const second = await getAgentMuxClient();

    expect(first).toBe(second);
    expect(createCalls).toBe(1);
  });
});

describe("isAgentMuxAvailable", () => {
  it("returns false when the injected module cannot create a client", async () => {
    _setAmuxModuleForTesting({
      createClient: () => {
        throw new Error("boom");
      },
    });

    await expect(isAgentMuxAvailable()).resolves.toBe(false);
  });
});

describe("_resetAgentMuxClientCache", () => {
  it("allows re-creation after reset", async () => {
    let createCalls = 0;
    _setAmuxModuleForTesting({
      createClient: () => {
        createCalls += 1;
        return {
          run: () => {
            throw new Error("not used in this test");
          },
        };
      },
    });

    const first = await getAgentMuxClient();
    _resetAgentMuxClientCache();
    const second = await getAgentMuxClient();

    expect(first).not.toBe(second);
    expect(second).not.toBeNull();
    expect(createCalls).toBe(2);
  });
});
