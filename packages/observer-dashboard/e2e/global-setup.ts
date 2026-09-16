import { generateFixtures } from "./fixtures/generate-fixtures";

/**
 * Playwright global setup: ensure the generated e2e fixture runs exist before
 * any spec (or the warmup project) touches the dashboard.
 *
 * Generated run dirs are NOT committed — only the hand-authored 01KTEST*
 * fixtures are tracked. Generation is deterministic (seeded PRNG, fixed
 * clock), so this always reproduces the exact canonical run set that specs
 * pin IDs against, and it is idempotent: when the manifest and every run it
 * lists are already on disk, it is a no-op.
 */
export default async function globalSetup(): Promise<void> {
  const result = await generateFixtures({ force: false });
  if (result.skipped) {
    console.log("[e2e fixtures] already present — generation skipped");
  } else {
    console.log(
      `[e2e fixtures] generated ${result.generatedCount} runs (manifest runCount ${result.manifestRunCount})`
    );
  }
}
