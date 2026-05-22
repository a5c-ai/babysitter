import { afterEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { ProcessDefinitionReport } from "../utils";
import { recoverReportedProcessDefinition } from "./recovery";

describe("recoverReportedProcessDefinition", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(
      tempDirs.map(async (dir) => {
        await fs.rm(dir, { recursive: true, force: true });
      }),
    );
    tempDirs.length = 0;
  });

  it("does not reuse unrelated preexisting process files from the output directory", async () => {
    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "plan-process-recovery-"));
    tempDirs.push(workspace);
    const outputDir = path.join(workspace, ".a5c", "processes");
    const staleProcessPath = path.join(outputDir, "add-hook-discovery.js");
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(
      staleProcessPath,
      'export async function process() { return "stale"; }\n',
      "utf8",
    );

    const state: { report?: ProcessDefinitionReport } = {};
    const recovered = await recoverReportedProcessDefinition({
      state,
      outputDir,
      workspace,
      outputs: ["I thought about the process, but I did not write or report one."],
      verbose: false,
      json: false,
    });

    expect(recovered).toBeUndefined();
    expect(state.report).toBeUndefined();
  });
});
