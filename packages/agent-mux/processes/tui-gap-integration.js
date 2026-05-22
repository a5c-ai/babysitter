/**
 * @process tui-gap-integration
 * @description Iteratively close the gaps between @a5c-ai/agent-mux-tui and the full agent-mux SDK surface.
 *   TDD, spec-docs-synced, with adversarial reviews per gap.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/* -------------------------------------------------------------------------- */
/* Phase 1 — Gap mapping                                                      */
/* -------------------------------------------------------------------------- */

const mapGapsTask = defineTask('map-tui-gaps', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map TUI ↔ agent-mux SDK integration gaps',
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior TypeScript / TUI architect auditing a plugin-first Ink TUI against a coding-agent SDK',
      task: 'Produce a prioritized gap list between packages/agent-mux/tui and the agent-mux SDK.',
      context: {
        projectRoot: args.projectRoot,
        tuiPackage: 'packages/agent-mux/tui',
        sdkEntrypoints: [
          'packages/agent-mux/core/src/client.ts',
          'packages/agent-mux/core/src/events.ts',
          'packages/agent-mux/core/src/session-manager.ts',
          'packages/agent-mux/sdk/src/index.ts',
          'packages/agent-mux/cli/src/index.ts',
        ],
        docsRoots: ['docs/', 'docs/tutorials/'],
      },
      instructions: [
        'Read packages/agent-mux/tui/src/** to understand what the scaffold currently provides.',
        'Read packages/agent-mux/core/src/events.ts and enumerate every AgentEvent variant.',
        'Read packages/agent-mux/core/src/client.ts and packages/agent-mux/core/src/session-manager.ts to enumerate every public API surface (run, sessions list/read/resume/fork/watch, plugins install/list/uninstall, hooks install, detect, doctor, profiles, remote bootstrap, cost helpers, capabilities).',
        'For each SDK surface, decide whether the TUI already covers it (as a plugin, view, or command), and if not, draft a gap item.',
        'For each gap, set priority (P0 critical to usability / P1 core / P2 polish) and sketch the plugin/view interface it should expose.',
        'Return JSON with fields: gaps: Array<{ id, title, surface, priority, pluginKind, acceptanceCriteria: string[], testIdeas: string[], docsTouched: string[] }>, summary: string.',
        'Order gaps by priority ascending (P0 first) and within a priority by dependency order (things others depend on first).',
        'Cap the list at 12 gaps — focus on the ones that make the TUI genuinely usable.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'summary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

/* -------------------------------------------------------------------------- */
/* Phase 2 — Per-gap TDD loop                                                 */
/* -------------------------------------------------------------------------- */

const writeTestsTask = defineTask('write-failing-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `TDD: write failing tests for gap ${args.gap.id}`,
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'TDD practitioner writing vitest tests for an Ink TUI plugin',
      task: `Write failing tests that encode the acceptance criteria for gap "${args.gap.title}".`,
      context: { gap: args.gap, tuiPackage: 'packages/agent-mux/tui' },
      instructions: [
        'Use vitest + ink-testing-library (install as devDep if missing) for component tests.',
        'Write test files under packages/agent-mux/tui/tests/plugins/<gap-id>.test.ts or tests/<gap-id>.test.ts.',
        'Tests MUST fail initially — they encode behavior that does not exist yet.',
        'Run `npx vitest run packages/agent-mux/tui` and confirm the new tests fail with an expected assertion, not a syntax/import error.',
        'Return { testFiles: string[], expectedFailures: string[] }.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['testFiles'] },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTask = defineTask('implement-gap', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement gap ${args.gap.id}${args.attempt > 1 ? ` (attempt ${args.attempt})` : ''}`,
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Ink/React + TypeScript engineer implementing an agent-mux TUI plugin',
      task: `Implement gap "${args.gap.title}" so the failing tests pass and acceptance criteria are met.`,
      context: {
        gap: args.gap,
        testFiles: args.testFiles,
        previousFeedback: args.previousFeedback || null,
        attempt: args.attempt || 1,
      },
      instructions: [
        'Implement the plugin/view/command strictly through the registerView / registerEventRenderer / registerCommand APIs exported by packages/agent-mux/tui/src/plugin.ts — do NOT add new extension points without updating both plugin.ts and the README.',
        'If the gap requires new plugin.ts surface (e.g., a command palette or input injector), add it cleanly and update all built-in plugins to still type-check.',
        'Add the new plugin to the builtinPlugins array in packages/agent-mux/tui/src/index.ts if appropriate.',
        'If previousFeedback is not null, address every item before moving on.',
        'Return { filesChanged: string[], plugin: { id, kind, description } }.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['filesChanged'] },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const buildGate = defineTask('build-gate', (args, taskCtx) => ({
  kind: 'shell',
  title: `Build gate — gap ${args.gap.id}`,
  shell: {
    command: `cd ${args.projectRoot} && npm run build`,
    expectedExitCode: 0,
    timeout: 300000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const testGate = defineTask('test-gate', (args, taskCtx) => ({
  kind: 'shell',
  title: `Vitest gate — gap ${args.gap.id}`,
  shell: {
    command: `cd ${args.projectRoot} && npx vitest run packages/agent-mux/tui --reporter=default`,
    expectedExitCode: 0,
    timeout: 300000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const adversarialReviewTask = defineTask('adversarial-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Adversarial review — gap ${args.gap.id}`,
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Hostile code reviewer looking for holes in a TUI plugin implementation',
      task: 'Review the implementation with a skeptical eye. Does it really satisfy the gap, or does it just green the tests?',
      context: {
        gap: args.gap,
        filesChanged: args.filesChanged,
        testFiles: args.testFiles,
        attempt: args.attempt || 1,
      },
      instructions: [
        'Read every changed file end-to-end.',
        'Look for: tests that assert trivially-true things; hard-coded sample data instead of SDK wiring; plugin API violations (bypassing ctx.registerX); missing error paths; leaked host state; missing keyboard affordances; missing docs.',
        'Check that the plugin uses ONLY the public plugin API and the injected client — no direct SDK internals.',
        'Check that the plugin is truly a plugin (can be removed from builtinPlugins and the TUI still runs).',
        'Return JSON: { approved: boolean, severity: "pass"|"minor"|"major"|"critical", findings: Array<{ file, line?, issue, must_fix: boolean }>, summary }.',
        'Only set approved: true if there are zero must_fix findings.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'findings', 'summary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const docsSyncTask = defineTask('sync-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sync docs/spec for gap ${args.gap.id}`,
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Docs engineer keeping the spec, README, and website in sync with the implementation',
      task: `Update docs and specs for gap "${args.gap.title}" so they describe the newly-added behavior.`,
      context: {
        gap: args.gap,
        filesChanged: args.filesChanged,
        docsTouched: args.gap.docsTouched || [],
      },
      instructions: [
        'Update packages/agent-mux/tui/README.md with the new plugin and any new extension-point API.',
        'If a new AgentEvent renderer was added, make sure docs/04-agent-events.md lists the event it consumes (if missing from that doc, add it).',
        'Update docs/README.md "Features" section if the gap adds a user-visible capability.',
        'If new plugin.ts exports were added, describe them in packages/agent-mux/tui/README.md.',
        'Do NOT invent new agent-mux features — only document what was actually implemented.',
        'Return { docsChanged: string[] }.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['docsChanged'] },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const commitGate = defineTask('commit-gap', (args, taskCtx) => ({
  kind: 'shell',
  title: `Commit gap ${args.gap.id}`,
  shell: {
    command: `cd ${args.projectRoot} && git add -A && git -c commit.gpgsign=false commit -m "feat(tui): ${args.gap.id} — ${args.gap.title.replace(/"/g, '\\"')}" || echo "nothing to commit"`,
    expectedExitCode: 0,
    timeout: 60000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

/* -------------------------------------------------------------------------- */
/* Phase 3 — Final convergence                                                */
/* -------------------------------------------------------------------------- */

const finalBuild = defineTask('final-build', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Final full-monorepo build + tests',
  shell: {
    command: `cd ${args.projectRoot} && npm run build && npx vitest run`,
    expectedExitCode: 0,
    timeout: 600000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

/* -------------------------------------------------------------------------- */
/* Process body                                                               */
/* -------------------------------------------------------------------------- */

export default async function tuiGapIntegration(ctx) {
  const projectRoot = ctx.inputs.projectRoot || process.cwd();
  const maxGaps = ctx.inputs.maxGaps || 6;
  const maxReviewAttempts = 3;

  const gapMap = await ctx.run(mapGapsTask, { projectRoot });
  const gaps = (gapMap?.gaps || []).slice(0, maxGaps);

  const resolved = [];
  for (const gap of gaps) {
    const tests = await ctx.run(writeTestsTask, { gap, projectRoot });

    let approved = false;
    let previousFeedback = null;
    let filesChanged = [];

    for (let attempt = 1; attempt <= maxReviewAttempts && !approved; attempt++) {
      const impl = await ctx.run(implementTask, {
        gap,
        testFiles: tests.testFiles,
        previousFeedback,
        attempt,
        projectRoot,
      });
      filesChanged = impl.filesChanged || [];

      await ctx.run(buildGate, { gap, projectRoot });
      await ctx.run(testGate, { gap, projectRoot });

      const review = await ctx.run(adversarialReviewTask, {
        gap,
        filesChanged,
        testFiles: tests.testFiles,
        attempt,
      });

      approved = review.approved === true;
      if (!approved) {
        previousFeedback = review.findings
          .filter((f) => f.must_fix)
          .map((f) => `${f.file}: ${f.issue}`)
          .join('\n');
      }
    }

    if (!approved) {
      resolved.push({ gap: gap.id, status: 'unresolved-after-retries' });
      continue;
    }

    const docs = await ctx.run(docsSyncTask, { gap, filesChanged });
    await ctx.run(commitGate, { gap, projectRoot });
    resolved.push({ gap: gap.id, status: 'ok', docsChanged: docs.docsChanged });
  }

  await ctx.run(finalBuild, { projectRoot });

  return { ok: true, gaps: resolved, totalMapped: gapMap.gaps.length };
}
