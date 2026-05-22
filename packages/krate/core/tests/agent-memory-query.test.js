/**
 * Tests for agent-memory-query.js — Memory Query Engine (Slice 2.3b)
 *
 * Covers:
 *  - queryGraph: nodeKind filtering, edge following (depth 1), relevance scoring, empty results, missing query
 *  - queryGrep: matching excerpts with path + lineNumber, highlight, context lines, empty results, empty query
 *  - queryMemory: combined mode, graph-only, grep-only, stats, invalid mode
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { queryGraph, queryGrep, queryMemory } from '../src/agent-memory-query.js';

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
      edges: [
        { target: 'infra/postgres-cluster', kind: 'depends-on' },
      ],
    },
    {
      id: 'team/platform',
      nodeKind: 'Team',
      attributes: { name: 'platform', lead: 'alice' },
      edges: [],
    },
    {
      id: 'infra/postgres-cluster',
      nodeKind: 'Infrastructure',
      attributes: { name: 'postgres-cluster', provider: 'aws' },
      edges: [],
    },
    {
      id: 'runbook/deploy-auth',
      nodeKind: 'Runbook',
      attributes: { name: 'deploy-auth', service: 'auth-api' },
      edges: [
        { target: 'service/auth-api', kind: 'references' },
      ],
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
      path: 'docs/runbooks/deploy.md',
      content: [
        'Step 1: Run the deploy script.',
        'Step 2: Verify health checks.',
        'Step 3: Monitor error rates.',
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
    {
      path: 'configs/prod.yaml',
      content: [
        'database:',
        '  host: prod-db.internal',
        '  port: 5432',
      ].join('\n'),
    },
  ];
}

// ---------------------------------------------------------------------------
// queryGraph tests
// ---------------------------------------------------------------------------

test('queryGraph returns matching records filtered by nodeKind', () => {
  const records = makeRecords();
  const result = queryGraph({ records, query: 'api', kinds: ['Service'] });

  assert.ok(result.matches.length > 0, 'Should have matches');
  assert.ok(result.matches.every(m => m.record.nodeKind === 'Service'), 'All matches must be Service');
  const authMatch = result.matches.find(m => m.record.id === 'service/auth-api');
  assert.ok(authMatch, 'Should include auth-api');
});

test('queryGraph returns no non-Service records when filtering by Service', () => {
  const records = makeRecords();
  // 'platform' appears in both Service and Team records
  const result = queryGraph({ records, query: 'platform', kinds: ['Service'] });

  const teamMatch = result.matches.find(m => m.record.nodeKind === 'Team');
  assert.equal(teamMatch, undefined, 'Should not include Team records when filtering by Service');
});

test('queryGraph follows edges to depth 1', () => {
  const records = makeRecords();
  const result = queryGraph({ records, query: 'auth-api', kinds: [], depth: 1 });

  const authMatch = result.matches.find(m => m.record.id === 'service/auth-api');
  assert.ok(authMatch, 'Should find auth-api record');

  const edgeTargets = authMatch.edges.map(e => e.target);
  assert.ok(edgeTargets.includes('service/user-db'), 'Depth-1 edges should include user-db');
  assert.ok(edgeTargets.includes('team/platform'), 'Depth-1 edges should include team/platform');
  // user-db's edge (postgres-cluster) should NOT appear at depth 1
  assert.ok(!edgeTargets.includes('infra/postgres-cluster'), 'Depth-1 should NOT include postgres-cluster');
});

test('queryGraph follows edges to depth 2 (transitive)', () => {
  const records = makeRecords();
  const result = queryGraph({ records, query: 'auth-api', kinds: [], depth: 2 });

  const authMatch = result.matches.find(m => m.record.id === 'service/auth-api');
  assert.ok(authMatch, 'Should find auth-api record');

  const edgeTargets = authMatch.edges.map(e => e.target);
  // At depth 2, user-db's dependency (postgres-cluster) should be reachable
  assert.ok(edgeTargets.includes('infra/postgres-cluster'), 'Depth-2 should include postgres-cluster');
});

test('queryGraph returns relevance scores: id match scores higher than attribute match', () => {
  const records = makeRecords();
  // 'auth-api' appears in the id of service/auth-api (score 2) and in the attributes of runbook/deploy-auth (score 1)
  const result = queryGraph({ records, query: 'auth-api', kinds: [] });

  const authApiMatch = result.matches.find(m => m.record.id === 'service/auth-api');
  const runbookMatch = result.matches.find(m => m.record.id === 'runbook/deploy-auth');

  assert.ok(authApiMatch, 'auth-api record should be in matches');
  assert.ok(runbookMatch, 'runbook record should be in matches (attribute match)');
  assert.equal(authApiMatch.score, 2, 'ID match should have score 2');
  assert.equal(runbookMatch.score, 1, 'Attribute match should have score 1');
  // Results should be sorted descending by score
  const scores = result.matches.map(m => m.score);
  for (let i = 1; i < scores.length; i++) {
    assert.ok(scores[i] <= scores[i - 1], 'Results should be sorted by descending score');
  }
});

test('queryGraph returns empty results for no matches', () => {
  const records = makeRecords();
  const result = queryGraph({ records, query: 'zzz-no-match-xyz', kinds: [] });

  assert.equal(result.totalMatches, 0);
  assert.deepEqual(result.matches, []);
});

test('queryGraph returns empty results when nodeKind filter matches nothing', () => {
  const records = makeRecords();
  const result = queryGraph({ records, query: 'auth', kinds: ['NonExistentKind'] });

  assert.equal(result.totalMatches, 0);
  assert.deepEqual(result.matches, []);
});

test('queryGraph rejects missing query text', () => {
  const records = makeRecords();
  assert.throws(
    () => queryGraph({ records }),
    /query text is required/,
    'Should throw when query is missing'
  );
});

test('queryGraph rejects empty string query', () => {
  const records = makeRecords();
  assert.throws(
    () => queryGraph({ records, query: '   ' }),
    /non-empty string/,
    'Should throw when query is whitespace-only'
  );
});

test('queryGraph uses flat edges array to supplement per-record edges', () => {
  const records = [
    { id: 'node/a', nodeKind: 'Service', attributes: { name: 'node-a' }, edges: [] },
    { id: 'node/b', nodeKind: 'Service', attributes: { name: 'node-b' }, edges: [] },
  ];
  const flatEdges = [{ source: 'node/a', target: 'node/b', kind: 'calls' }];

  const result = queryGraph({ records, edges: flatEdges, query: 'node-a', kinds: [], depth: 1 });
  const matchA = result.matches.find(m => m.record.id === 'node/a');
  assert.ok(matchA, 'Should match node/a');
  const edgeTargets = matchA.edges.map(e => e.target);
  assert.ok(edgeTargets.includes('node/b'), 'Flat edge should be followed');
});

// ---------------------------------------------------------------------------
// queryGrep tests
// ---------------------------------------------------------------------------

test('queryGrep returns matching excerpts with file path and line number', () => {
  const documents = makeDocuments();
  const result = queryGrep({ documents, query: 'auth-api' });

  assert.ok(result.totalMatches > 0, 'Should find matches for auth-api');
  for (const excerpt of result.excerpts) {
    assert.ok(typeof excerpt.path === 'string' && excerpt.path.length > 0, 'Each excerpt must have a path');
    assert.ok(typeof excerpt.lineNumber === 'number' && excerpt.lineNumber >= 1, 'Each excerpt must have a lineNumber >= 1');
  }
});

test('queryGrep highlights matched text with ** markers', () => {
  const documents = makeDocuments();
  const result = queryGrep({ documents, query: 'auth-api' });

  assert.ok(result.excerpts.length > 0, 'Should have excerpts');
  const withHighlight = result.excerpts.filter(e => e.highlighted.includes('**auth-api**'));
  assert.ok(withHighlight.length > 0, 'At least one excerpt should have highlighted match with ** markers');
});

test('queryGrep returns context lines around matches', () => {
  const documents = makeDocuments();
  const result = queryGrep({ documents, query: 'JWT', context: 1 });

  assert.ok(result.excerpts.length > 0, 'Should find JWT');
  // "JWT tokens" is on line 2 of docs/architecture.md; context of 1 means lines 1–3
  const archExcerpt = result.excerpts.find(e => e.path === 'docs/architecture.md');
  assert.ok(archExcerpt, 'Should have a match in architecture.md');
  assert.ok(archExcerpt.context.includes('auth-api') || archExcerpt.context.includes('user-db'),
    'Context should include adjacent lines');
});

test('queryGrep returns empty for no matches', () => {
  const documents = makeDocuments();
  const result = queryGrep({ documents, query: 'zzz-no-such-term-xyz' });

  assert.equal(result.totalMatches, 0);
  assert.deepEqual(result.excerpts, []);
});

test('queryGrep rejects empty query', () => {
  const documents = makeDocuments();
  assert.throws(
    () => queryGrep({ documents, query: '' }),
    /non-empty string/,
    'Should throw for empty query string'
  );
});

test('queryGrep rejects missing query', () => {
  const documents = makeDocuments();
  assert.throws(
    () => queryGrep({ documents }),
    /query text is required/,
    'Should throw when query is missing'
  );
});

test('queryGrep respects maxMatches cap', () => {
  const documents = makeDocuments();
  const result = queryGrep({ documents, query: 'e', maxMatches: 3 });

  assert.ok(result.excerpts.length <= 3, 'Should not exceed maxMatches');
  assert.ok(result.totalMatches <= 3, 'totalMatches should not exceed maxMatches');
});

test('queryGrep filters documents by path glob', () => {
  const documents = makeDocuments();
  const result = queryGrep({ documents, query: 'auth', paths: ['docs/*'] });

  assert.ok(result.totalMatches > 0, 'Should find auth in docs/');
  for (const excerpt of result.excerpts) {
    assert.ok(excerpt.path.startsWith('docs/'), 'All excerpts must come from docs/ paths');
  }
  // src/auth/handler.ts should NOT appear because paths filter is docs/*
  const srcMatch = result.excerpts.find(e => e.path.startsWith('src/'));
  assert.equal(srcMatch, undefined, 'src/ files should be excluded by path filter');
});

// ---------------------------------------------------------------------------
// queryMemory combined tests
// ---------------------------------------------------------------------------

test('queryMemory with mode graph-and-grep returns both result types', () => {
  const records = makeRecords();
  const documents = makeDocuments();
  const result = queryMemory({ query: 'auth-api', mode: 'graph-and-grep', records, documents });

  assert.ok(result.graph !== null, 'graph results should be present');
  assert.ok(result.grep !== null, 'grep results should be present');
  assert.ok(result.graph.totalMatches >= 0, 'graph.totalMatches should be a number');
  assert.ok(result.grep.totalMatches >= 0, 'grep.totalMatches should be a number');
});

test('queryMemory with mode graph-only returns only graph results', () => {
  const records = makeRecords();
  const result = queryMemory({ query: 'auth-api', mode: 'graph-only', records });

  assert.ok(result.graph !== null, 'graph results should be present');
  assert.equal(result.grep, null, 'grep results should be null in graph-only mode');
});

test('queryMemory with mode grep-only returns only grep results', () => {
  const documents = makeDocuments();
  const result = queryMemory({ query: 'auth-api', mode: 'grep-only', documents });

  assert.equal(result.graph, null, 'graph results should be null in grep-only mode');
  assert.ok(result.grep !== null, 'grep results should be present');
});

test('queryMemory returns stats with totalMatches, graphCount, grepCount', () => {
  const records = makeRecords();
  const documents = makeDocuments();
  const result = queryMemory({ query: 'auth-api', mode: 'graph-and-grep', records, documents });

  assert.ok('stats' in result, 'result should have stats property');
  const { stats } = result;
  assert.ok(typeof stats.totalMatches === 'number', 'stats.totalMatches must be a number');
  assert.ok(typeof stats.graphCount === 'number', 'stats.graphCount must be a number');
  assert.ok(typeof stats.grepCount === 'number', 'stats.grepCount must be a number');
  assert.equal(stats.totalMatches, stats.graphCount + stats.grepCount, 'totalMatches = graphCount + grepCount');
  assert.equal(stats.mode, 'graph-and-grep', 'stats.mode should reflect the requested mode');
});

test('queryMemory returns zero counts for grep in graph-only mode', () => {
  const records = makeRecords();
  const result = queryMemory({ query: 'auth-api', mode: 'graph-only', records });

  assert.equal(result.stats.grepCount, 0, 'grepCount should be 0 in graph-only mode');
  assert.equal(result.stats.totalMatches, result.stats.graphCount, 'totalMatches equals graphCount in graph-only');
});

test('queryMemory rejects invalid mode', () => {
  assert.throws(
    () => queryMemory({ query: 'auth', mode: 'invalid-mode' }),
    /invalid mode/,
    'Should throw for unrecognized mode'
  );
});

test('queryMemory rejects missing query', () => {
  assert.throws(
    () => queryMemory({ mode: 'graph-only', records: [] }),
    /query text is required/,
    'Should throw when query is missing'
  );
});

test('queryMemory default mode is graph-and-grep', () => {
  const records = makeRecords();
  const documents = makeDocuments();
  // No mode specified — should default to graph-and-grep
  const result = queryMemory({ query: 'auth-api', records, documents });

  assert.equal(result.stats.mode, 'graph-and-grep', 'Default mode should be graph-and-grep');
  assert.ok(result.graph !== null, 'graph results should be present by default');
  assert.ok(result.grep !== null, 'grep results should be present by default');
});

test('queryMemory passes graphOptions through to queryGraph', () => {
  const records = makeRecords();
  // Only 'Team' nodeKind, querying 'platform' which matches team/platform by id
  const result = queryMemory({
    query: 'platform',
    mode: 'graph-only',
    records,
    graphOptions: { kinds: ['Team'] },
  });

  assert.ok(result.graph.totalMatches >= 1, 'Should find platform team');
  assert.ok(result.graph.matches.every(m => m.record.nodeKind === 'Team'), 'All graph results should be Team');
});

test('queryMemory passes grepOptions through to queryGrep', () => {
  const documents = makeDocuments();
  const result = queryMemory({
    query: 'auth',
    mode: 'grep-only',
    documents,
    grepOptions: { paths: ['src/*'], maxMatches: 5 },
  });

  assert.ok(result.grep !== null, 'grep results should be present');
  for (const excerpt of result.grep.excerpts) {
    assert.ok(excerpt.path.startsWith('src/'), 'All grep results should be in src/ due to path filter');
  }
});
