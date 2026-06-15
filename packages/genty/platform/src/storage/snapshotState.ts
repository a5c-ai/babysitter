import { getClockIsoString } from "./clock";
import { getStateFile } from "./paths";
import { writeFileAtomic } from "./atomic";
import type { SnapshotStateOptions } from "./types";

export async function snapshotState(options: SnapshotStateOptions) {
  const payload = {
    journalHead: options.journalHead ?? null,
    savedAt: getClockIsoString(),
    state: options.state,
  };
  await writeFileAtomic(getStateFile(options.runDir), JSON.stringify(payload, null, 2) + "\n");
  return payload;
}
