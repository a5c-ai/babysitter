import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import path from "path";
import os from "os";
import { promises as fs, realpathSync } from "fs";
import { createRun } from "../createRun";
import { loadJournal } from "../../storage/journal";
import { readRunMetadata, readRunInputs } from "../../storage/runFiles";
import { DEFAULT_LAYOUT_VERSION } from "../../storage/paths";
import * as ulids from "../../storage/ulids";

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "sdk-create-run-"));
});

afterEach(async () => {
  vi.restoreAllMocks();
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

describe("createRun", () => {
  test("generates a run id, persists metadata, and appends RUN_CREATED", async () => {
    vi.spyOn(ulids, "nextUlid").mockReturnValue("01HZWTESTRUNID");
    const entryFile = path.join(tmpRoot, "processes", "pipeline.mjs");
    await fs.mkdir(path.dirname(entryFile), { recursive: true });
    await fs.writeFile(entryFile, "export async function handler() { return 'ok'; }");

    const result = await createRun({
      runsDir: tmpRoot,
      request: "ci/request-001",
      process: {
        processId: "ci/pipeline",
        importPath: entryFile,
        exportName: "handler",
      },
    });

    expect(result.runId).toBe("01HZWTESTRUNID");
    expect(result.runDir).toBe(path.join(tmpRoot, "01HZWTESTRUNID"));

    const metadata = await readRunMetadata(result.runDir);
    expect(metadata.runId).toBe("01HZWTESTRUNID");
    expect(metadata.processId).toBe("ci/pipeline");
    expect(metadata.request).toBe("ci/request-001");
    expect(metadata.entrypoint).toEqual({
      importPath: "../processes/pipeline.mjs",
      exportName: "handler",
    });
    expect(typeof metadata.createdAt).toBe("string");

    const journal = await loadJournal(result.runDir);
    expect(journal).toHaveLength(1);
    expect(journal[0].type).toBe("RUN_CREATED");
    expect(journal[0].data).toMatchObject({
      runId: "01HZWTESTRUNID",
      processId: "ci/pipeline",
      entrypoint: {
        importPath: "../processes/pipeline.mjs",
        exportName: "handler",
      },
    });
    expect(journal[0].data.inputsRef).toBeUndefined();
  });

  test("writes inputs.json and references it from the RUN_CREATED event", async () => {
    const entryFile = path.join(tmpRoot, "process.mjs");
    await fs.writeFile(entryFile, "export async function process() {}");

    const result = await createRun({
      runsDir: tmpRoot,
      process: {
        processId: "demo/process",
        importPath: entryFile,
      },
      inputs: { branch: "main", sha: "abc123" },
    });

    const metadata = await readRunMetadata(result.runDir);
    expect(metadata.entrypoint.exportName).toBe("process");

    const inputs = await readRunInputs(result.runDir);
    expect(inputs).toEqual({ branch: "main", sha: "abc123" });

    const journal = await loadJournal(result.runDir);
    expect(journal[0].data).toMatchObject({
      inputsRef: "inputs.json",
    });
  });

  test("includes prompt in RUN_CREATED event payload and run.json metadata", async () => {
    vi.spyOn(ulids, "nextUlid").mockReturnValue("01HZWPROMPTRUNID");
    const entryFile = path.join(tmpRoot, "processes", "prompted.mjs");
    await fs.mkdir(path.dirname(entryFile), { recursive: true });
    await fs.writeFile(entryFile, "export async function process() { return 'prompted'; }");

    const result = await createRun({
      runsDir: tmpRoot,
      request: "prompt-request",
      prompt: "Build a REST API with authentication",
      process: {
        processId: "ci/prompted",
        importPath: entryFile,
        exportName: "process",
      },
    });

    expect(result.runId).toBe("01HZWPROMPTRUNID");

    // Verify prompt is in run.json metadata
    const metadata = await readRunMetadata(result.runDir);
    expect(metadata.prompt).toBe("Build a REST API with authentication");
    expect(metadata.processId).toBe("ci/prompted");

    // Verify prompt is in RUN_CREATED journal event
    const journal = await loadJournal(result.runDir);
    expect(journal).toHaveLength(1);
    expect(journal[0].type).toBe("RUN_CREATED");
    expect(journal[0].data.prompt).toBe("Build a REST API with authentication");
  });

  test("omits prompt from RUN_CREATED event and run.json when not provided", async () => {
    vi.spyOn(ulids, "nextUlid").mockReturnValue("01HZWNOPROMPTRUN");
    const entryFile = path.join(tmpRoot, "processes", "noprompt.mjs");
    await fs.mkdir(path.dirname(entryFile), { recursive: true });
    await fs.writeFile(entryFile, "export async function handler() { return 'ok'; }");

    const result = await createRun({
      runsDir: tmpRoot,
      process: {
        processId: "ci/noprompt",
        importPath: entryFile,
        exportName: "handler",
      },
    });

    // Verify prompt is NOT in run.json metadata
    const metadata = await readRunMetadata(result.runDir);
    expect(metadata.prompt).toBeUndefined();

    // Verify prompt is NOT in RUN_CREATED journal event
    const journal = await loadJournal(result.runDir);
    expect(journal).toHaveLength(1);
    expect(journal[0].type).toBe("RUN_CREATED");
    expect(journal[0].data.prompt).toBeUndefined();
    expect("prompt" in journal[0].data).toBe(false);
  });

  test("returns an absolute runDir even when runsDir is relative", async () => {
    const workspace = await fs.mkdtemp(path.join(tmpRoot, "relative-runsdir-"));
    const originalCwd = process.cwd();
    process.chdir(workspace);

    try {
      const entryFile = path.join(workspace, "process.mjs");
      await fs.writeFile(entryFile, "export async function process() {}");

      const result = await createRun({
        runsDir: path.join(".a5c", "runs"),
        process: {
          processId: "relative/run-dir",
          importPath: entryFile,
        },
      });

      expect(path.isAbsolute(result.runDir)).toBe(true);
      // Use realpathSync to normalize symlinks (macOS /var -> /private/var)
      const realWorkspace = realpathSync(workspace);
      expect(realpathSync(result.runDir)).toBe(path.join(realWorkspace, ".a5c", "runs", result.runId));
    } finally {
      process.chdir(originalCwd);
    }
  });
});
