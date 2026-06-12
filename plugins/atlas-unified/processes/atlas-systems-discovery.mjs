/**
 * @process atlas/atlas-systems-discovery
 * @description Scan the user's REAL sources (Azure subscriptions via `az`, git
 *   repos, local directories) and synthesize them into a layered systems atlas.
 *   The scan is PRIMARY: every node cites a real source (an Azure resource id, an
 *   RG, a file path). The Atlas public knowledge graph
 *   (mcp__atlas__atlas_public_*) is used ONLY as a SECONDARY enrichment layer to
 *   add best-practice / comparison context — never as the primary content.
 *   Short, iterative, TDD-shaped: each phase produces a checkable artifact and
 *   asserts on it before proceeding. Agent tasks only — no shell tasks (the agent
 *   runs the real read-only scans itself via its Bash tool inside the agent
 *   prompt).
 * @inputs { need, projectDir?, outDir? }
 * @outputs { success, sourceCount, cloudResourceCount, design }
 *
 * Repo override honored: agent-only subtasks (no shell); breakpoints kept sparse
 * (interview only when the stated sources are genuinely ambiguous).
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ---------------------------------------------------------------------------
// Phase 1: parse the stated need into concrete SOURCES (cloud / repos / dirs)
// ---------------------------------------------------------------------------
export const parseSourcesTask = defineTask('atlas-discovery-parse-sources', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Parse the stated need into concrete sources to scan',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Systems discovery analyst (real-source scanner)',
      task: `Interpret the stated need into a concrete, de-duplicated list of SOURCES to scan: Azure subscription(s), git repos, local directories, and URLs. Determine the output directory.`,
      context: { need: args.need, projectDir: args.projectDir, outDir: args.outDir },
      instructions: [
        'Read the stated need below and extract the SOURCES the user actually wants inventoried. Sources fall into these classes:',
        '  - cloud: an Azure account/subscription ("our azure account", a subscription id/name). Only include if the need names a cloud account.',
        '  - repo: a git repository ("this repo", a repo path/URL).',
        '  - dir: a local directory ("C:/work/company/").',
        '  - url: a service URL to probe (read-only) if explicitly named.',
        'Detect the OUTPUT directory if the need states one (e.g. "into C:/work/company/atlas") — otherwise use the provided outDir.',
        'Resolve relative references: "this repo" / "this directory" resolve against projectDir.',
        'Do NOT invent sources the user did not mention. Only scan what is in scope (this is scoping, NOT a silent fallback to the public graph).',
        'If the stated sources are genuinely ambiguous (you cannot tell what to scan), set `ambiguous: true` and list `questions`.',
        `Write "${args.outDir}/sources.json" with keys: sources (array of { kind: 'cloud'|'repo'|'dir'|'url', ref: string, note?: string }), resolvedOutDir (string), ambiguous (boolean), questions (array).`,
        'TDD assertion for this phase: sources.json MUST have a non-empty `sources[]` (unless ambiguous:true) and a non-empty `resolvedOutDir`. Do not finish until both hold.',
        `Stated need:\n${args.need}`,
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['sources', 'resolvedOutDir'],
      properties: {
        sources: { type: 'array' },
        resolvedOutDir: { type: 'string' },
        ambiguous: { type: 'boolean' },
        questions: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ---------------------------------------------------------------------------
// Phase 2: scan each cloud (Azure) source with read-only `az`
// ---------------------------------------------------------------------------
export const scanCloudTask = defineTask('atlas-discovery-scan-cloud', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scan Azure cloud sources (read-only az) into a real inventory',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cloud inventory engineer (read-only Azure survey)',
      task: `For each Azure source in scope, run READ-ONLY \`az\` commands via your Bash tool and write a real cloud inventory of the actual resources — every entry citing its real resource id and resource group.`,
      context: { sources: args.sources, outDir: args.outDir },
      instructions: [
        'Look at the sources[] below and select only the entries with kind === "cloud".',
        'If there are NO cloud sources, write an inventory file that explicitly records `{ skipped: true, reason: "no cloud source named in the stated need", resources: [] }` and finish. This is correct scoping, NOT a fallback — only scan what the user asked for.',
        'For each cloud source, use your Bash tool to run READ-ONLY `az` commands. Use ONLY read verbs (account show/list, group list, resource list, and per-service `list`/`show`). NEVER run create/delete/update/set commands.',
        'Recommended survey: `az account show`, `az account list`, `az group list`, `az resource list`, then per-service detail: `az aks list`, `az acr list`, `az storage account list`, `az keyvault list`, `az postgres flexible-server list` (and `az postgres server list`), `az redis list`, `az containerapp list` + `az containerapp env list`, `az cognitiveservices account list`, `az staticwebapp list`, `az vm list`, `az network vnet list`, `az network public-ip list`. Skip any subcommand the CLI does not support rather than erroring out.',
        'If `az` is not installed or not logged in, record that as a real finding (`{ skipped: true, reason: "az unavailable / not logged in" }`) — do NOT invent resources.',
        'NEVER invent resource ids, names, regions, SKUs, or RGs. Every resource entry MUST come from real `az` output. If you did not see it in command output, it does not go in the file.',
        `Write "${args.outDir}/azure-inventory.json" with keys: subscription (object/string from \`az account show\`), resourceGroups (array), resourceGroupCount (number), resourceCount (number), resourcesByType (object), resources (array of { id, name, type, location, resourceGroup, sku?, kind?, tags? }), notes (array of caveats), skipped? (boolean), reason? (string).`,
        `Also write "${args.outDir}/azure.md" — a human-readable cloud inventory grouped by resource group / system, citing real resource ids and RGs (model it on a layered cloud survey doc).`,
        'TDD assertion for this phase: azure-inventory.json exists and is valid JSON; if cloud sources were in scope and az was available it has a non-empty resources[] with real ids; otherwise skipped:true with a concrete reason. No invented ids. Iterate the scan until this holds.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['resourceCount'],
      properties: {
        subscription: {},
        resourceGroups: { type: 'array' },
        resourceGroupCount: { type: 'number' },
        resourceCount: { type: 'number' },
        resources: { type: 'array' },
        skipped: { type: 'boolean' },
        reason: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ---------------------------------------------------------------------------
// Phase 3: scan each repo/dir source on the filesystem + git
// ---------------------------------------------------------------------------
export const scanLocalTask = defineTask('atlas-discovery-scan-local', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scan repo/dir sources (filesystem + git) into a real inventory',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Workspace inventory engineer (read-only filesystem + git survey)',
      task: `For each repo/dir source in scope, scan the real filesystem and git state via your Bash/Read/Glob tools and write a real workspace inventory — every entry citing a real file path.`,
      context: { sources: args.sources, projectDir: args.projectDir, outDir: args.outDir },
      instructions: [
        'Look at the sources[] below and select only the entries with kind === "repo" or kind === "dir".',
        'If there are NO repo/dir sources, write `{ skipped: true, reason: "no repo/dir source named", entries: [] }` and finish. Correct scoping, not a fallback.',
        'For each source, use Bash (read-only)/Read/Glob to survey the REAL tree: top-level structure, git remotes/branch/submodules (`git -C <dir> remote -v`, `git submodule status`), package manifests (package.json, pyproject.toml, go.mod, Cargo.toml, *.csproj), detected languages, services/apps, and IaC presence (terraform/bicep/helm/k8s/Dockerfiles).',
        'Run ONLY read-only commands (git status/remote/submodule/log, ls/find equivalents). NEVER mutate the tree or run installs.',
        'NEVER invent files, packages, services, or remotes. Every entry MUST trace to a real path you actually observed. Cite the path on each finding.',
        `Write "${args.outDir}/workspace-inventory.json" with keys: roots (array of scanned source refs), entries (array of { source, path, type, detail }), repos (array of { path, remote?, branch?, submodules? }), manifests (array of { path, name?, kind }), services (array), iac (array of { path, kind }), notes (array), skipped? (boolean), reason? (string).`,
        `Also write "${args.outDir}/workspace.md" — a human-readable workspace inventory, each item citing its real path.`,
        'TDD assertion for this phase: workspace-inventory.json is valid JSON; if repo/dir sources were in scope it has a non-empty entries[] citing real paths; otherwise skipped:true with a reason. No invented paths. Iterate until satisfied.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['entries'],
      properties: {
        roots: { type: 'array' },
        entries: { type: 'array' },
        repos: { type: 'array' },
        manifests: { type: 'array' },
        iac: { type: 'array' },
        skipped: { type: 'boolean' },
        reason: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ---------------------------------------------------------------------------
// Phase 4 (SECONDARY): enrich the discovered real systems against the Atlas graph
// ---------------------------------------------------------------------------
export const enrichGraphTask = defineTask('atlas-discovery-enrich-graph', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Enrich discovered real systems with Atlas-graph comparison (secondary)',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Atlas graph enricher (secondary comparison layer)',
      task: `Map the REAL systems already discovered (in azure-inventory.json + workspace-inventory.json) against the Atlas public knowledge graph to add best-practice / comparison context. This is a SECONDARY enrichment layer — it must NEVER replace or outweigh the real scan.`,
      context: { outDir: args.outDir, cloudResourceCount: args.cloudResourceCount, localEntryCount: args.localEntryCount },
      instructions: [
        `Read "${args.outDir}/azure-inventory.json" and "${args.outDir}/workspace-inventory.json" — these real inventories are the input.`,
        'For the major real systems found (e.g. "AKS cluster", "Container Apps app", "Azure OpenAI", "monorepo CI/CD"), query the Atlas graph for comparable patterns/best-practices using mcp__atlas__atlas_public_search and mcp__atlas__atlas_public_neighbors / mcp__atlas__atlas_public_record.',
        'Use the atlas-graph-query skill conventions. Collect only real Atlas ids returned by the tools — never invent node ids.',
        'For EACH enrichment, tie it back to the real system it annotates (cite the real Azure resource id / file path it compares against).',
        'This layer is OPTIONAL and SECONDARY. If the graph has nothing relevant (or is unreachable), write an empty/near-empty enrichment with a note — do NOT pad it with generic catalog nodes, and do NOT let graph content become the primary atlas content.',
        `Write "${args.outDir}/graph-enrichment.json" with keys: enrichments (array of { realSystem, realSourceRef, atlasIds: [...], note }), notes (array). Keep it concise and clearly secondary.`,
        'TDD assertion for this phase: graph-enrichment.json is valid JSON; every atlasId is a real tool-returned id; every enrichment references a real system from the scanned inventories. No invented ids. Iterate until satisfied.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['enrichments'],
      properties: { enrichments: { type: 'array' }, notes: { type: 'array' } },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ---------------------------------------------------------------------------
// Phase 5: synthesize the real, cross-linked layered systems atlas
// ---------------------------------------------------------------------------
export const synthesizeAtlasTask = defineTask('atlas-discovery-synthesize-atlas', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize the real, cross-linked layered systems atlas',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Systems architect / technical writer (evidence-backed synthesis)',
      task: `Synthesize the real scanned inventories into a single cross-linked layered systems atlas. Every system and item MUST cite its REAL source (Azure resource id, RG, or file path). Graph enrichment may appear only as clearly-labelled secondary "comparison" notes.`,
      context: { need: args.need, outDir: args.outDir, sources: args.sources },
      instructions: [
        `Read the real inputs from "${args.outDir}": azure-inventory.json, azure.md, workspace-inventory.json, workspace.md, and graph-enrichment.json (secondary).`,
        'Identify the real SYSTEMS (group resources + repos that belong together — e.g. an AKS platform, a Container Apps product, an AI/ML estate, a monorepo). Cross-link them: which repo deploys to which cloud system, which system consumes which data store, which pipeline targets which resource.',
        'Layer each system into: components, processes, data, integrations, nuances. EVERY item cites its real source (resource id / RG / file path). Do NOT invent resource ids, regions, or file paths.',
        'Include a cross-system map and a data-stores table (like a real SYSTEMS-ATLAS) and a Gaps & Caveats section listing real survey limitations (e.g. IaC-as-survey drift, orphaned resources, RBAC visibility quirks, region splits).',
        'Graph enrichment is SECONDARY: fold any relevant atlas comparison only as labelled "(Atlas comparison)" asides — never as a system in its own right, never as the headline.',
        `Write "${args.outDir}/SYSTEMS-ATLAS.md" — the human, cross-linked layered atlas, evidence-backed, every item source-cited.`,
        `Write "${args.outDir}/atlas.json" — the machine mirror with keys: systems (array of { name, plane, components[], processes[], data[], integrations[], nuances[], sources[] }), crossLinks (array of { from, to, via, evidence }), dataStores (array), gaps (array). Every sources[]/evidence entry cites a real resource id or path.`,
        'TDD assertion for this phase: SYSTEMS-ATLAS.md covers components/processes/data/integrations/nuances and every system cites >= 1 real source; atlas.json mirrors it with non-empty systems[] (when any source was scanned) and crossLinks[]; no invented ids/paths. Iterate until all hold.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['systems'],
      properties: {
        systems: { type: 'array' },
        crossLinks: { type: 'array' },
        dataStores: { type: 'array' },
        gaps: { type: 'array' },
        atlasPath: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ===========================================================================
// Orchestration — SCAN-FIRST, graph enrichment secondary.
// ===========================================================================
export async function process(inputs, ctx) {
  const need = inputs.need ?? inputs.$ARGUMENTS ?? '';
  const projectDir = inputs.projectDir ?? '.';
  const outDir = inputs.outDir ?? `.a5c/atlas/${ctx.runId ?? 'run'}`;
  const base = { need, projectDir, outDir };

  // Phase 1: parse the stated need into concrete sources.
  const parsed = await ctx.task(parseSourcesTask, base, { key: 'parse-sources' });

  // Sparse breakpoint: only interview when the sources are genuinely ambiguous.
  if (parsed.ambiguous === true) {
    const clarify = await ctx.breakpoint({
      question: `The sources to scan are ambiguous. ${(parsed.questions || []).join(' ')} Which Azure account(s), repo(s), and director(ies) should I scan, and where should the atlas be written?`,
      options: ['Provide the sources', 'Proceed with best-guess sources'],
      expert: 'owner',
      tags: ['interview'],
    });
    if (clarify && clarify.response) {
      base.need = `${need}\n\nClarification (sources): ${clarify.response}`;
      // Re-parse with the clarified sources.
      const reparsed = await ctx.task(parseSourcesTask, base, { key: 'parse-sources-2' });
      parsed.sources = reparsed.sources;
      parsed.resolvedOutDir = reparsed.resolvedOutDir;
    }
  }

  // Honor a resolved output dir parsed out of the need (e.g. "into C:/work/company/atlas").
  const resolvedOutDir = parsed.resolvedOutDir && String(parsed.resolvedOutDir).trim() ? parsed.resolvedOutDir : outDir;
  const scanBase = { ...base, outDir: resolvedOutDir, sources: parsed.sources };

  // Phase 2: scan cloud (primary).
  const cloud = await ctx.task(scanCloudTask, scanBase, { key: 'scan-cloud' });

  // Phase 3: scan repos/dirs (primary).
  const local = await ctx.task(scanLocalTask, scanBase, { key: 'scan-local' });

  // Phase 4: enrich against the Atlas graph (SECONDARY).
  await ctx.task(
    enrichGraphTask,
    {
      ...scanBase,
      cloudResourceCount: cloud.resourceCount ?? 0,
      localEntryCount: Array.isArray(local.entries) ? local.entries.length : 0,
    },
    { key: 'enrich-graph' },
  );

  // Phase 5: synthesize the real cross-linked atlas.
  const design = await ctx.task(synthesizeAtlasTask, scanBase, { key: 'synthesize-atlas' });

  return {
    success: true,
    sourceCount: Array.isArray(parsed.sources) ? parsed.sources.length : 0,
    cloudResourceCount: cloud.resourceCount ?? 0,
    design,
  };
}

export default process;
