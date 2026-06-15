import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  getSessionContext,
  updateSessionContext,
  getSessionContextPath,
} from "../context";
import type { SessionContext } from "../types";

describe("GAP-SESSION-001: Session Context Persistence", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `session-context-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
  });

  describe("getSessionContextPath", () => {
    it("returns path alongside session state file", () => {
      const p = getSessionContextPath(testDir, "sess-123");
      expect(p).toContain("sess-123");
      expect(p.endsWith(".context.json")).toBe(true);
    });
  });

  describe("getSessionContext", () => {
    it("returns empty context when file does not exist", async () => {
      const ctx = await getSessionContext(testDir, "nonexistent");
      expect(ctx.notes).toEqual([]);
      expect(ctx.sharedKnowledge).toEqual({});
    });

    it("returns empty context when file contains corrupt JSON", async () => {
      const contextPath = getSessionContextPath(testDir, "sess-corrupt");
      await fs.writeFile(contextPath, "not valid json {{{", "utf8");

      const ctx = await getSessionContext(testDir, "sess-corrupt");
      expect(ctx.notes).toEqual([]);
      expect(ctx.sharedKnowledge).toEqual({});
    });

    it("reads existing context from file", async () => {
      const contextPath = getSessionContextPath(testDir, "sess-1");
      const data: SessionContext = {
        notes: ["found bug in auth"],
        sharedKnowledge: { authMethod: "OAuth2" },
        worktree: { workspacePath: "/repo/worktrees/task-1", mode: "worktree" },
      };
      await fs.writeFile(contextPath, JSON.stringify(data), "utf8");

      const ctx = await getSessionContext(testDir, "sess-1");
      expect(ctx.notes).toEqual(["found bug in auth"]);
      expect(ctx.sharedKnowledge).toEqual({ authMethod: "OAuth2" });
      expect(ctx.worktree).toEqual({ workspacePath: "/repo/worktrees/task-1", mode: "worktree" });
    });
  });

  describe("updateSessionContext", () => {
    it("creates context file when it does not exist", async () => {
      await updateSessionContext(testDir, "sess-new", {
        notes: ["first note"],
      });

      const ctx = await getSessionContext(testDir, "sess-new");
      expect(ctx.notes).toEqual(["first note"]);
    });

    it("merges updates with existing context", async () => {
      await updateSessionContext(testDir, "sess-merge", {
        notes: ["note 1"],
        sharedKnowledge: { key1: "val1" },
      });

      await updateSessionContext(testDir, "sess-merge", {
        notes: ["note 2"],
        sharedKnowledge: { key2: "val2" },
      });

      const ctx = await getSessionContext(testDir, "sess-merge");
      expect(ctx.notes).toEqual(["note 1", "note 2"]);
      expect(ctx.sharedKnowledge).toEqual({ key1: "val1", key2: "val2" });
    });

    it("appends notes rather than replacing", async () => {
      await updateSessionContext(testDir, "sess-append", {
        notes: ["a", "b"],
      });
      await updateSessionContext(testDir, "sess-append", {
        notes: ["c"],
      });

      const ctx = await getSessionContext(testDir, "sess-append");
      expect(ctx.notes).toEqual(["a", "b", "c"]);
    });

    it("merges sharedKnowledge keys", async () => {
      await updateSessionContext(testDir, "sess-knowledge", {
        sharedKnowledge: { a: "1" },
      });
      await updateSessionContext(testDir, "sess-knowledge", {
        sharedKnowledge: { b: "2", a: "updated" },
      });

      const ctx = await getSessionContext(testDir, "sess-knowledge");
      expect(ctx.sharedKnowledge).toEqual({ a: "updated", b: "2" });
    });

    it("merges worktree metadata without dropping existing fields", async () => {
      await updateSessionContext(testDir, "sess-worktree", {
        worktree: {
          workspacePath: "/repo/worktrees/task-1",
          mode: "worktree",
        },
      });
      await updateSessionContext(testDir, "sess-worktree", {
        worktree: {
          currentPath: "/repo/worktrees/task-1/packages/app",
          repoAlias: "app",
        },
      });

      const ctx = await getSessionContext(testDir, "sess-worktree");
      expect(ctx.worktree).toEqual({
        workspacePath: "/repo/worktrees/task-1",
        currentPath: "/repo/worktrees/task-1/packages/app",
        mode: "worktree",
        repoAlias: "app",
      });
    });
  });
});
