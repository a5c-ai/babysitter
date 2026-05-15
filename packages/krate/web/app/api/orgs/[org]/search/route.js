import { createKrateApiController, orgNamespaceName } from '@a5c-ai/krate-sdk';

export const dynamic = 'force-dynamic';

const RESOURCE_KINDS = [
  { kind: 'AgentStack', hrefFn: (name) => `/agents/stacks/${name}` },
  { kind: 'KrateProject', hrefFn: (name) => `/agents/projects/${name}` },
  { kind: 'Repository', hrefFn: (name) => `/repositories/${name}/code` },
  { kind: 'AgentDispatchRun', hrefFn: (name) => `/agents/runs/${name}` },
  { kind: 'AgentChatSession', hrefFn: (name) => `/agents/sessions/${name}` },
  { kind: 'AgentApproval', hrefFn: () => `/agents/approvals` },
  { kind: 'TriggerRule', hrefFn: (name) => `/agents/rules/${name}` },
];

function getRelevance(name, displayName, q) {
  const lq = q.toLowerCase();
  const lname = (name || '').toLowerCase();
  const ldisplay = (displayName || '').toLowerCase();
  if (lname.startsWith(lq) || ldisplay.startsWith(lq)) return 2;
  if (lname.includes(lq) || ldisplay.includes(lq)) return 1;
  return 0;
}

export async function GET(request, { params }) {
  const { org } = await params;
  const namespace = orgNamespaceName(org);
  const controller = createKrateApiController({ namespace });
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);

  if (q.length < 2) {
    return Response.json({ results: [], query: q, total: 0 }, { headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    const allResults = [];

    for (const { kind, hrefFn } of RESOURCE_KINDS) {
      try {
        const list = await controller.listResource(kind);
        const items = Array.isArray(list) ? list : (list?.items || []);
        for (const item of items) {
          const name = item?.metadata?.name || '';
          const displayName = item?.spec?.displayName || item?.metadata?.labels?.['krate.a5c.ai/display-name'] || name;
          const relevance = getRelevance(name, displayName, q);
          if (relevance > 0) {
            allResults.push({ kind, name, displayName, href: hrefFn(name), relevance });
          }
        }
      } catch {
        // Skip kinds that don't exist or fail
      }
    }

    allResults.sort((a, b) => {
      if (b.relevance !== a.relevance) return b.relevance - a.relevance;
      return a.name.localeCompare(b.name);
    });

    const results = allResults.slice(0, limit);

    return Response.json(
      { results, query: q, total: results.length },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return Response.json(
      { error: 'search_failed', message: error.message },
      { status: 500 }
    );
  }
}
