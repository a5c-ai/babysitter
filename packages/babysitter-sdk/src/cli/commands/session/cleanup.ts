import {
  runSessionCleanup,
  type SessionCleanupArgs,
} from "../../../session/cleanup";

export async function handleSessionCleanup(
  args: SessionCleanupArgs & { json?: boolean },
): Promise<number> {
  const result = await runSessionCleanup(args);
  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(
      `[session:cleanup] dryRun=${result.dryRun} markersRemoved=${result.markersRemoved.length} statesDeactivated=${result.statesDeactivated.length}`,
    );
    for (const file of result.markersRemoved) {
      console.log(`  marker: ${file}`);
    }
    for (const sessionId of result.statesDeactivated) {
      console.log(`  deactivated: ${sessionId}`);
    }
  }
  return 0;
}
