import { describe, it, expect, vi, afterEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { callHook, discoverHooks } from "../dispatcher";

describe("discoverHooks", () => {
  const tempDirs: string[] = [];

  function makeTempDir(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hook-test-"));
    tempDirs.push(dir);
    return dir;
  }

  function createHookScript(dir: string, hookType: string, name: string): string {
    const hookDir = path.join(dir, ".a5c", "hooks", hookType);
    fs.mkdirSync(hookDir, { recursive: true });
    const filePath = path.join(hookDir, name);
    fs.writeFileSync(filePath, "#!/bin/sh\necho hello\n");
    return filePath;
  }

  afterEach(() => {
    vi.restoreAllMocks();
    for (const dir of tempDirs) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {
        // best-effort cleanup
      }
    }
    tempDirs.length = 0;
  });

  it("discovers hooks in project .a5c/hooks/<hookType>/ directory", async () => {
    const tmpDir = makeTempDir();
    createHookScript(tmpDir, "on-task-complete", "my-hook.sh");

    const hooks = await discoverHooks("on-task-complete", tmpDir);

    expect(hooks).toHaveLength(1);
    expect(hooks[0].name).toBe("my-hook.sh");
    expect(hooks[0].location).toBe("per-repo");
    expect(hooks[0].path).toContain("my-hook.sh");
  });

  it("discovers hooks in user ~/.a5c/hooks/<hookType>/ directory", async () => {
    const fakeHome = makeTempDir();

    const hookDir = path.join(fakeHome, ".a5c", "hooks", "on-task-complete");
    fs.mkdirSync(hookDir, { recursive: true });
    fs.writeFileSync(path.join(hookDir, "user-hook.sh"), "#!/bin/sh\necho user\n");

    const nonexistent = path.join(makeTempDir(), "nope");
    const hooks = await discoverHooks("on-task-complete", nonexistent, fakeHome);

    expect(hooks).toHaveLength(1);
    expect(hooks[0].name).toBe("user-hook.sh");
    expect(hooks[0].location).toBe("per-user");
    expect(hooks[0].path).toContain("user-hook.sh");
  });

  it("returns per-repo hooks before per-user hooks", async () => {
    const projectDir = makeTempDir();
    const fakeHome = makeTempDir();

    createHookScript(projectDir, "on-task-complete", "project-hook.sh");

    const userHookDir = path.join(fakeHome, ".a5c", "hooks", "on-task-complete");
    fs.mkdirSync(userHookDir, { recursive: true });
    fs.writeFileSync(path.join(userHookDir, "user-hook.sh"), "#!/bin/sh\necho user\n");

    const hooks = await discoverHooks("on-task-complete", projectDir, fakeHome);

    expect(hooks).toHaveLength(2);
    expect(hooks[0].location).toBe("per-repo");
    expect(hooks[1].location).toBe("per-user");
  });

  it("returns empty array when no hooks exist", async () => {
    const tmpDir = makeTempDir();

    const hooks = await discoverHooks("on-task-complete", tmpDir);

    expect(hooks).toEqual([]);
  });

  it("discovers plugin hooks from the unified plugin source tree", async () => {
    const repoRoot = makeTempDir();
    const worktree = path.join(repoRoot, "packages", "demo");
    fs.mkdirSync(worktree, { recursive: true });

    const pluginHook = path.join(
      repoRoot,
      "plugins",
      "babysitter-unified",
      "hooks",
      "on-task-complete.sh",
    );
    fs.mkdirSync(path.dirname(pluginHook), { recursive: true });
    fs.writeFileSync(pluginHook, "#!/bin/sh\necho plugin\n");

    const hooks = await discoverHooks("on-task-complete", worktree);

    expect(hooks).toHaveLength(1);
    expect(hooks[0].location).toBe("plugin");
    expect(hooks[0].path).toBe(pluginHook);
  });

  it("skips non-script files", async () => {
    const tmpDir = makeTempDir();

    const hookDir = path.join(tmpDir, ".a5c", "hooks", "on-task-complete");
    fs.mkdirSync(hookDir, { recursive: true });
    fs.writeFileSync(path.join(hookDir, "notes.txt"), "not a script");
    fs.writeFileSync(path.join(hookDir, "valid-hook.sh"), "#!/bin/sh\necho hi\n");

    const hooks = await discoverHooks("on-task-complete", tmpDir);

    expect(hooks).toHaveLength(1);
    expect(hooks[0].name).toBe("valid-hook.sh");
    expect(hooks.some((h) => h.name === "notes.txt")).toBe(false);
  });

  it("treats missing hooks and missing dispatcher as a no-op success", async () => {
    const tmpDir = makeTempDir();

    const result = await callHook({
      hookType: "on-task-complete",
      payload: { ok: true },
      cwd: tmpDir,
    });

    expect(result.success).toBe(true);
    expect(result.executedHooks).toEqual([]);
    expect(result.error).toBeUndefined();
  });
});
