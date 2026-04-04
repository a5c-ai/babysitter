/**
 * Structural E2E tests for the babysitter Paperclip plugin.
 *
 * Tests that the plugin is properly structured, the babysitter CLI is
 * available, and that the plugin can be installed, configured, and used
 * to run a basic babysitter task inside a Docker container.
 */

import path from "path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import {
  buildPaperclipImage,
  dockerExec,
  dockerExecSafe,
  PAPERCLIP_PLUGIN_DIR,
  startPaperclipContainer,
  stopPaperclipContainer,
} from "./helpers-paperclip";

const ROOT = path.resolve(__dirname, "../..");

beforeAll(() => {
  buildPaperclipImage(ROOT);
  startPaperclipContainer();
}, 300_000);

afterAll(() => {
  stopPaperclipContainer();
});

describe("Paperclip plugin structural tests", () => {
  test("babysitter CLI is available", () => {
    const version = dockerExec("babysitter --version").trim();
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
  });

  test("Node.js v20+ and jq are installed", () => {
    const nodeMajor = Number(
      dockerExec('node -p "process.versions.node.split(\'.\')[0]"').trim()
    );
    expect(nodeMajor).toBeGreaterThanOrEqual(20);
    expect(dockerExec("jq --version").trim()).toMatch(/^jq-/);
  });

  test("paperclip plugin directory exists with expected files", () => {
    dockerExec(`test -f ${PAPERCLIP_PLUGIN_DIR}/package.json`);
    dockerExec(`test -f ${PAPERCLIP_PLUGIN_DIR}/tsconfig.json`);
    dockerExec(`test -f ${PAPERCLIP_PLUGIN_DIR}/src/manifest.ts`);
    dockerExec(`test -f ${PAPERCLIP_PLUGIN_DIR}/src/worker.ts`);
    dockerExec(`test -f ${PAPERCLIP_PLUGIN_DIR}/src/babysitter-bridge.ts`);
    dockerExec(`test -f ${PAPERCLIP_PLUGIN_DIR}/src/delegating-adapter.ts`);
    dockerExec(`test -f ${PAPERCLIP_PLUGIN_DIR}/src/types.ts`);
    dockerExec(
      `test -f ${PAPERCLIP_PLUGIN_DIR}/src/harness-plugin-installer.ts`
    );
  });

  test("paperclip plugin UI components exist", () => {
    dockerExec(`test -f ${PAPERCLIP_PLUGIN_DIR}/src/ui/index.tsx`);
    dockerExec(`test -f ${PAPERCLIP_PLUGIN_DIR}/src/ui/BabysitterDashboard.tsx`);
    dockerExec(`test -f ${PAPERCLIP_PLUGIN_DIR}/src/ui/RunDetailTab.tsx`);
    dockerExec(`test -f ${PAPERCLIP_PLUGIN_DIR}/src/ui/BreakpointApproval.tsx`);
    dockerExec(`test -f ${PAPERCLIP_PLUGIN_DIR}/src/ui/BabysitterSidebar.tsx`);
    dockerExec(`test -f ${PAPERCLIP_PLUGIN_DIR}/src/ui/styles.ts`);
  });

  test("paperclip plugin has versions.json with sdkVersion", () => {
    const raw = dockerExec(
      `cat ${PAPERCLIP_PLUGIN_DIR}/versions.json`
    ).trim();
    const versions = JSON.parse(raw);
    expect(versions).toHaveProperty("sdkVersion");
    expect(typeof versions.sdkVersion).toBe("string");
  });

  test("paperclip plugin package.json has correct name and dependencies", () => {
    const raw = dockerExec(
      `cat ${PAPERCLIP_PLUGIN_DIR}/package.json`
    ).trim();
    const pkg = JSON.parse(raw);
    expect(pkg.name).toBe("@a5c-ai/babysitter-paperclip");
    expect(pkg.peerDependencies).toHaveProperty("@paperclipai/plugin-sdk");
    expect(pkg.dependencies).toHaveProperty("@a5c-ai/babysitter-sdk");
  });

  test("delegating adapter maps Paperclip adapter types correctly", () => {
    // Verify the adapter type map is importable and correct
    const result = dockerExec(
      `node -e "
        const types = require('${PAPERCLIP_PLUGIN_DIR}/src/types.ts');
      " 2>&1 || node -e "
        const fs = require('fs');
        const content = fs.readFileSync('${PAPERCLIP_PLUGIN_DIR}/src/types.ts', 'utf-8');
        const match = content.match(/claude_local:\\s*\\"([^"]+)\\"/);
        console.log(match ? match[1] : 'NOT_FOUND');
      "`
    ).trim();
    // The TypeScript source won't run directly, but we can grep for the mapping
    const typesContent = dockerExec(
      `cat ${PAPERCLIP_PLUGIN_DIR}/src/types.ts`
    );
    expect(typesContent).toContain('claude_local: "claude-code"');
    expect(typesContent).toContain('codex_local: "codex"');
    expect(typesContent).toContain('gemini_local: "gemini-cli"');
  });
});

describe("Paperclip plugin babysitter CLI integration", () => {
  test("harness:discover returns JSON list of harnesses", () => {
    const raw = dockerExec("babysitter harness:discover --json").trim();
    const harnesses = JSON.parse(raw);
    expect(Array.isArray(harnesses)).toBe(true);
    expect(harnesses.length).toBeGreaterThan(0);
    // Should have at least claude-code in the known list
    const names = harnesses.map(
      (h: { name: string }) => h.name
    );
    expect(names).toContain("claude-code");
  });

  test("run:create and run:status work for a simple process", () => {
    // Create a simple process file
    dockerExec(`mkdir -p /workspace/.a5c/processes`);
    dockerExec(`cat > /workspace/.a5c/processes/test-simple.js << 'PROCEOF'
async function process(inputs, ctx) {
  return { result: "hello from paperclip test" };
}
module.exports = { process };
PROCEOF`);

    // Create inputs
    dockerExec(
      `echo '{"test": true}' > /workspace/.a5c/processes/test-inputs.json`
    );

    // Create a run
    const createRaw = dockerExec(
      `cd /workspace && babysitter run:create ` +
        `--process-id test-simple ` +
        `--entry .a5c/processes/test-simple.js#process ` +
        `--inputs .a5c/processes/test-inputs.json ` +
        `--runs-dir .a5c/runs --json`
    ).trim();
    const created = JSON.parse(createRaw);
    expect(created).toHaveProperty("runId");
    expect(created).toHaveProperty("runDir");

    const runId = created.runId;

    // Check status
    const statusRaw = dockerExec(
      `cd /workspace && babysitter run:status .a5c/runs/${runId} --json`
    ).trim();
    const status = JSON.parse(statusRaw);
    expect(status).toHaveProperty("state");

    // Iterate to completion
    const iterateRaw = dockerExec(
      `cd /workspace && babysitter run:iterate .a5c/runs/${runId} --json`
    ).trim();
    const iteration = JSON.parse(iterateRaw);
    expect(iteration.status).toBe("completed");
    expect(iteration).toHaveProperty("completionProof");
  });

  test("run with breakpoint creates pending breakpoint effect", () => {
    // Create a process that has a breakpoint
    dockerExec(`cat > /workspace/.a5c/processes/test-breakpoint.js << 'PROCEOF'
async function process(inputs, ctx) {
  const approval = await ctx.breakpoint({
    question: "Approve this test step?",
    title: "Test Breakpoint",
    options: ["Approve", "Reject"],
    expert: "owner",
    tags: ["test", "e2e"],
  });
  return { approved: approval.approved, response: approval.response };
}
module.exports = { process };
PROCEOF`);

    dockerExec(
      `echo '{"test": "breakpoint"}' > /workspace/.a5c/processes/test-bp-inputs.json`
    );

    // Create run
    const createRaw = dockerExec(
      `cd /workspace && babysitter run:create ` +
        `--process-id test-breakpoint ` +
        `--entry .a5c/processes/test-breakpoint.js#process ` +
        `--inputs .a5c/processes/test-bp-inputs.json ` +
        `--runs-dir .a5c/runs --json`
    ).trim();
    const created = JSON.parse(createRaw);
    const runId = created.runId;

    // Iterate - should pause on breakpoint
    const iterateRaw = dockerExec(
      `cd /workspace && babysitter run:iterate .a5c/runs/${runId} --json`
    ).trim();
    const iteration = JSON.parse(iterateRaw);
    expect(iteration.status).toBe("waiting");
    expect(iteration.nextActions).toBeDefined();
    expect(iteration.nextActions.length).toBeGreaterThan(0);

    const bpAction = iteration.nextActions[0];
    expect(bpAction.kind).toBe("breakpoint");

    // Verify pending breakpoints via task:list
    const tasksRaw = dockerExec(
      `cd /workspace && babysitter task:list .a5c/runs/${runId} --pending --json`
    ).trim();
    const tasks = JSON.parse(tasksRaw);
    expect(tasks.length).toBe(1);
    expect(tasks[0].kind).toBe("breakpoint");

    // Approve the breakpoint (--status ok with approved: true)
    const effectId = bpAction.effectId;
    dockerExec(
      `cd /workspace && babysitter task:post .a5c/runs/${runId} ${effectId} ` +
        `--status ok --value-inline '{"approved":true,"response":"Approved via e2e test"}' --json`
    );

    // Iterate again - should complete
    const iterate2Raw = dockerExec(
      `cd /workspace && babysitter run:iterate .a5c/runs/${runId} --json`
    ).trim();
    const iteration2 = JSON.parse(iterate2Raw);
    expect(iteration2.status).toBe("completed");
    expect(iteration2.completionProof).toBeTruthy();
  });

  test("breakpoint rejection uses --status ok with approved: false", () => {
    // Create a process with a single breakpoint
    dockerExec(`cat > /workspace/.a5c/processes/test-reject.js << 'PROCEOF'
async function process(inputs, ctx) {
  const approval = await ctx.breakpoint({
    question: "Approve?",
    title: "Reject Test",
  });
  return { approved: approval.approved, feedback: approval.feedback };
}
module.exports = { process };
PROCEOF`);

    dockerExec(
      `echo '{}' > /workspace/.a5c/processes/test-reject-inputs.json`
    );

    const createRaw = dockerExec(
      `cd /workspace && babysitter run:create ` +
        `--process-id test-reject ` +
        `--entry .a5c/processes/test-reject.js#process ` +
        `--inputs .a5c/processes/test-reject-inputs.json ` +
        `--runs-dir .a5c/runs --json`
    ).trim();
    const created = JSON.parse(createRaw);
    const runId = created.runId;

    // Iterate to breakpoint
    const iterateRaw = dockerExec(
      `cd /workspace && babysitter run:iterate .a5c/runs/${runId} --json`
    ).trim();
    const iteration = JSON.parse(iterateRaw);
    expect(iteration.status).toBe("waiting");

    const effectId = iteration.nextActions[0].effectId;

    // Reject with --status ok (CRITICAL: not --status error)
    const postRaw = dockerExec(
      `cd /workspace && babysitter task:post .a5c/runs/${runId} ${effectId} ` +
        `--status ok --value-inline '{"approved":false,"feedback":"Not ready yet"}' --json`
    ).trim();
    const postResult = JSON.parse(postRaw);
    expect(postResult.status).toBe("ok");

    // Iterate - should complete with the rejection result
    const iterate2Raw = dockerExec(
      `cd /workspace && babysitter run:iterate .a5c/runs/${runId} --json`
    ).trim();
    const iteration2 = JSON.parse(iterate2Raw);
    expect(iteration2.status).toBe("completed");
  });
});
