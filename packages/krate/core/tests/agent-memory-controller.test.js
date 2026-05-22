import assert from 'node:assert/strict';
import test from 'node:test';
import { createAgentMemoryController } from '../src/agent-memory-controller.js';

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
    { path: 'docs/architecture.md', content: 'The auth-api service handles authentication.\nIt uses JWT tokens for session management.\nThe service connects to user-db for persistence.' },
    { path: 'docs/runbooks/deploy.md', content: 'Step 1: Run the deploy script.\nStep 2: Verify health checks.\nStep 3: Monitor error rates.' },
    { path: 'src/auth/handler.ts', content: 'export function handleAuth(req) {\n  const token = req.headers.authorization;\n  return validateToken(token);\n}' },
    { path: 'configs/prod.yaml', content: 'database:\n  host: prod-db.internal\n  port: 5432\n  password: [redacted]' },
  ];
}

test('createMemorySnapshot creates valid resource with digests', () => {
  const controller = createAgentMemoryController();
  const records = makeRecords();
  const documents = makeDocuments();

  const snapshot = controller.createMemorySnapshot({
    memoryRepository: 'company-brain',
    requestedRef: 'main',
    resolvedCommit: 'abc123def456',
    queryManifest: { include: ['Service', 'Team'] },
    selectedRecords: records,
    selectedDocuments: documents,
    ontologyDigest: 'onto-digest-1',
    namespace: 'krate-org-default',
    organizationRef: 'acme',
  });

  assert.equal(snapshot.kind, 'AgentMemorySnapshot');
  assert.ok(snapshot.metadata.name.startsWith('memsnapshot-'));
  assert.equal(snapshot.spec.memoryRepository, 'company-brain');
  assert.equal(snapshot.spec.requestedRef, 'main');
  assert.equal(snapshot.spec.resolvedCommit, 'abc123def456');
  assert.ok(snapshot.spec.queryManifestDigest, 'Should have queryManifestDigest');
  assert.ok(snapshot.spec.selectedRecordsDigest, 'Should have selectedRecordsDigest');
  assert.ok(snapshot.spec.selectedDocumentsDigest, 'Should have selectedDocumentsDigest');
  assert.equal(snapshot.spec.ontologyDigest, 'onto-digest-1');
  assert.equal(snapshot.spec.recordCount, records.length);
  assert.equal(snapshot.spec.documentCount, documents.length);
  assert.equal(snapshot.status.phase, 'Pinned');
});

test('searchGraph filters by node kind', () => {
  const controller = createAgentMemoryController();
  const records = makeRecords();

  const result = controller.searchGraph({ records, kinds: ['Service'], query: '' });

  assert.equal(result.totalMatches, 2, 'Should match exactly 2 Service records');
  assert.ok(result.matches.every(m => m.record.nodeKind === 'Service'));
});

test('searchGraph matches query text', () => {
  const controller = createAgentMemoryController();
  const records = makeRecords();

  const result = controller.searchGraph({ records, kinds: [], query: 'auth' });

  assert.ok(result.totalMatches >= 1, 'Should match at least auth-api');
  const authMatch = result.matches.find(m => m.record.id === 'service/auth-api');
  assert.ok(authMatch, 'Should include auth-api in matches');
  assert.equal(authMatch.score, 2, 'ID match should score 2');
});

test('searchGraph respects edgeDepth', () => {
  const controller = createAgentMemoryController();
  const records = makeRecords();

  // edgeDepth=1: from auth-api should reach user-db and team/platform but NOT postgres-cluster
  const depth1 = controller.searchGraph({ records, kinds: ['Service'], query: 'auth-api', edgeDepth: 1 });
  const authMatch1 = depth1.matches.find(m => m.record.id === 'service/auth-api');
  assert.ok(authMatch1, 'Should find auth-api');
  const depth1Targets = authMatch1.edges.map(e => e.target);
  assert.ok(depth1Targets.includes('service/user-db'), 'Depth 1 should include user-db');
  assert.ok(!depth1Targets.includes('infra/postgres-cluster'), 'Depth 1 should NOT include postgres-cluster');

  // edgeDepth=2: should also reach postgres-cluster
  const depth2 = controller.searchGraph({ records, kinds: ['Service'], query: 'auth-api', edgeDepth: 2 });
  const authMatch2 = depth2.matches.find(m => m.record.id === 'service/auth-api');
  const depth2Targets = authMatch2.edges.map(e => e.target);
  assert.ok(depth2Targets.includes('infra/postgres-cluster'), 'Depth 2 should include postgres-cluster');
});

test('searchGrep finds pattern matches', () => {
  const controller = createAgentMemoryController();
  const documents = makeDocuments();

  const result = controller.searchGrep({ documents, pattern: 'auth', maxMatches: 25 });

  assert.ok(result.totalMatches >= 1, 'Should find auth pattern');
  assert.ok(result.excerpts.some(e => e.path === 'docs/architecture.md'), 'Should match in architecture.md');
  assert.ok(result.excerpts.every(e => e.lineNumber > 0), 'Every excerpt should have a lineNumber');
  assert.ok(result.excerpts.every(e => typeof e.context === 'string'), 'Every excerpt should have context');
});

test('searchGrep caps at maxMatches', () => {
  const controller = createAgentMemoryController();
  const documents = makeDocuments();

  const result = controller.searchGrep({ documents, pattern: 'the', maxMatches: 2 });

  assert.ok(result.totalMatches <= 2, 'Should not exceed maxMatches');
  assert.ok(result.excerpts.length <= 2, 'Excerpts length should not exceed maxMatches');
});

test('searchGrep filters by path patterns', () => {
  const controller = createAgentMemoryController();
  const documents = makeDocuments();

  const result = controller.searchGrep({ documents, paths: ['docs/*'], pattern: 'deploy' });

  assert.ok(result.totalMatches >= 1, 'Should find deploy in docs');
  assert.ok(result.excerpts.every(e => e.path.startsWith('docs/')), 'All matches should be in docs/');
});

test('resolveTimeTravel mode=current returns latest commit', () => {
  const controller = createAgentMemoryController();
  const commits = [
    { sha: 'latest-sha', timestamp: '2026-05-10T10:00:00Z' },
    { sha: 'older-sha', timestamp: '2026-05-09T10:00:00Z' },
  ];

  const result = controller.resolveTimeTravel({ mode: 'current', commits });

  assert.equal(result.resolvedCommit, 'latest-sha');
  assert.equal(result.mode, 'current');
  assert.ok(result.resolvedAt);
});

test('resolveTimeTravel mode=ref-at-time finds correct commit', () => {
  const controller = createAgentMemoryController();
  const commits = [
    { sha: 'c3', timestamp: '2026-05-10T10:00:00Z' },
    { sha: 'c2', timestamp: '2026-05-08T10:00:00Z' },
    { sha: 'c1', timestamp: '2026-05-05T10:00:00Z' },
  ];

  const result = controller.resolveTimeTravel({
    mode: 'ref-at-time',
    requestedTime: '2026-05-09T00:00:00Z',
    commits,
  });

  assert.equal(result.resolvedCommit, 'c2', 'Should resolve to c2 (latest before requested time)');
  assert.equal(result.mode, 'ref-at-time');
  assert.ok(result.staleBy !== null, 'staleBy should be set');
});

test('scanForRedaction catches API keys', () => {
  const controller = createAgentMemoryController();
  const content = 'API_KEY = sk-test1234567890abcdefghij\nSome normal text\nSECRET_KEY=my-super-secret-value';

  const result = controller.scanForRedaction(content);

  assert.equal(result.clean, false, 'Content should not be clean');
  assert.ok(result.redactionCount > 0, 'Should have redactions');
  assert.ok(result.redactionsByKind['secret-key'] > 0, 'Should catch secret-key pattern');
  assert.ok(result.redactedContent.includes('[REDACTED:'), 'Redacted content should have markers');
  assert.ok(!result.redactedContent.includes('my-super-secret-value'), 'Secret should be redacted');
});

test('scanForRedaction catches provider tokens', () => {
  const controller = createAgentMemoryController();
  const content = 'token: ghp_abcdefghijklmnopqrstuvwxyz1234567890\nslack: xoxb-123-456-abcdefghij';

  const result = controller.scanForRedaction(content);

  assert.equal(result.clean, false);
  assert.ok(result.redactionsByKind['provider-token'] > 0, 'Should catch provider-token pattern');
});

test('validateOntology catches missing required fields', () => {
  const controller = createAgentMemoryController();
  const records = [
    { id: 'svc/a', nodeKind: 'Service', attributes: { name: 'a' }, edges: [] },
    { id: 'svc/b', nodeKind: 'Service', attributes: { name: 'b', language: 'go' }, edges: [] },
  ];
  const ontology = {
    requiredFields: { Service: ['name', 'language', 'team'] },
    allowedEdgeKinds: ['depends-on', 'owned-by'],
  };

  const result = controller.validateOntology({ records, ontology });

  assert.equal(result.valid, false, 'Should be invalid due to missing fields');
  assert.ok(result.errors.length >= 2, 'Should have errors for missing language and team on svc/a, and team on svc/b');
  const missingLang = result.errors.find(e => e.record === 'svc/a' && e.field === 'language');
  assert.ok(missingLang, 'Should report missing language on svc/a');
  const missingTeam = result.errors.find(e => e.record === 'svc/a' && e.field === 'team');
  assert.ok(missingTeam, 'Should report missing team on svc/a');
});

test('validateOntology passes valid records', () => {
  const controller = createAgentMemoryController();
  const records = [
    { id: 'svc/a', nodeKind: 'Service', attributes: { name: 'a', language: 'ts' }, edges: [{ target: 'svc/b', kind: 'depends-on' }] },
    { id: 'svc/b', nodeKind: 'Service', attributes: { name: 'b', language: 'go' }, edges: [] },
  ];
  const ontology = {
    requiredFields: { Service: ['name', 'language'] },
    allowedEdgeKinds: ['depends-on', 'owned-by'],
  };

  const result = controller.validateOntology({ records, ontology });

  assert.equal(result.valid, true, 'Should be valid');
  assert.equal(result.errors.length, 0);
});

test('createImport sets phase=Pending', () => {
  const controller = createAgentMemoryController();

  const importResource = controller.createImport({
    organizationRef: 'acme',
    memoryRepository: 'company-brain',
    source: 'babysitter-run/run-123',
    include: { kinds: ['decision', 'learning'] },
    validationPolicy: 'strict',
    namespace: 'krate-org-default',
  });

  assert.equal(importResource.kind, 'AgentRunMemoryImport');
  assert.ok(importResource.metadata.name.startsWith('memimport-'));
  assert.equal(importResource.status.phase, 'Pending');
  assert.equal(importResource.spec.memoryRepository, 'company-brain');
  assert.equal(importResource.spec.source, 'babysitter-run/run-123');
  assert.equal(importResource.spec.validationPolicy, 'strict');
});

test('processImport advances phases', () => {
  const controller = createAgentMemoryController();

  let importResource = controller.createImport({
    organizationRef: 'acme',
    memoryRepository: 'company-brain',
    source: 'run-1',
    include: { kinds: ['all'] },
    namespace: 'krate-org-default',
  });

  assert.equal(importResource.status.phase, 'Pending');

  // Pending -> Collecting
  importResource = controller.processImport({ importResource, content: 'some content' });
  assert.equal(importResource.status.phase, 'Collecting');

  // Collecting -> Redacting (triggers scanForRedaction)
  importResource = controller.processImport({ importResource, content: 'API_KEY=secret123' });
  assert.equal(importResource.status.phase, 'Redacting');
  assert.ok(importResource.status.redactionScan, 'Should have redaction scan result');
  assert.equal(importResource.status.redactionScan.clean, false, 'Should detect secret');

  // Redacting -> Normalizing
  importResource = controller.processImport({ importResource, content: 'normalized' });
  assert.equal(importResource.status.phase, 'Normalizing');

  // Normalizing -> Validating
  importResource = controller.processImport({ importResource, content: 'validated' });
  assert.equal(importResource.status.phase, 'Validating');

  // Validating -> AwaitingReview
  importResource = controller.processImport({ importResource, content: '' });
  assert.equal(importResource.status.phase, 'AwaitingReview');
});
