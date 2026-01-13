# Testing Utilities

The helpers in `packages/sdk/src/testing` provide a deterministic harness for exercising runs without the real orchestrator. They cover three pillars:

1. Seed clocks/ULIDs so every journal file, state snapshot, and effect invocation key is reproducible.
2. Spin up disposable run directories that already contain a `RUN_CREATED` event and cleaned-up tmp roots.
3. Capture structured snapshots plus per-iteration execution logs from the fake runner harness.

## Seeding clocks and ULIDs

```ts
import { installFixedClock, installDeterministicUlids } from "@a5c/babysitter-sdk/testing";

const clock = installFixedClock({ start: "2025-01-01T00:00:00Z", stepMs: 250 });
const ulids = installDeterministicUlids({ randomnessSeed: 42 });

// .. run your test ..

clock.restore();
ulids.restore();
```

- `installFixedClock` overrides the storage clock used by run metadata/journaling. Call `clock.apply()` when you need it active (helpers like the harness do this for you) and `clock.reset()` if you want to rewind without reallocating.
- `installDeterministicUlids` swaps the ULID factory used by journal writers. Pass `{ preset: [...] }` to replay a known sequence or rely on the deterministic Crockford-base32 generator.

## Deterministic run harness

```ts
import { createDeterministicRunHarness } from "@a5c/babysitter-sdk/testing";

const harness = await createDeterministicRunHarness({
  processSource: `
    export async function process(inputs, ctx) {
      return ctx.task(/* ... */);
    }
  `,
  inputs: { start: 1 },
});

try {
  await runToCompletionWithFakeRunner({
    runDir: harness.runDir,
    resolve,
    clock: harness.clock,
    ulids: harness.ulids,
  });
} finally {
  await harness.cleanup();
}
```

`createDeterministicRunHarness`:

- Accepts either `processPath` or inline `processSource`, spins up a disposable runs root, calls `createRunDir`, and appends `RUN_CREATED`.
- Installs deterministic clock/ULID providers that remain active until `cleanup()`.
- Returns `clock`/`ulids` handles you can pass into the fake runner harness or manage manually (call `reset()` if you start a brand-new run without reallocating the harness).

## Fake runner execution logs

`runToCompletionWithFakeRunner` now accepts two optional fields:

- `clock`: a handle from `installFixedClock` to keep `ctx.now()` deterministic.
- `ulids`: a handle from `installDeterministicUlids` so new journal entries keep using the seeded generator.

Every invocation returns `executionLog`, an array describing each iteration:

```ts
const { executionLog } = await runToCompletionWithFakeRunner({ /* ... */ });

executionLog[0];
// {
//   iteration: 1,
//   status: "waiting",
//   pending: [{ effectId, invocationKey, schedulerHints }],
//   executed: [{ effectId, taskId, schedulerHints }],
//   metadata: { ...iterationMetadata }
// }
```

Use it to assert deterministic ordering, scheduler hints (e.g., `parallelGroupId`), and pending slices after partial resolutions.

## Snapshot helpers

After a fake run you can diff the entire run directory with one helper:

```ts
import { captureRunSnapshot } from "@a5c/babysitter-sdk/testing";

const snapshot = await captureRunSnapshot(harness.runDir);
expect(snapshot.journal).toMatchInlineSnapshot();
expect(snapshot.state?.effectsByInvocation).toMatchObject({
  "task#alpha": { status: "resolved_ok" },
});
```

- `readJournalSnapshot` and `readStateSnapshot` expose the individual pieces when you only need one.
- The snapshots are safe to compare directly across OSes because the clock/ULID seeding above strips nondeterminism from `recordedAt`, filenames, and effect IDs.
