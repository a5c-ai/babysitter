import { describe, it, expect, afterEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { addRule, removeRule, listRules, readRules, writeRules } from "../rules";
import type { BreakpointRule } from "../types";
import { BREAKPOINT_RULES_SCHEMA_VERSION } from "../types";

describe("rules CRUD", () => {
  const tempDirs: string[] = [];

  function makeTempRulesPath(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bp-rules-test-"));
    tempDirs.push(dir);
    return path.join(dir, "rules.json");
  }

  function makeRule(overrides?: Partial<BreakpointRule>): BreakpointRule {
    return {
      id: overrides?.id ?? "rule-1",
      pattern: overrides?.pattern ?? "confirm.*",
      action: overrides?.action ?? "auto-approve",
      createdAt: overrides?.createdAt ?? "2026-01-01T00:00:00Z",
      createdBy: overrides?.createdBy ?? "test",
      ...overrides,
    };
  }

  afterEach(() => {
    for (const dir of tempDirs) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {
        // best-effort cleanup
      }
    }
    tempDirs.length = 0;
  });

  it("returns empty array when rules file doesn't exist", async () => {
    const rulesPath = path.join(os.tmpdir(), "nonexistent-" + Date.now(), "rules.json");
    const rules = await readRules(rulesPath);
    expect(rules).toEqual([]);
  });

  it("writes and reads rules with schema version", async () => {
    const rulesPath = makeTempRulesPath();
    const rules = [makeRule()];
    await writeRules(rules, rulesPath);

    const raw = JSON.parse(fs.readFileSync(rulesPath, "utf-8"));
    expect(raw.schemaVersion).toBe(BREAKPOINT_RULES_SCHEMA_VERSION);
    expect(raw.rules).toHaveLength(1);

    const read = await readRules(rulesPath);
    expect(read).toHaveLength(1);
    expect(read[0].id).toBe("rule-1");
  });

  it("addRule appends and deduplicates by id", async () => {
    const rulesPath = makeTempRulesPath();
    await addRule(makeRule({ id: "r1", pattern: "foo.*" }), rulesPath);
    await addRule(makeRule({ id: "r2", pattern: "bar.*" }), rulesPath);

    let rules = await listRules(rulesPath);
    expect(rules).toHaveLength(2);

    // Dedup: overwrite r1
    await addRule(makeRule({ id: "r1", pattern: "baz.*" }), rulesPath);
    rules = await listRules(rulesPath);
    expect(rules).toHaveLength(2);
    expect(rules.find(r => r.id === "r1")?.pattern).toBe("baz.*");
  });

  it("removeRule removes by id", async () => {
    const rulesPath = makeTempRulesPath();
    await addRule(makeRule({ id: "r1" }), rulesPath);
    await addRule(makeRule({ id: "r2" }), rulesPath);

    const after = await removeRule("r1", rulesPath);
    expect(after).toHaveLength(1);
    expect(after[0].id).toBe("r2");
  });

  it("removeRule is a no-op for nonexistent id", async () => {
    const rulesPath = makeTempRulesPath();
    await addRule(makeRule({ id: "r1" }), rulesPath);

    const after = await removeRule("nope", rulesPath);
    expect(after).toHaveLength(1);
  });
});
