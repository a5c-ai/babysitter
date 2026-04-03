import { describe, expect, test, afterEach } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

import {
  getAnycliCacheDir,
  readServiceCache,
  writeServiceCache,
  invalidateServiceCache,
  listCachedServices,
} from "../anycli/cache";

import { renderCommandTemplate } from "../prompts/commandTemplates";

import type { AnycliServiceCache } from "../anycli/types";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeServiceCache(overrides?: Partial<AnycliServiceCache>): AnycliServiceCache {
  return {
    service: "testservice",
    definition: {
      name: "testservice",
      apiBaseUrl: "https://api.testservice.com",
      displayName: "Test Service",
      authMethods: ["api-key"],
      endpoints: [{ method: "GET", path: "/users", summary: "List users" }],
    },
    modules: {
      "_client.mjs": "// shared HTTP client",
      "users.mjs": "// users scope module",
      "index.mjs": "// barrel export",
    },
    metadata: {
      createdAt: new Date().toISOString(),
      sdkVersion: "0.0.0-test",
      definitionHash: "abc123",
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Cache tests
// ---------------------------------------------------------------------------

describe("anycli/cache", () => {
  describe("getAnycliCacheDir", () => {
    test("returns path under ~/.a5c/anycli/cache/<service>", () => {
      const dir = getAnycliCacheDir("github");
      expect(dir).toBe(path.join(os.homedir(), ".a5c", "anycli", "cache", "github"));
    });

    test("handles service names with special characters", () => {
      const dir = getAnycliCacheDir("my-service");
      expect(dir).toContain("my-service");
      expect(dir).toContain(path.join(".a5c", "anycli", "cache"));
    });
  });

  describe("readServiceCache", () => {
    test("returns null when no cache exists", async () => {
      const result = await readServiceCache("nonexistent-service-" + Date.now());
      expect(result).toBeNull();
    });
  });

  describe("writeServiceCache + readServiceCache round-trip", () => {
    const testService = `test-cache-roundtrip-${Date.now()}`;

    afterEach(async () => {
      await invalidateServiceCache(testService);
    });

    test("writes and reads back the same cache entry", async () => {
      const cache = makeServiceCache({ service: testService });
      await writeServiceCache(testService, cache);

      const cached = await readServiceCache(testService);
      expect(cached).not.toBeNull();
      expect(cached!.service).toBe(testService);
      expect(cached!.definition).toEqual(cache.definition);
      expect(cached!.modules).toEqual(cache.modules);
      expect(cached!.metadata.sdkVersion).toBe("0.0.0-test");
      expect(cached!.metadata.definitionHash).toBe("abc123");
    });

    test("preserves nested definition structure", async () => {
      const cache = makeServiceCache({
        service: testService,
        definition: {
          name: testService,
          nested: { deep: { value: [1, 2, 3] } },
        },
      });
      await writeServiceCache(testService, cache);

      const cached = await readServiceCache(testService);
      expect(cached).not.toBeNull();
      const def = cached!.definition as Record<string, unknown>;
      expect(def["nested"]).toEqual({ deep: { value: [1, 2, 3] } });
    });

    test("preserves modules content", async () => {
      const cache = makeServiceCache({
        service: testService,
        modules: {
          "server.mjs": "export function start() { /* code */ }",
          "client.mjs": "export function createClient() { /* code */ }",
        },
      });
      await writeServiceCache(testService, cache);

      const cached = await readServiceCache(testService);
      expect(cached).not.toBeNull();
      expect(Object.keys(cached!.modules)).toHaveLength(2);
      expect(cached!.modules["server.mjs"]).toContain("start");
      expect(cached!.modules["client.mjs"]).toContain("createClient");
    });
  });

  describe("readServiceCache with corrupt data", () => {
    const testService = `test-corrupt-${Date.now()}`;

    afterEach(async () => {
      await invalidateServiceCache(testService);
    });

    test("returns null when cache.json is invalid JSON", async () => {
      const cacheDir = getAnycliCacheDir(testService);
      await fs.mkdir(cacheDir, { recursive: true });
      await fs.writeFile(path.join(cacheDir, "cache.json"), "NOT VALID JSON{{{", "utf8");

      const result = await readServiceCache(testService);
      expect(result).toBeNull();
    });
  });

  describe("invalidateServiceCache", () => {
    test("removes the cache directory", async () => {
      const testService = `test-invalidate-${Date.now()}`;
      const cache = makeServiceCache({ service: testService });
      await writeServiceCache(testService, cache);

      // Verify cache exists
      const cached = await readServiceCache(testService);
      expect(cached).not.toBeNull();

      // Invalidate
      await invalidateServiceCache(testService);

      // Verify gone
      const afterInvalidate = await readServiceCache(testService);
      expect(afterInvalidate).toBeNull();
    });

    test("does not throw when cache does not exist", async () => {
      await expect(
        invalidateServiceCache("nonexistent-" + Date.now())
      ).resolves.toBeUndefined();
    });
  });

  describe("listCachedServices", () => {
    const testServices = [
      `test-list-a-${Date.now()}`,
      `test-list-b-${Date.now()}`,
    ];

    afterEach(async () => {
      for (const svc of testServices) {
        await invalidateServiceCache(svc);
      }
    });

    test("lists services that have been cached", async () => {
      for (const svc of testServices) {
        await writeServiceCache(svc, makeServiceCache({ service: svc }));
      }

      const services = await listCachedServices();
      for (const svc of testServices) {
        expect(services).toContain(svc);
      }
    });

    test("returns empty array when no cache directory exists", async () => {
      // This test relies on the base dir potentially not existing for a
      // unique prefix. We just verify it doesn't throw and returns an array.
      const services = await listCachedServices();
      expect(Array.isArray(services)).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Command template tests
// ---------------------------------------------------------------------------

describe("prompts/commandTemplates - anycli", () => {
  test("renderCommandTemplate('anycli', ...) produces non-empty output", () => {
    const output = renderCommandTemplate("anycli", {
      serviceName: "trello",
      scope: "boards,cards",
      mcpMode: "true",
      transport: "stdio",
      authFile: "",
      userPrompt: "",
    });

    expect(output).toBeDefined();
    expect(output.length).toBeGreaterThan(0);
  });

  test("template includes service name in output", () => {
    const output = renderCommandTemplate("anycli", {
      serviceName: "github",
      scope: "repos",
      mcpMode: "",
      transport: "",
      authFile: "",
      userPrompt: "",
    });

    expect(output).toContain("github");
  });

  test("template includes MCP-specific sections when mcpMode is truthy", () => {
    const output = renderCommandTemplate("anycli", {
      serviceName: "stripe",
      scope: "*",
      mcpMode: "true",
      transport: "stdio",
      authFile: "",
      userPrompt: "",
    });

    expect(output).toContain("MCP");
  });

  test("template includes transport-specific content in MCP mode", () => {
    const withMcp = renderCommandTemplate("anycli", {
      serviceName: "stripe",
      scope: "*",
      mcpMode: "true",
      transport: "stdio",
      authFile: "",
      userPrompt: "",
    });

    const withoutMcp = renderCommandTemplate("anycli", {
      serviceName: "stripe",
      scope: "*",
      mcpMode: "",
      transport: "",
      authFile: "",
      userPrompt: "",
    });

    expect(withMcp).toContain("transport");
    expect(withoutMcp).toContain("ad-hoc");
  });

  test("template includes auth file path when provided", () => {
    const output = renderCommandTemplate("anycli", {
      serviceName: "slack",
      scope: "chat",
      mcpMode: "",
      transport: "",
      authFile: "/path/to/auth.env",
      userPrompt: "",
    });

    expect(output).toContain("/path/to/auth.env");
  });

  test("template includes user prompt when provided", () => {
    const output = renderCommandTemplate("anycli", {
      serviceName: "jira",
      scope: "issues",
      mcpMode: "",
      transport: "",
      authFile: "",
      userPrompt: "list all open bugs",
    });

    expect(output).toContain("list all open bugs");
  });
});
