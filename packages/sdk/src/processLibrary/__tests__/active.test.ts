import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  ensureActiveProcessLibrary,
  getDefaultProcessLibrarySpec,
  resolveActiveProcessLibrary,
} from "../active";

const ENV_KEYS = [
  "BABYSITTER_GLOBAL_STATE_DIR",
  "BABYSITTER_PROCESS_LIBRARY_REPO",
  "BABYSITTER_PROCESS_LIBRARY_REF",
  "BABYSITTER_PROCESS_LIBRARY_SUBPATH",
  "BABYSITTER_PROCESS_LIBRARY_REFERENCE_SUBPATH",
] as const;

function runGit(args: string[], cwd: string): void {
  execFileSync("git", args, {
    cwd,
    stdio: "pipe",
    encoding: "utf8",
  });
}

async function seedProcessLibraryRepo(repoRoot: string): Promise<void> {
  await fs.mkdir(path.join(repoRoot, "library", "reference"), { recursive: true });
  await fs.writeFile(
    path.join(repoRoot, "library", "reference", "README.md"),
    "# test library\n",
    "utf8",
  );
  runGit(["init"], repoRoot);
  runGit(["config", "user.name", "Babysitter Test"], repoRoot);
  runGit(["config", "user.email", "test@example.com"], repoRoot);
  runGit(["add", "."], repoRoot);
  runGit(["commit", "-m", "seed process library"], repoRoot);
}

afterEach(() => {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
});

describe("processLibrary active defaults", () => {
  it("derives the shared default clone paths from the global state dir", () => {
    process.env.BABYSITTER_GLOBAL_STATE_DIR = path.join(os.tmpdir(), "a5c-global-state");

    const spec = getDefaultProcessLibrarySpec();

    expect(spec.stateDir).toBe(path.join(os.tmpdir(), "a5c-global-state"));
    expect(spec.cloneDir).toBe(
      path.join(os.tmpdir(), "a5c-global-state", "process-library", "babysitter-repo"),
    );
    expect(spec.processRoot).toBe(
      path.join(
        os.tmpdir(),
        "a5c-global-state",
        "process-library",
        "babysitter-repo",
        "library",
      ),
    );
  });

  it("bootstraps and reuses the shared active process library", async () => {
    const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "process-library-active-"));
    const stateDir = path.join(tmpRoot, "global-state");
    const repoRoot = path.join(tmpRoot, "process-library-source");

    try {
      await fs.mkdir(repoRoot, { recursive: true });
      await seedProcessLibraryRepo(repoRoot);

      process.env.BABYSITTER_GLOBAL_STATE_DIR = stateDir;
      process.env.BABYSITTER_PROCESS_LIBRARY_REPO = repoRoot;

      const first = await ensureActiveProcessLibrary();
      expect(first.bootstrapped).toBe(true);
      expect(first.stateFile).toBe(path.join(stateDir, "active", "process-library.json"));
      expect(first.binding?.dir).toBe(
        path.join(stateDir, "process-library", "babysitter-repo", "library"),
      );

      const second = await ensureActiveProcessLibrary();
      expect(second.bootstrapped).toBe(false);
      expect(second.binding?.dir).toBe(first.binding?.dir);

      const resolved = await resolveActiveProcessLibrary();
      expect(resolved.binding?.dir).toBe(first.binding?.dir);
    } finally {
      await fs.rm(tmpRoot, { recursive: true, force: true });
    }
  });
});
