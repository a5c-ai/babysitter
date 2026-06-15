/**
 * @process atlas/atlas-collect-nuances
 * @description Collect the REAL constraints, gotchas, and edge-cases of the
 *   user's actual scanned systems — e.g. IaC-as-survey drift, orphaned cloud
 *   resources, RBAC/visibility quirks, region splits, tenant/descriptor
 *   mismatches, missing pipelines — each cited to its real source (an Azure
 *   resource id / RG, a file path, or a missing-thing observation). The Atlas
 *   public knowledge graph (mcp__atlas__atlas_public_*) is used ONLY as a
 *   SECONDARY comparison layer. Short, iterative, TDD-shaped: each phase produces
 *   a checkable artifact and asserts on it. Agent tasks only — no shell tasks
 *   (the agent runs the real read-only scans itself via its Bash tool).
 * @inputs { need, projectDir?, outDir? }
 * @outputs { success, sourceCount, nuanceCount, nuances }
 *
 * Repo override honored: agent-only subtasks (no shell); breakpoints kept sparse.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ---------------------------------------------------------------------------
// Phase 1: parse the stated need into concrete sources to inspect
// ---------------------------------------------------------------------------
export const parseSourcesTask = defineTask('atlas-nuances-parse-sources', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Parse the stated need into concrete sources to inspect for nuances',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Systems analyst (real-source scanner)',
      task: `Interpret the stated need into a concrete, de-duplicated list of SOURCES whose REAL constraints/gotchas will be collected: Azure account(s), git repos, local directories. Determine the output directory.`,
      context: { need: args.need, projectDir: args.projectDir, outDir: args.outDir },
      instructions: [
        'Read the stated need below and extract the SOURCES to inspect: cloud (kind:"cloud"), repos (kind:"repo"), directories (kind:"dir").',
        'Resolve "this repo"/"this directory" against projectDir. Detect an output directory if stated; otherwise use the provided outDir.',
        'Do NOT invent sources. Only inspect what is in scope (scoping, not a silent fallback to the public graph).',
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
// Phase 2: gather REAL constraints/gotchas/edge-cases from the scanned systems
// ---------------------------------------------------------------------------
export const gatherNuancesTask = defineTask('atlas-nuances-gather', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Gather real constraints, gotchas and edge-cases from the sources',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Reliability / architecture reviewer (read-only survey)',
      task: `Inspect the REAL sources in scope (via read-only \`az\` for cloud and Bash/Read/Glob for repos/dirs) and collect the actual constraints, gotchas, and edge-cases of THESE systems — each cited to its real source.`,
      context: { sources: args.sources, projectDir: args.projectDir, outDir: args.outDir },
      instructions: [
        'If a prior discovery wrote azure-inventory.json / workspace-inventory.json / processes.json into the output dir, READ them first and build on them. Otherwise run your own read-only scans.',
        'For cloud sources, use READ-ONLY `az` to detect real nuances such as: orphaned resources (e.g. a DNS zone or VNet surviving a deleted cluster), broken/empty listeners, region splits (resources scattered across regions), RBAC/visibility quirks (`az identity list` / `az role assignment list` returning empty at a scope), `ManagedBy=terraform` tags with no in-repo IaC (survey-vs-IaC drift), tenant/subscription descriptor mismatches, untagged resources. NEVER run mutating commands.',
        'For repo/dir sources, detect real nuances such as: infra that is a read-only survey rather than source-of-truth IaC, externally-deployed systems with NO pipeline in the inventoried repos, un-checked-out submodules, inferred-but-unconfirmed linkages, version pins / platform-specific constraints.',
        'NEVER invent a constraint. Every nuance MUST cite a real source: a resource id / RG, a file path, or a concrete "missing thing" observation (e.g. "no workflow targets resource X"). If it is inferred, label it inferred.',
        `Write "${args.outDir}/nuances-context.json" grouping findings: { drift: [...], orphans: [...], rbac: [...], regionSplits: [...], missingPipelines: [...], other: [...] }, each item { text, sourceRef, inferred? }.`,
        'TDD assertion: nuances-context.json is valid JSON; each finding has a concrete sourceRef; nothing is invented. Iterate until satisfied.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['groups'],
      properties: { groups: { type: 'object' } },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ---------------------------------------------------------------------------
// Phase 3: distill the deduplicated nuance list (+ secondary graph comparison)
// ---------------------------------------------------------------------------
export const distillNuancesTask = defineTask('atlas-nuances-distill', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Distill the deduplicated real-system nuance list (graph secondary)',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Domain analyst / technical writer (evidence-backed)',
      task: `Distill the gathered findings into a deduplicated, prioritized list of REAL nuances for the scanned systems. Each nuance cites its real source. Atlas-graph comparison is SECONDARY only.`,
      context: { outDir: args.outDir },
      instructions: [
        `Read "${args.outDir}/nuances-context.json" — the real gathered findings are the input.`,
        'Deduplicate and prioritize into a clear nuance list. Each nuance keeps its real sourceRef(s) and an inferred flag where applicable.',
        'OPTIONAL SECONDARY enrichment: for recurring nuance themes (e.g. "IaC drift", "orphaned resources", "RBAC visibility"), you MAY query the Atlas graph (mcp__atlas__atlas_public_search / _wiki_page) for known best-practice caveats and attach real Atlas ids as labelled "(Atlas comparison)" asides. Never let graph content become the primary list; if irrelevant/unreachable, skip with a note.',
        `Write "${args.outDir}/nuances.md" — a human-readable, prioritized nuance list, each item citing its real source (resource id / RG / file path / missing-thing observation), with Atlas comparisons clearly marked secondary.`,
        `Write "${args.outDir}/nuances.json" — the machine mirror: nuances (array of { text, type, sourceRefs: [...], inferred?: boolean, atlasComparison?: [...] }).`,
        'TDD assertion: every nuance cites >= 1 real sourceRef; the list is deduplicated; any atlasComparison ids are real tool-returned ids. Iterate until all hold.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['nuances'],
      properties: { nuances: { type: 'array' }, nuancesPath: { type: 'string' } },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ===========================================================================
// Orchestration — collect real nuances first; graph comparison secondary.
// ===========================================================================
export async function process(inputs, ctx) {
  const need = inputs.need ?? inputs.$ARGUMENTS ?? '';
  const projectDir = inputs.projectDir ?? '.';
  const outDir = inputs.outDir ?? `.a5c/atlas/${ctx.runId ?? 'run'}`;
  const base = { need, projectDir, outDir };

  const parsed = await ctx.task(parseSourcesTask, base, { key: 'parse-sources' });

  if (parsed.ambiguous === true) {
    const clarify = await ctx.breakpoint({
      question: `The sources to inspect for nuances are ambiguous. ${(parsed.questions || []).join(' ')} Which cloud account(s)/repo(s)/director(ies) should I inspect?`,
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

  const context = await ctx.task(gatherNuancesTask, scanBase, { key: 'gather-nuances' });
  const nuances = await ctx.task(distillNuancesTask, { ...scanBase, context: context.groups }, { key: 'distill-nuances' });

  return {
    success: true,
    sourceCount: Array.isArray(parsed.sources) ? parsed.sources.length : 0,
    nuanceCount: Array.isArray(nuances.nuances) ? nuances.nuances.length : 0,
    nuances,
  };
}

export default process;
