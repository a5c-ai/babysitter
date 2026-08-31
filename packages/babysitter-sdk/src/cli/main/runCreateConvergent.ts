import path from "node:path";
import { createRunConvergent } from "../../runtime/createRunConvergent";
import { collapseDoubledA5cRuns } from "./args";
import { parseEntrypointSpecifier, validateProcessEntrypoint } from "./runSupport";
import type { ParsedArgs } from "./types";

const REQUIRED_FLAGS = [
  ["--run-id", "runIdOverride"],
  ["--request", "requestId"],
  ["--process-id", "processId"],
  ["--entry", "entrySpecifier"],
  ["--inputs", "inputsPath"],
  ["--canonical-input-sha256", "canonicalInputSha256"],
  ["--process-snapshot-sha256", "processSnapshotHash"],
  ["--replacement-session-id", "replacementSessionId"],
] as const;

export async function handleRunCreateConvergent(parsed: ParsedArgs): Promise<number> {
  const missing = REQUIRED_FLAGS
    .filter(([, field]) => parsed[field] === undefined)
    .map(([flag]) => flag);
  if (missing.length > 0) {
    console.error(`[run:create-convergent] missing required flags: ${missing.join(", ")}`);
    return 1;
  }
  const entry = parseEntrypointSpecifier(parsed.entrySpecifier ?? "");
  const processSnapshotPath = path.resolve(entry.importPath);
  await validateProcessEntrypoint(processSnapshotPath, entry.exportName);
  const result = await createRunConvergent({
    canonicalInputSha256: parsed.canonicalInputSha256 ?? "",
    expectedRunJsonSha256: parsed.expectedRunJsonSha256,
    harness: parsed.harness,
    inputsPath: path.resolve(parsed.inputsPath ?? ""),
    process: {
      exportName: entry.exportName,
      importPath: processSnapshotPath,
      processId: parsed.processId ?? "",
    },
    processRevision: parsed.processRevision,
    processSnapshotHash: parsed.processSnapshotHash ?? "",
    processSnapshotPath,
    prompt: parsed.prompt,
    replacementSessionId: parsed.replacementSessionId ?? "",
    request: parsed.requestId ?? "",
    runId: parsed.runIdOverride ?? "",
    runsDir: collapseDoubledA5cRuns(path.resolve(parsed.runsDir)),
  });
  if (parsed.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`[run:create-convergent] runId=${result.runId} completionMarkerPath=${result.completionMarkerPath}`);
  }
  return 0;
}
