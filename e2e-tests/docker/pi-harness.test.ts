import { afterAll, beforeAll, describe, expect, test } from "vitest";
import {
  buildImage,
  dockerExec,
  dockerExecSafe,
  PLUGIN_DIR,
  startContainer,
  stopContainer,
} from "./helpers";
import path from "path";

/**
 * Extract the last JSON object from multi-line CLI output.
 * Handles pretty-printed JSON (with `null, 2` formatting) by
 * finding the last `{...}` block across multiple lines.
 */
function parseLastJsonObject(output: string): unknown {
  const trimmed = output.trim();
  const lastBrace = trimmed.lastIndexOf("}");
  if (lastBrace === -1) throw new SyntaxError("No JSON object found in output");
  let depth = 0;
  for (let i = lastBrace; i >= 0; i--) {
    if (trimmed[i] === "}") depth++;
    if (trimmed[i] === "{") depth--;
    if (depth === 0) {
      return JSON.parse(trimmed.slice(i, lastBrace + 1));
    }
  }
  throw new SyntaxError("Unmatched braces in output");
}

const ROOT = path.resolve(__dirname, "../..");

// The SDK is installed globally via `npm install -g ./packages/sdk`
// so we can resolve the global install path inside the container.
const SDK_GLOBAL_PATH =
  "$(node -e \"console.log(require.resolve('@a5c-ai/babysitter-sdk').replace(/\\/index\\.js$/, ''))\")";

// Ensure NODE_PATH includes the global npm root so `require('@a5c-ai/babysitter-sdk/...')`
// resolves inside the container (the SDK is installed globally via `npm install -g`).
const NP = "export NODE_PATH=$(npm root -g) &&";

beforeAll(() => {
  buildImage(ROOT);
  startContainer();
}, 300_000);

afterAll(() => {
  stopContainer();
});

// ============================================================================
// Pi harness SDK structural tests
// ============================================================================

describe("Pi harness SDK structural tests", () => {
  test("dist/harness/pi.js exists in installed SDK", () => {
    const sdkPath = dockerExec(
      `${NP} node -e "console.log(require.resolve('@a5c-ai/babysitter-sdk').replace(/index\\.js$/, ''))"`,
    ).trim();
    dockerExec(`test -f ${sdkPath}harness/pi.js`);
  });

  test("dist/harness/pi.d.ts exists (type declarations)", () => {
    const sdkPath = dockerExec(
      `${NP} node -e "console.log(require.resolve('@a5c-ai/babysitter-sdk').replace(/index\\.js$/, ''))"`,
    ).trim();
    dockerExec(`test -f ${sdkPath}harness/pi.d.ts`);
  });

  test("createPiAdapter is exported from harness/index.js", () => {
    const out = dockerExec(
      `${NP} node -e "const h = require('@a5c-ai/babysitter-sdk/dist/harness'); console.log(typeof h.createPiAdapter)"`,
    ).trim();
    expect(out).toBe("function");
  });

  test("pi adapter is registered in harness/registry.js", () => {
    const out = dockerExec(
      `${NP} node -e "const r = require('@a5c-ai/babysitter-sdk/dist/harness/registry'); console.log(JSON.stringify(r.listSupportedHarnesses()))"`,
    ).trim();
    const harnesses = JSON.parse(out) as string[];
    expect(harnesses).toContain("pi");
  });
});

// ============================================================================
// Pi harness adapter behavior tests
// ============================================================================

describe("Pi harness adapter behavior tests", () => {
  test("createPiAdapter() returns adapter with name 'pi'", () => {
    const out = dockerExec(
      `${NP} node -e "const {createPiAdapter} = require('@a5c-ai/babysitter-sdk/dist/harness/pi'); const a = createPiAdapter(); console.log(a.name)"`,
    ).trim();
    expect(out).toBe("pi");
  });

  test("isActive() returns false when no PI/OMP env vars set", () => {
    const out = dockerExec(
      `${NP} node -e "
        delete process.env.OMP_SESSION_ID;
        delete process.env.PI_SESSION_ID;
        delete process.env.OMP_PLUGIN_ROOT;
        delete process.env.PI_PLUGIN_ROOT;
        const {createPiAdapter} = require('@a5c-ai/babysitter-sdk/dist/harness/pi');
        const a = createPiAdapter();
        console.log(a.isActive());
      "`,
    ).trim();
    expect(out).toBe("false");
  });

  test("isActive() returns true when OMP_SESSION_ID is set", () => {
    const out = dockerExec(
      `${NP} OMP_SESSION_ID=test-sess node -e "
        const {createPiAdapter} = require('@a5c-ai/babysitter-sdk/dist/harness/pi');
        const a = createPiAdapter();
        console.log(a.isActive());
      "`,
    ).trim();
    expect(out).toBe("true");
  });

  test("isActive() returns true when PI_PLUGIN_ROOT is set", () => {
    const out = dockerExec(
      `${NP} PI_PLUGIN_ROOT=/tmp/pi node -e "
        const {createPiAdapter} = require('@a5c-ai/babysitter-sdk/dist/harness/pi');
        const a = createPiAdapter();
        console.log(a.isActive());
      "`,
    ).trim();
    expect(out).toBe("true");
  });

  test("resolveSessionId returns OMP_SESSION_ID from env", () => {
    const out = dockerExec(
      `${NP} OMP_SESSION_ID=omp-sess-123 node -e "
        const {createPiAdapter} = require('@a5c-ai/babysitter-sdk/dist/harness/pi');
        const a = createPiAdapter();
        console.log(a.resolveSessionId({}));
      "`,
    ).trim();
    expect(out).toBe("omp-sess-123");
  });

  test("resolveSessionId returns PI_SESSION_ID from env", () => {
    const out = dockerExec(
      `${NP} PI_SESSION_ID=pi-sess-456 node -e "
        const {createPiAdapter} = require('@a5c-ai/babysitter-sdk/dist/harness/pi');
        const a = createPiAdapter();
        console.log(a.resolveSessionId({}));
      "`,
    ).trim();
    expect(out).toBe("pi-sess-456");
  });

  test("resolveSessionId prefers explicit param over env", () => {
    const out = dockerExec(
      `${NP} OMP_SESSION_ID=from-env node -e "
        const {createPiAdapter} = require('@a5c-ai/babysitter-sdk/dist/harness/pi');
        const a = createPiAdapter();
        console.log(a.resolveSessionId({sessionId: 'from-param'}));
      "`,
    ).trim();
    expect(out).toBe("from-param");
  });

  test("resolveStateDir uses BABYSITTER_STATE_DIR when set", () => {
    const out = dockerExec(
      `${NP} BABYSITTER_STATE_DIR=/tmp/custom-state node -e "
        const {createPiAdapter} = require('@a5c-ai/babysitter-sdk/dist/harness/pi');
        const a = createPiAdapter();
        console.log(a.resolveStateDir({}));
      "`,
    ).trim();
    expect(out).toBe("/tmp/custom-state");
  });

  test("resolveStateDir falls back to pluginRoot/../.a5c", () => {
    const out = dockerExec(
      `${NP} node -e "
        delete process.env.BABYSITTER_STATE_DIR;
        delete process.env.OMP_PLUGIN_ROOT;
        delete process.env.PI_PLUGIN_ROOT;
        const {createPiAdapter} = require('@a5c-ai/babysitter-sdk/dist/harness/pi');
        const a = createPiAdapter();
        console.log(a.resolveStateDir({pluginRoot: '/home/claude/.omp/plugins/babysitter-pi'}));
      "`,
    ).trim();
    expect(out).toBe("/home/claude/.omp/plugins/.a5c");
  });
});

// ============================================================================
// Pi harness session binding tests
// ============================================================================

describe("Pi harness session binding tests", () => {
  // The Pi adapter resolves state dir as pluginRoot/../.a5c (not the Claude Code
  // convention of pluginRoot/skills/babysit/state).
  const STATE_DIR = `${PLUGIN_DIR}/../.a5c`;

  test("run:create --harness pi works with PI_SESSION_ID and PI_PLUGIN_ROOT env vars", () => {
    const sid = "pi-harness-" + Date.now();
    const processDir = `/tmp/pi-harness-test-${sid}`;

    dockerExec(`mkdir -p ${processDir} ${STATE_DIR}`);
    dockerExec(
      `printf '%s' 'export async function process(inputs, ctx) { return { done: true }; }' > ${processDir}/proc.js`,
    );

    const createOut = dockerExec(
      `PI_SESSION_ID=${sid} PI_PLUGIN_ROOT=${PLUGIN_DIR} babysitter run:create --process-id pi-test --entry ${processDir}/proc.js#process --prompt "pi harness test" --harness pi --plugin-root ${PLUGIN_DIR} --json`,
    ).trim();

    const createResult = JSON.parse(createOut);
    expect(createResult.runId).toBeTruthy();
    expect(createResult.session).toBeDefined();
    expect(createResult.session.harness).toBe("pi");
    expect(createResult.session.sessionId).toBe(sid);
    expect(createResult.session.error).toBeUndefined();

    // Clean up
    dockerExec(`rm -rf ${processDir}`);
  });

  test("session state file is created after run:create --harness pi", () => {
    const sid = "pi-state-" + Date.now();
    const processDir = `/tmp/pi-state-test-${sid}`;

    dockerExec(`mkdir -p ${processDir} ${STATE_DIR}`);
    dockerExec(
      `printf '%s' 'export async function process(inputs, ctx) { return { done: true }; }' > ${processDir}/proc.js`,
    );

    dockerExec(
      `PI_SESSION_ID=${sid} PI_PLUGIN_ROOT=${PLUGIN_DIR} babysitter run:create --process-id pi-state-test --entry ${processDir}/proc.js#process --prompt "state check" --harness pi --plugin-root ${PLUGIN_DIR} --json`,
    );

    const stateOut = dockerExec(
      `babysitter session:state --session-id ${sid} --state-dir ${STATE_DIR} --json`,
    ).trim();
    const state = JSON.parse(stateOut);
    expect(state.found).toBe(true);
    expect(state.state.active).toBe(true);

    // Clean up
    dockerExec(`rm -rf ${processDir}`);
  });

  test("run:create --harness pi without session ID reports error in JSON", () => {
    const processDir = `/tmp/pi-nosid-test-${Date.now()}`;

    dockerExec(`mkdir -p ${processDir}`);
    dockerExec(
      `printf '%s' 'export async function process(inputs, ctx) { return { done: true }; }' > ${processDir}/proc.js`,
    );

    const createOut = dockerExec(
      `babysitter run:create --process-id pi-nosid --entry ${processDir}/proc.js#process --prompt "no sid" --harness pi --plugin-root ${PLUGIN_DIR} --json`,
    ).trim();

    const createResult = JSON.parse(createOut);
    expect(createResult.runId).toBeTruthy();
    expect(createResult.session).toBeDefined();
    expect(createResult.session.error).toBeTruthy();
    expect(createResult.session.error).toContain("session ID");

    // Clean up
    dockerExec(`rm -rf ${processDir}`);
  });
});

// ============================================================================
// Pi plugin package structural tests
// ============================================================================

describe("Pi plugin package structural tests", () => {
  test("plugins/babysitter-pi/package.json exists and has scoped npm package name", () => {
    const name = dockerExec(
      `node -e "console.log(JSON.parse(require('fs').readFileSync('/app/plugins/babysitter-pi/package.json','utf8')).name)"`,
    ).trim();
    expect(name).toBe("@a5c-ai/babysitter-pi");
  });

  test("plugins/babysitter-pi/extensions/babysitter/index.ts exists", () => {
    dockerExec("test -f /app/plugins/babysitter-pi/extensions/babysitter/index.ts");
  });

  test("plugins/babysitter-pi/extensions/babysitter/sdk-bridge.ts exists", () => {
    dockerExec("test -f /app/plugins/babysitter-pi/extensions/babysitter/sdk-bridge.ts");
  });

  test("plugins/babysitter-pi/extensions/babysitter/session-binder.ts exists", () => {
    dockerExec("test -f /app/plugins/babysitter-pi/extensions/babysitter/session-binder.ts");
  });

  test("plugins/babysitter-pi/extensions/babysitter/loop-driver.ts exists", () => {
    dockerExec("test -f /app/plugins/babysitter-pi/extensions/babysitter/loop-driver.ts");
  });

  test("plugins/babysitter-pi/extensions/babysitter/effect-executor.ts exists", () => {
    dockerExec("test -f /app/plugins/babysitter-pi/extensions/babysitter/effect-executor.ts");
  });

  test("plugins/babysitter-pi/extensions/babysitter/guards.ts exists", () => {
    dockerExec("test -f /app/plugins/babysitter-pi/extensions/babysitter/guards.ts");
  });

  test("plugins/babysitter-pi/extensions/babysitter/types.ts exists", () => {
    dockerExec("test -f /app/plugins/babysitter-pi/extensions/babysitter/types.ts");
  });

  test("plugins/babysitter-pi/extensions/babysitter/tui-widgets.ts exists", () => {
    dockerExec("test -f /app/plugins/babysitter-pi/extensions/babysitter/tui-widgets.ts");
  });

  test("plugins/babysitter-pi/extensions/babysitter/custom-tools.ts exists", () => {
    dockerExec("test -f /app/plugins/babysitter-pi/extensions/babysitter/custom-tools.ts");
  });

  test("plugins/babysitter-pi/extensions/babysitter/tool-renderer.ts exists", () => {
    dockerExec("test -f /app/plugins/babysitter-pi/extensions/babysitter/tool-renderer.ts");
  });

  test("plugins/babysitter-pi/AGENTS.md exists", () => {
    dockerExec("test -f /app/plugins/babysitter-pi/AGENTS.md");
  });

  test("plugins/babysitter-pi/test/ contains integration, harness, and tui test files", () => {
    const ls = dockerExec("ls /app/plugins/babysitter-pi/test/").trim();
    expect(ls).toContain("integration.test.js");
    expect(ls).toContain("harness.test.js");
    expect(ls).toContain("tui.test.js");
  });
});

// ============================================================================
// Pi harness auto-detection priority tests
// ============================================================================

describe("Pi harness auto-detection", () => {
  test("detectAdapter returns oh-my-pi when OMP_SESSION_ID is set", () => {
    const out = dockerExec(
      `${NP} OMP_SESSION_ID=detect-test node -e "
        const {detectAdapter} = require('@a5c-ai/babysitter-sdk/dist/harness/registry');
        const a = detectAdapter();
        console.log(a.name);
      "`,
    ).trim();
    expect(out).toBe("oh-my-pi");
  });

  test("getAdapterByName('pi') returns the pi adapter", () => {
    const out = dockerExec(
      `${NP} node -e "
        const {getAdapterByName} = require('@a5c-ai/babysitter-sdk/dist/harness/registry');
        const a = getAdapterByName('pi');
        console.log(a ? a.name : 'null');
      "`,
    ).trim();
    expect(out).toBe("pi");
  });
});
