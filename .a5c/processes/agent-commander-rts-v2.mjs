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

  // ---- V3 pivot (user scope change mid-run): kanban board supersedes the RTS
  // canvas. Read SPEC-V3 at runtime and use the combined text for all later phases.
  const spec3 = await ctx.task(readSpecTask, { specAbsList: [`${repoRoot}/apps/commander/SPEC-V3.md`] });
  const specTextV3 = `${specText}\n\n===== NEXT SPEC FILE =====\n\n${spec3.stdout}`;

  // ---- Phase 3: Sim + contract extensions (kanban model) ----------------------
  await ctx.task(implementTask, {
    phase: 'sim-extensions', appAbs, devPort, specText: specTextV3,
    mission: [
      'Extend src/contracts/ with faithful mirrors per SPEC-V2 sections V2-3/V2-5/V2-7: kradle memory resources (AgentMemoryRepository/Source/Query/Update specs, GraphRecord with the verbatim node/edge kind unions, queryGraph result shapes) in contracts/kradle-memory.ts; babysitter run-observation shapes (JournalEvent, ObservedRunState, EffectStatus, pendingEffectsByKind, effect kinds) in contracts/babysitter-run.ts; workspace/review shapes (AgentWorkspaceStatus.gitStatus, PatchArtifact, AgentApproval, WriteBackPolicy) in contracts/kradle-workspace.ts. Read the source-of-truth files referenced in SPEC-V2 for fidelity.',
      'Rebuild the sim around the SPEC-V3 kanban model: tasks carry a board column (backlog|do|ai-review|human-review|approved) plus merged terminal state; the boot scenario places ALL cards in backlog with NO agents spawned (topbar units = 0); task kinds from V2-2 and hierarchy stacks per V2-4/V3-1; the column state machine per V3-2 (moveCard verb for user drags; auto-transitions: work-complete -> ai-review, review pass -> human-review or approved when yolo, reject -> do with feedback; approved -> integration agent merge/rebase/conflict events -> merged).',
      'Agent lifecycle per V3-2: spawn-on-demand workers per the taskKind->adapter mapping when a card enters do (children each get a worker), reviewer agents (different adapter) in ai-review, integration agents in approved; despawn when the card leaves; setYolo(taskId, on) verb.',
      'Inquiry options per V3-5: hook.request payloads gain {question, options[2-5] of {id, caption, detail?, tone?}} (icons attach in the microagent phase); hook.decision gains optionId; the sim branches deterministically per chosen option with visibly different follow-up events; keep classic 2-option tool approvals as a case; memory_query/memory_update per V2-3 and per-run babysitter process model per V2-5 (phase pipelines, journal events, breakpoint effects when an inquiry is pending) stay as previously specified; workspace changes per V2-7 accumulate while in do and feed the review surfaces.',
      'Maintain determinism: same seed + same verb sequence (moveCard/setYolo/hook.decision included) => identical board state and frame stream — update the two-engine determinism tests; existing command-effect tests updated where the lifecycle changed (no idle units anymore).',
      'Add focused unit tests for: column state machine incl. yolo branch and reject loop, spawn/despawn mapping per kind, stack aggregation, inquiry option branching, memory partition + held-pieces, journal/state derivation, workspace diff determinism + integration/merge lifecycle, createTask verb.',
      'Backend/contracts stay framework-free. Do not modify e2e/.',
      'Verify before finishing: npx tsc --noEmit && npx vitest run pass.',
    ],
  });
  phases.push('sim-extensions');
  await gatedLoop('sim-extensions', 'sim-extensions-gate', UNIT_GATE, 480000);
  await commitPhase('sim-extensions');

  // ---- Phase 4: Microagent v2 — deep contextual commands + inquiry icons ------
  await ctx.task(implementTask, {
    phase: 'microagent-v2', appAbs, devPort, specText: specTextV3,
    mission: [
      'Implement SPEC-V2 section V2-2 in the microagent (src/microagent/) with the V3-7 column dimension: CommandContext gains column; kind-specific command sets for all ten task kinds layered over staples (never drop Abort for working agents; <=12), column-aware sets (human-review card -> Open Review/Approve All/Request Changes; approved card -> Hold Merge/Force Rebase; backlog card -> Start Work/Set Yolo/Prioritize), and context inputs from run stage, inquiry state, and workspace dirt.',
      'Every command id gets a DISTINCT procedural engraved-brass-style glyph (path-only, GLYPH_STROKE tone). Implement generateOptionIcon (or extend generateIcon) so every InquiryOption per SPEC-V3 V3-5 gets a generated icon keyed by option id/caption semantics (strategy, version, approve, reject, etc.).',
      'Every intent must do something visible and honest via the sim verbs (moveCard, setYolo, hook.decision with optionId, Run Tests tool_call pair, memory_update for Archive to Brain, etc.). Wire intents through the single executeIntent switch in src/game/commands.ts.',
      'No idle-unit command set remains (no idle agents exist); the empty-selection global set keeps Jump to Alert/Pause Sim/Resume Sim and gains Commission Task.',
      'Extend microagent unit tests: per-kind and per-column expected command sets, inquiry option icon presence + distinctness, <=12 sweep, path-only invariant.',
      'Verify before finishing: npx tsc --noEmit && npx vitest run && npx vite build pass.',
    ],
  });
  phases.push('microagent-v2');
  await gatedLoop('microagent-v2', 'microagent-v2-gate', BUILD_GATE, 480000);
  await commitPhase('microagent-v2');

  // ---- Phase 5: The Cogitator Board — kanban canvas ----------------------------
  await ctx.task(implementTask, {
    phase: 'ui-kanban-board', appAbs, devPort, specText: specTextV3,
    mission: [
      'Replace the RTS map canvas with the SPEC-V3 kanban board: five brass-framed parchment lanes (V3-1 testids), task cards (wax-seal icon, serif title, kind chip, progress ring, yolo toggle, dirty badge, agent slot with up to 3 attending creature avatars + overflow), subtask STACKS (parent + fanned mini-children, dragged as one), card click = select (SelectionPanel + CommandCard as before), double-click = Inspector.',
      'Pointer-based drag & drop per V3-1 (no library): lift shadow + tilt, lane drop-target amber highlight, snap-back on invalid drop; user drags allowed backlog->do, human-review->{do, ai-review, approved}, backlog reorder; each drag issues the moveCard sim verb.',
      'Automatic movement per V3-3: FLIP-style ~600ms arc glide with is-moving class and brass trail, soft settle; agent spawn = gear-assemble, despawn = dissolve; prefers-reduced-motion collapses to instant. Wire the sim auto-transition events into these animations.',
      'RETIRE the RTS surfaces per SPEC-V3 header: remove MapViewport camera/zoom/pan, minimap, marquee, LinkLayer, PingLayer, staging rows, control groups, F-cycle, rally from the live composition (delete or quarantine the dead components and their input handling; keep the store lean). MOVE the v1 e2e specs that test retired surfaces to e2e/retired-v1/ and add testIgnore for that dir in playwright.config.ts — include a retirement mapping in your summary. v1 tests for persisting behaviors (boot counters, icon determinism, ticker, inspector transcript, steer modal, Esc, viewport gate) must be kept and pass with selector updates ONLY where elements genuinely moved.',
      'Keep the Archive overlay (V2-3) wired (M key + topbar-memory) over the board.',
      'Add unit tests: drag-verb mapping, stack drag integrity, animation class lifecycle (store-level), board selectors.',
      'Verify before finishing: npx tsc --noEmit && npx vitest run && npx vite build pass, and npx playwright test --list runs clean (the moved v1 specs no longer listed; do not run the full suite yet).',
    ],
  });
  phases.push('ui-kanban-board');
  await gatedLoop('ui-kanban-board', 'ui-a-gate', BUILD_GATE, 480000);
  await commitPhase('ui-kanban-board');

  // ---- Phase 6: Panels — inquiry dock, review panel, inspector tabs, foundry ---
  await ctx.task(implementTask, {
    phase: 'ui-panels', appAbs, devPort, specText: specTextV3,
    mission: [
      'Implement the SPEC-V3 V3-5 Inquiry Dock (chat-dock testid, replaces the AlertBanner role): chat-like stack of inquiry bubbles — question text + option buttons each rendering the microagent icon ABOVE a short caption (inquiry-opt testids, tone styling, danger tint); choosing posts hook.decision with optionId, resolves everywhere, ticker-logs the caption; the same bubble renders inline in the owning agent Inspector transcript; Space jumps to the dock.',
      'Implement the SPEC-V3 V3-4 human review side panel (review-panel testid): header (title, branch, sha, test evidence, ahead/behind), changed-file list (ws-file-*), inline sepia diff plates (verdigris additions, garnet deletions, engraved line numbers), reviewer notes, Approve All (review-approve-all) -> animates card to approved, Request Changes with feedback field -> animates card to do. Opens on click of a human-review card.',
      'Implement SPEC-V2 V2-5 Inspector tabs (Transcript default + Process + Workspace with stated testids): Process = brass stage pipeline + ObservedRunState badge + pendingEffectsByKind chips + auto-following journal; Workspace = gitStatus header + file list + diff plates (shared diff components with the review panel); SelectionPanel gains sel-stage chip.',
      'Foundry (V2-6 amended by V3): topbar-create + N key opens Commission Task ONLY (no Forge Agent tab — agents are never created manually); commissioned tasks land in backlog.',
      'Esc cascade final order per V3-7: foundry/archive > review panel > steer modal > inspector > selection. M/N only when no modal open and not typing.',
      'CRITICAL: zero <line>/<polyline> document-wide. Do not modify active e2e specs.',
      'Add unit tests: inquiry option routing (optionId reaches the sim and branches), review panel action routing, Esc cascade ordering, foundry submission verb.',
      'Verify before finishing: npx tsc --noEmit && npx vitest run && npx vite build pass.',
    ],
  });
  phases.push('ui-panels');
  await gatedLoop('ui-panels', 'ui-b-gate', BUILD_GATE, 480000);
  await commitPhase('ui-panels');

  // ---- Phase 7: E2E convergence (v1 + v2 suites) -------------------------------
  let e2ePassed = false;
  for (let round = 0; round < maxE2eRounds; round += 1) {
    const e2e = await ctx.task(gateTask, {
      label: 'playwright-e2e-full', phase: 'e2e-convergence', attempt: round,
      command: `cd "${appAbs}" && npx playwright test --reporter=line`, timeoutMs: 900000,
    });
    if (e2e.passed) { e2ePassed = true; break; }
    await ctx.task(fixTask, {
      phase: 'e2e-convergence', gateLabel: 'playwright-e2e-full', attempt: round + 1, appAbs, devPort, specText: specTextV3,
      exitCode: e2e.exitCode, stdoutTail: e2e.stdoutTail, stderrTail: e2e.stderrTail,
      note: 'Fix the APPLICATION to satisfy the frozen e2e specs (surviving v1 + v2/v3). Only modify a test if it objectively contradicts the SPEC text below (V3 supersedes) — cite the SPEC line when doing so.',
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
    const review = await ctx.task(designReviewTask, { appAbs, devPort, specText: specTextV3, round, designScoreThreshold });
    designScore = review.score;
    if (review.score >= designScoreThreshold) break;
    if (round < maxPolishRounds - 1) {
      await ctx.task(polishTask, { appAbs, devPort, specText: specTextV3, round, findings: review.findings, score: review.score });
      await gatedLoop('design-polish', `polish-regression-gate-r${round}`, FULL_GATE, 900000);
    }
  }
  phases.push('design-polish');
  await commitPhase('design-polish');

  // ---- Phase 9: Docs + final verification --------------------------------------
  await ctx.task(readmeTask, { appAbs, devPort, specText: specTextV3, designScore });
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
        'PROCESS DISCIPLINE (mandatory): never start a dev server or any long-lived process in a foreground command; rely on Playwright webServer for anything needing a live app (it starts and stops its own). Every command you run must have a natural exit and an explicit timeout. Before returning, verify no process you started is still alive (port 5199 has no LISTENING entry).',
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
