import { promises as fs } from "fs";
import path from "path";
import { INPUTS_FILE, RUN_METADATA_FILE, STATE_DIR } from "./paths";
import { RunMetadata } from "./types";
import { writeFileAtomic } from "./atomic";

const OUTPUT_FILE = "output.json";

export async function readRunMetadata(runDir: string): Promise<RunMetadata> {
  const metadataPath = path.join(runDir, RUN_METADATA_FILE);
  const raw = await fs.readFile(metadataPath, "utf8");
  return JSON.parse(raw) as RunMetadata;
}

export async function readRunInputs(runDir: string): Promise<unknown> {
  const inputsPath = path.join(runDir, INPUTS_FILE);
  try {
    const raw = await fs.readFile(inputsPath, "utf8");
    return JSON.parse(raw) as unknown;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

export async function writeRunOutput(runDir: string, output: unknown) {
  const stateDir = path.join(runDir, STATE_DIR);
  await fs.mkdir(stateDir, { recursive: true });
  const outputPath = path.join(stateDir, OUTPUT_FILE);
  await writeFileAtomic(outputPath, JSON.stringify(output, null, 2) + "\n");
  return path.relative(runDir, outputPath).replace(/\\/g, "/");
}
