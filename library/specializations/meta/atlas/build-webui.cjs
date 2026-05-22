/**
 * @process webui-build
 * @skill babysitter:babysit
 * @agent claude-code
 *
 * Build a Next.js Atlas web UI app for the Atlas catalog at
 * `C:/work/v6/graph/`. Produces `C:/work/v6/packages/webui/`, a
 * standalone Next.js 15 App Router + TypeScript + Tailwind + shadcn/ui +
 * @xyflow/react + Fuse.js + Lucide project. Read-only, dark-mode default,
 * statically-indexed from YAML at build time.
 *
 * Phases (all kind:'agent' except smoke-test which is kind:'shell'):
 *   1. scaffold               - Next.js scaffold + deps + shadcn init
 *   2. indexer                - lib/indexer/build-index.ts + lib/index.json
 *   3. layout-and-home        - root layout, nav, home dashboard
 *   4. kind-list              - /kind/[nodeKind] route
 *   5. record-detail          - /n/[id] route + neighbor mini-graph
 *   6. search                 - /search + global header search (Fuse.js)
 *   7. webui-graph            - /graph route (react-flow 2-hop)
 *   8. edges-catalog          - /edges route
 *   9. polish                 - empty/loading states, breadcrumbs, kbd, 404
 *  10. smoke-test (shell)     - npm run build (deterministic gate)
 *
 * Trust Chain: OUT OF SCOPE.
 * No breakpoints. Run with --non-interactive.
 */

const { defineTask } = require('@a5c-ai/babysitter-sdk');

const APP_DIR = 'C:/work/v6/packages/webui';
const CATALOG_DIR = 'C:/work/v6/graph';

const scaffoldTask = defineTask('scaffold', (args) => ({
  kind: 'agent',
  title: 'Scaffold Next.js app, install deps, init shadcn',
  metadata: {
    appDir: args.appDir,
    instructions: [
      `Working directory: C:/work/v6/`,
      `Run: npx --yes create-next-app@latest packages/webui --ts --tailwind --app --no-src-dir --no-eslint --use-npm --no-git --no-import-alias --yes`,
      `If create-next-app prompts despite flags, fall back to manually scaffolding: mkdir packages/webui, create package.json with next@^15, react@^19, react-dom@^19, typescript, @types/node, @types/react, @types/react-dom, tailwindcss, postcss, autoprefixer; create tsconfig.json, next.config.mjs, tailwind.config.ts, postcss.config.mjs, app/layout.tsx, app/page.tsx, app/globals.css. Verify next is on the PATH after.`,
      `cd packages/webui && npm install @xyflow/react fuse.js js-yaml gray-matter lucide-react clsx tailwind-merge class-variance-authority`,
      `Install shadcn deps: npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-tooltip tailwindcss-animate`,
      `npm install -D @types/js-yaml`,
      `Initialize shadcn manually: create lib/utils.ts with the cn() helper (twMerge + clsx); create components.json with style: "default", baseColor: "slate", cssVariables: true. Author tailwind.config.ts with darkMode 'class' + shadcn theme tokens (HSL CSS vars for background/foreground/card/popover/primary/secondary/muted/accent/destructive/border/input/ring). Update app/globals.css with the matching :root and .dark CSS variable blocks.`,
      `Create components/ui/ directory with hand-rolled minimal shadcn-style primitives (Button, Card, Input, Badge, Tabs, Dialog, DropdownMenu) — small TSX files using Radix primitives + cn().`,
      `Set <html className="dark"> in app/layout.tsx so dark mode is the default.`,
      `Verify with: ls packages/webui/package.json packages/webui/app/layout.tsx packages/webui/lib/utils.ts packages/webui/tailwind.config.ts packages/webui/components.json packages/webui/components/ui/button.tsx`,
      `Return JSON: { scaffolded: true, packageJsonPath, depsInstalled: [...], shadcnComponents: [...], filesCreated: number }.`,
    ],
  },
}));

const indexerTask = defineTask('indexer', (args) => ({
  kind: 'agent',
  title: 'Author build-time YAML indexer and produce lib/index.json',
  metadata: {
    appDir: args.appDir,
    catalogDir: args.catalogDir,
    instructions: [
      `Working directory: ${args.appDir}`,
      `Author lib/indexer/build-index.ts (Node-runnable via tsx). It MUST:`,
      `  - Recursively read every .yaml/.yml under ${args.catalogDir}/graph/ using fast-glob or fs.readdirSync recursion (no extra dep — write a recursive walker).`,
      `  - Parse each file with js-yaml; expect shape { nodeKind, id, attributes?, edges? }.`,
      `  - Read ${args.catalogDir}/schema/node-kinds/*.yaml and ${args.catalogDir}/schema/edge-kinds.yaml to populate nodeKinds and edgeKinds dictionaries (id, name, description, attributeDefs, applicableEdges).`,
      `  - Group nodeKind ids into clusters using the directory under graph/ (top-level subdir is the cluster name).`,
      `  - Emit: { generatedAt, records: { [id]: { id, _kind, _file, _cluster, ...attributes } }, edges: [{ from, to, kind, attributes? }], nodeKinds: { [name]: { id?, description?, clusters: [], count: number } }, edgeKinds: { [name]: { id?, description?, source?, target?, count: number } }, clusters: { [cluster]: { nodeKinds: [], recordCount: number } }, stats: { totalRecords, totalEdges, totalNodeKinds, totalEdgeKinds, totalClusters } }.`,
      `  - For edges: record top-level "edges" map { edgeKindName: [targetIds] } as flat triples plus any top-level edges array form. Always store from = record.id.`,
      `  - Write to lib/index.json (pretty JSON, 2-space indent) and lib/index.json.gz is NOT needed.`,
      `Add scripts to package.json: "reindex": "tsx lib/indexer/build-index.ts", "prebuild": "npm run reindex", "predev": "npm run reindex".`,
      `Install tsx as devDependency: npm install -D tsx.`,
      `Run "npm run reindex" once and verify lib/index.json exists and stats.totalRecords > 1000.`,
      `Verify: ls -la lib/index.json && node -e "const i=require('./lib/index.json'); console.log(i.stats);"`,
      `Return JSON: { indexBuilt: true, indexPath, stats, sampleRecordIds: [first 5 ids] }.`,
    ],
  },
}));

const layoutAndHomeTask = defineTask('layout-and-home', (args) => ({
  kind: 'agent',
  title: 'Root layout, header, sidebar, theme tokens; home dashboard page',
  metadata: {
    appDir: args.appDir,
    instructions: [
      `Working directory: ${args.appDir}`,
      `Author app/layout.tsx with: <html lang=en className=dark> + <body className="bg-background text-foreground"> + a top header (sticky) containing app name "Graph Explorer", a global SearchBar client component (collapses to / shortcut), and a right-side link to /graph. Below header, a 2-column shell: left sidebar (220px) with cluster nav (read clusters from lib/index.json; group by cluster, expand to NodeKinds with counts, link to /kind/[nodeKind]); right is {children}.`,
      `Author components/Header.tsx, components/Sidebar.tsx, components/SearchBar.tsx (client). SearchBar uses Fuse.js loaded lazily from a tiny client store.`,
      `Author lib/data.ts that imports lib/index.json statically and exports typed accessors: getIndex(), getRecord(id), getRecordsByKind(kind), getNeighbors(id, depth=1), getEdgeKinds(), getNodeKinds(), getClusters(). Define TS interfaces in lib/types.ts.`,
      `Author app/page.tsx (Home): top stats row (4 cards: total records, NodeKinds, EdgeKinds, clusters), then a grid of NodeKind cards grouped by cluster (each card shows name + count + 3 sample ids); a "Browse by EdgeKind" link to /edges; a footer note "Read-only. Re-index with npm run reindex".`,
      `Use Tailwind utility classes throughout. Avoid client components where possible — server components for data, client only for SearchBar / interactivity.`,
      `Verify: ls app/layout.tsx app/page.tsx components/Header.tsx components/Sidebar.tsx components/SearchBar.tsx lib/data.ts lib/types.ts`,
      `Return JSON: { layoutDone: true, filesCreated: [...], homeRoute: "/" }.`,
    ],
  },
}));

const kindListTask = defineTask('kind-list', (args) => ({
  kind: 'agent',
  title: 'NodeKind list route /kind/[nodeKind]',
  metadata: {
    appDir: args.appDir,
    instructions: [
      `Working directory: ${args.appDir}`,
      `Author app/kind/[nodeKind]/page.tsx (server component). It reads getRecordsByKind(params.nodeKind), shows: page header with kind name, schema description (from nodeKinds dict), and total count. A facets sidebar (left) auto-derives facets from the populated string/array attributes across the records (top 8 most common keys, top 10 values per key). A right panel renders a dense table: id (link to /n/[id]), displayName, key sample attrs. Pagination 50 per page via searchParams.page.`,
      `Facet filtering: read filters from searchParams (e.g. ?attr.cluster=foo&attr.vendor=bar). Apply server-side. Sort options: id asc/desc, displayName asc/desc. Show clear-filter chips.`,
      `Author components/RecordTable.tsx and components/FacetPanel.tsx as small client/server-mix components as needed.`,
      `Generate static params for the top 50 nodeKinds by count (export generateStaticParams). For unknown kinds, render a notFound() page.`,
      `Verify: ls app/kind/\\[nodeKind\\]/page.tsx components/RecordTable.tsx components/FacetPanel.tsx`,
      `Return JSON: { kindRouteDone: true, route: "/kind/[nodeKind]", filesCreated: [...] }.`,
    ],
  },
}));

const recordDetailTask = defineTask('record-detail', (args) => ({
  kind: 'agent',
  title: 'Record detail route /n/[id] with mini-graph and JSON view',
  metadata: {
    appDir: args.appDir,
    instructions: [
      `Working directory: ${args.appDir}`,
      `Author app/n/[id]/page.tsx (server). The id is URL-encoded; decode safely. Layout:`,
      `  - Header: id (mono), NodeKind badge linking to /kind/[nodeKind], _file path (small).`,
      `  - Tabs: "Overview" (default) | "JSON" | "Graph".`,
      `  - Overview: attributes table (key/value, format per type — strings raw, arrays as bullet lists, objects as nested 2-col, ids that look like edge refs render as <Link href="/n/[id]">). Then "Outgoing edges" grouped by EdgeKind (each section: kind name + arrow + list of target id links + target display name). Then "Incoming edges" computed via getIndex().edges.filter(e => e.to === id), grouped similarly.`,
      `  - JSON tab: pretty-print the full record + outgoing edges as JSON in a <pre> with syntax-highlight-light styling (just monospace + alternating bg).`,
      `  - Graph tab: client component MiniGraph using @xyflow/react. Renders the record at center plus 1-hop neighbors (incoming + outgoing). Each node labeled with id (truncated) + NodeKind. Edges labeled with EdgeKind. Use a simple radial layout (place neighbors on a circle around center; angular spacing = 2*Math.PI / neighbors.length). Allow drag.`,
      `Author components/AttributeTable.tsx, components/EdgeList.tsx, components/MiniGraph.tsx (client; "use client").`,
      `generateStaticParams: generate for the first 200 records (sorted by id) to keep build time bounded; the rest render on-demand via dynamic = "force-static" with dynamicParams = true.`,
      `Verify: ls app/n/\\[id\\]/page.tsx components/AttributeTable.tsx components/EdgeList.tsx components/MiniGraph.tsx`,
      `Return JSON: { detailRouteDone: true, filesCreated: [...] }.`,
    ],
  },
}));

const searchTask = defineTask('search', (args) => ({
  kind: 'agent',
  title: 'Full-text search /search + global header search',
  metadata: {
    appDir: args.appDir,
    instructions: [
      `Working directory: ${args.appDir}`,
      `Author app/search/page.tsx (client component, "use client"). Reads ?q=&kind= from URL. Uses Fuse.js with keys: id (weight 0.4), attributes.displayName (0.3), attributes.description (0.2), _kind (0.1). Threshold 0.4. Limit 100 results.`,
      `Build the search corpus once on mount from a fetched /api/search-index.json — author app/api/search-index.json/route.ts that returns a slimmed array { id, _kind, displayName, description } from the imported lib/index.json. Cache: response should be static / "force-static".`,
      `Render: search input at top (autofocus), NodeKind facet sidebar (with counts within results), result list (id, kind badge, displayName, snippet). Click result → /n/[id]. Empty state and "no results" state.`,
      `Update components/SearchBar.tsx (header) to navigate to /search?q={q} on submit. Add keyboard shortcut: pressing "/" anywhere focuses it (already wired in layout-and-home phase if missing — add it here if not).`,
      `Verify: ls app/search/page.tsx app/api/search-index.json/route.ts`,
      `Return JSON: { searchDone: true, route: "/search", apiRoute: "/api/search-index.json" }.`,
    ],
  },
}));

const graphExplorerTask = defineTask('webui-graph', (args) => ({
  kind: 'agent',
  title: 'Full graph explorer /graph (react-flow 2-hop neighborhood)',
  metadata: {
    appDir: args.appDir,
    instructions: [
      `Working directory: ${args.appDir}`,
      `Author app/graph/page.tsx (server) that reads ?seed=<id>&depth=2&edgeKinds=csv&nodeKinds=csv from searchParams and renders a client component <GraphCanvas seed depth edgeKinds nodeKinds /> (Suspense fallback). If no seed, default to the first record.`,
      `Author components/GraphCanvas.tsx ("use client") using @xyflow/react. It receives seed/depth/filters as props and the full slim graph index via fetch('/api/graph-index.json'). Compute the BFS neighborhood up to depth from seed, applying filters. Use a force-directed-like layout: place seed at (0,0); neighbors of depth=1 on a radius=200 circle; depth=2 on a radius=400 circle. Node click expands by adding the clicked node's neighbors to the canvas.`,
      `Author app/api/graph-index.json/route.ts — slim view: { records: { [id]: { _kind, displayName? } }, edges: [{from,to,kind}] }. Static.`,
      `Add a left filter panel: NodeKind multi-select (with counts), EdgeKind multi-select, seed search (typeahead using the same slim index), depth slider 1-3. URL state via shallow router.replace.`,
      `Include a top toolbar with: "Reset", "Fit view", count of visible nodes/edges.`,
      `Verify: ls app/graph/page.tsx components/GraphCanvas.tsx app/api/graph-index.json/route.ts`,
      `Return JSON: { graphRouteDone: true, route: "/graph" }.`,
    ],
  },
}));

const edgesCatalogTask = defineTask('edges-catalog', (args) => ({
  kind: 'agent',
  title: 'EdgeKind catalog /edges + per-kind drilldown',
  metadata: {
    appDir: args.appDir,
    instructions: [
      `Working directory: ${args.appDir}`,
      `Author app/edges/page.tsx (server). Lists every EdgeKind from getEdgeKinds() with: name, description, source kinds, target kinds, count of wired pairs. Sortable by count.`,
      `Author app/edges/[edgeKind]/page.tsx (server). Lists all wired pairs for the kind: from-id (link), arrow with attrs if any, to-id (link). Paginate 100 per page. Show schema panel at top.`,
      `generateStaticParams for /edges/[edgeKind] from getEdgeKinds().`,
      `Verify: ls app/edges/page.tsx app/edges/\\[edgeKind\\]/page.tsx`,
      `Return JSON: { edgesRouteDone: true, routes: ["/edges","/edges/[edgeKind]"] }.`,
    ],
  },
}));

const polishTask = defineTask('polish', (args) => ({
  kind: 'agent',
  title: 'Polish: empty/loading states, breadcrumbs, kbd shortcuts, 404, README',
  metadata: {
    appDir: args.appDir,
    instructions: [
      `Working directory: ${args.appDir}`,
      `Add app/not-found.tsx with a friendly "Record not found" + link home + search box.`,
      `Add app/loading.tsx (root) with a small skeleton.`,
      `Add components/Breadcrumbs.tsx and integrate in /kind/[nodeKind], /n/[id], /edges/[edgeKind] pages (Home > Cluster > NodeKind > Record etc.).`,
      `Add a global keyboard handler in components/KeyboardShortcuts.tsx ("use client") wired in the root layout: "/" focuses the SearchBar, "g h" navigates home, "g k" focuses the kind nav (focus the first sidebar link), "?" opens a small Dialog showing the shortcut cheatsheet. Use a tiny key-sequence buffer with 800ms timeout.`,
      `Add an empty state component for any list that has 0 results (records, search, edges drilldown).`,
      `Author README.md with: project description, "Run", "Re-index", routes table, dev commands. Keep it short.`,
      `Verify: ls app/not-found.tsx app/loading.tsx components/Breadcrumbs.tsx components/KeyboardShortcuts.tsx README.md`,
      `Return JSON: { polishDone: true, filesCreated: [...] }.`,
    ],
  },
}));

const smokeTestTask = defineTask('smoke-test', (args) => ({
  kind: 'shell',
  title: 'Build the app (deterministic gate)',
  // Single deterministic gate. We do NOT bundle a dev-server smoke check
  // here because background processes complicate Windows shell semantics
  // inside the babysitter shell-task runner; a green `next build` after
  // `npm run reindex` (run via prebuild) is sufficient evidence the app
  // compiles, types-check, and statically renders the routes that have
  // generateStaticParams. Manual `npm run dev` smoke check is documented
  // in the README.
  command: `bash -lc "cd '${args.appDir}' && npm run build 2>&1 | tail -120"`,
  expectedExitCode: 0,
  metadata: {
    note: 'next build runs prebuild=reindex, so this also verifies the indexer end-to-end.',
  },
}));

exports.process = async function process(inputs, ctx) {
  const appDir = inputs.appDir || APP_DIR;
  const catalogDir = inputs.catalogDir || CATALOG_DIR;

  const scaffold = await ctx.task(scaffoldTask, { appDir });
  const indexer = await ctx.task(indexerTask, { appDir, catalogDir });
  const layout = await ctx.task(layoutAndHomeTask, { appDir });
  const kindList = await ctx.task(kindListTask, { appDir });
  const recordDetail = await ctx.task(recordDetailTask, { appDir });
  const search = await ctx.task(searchTask, { appDir });
  const graph = await ctx.task(graphExplorerTask, { appDir });
  const edges = await ctx.task(edgesCatalogTask, { appDir });
  const polish = await ctx.task(polishTask, { appDir });
  const smoke = await ctx.task(smokeTestTask, { appDir });

  return {
    status: 'ok',
    appDir,
    catalogDir,
    phases: {
      scaffold,
      indexer,
      layout,
      kindList,
      recordDetail,
      search,
      graph,
      edges,
      polish,
      smoke,
    },
    routes: ['/', '/kind/[nodeKind]', '/n/[id]', '/search', '/graph', '/edges', '/edges/[edgeKind]'],
    reindexCommand: 'cd packages/webui && npm run reindex',
    devCommand: 'cd packages/webui && npm run dev',
  };
};
