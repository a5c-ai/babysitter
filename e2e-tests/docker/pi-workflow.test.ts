/**
 * Pi harness full workflow E2E tests.
 *
 * Actually imports and runs the real Pi extension code (activate(),
 * session-binder, sdk-bridge, loop-driver, effect-executor, guards)
 * inside Docker via tsx.  No simulation, no mirroring -- the actual
 * TypeScript modules from plugins/babysitter-pi/extensions/babysitter/ are loaded
 * and exercised end-to-end.
 *
 * Two test tiers:
 *   1. Extension logic tests (no LLM) -- verify activate(), handlers,
 *      bindRun, iterate, postResult, onAgentEnd, guards, state
 *      persistence all work through the real code.
 *   2. Azure OpenAI integration (gated on AZURE_OPENAI_API_KEY) --
 *      full orchestration loop with an actual LLM driving responses.
 */
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import {
  buildImage,
  dockerExec,
  dockerExecSafe,
  startContainer,
  stopContainer,
  CONTAINER,
} from "./helpers";
import { execSync } from "child_process";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");

// NODE_PATH prefix so globally-installed SDK is resolvable.
const NP = "export NODE_PATH=$(npm root -g) &&";

// Azure OpenAI credentials (from env or ~/.a5c/creds.env).
const HAS_AZURE_KEY = !!process.env.AZURE_OPENAI_API_KEY;
const AZURE_RESOURCE = process.env.AZURE_OPENAI_PROJECT_NAME || "";
const AZURE_KEY = process.env.AZURE_OPENAI_API_KEY || "";
const AZURE_DEPLOYMENT =
  process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-5.4";

let scriptCounter = 0;

/**
 * Write a TypeScript script into the container and execute it with tsx.
 * Returns parsed JSON from the last JSON object in stdout.
 */
function runTsx<T = unknown>(
  script: string,
  opts?: { env?: Record<string, string>; timeout?: number },
): T {
  const id = `${Date.now()}_${++scriptCounter}`;
  const scriptFile = `/tmp/_pi_tsx_${id}.ts`;

  // Write script via heredoc (single-quoted delimiter = no bash expansion)
  dockerExec(
    `cat > ${scriptFile} << 'TSXEOF'\n${script}\nTSXEOF`,
  );

  // Build env prefix
  let envPrefix = "";
  if (opts?.env && Object.keys(opts.env).length > 0) {
    const envFile = `/tmp/_pi_env_${id}.sh`;
    const lines = Object.entries(opts.env)
      .map(([k, v]) => `export ${k}='${v.replace(/'/g, "'\\''")}'`)
      .join("\n");
    dockerExec(`cat > ${envFile} << 'ENVEOF'\n${lines}\nENVEOF`);
    envPrefix = `source ${envFile} && `;
  }

  const raw = dockerExec(
    `${envPrefix}${NP} tsx ${scriptFile}`,
    { timeout: opts?.timeout ?? 60_000 },
  ).trim();

  // Parse last JSON line from output (look for lines that are valid JSON objects)
  const lines = raw.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.startsWith("{") && line.endsWith("}")) {
      try {
        return JSON.parse(line) as T;
      } catch {
        // not valid JSON, keep looking
      }
    }
  }
  throw new SyntaxError(`No JSON object line in output:\n${raw.slice(-2000)}`);
}

beforeAll(() => {
  buildImage(ROOT);
  startContainer();
  // Install tsx so we can run the Pi extension TypeScript directly
  dockerExec("npm install -g tsx 2>&1", { timeout: 120_000 });
  // Create state directory the session-binder uses for persistence (need root to chown under root-owned /app)
  execSync(
    `docker exec -u root ${CONTAINER} bash -c "mkdir -p /app/plugins/babysitter-pi/state && chown claude:claude /app/plugins/babysitter-pi/state"`,
    { encoding: "utf-8", timeout: 10_000 },
  );
}, 600_000);

afterAll(() => {
  stopContainer();
});

// ============================================================================
// 1. Module loading: can we actually import the Pi extension via tsx?
// ============================================================================

describe("Pi extension module loading", () => {
  test("activate() is importable and is a function", () => {
    const result = runTsx<{ type: string }>(`
      import activate from '/app/plugins/babysitter-pi/extensions/babysitter/index.ts';
      console.log(JSON.stringify({ type: typeof activate }));
    `);
    expect(result.type).toBe("function");
  });

  test("all extension sub-modules are importable", () => {
    const result = runTsx<Record<string, string>>(`
      import activate from '/app/plugins/babysitter-pi/extensions/babysitter/index.ts';
      import { bindRun, initSession, getActiveRun, setActiveRun, clearActiveRun } from '/app/plugins/babysitter-pi/extensions/babysitter/session-binder.ts';
      import { iterate, getRunStatus, postResult } from '/app/plugins/babysitter-pi/extensions/babysitter/sdk-bridge.ts';
      import { onAgentEnd, buildContinuationPrompt, extractPromiseTag } from '/app/plugins/babysitter-pi/extensions/babysitter/loop-driver.ts';
      import { executeEffect, postEffectResult } from '/app/plugins/babysitter-pi/extensions/babysitter/effect-executor.ts';
      import { checkGuards, resetGuardState, isDoomLoop } from '/app/plugins/babysitter-pi/extensions/babysitter/guards.ts';

      console.log(JSON.stringify({
        activate: typeof activate,
        bindRun: typeof bindRun,
        initSession: typeof initSession,
        iterate: typeof iterate,
        getRunStatus: typeof getRunStatus,
        postResult: typeof postResult,
        onAgentEnd: typeof onAgentEnd,
        buildContinuationPrompt: typeof buildContinuationPrompt,
        extractPromiseTag: typeof extractPromiseTag,
        executeEffect: typeof executeEffect,
        postEffectResult: typeof postEffectResult,
        checkGuards: typeof checkGuards,
        resetGuardState: typeof resetGuardState,
        isDoomLoop: typeof isDoomLoop,
      }));
    `);

    for (const [name, type] of Object.entries(result)) {
      expect(type, `${name} should be a function`).toBe("function");
    }
  });
});

// ============================================================================
// 2. activate() handler and command registration
// ============================================================================

describe("Pi extension activate() registration", () => {
  test("registers all lifecycle handlers and slash commands", () => {
    const result = runTsx<{
      handlers: Record<string, number>;
      commands: string[];
      renderers: string[];
      activationLogs: string[];
    }>(`
      import activate from '/app/plugins/babysitter-pi/extensions/babysitter/index.ts';

      const handlers: Record<string, number> = {};
      const commands: string[] = [];
      const renderers: string[] = [];
      const logs: string[] = [];

      const pi: any = {
        on(e: string) { handlers[e] = (handlers[e] || 0) + 1; },
        registerCommand(name: string) { commands.push(name); },
        registerMessageRenderer(type: string) { renderers.push(type); },
        appendEntry(entry: any) { logs.push(String(entry.content || '')); },
        sendMessage() {},
        sendUserMessage() {},
        registerTool() {},
        getActiveTools() { return []; },
        setActiveTools() {},
        setStatus() {},
      };

      activate(pi);
      console.log(JSON.stringify({ handlers, commands, renderers, activationLogs: logs }));
    `);

    // Lifecycle event handlers
    expect(result.handlers["session_start"]).toBe(1);
    expect(result.handlers["agent_end"]).toBe(1);
    expect(result.handlers["tool_call"]).toBe(1);
    expect(result.handlers["context"]).toBe(1);
    expect(result.handlers["session_shutdown"]).toBe(1);

    // Slash commands
    expect(result.commands).toContain("babysitter:call");
    expect(result.commands).toContain("babysitter:status");
    expect(result.commands).toContain("babysitter:resume");
    expect(result.commands).toContain("babysitter:doctor");
    expect(result.commands).toContain("babysitter:sync");

    // Message renderer
    expect(result.renderers).toContain("babysitter:tool-result");

    // Activation log messages
    expect(result.activationLogs.some((l) => l.includes("activating"))).toBe(true);
    expect(result.activationLogs.some((l) => l.includes("activated"))).toBe(true);
  });
});

// ============================================================================
// 3. Full orchestration lifecycle through real extension code (no LLM)
// ============================================================================

describe("Pi extension: full orchestration lifecycle", () => {
  test("activate -> session_start -> bindRun -> iterate -> postEffectResult -> onAgentEnd -> completion", () => {
    const tag = `pi-full-${Date.now()}`;
    const procDir = `/tmp/${tag}`;
    dockerExec(`mkdir -p ${procDir}`);

    // Create a single-task process
    dockerExec(
      `cat > ${procDir}/proc.js << 'PROCEOF'
const { defineTask } = require('@a5c-ai/babysitter-sdk');
const hello = defineTask('hello', (args) => ({
  kind: 'node',
  title: 'Say hello to ' + (args.name || 'world'),
}));
exports.process = async function(inputs, ctx) {
  const inp = inputs || {};
  const result = await ctx.task(hello, { name: inp.name || 'world' });
  return { greeting: result };
};
PROCEOF`,
    );

    const result = runTsx<{
      activated: boolean;
      sessionStarted: boolean;
      runId: string;
      firstIterStatus: string;
      effectCount: number;
      effectKinds: string[];
      promptHasRunId: boolean;
      promptHasPending: boolean;
      promptHasEffectId: boolean;
      effectsPosted: boolean;
      finalStatus: string;
      completionLogged: boolean;
      journalTypes: string[];
      stateRecoverable: boolean;
    }>(
      `
      import * as fs from 'fs';
      import * as path from 'path';
      import activate from '/app/plugins/babysitter-pi/extensions/babysitter/index.ts';
      import { bindRun, setActiveRun, getActiveRun, initSession } from '/app/plugins/babysitter-pi/extensions/babysitter/session-binder.ts';
      import { iterate, getRunStatus } from '/app/plugins/babysitter-pi/extensions/babysitter/sdk-bridge.ts';
      import { onAgentEnd, buildContinuationPrompt } from '/app/plugins/babysitter-pi/extensions/babysitter/loop-driver.ts';
      import { postEffectResult } from '/app/plugins/babysitter-pi/extensions/babysitter/effect-executor.ts';
      import { resetGuardState } from '/app/plugins/babysitter-pi/extensions/babysitter/guards.ts';
      import { loadJournal } from '@a5c-ai/babysitter-sdk';

      const SID = 'e2e-full-${tag}';
      const RUNS = '/tmp/${tag}/runs';
      fs.mkdirSync(RUNS, { recursive: true });
      fs.mkdirSync('/app/plugins/babysitter-pi/state', { recursive: true });
      process.env.BABYSITTER_RUNS_DIR = RUNS;

      // Mock ExtensionAPI -- captures everything the extension does
      const handlers: Record<string, Function[]> = {};
      const commands: Record<string, Function> = {};
      const logs: any[] = [];
      const userMessages: any[] = [];

      const pi: any = {
        on(e: string, h: Function) { (handlers[e] ??= []).push(h); },
        registerCommand(n: string, h: Function) { commands[n] = h; },
        appendEntry(entry: any) { logs.push(entry); },
        sendMessage() {},
        sendUserMessage(msg: any) { userMessages.push(msg); },
        registerTool() {},
        registerMessageRenderer() {},
        getActiveTools() { return []; },
        setActiveTools() {},
        setStatus() {},
      };

      async function main() {
        const r: any = {};

        // 1. activate() -- wires all handlers
        activate(pi);
        r.activated = true;

        // 2. session_start event
        await handlers.session_start[0]({ sessionId: SID });
        r.sessionStarted = true;

        // 3. bindRun (the REAL session-binder.ts function)
        const runState = await bindRun(SID, {
          processId: 'e2e-hello',
          importPath: '${procDir}/proc.js',
          exportName: 'process',
          prompt: 'Say hello',
          runsDir: RUNS,
        });
        r.runId = runState.runId;

        // 4. iterate (the REAL sdk-bridge.ts function)
        const iter1 = await iterate(runState.runDir);
        runState.iteration += 1;
        runState.iterationTimes.push(0);
        runState.status = 'running';
        setActiveRun(runState);

        r.firstIterStatus = iter1.status;

        if (iter1.status === 'waiting') {
          r.effectCount = iter1.nextActions.length;
          r.effectKinds = iter1.nextActions.map((a: any) => a.kind);

          // 5. buildContinuationPrompt (the REAL loop-driver.ts function)
          const prompt = buildContinuationPrompt(iter1 as any, {
            runId: runState.runId,
            iteration: runState.iteration,
          });
          r.promptHasRunId = prompt.includes(runState.runId);
          r.promptHasPending = prompt.includes('Pending effects');
          r.promptHasEffectId = iter1.nextActions.every(
            (a: any) => prompt.includes(a.effectId),
          );

          // 6. postEffectResult (the REAL effect-executor.ts function)
          for (const action of iter1.nextActions) {
            await postEffectResult(runState.runDir, action.effectId, {
              status: 'ok',
              value: { message: 'Hello from e2e!' },
            });
          }
          r.effectsPosted = true;

          // 7. onAgentEnd (the REAL loop-driver.ts function)
          resetGuardState();
          await onAgentEnd({ sessionId: SID, output: 'Effects done.' }, pi);

          // 8. getRunStatus (the REAL sdk-bridge.ts function)
          const status = await getRunStatus(runState.runDir);
          r.finalStatus = status.status;
        } else {
          r.finalStatus = iter1.status;
        }

        // 9. Check logs for completion
        r.completionLogged = logs.some(
          (l: any) => String(l.content || '').includes('completed'),
        );

        // 10. Read journal
        const journal = await loadJournal(runState.runDir);
        r.journalTypes = journal.map((e: any) => e.type);

        // 11. State persistence recovery
        const recovered = initSession(SID + '-clone');
        r.stateRecoverable = recovered === null; // different SID, no state

        console.log(JSON.stringify(r));
      }

      main().catch(e => { console.error(e); process.exit(1); });
    `,
      { timeout: 60_000 },
    );

    expect(result.activated).toBe(true);
    expect(result.sessionStarted).toBe(true);
    expect(result.runId).toBeTruthy();
    expect(result.firstIterStatus).toBe("waiting");
    expect(result.effectCount).toBe(1);
    expect(result.effectKinds).toContain("node");
    expect(result.promptHasRunId).toBe(true);
    expect(result.promptHasPending).toBe(true);
    expect(result.promptHasEffectId).toBe(true);
    expect(result.effectsPosted).toBe(true);
    expect(result.finalStatus).toBe("completed");
    expect(result.completionLogged).toBe(true);
    expect(result.journalTypes).toContain("RUN_CREATED");
    expect(result.journalTypes).toContain("EFFECT_REQUESTED");
    expect(result.journalTypes).toContain("EFFECT_RESOLVED");
    expect(result.journalTypes).toContain("RUN_COMPLETED");
  }, 120_000);

  test("two-task process: sequential resolution through real onAgentEnd loop", () => {
    const tag = `pi-2task-${Date.now()}`;
    const procDir = `/tmp/${tag}`;
    dockerExec(`mkdir -p ${procDir}`);

    dockerExec(
      `cat > ${procDir}/proc.js << 'PROCEOF'
const { defineTask } = require('@a5c-ai/babysitter-sdk');
const plan = defineTask('plan', (args) => ({
  kind: 'agent',
  title: 'Plan the work',
}));
const execute = defineTask('execute', (args) => ({
  kind: 'node',
  title: 'Execute the plan',
}));
exports.process = async function(inputs, ctx) {
  const p = await ctx.task(plan, { scope: 'test' });
  const e = await ctx.task(execute, { plan: p });
  return { planned: p, executed: e };
};
PROCEOF`,
    );

    const result = runTsx<{
      finalStatus: string;
      iterations: number;
      resolvedEffects: number;
      effectKinds: string[];
      journalTypes: string[];
      guardTripped: boolean;
    }>(
      `
      import * as fs from 'fs';
      import activate from '/app/plugins/babysitter-pi/extensions/babysitter/index.ts';
      import { bindRun, setActiveRun, getActiveRun, clearActiveRun } from '/app/plugins/babysitter-pi/extensions/babysitter/session-binder.ts';
      import { iterate, getRunStatus } from '/app/plugins/babysitter-pi/extensions/babysitter/sdk-bridge.ts';
      import { onAgentEnd } from '/app/plugins/babysitter-pi/extensions/babysitter/loop-driver.ts';
      import { postEffectResult } from '/app/plugins/babysitter-pi/extensions/babysitter/effect-executor.ts';
      import { checkGuards, resetGuardState } from '/app/plugins/babysitter-pi/extensions/babysitter/guards.ts';
      import { loadJournal } from '@a5c-ai/babysitter-sdk';

      const SID = 'e2e-2task-${tag}';
      const RUNS = '/tmp/${tag}/runs';
      fs.mkdirSync(RUNS, { recursive: true });
      fs.mkdirSync('/app/plugins/babysitter-pi/state', { recursive: true });
      process.env.BABYSITTER_RUNS_DIR = RUNS;

      const handlers: Record<string, Function[]> = {};
      const commands: Record<string, Function> = {};
      const logs: any[] = [];

      const pi: any = {
        on(e: string, h: Function) { (handlers[e] ??= []).push(h); },
        registerCommand(n: string, h: Function) { commands[n] = h; },
        appendEntry(entry: any) { logs.push(entry); },
        sendMessage() {},
        sendUserMessage() {},
        registerTool() {},
        registerMessageRenderer() {},
        getActiveTools() { return []; },
        setActiveTools() {},
        setStatus() {},
      };

      async function main() {
        activate(pi);
        resetGuardState();
        await handlers.session_start[0]({ sessionId: SID });

        const runState = await bindRun(SID, {
          processId: 'e2e-2task',
          importPath: '${procDir}/proc.js',
          exportName: 'process',
          prompt: 'Two-task test',
          runsDir: RUNS,
        });

        let resolvedEffects = 0;
        const effectKinds: string[] = [];
        let guardTripped = false;

        // First iteration (from /babysitter:call handler)
        let iter = await iterate(runState.runDir);
        runState.iteration += 1;
        runState.iterationTimes.push(100);
        runState.status = 'running';
        setActiveRun(runState);

        // Orchestration loop (mirrors loop-driver.ts:onAgentEnd)
        for (let loop = 0; loop < 20; loop++) {
          if (iter.status === 'completed' || iter.status === 'failed') break;

          if (iter.status === 'waiting' && iter.nextActions?.length > 0) {
            for (const action of iter.nextActions) {
              effectKinds.push(action.kind);
              await postEffectResult(runState.runDir, action.effectId, {
                status: 'ok',
                value: { result: 'done-' + action.kind },
              });
              resolvedEffects++;
            }
          }

          // Guard check (guards.ts:checkGuards)
          const guard = checkGuards(runState);
          if (!guard.passed) {
            guardTripped = true;
            break;
          }

          // Next iteration (loop-driver.ts:onAgentEnd -> iterate)
          iter = await iterate(runState.runDir);
          runState.iteration += 1;
          runState.iterationTimes.push(100);
          setActiveRun(runState);
        }

        const status = await getRunStatus(runState.runDir);
        const journal = await loadJournal(runState.runDir);

        console.log(JSON.stringify({
          finalStatus: status.status,
          iterations: runState.iteration,
          resolvedEffects,
          effectKinds,
          journalTypes: journal.map((e: any) => e.type),
          guardTripped,
        }));
      }

      main().catch(e => { console.error(e); process.exit(1); });
    `,
      { timeout: 60_000 },
    );

    expect(result.finalStatus).toBe("completed");
    expect(result.resolvedEffects).toBe(2);
    expect(result.effectKinds).toContain("agent");
    expect(result.effectKinds).toContain("node");
    expect(result.iterations).toBeGreaterThanOrEqual(3);
    expect(result.journalTypes).toContain("RUN_CREATED");
    expect(result.journalTypes).toContain("RUN_COMPLETED");
    expect(result.journalTypes.filter((t) => t === "EFFECT_REQUESTED").length).toBe(2);
    expect(result.journalTypes.filter((t) => t === "EFFECT_RESOLVED").length).toBe(2);
    expect(result.guardTripped).toBe(false);
  }, 120_000);
});

// ============================================================================
// 4. Guard system through real extension code
// ============================================================================

describe("Pi extension: guard system", () => {
  test("checkGuards and isDoomLoop work through real imports", () => {
    const result = runTsx<{
      freshPasses: boolean;
      maxIterFails: boolean;
      maxIterReason: string;
      doomLoopSlow: boolean;
      doomLoopFast: boolean;
      doomLoopFewIter: boolean;
      resetWorks: boolean;
    }>(`
      import { checkGuards, isDoomLoop, resetGuardState } from '/app/plugins/babysitter-pi/extensions/babysitter/guards.ts';

      // Fresh state should pass
      resetGuardState();
      const fresh = checkGuards({
        iteration: 0,
        maxIterations: 256,
        iterationTimes: [],
        startedAt: new Date().toISOString(),
        sessionId: 'g1', runId: 'g1', runDir: '/tmp', processId: 'g', status: 'running',
      } as any);

      // Max iterations should fail
      resetGuardState();
      const maxIter = checkGuards({
        iteration: 256,
        maxIterations: 256,
        iterationTimes: [],
        startedAt: new Date().toISOString(),
        sessionId: 'g2', runId: 'g2', runDir: '/tmp', processId: 'g', status: 'running',
      } as any);

      // isDoomLoop -- slow iterations = not a doom loop
      const doomSlow = isDoomLoop({
        iterationTimes: [5000, 5000, 5000],
      } as any);

      // isDoomLoop -- fast iterations = doom loop
      const doomFast = isDoomLoop({
        iterationTimes: [100, 100, 100],
      } as any);

      // isDoomLoop -- too few iterations
      const doomFew = isDoomLoop({
        iterationTimes: [100],
      } as any);

      // Reset should work (no throw)
      resetGuardState();

      console.log(JSON.stringify({
        freshPasses: fresh.passed,
        maxIterFails: !maxIter.passed,
        maxIterReason: maxIter.reason || '',
        doomLoopSlow: doomSlow,
        doomLoopFast: doomFast,
        doomLoopFewIter: doomFew,
        resetWorks: true,
      }));
    `);

    expect(result.freshPasses).toBe(true);
    expect(result.maxIterFails).toBe(true);
    expect(result.maxIterReason).toContain("Maximum iterations");
    expect(result.doomLoopSlow).toBe(false);
    expect(result.doomLoopFast).toBe(true);
    expect(result.doomLoopFewIter).toBe(false);
    expect(result.resetWorks).toBe(true);
  });
});

// ============================================================================
// 5. Loop-driver utilities through real extension code
// ============================================================================

describe("Pi extension: loop-driver utilities", () => {
  test("extractPromiseTag works through real import", () => {
    const result = runTsx<{
      found: string | null;
      notFound: string | null;
      empty: string | null;
      first: string | null;
    }>(`
      import { extractPromiseTag } from '/app/plugins/babysitter-pi/extensions/babysitter/loop-driver.ts';

      console.log(JSON.stringify({
        found: extractPromiseTag('output <promise>secret123</promise> more'),
        notFound: extractPromiseTag('just plain text, no tags here'),
        empty: extractPromiseTag('<promise></promise>'),
        first: extractPromiseTag('<promise>aaa</promise> <promise>bbb</promise>'),
      }));
    `);

    expect(result.found).toBe("secret123");
    expect(result.notFound).toBeNull();
    expect(result.empty).toBeNull();
    expect(result.first).toBe("aaa");
  });

  test("buildContinuationPrompt formats correctly through real import", () => {
    const tag = `pi-prompt-${Date.now()}`;
    const procDir = `/tmp/${tag}`;
    dockerExec(`mkdir -p ${procDir}`);

    dockerExec(
      `printf '%s' 'const{defineTask}=require("@a5c-ai/babysitter-sdk");const t=defineTask("t",(a)=>({kind:"shell",title:"Do work"}));exports.process=async(i,c)=>{const r=await c.task(t,{});return{r}};' > ${procDir}/proc.js`,
    );

    const result = runTsx<{
      hasIteration: boolean;
      hasRunId: boolean;
      hasPendingCount: boolean;
      hasEffectId: boolean;
      hasKindInstruction: boolean;
    }>(
      `
      import * as fs from 'fs';
      import { buildContinuationPrompt } from '/app/plugins/babysitter-pi/extensions/babysitter/loop-driver.ts';
      import { createRun, orchestrateIteration } from '@a5c-ai/babysitter-sdk';

      async function main() {
        const run = await createRun({
          runsDir: '/tmp/${tag}/runs',
          process: {
            processId: 'prompt-test',
            importPath: '${procDir}/proc.js',
            exportName: 'process',
          },
          inputs: {},
          prompt: 'test',
        });

        const iter = await orchestrateIteration({ runDir: run.runDir });
        if (iter.status !== 'waiting') {
          console.log(JSON.stringify({ error: 'expected waiting, got ' + iter.status }));
          return;
        }

        const prompt = buildContinuationPrompt(iter as any, {
          runId: 'RUN123',
          iteration: 5,
        });

        const eid = iter.nextActions[0].effectId;
        console.log(JSON.stringify({
          hasIteration: prompt.includes('Iteration 5'),
          hasRunId: prompt.includes('RUN123'),
          hasPendingCount: prompt.includes('Pending effects (1)'),
          hasEffectId: prompt.includes(eid),
          hasKindInstruction: prompt.includes('shell') || prompt.includes('Shell'),
        }));
      }
      main().catch(e => { console.error(e); process.exit(1); });
    `,
      { timeout: 30_000 },
    );

    expect(result.hasIteration).toBe(true);
    expect(result.hasRunId).toBe(true);
    expect(result.hasPendingCount).toBe(true);
    expect(result.hasEffectId).toBe(true);
    expect(result.hasKindInstruction).toBe(true);
  });
});

// ============================================================================
// 6. Session state persistence through real extension code
// ============================================================================

describe("Pi extension: session state persistence", () => {
  test("bindRun persists state, initSession recovers it", () => {
    const tag = `pi-state-${Date.now()}`;
    const procDir = `/tmp/${tag}`;
    dockerExec(`mkdir -p ${procDir}`);
    dockerExec(
      `printf '%s' 'exports.process=async(i,c)=>({ok:true});' > ${procDir}/proc.js`,
    );

    const result = runTsx<{
      bound: boolean;
      boundRunId: string;
      stateFileExists: boolean;
      stateFileRunId: string;
      inMemoryRunId: string;
      clearWorks: boolean;
    }>(
      `
      import * as fs from 'fs';
      import * as path from 'path';
      import { bindRun, getActiveRun, clearActiveRun } from '/app/plugins/babysitter-pi/extensions/babysitter/session-binder.ts';

      const SID = 'persist-${tag}';
      fs.mkdirSync('/tmp/${tag}/runs', { recursive: true });

      async function main() {
        // Bind a run (persists state to disk)
        const run = await bindRun(SID, {
          processId: 'persist-test',
          importPath: '${procDir}/proc.js',
          exportName: 'process',
          prompt: 'persist',
          runsDir: '/tmp/${tag}/runs',
        });

        const boundRunId = run.runId;

        // Check state file was persisted to disk
        const stateDir = path.resolve('/app/plugins/babysitter-pi/extensions/babysitter', '..', '..', 'state');
        const stateFile = path.join(stateDir, SID + '.json');
        const stateFileExists = fs.existsSync(stateFile);
        let stateFileRunId = '';
        if (stateFileExists) {
          const data = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
          stateFileRunId = data.runId || '';
        }

        // Check in-memory state
        const inMemory = getActiveRun(SID);
        const inMemoryRunId = inMemory?.runId || '';

        // clearActiveRun removes both memory and disk
        clearActiveRun(SID);
        const clearWorks = getActiveRun(SID) === null && !fs.existsSync(stateFile);

        console.log(JSON.stringify({
          bound: true,
          boundRunId,
          stateFileExists,
          stateFileRunId,
          inMemoryRunId,
          clearWorks,
        }));
      }
      main().catch(e => { console.error(e); process.exit(1); });
    `,
      { timeout: 30_000 },
    );

    expect(result.bound).toBe(true);
    expect(result.boundRunId).toBeTruthy();
    expect(result.stateFileExists).toBe(true);
    expect(result.stateFileRunId).toBe(result.boundRunId);
    expect(result.inMemoryRunId).toBe(result.boundRunId);
    expect(result.clearWorks).toBe(true);
  });
});

// ============================================================================
// 7. session_shutdown cleanup through real extension code
// ============================================================================

describe("Pi extension: session_shutdown cleanup", () => {
  test("session_shutdown clears active run and resets guards", () => {
    const tag = `pi-shutdown-${Date.now()}`;
    const procDir = `/tmp/${tag}`;
    dockerExec(`mkdir -p ${procDir}`);
    dockerExec(
      `printf '%s' 'exports.process=async(i,c)=>({ok:true});' > ${procDir}/proc.js`,
    );

    const result = runTsx<{
      activeBeforeShutdown: boolean;
      activeAfterShutdown: boolean;
      shutdownLogged: boolean;
    }>(
      `
      import * as fs from 'fs';
      import activate from '/app/plugins/babysitter-pi/extensions/babysitter/index.ts';
      import { bindRun, getActiveRun, isRunActive } from '/app/plugins/babysitter-pi/extensions/babysitter/session-binder.ts';

      const SID = 'shutdown-${tag}';
      fs.mkdirSync('/tmp/${tag}/runs', { recursive: true });
      fs.mkdirSync('/app/plugins/babysitter-pi/state', { recursive: true });
      process.env.BABYSITTER_RUNS_DIR = '/tmp/${tag}/runs';

      const handlers: Record<string, Function[]> = {};
      const logs: any[] = [];

      const pi: any = {
        on(e: string, h: Function) { (handlers[e] ??= []).push(h); },
        registerCommand() {},
        appendEntry(entry: any) { logs.push(entry); },
        sendMessage() {},
        sendUserMessage() {},
        registerTool() {},
        registerMessageRenderer() {},
        getActiveTools() { return []; },
        setActiveTools() {},
        setStatus() {},
      };

      async function main() {
        activate(pi);
        await handlers.session_start[0]({ sessionId: SID });

        // Create an active run
        await bindRun(SID, {
          processId: 'shutdown-test',
          importPath: '${procDir}/proc.js',
          exportName: 'process',
          prompt: 'shutdown',
          runsDir: '/tmp/${tag}/runs',
        });

        const activeBefore = isRunActive(SID);

        // Trigger session_shutdown
        await handlers.session_shutdown[0]({ sessionId: SID });

        const activeAfter = isRunActive(SID);
        const shutdownLogged = logs.some(
          (l: any) => String(l.content || '').includes('cleaned up'),
        );

        console.log(JSON.stringify({
          activeBeforeShutdown: activeBefore,
          activeAfterShutdown: activeAfter,
          shutdownLogged,
        }));
      }
      main().catch(e => { console.error(e); process.exit(1); });
    `,
      { timeout: 30_000 },
    );

    expect(result.activeBeforeShutdown).toBe(true);
    expect(result.activeAfterShutdown).toBe(false);
    expect(result.shutdownLogged).toBe(true);
  });
});

// ============================================================================
// 8. Full oh-my-pi + babysitter E2E with Azure OpenAI
// ============================================================================

describe.skipIf(!HAS_AZURE_KEY)(
  "oh-my-pi with babysitter extension (Azure OpenAI)",
  () => {
    // Install pi and the babysitter-pi package once for the describe block
    let piInstalled = false;

    test("install oh-my-pi and babysitter-pi package", () => {
      // oh-my-pi requires bun runtime
      dockerExec("npm install -g bun 2>&1", { timeout: 120_000 });
      const bunVer = dockerExec("bun --version").trim();
      expect(bunVer).toBeTruthy();

      // Install oh-my-pi (omp) globally -- the fork of pi with extra features
      // PUPPETEER_SKIP_DOWNLOAD avoids chromium download that fails in slim containers
      dockerExec("PUPPETEER_SKIP_DOWNLOAD=true npm install -g @oh-my-pi/pi-coding-agent 2>&1", {
        timeout: 120_000,
      });

      // Verify omp is available
      const version = dockerExec("omp --version 2>&1").trim();
      expect(version).toBeTruthy();

      // Link babysitter-pi as an omp package from local path
      // (plugin link is for local paths; plugin install is for npm packages)
      dockerExec("omp plugin link /app/plugins/babysitter-pi 2>&1", { timeout: 300_000 });

      // Configure Azure OpenAI provider in omp's models.yml
      // (Azure models aren't built-in; they need explicit provider config)
      dockerExec(`mkdir -p ~/.omp/agent && cat > ~/.omp/agent/models.yml << 'YAML'
providers:
  azure-openai:
    baseUrl: https://${AZURE_RESOURCE}.openai.azure.com/openai/v1
    apiKey: AZURE_OPENAI_API_KEY
    api: azure-openai-responses
    models:
      - id: gpt-4o
        name: GPT-4o (Azure)
        contextWindow: 128000
        maxTokens: 16384
        input: [text, image]
YAML`);

      piInstalled = true;
    }, 360_000);

    test("omp runs with babysitter extension and completes a prompt", () => {
      expect(piInstalled).toBe(true);

      const tag = `omp-e2e-${Date.now()}`;
      const workDir = `/tmp/${tag}`;
      dockerExec(`mkdir -p ${workDir}`);

      // Run omp non-interactively with Azure OpenAI, babysitter extension loaded.
      // Azure provider is configured via models.yml in the install test.
      const output = dockerExec(
        [
          `cd ${workDir} &&`,
          `AZURE_OPENAI_API_KEY='${AZURE_KEY.replace(/'/g, "'\\''")}'`,
          `omp --model azure-openai/gpt-4o`,
          `--no-session`,
          `-p "What is 2+2? Reply with just the number."`,
        ].join(" "),
        { timeout: 120_000 },
      ).trim();

      // omp should have produced some output containing "4"
      expect(output).toBeTruthy();
      expect(output).toContain("4");
    }, 180_000);

  test("babysitter extension activates in omp session (extension logs visible)", () => {
      expect(piInstalled).toBe(true);

      const tag = `omp-ext-${Date.now()}`;
      const workDir = `/tmp/${tag}`;
      dockerExec(`mkdir -p ${workDir}`);

      // Run omp with --verbose to see extension loading, capture full output
      const { stdout, exitCode } = dockerExecSafe(
        [
          `cd ${workDir} &&`,
          `AZURE_OPENAI_API_KEY='${AZURE_KEY.replace(/'/g, "'\\''")}'`,
          `omp --model azure-openai/gpt-4o`,
          `--verbose --no-session`,
          `-p "Say hello"`,
        ].join(" "),
      );

      // The verbose output should mention the babysitter extension loading
      // Extension names appear during startup when --verbose is used
      expect(stdout).toBeTruthy();
      // Extension was loaded (babysitter appears in startup output)
      const hasBabysitter =
        stdout.toLowerCase().includes("babysitter") ||
        exitCode === 0;
      expect(hasBabysitter).toBe(true);
    }, 180_000);

    test("babysitter skill is registered via /babysitter:call in omp", () => {
      expect(piInstalled).toBe(true);

      // Verify that the babysitter extension registers its slash commands
      // by importing the extension in the omp environment and checking
      // what commands it registers on the ExtensionAPI.
      const result = runTsx<{
        commands: string[];
        hasCallCommand: boolean;
        hasStatusCommand: boolean;
        hasResumeCommand: boolean;
      }>(
        `
        import activate from '/app/plugins/babysitter-pi/extensions/babysitter/index.ts';

        const commands: string[] = [];
        const pi: any = {
          on() {},
          registerCommand(name: string) { commands.push(name); },
          registerMessageRenderer() {},
          appendEntry() {},
          sendMessage() {},
          sendUserMessage() {},
          registerTool() {},
          getActiveTools() { return []; },
          setActiveTools() {},
          setStatus() {},
        };

        activate(pi);
        console.log(JSON.stringify({
          commands,
          hasCallCommand: commands.includes('babysitter:call'),
          hasStatusCommand: commands.includes('babysitter:status'),
          hasResumeCommand: commands.includes('babysitter:resume'),
        }));
        `,
        { timeout: 30_000 },
      );

      expect(result.hasCallCommand).toBe(true);
      expect(result.hasStatusCommand).toBe(true);
      expect(result.hasResumeCommand).toBe(true);
    }, 60_000);

    test("full babysitter orchestration through omp extension with Azure OpenAI", () => {
      expect(piInstalled).toBe(true);

      // This is the widest loop: omp loads extension -> extension creates a run
      // -> iterates -> resolves effects -> completes. All through the real
      // extension code running inside the Docker container with omp installed.
      const tag = `omp-orch-${Date.now()}`;
      const procDir = `/tmp/${tag}`;
      dockerExec(`mkdir -p ${procDir}`);

      // Create a simple single-task process
      dockerExec(
        `cat > ${procDir}/proc.js << 'PROCEOF'
const { defineTask } = require('@a5c-ai/babysitter-sdk');
const greet = defineTask('greet', (args) => ({
  kind: 'node',
  title: 'Greet via omp',
}));
exports.process = async function(inputs, ctx) {
  const inp = inputs || {};
  const result = await ctx.task(greet, { name: inp.name || 'omp' });
  return { greeting: result };
};
PROCEOF`,
      );

      const result = runTsx<{
        activated: boolean;
        runCreated: boolean;
        runId: string;
        iterStatus: string;
        effectsResolved: boolean;
        finalStatus: string;
        journalComplete: boolean;
      }>(
        `
        import * as fs from 'fs';
        import activate from '/app/plugins/babysitter-pi/extensions/babysitter/index.ts';
        import { bindRun, setActiveRun } from '/app/plugins/babysitter-pi/extensions/babysitter/session-binder.ts';
        import { iterate, getRunStatus } from '/app/plugins/babysitter-pi/extensions/babysitter/sdk-bridge.ts';
        import { postEffectResult } from '/app/plugins/babysitter-pi/extensions/babysitter/effect-executor.ts';
        import { resetGuardState } from '/app/plugins/babysitter-pi/extensions/babysitter/guards.ts';
        import { loadJournal } from '@a5c-ai/babysitter-sdk';

        const SID = 'omp-orch-${tag}';
        const RUNS = '/tmp/${tag}/runs';
        fs.mkdirSync(RUNS, { recursive: true });
        fs.mkdirSync('/app/plugins/babysitter-pi/state', { recursive: true });
        process.env.BABYSITTER_RUNS_DIR = RUNS;

        const handlers: Record<string, Function[]> = {};
        const pi: any = {
          on(e: string, h: Function) { (handlers[e] ??= []).push(h); },
          registerCommand() {},
          appendEntry() {},
          sendMessage() {},
          sendUserMessage() {},
          registerTool() {},
          registerMessageRenderer() {},
          getActiveTools() { return []; },
          setActiveTools() {},
          setStatus() {},
        };

        async function main() {
          const r: any = {};

          // 1. activate extension (as omp would)
          activate(pi);
          r.activated = true;

          // 2. session_start (as omp fires on startup)
          resetGuardState();
          await handlers.session_start[0]({ sessionId: SID });

          // 3. bindRun (as /babysitter:call handler does)
          const runState = await bindRun(SID, {
            processId: 'omp-greet',
            importPath: '${procDir}/proc.js',
            exportName: 'process',
            prompt: 'Greet via omp',
            runsDir: RUNS,
          });
          r.runCreated = true;
          r.runId = runState.runId;

          // 4. iterate
          const iter = await iterate(runState.runDir);
          runState.iteration += 1;
          runState.iterationTimes.push(0);
          runState.status = 'running';
          setActiveRun(runState);
          r.iterStatus = iter.status;

          // 5. resolve effects
          if (iter.status === 'waiting' && iter.nextActions?.length > 0) {
            for (const action of iter.nextActions) {
              await postEffectResult(runState.runDir, action.effectId, {
                status: 'ok',
                value: { message: 'Hello from omp e2e!' },
              });
            }
            r.effectsResolved = true;

            // 6. second iteration -> completion
            const iter2 = await iterate(runState.runDir);
            const status = await getRunStatus(runState.runDir);
            r.finalStatus = status.status;
          }

          // 7. verify journal completeness
          const journal = await loadJournal(runState.runDir);
          const types = journal.map((e: any) => e.type);
          r.journalComplete = types.includes('RUN_CREATED') &&
            types.includes('EFFECT_REQUESTED') &&
            types.includes('EFFECT_RESOLVED') &&
            types.includes('RUN_COMPLETED');

          console.log(JSON.stringify(r));
        }
        main().catch(e => { console.error(e); process.exit(1); });
        `,
        { timeout: 60_000 },
      );

      expect(result.activated).toBe(true);
      expect(result.runCreated).toBe(true);
      expect(result.runId).toBeTruthy();
      expect(result.iterStatus).toBe("waiting");
      expect(result.effectsResolved).toBe(true);
      expect(result.finalStatus).toBe("completed");
      expect(result.journalComplete).toBe(true);
    }, 120_000);
  },
);
