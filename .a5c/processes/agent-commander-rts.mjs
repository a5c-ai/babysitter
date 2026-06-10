/**
 * @process apps/agent-commander-rts
 * @description Build "A5C Commander" — an RTS-game-style web interface (HUD, units=agent sessions,
 * objectives=tasks, contextual command card, minimap, event ticker) over a deterministic mocked
 * backend whose contracts mirror @a5c-ai/comm-adapter, @a5c-ai/adapters-gateway protocol v1, and
 * kradle resources, so the mock can later be swapped for the real adapter-gateway. Quality-gated
 * phases: scaffold -> frozen e2e authoring from spec -> contracts+sim -> core UI -> HUD ->
 * microagent -> e2e convergence loop -> design polish loop -> docs + final gate.
 * @inputs { repoRoot: string, appDir: string, specPath: string, devPort?: number,
 *   designScoreThreshold?: number, maxFixAttempts?: number, maxE2eRounds?: number, maxPolishRounds?: number }
 * @outputs { success: boolean, appDir: string, e2ePassed: boolean, designScore: number, phases: array }
 *
 * @skill frontend-design specializations/web-development/skills (visual design quality for HUD work)
 * @agent frontend-architect specializations/web-development/agents/frontend-architect/AGENT.md
 * @agent react-developer specializations/web-development/agents/react-developer/AGENT.md
 * @agent e2e-testing specializations/web-development/agents/e2e-testing/AGENT.md
 *
 * @references
 * - specializations/game-development/ui-ux-implementation.js (HUD/game UI phase shape)
 * - specializations/game-development/vertical-slice-development.js (slice-to-quality-bar loop)
 * - specializations/ux-ui-design/pixel-perfect-implementation.js (design polish convergence)
 * - tdd-quality-convergence.js (gate/fix convergence loops)
 * - specializations/web-development/e2e-testing-playwright.js
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    repoRoot,
    appDir = 'apps/commander',
    specPath = 'apps/commander/SPEC.md',
    devPort = 5199,
    designScoreThreshold = 85,
    maxFixAttempts = 4,
    maxE2eRounds = 5,
    maxPolishRounds = 3,
  } = inputs;

  const appAbs = `${repoRoot}/${appDir}`;
  const specAbs = `${repoRoot}/${specPath}`;
  const phases = [];

  ctx.log('info', `A5C Commander build starting in ${appAbs}`);

  // Runtime spec read (drift defense): spec bytes are interpolated verbatim downstream.
  const spec = await ctx.task(readSpecTask, { specAbs });
  const specText = spec.stdout;

  // Convergence helper: deterministic shell gate + agent fix loop.
  async function gatedLoop(phase, gateLabel, gateCommand, timeoutMs) {
    let gate = await ctx.task(gateTask, { label: gateLabel, command: gateCommand, timeoutMs, phase });
    let attempt = 0;
    while (!gate.passed && attempt < maxFixAttempts) {
      attempt += 1;
      await ctx.task(fixTask, {
        phase, gateLabel, attempt, appAbs, devPort, specText,
        exitCode: gate.exitCode, stdoutTail: gate.stdoutTail, stderrTail: gate.stderrTail,
      });
      gate = await ctx.task(gateTask, { label: gateLabel, command: gateCommand, timeoutMs, phase, attempt });
    }
    if (!gate.passed) {
      throw new Error(`Quality gate "${gateLabel}" still failing after ${maxFixAttempts} fix attempts (phase: ${phase})`);
    }
    return gate;
  }

  async function commitPhase(phase) {
    await ctx.task(commitTask, { phase, repoRoot, appDir });
  }

  // ---- Phase 1: Scaffold ----------------------------------------------------
  await ctx.task(implementTask, {
    phase: 'scaffold', appAbs, devPort, specText,
    mission: [
      `Create the complete project scaffold for the app at ${appAbs} exactly per SPEC sections 11 (stack, file layout, dependency allowlist) and 9 (test hooks).`,
      'Author: package.json (private, type module, scripts: dev/build/preview/test/test:e2e/typecheck), vite.config.ts (react plugin + @tailwindcss/vite, server.port from SPEC), tsconfig.json (strict, react-jsx, bundler resolution, vitest+playwright types as needed), index.html, playwright.config.ts (chromium only, webServer starting vite dev on the SPEC port, baseURL, reuseExistingServer true locally), src/main.tsx, src/App.tsx, src/styles.css (Tailwind v4 import + base theme tokens per SPEC section 10).',
      'App.tsx may render a minimal placeholder war-room shell (dark background, "A5C COMMANDER" wordmark) — real UI comes in later phases.',
      'Create empty-but-compiling stub modules for the directory layout in SPEC section 11 ONLY where needed for tsc to pass; do not implement features yet.',
      'Run npm install inside the app directory ONLY (never at the repo root). Pin nothing exotic; use current stable majors per the allowlist.',
      'Verify locally before finishing: npm install succeeds, npx tsc --noEmit passes, npx vite build passes.',
    ],
  });
  phases.push('scaffold');
  await gatedLoop('scaffold', 'scaffold-build-gate',
    `cd "${appAbs}" && npm install --no-audit --no-fund && npx tsc --noEmit && npx vite build`, 600000);
  await commitPhase('scaffold');

  // ---- Phase 2: Frozen e2e specs authored from SPEC (before implementation) --
  await ctx.task(authorE2eTask, { phase: 'author-e2e', appAbs, devPort, specText });
  phases.push('author-e2e');
  await gatedLoop('author-e2e', 'e2e-author-gate',
    `cd "${appAbs}" && npx playwright install chromium && npx tsc --noEmit && npx playwright test --list`, 600000);
  await commitPhase('author-e2e');

  // ---- Phase 3: Contracts + mock backend + deterministic simulation ----------
  await ctx.task(implementTask, {
    phase: 'contracts-and-sim', appAbs, devPort, specText,
    mission: [
      'Implement src/contracts/ (adapter-events.ts, gateway-protocol.ts, kradle-resources.ts, index.ts) mirroring the real contracts per SPEC sections 2 and 7 — mirror shapes faithfully from the source-of-truth paths listed in SPEC section 2 (read those real files for fidelity; they exist on disk).',
      'Implement src/backend/types.ts (CommanderBackend interface exactly as SPEC section 7) and src/backend/mock/ (prng.ts seeded PRNG, scenario.ts seeded world generation, simulation.ts tick engine, mockBackend.ts implementing CommanderBackend over the sim with ServerFrame emission and ClientFrame handling).',
      'Sim requirements: 250ms ticks, pausable/steppable, deterministic (same seed + same commands => identical state), units progress through the lifecycle in SPEC section 3, approval hook.request scenarios fire occasionally, costs/token usage accumulate, commands (session.start, session.message, stop, hook.decision) visibly affect the sim.',
      'Author Vitest unit tests in src/backend/mock/__tests__/: determinism (two engines, same seed, 200 ticks => deep-equal snapshots), command effects (dispatch assigns unit and changes state; hook.decision allow resumes the unit; abort idles it), event emission shape (frames match the mirrored protocol types).',
      'Keep everything framework-free (no React imports) in backend/ and contracts/.',
      'Verify before finishing: npx tsc --noEmit && npx vitest run pass locally.',
    ],
  });
  phases.push('contracts-and-sim');
  await gatedLoop('contracts-and-sim', 'contracts-sim-gate',
    `cd "${appAbs}" && npx tsc --noEmit && npx vitest run`, 480000);
  await commitPhase('contracts-and-sim');

  // ---- Phase 4: Core game UI — map, units, camera, selection, input ----------
  await ctx.task(implementTask, {
    phase: 'core-game-ui', appAbs, devPort, specText,
    mission: [
      'Implement the core game layer per SPEC sections 4, 5, 6: src/game/ (store.ts Zustand slices exactly as SPEC section 6, selectors.ts, camera.ts pan/zoom math with clamping, layout.ts seeded world layout, input.ts mouse/keyboard grammar) and src/components/map/ (MapViewport with transformed world layer, UnitSprite with state ring + health/energy bars + portrait slot, TaskNode with progress ring, LinkLayer SVG, SelectionBox marquee, PingLayer).',
      'Wire MockBackend frames into the store: one store commit per sim tick (batch), derived unit visual states per SPEC section 3.',
      'Interaction grammar from SPEC section 5 must work: click/shift-click/marquee select, right-click dispatch and rally, double-click inspector intent (stub panel ok this phase), wheel zoom toward cursor, WASD/arrow pan, Esc, control groups Ctrl+1..9 and recall, F idle-cycle, Space jump-to-alert.',
      'Expose window.__commander test hooks per SPEC section 9 and put data-testid attributes on units/tasks per SPEC.',
      'Replace the placeholder App with the real WarRoom composition (HUD components may be minimal placeholders; they are the next phase).',
      'Add focused Vitest tests for camera math, selection reducer logic, and control groups.',
      'Verify before finishing: npx tsc --noEmit && npx vitest run && npx vite build pass locally; also run the dev server briefly and confirm units render and move.',
    ],
  });
  phases.push('core-game-ui');
  await gatedLoop('core-game-ui', 'core-ui-gate',
    `cd "${appAbs}" && npx tsc --noEmit && npx vitest run && npx vite build`, 480000);
  await commitPhase('core-game-ui');

  // ---- Phase 5: HUD — top bar, minimap, selection panel, command card, ticker, alerts, inspector
  await ctx.task(implementTask, {
    phase: 'hud', appAbs, devPort, specText,
    mission: [
      'Implement the full HUD per SPEC section 4: src/components/hud/ (TopBar with live resource counters and sim clock, Minimap canvas with viewport rect + pings + click-to-jump, SelectionPanel single/multi/task modes, CommandCard 3x4 grid with hotkey hints QWER/ASDF/ZXCV, EventTicker with clickable focus behavior, AlertBanner with inline Approve/Deny) and src/components/panels/ (Inspector slide-over with live transcript of messages/tool calls, SteerModal sending session.message).',
      'CommandCard consumes the Microagent interface (SPEC section 8) — wire it against a temporary minimal rule-based stub if the microagent phase has not run yet, keeping the interface boundary clean.',
      'Approve/Deny must send hook.decision frames; Steer must send session.message; Abort must stop the run — all visibly affecting the sim.',
      'All required data-testid attributes per SPEC section 9. Respect the layout diagram and glass-panel visual direction (SPEC sections 4 and 10).',
      'Verify before finishing: npx tsc --noEmit && npx vite build pass; dev-server sanity check that HUD panels render and update during sim.',
    ],
  });
  phases.push('hud');
  await gatedLoop('hud', 'hud-gate',
    `cd "${appAbs}" && npx tsc --noEmit && npx vitest run && npx vite build`, 480000);
  await commitPhase('hud');

  // ---- Phase 6: Microagent — contextual commands + procedural friendly icons -
  await ctx.task(implementTask, {
    phase: 'microagent', appAbs, devPort, specText,
    mission: [
      'Implement src/microagent/ per SPEC section 8: types.ts (Microagent, CommandContext, CommandSpec, IconSpec) and mock/ (commandGen.ts rule-based contextual command generation for every selection state in SPEC section 8 including mixed-selection intersection and global commands; iconGen.ts deterministic procedural friendly SVG avatar generator — rounded body + eyes + crest, adapter-keyed palettes for units, taskKind glyph badges for tasks).',
      'Replace any temporary command stub from the HUD phase with this implementation; unit portraits and task node icons must now render generated IconSpecs everywhere (sprites, selection panel, command card, inspector header).',
      'Author Vitest tests: same entity id => byte-identical SVG; distinct adapters => distinct palettes; command sets match expected intents per selection state (idle/working/awaiting_approval/task/mixed/empty).',
      'Icons must be friendly and cute against the dark HUD ("tamagotchi war room") while staying crisp at 24-64px.',
      'Verify before finishing: npx tsc --noEmit && npx vitest run pass locally.',
    ],
  });
  phases.push('microagent');
  await gatedLoop('microagent', 'microagent-gate',
    `cd "${appAbs}" && npx tsc --noEmit && npx vitest run && npx vite build`, 480000);
  await commitPhase('microagent');

  // ---- Phase 7: E2E convergence loop -----------------------------------------
  let e2ePassed = false;
  for (let round = 0; round < maxE2eRounds; round += 1) {
    const e2e = await ctx.task(gateTask, {
      label: 'playwright-e2e', phase: 'e2e-convergence', attempt: round,
      command: `cd "${appAbs}" && npx playwright test --reporter=line`, timeoutMs: 900000,
    });
    if (e2e.passed) { e2ePassed = true; break; }
    await ctx.task(fixTask, {
      phase: 'e2e-convergence', gateLabel: 'playwright-e2e', attempt: round + 1, appAbs, devPort, specText,
      exitCode: e2e.exitCode, stdoutTail: e2e.stdoutTail, stderrTail: e2e.stderrTail,
      note: 'Fix the APPLICATION to satisfy the frozen e2e specs. Only modify a test if it objectively contradicts the SPEC text below — cite the SPEC line when doing so.',
    });
  }
  if (!e2ePassed) {
    throw new Error(`Playwright e2e suite still failing after ${maxE2eRounds} convergence rounds`);
  }
  phases.push('e2e-convergence');
  await commitPhase('e2e-convergence');

  // ---- Phase 8: Design polish convergence ------------------------------------
  let designScore = 0;
  for (let round = 0; round < maxPolishRounds; round += 1) {
    const review = await ctx.task(designReviewTask, { appAbs, devPort, specText, round, designScoreThreshold });
    designScore = review.score;
    if (review.score >= designScoreThreshold) break;
    if (round < maxPolishRounds - 1) {
      await ctx.task(polishTask, { appAbs, devPort, specText, round, findings: review.findings, score: review.score });
      await gatedLoop('design-polish', `polish-regression-gate-r${round}`,
        `cd "${appAbs}" && npx tsc --noEmit && npx vitest run && npx playwright test --reporter=line`, 900000);
    }
  }
  phases.push('design-polish');
  await commitPhase('design-polish');

  // ---- Phase 9: Docs + final verification ------------------------------------
  await ctx.task(readmeTask, { appAbs, devPort, specText, designScore });
  const finalGate = await gatedLoop('final', 'final-full-gate',
    `cd "${appAbs}" && npx tsc --noEmit && npx vitest run && npx vite build && npx playwright test --reporter=line`, 900000);
  phases.push('final');
  await commitPhase('final');

  ctx.log('info', `A5C Commander complete. e2e=${e2ePassed} design=${designScore}`);
  return { success: true, appDir, e2ePassed, designScore, finalGatePassed: finalGate.passed, phases };
}

// ----------------------------------------------------------------------------
// Tasks
// ----------------------------------------------------------------------------

export const readSpecTask = defineTask('read-spec', (args, taskCtx) => ({
  kind: 'shell',
  title: `Read SPEC at ${args.specAbs}`,
  shell: { command: `cat "${args.specAbs}"`, expectedExitCode: 0, timeout: 10000 },
  outputSchema: { type: 'object', required: ['stdout'], properties: { stdout: { type: 'string' } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

export const gateTask = defineTask('quality-gate', (args, taskCtx) => ({
  kind: 'shell',
  title: `Gate: ${args.label}${args.attempt != null ? ` (attempt ${args.attempt})` : ''}`,
  labels: ['verification', args.phase ?? 'gate'],
  shell: { command: args.command, expectedExitCode: 0, timeout: args.timeoutMs ?? 480000 },
  outputSchema: {
    type: 'object',
    required: ['passed', 'exitCode'],
    properties: {
      passed: { type: 'boolean' }, exitCode: { type: 'number' },
      stdoutTail: { type: 'string' }, stderrTail: { type: 'string' },
    },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

export const implementTask = defineTask('implement-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement phase: ${args.phase}`,
  labels: ['implementation', args.phase],
  execution: { model: 'claude-fable-5' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior frontend/game-UI engineer building a production-quality RTS-style orchestration console',
      task: `Execute the "${args.phase}" phase fully inside ${args.appAbs}. Perform the work for real (create/edit files, run commands); do not return a plan.`,
      context: { appDir: args.appAbs, devPort: args.devPort, phase: args.phase },
      instructions: [
        ...args.mission,
        'Work ONLY inside the app directory (plus reading the source-of-truth contract files referenced by the SPEC).',
        'Never run npm at the repository root. Never edit root package.json or root package-lock.json.',
        'Honor the dependency allowlist in SPEC section 11 strictly — no new runtime dependencies.',
        'Code style: TypeScript strict, no `any` (use unknown + narrowing), no floating promises, small focused modules.',
        'Before finishing, run the phase verification commands listed in your mission and fix what they surface.',
        '',
        'SPEC (verbatim, the sole source of truth — do not paraphrase or reinterpret):',
        '---',
        args.specText,
        '---',
      ],
      outputFormat: 'JSON: { "summary": string, "filesChanged": string[], "verification": string, "notes": string }',
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'filesChanged'],
      properties: {
        summary: { type: 'string' }, filesChanged: { type: 'array' },
        verification: { type: 'string' }, notes: { type: 'string' },
      },
    },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

export const authorE2eTask = defineTask('author-e2e-from-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author frozen Playwright e2e specs from SPEC (before implementation)',
  labels: ['testing', 'e2e'],
  execution: { model: 'claude-fable-5' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'E2E test author (Playwright). You write acceptance tests strictly from a spec, never from implementation.',
      task: `Author the complete Playwright e2e suite under ${args.appAbs}/e2e/ covering EVERY acceptance criterion AC1-AC14, organized into the spec files named in SPEC section 13.`,
      context: { appDir: args.appAbs, devPort: args.devPort },
      instructions: [
        'Treat the SPEC block below as the sole source of truth. Do NOT read files under src/ — the implementation does not exist yet and must not shape the tests.',
        'You MAY read playwright.config.ts and package.json for config alignment.',
        'Use the test hooks API and data-testid contract from SPEC sections 9 and 12-13: drive determinism via ?seed=42, window.__commander.sim.pause()/tick(n); no arbitrary timeouts beyond UI settle.',
        'Name each test with its AC id (e.g. "AC4: right-click dispatch assigns unit"). Cite the AC for every assertion group in a comment.',
        'Tests must compile under tsc and be listable via `npx playwright test --list`.',
        'If an AC is untestable as written, add a test.fixme with a comment quoting the SPEC line — do not silently reinterpret it.',
        'These tests become FROZEN inputs: later implementation phases make them pass; they are not adjusted to match what gets built.',
        '',
        'SPEC (verbatim, do not paraphrase):',
        '---',
        args.specText,
        '---',
      ],
      outputFormat: 'JSON: { "summary": string, "specFiles": string[], "acCoverage": string }',
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'specFiles'],
      properties: { summary: { type: 'string' }, specFiles: { type: 'array' }, acCoverage: { type: 'string' } },
    },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

export const fixTask = defineTask('fix-gate-failure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix ${args.gateLabel} failure (attempt ${args.attempt})`,
  labels: ['fix', args.phase],
  execution: { model: 'claude-fable-5' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior engineer doing root-cause fixes on a failing quality gate',
      task: `The deterministic gate "${args.gateLabel}" failed (exit ${args.exitCode}) during phase "${args.phase}" in ${args.appAbs}. Diagnose from the output below, fix the root cause for real, and re-run the failing command locally until it passes.`,
      context: { appDir: args.appAbs, devPort: args.devPort, phase: args.phase, attempt: args.attempt },
      instructions: [
        args.note ?? 'Fix the application/tests honestly — never weaken, skip, or delete checks to force a pass.',
        'Work only inside the app directory. No new dependencies. Never run npm at the repo root.',
        '',
        'GATE STDOUT (tail):',
        '---',
        args.stdoutTail ?? '(empty)',
        '---',
        'GATE STDERR (tail):',
        '---',
        args.stderrTail ?? '(empty)',
        '---',
        '',
        'SPEC (verbatim, authoritative):',
        '---',
        args.specText,
        '---',
      ],
      outputFormat: 'JSON: { "summary": string, "rootCause": string, "filesChanged": string[] }',
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'rootCause'],
      properties: { summary: { type: 'string' }, rootCause: { type: 'string' }, filesChanged: { type: 'array' } },
    },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

export const designReviewTask = defineTask('design-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design review round ${args.round} (threshold ${args.designScoreThreshold})`,
  labels: ['review', 'design'],
  execution: { model: 'claude-fable-5' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Exacting game-UI art director reviewing an RTS command-deck interface against its spec',
      task: `Visually evaluate the running app at ${args.appAbs}. Capture real screenshots, score 0-100 against the rubric, and return concrete findings.`,
      context: { appDir: args.appAbs, devPort: args.devPort, round: args.round },
      instructions: [
        'Write a small throwaway Playwright script (e.g. e2e/__shots__/capture.ts or a node script) that boots the app with ?seed=42, pauses the sim, ticks it to interesting states, and captures >=4 PNGs at 1600x900 into e2e/__shots__/: (1) boot overview, (2) single unit selected with command card populated, (3) multi-selection marquee result, (4) alert/approval state with banner and minimap ping, (5) inspector open if feasible.',
        'Evaluate against SPEC sections 4, 5, 10, 14 — rubric dimensions (weight): cohesive dark command-deck theme and palette discipline (20), HUD hierarchy and legibility at a glance (20), game-feel motion and selection/ping feedback (15), friendly procedural icon quality and contrast (15), layout fidelity to SPEC section 4 diagram (15), micro-detail polish: glows, glass borders, scanline restraint, empty states (15).',
        'Score honestly; a default-Tailwind-looking page scores < 50. List findings as specific, actionable items with the component/file to touch.',
        'Return JSON only: score (number), findings (array of { area, severity: "high"|"medium"|"low", suggestion }), screenshots (array of paths).',
        '',
        'SPEC (verbatim):',
        '---',
        args.specText,
        '---',
      ],
      outputFormat: 'JSON: { "score": number, "findings": [{"area": string, "severity": string, "suggestion": string}], "screenshots": string[] }',
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'findings'],
      properties: { score: { type: 'number' }, findings: { type: 'array' }, screenshots: { type: 'array' } },
    },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

export const polishTask = defineTask('design-polish', (args, taskCtx) => ({
  kind: 'agent',
  title: `Apply design polish round ${args.round} (score ${args.score})`,
  labels: ['implementation', 'design'],
  execution: { model: 'claude-fable-5' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior UI engineer with strong visual craft applying art-director feedback',
      task: `Apply the design findings below to the app at ${args.appAbs} without breaking any tests or the SPEC interaction grammar.`,
      context: { appDir: args.appAbs, devPort: args.devPort, round: args.round, currentScore: args.score },
      instructions: [
        'Address high-severity findings first, then medium. Keep changes surgical — styling, motion, composition; do not restructure state or contracts.',
        'Do not change data-testid attributes or the test hooks API; the frozen e2e suite must keep passing.',
        `FINDINGS (JSON): ${JSON.stringify(args.findings)}`,
        'Verify before finishing: npx tsc --noEmit && npx vitest run pass, and spot-check the dev server visually.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specText,
        '---',
      ],
      outputFormat: 'JSON: { "summary": string, "filesChanged": string[] }',
    },
    outputSchema: {
      type: 'object',
      required: ['summary'],
      properties: { summary: { type: 'string' }, filesChanged: { type: 'array' } },
    },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

export const readmeTask = defineTask('write-readme', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author README and integration guide',
  labels: ['docs'],
  execution: { model: 'claude-fable-5' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical writer who is also the engineer who built the system',
      task: `Write ${args.appAbs}/README.md documenting A5C Commander.`,
      context: { appDir: args.appAbs, devPort: args.devPort, designScore: args.designScore },
      instructions: [
        'Sections: what it is (one screenshot-worthy paragraph), quickstart (npm install / npm run dev / tests), the RTS-to-orchestration concept mapping table, controls reference (full keyboard/mouse grammar), architecture overview (contracts / backend / microagent / game / components with the swap-the-mock-for-adapter-gateway recipe: implement CommanderBackend over a WebSocket speaking gateway protocol v1, point microagent at a real generator), test hooks API, and the workspace note about apps/ vs packages/* (own lockfile, never npm install at repo root).',
        'Read the actual implementation to keep every claim true. Keep it tight and skimmable.',
        '',
        'SPEC (verbatim, for terminology consistency):',
        '---',
        args.specText,
        '---',
      ],
      outputFormat: 'JSON: { "summary": string, "path": string }',
    },
    outputSchema: { type: 'object', required: ['summary'], properties: { summary: { type: 'string' }, path: { type: 'string' } } },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));

export const commitTask = defineTask('commit-phase', (args, taskCtx) => ({
  kind: 'shell',
  title: `Commit phase: ${args.phase}`,
  labels: ['git'],
  shell: {
    command: `cd "${args.repoRoot}" && git add "${args.appDir}" && (git commit -m "feat(commander): ${args.phase} phase — RTS agent orchestration console" || echo "nothing to commit") && (git push -u origin HEAD || echo "push skipped")`,
    expectedExitCode: 0,
    timeout: 120000,
  },
  outputSchema: {
    type: 'object',
    required: ['passed', 'exitCode'],
    properties: { passed: { type: 'boolean' }, exitCode: { type: 'number' }, stdoutTail: { type: 'string' }, stderrTail: { type: 'string' } },
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`, outputJsonPath: `tasks/${taskCtx.effectId}/output.json` },
}));
