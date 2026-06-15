/**
 * @process apps/agent-commander-rts-v5
 * @description A5C Commander v4 — release rail (merged + in-production columns, release/revert/
 * rollback), drag z-order + inspector retarget bug fixes, slower sim + speed control, card editor
 * + kradle-personality agent stacks foundry, runs & process management views, terminal tab,
 * memory I/O tab, archive usability overhaul, and a light web IDE (explorer, tabs, syntax
 * highlighting, ghost completions) with Open-in-IDE from human review. Quality-gated phases over
 * the completed v3 board (run 01KTVFP6529KY7AS9RFFT7ZX8X).
 * @inputs { repoRoot: string, appDir: string, specPaths: string[], devPort?: number,
 *   designScoreThreshold?: number, maxFixAttempts?: number, maxE2eRounds?: number,
 *   maxPolishRounds?: number, relatedRunId?: string }
 * @outputs { success: boolean, appDir: string, e2ePassed: boolean, designScore: number, phases: array }
 *
 * @skill frontend-design specializations/web-development/skills (visual quality)
 * @agent frontend-architect specializations/web-development/agents/frontend-architect/AGENT.md
 * @agent react-developer specializations/web-development/agents/react-developer/AGENT.md
 * @agent e2e-testing specializations/web-development/agents/e2e-testing/AGENT.md
 *
 * @references
 * - .a5c/processes/agent-commander-rts-v2.mjs (v2/v3 process; same convergence skeleton)
 * - tdd-quality-convergence.js, specializations/ux-ui-design/pixel-perfect-implementation.js
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    repoRoot,
    appDir = 'apps/commander',
    specPaths = ['apps/commander/SPEC.md', 'apps/commander/SPEC-V2.md', 'apps/commander/SPEC-V3.md', 'apps/commander/SPEC-V4.md', 'apps/commander/SPEC-V5.md'],
    devPort = 5199,
    designScoreThreshold = 85,
    maxFixAttempts = 4,
    maxE2eRounds = 5,
    maxPolishRounds = 3,
  } = inputs;

  const appAbs = `${repoRoot}/${appDir}`;
  const phases = [];

  ctx.log('info', `A5C Commander v5 (sessions + registry) starting in ${appAbs}`);

  const spec = await ctx.task(readSpecTask, { specAbsList: specPaths.map((p) => `${repoRoot}/${p}`) });
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

  const UNIT_GATE = `cd "${appAbs}" && npx tsc --noEmit && npx vitest run`;
  const BUILD_GATE = `cd "${appAbs}" && npx tsc --noEmit && npx vitest run && npx vite build`;
  const FULL_GATE = `cd "${appAbs}" && npx tsc --noEmit && npx vitest run && npx vite build && npx playwright test --reporter=line`;

  // ---- Phase 1: Frozen v5 e2e specs (purely additive) --------------------------
  await ctx.task(implementTask, {
    phase: 'author-e2e-v5', appAbs, devPort, specText,
    mission: [
      'You are authoring FROZEN acceptance tests from SPEC-V5 BEFORE implementation. Do NOT read src/ (v5 features do not exist); you MAY read playwright.config.ts, package.json, and e2e/helpers*.ts.',
      'Author e2e/v5-sessions.spec.ts (AC46, AC47) and e2e/v5-registry.spec.ts (AC48, AC49, AC50, AC51) from SPEC-V5 section V5-5. New shared helpers ONLY in e2e/helpers-v5.ts (import from earlier helpers freely).',
      'NO amendments to existing tests are sanctioned — v5 is purely additive; touch nothing else under e2e/.',
      'Determinism pattern as established (?seed=42, pause/tick, bounded tickUntil for the v4 pacing). Use the exact V5 testids (inspector-tab-sessions, session-row-*, session-transcript, topbar-registry, registry-overlay, registry-tab-*, registry-row-*, registry-back, sel-session-link, sel-stack-link). Assume listSessions/getSession appear on window.__commander.sim per the established convention. Name tests by AC id; test.fixme with quoted spec line for anything untestable.',
      'VERIFY ONLY: npx tsc --noEmit passes and npx playwright test --list lists old + new tests. Do NOT run the suite. No dev server.',
    ],
  });
  phases.push('author-e2e-v5');
  await gatedLoop('author-e2e-v5', 'e2e-v5-author-gate',
    `cd "${appAbs}" && npx tsc --noEmit && npx playwright test --list`, 480000);
  await commitPhase('author-e2e-v5');

  // ---- Phase 2: Sim v5 — persistent sessions + links ----------------------------
  await ctx.task(implementTask, {
    phase: 'sim-v5', appAbs, devPort, specText,
    mission: [
      'Implement SPEC-V5 section V5-1 in the sim (backend only, framework-free): persistent SessionRecord per spawned agent (survives despawn) with the exact field shape from the spec, full transcript persistence (ring ~200 entries/session), deterministic subsession links: stack-child workers carry parentSessionId of a per-attempt parent-card coordination session (a lightweight session logging child assignment/completion), reviewer sessions carry reviewOfSessionId of the judged worker session, integration sessions parent to the approving review session (else the worker).',
      'Views: listSessions(taskId?) (all or per card, newest first) and getSession(sessionId) (record + transcript). Same seed => identical ids/names/link structure — extend the two-engine determinism tests to cover session registries.',
      'The live agent transcript and the persisted session transcript must be the SAME data (no forking); existing transcript behavior unchanged for active agents.',
      'Expose both views via MockBackend and the SimViews pattern. Unit tests: persistence after despawn, link structure (coordination/review/integration), ring cap, determinism, listSessions filtering.',
      'Do not modify e2e/. VERIFY: npx tsc --noEmit && npx vitest run pass.',
    ],
  });
  phases.push('sim-v5');
  await gatedLoop('sim-v5', 'sim-v5-gate', UNIT_GATE, 480000);
  await commitPhase('sim-v5');

  // ---- Phase 3: Sessions tab + transcript forensics ------------------------------
  await ctx.task(implementTask, {
    phase: 'ui-sessions-v5', appAbs, devPort, specText,
    mission: [
      'Implement SPEC-V5 section V5-2: the Inspector Sessions tab (inspector-tab-sessions) for EVERY card in EVERY column — default tab for agent-less cards in ai-review/human-review/approved/merged/in-production (ahead of Process; extend the card-supported-tab set and default-tab logic in store.openInspectorCard).',
      'Session list grouped by attempt: role badge, creature portrait, stack name, status chip, turns/tokens/cost, tick range; subsessions NESTED (indent + connector bracket) under their parent; reviewer rows show a reviewed-link chip. Row testid session-row-<sessionId>.',
      'Row click opens the read-only session-transcript view inside the tab (reuse the live transcript bubble components incl. resolved-inquiry bubbles) with a back link; parent/reviewOf link chips navigate between sessions; active sessions open the LIVE growing transcript.',
      'Review panel gains a small Sessions link chip deep-linking to this tab. SelectionPanel per SPEC-V5 section V5-4: sel-session-link and sel-stack-link affordances (stack link can stub to the registry intent this phase if the registry is not yet built — wire fully next phase); avatar tooltips.',
      'Unit tests: default-tab logic per column/agent-state, session list grouping/nesting selectors, transcript view routing.',
      'Read e2e/v5-sessions.spec.ts for the exact contract. Do not modify e2e/. VERIFY: BUILD gate green, then run ONLY npx playwright test v5-sessions --reporter=line to passing, plus regression v2-process v2-workspace v4-fixes stays green.',
    ],
  });
  phases.push('ui-sessions-v5');
  await gatedLoop('ui-sessions-v5', 'ui-sessions-v5-gate', BUILD_GATE, 480000);
  await commitPhase('ui-sessions-v5');

  // ---- Phase 4: The Registry — entity separation ----------------------------------
  await ctx.task(implementTask, {
    phase: 'ui-registry-v5', appAbs, devPort, specText,
    mission: [
      'Implement SPEC-V5 section V5-3: TopBar Registry button (topbar-registry) opening registry-overlay (ledger family, Esc cascade top tier) with tabs registry-tab-stacks/agents/tasks/workspaces, rows registry-row-<id>, breadcrumb back stack (registry-back).',
      'Stacks tab: all stacks with adapter/model/approvalMode/personality excerpt/phase; detail shows full spec plates (system/developer verbatim) + spawned sessions cross-links + open-in-Foundry affordance. Agents tab: ALL sessions (active highlighted, completed inked, aborted garnet) with portrait/name/role/stack link/task link/status/turns/tokens/cost; detail reuses the session transcript component + link chips (task/run/workspace/stack/parent/reviewOf). Tasks tab: every card with kind/column/attempts/yolo/stack/workspace; detail: hierarchy links, nested sessions list, run links (open the Runs overlay detail), workspace summary. Workspaces tab: gitStatus/phase/cards/active sessions; detail: changed files + links.',
      'Cross-links navigate WITHIN the registry (breadcrumb), except run links which open the Runs overlay run-detail. Complete the SPEC-V5 V5-4 board separation: SelectionPanel sel-stack-link opens the registry stack detail; Inspector agent-header stack chip becomes a registry link.',
      'Unit tests: registry navigation state machine (tabs/detail/breadcrumb), cross-link routing, entity list selectors.',
      'Read e2e/v5-registry.spec.ts for the exact contract. Do not modify e2e/. VERIFY: BUILD gate green, then run ONLY npx playwright test v5-registry v5-sessions --reporter=line to passing.',
    ],
  });
  phases.push('ui-registry-v5');
  await gatedLoop('ui-registry-v5', 'ui-registry-v5-gate', BUILD_GATE, 480000);
  await commitPhase('ui-registry-v5');


  // ---- Phase 7: Full e2e convergence ------------------------------------------------
  let e2ePassed = false;
  for (let round = 0; round < maxE2eRounds; round += 1) {
    const e2e = await ctx.task(gateTask, {
      label: 'playwright-e2e-full', phase: 'e2e-convergence', attempt: round,
      command: `cd "${appAbs}" && npx playwright test --reporter=line`, timeoutMs: 1200000,
    });
    if (e2e.passed) { e2ePassed = true; break; }
    await ctx.task(fixTask, {
      phase: 'e2e-convergence', gateLabel: 'playwright-e2e-full', attempt: round + 1, appAbs, devPort, specText,
      exitCode: e2e.exitCode, stdoutTail: e2e.stdoutTail, stderrTail: e2e.stderrTail,
      note: 'Fix the APPLICATION to satisfy the frozen suite (v2/v3/v4). Only modify a test if it objectively contradicts the SPEC text (V4 supersedes) — cite the SPEC line.',
    });
  }
  if (!e2ePassed) {
    throw new Error(`Playwright e2e suite still failing after ${maxE2eRounds} convergence rounds`);
  }
  phases.push('e2e-convergence');
  await commitPhase('e2e-convergence');

  // ---- Phase 8: Design polish convergence --------------------------------------------
  let designScore = 0;
  for (let round = 0; round < maxPolishRounds; round += 1) {
    const review = await ctx.task(designReviewTask, { appAbs, devPort, specText, round, designScoreThreshold });
    designScore = review.score;
    if (review.score >= designScoreThreshold) break;
    if (round < maxPolishRounds - 1) {
      await ctx.task(polishTask, { appAbs, devPort, specText, round, findings: review.findings, score: review.score });
      await gatedLoop('design-polish', `polish-regression-gate-r${round}`, FULL_GATE, 1200000);
    }
  }
  phases.push('design-polish');
  await commitPhase('design-polish');

  // ---- Phase 9: Docs + final gate ------------------------------------------------------
  await ctx.task(readmeTask, { appAbs, devPort, specText, designScore });
  const finalGate = await gatedLoop('final', 'final-full-gate', FULL_GATE, 1200000);
  phases.push('final');
  await commitPhase('final');

  ctx.log('info', `A5C Commander v4 complete. e2e=${e2ePassed} design=${designScore}`);
  return { success: true, appDir, e2ePassed, designScore, finalGatePassed: finalGate.passed, phases };
}

// ---------------------------------------------------------------------------- tasks

export const readSpecTask = defineTask('read-specs-v5', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read SPEC v1-v4',
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
      role: 'Senior frontend/game-UI engineer building a production-quality orchestration console',
      task: `Execute the "${args.phase}" phase fully inside ${args.appAbs}. Perform the work for real; do not return a plan.`,
      context: { appDir: args.appAbs, devPort: args.devPort, phase: args.phase },
      instructions: [
        ...args.mission,
        'Work ONLY inside the app directory (plus reading source-of-truth contract files referenced by the SPEC).',
        'Never run npm at the repository root. Honor the dependency allowlist strictly — no new dependencies.',
        'TypeScript strict, no `any`, no floating promises. Zero <line>/<polyline> SVG elements. No emoji.',
        'PROCESS DISCIPLINE (mandatory): never start a dev server or long-lived process in a foreground command; Playwright webServer only for live checks; every command bounded with a natural exit; before returning verify port 5199 has no LISTENING entry you created.',
        'The frozen e2e suite gates this project — read the relevant e2e specs to know the exact contract; never weaken tests.',
        '',
        'SPEC (verbatim — SPEC.md, V2, V3, V4; later files extend, V4 supersedes on conflict):',
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

export const fixTask = defineTask('fix-gate-failure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix ${args.gateLabel} failure (attempt ${args.attempt})`,
  labels: ['fix', args.phase],
  execution: { model: 'claude-fable-5' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior engineer doing root-cause fixes on a failing quality gate',
      task: `Gate "${args.gateLabel}" failed (exit ${args.exitCode}) during phase "${args.phase}" in ${args.appAbs}. Diagnose from the output, fix the root cause, re-run locally until green.`,
      context: { appDir: args.appAbs, devPort: args.devPort, phase: args.phase, attempt: args.attempt },
      instructions: [
        args.note ?? 'Fix honestly — never weaken, skip, or delete checks.',
        'App directory only. No new dependencies. Never npm at repo root. PROCESS DISCIPLINE: bounded commands, no servers left alive, port 5199 clear before returning.',
        '', 'GATE STDOUT (tail):', '---', args.stdoutTail ?? '(empty)', '---',
        'GATE STDERR (tail):', '---', args.stderrTail ?? '(empty)', '---',
        '', 'SPEC (verbatim, authoritative):', '---', args.specText, '---',
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
      role: 'Exacting game-UI art director reviewing the Aegis Cogitator board against its spec and reference plate',
      task: `Capture real screenshots of ${args.appAbs} (incl. the v4 surfaces: release rail, card editor, stacks foundry, runs ledger, terminal, memory IO tab, archive, IDE), view them, score 0-100, return findings.`,
      context: { appDir: args.appAbs, devPort: args.devPort, round: args.round },
      instructions: [
        'Start the dev server as a tracked background PID (kill stale 5199 first); capture >=8 PNGs at 1600x900 into e2e/__shots__/ (prefix v4-r' + String(args.round) + '-) staging states via ?seed=42 + sim hooks; VIEW every PNG; kill the PID and verify port 5199 free before returning; delete temp scripts.',
        'RUBRIC (weights): cogitator theme fidelity (20); board + release rail readability (15); creature/seal/glyph charm (10); panel surfaces polish incl. NEW v4 surfaces — editor forms, runs ledger, terminal, IDE (30); motion quality from CSS/WAAPI (10); micro-detail incl. the v3 residual punch list from SPEC-V4 section V4-13 (15).',
        'Score honestly and consistently with prior rounds (history: 69 -> 77 -> 82 in v3). Findings: {area, severity high|medium|low, suggestion} naming files.',
        'Return JSON only.',
        '', 'SPEC (verbatim):', '---', args.specText, '---',
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
      task: `Apply the findings to ${args.appAbs} without breaking tests or grammar; also burn down the v3 residual punch list (SPEC-V4 section V4-13) if findings overlap it.`,
      context: { appDir: args.appAbs, devPort: args.devPort, round: args.round, currentScore: args.score },
      instructions: [
        'Highs first, then mediums. Styling/composition/motion only; no testid/API/store-behavior changes; keep AC15 hooks; avoid the substring current in inspector class names.',
        `FINDINGS (JSON): ${JSON.stringify(args.findings)}`,
        'Self-check visually (tracked background dev server, screenshots, VIEW them, then kill the PID and verify port 5199 free).',
        'Verify: npx tsc --noEmit && npx vitest run && npx playwright test --reporter=line all green.',
        '', 'SPEC (verbatim):', '---', args.specText, '---',
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
  title: 'Update README for v4',
  labels: ['docs'],
  execution: { model: 'claude-fable-5' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical writer who is also the engineer who built the system',
      task: `Update ${args.appAbs}/README.md for v4 — verify every claim against the code.`,
      context: { appDir: args.appAbs, devPort: args.devPort, designScore: args.designScore },
      instructions: [
        'Update: hero + best v4 screenshot; lanes/release-rail description; controls (speed control, Edit Card, Terminal, Open in IDE, runs/processes, archive navigation); concept table rows (agent stacks=kradle AgentStack with personalities, runs/processes=babysitter run+process templates, release rail=staging/production write-back); architecture additions (workspace file model, IDE/terminal modules, stacks); test hooks (speed/tickIntervalMs, new verbs); keep the swap-to-real-backend and workspace notes accurate.',
        'PROCESS DISCIPLINE: no dev server; bounded commands only. Do not modify other files.',
        '', 'SPEC (verbatim, for terminology):', '---', args.specText, '---',
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
    command: `cd "${args.repoRoot}" && git add "${args.appDir}" && (git commit -m "feat(commander): v4 ${args.phase}" || echo "nothing to commit") && (git push -u origin HEAD || echo "push skipped")`,
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
