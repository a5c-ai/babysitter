const { defineTask } = require('@a5c-ai/babysitter-sdk');

// Periodically expand vendor env-var inventories. W84 took Claude Code from
// 13 → 150 EnvVar instances in one wave; W87 added 8 cross-vendor essentials.
// This process re-runs that lens: per vendor, fetch the env-vars doc, diff
// against existing EnvVar instances, emit "author missing EnvVar" subtasks.
// No breakpoint — pure additive backlog driven by doc evidence.

const loadEnvVarSourcesTask = defineTask('load-env-var-sources', (args) => ({
  kind: 'agent',
  title: 'Load watchlist entries with kind in (env-vars, primary-entrypoint)',
  metadata: {
    watchlistPath: args.watchlistPath,
    instructions: [
      'Read .a5c/processes/vendor-docs-watchlist.json.',
      'Filter to entries where kind === "env-vars" OR (kind === "primary-entrypoint" AND notes mention env vars / GH_TOKEN / OPENAI_API_KEY / etc.).',
      'Return JSON: { sources: [{ vendor, url }] }.',
    ],
  },
}));

const fetchVendorEnvVarsTask = defineTask('fetch-vendor-env-vars', (args) => ({
  kind: 'agent',
  title: `Fetch env-vars for ${args.source.vendor}`,
  metadata: {
    source: args.source,
    instructions: [
      'WebFetch the URL. If fetch fails, return { vendor, status: blocked, reason }.',
      'Extract every documented environment variable into a list of { name, category, description, valueType?, defaultValue?, featureGate? }.',
      'Skip non-env-var content. Skip variables that are clearly OS-level (PATH, HOME) unless the doc explicitly elevates them.',
      'Return JSON: { vendor, status: ok, retrievedAt, vars: [...] }.',
    ],
  },
}));

const diffEnvVarsTask = defineTask('diff-env-vars-against-catalog', (args) => ({
  kind: 'agent',
  title: `Diff ${args.vendor} env-vars against catalog`,
  metadata: {
    vendor: args.vendor,
    docVars: args.docVars,
    graphRoot: args.graphRoot,
    instructions: [
      'Walk graph/extensions/env-vars/ for EnvVar instances tied to this vendor (via affects -> agent-runtime-impl:<vendor>.runtime@*).',
      'For each docVar, classify: present (catalog has it), present-but-thin (in catalog but missing category/valueType/defaultValue from the new fetch), missing (not in catalog).',
      'Return JSON: { vendor, missing: [...], thin: [...] }.',
    ],
  },
}));

const authorMissingEnvVarsTask = defineTask('author-missing-env-vars', (args) => ({
  kind: 'agent',
  title: `Author missing EnvVar instances for ${args.vendor}`,
  metadata: {
    vendor: args.vendor,
    missing: args.missing,
    sourceUrl: args.sourceUrl,
    retrievedAt: args.retrievedAt,
    instructions: [
      'Author the missing EnvVars in graph/extensions/env-vars/<vendor>-env-vars-extended.yaml (multi-doc; append rather than splitting per-var).',
      'Each EnvVar carries: id, displayName, name, category, description, valueType, defaultValue?, featureGate?, plus an `affects` edge to agent-runtime-impl:<vendor>.runtime@*.',
      'Match the W84 schema attribute names exactly.',
      'Author a single shared EvidenceSource for the doc URL + retrievedAt; reference it from each new EnvVar via backed_by_evidence.',
      'No fabrication — variables not present in the doc are not added.',
      'No Trust Chain entries.',
      'Run the validator.',
      'Return JSON: { vendor, authoredCount, fileEdited, evidenceSourceId, validatorState }.',
    ],
  },
}));

const updateThinEnvVarsTask = defineTask('update-thin-env-vars', (args) => ({
  kind: 'agent',
  title: `Update thin EnvVar instances for ${args.vendor}`,
  metadata: {
    vendor: args.vendor,
    thin: args.thin,
    sourceUrl: args.sourceUrl,
    retrievedAt: args.retrievedAt,
    instructions: [
      'For each thin EnvVar, fill in the missing attribute(s) (category / valueType / defaultValue) from the freshly-fetched doc.',
      'Update the existing EvidenceSource retrievedAt or attach a new one if the value changed.',
      'Run the validator.',
      'Return JSON: { vendor, updatedCount, fileEdited }.',
    ],
  },
}));

const summarizeEnvVarSyncTask = defineTask('summarize-env-var-sync', (args) => ({
  kind: 'agent',
  title: 'Summarize env-var inventory sync',
  metadata: {
    perVendorResults: args.perVendorResults,
    checks: [
      'Validator: 0 structural, 0 dangling, 0 parse errors.',
      'Every new EnvVar carries `affects` edge + EvidenceSource referencing the doc URL.',
      'No fabricated variables.',
      'Return JSON: { status, totalAuthored, totalUpdated, perVendor: {...} }.',
    ],
  },
}));

exports.process = async function process(inputs, ctx) {
  const watchlistPath = inputs.watchlistPath || '.a5c/processes/vendor-docs-watchlist.json';
  const graphRoot = inputs.graphRoot || 'graph';

  const sources = await ctx.task(loadEnvVarSourcesTask, { watchlistPath });

  const perVendorResults = [];
  for (const source of sources.sources) {
    const fetched = await ctx.task(fetchVendorEnvVarsTask, { source });
    if (fetched.status !== 'ok') {
      perVendorResults.push({ vendor: source.vendor, status: fetched.status, reason: fetched.reason });
      continue;
    }
    const diff = await ctx.task(diffEnvVarsTask, {
      vendor: source.vendor,
      docVars: fetched.vars,
      graphRoot,
    });
    let authored = null;
    let updated = null;
    if (diff.missing && diff.missing.length) {
      authored = await ctx.task(authorMissingEnvVarsTask, {
        vendor: source.vendor,
        missing: diff.missing,
        sourceUrl: source.url,
        retrievedAt: fetched.retrievedAt,
      });
    }
    if (diff.thin && diff.thin.length) {
      updated = await ctx.task(updateThinEnvVarsTask, {
        vendor: source.vendor,
        thin: diff.thin,
        sourceUrl: source.url,
        retrievedAt: fetched.retrievedAt,
      });
    }
    perVendorResults.push({ vendor: source.vendor, fetched, diff, authored, updated });
  }

  const summary = await ctx.task(summarizeEnvVarSyncTask, { perVendorResults });

  return {
    status: summary.status,
    watchlistPath,
    sources,
    perVendorResults,
    summary,
  };
};
