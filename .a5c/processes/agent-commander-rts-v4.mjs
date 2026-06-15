/**
 * @process apps/agent-commander-rts-v4
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
    specPaths = ['apps/commander/SPEC.md', 'apps/commander/SPEC-V2.md', 'apps/commander/SPEC-V3.md', 'apps/commander/SPEC-V4.md'],
    devPort = 5199,
    designScoreThreshold = 85,
    maxFixAttempts = 4,
    maxE2eRounds = 5,
    maxPolishRounds = 3,
  } = inputs;

  const appAbs = `${repoRoot}/${appDir}`;
  const phases = [];

  ctx.log('info', `A5C Commander v4 starting in ${appAbs}`);

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

  // ---- Phase 1: Frozen v4 e2e specs (+ sanctioned amendments) ------------------
  await ctx.task(implementTask, {
    phase: 'author-e2e-v4', appAbs, devPort, specText,
    mission: [
      'You are authoring FROZEN acceptance tests from SPEC-V4 BEFORE implementation. Do NOT read src/ (the v4 features do not exist); you MAY read playwright.config.ts, package.json, and e2e/helpers*.ts.',
      'Author e2e/v4-*.spec.ts covering AC34-AC45 from SPEC-V4 section V4-12 (group sensibly: v4-release.spec.ts AC34/35, v4-fixes.spec.ts AC36/37/38, v4-editors.spec.ts AC39/40, v4-ops.spec.ts AC41/42/43, v4-archive-ide.spec.ts AC44/45). New shared helpers in e2e/helpers-v4.ts only.',
      'Apply ONLY the spec-sanctioned amendments to existing frozen tests (SPEC-V4 header): AC25 five-columns -> seven; AC30/AC31 merged-seal-in-approved -> the Merged column flow; tickUntil budget raises for the slower pacing where needed. Document each amendment in your summary. Touch nothing else under e2e/.',
      'Determinism pattern as established (?seed=42, pause/tick, bounded tickUntil with clear messages). Use the exact V4 testids. Name tests by AC id; test.fixme with quoted spec line for anything untestable.',
      'VERIFY ONLY: npx tsc --noEmit passes and npx playwright test --list lists everything. Do NOT run the suite. No dev server.',
    ],
  });
  phases.push('author-e2e-v4');
  await gatedLoop('author-e2e-v4', 'e2e-v4-author-gate',
    `cd "${appAbs}" && npx tsc --noEmit && npx playwright test --list`, 480000);
  await commitPhase('author-e2e-v4');

  // ---- Phase 2: Sim v4 ----------------------------------------------------------
  await ctx.task(implementTask, {
    phase: 'sim-v4', appAbs, devPort, specText,
    mission: [
      'Extend the sim per SPEC-V4 (backend/contracts only; framework-free): (a) V4-1 release rail — columns merged + in-production, integration-complete auto-move to merged, verbs revertCard/release/rollbackCard with events (reverted, release_shipped with rel-NN ids, rolled_back), in-production slim-compaction flag; (b) V4-4 pacing — default tickIntervalMs 800, speed multiplier API (0.5/1/2 => 1600/800/400), lifecycle durations roughly doubled, tick(n) semantics unchanged; (c) V4-5 — AgentStack mirror in contracts (kradle AgentStack spec with prompt.system/developer personalities), 4 seeded stacks with distinct personalities, card stackRef (default by kind mapping), spawn uses the stack adapter/model/personality (transcript flavor may reference it), verbs updateTask(taskId, patch) and upsertStack(stack) with stk-cNN ids and events; (d) V4-6 — runs registry across all card attempts (runId, processId commander/<kind>@vN, processRevision pinned per run), process TEMPLATES per kind with updateProcessTemplate(kind, phases) bumping revision affecting only future runs; (e) V4-8 workspace file model — getWorkspaceTree(taskId) + getFileContent(taskId, path), deterministic, consistent with diffs, writeFile(taskId, path, content) updating views + dirty badges; (f) V4-9 memory I/O tracking per agent AND per card (read pieces with tick, written updates with changes); (g) terminal support data (git log derived from journal).',
      'Extend determinism tests to cover the new verbs in scripted sequences; unit-test release rail transitions, speed API, stack spawn binding, template revision pinning, file model consistency (changed file content contains diff additions), memory IO ledgers.',
      'Update existing unit tests for the slower pacing where they assert tick counts. Do not modify e2e/.',
      'VERIFY: npx tsc --noEmit && npx vitest run pass.',
    ],
  });
  phases.push('sim-v4');
  await gatedLoop('sim-v4', 'sim-v4-gate', UNIT_GATE, 480000);
  await commitPhase('sim-v4');

  // ---- Phase 3: Board v4 + bug fixes ---------------------------------------------
  await ctx.task(implementTask, {
    phase: 'board-v4', appAbs, devPort, specText,
    mission: [
      'Board per SPEC-V4: render the two new lanes (merged, in-production) with the established lane ornament; Release lever in the merged lane header (col-release testid, brass lever styling, disabled when empty); staggered release-train glide animation; in-production crown-seal slim rows; Revert/Rollback wired via the microagent command sets (extend commandGen for merged/in-production columns incl. Release as a selected-merged-card command, danger tones).',
      'FIX V4-2 drag stacking: render the drag ghost into a top-level overlay layer (portal or board-root layer above all panels) so nothing occludes it; keep the frozen dragCard pointer-sequence working (elementFromPoint hit-testing must still resolve drop lanes — pointer-events none on the ghost).',
      'FIX V4-3 inspector retargeting: Inspect/double-click/ticker-click while the Inspector is open retargets it (header + tabs re-render; preserve current tab when valid).',
      'V4-4 UI: topbar-speed control cycling 0.5x/1x/2x with mono label; expose sim.tickIntervalMs + speed through window.__commander.',
      'Unit tests: release-rail command sets, retarget store logic, speed control wiring, drag-layer mount.',
      'VERIFY: BUILD gate green, plus run ONLY the v4-release + v4-fixes e2e specs headless and get them passing honestly (playwright manages its own webServer).',
    ],
  });
  phases.push('board-v4');
  await gatedLoop('board-v4', 'board-v4-gate', BUILD_GATE, 480000);
  await commitPhase('board-v4');

  // ---- Phase 4: Editors — card editor + stacks foundry ----------------------------
  await ctx.task(implementTask, {
    phase: 'editors-v4', appAbs, devPort, specText,
    mission: [
      'Card editor per SPEC-V4 V4-5: parchment form dialog (card-editor testid) from the Edit Card command + SelectionPanel affordance: title, kind select, description, yolo, parent select (backlog-only rule), workspace, agent-stack select (seeded + custom); save via updateTask; Esc cascade integration.',
      'Foundry Stacks tab (foundry-stacks): list stacks with personality excerpts and phase badges; Forge From clones an existing stack into the editor; edit name/adapter/model/approvalMode + system/developer personality textareas; save via upsertStack; new stacks selectable in the card editor and honored on next spawn (agent Inspector header shows its stack name).',
      'Cogitator styling throughout (parchment forms, brass-framed textareas, etched selects). Unit tests: editor verb payloads, stack clone defaults, foundry tab state.',
      'VERIFY: BUILD gate green + run ONLY e2e v4-editors specs headless to passing.',
    ],
  });
  phases.push('editors-v4');
  await gatedLoop('editors-v4', 'editors-v4-gate', BUILD_GATE, 480000);
  await commitPhase('editors-v4');

  // ---- Phase 5: Ops views — runs/process mgmt, memory IO tab, archive overhaul ----
  await ctx.task(implementTask, {
    phase: 'ops-views-v4', appAbs, devPort, specText,
    mission: [
      'Runs view per V4-6: topbar-runs button -> runs-overlay parchment ledger (all runs: runId, card, kind, processId@rev, ObservedRunState badge, phase progress, pending effects, tokens/cost, started/ended); row click -> run-detail reusing the Process-tab pipeline + journal components; Processes tab (process-library) listing per-kind templates with process-editor (rename/add/remove/reorder phases, >=2 enforced, revision bump on save, future-runs-only note).',
      'Memory I/O Inspector tab per V4-9 (inspector-tab-memory): Read and Written ledgers with mini graph strips reusing archive node visuals (<path> edges), deep-link into the Archive focused on the clicked node.',
      'Archive overhaul per V4-10: wheel zoom + drag pan (clamped, view-only), memory-search box with match count + highlight, silo-clustered layout with sector captions and gutters, zoom-dependent labels (always on hover), edge decluttering at low zoom, reset-view button. Keep seed-deterministic layout and path-only edges.',
      'Esc cascade: runs overlay joins foundry/archive tier. Unit tests: template editing rules, memory ledger selectors, archive view-state math (zoom clamp, search filter).',
      'VERIFY: BUILD gate green + run ONLY e2e v4-ops specs (and the AC44 archive test from v4-archive-ide) headless to passing.',
    ],
  });
  phases.push('ops-views-v4');
  await gatedLoop('ops-views-v4', 'ops-views-v4-gate', BUILD_GATE, 480000);
  await commitPhase('ops-views-v4');

  // ---- Phase 6: Terminal + Web IDE -------------------------------------------------
  await ctx.task(implementTask, {
    phase: 'terminal-ide-v4', appAbs, devPort, specText,
    mission: [
      'Terminal per V4-7: Terminal command -> inspector-tab-terminal; cogitator terminal plate (terminal-input/terminal-output testids), deterministic shell over sim state: help/pwd/ls/cat/git status/git diff/git log/npm test/clear/ArrowUp history; in-character unknown-command reply.',
      'Web IDE per V4-11: review-open-ide button (+ contextual command on human-review/do cards) -> ide-overlay: explorer tree (ide-explorer, collapsible dirs, A/M/D badges), multi-tab editor (ide-tab-*, close buttons, dirty dots), hand-rolled regex syntax highlighting for ts/tsx/js/json/css/md rendered as token spans behind a transparent textarea, engraved line numbers, current-line tint; ghost completion (ide-ghost) after ~400ms idle at line end from a new Microagent member suggestCompletion(context) (deterministic from path + preceding line), Tab accepts, Esc dismisses-then-closes per cascade; edits via writeFile update dirty badges + diff plates.',
      'Performance: highlight only the visible buffer (cap file render at ~400 lines with a notice); debounce highlighting. Unit tests: tokenizer per language fixture, suggestCompletion determinism, terminal command table, writeFile dirty propagation.',
      'VERIFY: BUILD gate green + run ONLY the AC45 IDE test and AC42 terminal test headless to passing.',
    ],
  });
  phases.push('terminal-ide-v4');
  await gatedLoop('terminal-ide-v4', 'terminal-ide-v4-gate', BUILD_GATE, 600000);
  await commitPhase('terminal-ide-v4');

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

export const readSpecTask = defineTask('read-specs-v4', (args, taskCtx) => ({
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
