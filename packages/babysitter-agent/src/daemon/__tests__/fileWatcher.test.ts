/**
 * GAP-REMOTE-001: Daemon Mode — File Watcher TDD Red Phase
 *
 * Tests for createFileWatcher (debounced file-system trigger).
 * Covers AC-004 (file watcher triggers with debounce).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";

// Imports from the module under test (will fail until implementation -- that's TDD).
import { createFileWatcher } from "../fileWatcher";
import type {
  FileTriggerConfig,
  FileTriggerEvent,
  FileWatcherHandle,
  TriggerCallback,
} from "../types";

// -- Helpers ------------------------------------------------------------------

function tmpDir(): string {
  return path.join(os.tmpdir(), `gap-remote-001-watcher-${crypto.randomUUID()}`);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function collectTriggers(
  count: number,
  timeoutMs = 5000,
): {
  callback: TriggerCallback;
  promise: Promise<FileTriggerEvent[]>;
} {
  const events: FileTriggerEvent[] = [];
  let resolve: (v: typeof events) => void;
  let reject: (e: Error) => void;

  const promise = new Promise<typeof events>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const timer = setTimeout(() => {
    reject(new Error(`Timeout waiting for ${count} triggers, got ${events.length}`));
  }, timeoutMs);

  const callback: TriggerCallback = (trigger) => {
    if (trigger.type === "automation") {
      return;
    }
    events.push(trigger);
    if (events.length >= count) {
      clearTimeout(timer);
      resolve(events);
    }
  };

  return { callback, promise };
}

// -- Test Suite ---------------------------------------------------------------

describe("GAP-REMOTE-001: File Watcher", () => {
  let testDir: string;
  let handles: FileWatcherHandle[];

  beforeEach(async () => {
    testDir = tmpDir();
    await fs.mkdir(testDir, { recursive: true });
    handles = [];
  });

  afterEach(async () => {
    // Dispose all watcher handles
    for (const h of handles) {
      try {
        h.dispose();
      } catch {
        // best-effort cleanup
      }
    }
    await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
  });

  // -- AC-004: File watcher triggers with debounce --------------------------

  describe("AC-004: file watcher triggers", () => {
    it("returns a handle with a dispose method", () => {
      const triggers: FileTriggerConfig[] = [
        {
          pattern: "**/*.ts",
          processId: "lint",
          entrypoint: "lint.js#process",
        },
      ];

      const handle = createFileWatcher(triggers, () => {});
      handles.push(handle);

      expect(handle).toBeDefined();
      expect(typeof handle.dispose).toBe("function");
    });

    it("fires callback when a matching file is created", async () => {
      const watchDir = path.join(testDir, "src");
      await fs.mkdir(watchDir, { recursive: true });

      const triggers: FileTriggerConfig[] = [
        {
          pattern: path.join(watchDir, "**/*.ts"),
          processId: "compile",
          entrypoint: "compile.js#process",
        },
      ];

      const { callback, promise } = collectTriggers(1);
      const handle = createFileWatcher(triggers, callback);
      handles.push(handle);

      // Create a matching file
      await fs.writeFile(path.join(watchDir, "index.ts"), "export {}");

      const events = await promise;
      expect(events).toHaveLength(1);
      expect(events[0].processId).toBe("compile");
      expect(events[0].entrypoint).toBe("compile.js#process");
    });

    it("does not fire for non-matching files", async () => {
      const watchDir = path.join(testDir, "src-no-match");
      await fs.mkdir(watchDir, { recursive: true });

      const triggers: FileTriggerConfig[] = [
        {
          pattern: path.join(watchDir, "**/*.ts"),
          processId: "compile",
          entrypoint: "compile.js#process",
        },
      ];

      const triggerSpy = vi.fn();
      const handle = createFileWatcher(triggers, triggerSpy);
      handles.push(handle);

      // Create a non-matching file
      await fs.writeFile(path.join(watchDir, "readme.md"), "# Hello");

      // Wait enough time for any erroneous trigger to fire
      await delay(300);

      expect(triggerSpy).not.toHaveBeenCalled();
    });

    it("debounces rapid file changes", async () => {
      const watchDir = path.join(testDir, "src-debounce");
      await fs.mkdir(watchDir, { recursive: true });

      const triggers: FileTriggerConfig[] = [
        {
          pattern: path.join(watchDir, "**/*.ts"),
          processId: "build",
          entrypoint: "build.js#process",
          debounceMs: 200,
        },
      ];

      const triggerSpy = vi.fn();
      const handle = createFileWatcher(triggers, triggerSpy);
      handles.push(handle);

      // Rapid writes to the same file
      const filePath = path.join(watchDir, "rapid.ts");
      await fs.writeFile(filePath, "v1");
      await delay(50);
      await fs.writeFile(filePath, "v2");
      await delay(50);
      await fs.writeFile(filePath, "v3");

      // Wait for debounce to settle
      await delay(500);

      // Should have fired only once (or at most a small number) due to debounce
      expect(triggerSpy.mock.calls.length).toBeLessThanOrEqual(2);
      expect(triggerSpy.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    it("supports multiple trigger patterns simultaneously", async () => {
      const srcDir = path.join(testDir, "multi-src");
      const testDirInner = path.join(testDir, "multi-test");
      await fs.mkdir(srcDir, { recursive: true });
      await fs.mkdir(testDirInner, { recursive: true });

      const triggers: FileTriggerConfig[] = [
        {
          pattern: path.join(srcDir, "**/*.ts"),
          processId: "compile",
          entrypoint: "compile.js#process",
        },
        {
          pattern: path.join(testDirInner, "**/*.test.ts"),
          processId: "test",
          entrypoint: "test.js#process",
        },
      ];

      const { callback, promise } = collectTriggers(2, 5000);
      const handle = createFileWatcher(triggers, callback);
      handles.push(handle);

      // Trigger both patterns
      await fs.writeFile(path.join(srcDir, "app.ts"), "export {}");
      await delay(100);
      await fs.writeFile(
        path.join(testDirInner, "app.test.ts"),
        "test('x', () => {})",
      );

      const events = await promise;
      const processIds = events.map((e) => e.processId);
      expect(processIds).toContain("compile");
      expect(processIds).toContain("test");
    });

    it("cleans up watchers on dispose", async () => {
      const watchDir = path.join(testDir, "src-dispose");
      await fs.mkdir(watchDir, { recursive: true });

      const triggers: FileTriggerConfig[] = [
        {
          pattern: path.join(watchDir, "**/*.ts"),
          processId: "build",
          entrypoint: "build.js#process",
        },
      ];

      const triggerSpy = vi.fn();
      const handle = createFileWatcher(triggers, triggerSpy);

      // Dispose, then create a matching file
      handle.dispose();

      await fs.writeFile(path.join(watchDir, "after-dispose.ts"), "export {}");
      await delay(300);

      // Should not have fired after dispose
      expect(triggerSpy).not.toHaveBeenCalled();
    });
  });
});
