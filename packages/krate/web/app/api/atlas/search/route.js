/**
 * Atlas API proxy route.
 *
 * Forwards search and browse queries to the Atlas catalog API,
 * avoiding CORS issues when the krate web UI runs on a different origin.
 *
 * Query parameters:
 *   q     - full-text search query (optional; when absent, browse mode)
 *   kinds - comma-separated NodeKind names to filter (optional)
 *   mode  - "browse" to fetch kind instances instead of searching (optional)
 *   limit - max results (default 25 for search, 100 for browse)
 */

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') || '').trim();
  const kinds = (url.searchParams.get('kinds') || '').trim();
  const mode = url.searchParams.get('mode') || '';
  const limit = url.searchParams.get('limit') || '';
  const atlasUrl = process.env.ATLAS_BASE_URL || 'https://atlas-staging.a5c.ai';

  try {
    // Browse mode: fetch instances by kind (no search query needed)
    if (mode === 'browse' || (!query && kinds)) {
      const kindList = kinds.split(',').map((k) => k.trim()).filter(Boolean);
      const browseLimit = limit || '100';

      const requests = kindList.map(async (kind) => {
        const target = new URL(`/api/v1/kinds/${encodeURIComponent(kind)}`, atlasUrl);
        target.searchParams.set('limit', browseLimit);
        const res = await fetch(target.toString());
        if (!res.ok) return [];
        const data = await res.json();
        return (data.instances || []).map((inst) => ({
          id: inst.id,
          nodeKind: kind,
          displayName: inst.displayName || inst.id,
          snippet: '',
          cluster: data.cluster || null,
          score: 0,
        }));
      });

      const results = await Promise.all(requests);
      const hits = results.flat();
      return Response.json({ total: hits.length, hits });
    }

    // Search mode: query Atlas full-text search, optionally filtered per kind
    if (!query) {
      return Response.json({ total: 0, hits: [] });
    }

    const kindList = kinds ? kinds.split(',').map((k) => k.trim()).filter(Boolean) : [];
    const searchLimit = limit || '25';

    if (kindList.length > 0) {
      // Search per-kind and merge
      const requests = kindList.map(async (kind) => {
        const target = new URL('/api/v1/search', atlasUrl);
        target.searchParams.set('q', query);
        target.searchParams.set('kind', kind);
        target.searchParams.set('limit', searchLimit);
        const res = await fetch(target.toString());
        if (!res.ok) return { total: 0, hits: [] };
        return res.json();
      });

      const results = await Promise.all(requests);
      const allHits = results.flatMap((r) => r.hits || []);
      // Sort by score (lower is better in Fuse.js) and deduplicate
      allHits.sort((a, b) => (a.score ?? 1) - (b.score ?? 1));
      const seen = new Set();
      const deduped = allHits.filter((h) => {
        if (seen.has(h.id)) return false;
        seen.add(h.id);
        return true;
      });
      return Response.json({ total: deduped.length, hits: deduped });
    }

    // No kind filter, simple search
    const target = new URL('/api/v1/search', atlasUrl);
    target.searchParams.set('q', query);
    target.searchParams.set('limit', searchLimit);
    const res = await fetch(target.toString());
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return Response.json({ total: 0, hits: [], error: err.message }, { status: 502 });
  }
}
