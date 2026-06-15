import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { fileURLToPath } from "node:url";
import {
  validateProfile,
  validateProfileFile,
  validateAllProfiles,
} from "../client/profile-validator.js";
import type { ResponderProfile } from "../types.js";

// ────────────────────────────────────────────────────────────────────────────
// Factories
// ────────────────────────────────────────────────────────────────────────────

function makeValidProfile(overrides: Partial<ResponderProfile> = {}): ResponderProfile {
  return {
    id: "resp-001",
    name: "Tal M",
    title: "Senior Engineer",
    domains: ["backend"],
    tags: ["performance"],
    availability: true,
    responseTimeSla: 3600,
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

let tmpDir: string;
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(currentDir, "../..");
const packagedResponderDir = path.join(packageRoot, "responder");

async function createTmpDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "profile-validator-test-"));
}

async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("ProfileValidator", () => {
  beforeEach(async () => {
    tmpDir = await createTmpDir();
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  // ── validateProfile ─────────────────────────────────────────────────────

  describe("validateProfile()", () => {
    it("should return valid=true for a valid profile", () => {
      const result = validateProfile(makeValidProfile());

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.profile).toBeDefined();
    });

    it("should return valid=false for empty object", () => {
      const result = validateProfile({});

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should return valid=false for missing required fields", () => {
      const result = validateProfile({ id: "test" });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should return valid=false for invalid types", () => {
      const result = validateProfile({
        id: "test",
        name: "Test",
        title: "Engineer",
        domains: "not-an-array", // should be array
        tags: [],
        availability: true,
        responseTimeSla: 3600,
      });

      expect(result.valid).toBe(false);
    });

    it("should return valid=false for negative responseTimeSla", () => {
      const result = validateProfile(makeValidProfile({ responseTimeSla: -1 }));

      expect(result.valid).toBe(false);
    });

    it("should accept optional publicKeyFingerprint", () => {
      const result = validateProfile(makeValidProfile({ publicKeyFingerprint: "SHA256:abc" }));

      expect(result.valid).toBe(true);
      expect(result.profile?.publicKeyFingerprint).toBe("SHA256:abc");
    });

    it("should return the parsed profile on success", () => {
      const result = validateProfile(makeValidProfile({ id: "custom-id" }));

      expect(result.profile?.id).toBe("custom-id");
    });

    it("should return valid=false for null input", () => {
      const result = validateProfile(null);
      expect(result.valid).toBe(false);
    });

    it("should return valid=false for string input", () => {
      const result = validateProfile("not a profile");
      expect(result.valid).toBe(false);
    });
  });

  // ── validateProfileFile ─────────────────────────────────────────────────

  describe("validateProfileFile()", () => {
    it("should validate a valid JSON profile file", async () => {
      const filePath = path.join(tmpDir, "tal.json");
      await writeJsonFile(filePath, makeValidProfile());

      const result = await validateProfileFile(filePath);

      expect(result.valid).toBe(true);
      expect(result.filePath).toBe(filePath);
      expect(result.profile?.id).toBe("resp-001");
    });

    it("should return valid=false for malformed JSON", async () => {
      const filePath = path.join(tmpDir, "bad.json");
      await fs.writeFile(filePath, "this is not json{{{", "utf-8");

      const result = await validateProfileFile(filePath);

      expect(result.valid).toBe(false);
      expect(result.filePath).toBe(filePath);
      expect(result.errors[0]).toContain("Failed to parse JSON");
    });

    it("should return valid=false for invalid profile data", async () => {
      const filePath = path.join(tmpDir, "invalid.json");
      await writeJsonFile(filePath, { foo: "bar" });

      const result = await validateProfileFile(filePath);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should return valid=false for nonexistent file", async () => {
      const result = await validateProfileFile(path.join(tmpDir, "nonexistent.json"));

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("Failed to read file");
    });

    it("should include filePath in the result", async () => {
      const filePath = path.join(tmpDir, "test.json");
      await writeJsonFile(filePath, makeValidProfile());

      const result = await validateProfileFile(filePath);

      expect(result.filePath).toBe(filePath);
    });
  });

  // ── validateAllProfiles ─────────────────────────────────────────────────

  describe("validateAllProfiles()", () => {
    it("should validate all JSON files in a directory", async () => {
      await writeJsonFile(path.join(tmpDir, "tal.json"), makeValidProfile({ id: "tal" }));
      await writeJsonFile(path.join(tmpDir, "alice.json"), makeValidProfile({ id: "alice" }));

      const result = await validateAllProfiles(tmpDir);

      expect(result.valid).toBe(true);
      expect(result.totalProfiles).toBe(2);
      expect(result.validProfiles).toBe(2);
      expect(result.invalidProfiles).toBe(0);
    });

    it("should report invalid profiles", async () => {
      await writeJsonFile(path.join(tmpDir, "good.json"), makeValidProfile());
      await writeJsonFile(path.join(tmpDir, "bad.json"), { foo: "bar" });

      const result = await validateAllProfiles(tmpDir);

      expect(result.valid).toBe(false);
      expect(result.totalProfiles).toBe(2);
      expect(result.validProfiles).toBe(1);
      expect(result.invalidProfiles).toBe(1);
    });

    it("should return valid=false when directory does not exist", async () => {
      const result = await validateAllProfiles("/nonexistent/directory");

      expect(result.valid).toBe(false);
      expect(result.results[0].errors[0]).toContain("Directory not found");
    });

    it("should return valid=false when directory has no JSON files", async () => {
      const emptyDir = path.join(tmpDir, "empty");
      await fs.mkdir(emptyDir);

      const result = await validateAllProfiles(emptyDir);

      expect(result.valid).toBe(false);
      expect(result.totalProfiles).toBe(0);
    });

    it("should ignore non-JSON files", async () => {
      await writeJsonFile(path.join(tmpDir, "profile.json"), makeValidProfile());
      await fs.writeFile(path.join(tmpDir, "readme.txt"), "ignore me", "utf-8");
      await fs.writeFile(path.join(tmpDir, "config.yaml"), "key: value", "utf-8");

      const result = await validateAllProfiles(tmpDir);

      expect(result.totalProfiles).toBe(1);
    });

    it("should ignore schema.json file", async () => {
      await writeJsonFile(path.join(tmpDir, "profile.json"), makeValidProfile());
      await writeJsonFile(path.join(tmpDir, "schema.json"), { "$schema": "..." });

      const result = await validateAllProfiles(tmpDir);

      expect(result.totalProfiles).toBe(1);
    });

    it("should return results for each file", async () => {
      await writeJsonFile(path.join(tmpDir, "a.json"), makeValidProfile({ id: "a" }));
      await writeJsonFile(path.join(tmpDir, "b.json"), makeValidProfile({ id: "b" }));

      const result = await validateAllProfiles(tmpDir);

      expect(result.results).toHaveLength(2);
      expect(result.results.every((r) => r.valid)).toBe(true);
    });

    it("validates the packaged responder examples exactly as shipped", async () => {
      const result = await validateAllProfiles(packagedResponderDir);

      expect(result.valid).toBe(true);
      expect(result.totalProfiles).toBe(3);
      expect(result.invalidProfiles).toBe(0);
      expect(result.results.map((entry) => entry.profile?.id).sort()).toEqual([
        "backend-responder",
        "devops-responder",
        "frontend-responder",
      ]);
    });
  });

  describe("packaging metadata", () => {
    it("ships the responder examples in package.json", async () => {
      const raw = await fs.readFile(path.join(packageRoot, "package.json"), "utf-8");
      const packageJson = JSON.parse(raw) as { files?: string[] };

      expect(packageJson.files).toContain("responder");
    });
  });
});
