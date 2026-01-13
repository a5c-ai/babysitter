import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { createDeterministicRunHarness } from "../../testing";
import { runToCompletionWithFakeRunner, type FakeActionResolver } from "../runHarness";
import type { EffectAction } from "../../runtime/types";

const PROCESS_FILENAME = "parallel-harness.mjs";

describe("runToCompletionWithFakeRunner with parallel helpers", () => {
  let fixtureRoot: string;

  beforeEach(async () => {
    fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), "sdk-parallel-"));
  });

  afterEach(async () => {
    await fs.rm(fixtureRoot, { recursive: true, force: true });
  });

  test("captures deterministic pending slices and scheduler hints when a parallel branch stays unresolved", async () => {
    const processPath = await writeParallelProcess(fixtureRoot);
    const harness = await createDeterministicRunHarness({
      processPath,
      inputs: { base: 5 },
    });
    try {
      const result = await runToCompletionWithFakeRunner({
        runDir: harness.runDir,
        resolve: resolveOnlyAlphaBranch(),
        clock: harness.clock,
        ulids: harness.ulids,
      });

      expect(result.status).toBe("waiting");
      expect(result.pending).toHaveLength(1);
      const pendingBranch = (result.pending?.[0].taskDef.metadata as { branch: string }).branch;
      expect(pendingBranch).toBe("beta");

      expect(result.executionLog).toHaveLength(2);
      const [firstIteration, secondIteration] = result.executionLog;
      expect(firstIteration.pending).toHaveLength(2);
      const groupIds = new Set(firstIteration.pending.map((entry) => entry.schedulerHints?.parallelGroupId));
      expect(groupIds.size).toBe(1);
      expect(groupIds.values().next().value).toBeTruthy();

      expect(firstIteration.executed).toHaveLength(1);
      expect(firstIteration.executed[0]?.effectId).toBe(result.executed[0]?.action.effectId);
      expect(firstIteration.executed[0]?.taskId).toBe("parallel-branch");

      expect(secondIteration.status).toBe("waiting");
      expect(secondIteration.pending).toHaveLength(1);
      expect(secondIteration.executed).toHaveLength(0);
      expect(secondIteration.pending[0]?.invocationKey).toBe(result.pending?.[0].invocationKey);
    } finally {
      await harness.cleanup();
    }
  });
});

async function writeParallelProcess(root: string) {
  const processPath = path.join(root, PROCESS_FILENAME);
  const contents = `
    const branchTask = {
      id: "parallel-branch",
      async build(args) {
        return {
          kind: "node",
          title: \`branch \${args.branch}\`,
          metadata: args,
        };
      },
    };

    export async function process(inputs, ctx) {
      const [alpha, beta] = await ctx.parallel.all([
        async () => ctx.task(branchTask, { branch: "alpha", value: inputs.base }),
        async () => ctx.task(branchTask, { branch: "beta", value: inputs.base + 1 }),
      ]);
      return { alpha, beta };
    }
  `;
  await fs.writeFile(processPath, contents, "utf8");
  return processPath;
}

function resolveOnlyAlphaBranch(): FakeActionResolver {
  const handled = new Set<string>();
  return function resolver(action: EffectAction) {
    const metadata = action.taskDef.metadata as { branch?: string } | undefined;
    if (metadata?.branch === "alpha" && !handled.has(action.effectId)) {
      handled.add(action.effectId);
      return { status: "ok", value: { branch: metadata.branch } };
    }
    return undefined;
  };
}
