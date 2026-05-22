import { afterEach, describe, expect, it } from "vitest";
import {
  _setAmuxModuleForTesting,
  clearAmuxMetadataCache,
  getAmuxAdapterMetadata,
} from "../amuxMetadata";

afterEach(() => {
  _setAmuxModuleForTesting(undefined);
  clearAmuxMetadataCache();
});

describe("getAmuxAdapterMetadata", () => {
  it("falls back to static metadata when agent-mux exports are unavailable", () => {
    _setAmuxModuleForTesting({});

    const metadata = getAmuxAdapterMetadata("claude-code");

    expect(metadata.name).toBe("claude");
    expect(metadata.hostEnvSignals.length).toBeGreaterThan(0);
    expect(metadata.capabilities.hasStopHook).toBe(true);
    expect(metadata.capabilities.supportsMCP).toBe(true);
  });
});
