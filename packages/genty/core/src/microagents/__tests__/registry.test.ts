import { describe, expect, it } from "vitest";
import { MicroagentRegistry } from "../registry";
import type { MicroagentManifest } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeManifest(overrides?: Partial<MicroagentManifest>): MicroagentManifest {
  return {
    name: "test-agent",
    version: "1.0.0",
    description: "A test microagent",
    inputSchema: { type: "object", properties: { x: { type: "string" } }, required: ["x"] },
    outputSchema: { type: "object", properties: { y: { type: "string" } }, required: ["y"] },
    isolation: "subprocess",
    runtime: { entrypoint: "test.js" },
    tags: ["test"],
    builtIn: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MicroagentRegistry", () => {
  it("registers and retrieves a microagent by name", () => {
    const registry = new MicroagentRegistry();
    const manifest = makeManifest({ name: "alpha" });

    registry.register(manifest);

    expect(registry.get("alpha")).toBe(manifest);
  });

  it("returns undefined for an unregistered name", () => {
    const registry = new MicroagentRegistry();
    expect(registry.get("nonexistent")).toBeUndefined();
  });

  it("list() with no filter returns all registered manifests", () => {
    const registry = new MicroagentRegistry();
    registry.register(makeManifest({ name: "a" }));
    registry.register(makeManifest({ name: "b" }));
    registry.register(makeManifest({ name: "c" }));

    const all = registry.list();

    expect(all).toHaveLength(3);
    expect(all.map((m) => m.name).sort()).toEqual(["a", "b", "c"]);
  });

  it("list() filters by tags (must match ALL requested tags)", () => {
    const registry = new MicroagentRegistry();
    registry.register(makeManifest({ name: "a", tags: ["converter", "utility"] }));
    registry.register(makeManifest({ name: "b", tags: ["utility"] }));
    registry.register(makeManifest({ name: "c", tags: ["api"] }));

    expect(registry.list({ tags: ["utility"] })).toHaveLength(2);
    expect(registry.list({ tags: ["converter", "utility"] })).toHaveLength(1);
    expect(registry.list({ tags: ["converter", "utility"] })[0].name).toBe("a");
    expect(registry.list({ tags: ["nonexistent"] })).toHaveLength(0);
  });

  it("list() filters by builtIn flag", () => {
    const registry = new MicroagentRegistry();
    registry.register(makeManifest({ name: "core-a", builtIn: true }));
    registry.register(makeManifest({ name: "core-b", builtIn: true }));
    registry.register(makeManifest({ name: "contrib-x", builtIn: false }));

    expect(registry.list({ builtIn: true })).toHaveLength(2);
    expect(registry.list({ builtIn: false })).toHaveLength(1);
    expect(registry.list({ builtIn: false })[0].name).toBe("contrib-x");
  });

  it("list() combines tag and builtIn filters", () => {
    const registry = new MicroagentRegistry();
    registry.register(makeManifest({ name: "a", tags: ["utility"], builtIn: true }));
    registry.register(makeManifest({ name: "b", tags: ["utility"], builtIn: false }));
    registry.register(makeManifest({ name: "c", tags: ["api"], builtIn: true }));

    const result = registry.list({ tags: ["utility"], builtIn: true });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("a");
  });

  it("has() returns true for registered and false for unregistered", () => {
    const registry = new MicroagentRegistry();
    registry.register(makeManifest({ name: "present" }));

    expect(registry.has("present")).toBe(true);
    expect(registry.has("absent")).toBe(false);
  });

  it("unregister() removes the manifest and returns true", () => {
    const registry = new MicroagentRegistry();
    registry.register(makeManifest({ name: "doomed" }));

    expect(registry.unregister("doomed")).toBe(true);
    expect(registry.has("doomed")).toBe(false);
    expect(registry.get("doomed")).toBeUndefined();
  });

  it("unregister() returns false for a name that was not registered", () => {
    const registry = new MicroagentRegistry();
    expect(registry.unregister("ghost")).toBe(false);
  });

  it("register() overwrites an existing manifest with the same name", () => {
    const registry = new MicroagentRegistry();
    const v1 = makeManifest({ name: "x", version: "1.0.0" });
    const v2 = makeManifest({ name: "x", version: "2.0.0" });

    registry.register(v1);
    registry.register(v2);

    expect(registry.get("x")?.version).toBe("2.0.0");
    expect(registry.list()).toHaveLength(1);
  });
});
