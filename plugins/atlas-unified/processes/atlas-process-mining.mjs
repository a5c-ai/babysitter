/**
 * @process atlas/atlas-process-mining
 * @description Mine the REAL processes/workflows that exist in the user's named
 *   sources (git repos + local dirs, plus any Azure automation in scope): CI/CD
 *   (.github/workflows), npm scripts, IaC (terraform / bicep / helm / k8s),
 *   Dockerfiles, babysitter `.a5c` processes, and cron/automation. Every mined
 *   process cites the real file it came from. The Atlas public knowledge graph
 *   (mcp__atlas__atlas_public_*) is used ONLY as a SECONDARY comparison layer.
 *   Short, iterative, TDD-shaped: each phase produces a checkable artifact and
 *   asserts on it. Agent tasks only — no shell tasks (the agent runs the real
 *   read-only scans itself via its Bash tool).
 * @inputs { need, projectDir?, outDir? }
 * @outputs { success, sourceCount, processCount, catalog }
 *
 * Repo override honored: agent-only subtasks (no shell); breakpoints kept sparse.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ---------------------------------------------------------------------------
// Phase 1: parse the stated need into concrete repo/dir (and cloud) sources
// ---------------------------------------------------------------------------
export const parseSourcesTask = defineTask('atlas-procmine-parse-sources', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Parse the stated need into concrete sources to mine for processes',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Process-mining analyst (real-source scanner)',
      task: `Interpret the stated need into a concrete, de-duplicated list of SOURCES whose REAL processes will be mined: git repos, local directories, and (for cron/automation) Azure account(s). Determine the output directory.`,
      context: { need: args.need, projectDir: args.projectDir, outDir: args.outDir },
      instructions: [
        'Read the stated need below and extract the SOURCES whose processes you must mine: repos (kind:"repo"), directories (kind:"dir"), and optionally a cloud account (kind:"cloud") for scheduled jobs / automation.',
        'Resolve "this repo" / "this directory" against projectDir. Detect an output directory if the need states one (e.g. "into <path>"); otherwise use the provided outDir.',
        'Do NOT invent sources the user did not mention. Only mine what is in scope (scoping, not a silent fallback to the public graph).',
        'If the sources are genuinely ambiguous, set `ambiguous: true` and list `questions`.',
        `Write "${args.outDir}/sources.json" with keys: sources (array of { kind, ref, note? }), resolvedOutDir (string), ambiguous (boolean), questions (array).`,
        'TDD assertion: sources.json has a non-empty `sources[]` (unless ambiguous:true) and a non-empty `resolvedOutDir`. Iterate until both hold.',
        `Stated need:\n${args.need}`,
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['sources', 'resolvedOutDir'],
      properties: { sources: { type: 'array' }, resolvedOutDir: { type: 'string' }, ambiguous: { type: 'boolean' }, questions: { type: 'array' } },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ---------------------------------------------------------------------------
// Phase 2: mine REAL processes from the filesystem/git (primary)
// ---------------------------------------------------------------------------
export const mineProcessesTask = defineTask('atlas-procmine-mine', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Mine real processes from the named sources (CI/CD, npm, IaC, .a5c, cron)',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Process-mining engineer (read-only filesystem + git survey)',
      task: `For each repo/dir source in scope, mine the REAL automation/processes that actually exist, via your Bash/Read/Glob tools. Every mined process MUST cite the real file it came from.`,
      context: { sources: args.sources, projectDir: args.projectDir, outDir: args.outDir },
      instructions: [
        'For each repo/dir source, survey the REAL tree (read-only) for these process classes, each cited to its file path:',
        '  - CI/CD: `.github/workflows/*.yml` (capture name + `on:` triggers + what each job does), other CI (.gitlab-ci.yml, azure-pipelines.yml, .circleci, Jenkinsfile).',
        '  - npm scripts: the `scripts` block of each package.json (which are build/test/deploy/lint/codegen).',
        '  - IaC: terraform (*.tf), bicep (*.bicep), helm charts (Chart.yaml / templates), k8s manifests, Dockerfiles (and what each builds/deploys).',
        '  - babysitter processes: `.a5c/processes/*.mjs` / `.a5c/process-library/**` (the process id + what it orchestrates).',
        '  - cron/automation: schedule triggers in workflows (`on: schedule`), crontabs, scheduled jobs.',
        'If a cloud source is in scope, ALSO mine real scheduled/automation in the cloud via read-only `az` (e.g. container app jobs, scheduled jobs) — cite the resource id. NEVER run mutating az commands.',
        'Run ONLY read-only commands. NEVER invent workflows, scripts, charts, processes, or file paths. If you did not observe it in a real file, it does not go in the catalog.',
        `Write "${args.outDir}/processes.json" with key: processes (array of { name, kind: 'ci'|'npm'|'iac'|'babysitter'|'cron'|'cloud-automation'|'other', file, source, trigger?, summary }). Group/derive counts as helpful.`,
        `Write "${args.outDir}/processes.md" — a human-readable catalog grouped by class (CI/Release, Agent/Automation, IaC, npm scripts, .a5c processes, cron), EACH entry citing its real file path.`,
        'TDD assertion: processes.json is valid JSON; if repo/dir sources were in scope it has a non-empty processes[] each with a real `file`; otherwise it records skipped:true with a reason. No invented files. Iterate until satisfied.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['processes'],
      properties: { processes: { type: 'array' }, skipped: { type: 'boolean' }, reason: { type: 'string' } },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ---------------------------------------------------------------------------
// Phase 3 (SECONDARY): compare mined processes against the Atlas graph
// ---------------------------------------------------------------------------
export const enrichProcessesTask = defineTask('atlas-procmine-enrich', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compare mined real processes against the Atlas graph (secondary)',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Atlas graph enricher (secondary comparison layer)',
      task: `Compare the REAL mined processes (in processes.json) against the Atlas public knowledge graph to add best-practice / gap commentary. This is SECONDARY and must never replace the real mined catalog.`,
      context: { outDir: args.outDir, processCount: args.processCount },
      instructions: [
        `Read "${args.outDir}/processes.json" — the real mined processes are the input.`,
        'For the major real process families found (e.g. "PR gate CI", "publish pipeline", "IaC helm deploy", "agentic dispatch"), query the Atlas graph for comparable process patterns via mcp__atlas__atlas_public_search / _neighbors / _record. Use the atlas-graph-query skill conventions.',
        'Collect only real Atlas ids returned by the tools — never invent node ids. Tie each comparison to the real mined process it annotates (cite its file).',
        'SECONDARY only: if the graph offers nothing relevant or is unreachable, write a near-empty enrichment with a note. Do NOT pad with generic catalog processes; do NOT let graph content become the catalog.',
        `Write "${args.outDir}/processes-enrichment.json" with keys: comparisons (array of { minedFile, minedName, atlasIds: [...], note }), notes (array).`,
        'TDD assertion: processes-enrichment.json is valid JSON; every atlasId is real; every comparison references a real mined process. Iterate until satisfied.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['comparisons'],
      properties: { comparisons: { type: 'array' }, notes: { type: 'array' } },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ===========================================================================
// Orchestration — mine real processes first; graph comparison secondary.
// ===========================================================================
export async function process(inputs, ctx) {
  const need = inputs.need ?? inputs.$ARGUMENTS ?? '';
  const projectDir = inputs.projectDir ?? '.';
  const outDir = inputs.outDir ?? `.a5c/atlas/${ctx.runId ?? 'run'}`;
  const base = { need, projectDir, outDir };

  const parsed = await ctx.task(parseSourcesTask, base, { key: 'parse-sources' });

  if (parsed.ambiguous === true) {
    const clarify = await ctx.breakpoint({
      question: `The sources to mine are ambiguous. ${(parsed.questions || []).join(' ')} Which repo(s)/director(ies) should I mine processes from?`,
      options: ['Provide the sources', 'Proceed with best-guess sources'],
      expert: 'owner',
      tags: ['interview'],
    });
    if (clarify && clarify.response) {
      base.need = `${need}\n\nClarification (sources): ${clarify.response}`;
      const reparsed = await ctx.task(parseSourcesTask, base, { key: 'parse-sources-2' });
      parsed.sources = reparsed.sources;
      parsed.resolvedOutDir = reparsed.resolvedOutDir;
    }
  }

  const resolvedOutDir = parsed.resolvedOutDir && String(parsed.resolvedOutDir).trim() ? parsed.resolvedOutDir : outDir;
  const scanBase = { ...base, outDir: resolvedOutDir, sources: parsed.sources };

  const mined = await ctx.task(mineProcessesTask, scanBase, { key: 'mine-processes' });

  await ctx.task(
    enrichProcessesTask,
    { ...scanBase, processCount: Array.isArray(mined.processes) ? mined.processes.length : 0 },
    { key: 'enrich-processes' },
  );

  return {
    success: true,
    sourceCount: Array.isArray(parsed.sources) ? parsed.sources.length : 0,
    processCount: Array.isArray(mined.processes) ? mined.processes.length : 0,
    catalog: mined,
  };
}

export default process;
