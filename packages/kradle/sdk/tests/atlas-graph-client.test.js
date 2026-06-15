import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STACK_LAYERS,
  COMPOSITION_FACETS,
  ALL_LAYER_DEFS,
  fetchAtlasRecordsByKinds,
  searchAtlasGraph,
} from '../src/atlas-graph-client.js';

// ---------------------------------------------------------------------------
// Layer / facet definition tests
// ---------------------------------------------------------------------------

test('STACK_LAYERS has exactly 6 entries', () => {
  assert.equal(STACK_LAYERS.length, 6);
});

test('COMPOSITION_FACETS has exactly 2 entries', () => {
  assert.equal(COMPOSITION_FACETS.length, 2);
});

test('ALL_LAYER_DEFS combines layers and facets (8 total)', () => {
  assert.equal(ALL_LAYER_DEFS.length, 8);
});

test('each stack layer has key, label, position, and atlasKinds array', () => {
  for (const layer of STACK_LAYERS) {
    assert.ok(layer.key, `layer missing key`);
    assert.ok(layer.label, `layer ${layer.key} missing label`);
    assert.equal(typeof layer.position, 'number', `layer ${layer.key} missing position`);
    assert.ok(Array.isArray(layer.atlasKinds), `layer ${layer.key} atlasKinds is not an array`);
    assert.ok(layer.atlasKinds.length > 0, `layer ${layer.key} atlasKinds is empty`);
  }
});

test('each composition facet has key, label, and atlasKinds array', () => {
  for (const facet of COMPOSITION_FACETS) {
    assert.ok(facet.key, `facet missing key`);
    assert.ok(facet.label, `facet ${facet.key} missing label`);
    assert.ok(Array.isArray(facet.atlasKinds), `facet ${facet.key} atlasKinds is not an array`);
    assert.ok(facet.atlasKinds.length > 0, `facet ${facet.key} atlasKinds is empty`);
  }
});

test('stack layer positions are sequential 1-6', () => {
  const positions = STACK_LAYERS.map((l) => l.position).sort((a, b) => a - b);
  assert.deepEqual(positions, [1, 2, 3, 4, 5, 6]);
});

test('layer keys are unique', () => {
  const keys = ALL_LAYER_DEFS.map((d) => d.key);
  const unique = new Set(keys);
  assert.equal(unique.size, keys.length, 'duplicate layer keys found');
});

test('layer 1 (Model) has expected atlasKinds', () => {
  const modelLayer = STACK_LAYERS.find((l) => l.key === 'layer:1-model');
  assert.ok(modelLayer);
  assert.ok(modelLayer.atlasKinds.includes('ModelFamily'));
  assert.ok(modelLayer.atlasKinds.includes('ModelVersion'));
  assert.ok(modelLayer.atlasKinds.includes('SessionModel'));
});

test('facet:agent-role has expected atlasKinds', () => {
  const facet = COMPOSITION_FACETS.find((f) => f.key === 'facet:agent-role');
  assert.ok(facet);
  assert.ok(facet.atlasKinds.includes('Role'));
  assert.ok(facet.atlasKinds.includes('AgentTeam'));
});

test('layer:4-platform replaces old core/runtime/platform layers', () => {
  const platform = STACK_LAYERS.find((l) => l.key === 'layer:4-platform');
  assert.ok(platform);
  assert.ok(platform.atlasKinds.includes('AgentProduct'));
  assert.ok(platform.atlasKinds.includes('AgentRuntimeImpl'));
  assert.ok(platform.atlasKinds.includes('AgentPlatformImpl'));
  assert.ok(platform.atlasKinds.includes('AgentCoreImpl'));
  assert.equal(platform.label, 'Platform');
});

test('execution, sandbox, presentation, workspace, interaction layers removed', () => {
  assert.ok(!STACK_LAYERS.find((l) => l.key === 'layer:8-execution'));
  assert.ok(!STACK_LAYERS.find((l) => l.key === 'layer:9-sandbox'));
  assert.ok(!STACK_LAYERS.find((l) => l.key === 'layer:11-presentation'));
  assert.ok(!STACK_LAYERS.find((l) => l.key === 'layer:5-workspace'));
  assert.ok(!STACK_LAYERS.find((l) => l.key === 'layer:6-interaction'));
});

test('layer:5-tools has expected atlasKinds', () => {
  const toolsLayer = STACK_LAYERS.find((l) => l.key === 'layer:5-tools');
  assert.ok(toolsLayer);
  assert.equal(toolsLayer.label, 'Tools');
  assert.equal(toolsLayer.position, 5);
  assert.ok(toolsLayer.atlasKinds.includes('Tool'));
  assert.ok(toolsLayer.atlasKinds.includes('ToolDescriptor'));
  assert.ok(toolsLayer.atlasKinds.includes('ToolServer'));
  assert.ok(toolsLayer.atlasKinds.includes('MCPPrompt'));
  assert.ok(toolsLayer.atlasKinds.includes('MCPResource'));
});

test('layer:6-plugins has expected atlasKinds', () => {
  const pluginsLayer = STACK_LAYERS.find((l) => l.key === 'layer:6-plugins');
  assert.ok(pluginsLayer);
  assert.equal(pluginsLayer.label, 'Plugins');
  assert.equal(pluginsLayer.position, 6);
  assert.ok(pluginsLayer.atlasKinds.includes('PluginArtifact'));
  assert.ok(pluginsLayer.atlasKinds.includes('Plugin'));
  assert.ok(pluginsLayer.atlasKinds.includes('PluginCommand'));
  assert.ok(pluginsLayer.atlasKinds.includes('PluginSkill'));
  assert.ok(pluginsLayer.atlasKinds.includes('PluginHook'));
});

test('facet:environment-and-data has been removed', () => {
  assert.ok(!COMPOSITION_FACETS.find((f) => f.key === 'facet:environment-and-data'));
});

// ---------------------------------------------------------------------------
// fetchAtlasRecordsByKinds tests (with mock fetch)
// ---------------------------------------------------------------------------

test('fetchAtlasRecordsByKinds fetches records for each kind', async () => {
  const calls = [];
  const mockFetch = async (url) => {
    calls.push(url);
    const kind = url.includes('/ModelFamily') ? 'ModelFamily' : 'ModelVersion';
    return {
      ok: true,
      json: async () => ({
        instances: [
          { id: `${kind.toLowerCase()}-1`, displayName: `${kind} One` },
          { id: `${kind.toLowerCase()}-2`, displayName: `${kind} Two` },
        ],
        cluster: 'test-cluster',
      }),
    };
  };

  const results = await fetchAtlasRecordsByKinds(
    'https://atlas.example.com',
    ['ModelFamily', 'ModelVersion'],
    { fetch: mockFetch },
  );

  assert.equal(calls.length, 2);
  assert.equal(results.length, 4);
  assert.ok(results.some((r) => r.nodeKind === 'ModelFamily'));
  assert.ok(results.some((r) => r.nodeKind === 'ModelVersion'));
  assert.equal(results[0].cluster, 'test-cluster');
});

test('fetchAtlasRecordsByKinds handles non-ok responses gracefully', async () => {
  const mockFetch = async () => ({ ok: false, json: async () => ({}) });

  const results = await fetchAtlasRecordsByKinds(
    'https://atlas.example.com',
    ['ModelFamily'],
    { fetch: mockFetch },
  );

  assert.equal(results.length, 0);
});

test('fetchAtlasRecordsByKinds strips trailing slash from base URL', async () => {
  const calls = [];
  const mockFetch = async (url) => {
    calls.push(url);
    return { ok: true, json: async () => ({ instances: [] }) };
  };

  await fetchAtlasRecordsByKinds('https://atlas.example.com/', ['ModelFamily'], { fetch: mockFetch });
  assert.ok(calls[0].startsWith('https://atlas.example.com/api/'));
  assert.ok(!calls[0].includes('//api'));
});

// ---------------------------------------------------------------------------
// searchAtlasGraph tests (with mock fetch)
// ---------------------------------------------------------------------------

test('searchAtlasGraph performs single-kind search', async () => {
  const calls = [];
  const mockFetch = async (url) => {
    calls.push(url);
    return {
      ok: true,
      json: async () => ({
        total: 1,
        hits: [{ id: 'rec-1', nodeKind: 'ModelFamily', displayName: 'GPT-4', cluster: 'models', score: 0.1, snippet: 'Large model' }],
      }),
    };
  };

  const result = await searchAtlasGraph('https://atlas.example.com', 'gpt', { kind: 'ModelFamily', fetch: mockFetch });
  assert.equal(result.total, 1);
  assert.equal(result.hits[0].id, 'rec-1');
  assert.equal(calls.length, 1);
  assert.ok(calls[0].includes('q=gpt'));
  assert.ok(calls[0].includes('kind=ModelFamily'));
});

test('searchAtlasGraph performs multi-kind search and deduplicates', async () => {
  const mockFetch = async (url) => {
    const kind = url.includes('kind=ModelFamily') ? 'ModelFamily' : 'ModelVersion';
    return {
      ok: true,
      json: async () => ({
        total: 2,
        hits: [
          { id: 'shared', nodeKind: kind, displayName: 'Shared', score: 0.2, snippet: '' },
          { id: `unique-${kind}`, nodeKind: kind, displayName: `Unique ${kind}`, score: 0.3, snippet: '' },
        ],
      }),
    };
  };

  const result = await searchAtlasGraph('https://atlas.example.com', 'test', {
    kinds: ['ModelFamily', 'ModelVersion'],
    fetch: mockFetch,
  });

  // 'shared' appears in both kind results but should be deduplicated
  const ids = result.hits.map((h) => h.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicates should be removed');
  assert.equal(result.hits.length, 3); // shared + unique-ModelFamily + unique-ModelVersion
});

test('searchAtlasGraph handles non-ok responses gracefully', async () => {
  const mockFetch = async () => ({ ok: false });

  const result = await searchAtlasGraph('https://atlas.example.com', 'test', { fetch: mockFetch });
  assert.equal(result.total, 0);
  assert.deepEqual(result.hits, []);
});

test('searchAtlasGraph multi-kind handles partial failures', async () => {
  let callCount = 0;
  const mockFetch = async () => {
    callCount++;
    if (callCount === 1) return { ok: false };
    return {
      ok: true,
      json: async () => ({
        total: 1,
        hits: [{ id: 'hit-1', nodeKind: 'Provider', displayName: 'Anthropic', score: 0.1, snippet: '' }],
      }),
    };
  };

  const result = await searchAtlasGraph('https://atlas.example.com', 'test', {
    kinds: ['ModelFamily', 'Provider'],
    fetch: mockFetch,
  });

  assert.equal(result.hits.length, 1);
  assert.equal(result.hits[0].id, 'hit-1');
});
