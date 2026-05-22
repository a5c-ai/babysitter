/**
 * Tests for C3: Wire memory search to the real query engine
 *
 * Verifies that:
 *  - queryAgentMemory delegates to queryMemory from agent-memory-query.js
 *  - searchGraph delegates to queryGraph from agent-memory-query.js
 *  - searchGrep delegates to queryGrep from agent-memory-query.js
 *
 * These tests verify wiring — they exercise real data flows, not just interface shape.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { createAgentMemoryController } from '../src/agent-memory-controller.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeRecords() {
  return [
    {
      id: 'service/auth-api',
      nodeKind: 'Service',
      attributes: { name: 'auth-api', language: 'typescript', team: 'platform' },
      edges: [
        { target: 'service/user-db', kind: 'depends-on' },
        { target: 'team/platform', kind: 'owned-by' },
      ],
    },
    {
      id: 'service/user-db',
      nodeKind: 'Service',
      attributes: { name: 'user-db', language: 'go', team: 'data' },
      edges: [{ target: 'infra/postgres-cluster', kind: 'depends-on' }],
    },
    {
      id: 'team/platform',
      nodeKind: 'Team',
      attributes: { name: 'platform', lead: 'alice' },
      edges: [],
    },
  ];
}

function makeDocuments() {
  return [
    {
      path: 'docs/architecture.md',
      content: [
        'The auth-api service handles authentication.',
        'It uses JWT tokens for session management.',
        'The service connects to user-db for persistence.',
      ].join('\n'),
    },
    {
      path: 'src/auth/handler.ts',
      content: [
        'export function handleAuth(req) {',
        '  const token = req.headers.authorization;',
        '  return validateToken(token);',
        '}',
      ].join('\n'),
    },
  ];
}

// ---------------------------------------------------------------------------
// queryAgentMemory — delegating to queryMemory from agent-memory-query.js
// ---------------------------------------------------------------------------

test('queryAgentMemory with mode graph-only calls queryGraph and returns results', () => {
  const controller = createAgentMemoryController();
  const records = makeRecords();

  const result = controller.queryAgentMemory({
    query: 'auth-api',
    mode: 'graph-only',
    records,
  });

  assert.ok(result !== null && typeof result === 'object', 'Should return a result object');
  assert.ok(result.graph !== null, 'graph results should be present in graph-only mode');
  assert.equal(result.grep, null, 'grep results should be null in graph-only mode');
  assert.ok(typeof result.graph.totalMatches === 'number', 'graph.totalMatches should be a number');
  assert.ok(result.graph.totalMatches >= 1, 'Should find auth-api in records');

  // Verify stats are present (from query engine)
  assert.ok('stats' in result, 'result should have stats');
  assert.equal(result.stats.mode, 'graph-only', 'stats.mode should reflect requested mode');
});

test('queryAgentMemory with mode grep-only calls queryGrep and returns results', () => {
  const controller = createAgentMemoryController();
  const documents = makeDocuments();

  const result = controller.queryAgentMemory({
    query: 'auth-api',
    mode: 'grep-only',
    documents,
  });

  assert.ok(result !== null && typeof result === 'object', 'Should return a result object');
  assert.equal(result.graph, null, 'graph results should be null in grep-only mode');
  assert.ok(result.grep !== null, 'grep results should be present in grep-only mode');
  assert.ok(typeof result.grep.totalMatches === 'number', 'grep.totalMatches should be a number');
  assert.ok(result.grep.totalMatches >= 1, 'Should find auth-api in documents');

  // Verify highlighted output (real queryGrep from query engine produces ** markers)
  const highlighted = result.grep.excerpts.some(e => e.highlighted && e.highlighted.includes('**'));
  assert.ok(highlighted, 'Excerpts should have highlighted markers from the real query engine');
});

test('queryAgentMemory with mode graph-and-grep calls queryMemory and returns both', () => {
  const controller = createAgentMemoryController();
  const records = makeRecords();
  const documents = makeDocuments();

  const result = controller.queryAgentMemory({
    query: 'auth-api',
    mode: 'graph-and-grep',
    records,
    documents,
  });

  assert.ok(result.graph !== null, 'graph results should be present');
  assert.ok(result.grep !== null, 'grep results should be present');
  assert.ok(typeof result.stats.totalMatches === 'number', 'stats.totalMatches should be a number');
  assert.equal(result.stats.totalMatches, result.stats.graphCount + result.stats.grepCount,
    'totalMatches should equal graphCount + grepCount');
});

test('queryAgentMemory returns empty results for no matches', () => {
  const controller = createAgentMemoryController();
  const records = makeRecords();
  const documents = makeDocuments();

  const result = controller.queryAgentMemory({
    query: 'zzz-no-match-xyz',
    mode: 'graph-and-grep',
    records,
    documents,
  });

  assert.equal(result.graph.totalMatches, 0, 'graph should have 0 matches');
  assert.equal(result.grep.totalMatches, 0, 'grep should have 0 matches');
  assert.equal(result.stats.totalMatches, 0, 'stats.totalMatches should be 0');
});

test('queryAgentMemory rejects missing query text', () => {
  const controller = createAgentMemoryController();

  assert.throws(
    () => controller.queryAgentMemory({ mode: 'graph-only', records: [] }),
    /query text is required/,
    'Should throw when query is missing'
  );
});

test('queryAgentMemory rejects empty query text', () => {
  const controller = createAgentMemoryController();

  assert.throws(
    () => controller.queryAgentMemory({ query: '', mode: 'graph-only', records: [] }),
    /non-empty string/,
    'Should throw when query is empty string'
  );
});

// ---------------------------------------------------------------------------
// searchGraph — delegates to queryGraph from agent-memory-query.js
// ---------------------------------------------------------------------------

test('searchGraph delegates to queryGraph from agent-memory-query.js', () => {
  const controller = createAgentMemoryController();
  const records = makeRecords();

  // The real queryGraph produces sorted results by score (descending)
  // and uses `depth` semantics — verify via a real query
  const result = controller.searchGraph({
    records,
    kinds: [],
    query: 'auth-api',
    edgeDepth: 1,
  });

  assert.ok(result.totalMatches >= 1, 'Should find auth-api');
  assert.ok(result.matches.length >= 1, 'matches array should be populated');

  // The real queryGraph sorts by score descending — verify first result is highest scored
  const scores = result.matches.map(m => m.score);
  for (let i = 1; i < scores.length; i++) {
    assert.ok(scores[i] <= scores[i - 1], 'Results should be sorted descending by score (real queryGraph behavior)');
  }

  // Verify highlighted or edge following via depth — auth-api should have edges to user-db
  const authMatch = result.matches.find(m => m.record.id === 'service/auth-api');
  assert.ok(authMatch, 'Should find auth-api record');
  const edgeTargets = authMatch.edges.map(e => e.target);
  assert.ok(edgeTargets.includes('service/user-db'), 'Should follow edge to user-db at depth 1');
});

test('searchGraph uses flat edges array when delegating to queryGraph', () => {
  const controller = createAgentMemoryController();
  const records = [
    { id: 'node/a', nodeKind: 'Service', attributes: { name: 'node-a' }, edges: [] },
    { id: 'node/b', nodeKind: 'Service', attributes: { name: 'node-b' }, edges: [] },
  ];
  const flatEdges = [{ source: 'node/a', target: 'node/b', kind: 'calls' }];

  const result = controller.searchGraph({
    records,
    edges: flatEdges,
    query: 'node-a',
    edgeDepth: 1,
  });

  const matchA = result.matches.find(m => m.record.id === 'node/a');
  assert.ok(matchA, 'Should match node/a');
  const edgeTargets = matchA.edges.map(e => e.target);
  assert.ok(edgeTargets.includes('node/b'), 'Flat edge should be followed via queryGraph');
});

// ---------------------------------------------------------------------------
// searchGrep — delegates to queryGrep from agent-memory-query.js
// ---------------------------------------------------------------------------

test('searchGrep delegates to queryGrep from agent-memory-query.js', () => {
  const controller = createAgentMemoryController();
  const documents = makeDocuments();

  // The real queryGrep produces `highlighted` field with ** markers — verify this
  const result = controller.searchGrep({
    documents,
    pattern: 'auth-api',
    maxMatches: 25,
  });

  assert.ok(result.totalMatches >= 1, 'Should find auth-api in documents');
  assert.ok(result.excerpts.length >= 1, 'excerpts should be populated');

  // The real queryGrep produces `highlighted` with ** markers
  // This is the key differentiator vs the stub — the stub did not produce highlighted
  const withHighlight = result.excerpts.filter(e => e.highlighted && e.highlighted.includes('**auth-api**'));
  assert.ok(withHighlight.length >= 1, 'At least one excerpt should have **auth-api** in highlighted (real queryGrep)');

  // Also verify contextStart and contextEnd (fields only present in real queryGrep)
  const hasContextBounds = result.excerpts.every(e =>
    typeof e.contextStart === 'number' && typeof e.contextEnd === 'number'
  );
  assert.ok(hasContextBounds, 'All excerpts should have contextStart and contextEnd from real queryGrep');
});

test('searchGrep path filtering works via queryGrep delegation', () => {
  const controller = createAgentMemoryController();
  const documents = makeDocuments();

  const result = controller.searchGrep({
    documents,
    paths: ['docs/*'],
    pattern: 'auth',
    maxMatches: 25,
  });

  assert.ok(result.totalMatches >= 1, 'Should find auth in docs/');
  assert.ok(
    result.excerpts.every(e => e.path.startsWith('docs/')),
    'All excerpts should be from docs/ via queryGrep path filter'
  );
});
