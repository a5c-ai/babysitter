/**
 * @process execute-advanced-uis-playbook
 * @description Execute the implementation playbook in advanced-uis.md for agent-mux-gui (milestone/task-driven, quality-gated).
 *
 * @agent general-purpose (default)
 *
 * Process notes:
 * - Non-interactive: no AskUserQuestion and no breakpoints.
 * - Source of truth for scope + sequencing: advanced-uis.md (read at runtime).
 * - Deterministic verification uses shell tasks (build/lint/test).
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineTask } from '@a5c-ai/babysitter-sdk';

function getRepoRootFromModule() {
  // Process lives under <repo>/.a5c/processes; repo root is two levels up.
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..', '..');
}

const readPlaybookTask = defineTask('read-advanced-uis-playbook', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read implementation playbook (advanced-uis.md)',
  shell: {
    command: `cd "${args.repoRoot}" && node -e "const fs=require('fs');process.stdout.write(fs.readFileSync('advanced-uis.md','utf8'))"`,
    expectedExitCode: 0,
    timeout: 20_000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readRepoSnapshotTask = defineTask('read-repo-snapshot', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read repo snapshot (scripts, workspaces, tsconfig, git status)',
  shell: {
    command: [
      `cd "${args.repoRoot}"`,
      // Keep output stable and reasonably small.
      `echo "# package.json"`,
      `node -e "const fs=require('fs');process.stdout.write(fs.readFileSync('package.json','utf8'))"`,
      `echo "\n\n# tsconfig.json (if present)"`,
      `node -e "const fs=require('fs');process.stdout.write(fs.existsSync('tsconfig.json')?fs.readFileSync('tsconfig.json','utf8'):'(missing)')"`,
      `echo "\n\n# git status --porcelain"`,
      // If git is unavailable, don't fail the whole run.
      `git status --porcelain=v1 || true`,
    ].join(' && '),
    expectedExitCode: 0,
    timeout: 60_000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const ensureDepsTask = defineTask('ensure-deps', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Install dependencies (npm install)',
  shell: {
    command: `cd "${args.repoRoot}" && npm install`,
    expectedExitCode: 0,
    timeout: 30 * 60_000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const qualityGateTask = defineTask('quality-gate', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Quality gate: build + lint + unit tests',
  shell: {
    command: [
      `cd "${args.repoRoot}"`,
      // Keep to repo-defined deterministic checks.
      `npm run build`,
      `npm run lint`,
      `npm test`,
    ].join(' && '),
    expectedExitCode: 0,
    timeout: 30 * 60_000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const planExecutionTask = defineTask('plan-playbook-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan execution from playbook (milestones/tasks/dependencies)',
  execution: {
    harness: 'codex',
  },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical lead + program manager',
      task: 'Convert the playbook into an executable plan for this repo, including spec file resolution strategy and a deterministic “done” check per task.',
      context: {
        repoRoot: args.repoRoot,
        milestoneRange: args.milestoneRange,
        maxTasks: args.maxTasks,
        playbookVerbatim: args.playbook,
        repoSnapshot: args.repoSnapshot,
      },
      instructions: [
        'You MUST treat the PLAYBOOK as the source of truth for scope and sequencing.',
        'Output a structured plan that the orchestrator can execute task-by-task.',
        '',
        'Constraints:',
        '- This is a monorepo; prefer existing patterns and existing test frameworks.',
        '- Do not invent extra deliverables outside the playbook.',
        '- If the playbook references spec numbers that do not exist in /docs, propose a concrete fallback:',
        '  (a) search the repo for an alternate spec file (by title/keywords),',
        '  (b) if none exists, treat the playbook task description as the spec for that task and continue,',
        '  (c) but record a “specMissing” flag in the plan for that task.',
        '',
        'PLAYBOOK (verbatim):',
        '---',
        args.playbook,
        '---',
        '',
        'REPO SNAPSHOT (verbatim):',
        '---',
        args.repoSnapshot,
        '---',
      ],
      outputFormat: 'Return JSON only.',
    },
    outputSchema: {
      type: 'object',
      required: ['milestones', 'executionOrder', 'notes'],
      properties: {
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'theme', 'tasks'],
            properties: {
              id: { type: 'string' },
              theme: { type: 'string' },
              tasks: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['id', 'dependsOn', 'specRefs', 'files', 'doneWhen', 'specMissing'],
                  properties: {
                    id: { type: 'string' },
                    dependsOn: { type: 'array', items: { type: 'string' } },
                    specRefs: { type: 'array', items: { type: 'string' } },
                    files: { type: 'array', items: { type: 'string' } },
                    doneWhen: { type: 'string' },
                    specMissing: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
        executionOrder: { type: 'array', items: { type: 'string' } },
        notes: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementPlaybookTask = defineTask('implement-playbook-task', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement ${args.taskId}`,
  execution: {
    harness: 'codex',
  },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior engineer working in an existing TypeScript monorepo',
      task: 'Implement exactly the requested playbook task, then leave the workspace in a buildable + testable state.',
      context: {
        repoRoot: args.repoRoot,
        taskId: args.taskId,
        taskRecord: args.taskRecord,
        playbookVerbatim: args.playbook,
        // These are resolved at runtime by shell tasks so bytes stay fresh.
        specTextVerbatim: args.specText,
        preTaskRepoStatus: args.preTaskRepoStatus,
      },
      instructions: [
        'You MUST follow the PLAYBOOK for scope + sequencing.',
        'Implement ONLY what is needed for this taskId (plus minimal glue needed to keep the repo building/testing).',
        'Prefer editing existing files over creating new ones, except where the task explicitly says “new”.',
        'If the task references a spec and SPEC text is provided below, follow it. If spec is missing, treat PLAYBOOK as the spec.',
        'Update or add tests when they are required to make the behavior real; rely on the repo’s existing test toolchain (vitest).',
        'Do not commit or push.',
        '',
        'PLAYBOOK (verbatim):',
        '---',
        args.playbook,
        '---',
        '',
        'TASK RECORD (parsed):',
        JSON.stringify(args.taskRecord, null, 2),
        '',
        'SPEC (verbatim, may be empty if missing):',
        '---',
        args.specText || '',
        '---',
        '',
        'PRE-TASK REPO STATUS (verbatim):',
        '---',
        args.preTaskRepoStatus,
        '---',
        '',
        'Deliverables:',
        '- Make the code changes in the workspace.',
        '- Ensure the task “Done when” statement is actually true.',
        '- If you had to deviate (because a referenced spec file is missing/contradictory), record that in a short markdown note at docs/work-notes/<taskId>.md.',
        '',
        'Return JSON only with keys: { implemented: boolean, touchedFiles: string[], notesFile?: string, summary: string }',
      ],
      outputFormat: 'JSON only.',
    },
    outputSchema: {
      type: 'object',
      required: ['implemented', 'touchedFiles', 'summary'],
      properties: {
        implemented: { type: 'boolean' },
        touchedFiles: { type: 'array', items: { type: 'string' } },
        notesFile: { type: 'string' },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readSpecOrFallbackTask = defineTask('read-spec-or-fallback', (args, taskCtx) => ({
  kind: 'shell',
  title: `Resolve + read spec for ${args.taskId} (best-effort)`,
  shell: {
    command: [
      `cd "${args.repoRoot}"`,
      // Heuristic: if specRefs include a number N, try docs/<N>-*.md.
      // If not found, emit empty string; the agent falls back to playbook text.
      `node -e "const fs=require('fs');const path=require('path');` +
        `const specRefs=JSON.parse(process.env.SPEC_REFS||'[]');` +
        `const nums=[...new Set(specRefs.map(s=>String(s).match(/(\\d+)/)?.[1]).filter(Boolean))];` +
        `function findByNum(n){` +
          `const docsDir=path.join(process.cwd(),'docs');` +
          `if(!fs.existsSync(docsDir)) return null;` +
          `const files=fs.readdirSync(docsDir).filter(f=>f.startsWith(String(n).padStart(2,'0')+'-')||f.startsWith(String(n)+'-')||f===String(n)+'.md');` +
          `return files.length?path.join('docs',files[0]):null;` +
        `}` +
        `let chosen=null;for(const n of nums){const p=findByNum(n);if(p){chosen=p;break;}}` +
        `if(chosen&&fs.existsSync(chosen)){process.stdout.write(fs.readFileSync(chosen,'utf8'));} else {process.stdout.write('');}` +
      `"`,
    ].join(' && '),
    expectedExitCode: 0,
    timeout: 20_000,
    env: {
      SPEC_REFS: JSON.stringify(args.specRefs || []),
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const repoStatusTask = defineTask('repo-status', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Repo status (git diff summary + status)',
  shell: {
    command: [
      `cd "${args.repoRoot}"`,
      `echo "# git status --porcelain"`,
      `git status --porcelain=v1 || true`,
      `echo "\n# git diff --stat"`,
      `git diff --stat || true`,
    ].join(' && '),
    expectedExitCode: 0,
    timeout: 20_000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const finalSpecVsArtifactsReviewTask = defineTask('final-spec-vs-artifacts-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final review: compare playbook requirements to produced artifacts',
  execution: {
    harness: 'codex',
  },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Acceptance reviewer',
      task: 'Compare the PLAYBOOK to the current repo state and report what is complete vs remaining, without adding narrative.',
      context: {
        repoRoot: args.repoRoot,
        playbookVerbatim: args.playbook,
        repoStatus: args.repoStatus,
      },
      instructions: [
        'Compare PLAYBOOK to ARTIFACTS directly. Ignore any narrative about how changes were made.',
        'Report completion per task ID where possible (implemented / partially / not started).',
        'If specs are missing, mark those tasks as “blocked by missing spec” only if the playbook’s Done-when cannot be implemented without it.',
        '',
        'PLAYBOOK (verbatim):',
        '---',
        args.playbook,
        '---',
        '',
        'ARTIFACTS (verbatim repo status):',
        '---',
        args.repoStatus,
        '---',
        '',
        'Return JSON only with keys: { completedTaskIds: string[], remainingTaskIds: string[], risks: string[], summary: string }',
      ],
      outputFormat: 'JSON only.',
    },
    outputSchema: {
      type: 'object',
      required: ['completedTaskIds', 'remainingTaskIds', 'risks', 'summary'],
      properties: {
        completedTaskIds: { type: 'array', items: { type: 'string' } },
        remainingTaskIds: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs = {}, ctx) {
  const repoRoot = getRepoRootFromModule();

  const milestoneRange = inputs.milestoneRange || { start: 1, end: 5 };
  const maxTasks = typeof inputs.maxTasks === 'number' ? inputs.maxTasks : 999;

  // 0) Read playbook + repo snapshot.
  const [playbook, repoSnapshot] = await ctx.parallel.all([
    ctx.task(readPlaybookTask, { repoRoot }),
    ctx.task(readRepoSnapshotTask, { repoRoot }),
  ]);

  // 1) Ensure dependencies are installed.
  await ctx.task(ensureDepsTask, { repoRoot });

  // 2) Plan execution from the playbook (task graph).
  const plan = await ctx.task(planExecutionTask, {
    repoRoot,
    milestoneRange,
    maxTasks,
    playbook: playbook.stdout,
    repoSnapshot: repoSnapshot.stdout,
  });

  // 3) Execute tasks in order, with a quality gate after each task.
  const executed = [];
  const taskIds = Array.isArray(plan.executionOrder) ? plan.executionOrder : [];

  for (const taskId of taskIds.slice(0, maxTasks)) {
    // Find the parsed task record.
    const taskRecord = (plan.milestones || [])
      .flatMap((m) => m.tasks || [])
      .find((t) => t.id === taskId) || { id: taskId, dependsOn: [], specRefs: [], files: [], doneWhen: '', specMissing: true };

    const preTaskRepoStatus = await ctx.task(repoStatusTask, { repoRoot });
    const specText = await ctx.task(readSpecOrFallbackTask, {
      repoRoot,
      taskId,
      specRefs: taskRecord.specRefs || [],
    });

    const impl = await ctx.task(implementPlaybookTask, {
      repoRoot,
      taskId,
      taskRecord,
      playbook: playbook.stdout,
      specText: specText.stdout,
      preTaskRepoStatus: preTaskRepoStatus.stdout,
    });

    executed.push({ taskId, ...impl });

    // Deterministic gate: if this fails, the run stops here.
    await ctx.task(qualityGateTask, { repoRoot });
  }

  // 4) Final repo status + review.
  const finalRepoStatus = await ctx.task(repoStatusTask, { repoRoot });
  const finalReview = await ctx.task(finalSpecVsArtifactsReviewTask, {
    repoRoot,
    playbook: playbook.stdout,
    repoStatus: finalRepoStatus.stdout,
  });

  return {
    status: 'completed',
    repoRoot,
    milestoneRange,
    maxTasks,
    executedCount: executed.length,
    executed,
    finalReview,
  };
}
