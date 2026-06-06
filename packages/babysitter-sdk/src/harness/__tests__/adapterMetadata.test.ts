import { afterEach, describe, expect, it } from "vitest";
import {
  _setAmuxModuleForTesting,
  clearAmuxMetadataCache,
  getAmuxAdapterMetadata,
} from "../adapterMetadata";

afterEach(() => {
  _setAmuxModuleForTesting(undefined);
  clearAmuxMetadataCache();
});

describe("getAmuxAdapterMetadata", () => {
  it("falls back to static metadata when adapters exports are unavailable", () => {
    _setAmuxModuleForTesting({});

    const metadata = getAmuxAdapterMetadata("claude-code");

    expect(metadata.name).toBe("claude");
    expect(metadata.hostEnvSignals.length).toBeGreaterThan(0);
    expect(metadata.capabilities.hasStopHook).toBe(true);
    expect(metadata.capabilities.supportsMCP).toBe(true);
  });
});
