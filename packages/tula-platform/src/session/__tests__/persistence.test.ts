import { describe, it, expect, beforeEach } from "vitest";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  getSessionPersistentState,
  getSessionPersistentStatePath,
  addFinding,
  setPreference,
  recordFileModification,
  recordBreakpointInteraction,
  buildResumeContext,
  SESSION_PERSISTENT_SCHEMA_VERSION,
} from "../persistence";

describe("GAP-STATE-003: Session State Persistence", () => {
  let stateDir: string;
  const sessionId = "test-session";

  beforeEach(async () => {
    stateDir = await fs.mkdtemp(path.join(os.tmpdir(), "persistence-test-"));
  });

  describe("getSessionPersistentState", () => {
    it("returns empty defaults when file does not exist", async () => {
      const state = await getSessionPersistentState(stateDir, sessionId);
      expect(state.schemaVersion).toBe(SESSION_PERSISTENT_SCHEMA_VERSION);
      expect(state.findings).toEqual([]);
      expect(state.preferences).toEqual({});
      expect(state.fileModifications).toEqual([]);
      expect(state.breakpointPatterns).toEqual([]);
    });

    it("returns empty defaults on corrupt JSON", async () => {
      const filePath = getSessionPersistentStatePath(stateDir, sessionId);
      await fs.writeFile(filePath, "not json", "utf8");
      const state = await getSessionPersistentState(stateDir, sessionId);
      expect(state.findings).toEqual([]);
    });
  });

  describe("addFinding", () => {
    it("appends finding with auto-generated timestamp", async () => {
      await addFinding(stateDir, sessionId, { content: "Found pattern X", category: "pattern" });
      const state = await getSessionPersistentState(stateDir, sessionId);
      expect(state.findings).toHaveLength(1);
      expect(state.findings[0].content).toBe("Found pattern X");
      expect(state.findings[0].category).toBe("pattern");
      expect(state.findings[0].timestamp).toBeTruthy();
    });

    it("appends multiple findings", async () => {
      await addFinding(stateDir, sessionId, { content: "A", category: "bug" });
      await addFinding(stateDir, sessionId, { content: "B", category: "architecture", runId: "run-1" });
      const state = await getSessionPersistentState(stateDir, sessionId);
      expect(state.findings).toHaveLength(2);
      expect(state.findings[1].runId).toBe("run-1");
    });
  });

  describe("setPreference", () => {
    it("creates new preference", async () => {
      await setPreference(stateDir, sessionId, "theme", "dark");
      const state = await getSessionPersistentState(stateDir, sessionId);
      expect(state.preferences.theme).toBe("dark");
    });

    it("upserts existing preference", async () => {
      await setPreference(stateDir, sessionId, "lang", "en");
      await setPreference(stateDir, sessionId, "lang", "fr");
      const state = await getSessionPersistentState(stateDir, sessionId);
      expect(state.preferences.lang).toBe("fr");
    });
  });

  describe("recordFileModification", () => {
    it("appends file modification entry", async () => {
      await recordFileModification(stateDir, sessionId, { filePath: "src/index.ts", action: "modify" });
      const state = await getSessionPersistentState(stateDir, sessionId);
      expect(state.fileModifications).toHaveLength(1);
      expect(state.fileModifications[0].action).toBe("modify");
      expect(state.fileModifications[0].timestamp).toBeTruthy();
    });
  });

  describe("recordBreakpointInteraction", () => {
    it("creates new pattern on first call", async () => {
      await recordBreakpointInteraction(stateDir, sessionId, "confirm.deploy", "approved");
      const state = await getSessionPersistentState(stateDir, sessionId);
      expect(state.breakpointPatterns).toHaveLength(1);
      expect(state.breakpointPatterns[0].approvedCount).toBe(1);
      expect(state.breakpointPatterns[0].rejectedCount).toBe(0);
      expect(state.breakpointPatterns[0].lastAction).toBe("approved");
    });

    it("increments count on repeat calls", async () => {
      await recordBreakpointInteraction(stateDir, sessionId, "confirm.deploy", "approved");
      await recordBreakpointInteraction(stateDir, sessionId, "confirm.deploy", "approved");
      await recordBreakpointInteraction(stateDir, sessionId, "confirm.deploy", "rejected");
      const state = await getSessionPersistentState(stateDir, sessionId);
      expect(state.breakpointPatterns).toHaveLength(1);
      expect(state.breakpointPatterns[0].approvedCount).toBe(2);
      expect(state.breakpointPatterns[0].rejectedCount).toBe(1);
      expect(state.breakpointPatterns[0].lastAction).toBe("rejected");
    });

    it("tracks multiple breakpoint IDs independently", async () => {
      await recordBreakpointInteraction(stateDir, sessionId, "confirm.deploy", "approved");
      await recordBreakpointInteraction(stateDir, sessionId, "gate.quality", "rejected");
      const state = await getSessionPersistentState(stateDir, sessionId);
      expect(state.breakpointPatterns).toHaveLength(2);
    });
  });

  describe("buildResumeContext", () => {
    it("returns empty string when no data exists", async () => {
      const result = await buildResumeContext(stateDir, sessionId);
      expect(result).toBe("");
    });

    it("renders markdown with findings", async () => {
      await addFinding(stateDir, sessionId, { content: "Circular dep in utils", category: "architecture" });
      const result = await buildResumeContext(stateDir, sessionId);
      expect(result).toContain("## Session Context");
      expect(result).toContain("### Findings");
      expect(result).toContain("[architecture] Circular dep in utils");
    });

    it("renders preferences", async () => {
      await setPreference(stateDir, sessionId, "editor", "vim");
      const result = await buildResumeContext(stateDir, sessionId);
      expect(result).toContain("### Preferences");
      expect(result).toContain("**editor**: vim");
    });

    it("renders breakpoint patterns", async () => {
      await recordBreakpointInteraction(stateDir, sessionId, "confirm.deploy", "approved");
      const result = await buildResumeContext(stateDir, sessionId);
      expect(result).toContain("### Breakpoint Patterns");
      expect(result).toContain("`confirm.deploy`");
    });

    it("limits file modifications to last 10", async () => {
      for (let i = 0; i < 15; i++) {
        await recordFileModification(stateDir, sessionId, { filePath: `file${i}.ts`, action: "modify" });
      }
      const result = await buildResumeContext(stateDir, sessionId);
      expect(result).toContain("### Recent File Changes");
      // Should show last 10, not all 15
      expect(result).toContain("file14.ts");
      expect(result).not.toContain("file0.ts");
    });
  });
});
