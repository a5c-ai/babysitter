import { afterEach, beforeEach, describe, expect, test } from "vitest";
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import { createReplayEngine } from "../replay/createReplayEngine";
import { createTestRun } from "./testHelpers";
import { RunFailedError } from "../exceptions";
import { RUN_METADATA_FILE } from "../../storage/paths";
import { RunMetadata } from "../../storage/types";

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "babysitter-replay-engine-"));
});

afterEach(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

describe("createReplayEngine", () => {
  test("rejects runs with incompatible layout versions", async () => {
    const { runDir } = await createTestRun(tmpRoot, "replay-layout");
    const metadataPath = path.join(runDir, RUN_METADATA_FILE);
    const metadata = JSON.parse(await fs.readFile(metadataPath, "utf8")) as RunMetadata;
    await fs.writeFile(
      metadataPath,
      JSON.stringify({ ...metadata, layoutVersion: "2000.01" }, null, 2),
      "utf8"
    );

    await expect(createReplayEngine({ runDir })).rejects.toSatisfy((error) => {
      expect(error).toBeInstanceOf(RunFailedError);
      expect((error as RunFailedError).details).toMatchObject({
        actual: "2000.01",
      });
      return true;
    });
  });

  test("surfaces RunFailedError when journal parsing fails", async () => {
    const { runDir } = await createTestRun(tmpRoot, "replay-corrupt");
    const journalDir = path.join(runDir, "journal");
    await fs.writeFile(path.join(journalDir, "000001.BAD.json"), "{ invalid json");

    await expect(createReplayEngine({ runDir })).rejects.toSatisfy((error) => {
      expect(error).toBeInstanceOf(RunFailedError);
      expect((error as RunFailedError).details?.path).toContain("000001.BAD.json");
      return true;
    });
  });
});
