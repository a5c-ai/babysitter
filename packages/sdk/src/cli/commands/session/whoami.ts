import {
  runSessionWhoami,
  type SessionWhoamiArgs,
  type SessionWhoamiResult,
} from "../../../session/whoami";

export function handleSessionWhoami(
  args: SessionWhoamiArgs & { json?: boolean },
): number {
  const result: SessionWhoamiResult = runSessionWhoami(args);
  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`harness: ${result.harness}`);
    console.log(`sessionId: ${result.sessionId ?? "(none)"}`);
    console.log(`resolvedFrom: ${result.resolvedFrom}`);
    console.log(`ancestorPid: ${result.ancestorPid ?? "(none)"}`);
    console.log(`ancestorAlive: ${result.ancestorAlive ?? "(unknown)"}`);
    console.log(`markerPath: ${result.markerPath ?? "(none)"}`);
    console.log(`envFilePath: ${result.envFilePath ?? "(none)"}`);
    console.log(`envVarPresent: ${result.envVarPresent}`);
    console.log(`envVarMatches: ${result.envVarMatches ?? "(n/a)"}`);
  }
  return 0;
}
