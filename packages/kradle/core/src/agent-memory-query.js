/**
 * Agent Memory Query Engine
 *
 * Standalone query engine for in-memory graph traversal and document grep.
 * No external dependencies — operates purely on plain JS data structures.
 *
 * Boundary: agent-memory-query
 * - owns: graph traversal, relevance scoring, text grep, context extraction, combined query execution
 * - delegatesTo: (none — pure data transformation)
 * - mustNotOwn: persistence, HTTP routing, Kubernetes resources, secret handling
 */

export const AGENT_MEMORY_QUERY_BOUNDARY = {
  role: 'agent-memory-query',
  scope: 'In-memory graph traversal and full-text grep query execution for agent memory documents',
  owns: ['graph traversal', 'nodeKind filtering', 'edge following', 'relevance scoring', 'full-text grep', 'context extraction', 'combined query execution'],
  delegatesTo: [],
  mustNotOwn: ['persistence', 'HTTP routing', 'Kubernetes resources', 'secret handling'],
};

const VALID_MODES = ['graph-only', 'grep-only', 'graph-and-grep'];

// ---------------------------------------------------------------------------
// Graph query
// ---------------------------------------------------------------------------

/**
 * Execute a graph query over a set of records.
 *
 * @param {object} params
 * @param {Array}  params.records   - Array of graph records. Each record has { id, nodeKind, attributes, edges }.
 * @param {Array}  [params.edges]   - Optional flat edges array { source, target, kind }. If provided these
 *                                    supplement per-record edges during traversal.
 * @param {string} params.query     - Search text (required, must be non-empty).
 * @param {Array}  [params.kinds]   - nodeKind filter. Empty array means "no filter".
 * @param {number} [params.depth]   - Edge-follow depth (default 1).
 * @returns {{ matches: Array, totalMatches: number }}
 */
export function queryGraph({ records = [], edges = [], query, kinds = [], depth = 1 }) {
  if (query === undefined || query === null) {
    throw new Error('queryGraph: query text is required');
  }
  if (typeof query !== 'string' || query.trim() === '') {
    throw new Error('queryGraph: query text must be a non-empty string');
  }

  // Build adjacency index from flat edges + per-record edges
  const adjacency = buildAdjacency(records, edges);

  // Filter by nodeKind
  let candidates = records;
  if (kinds.length > 0) {
    candidates = candidates.filter(r => kinds.includes(r.nodeKind));
  }

  const lowerQuery = query.toLowerCase();
  const matches = [];

  for (const record of candidates) {
    const score = scoreRecord(record, lowerQuery);
    if (score === 0) continue;

    const followedEdges = followEdges(record.id, adjacency, depth);

    matches.push({
      record: shallowClone(record),
      score,
      edges: followedEdges,
    });
  }

  // Sort by descending score for deterministic output
  matches.sort((a, b) => b.score - a.score);

  return { matches, totalMatches: matches.length };
}

/**
 * Execute a grep query over a set of documents.
 *
 * @param {object}   params
 * @param {Array}    params.documents   - Array of { path: string, content: string }.
 * @param {string}   params.query       - Search text (required, must be non-empty).
 * @param {Array}    [params.paths]     - Optional glob-style path filters.
 * @param {number}   [params.context]   - Number of context lines above/below each match (default 1).
 * @param {number}   [params.maxMatches] - Maximum number of excerpts to return (default 25).
 * @returns {{ excerpts: Array, totalMatches: number }}
 */
export function queryGrep({ documents = [], query, paths = [], context = 1, maxMatches = 25 }) {
  if (query === undefined || query === null) {
    throw new Error('queryGrep: query text is required');
  }
  if (typeof query !== 'string' || query.trim() === '') {
    throw new Error('queryGrep: query text must be a non-empty string');
  }

  // Filter by path globs
  let filtered = documents;
  if (paths.length > 0) {
    filtered = documents.filter(doc => paths.some(p => globMatch(p, doc.path)));
  }

  const lowerQuery = query.toLowerCase();
  const excerpts = [];

  for (const doc of filtered) {
    if (excerpts.length >= maxMatches) break;

    const lines = String(doc.content || '').split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (excerpts.length >= maxMatches) break;

      const lowerLine = lines[i].toLowerCase();
      if (!lowerLine.includes(lowerQuery)) continue;

      // Build highlighted line: mark matched span
      const matchStart = lowerLine.indexOf(lowerQuery);
      const matchEnd = matchStart + query.length;
      const highlighted =
        lines[i].slice(0, matchStart) +
        '**' + lines[i].slice(matchStart, matchEnd) + '**' +
        lines[i].slice(matchEnd);

      // Context lines
      const ctxStart = Math.max(0, i - context);
      const ctxEnd = Math.min(lines.length - 1, i + context);
      const contextLines = lines.slice(ctxStart, ctxEnd + 1);

      excerpts.push({
        path: doc.path,
        lineNumber: i + 1,
        line: lines[i],
        highlighted,
        context: contextLines.join('\n'),
        contextStart: ctxStart + 1,
        contextEnd: ctxEnd + 1,
      });
    }
  }

  return { excerpts, totalMatches: excerpts.length };
}

/**
 * Execute a combined query (graph + grep or either alone).
 *
 * @param {object}  params
 * @param {string}  params.query        - Search text (required).
 * @param {string}  [params.mode]       - 'graph-and-grep' | 'graph-only' | 'grep-only' (default 'graph-and-grep').
 * @param {Array}   [params.records]    - Graph records.
 * @param {Array}   [params.edges]      - Flat edge list.
 * @param {Array}   [params.documents]  - Grep documents.
 * @param {object}  [params.graphOptions] - Passed to queryGraph: { kinds, depth }.
 * @param {object}  [params.grepOptions]  - Passed to queryGrep: { paths, context, maxMatches }.
 * @returns {{ graph: object|null, grep: object|null, stats: object }}
 */
export function queryMemory({
  query,
  mode = 'graph-and-grep',
  records = [],
  edges = [],
  documents = [],
  graphOptions = {},
  grepOptions = {},
}) {
  if (!VALID_MODES.includes(mode)) {
    throw new Error(`queryMemory: invalid mode "${mode}". Must be one of: ${VALID_MODES.join(', ')}`);
  }
  if (query === undefined || query === null) {
    throw new Error('queryMemory: query text is required');
  }
  if (typeof query !== 'string' || query.trim() === '') {
    throw new Error('queryMemory: query text must be a non-empty string');
  }

  let graphResult = null;
  let grepResult = null;

  if (mode === 'graph-only' || mode === 'graph-and-grep') {
    graphResult = queryGraph({
      records,
      edges,
      query,
      kinds: graphOptions.kinds || [],
      depth: graphOptions.depth ?? 1,
    });
  }

  if (mode === 'grep-only' || mode === 'graph-and-grep') {
    grepResult = queryGrep({
      documents,
      query,
      paths: grepOptions.paths || [],
      context: grepOptions.context ?? 1,
      maxMatches: grepOptions.maxMatches ?? 25,
    });
  }

  const graphCount = graphResult ? graphResult.totalMatches : 0;
  const grepCount = grepResult ? grepResult.totalMatches : 0;
  const totalMatches = graphCount + grepCount;

  return {
    graph: graphResult,
    grep: grepResult,
    stats: {
      mode,
      totalMatches,
      graphCount,
      grepCount,
    },
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build adjacency map: nodeId -> [{ target, kind, source }]
 * Merges per-record edges with a flat edge list.
 */
function buildAdjacency(records, flatEdges) {
  const adj = new Map();

  for (const record of records) {
    if (!adj.has(record.id)) adj.set(record.id, []);
    for (const edge of record.edges || []) {
      adj.get(record.id).push({ ...edge, source: record.id });
    }
  }

  for (const edge of flatEdges) {
    const src = edge.source;
    if (!adj.has(src)) adj.set(src, []);
    adj.get(src).push({ ...edge });
  }

  return adj;
}

/**
 * Follow edges from a start node up to `maxDepth` hops.
 * Returns a flat array of edge objects encountered.
 */
function followEdges(startId, adjacency, maxDepth) {
  if (maxDepth <= 0) return [];

  const visited = new Set([startId]);
  const collected = [];
  let frontier = [startId];

  for (let d = 0; d < maxDepth; d++) {
    const nextFrontier = [];
    for (const nodeId of frontier) {
      for (const edge of adjacency.get(nodeId) || []) {
        if (visited.has(edge.target)) continue;
        visited.add(edge.target);
        collected.push({ ...edge });
        nextFrontier.push(edge.target);
      }
    }
    frontier = nextFrontier;
    if (frontier.length === 0) break;
  }

  return collected;
}

/**
 * Score a record against a lowercase query string.
 * Returns 0 (no match), 1 (attribute match), or 2 (id match).
 */
function scoreRecord(record, lowerQuery) {
  const id = String(record.id || '').toLowerCase();
  const attrs = JSON.stringify(record.attributes || {}).toLowerCase();

  if (id.includes(lowerQuery)) return 2;
  if (attrs.includes(lowerQuery)) return 1;
  return 0;
}

/** Minimal shallow clone to avoid mutation of inputs */
function shallowClone(obj) {
  return Object.assign(Object.create(null), obj);
}

/** Simple glob match: * matches any sequence of characters */
function globMatch(pattern, path) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(path);
}
