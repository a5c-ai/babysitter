import { describe, expect, it } from "vitest";
import { listFallbackHarnessMetadata } from "@a5c-ai/agent-catalog";
import { resolveRunsDir } from "../config";
import { STATIC_FALLBACK_METADATA } from "./amuxFallbackMetadata";

describe("sdk fallback metadata contract", () => {
  it("derives static fallback metadata from the agent-catalog export surface", () => {
    const expected = Object.fromEntries(
      Object.values(listFallbackHarnessMetadata()).map((metadata) => [
        metadata.adapterName,
        {
          name: metadata.adapterName,
          hostEnvSignals: metadata.hostEnvSignals,
          capabilities: metadata.capabilities,
          sessionDir: metadata.sessionDir === ".a5c/runs" ? resolveRunsDir() : metadata.sessionDir,
        },
      ]),
    );

    if (Object.keys(expected).length > 0) {
      expect(STATIC_FALLBACK_METADATA).toEqual(expected);
    }

    expect(Object.keys(STATIC_FALLBACK_METADATA).length).toBeGreaterThan(0);
    expect(STATIC_FALLBACK_METADATA.claude).toMatchObject({
      name: "claude",
      hostEnvSignals: expected.claude?.hostEnvSignals ?? STATIC_FALLBACK_METADATA.claude.hostEnvSignals,
      capabilities: expected.claude?.capabilities ?? STATIC_FALLBACK_METADATA.claude.capabilities,
    });
  });
});
