const { defineTask } = require('@a5c-ai/babysitter-sdk');

// Periodically re-fetch a watchlist of vendor docs and diff observed concepts
// against the catalog. Captures the W81 / W83 / W87 pattern of re-mining
// Anthropic + OpenAI + Cursor + Gemini + GitHub Copilot CLI doc pages and
// finding new NodeKinds / attributes / instances that should be added.
//
// Watchlist lives in vendor-docs-watchlist.json so the user can edit it
// without modifying this process file.

const loadWatchlistTask = defineTask('load-vendor-doc-watchlist', (args) => ({
  kind: 'agent',
  title: 'Load and validate the vendor-docs watchlist',
  metadata: {
    watchlistPath: args.watchlistPath,
    filterVendor: args.filterVendor,
    filterKind: args.filterKind,
    instructions: [
      'Read the JSON file at watchlistPath (default `.a5c/processes/vendor-docs-watchlist.json`).',
      'Validate each entry has { vendor, kind, url } at minimum.',
      'Apply optional filters: filterVendor (single string), filterKind (single string).',
      'Return JSON: { watchlist: [...], skipped: [...] }.',
    ],
  },
}));

const fetchAndSummarizeOneDocTask = defineTask('fetch-and-summarize-vendor-doc', (args) => ({
  kind: 'agent',
  title: `Fetch and summarize ${args.entry.vendor}/${args.entry.kind}`,
  metadata: {
    entry: args.entry,
    instructions: [
      'Fetch the URL (WebFetch). If fetch fails, return { entry, status: blocked, reason }.',
      'Extract a concept inventory: every named concept the doc introduces — slash commands, hooks, tools, env-vars, frontmatter fields, message types, effort levels, permission modes, scopes, marketplace commands, primitives, etc.',
      'For each concept, record: { name, category (one of hook|tool|env-var|frontmatter-field|protocol-message|effort-level|permission-mode|scope|primitive|capability|nodekind|other), shortDescription, exampleValue?, sourceQuote (≤15 words) }.',
      'Skip non-information content (navigation, headers, footers).',
      'Return JSON: { entry, status: ok, retrievedAt, concepts: [...], rawSummary }.',
    ],
  },
}));

const diffAgainstCatalogTask = defineTask('diff-doc-concepts-against-catalog', (args) => ({
  kind: 'agent',
  title: `Diff ${args.entry.vendor}/${args.entry.kind} concepts against catalog`,
  metadata: {
    entry: args.entry,
    concepts: args.concepts,
    graphRoot: args.graphRoot,
    instructions: [
      'For each concept, search the catalog (graph/ + schema/) for grounding:',
      '  - Concept name appears as a NodeKind id or instance id → present.',
      '  - Concept name appears only as an attribute value or schema enum → present-but-thin.',
      '  - Concept name not found → missing.',
      'For missing concepts, propose a target shape: { proposedNodeKind?, proposedInstanceFile?, proposedEdges?, proposedSchemaEnumExtension? }. Match the W82/W83/W86 ontology decisions: prefer attribute extensions or new instances over new NodeKinds unless the concept is genuinely cross-cutting (cite the W86 ontologyRationale rule).',
      'Return JSON: { entry, findings: [{ concept, status: present|present-but-thin|missing, proposal? }] }.',
    ],
  },
}));

// BREAKPOINT: drift findings are typically larger than one run can fix
// well, and the user often wants to prioritize which vendor / which concept
// category gets authored first (e.g. env-vars vs hooks vs frontmatter
// fields). This is the one ambiguity worth pausing on per the repo override
// (keep breakpoints sparse).
const prioritizeDriftTask = defineTask('prioritize-drift-findings', (args) => ({
  kind: 'breakpoint',
  title: 'Prioritize drift findings before authoring',
  metadata: {
    perDocFindings: args.perDocFindings,
    prompt: 'Drift audit complete. Each missing/thin concept is a candidate authoring task. Pick which subset to author this run, in priority order. Defer the rest as graph carry-over task records or leave for the next scheduled run.',
  },
}));

const authorOneFindingTask = defineTask('author-drift-finding', (args) => ({
  kind: 'agent',
  title: `Author catalog change for ${args.finding.concept.name}`,
  metadata: {
    entry: args.entry,
    finding: args.finding,
    instructions: [
      'Apply the proposal: edit/create YAML under graph/ or schema/.',
      'Author an EvidenceSource record citing the watchlist URL + retrievedAt + sourceQuote, plus a Claim referencing the new graph subset.',
      'Lossless rule: never delete existing source-citing comments without representing the source as graph data.',
      'No Trust Chain entries.',
      'Run the validator; on failure, revert and emit a graph carry-over task capturing the issue.',
      'Return JSON: { findingId, status: applied|deferred|failed, filesEdited[], filesCreated[], deferredNodeId? }.',
    ],
  },
}));

const verifyDriftRunTask = defineTask('verify-drift-run', (args) => ({
  kind: 'agent',
  title: 'Verify drift-detection run output',
  metadata: {
    perDocFindings: args.perDocFindings,
    authoringResults: args.authoringResults,
    checks: [
      'Validator: 0 structural, 0 dangling, 0 parse errors.',
      'Every applied finding has an EvidenceSource + Claim citing the doc URL.',
      'No Trust Chain entries.',
      'Findings not selected for authoring are captured as graph carry-over task records OR explicitly listed in the run summary as carry-over for next run.',
      'Return JSON: { status, conceptsApplied, conceptsDeferred, conceptsCarriedOver }.',
    ],
  },
}));

exports.process = async function process(inputs, ctx) {
  const watchlistPath = inputs.watchlistPath || '.a5c/processes/vendor-docs-watchlist.json';
  const graphRoot = inputs.graphRoot || 'graph';
  const filterVendor = inputs.filterVendor || null;
  const filterKind = inputs.filterKind || null;

  const watchlistResult = await ctx.task(loadWatchlistTask, { watchlistPath, filterVendor, filterKind });

  const perDocFindings = [];
  for (const entry of watchlistResult.watchlist) {
    const summary = await ctx.task(fetchAndSummarizeOneDocTask, { entry });
    if (summary.status !== 'ok') {
      perDocFindings.push({ entry, status: summary.status, reason: summary.reason });
      continue;
    }
    const diff = await ctx.task(diffAgainstCatalogTask, {
      entry,
      concepts: summary.concepts,
      graphRoot,
    });
    perDocFindings.push({ entry, retrievedAt: summary.retrievedAt, findings: diff.findings });
  }

  const prioritization = await ctx.task(prioritizeDriftTask, { perDocFindings });

  const authoringResults = [];
  for (const selected of prioritization.selectedFindings || []) {
    const result = await ctx.task(authorOneFindingTask, {
      entry: selected.entry,
      finding: selected.finding,
    });
    authoringResults.push(result);
  }

  const verification = await ctx.task(verifyDriftRunTask, { perDocFindings, authoringResults });

  return {
    status: verification.status,
    watchlistPath,
    perDocFindings,
    prioritization,
    authoringResults,
    verification,
  };
};
