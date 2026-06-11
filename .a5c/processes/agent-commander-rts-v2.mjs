/**
 * @process apps/agent-commander-rts-v2
 * @description A5C Commander v2 — "The Aegis Cogitator": steampunk re-theme per reference plate,
 * deep task-kind/stage-aware contextual commands with generated icons, kradle-mirrored memory
 * silo graph visualization with agent piece transfer, task hierarchy, babysitter process-flow
 * inspector tab, Foundry creation flows (tasks + agents), and workspace diff/approval view.
 * Quality-gated phases extending the completed v1 run (01KTSGPJMFW063K161380HWD24); the frozen
 * v1 e2e suite gates every phase alongside a new frozen v2 suite authored from SPEC-V2.md.
 * @inputs { repoRoot: string, appDir: string, specPaths: string[], devPort?: number,
 *   designScoreThreshold?: number, maxFixAttempts?: number, maxE2eRounds?: number,
 *   maxPolishRounds?: number, relatedRunId?: string }
 * @outputs { success: boolean, appDir: string, e2ePassed: boolean, designScore: number, phases: array }
 *
 * @skill frontend-design specializations/web-development/skills (visual design quality)
 * @agent frontend-architect specializations/web-development/agents/frontend-architect/AGENT.md
 * @agent react-developer specializations/web-development/agents/react-developer/AGENT.md
 * @agent e2e-testing specializations/web-development/agents/e2e-testing/AGENT.md
 *
 * @references
 * - .a5c/processes/agent-commander-rts.mjs (v1 process; same gate/fix convergence skeleton)
 * - specializations/game-development/ui-ux-implementation.js
 * - specializations/ux-ui-design/pixel-perfect-implementation.js
 * - tdd-quality-convergence.js
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    repoRoot,
    appDir = 'apps/commander',
    specPaths = ['apps/commander/SPEC.md', 'apps/commander/SPEC-V2.md'],
    devPort = 5199,
    designScoreThreshold = 85,
    maxFixAttempts = 4,
    maxE2eRounds = 5,
    maxPolishRounds = 3,
  } = inputs;

  const appAbs = `${repoRoot}/${appDir}`;
  const specAbsList = specPaths.map((p) => `${repoRoot}/${p}`);
  const phases = [];

  ctx.log('info', `A5C Commander v2 (Aegis Cogitator) starting in ${appAbs}`);

  // Runtime spec read (drift defense): both spec files, interpolated verbatim downstream.
  const spec = await ctx.task(readSpecTask, { specAbsList });
  const specText = spec.stdout;

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

  const FULL_GATE = `cd "${appAbs}" && npx tsc --noEmit && npx vitest run && npx vite build && npx playwright test --reporter=line`;
  const UNIT_GATE = `cd "${appAbs}" && npx tsc --noEmit && npx vitest run`;
  const BUILD_GATE = `cd "${appAbs}" && npx tsc --noEmit && npx vitest run && npx vite build`;

  // ---- Phase 1: Aegis Cogitator re-theme -------------------------------------
  await ctx.task(implementTask, {
    phase: 'cogitator-retheme', appAbs, devPort, specText,
    mission: [
      'Re-theme the entire app to the Aegis Cogitator steampunk visual language per SPEC-V2 section V2-1: parchment field, slate-umber panels with brass/gold etched borders + corner-gear and rivet ornament (inline path-only SVG or CSS), warm amber glows and oval eye indicators, sepia illustration-plate surfaces, serif small-caps display typography with mono numbers, jewel stained-glass faction tints, paper-grain texture replacing scanlines, aged drafting-paper map floor with gear watermarks.',
      'Evolve the procedural icon generator (src/microagent/mock/iconGen.ts) to v2 clockwork-creature avatars: gear-and-boiler bodies, brass limbs/antennae, stained-glass wing/shell panels, expressive eyes — friendly hand-drawn spirit, still hash-derived, byte-identical per id, path-only, crisp 24-64px. Task nodes become brass-ringed wax-seal badges.',
      'This is a RE-SKIN: do not change layout geometry, hit targets, boot camera, staging rows, interaction grammar, data-testids, command labels, or store/sim behavior. Update icon-related unit tests for the new style where they assert specifics (byte-identity and palette-distinctness invariants must still hold).',
      'The frozen v1 e2e suite must keep passing untouched.',
      'Verify before finishing: npx tsc --noEmit && npx vitest run && npx vite build && npx playwright test --reporter=line (16 passed / 1 skipped baseline).',
    ],
  });
  phases.push('cogitator-retheme');
  await gatedLoop('cogitator-retheme', 'retheme-gate', FULL_GATE, 900000);
  await commitPhase('cogitator-retheme');

  // ---- Phase 2: Frozen v2 e2e specs authored from SPEC-V2 ---------------------
  await ctx.task(authorE2eTask, { phase: 'author-e2e-v2', appAbs, devPort, specText });
  phases.push('author-e2e-v2');
  await gatedLoop('author-e2e-v2', 'e2e-v2-author-gate',
    `cd "${appAbs}" && npx tsc --noEmit && npx playwright test --list`, 480000);
  await commitPhase('author-e2e-v2');

  // ---- Phase 3: Sim + contract extensions -------------------------------------
  await ctx.task(implementTask, {
    phase: 'sim-extensions', appAbs, devPort, specText,
    mission: [
      'Extend src/contracts/ with faithful mirrors per SPEC-V2 sections V2-3/V2-5/V2-7: kradle memory resources (AgentMemoryRepository/Source/Query/Update specs, GraphRecord with the verbatim node/edge kind unions, queryGraph result shapes) in a new contracts/kradle-memory.ts; babysitter run-observation shapes (JournalEvent, ObservedRunState, EffectStatus, pendingEffectsByKind, effect kinds) in contracts/babysitter-run.ts; workspace/review shapes (AgentWorkspaceStatus.gitStatus, PatchArtifact, AgentApproval, WriteBackPolicy) in contracts/kradle-workspace.ts. Read the source-of-truth files referenced in SPEC-V2 for fidelity.',
      'Extend the sim (src/backend/mock/) per SPEC-V2: (a) task kinds expanded to the full V2-2 list and task HIERARCHY per V2-4 (parent label linkage, 2-3 roots with 2-4 children, parent progress aggregation, dispatch-to-parent auto-assigns an open child); (b) unified memory graph of 40-60 records partitioned across 3-4 silos, periodic deterministic memory_query/memory_update events with held-pieces tracking per unit (V2-3); (c) per-run babysitter process model per V2-5 (kind-derived phase pipelines, journal events EFFECT_REQUESTED/RESOLVED per phase, breakpoint effects for approvals, ObservedRunState derivation, ring-capped journals); (d) workspace changes per V2-7 (deterministic changed-file lists with synthetic unified diffs, testEvidence, write-back AgentApproval lifecycle with approve-applies/reject-returns-to-working, alerts tagged kind write-back); (e) creation verbs createTask/createUnit per V2-6 with deterministic ids and events.',
      'Maintain ALL existing determinism guarantees: the baseline no-command frame stream from a given seed may change (new features emit events) but must remain deterministic — update the determinism tests accordingly (two engines, same seed, 200 ticks => deep-equal). Existing command-effect tests must keep passing.',
      'Add focused unit tests for: hierarchy aggregation + dispatch-to-parent, memory partition coverage + query/update determinism + held-pieces, journal/state derivation (waiting with pending breakpoint, completed), workspace diff generation determinism + approval lifecycle, creation verbs.',
      'Backend/contracts stay framework-free. Do not modify e2e/.',
      'Verify before finishing: npx tsc --noEmit && npx vitest run pass.',
    ],
  });
  phases.push('sim-extensions');
  await gatedLoop('sim-extensions', 'sim-extensions-gate', UNIT_GATE, 480000);
  await commitPhase('sim-extensions');

  // ---- Phase 4: Microagent v2 — deep contextual commands ----------------------
  await ctx.task(implementTask, {
    phase: 'microagent-v2', appAbs, devPort, specText,
    mission: [
      'Implement SPEC-V2 section V2-2 in the microagent (src/microagent/): kind-specific command sets for all ten task kinds, layered over lifecycle staples with the stated priority rules (never drop Abort; <=12), task-node kind-aware sets, and context inputs from run stage, approval state, and workspace dirt (extend CommandContext/buildCommandContext as needed).',
      'Every command id gets a DISTINCT procedural engraved-brass-style glyph from the icon generator (path-only). Extend the icon generator with a command-glyph family for the new commands.',
      'Every new intent must do something visible and honest via the sim verbs added in the previous phase (Run Tests emits a named tool_call pair with deterministic outcome and progress bump; Approve Review/Request Changes act on the write-back approval when present or the review task progress otherwise; Open Diff opens the Inspector Workspace tab intent; Archive to Brain emits a memory_update; etc.). Wire intents through the single executeIntent switch in src/game/commands.ts.',
      'v1 frozen labels and sets for the selections the v1 suite exercises must be unchanged (pure idle units, pure same-state multi-select, empty selection).',
      'Extend microagent unit tests: per-kind expected command sets, icon presence + distinctness per set, <=12 sweep across kinds x states, frozen-label invariants.',
      'Verify before finishing: npx tsc --noEmit && npx vitest run && npx vite build pass.',
    ],
  });
  phases.push('microagent-v2');
  await gatedLoop('microagent-v2', 'microagent-v2-gate', BUILD_GATE, 480000);
  await commitPhase('microagent-v2');

  // ---- Phase 5: Feature UI A — Archive (memory) + hierarchy --------------------
  await ctx.task(implementTask, {
    phase: 'ui-memory-hierarchy', appAbs, devPort, specText,
    mission: [
      'Implement SPEC-V2 section V2-3 UI: the Archive overlay (topbar-memory button + M key, Esc cascade extended) — silo cards, deterministic radial/clustered SVG graph (nodes colored+badged by nodeKind, edges as <path> curves ONLY, silo sector hulls/rings), nodeKind filter chips, node attribute cards, silo focus, unit held-pieces highlighting, animated transfer pulses on memory_query/memory_update events, ticker logging. All V2-3 testids.',
      'Implement SPEC-V2 section V2-4 UI: parent task nodes larger with child-count pip, engraved <path> connector arcs to children clustered around them, SelectionPanel task hierarchy breadcrumb + clickable children list, dispatch-to-parent visible auto-assignment.',
      'Performance: the overlay renders 40-60 nodes + edges as static SVG with CSS transitions; no per-tick re-layout (layout is seed-deterministic and cached); transfer pulses are transient elements.',
      'CRITICAL: zero new <line>/<polyline> elements anywhere (frozen census). Do not modify e2e/. Keep all v1 behaviors.',
      'Add unit tests for the deterministic graph layout (same seed => same positions) and held-pieces selectors.',
      'Verify before finishing: npx tsc --noEmit && npx vitest run && npx vite build pass, plus a brief dev-server sanity check of the overlay.',
    ],
  });
  phases.push('ui-memory-hierarchy');
  await gatedLoop('ui-memory-hierarchy', 'ui-a-gate', BUILD_GATE, 480000);
  await commitPhase('ui-memory-hierarchy');

  // ---- Phase 6: Feature UI B — Process tab, Workspace tab, Foundry -------------
  await ctx.task(implementTask, {
    phase: 'ui-process-workspace-foundry', appAbs, devPort, specText,
    mission: [
      'Implement SPEC-V2 section V2-5 UI: tabbed Inspector (Transcript default + Process + Workspace, with the stated testids); Process tab = brass stage pipeline (done/current/pending chip states, gear spinner on current), ObservedRunState badge, pendingEffectsByKind chips, auto-following journal list; SelectionPanel gains the sel-stage chip.',
      'Implement SPEC-V2 section V2-7 UI: Workspace tab — gitStatus header (branch, short sha, dirty badge, phase, test-evidence chip), changed-file list with status letters and +/- counts, sepia diff plate with verdigris additions / garnet deletions and engraved line numbers, write-back approval bar (ws-approve / ws-reject) wired to the sim approval lifecycle; workspace zone dirty-count badge on the map; AlertBanner write-back alerts deep-link to this tab.',
      'Implement SPEC-V2 section V2-6 UI: the Foundry dialog (topbar-create button + N key, Esc cascade) with Commission Task and Forge Agent tabs per spec, wired to the sim creation verbs, with deterministic suggested names/titles and ticker logging.',
      'Keyboard: M/N act only when no modal/overlay is open and focus is not in an input. Esc cascade final order: foundry/archive (whichever is open) > steer modal > inspector > targeting > selection.',
      'CRITICAL: zero new <line>/<polyline>. Do not modify e2e/. Keep all v1 behaviors and testids.',
      'Add unit tests for the Esc cascade ordering, approval-bar action routing, and Foundry submission building correct sim verb calls.',
      'Verify before finishing: npx tsc --noEmit && npx vitest run && npx vite build pass, plus a brief dev-server sanity check of all three features.',
    ],
  });
  phases.push('ui-process-workspace-foundry');
  await gatedLoop('ui-process-workspace-foundry', 'ui-b-gate', BUILD_GATE, 480000);
  await commitPhase('ui-process-workspace-foundry');

  // ---- Phase 7: E2E convergence (v1 + v2 suites) -------------------------------
  let e2ePassed = false;
  for (let round = 0; round < maxE2eRounds; round += 1) {
    const e2e = await ctx.task(gateTask, {
      label: 'playwright-e2e-full', phase: 'e2e-convergence', attempt: round,
      command: `cd "${appAbs}" && npx playwright test --reporter=line`, timeoutMs: 900000,
    });
    if (e2e.passed) { e2ePassed = true; break; }
    await ctx.task(fixTask, {
      phase: 'e2e-convergence', gateLabel: 'playwright-e2e-full', attempt: round + 1, appAbs, devPort, specText,
      exitCode: e2e.exitCode, stdoutTail: e2e.stdoutTail, stderrTail: e2e.stderrTail,
      note: 'Fix the APPLICATION to satisfy the frozen e2e specs (v1 and v2). Only modify a test if it objectively contradicts the SPEC text below — cite the SPEC line when doing so.',
    });
  }
  if (!e2ePassed) {
    throw new Error(`Playwright e2e suite still failing after ${maxE2eRounds} convergence rounds`);
  }
  phases.push('e2e-convergence');
  await commitPhase('e2e-convergence');

  // ---- Phase 8: Design polish convergence (cogitator rubric) -------------------
  let designScore = 0;
  for (let round = 0; round < maxPolishRounds; round += 1) {
    const review = await ctx.task(designReviewTask, { appAbs, devPort, specText, round, designScoreThreshold });
    designScore = review.score;
    if (review.score >= designScoreThreshold) break;
    if (round < maxPolishRounds - 1) {
      await ctx.task(polishTask, { appAbs, devPort, specText, round, findings: review.findings, score: review.score });
      await gatedLoop('design-polish', `polish-regression-gate-r${round}`, FULL_GATE, 900000);
    }
  }
  phases.push('design-polish');
  await commitPhase('design-polish');

  // ---- Phase 9: Docs + final verification --------------------------------------
  await ctx.task(readmeTask, { appAbs, devPort, specText, designScore });
  const finalGate = await gatedLoop('final', 'final-full-gate', FULL_GATE, 900000);
  phases.push('final');
  await commitPhase('final');

  ctx.log('info', `A5C Commander v2 complete. e2e=${e2ePassed} design=${designScore}`);
  return { success: true, appDir, e2ePassed, designScore, finalGatePassed: finalGate.passed, phases };
}

// ----------------------------------------------------------------------------
// Tasks
// ----------------------------------------------------------------------------

export const readSpecTask = defineTask('read-spec-v2', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read SPEC.md + SPEC-V2.md',
  shell: { command: args.specAbsList.map((p) => `cat "${p}"`).join(' && echo "\\n\\n===== NEXT SPEC FILE =====\\n\\n" && '), expectedExitCode: 0, timeout: 10000 },
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
        'SPEC (verbatim, the sole source of truth — SPEC.md followed by SPEC-V2.md; V2 extends and, for visual direction, overrides):',
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

export const authorE2eTask = defineTask('author-e2e-v2-from-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author frozen v2 Playwright specs from SPEC-V2 (before implementation)',
  labels: ['testing', 'e2e'],
  execution: { model: 'claude-fable-5' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'E2E test author (Playwright). You write acceptance tests strictly from a spec, never from implementation.',
      task: `Author the v2 Playwright suite under ${args.appAbs}/e2e/ as NEW files (v2-theme.spec.ts, v2-commands.spec.ts, v2-memory.spec.ts, v2-hierarchy.spec.ts, v2-process.spec.ts, v2-foundry.spec.ts, v2-workspace.spec.ts — group sensibly) covering acceptance criteria AC15-AC24 from SPEC-V2 section V2-8. Do NOT touch the existing v1 spec files or helpers (you may import from e2e/helpers.ts; additive helper additions belong in a new e2e/helpers-v2.ts).`,
      context: { appDir: args.appAbs, devPort: args.devPort },
      instructions: [
        'Treat the SPEC block below as the sole source of truth. Do NOT read files under src/ — the v2 implementation does not exist yet and must not shape the tests.',
        'You MAY read playwright.config.ts, package.json, and the existing e2e/helpers.ts for config/helper alignment.',
        'Use the established determinism pattern: ?seed=42, window.__commander.sim pause/tick; testids from SPEC-V2 (memory-overlay, memory-silo-*, memory-node-*, memory-filter-*, inspector-tab-*, sel-stage, topbar-memory, topbar-create, foundry, ws-file-*, ws-approve, ws-reject). No wall-clock waits beyond UI settle.',
        'Name each test with its AC id. If an AC is untestable as written, add a test.fixme quoting the SPEC line — do not reinterpret.',
        'Tests must compile under tsc and be listable via `npx playwright test --list`. The v2 features are unimplemented, so do NOT run the suite — just verify compile + list.',
        'These tests become FROZEN inputs for the implementation phases.',
        '',
        'SPEC (verbatim — SPEC.md then SPEC-V2.md):',
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
        'SPEC (verbatim, authoritative — SPEC.md then SPEC-V2.md):',
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
      role: 'Exacting game-UI art director reviewing a steampunk cogitator command-deck interface against its spec and reference plate',
      task: `Visually evaluate the running app at ${args.appAbs}. Capture real screenshots, score 0-100 against the rubric, and return concrete findings.`,
      context: { appDir: args.appAbs, devPort: args.devPort, round: args.round },
      instructions: [
        'Capture >=6 PNGs at 1600x900 into e2e/__shots__/ (prefix v2-r' + String(args.round) + '-): boot overview, single unit selected showing a kind-specific command card, Archive memory overlay with graph, parent+children hierarchy close-up, Inspector Process tab on a working unit, Inspector Workspace tab with a diff open, Foundry dialog, and an alert/write-back state. Use ?seed=42 + sim hooks for staging.',
        'Evaluate against SPEC-V2 section V2-1 and the v2 feature sections — rubric (weights): cogitator theme fidelity to the reference language: parchment/brass/slate/amber, ornament quality, NOT generic dark-ui (25); HUD hierarchy + legibility (15); clockwork-creature avatar charm + command glyph quality (15); new feature surfaces polish: archive graph, process pipeline, diff plate, foundry (25); layout fidelity + motion feel from CSS (10); micro-detail: etched borders, eye indicators, paper grain, number typography (10).',
        'Score honestly; a re-skinned neon dashboard scores < 60. List findings as specific actionable items naming the component/file.',
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
        'Do not change data-testid attributes or the test hooks API; the frozen e2e suites (v1 + v2) must keep passing.',
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

export const readmeTask = defineTask('update-readme', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Update README for v2',
  labels: ['docs'],
  execution: { model: 'claude-fable-5' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical writer who is also the engineer who built the system',
      task: `Update ${args.appAbs}/README.md for v2 (the Aegis Cogitator).`,
      context: { appDir: args.appAbs, devPort: args.devPort, designScore: args.designScore },
      instructions: [
        'Read the existing README and the actual implementation; update: hero paragraph + screenshot (pick a v2 shot from e2e/__shots__), the concept table (add memory silos, hierarchy, process flow, foundry, workspace approval rows), controls (M, N keys, inspector tabs), architecture (new contracts modules: kradle-memory, babysitter-run, kradle-workspace; the memory/process/workspace sim subsystems), and the swap-to-real-backend section (memory maps to kradle-sdk queryGraph/AgentMemoryQuery, process tab maps to babysitter journal observation, workspace approval maps to AgentApproval + PatchArtifact write-back).',
        'Every claim must be true of the code. Keep it tight. No emoji.',
        '',
        'SPEC (verbatim, for terminology):',
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
    command: `cd "${args.repoRoot}" && git add "${args.appDir}" && (git commit -m "feat(commander): v2 ${args.phase} — Aegis Cogitator" || echo "nothing to commit") && (git push -u origin HEAD || echo "push skipped")`,
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
