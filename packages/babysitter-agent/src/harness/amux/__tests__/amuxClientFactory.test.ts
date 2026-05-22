import { describe, it, expect, beforeEach } from "vitest";
import {
  getAmuxClient,
  isAmuxAvailable,
  _resetAmuxClientCache,
  _setAmuxModuleForTesting,
} from "../amuxClientFactory";

beforeEach(() => {
  _resetAmuxClientCache();
  _setAmuxModuleForTesting(undefined);
});

describe("getAmuxClient", () => {
  it("returns a client instance from an injected agent-mux module", async () => {
    const injectedClient = {
      run: () => {
        throw new Error("not used in this test");
      },
    };
    _setAmuxModuleForTesting({
      createClient: () => injectedClient,
    });

    const resolvedClient = await getAmuxClient();

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

    const first = await getAmuxClient();
    const second = await getAmuxClient();

    expect(first).toBe(second);
    expect(createCalls).toBe(1);
  });
});

describe("isAmuxAvailable", () => {
  it("returns false when the injected module cannot create a client", async () => {
    _setAmuxModuleForTesting({
      createClient: () => {
        throw new Error("boom");
      },
    });

    await expect(isAmuxAvailable()).resolves.toBe(false);
  });
});

describe("_resetAmuxClientCache", () => {
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

    const first = await getAmuxClient();
    _resetAmuxClientCache();
    const second = await getAmuxClient();

    expect(first).not.toBe(second);
    expect(second).not.toBeNull();
    expect(createCalls).toBe(2);
  });
});
