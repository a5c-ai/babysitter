/**
 * Atlas graph client for the krate AgentStack builder.
 *
 * Fetches Atlas knowledge-graph records filtered by NodeKind so each
 * stack-builder layer can present selectable options sourced from the
 * live Atlas catalog instead of hardcoded dropdowns.
 */

// ---------------------------------------------------------------------------
// Stack layer & composition facet definitions
// Mirrors packages/atlas/webui/lib/server/company-builder-v2.ts
// ---------------------------------------------------------------------------

export const STACK_LAYERS = [
  { key: 'layer:1-model', label: 'Model', kind: 'stack-layer', position: 1, atlasKinds: ['ModelFamily', 'ModelVersion', 'SessionModel'] },
  { key: 'layer:2-provider', label: 'Provider', kind: 'stack-layer', position: 2, atlasKinds: ['Provider', 'ModelProviderProduct', 'ModelProviderVersion'] },
  { key: 'layer:3-transport', label: 'Transport', kind: 'stack-layer', position: 3, atlasKinds: ['TransportProtocol', 'ModelTransportProtocol'] },
  { key: 'layer:4-agent-core', label: 'Agent Core', kind: 'stack-layer', position: 4, atlasKinds: ['AgentCoreImpl', 'Capability', 'CapabilitySupport'] },
  { key: 'layer:5-agent-runtime', label: 'Agent Runtime', kind: 'stack-layer', position: 5, atlasKinds: ['AgentProduct', 'AgentRuntimeImpl', 'AgentVersion', 'Subagent'] },
  { key: 'layer:6-agent-platform', label: 'Agent Platform', kind: 'stack-layer', position: 6, atlasKinds: ['AgentPlatformImpl', 'Platform', 'PlatformService'] },
  { key: 'layer:7-workspace', label: 'Workspace', kind: 'stack-layer', position: 7, atlasKinds: ['Workspace', 'Project', 'SharedContextSpec'] },
  { key: 'layer:8-execution', label: 'Execution', kind: 'stack-layer', position: 8, atlasKinds: ['Workflow', 'LibraryProcess', 'Phase', 'HookSurface'] },
  { key: 'layer:9-sandbox', label: 'Sandbox', kind: 'stack-layer', position: 9, atlasKinds: ['PermissionMode', 'DeploymentTarget'] },
  { key: 'layer:10-interaction', label: 'Interaction', kind: 'stack-layer', position: 10, atlasKinds: ['Tool', 'ToolDescriptor', 'ToolServer', 'PluginArtifact', 'MCPPrompt'] },
  { key: 'layer:11-presentation', label: 'Presentation', kind: 'stack-layer', position: 11, atlasKinds: ['AgentUIImpl', 'Page', 'APIEndpoint', 'Presentation'] },
];

export const COMPOSITION_FACETS = [
  { key: 'facet:roles-and-teams', label: 'Roles and Teams', kind: 'composition-facet', atlasKinds: ['Role', 'Responsibility', 'OrgUnit', 'AgentTeam'] },
  { key: 'facet:skills-and-capabilities', label: 'Skills and Capabilities', kind: 'composition-facet', atlasKinds: ['Skill', 'LibrarySkill', 'SkillArea', 'Capability'] },
  { key: 'facet:evaluation-and-governance', label: 'Evaluation and Governance', kind: 'composition-facet', atlasKinds: ['Benchmark', 'TestSet', 'EvalRun'] },
  { key: 'facet:environment-and-data', label: 'Environment and Data', kind: 'composition-facet', atlasKinds: ['StackPart', 'VectorStore', 'MemoryStore'] },
];

export const ALL_LAYER_DEFS = [...STACK_LAYERS, ...COMPOSITION_FACETS];

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

/**
 * Fetch Atlas records filtered by one or more NodeKinds.
 *
 * For each kind the function queries `/api/v1/kinds/{kind}` which returns
 * the full instance list for that NodeKind (paginated). Results across
 * kinds are merged into a flat array.
 *
 * @param {string} atlasBaseUrl - Base URL of the Atlas API (no trailing slash).
 * @param {string[]} kinds - NodeKind names to fetch (e.g. ['ModelFamily', 'ModelVersion']).
 * @param {object} [options]
 * @param {number} [options.limit=100] - Max records per kind.
 * @param {typeof globalThis.fetch} [options.fetch] - Custom fetch implementation (useful for tests).
 * @returns {Promise<Array<{id: string, nodeKind: string, displayName: string}>>}
 */
export async function fetchAtlasRecordsByKinds(atlasBaseUrl, kinds, options = {}) {
  const { limit = 100, fetch: fetchFn = globalThis.fetch } = options;
  const base = atlasBaseUrl.replace(/\/+$/, '');

  const requests = kinds.map(async (kind) => {
    const url = `${base}/api/v1/kinds/${encodeURIComponent(kind)}?limit=${limit}`;
    const res = await fetchFn(url);
    if (!res.ok) return [];
    const data = await res.json();
    const instances = data.instances || [];
    return instances.map((inst) => ({
      id: inst.id,
      nodeKind: kind,
      displayName: inst.displayName || inst.id,
      description: inst.description || '',
      cluster: data.cluster || null,
    }));
  });

  const results = await Promise.all(requests);
  return results.flat();
}

/**
 * Search Atlas records via full-text search, optionally filtered by kind.
 *
 * Uses the Atlas `/api/v1/search` endpoint which performs Fuse.js
 * full-text search across all records.
 *
 * @param {string} atlasBaseUrl - Base URL of the Atlas API.
 * @param {string} query - Search query string.
 * @param {object} [options]
 * @param {string} [options.kind] - Optional NodeKind filter.
 * @param {string[]} [options.kinds] - Multiple NodeKinds to search (runs one query per kind and merges).
 * @param {number} [options.limit=25] - Max results per kind query.
 * @param {typeof globalThis.fetch} [options.fetch] - Custom fetch implementation.
 * @returns {Promise<{total: number, hits: Array<{id: string, nodeKind: string, displayName: string, cluster: string, score: number, snippet: string}>}>}
 */
export async function searchAtlasGraph(atlasBaseUrl, query, options = {}) {
  const { kind, kinds, limit = 25, fetch: fetchFn = globalThis.fetch } = options;
  const base = atlasBaseUrl.replace(/\/+$/, '');

  // When multiple kinds are provided, run parallel searches per kind and merge.
  if (kinds && kinds.length > 0) {
    const searches = kinds.map(async (k) => {
      const url = new URL(`${base}/api/v1/search`);
      url.searchParams.set('q', query);
      url.searchParams.set('kind', k);
      url.searchParams.set('limit', String(limit));
      const res = await fetchFn(url.toString());
      if (!res.ok) return { total: 0, hits: [] };
      return res.json();
    });
    const results = await Promise.all(searches);
    const allHits = results.flatMap((r) => r.hits || []);
    // Sort by score (lower is better in Fuse.js) then deduplicate by id
    allHits.sort((a, b) => (a.score ?? 1) - (b.score ?? 1));
    const seen = new Set();
    const deduped = allHits.filter((h) => {
      if (seen.has(h.id)) return false;
      seen.add(h.id);
      return true;
    });
    return { total: deduped.length, hits: deduped };
  }

  // Single-kind or no-kind search
  const url = new URL(`${base}/api/v1/search`);
  url.searchParams.set('q', query);
  if (kind) url.searchParams.set('kind', kind);
  url.searchParams.set('limit', String(limit));
  const res = await fetchFn(url.toString());
  if (!res.ok) {
    return { total: 0, hits: [] };
  }
  return res.json();
}
