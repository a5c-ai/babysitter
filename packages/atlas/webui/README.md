# Atlas Graph Explorer

A read-only Next.js app for browsing the Atlas catalog graph. Reusable graph data, indexing, and SDK access live in the workspace package `@a5c-ai/atlas`; this app consumes that package as `@a5c-ai/atlas-webui`.

## Features

- Home dashboard with stats + NodeKinds grouped by cluster
- `/kind/[nodeKind]` — list any NodeKind with auto-derived facets, sort, pagination
- `/n/[id]` — record detail with attribute table, outgoing/incoming edges, and a 1-hop mini-graph
- `/search` — full-text search (Fuse.js) over id / displayName / description / kind
- `/graph` — full graph canvas (react-flow) with depth 1–3 BFS, NodeKind/EdgeKind filtering
- `/wiki/[[...slug]]` — wiki-style graph pages backed by `Page` nodes and Markdown frontmatter
- `/edges` and `/edges/[edgeKind]` — EdgeKind catalog and per-kind wired pairs
- GitHub sign-in for private Atlas workspace routes
- PostgreSQL-backed user graph uploads that merge into logged-in Atlas views
- Company builder for composing systems, assets, integrations, and YAML exports
- Dark mode by default; Tailwind v4 + hand-rolled shadcn-style primitives
- Keyboard shortcuts: `/` focuses search, `g h`/`g g`/`g e`/`g s` navigate, `?` shows help

## Run

```bash
npm install
set DATABASE_URL=postgres://postgres:postgres@localhost:5432/atlas_webui
set GITHUB_CLIENT_ID=your-github-oauth-app-client-id
set GITHUB_CLIENT_SECRET=your-github-oauth-app-client-secret
set AUTH_SECRET=a-long-random-secret
npm run db:init -w @a5c-ai/atlas-webui
npm run dev -w @a5c-ai/atlas-webui
# open http://localhost:3000
```

Authenticated Atlas features rely on:

- `DATABASE_URL`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `AUTH_SECRET`

Anonymous browsing still works without a login. Private workspace routes, user graph uploads, and company builder persistence require PostgreSQL for shared durability; without `DATABASE_URL`, a local process falls back to local SQLite for ad-hoc development only.

## GitHub OAuth and deployment notes

- Configure the GitHub OAuth app callback URL as:
  - local: `http://localhost:3000/api/auth/callback/github`
  - hosted: `https://<your-host>/api/auth/callback/github`
- `AUTH_SECRET` signs the Atlas session cookie and OAuth state cookie. Use a long random value in every deployed environment.
- The Atlas auth flow derives its origin from `x-forwarded-proto`, `x-forwarded-host`, or the request URL, so your reverse proxy should forward those headers correctly.
- The repository publish workflow provisions an in-cluster PostgreSQL StatefulSet for Atlas WebUI on the `develop`, `staging`, and `main` deployment branches, stores `DATABASE_URL` in the `atlas-postgres` Kubernetes secret, runs `npm run db:init -w @a5c-ai/atlas-webui`, and injects the same secret into the app deployment.
- For one-off local development outside that CI deploy path, start PostgreSQL yourself, set `DATABASE_URL`, and run `npm run db:init -w @a5c-ai/atlas-webui` before `npm run dev -w @a5c-ai/atlas-webui`.
- Recommended rollout order for a new non-CI environment:
  1. provision PostgreSQL and set `DATABASE_URL`
  2. set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `AUTH_SECRET`
  3. run `npm run db:init -w @a5c-ai/atlas-webui`
  4. deploy the app and verify GitHub sign-in before testing private uploads or company builder flows

## Graph SDK and CLI

The `@a5c-ai/atlas` package owns the graph indexer, generated index, SDK helpers, CLI, and Markdown wiki page ingestion. The web app rebuilds that package automatically in `predev` and `prebuild`.

```bash
npm run build -w @a5c-ai/atlas
node packages/atlas/dist/cli.js stats
node packages/atlas/dist/cli.js search codex --limit 10
node packages/atlas/dist/cli.js neighbors <node-id> --depth 2
```

To build an index from another catalog directory:

```bash
node packages/atlas/dist/cli.js reindex --catalog-dir /path/to/graph --out /tmp/atlas-index.json
```

## Routes

| Route | Description |
| --- | --- |
| `/` | Home — stats + NodeKinds by cluster |
| `/kind/[nodeKind]` | List records of a NodeKind, faceted |
| `/n/[id]` | Record detail (Overview / JSON / Graph tabs) |
| `/search` | Fuzzy full-text search |
| `/graph?seed=<id>&depth=2` | Full graph canvas |
| `/wiki/[[...slug]]` | Wiki article backed by a `Page` graph node |
| `/edges` | EdgeKind catalog |
| `/edges/[edgeKind]` | Wired pairs for an EdgeKind |
| `/api/search-index.json` | Slim index for client-side search |
| `/api/graph-index.json` | Slim index for the graph canvas |
| `/api/mcp` | Streamable HTTP MCP endpoint exposing only the public Atlas surface |
| `/workspace` | Authenticated private workspace |
| `/workspace/graphs` | User graph uploads and overlay management |
| `/workspace/company-builder` | Company builder with persisted drafts and YAML export |

## MCP endpoint

The web UI exposes a public Streamable HTTP MCP endpoint at `/api/mcp`.

- Transport handler: `app/api/[transport]/route.ts`
- Package: `mcp-handler`
- Scope: public Atlas data only for now — authenticated workspace overlays and private graph uploads are not exposed through MCP yet

Current MCP tool surface includes:

- public stats and clusters
- public search
- public record detail and neighborhood queries
- public node-kind and edge-kind listings/details
- public wiki page retrieval
- public REST OpenAPI/spec discovery

## Notes

- Trust Chain is OUT OF SCOPE in this app — Trust records render like any other NodeKind but no special UI is wired.
- IDs commonly contain `:` and `@`; routes URL-encode them.
- The SDK indexer is forgiving: current graph generation reports 11 parse errors across 2026 YAML files.
- Markdown articles live under `graph/wiki/**.md` with frontmatter. Each article is indexed as a `Page` node and can link to graph nodes with `documents`.

