---
name: atlas
description: >
  Atlas turns your STATED NEED into a real systems atlas by SCANNING your actual
  sources (Azure via `az`, git repos, local dirs) and process/data mining them,
  THEN enriching against the Atlas knowledge graph. Use this skill when asked to
  inventory/map your real systems, scan your cloud + repos + directories, mine the
  real processes or data they contain, or collect their real constraints/gotchas.
  (atlas, scan my systems, inventory our azure account, map my repos, real systems
  atlas, process mining, data mining, collect nuances, system discovery)
allowed-tools: Read, Grep, Glob, Write, Edit, Task, Bash, AskUserQuestion, TodoWrite, Skill, mcp__atlas__atlas_public_search, mcp__atlas__atlas_public_record, mcp__atlas__atlas_public_neighbors, mcp__atlas__atlas_public_kinds, mcp__atlas__atlas_public_kind, mcp__atlas__atlas_public_clusters, mcp__atlas__atlas_public_stats, mcp__atlas__atlas_public_wiki_page
version: 0.1.0
---

# atlas

This skill turns a stated need into a **real systems atlas** by SCANNING your
actual sources — Azure subscriptions (via read-only `az`), git repos, and local
directories — and process/data mining them, THEN enriching the result against the
Atlas knowledge graph. It is the brain of the `atlas` plugin. The scan is
PRIMARY; the graph is SECONDARY. For non-trivial runs it delegates orchestration
to `babysitter:babysit` using an atlas-specific `.a5c` process; for simple
lookups it queries the graph directly.

## 1. Scan-first, graph-second

The output you want is an evidence-backed inventory of **your** systems — e.g.
`azure-inventory.json` (every real resource id + RG from `az`),
`workspace-inventory.json` (real repo/dir scan), `processes.json` (real mined
CI/CD/IaC/.a5c processes), and a cross-linked `SYSTEMS-ATLAS.md`. Every item must
cite its REAL source. Generic catalog nodes are NOT the deliverable.

- **Primary — scan the user's real sources.** Use `Bash` to run READ-ONLY scans:
  `az` (account/group/resource list + per-service list/show) for Azure;
  `git` + filesystem (`Read`/`Glob`) for repos and directories. NEVER invent
  resource ids, regions, SKUs, or file paths — if you didn't observe it in real
  output, it does not go in the atlas. Only scan the sources named in the need
  (scoping, not a fallback).
- **Secondary — the Atlas knowledge graph.** Atlas is a knowledge graph of
  agents, processes, data models, capabilities, workflows, and wiki pages reached
  through the `mcp__atlas__atlas_public_*` MCP tools (server URL overridable via
  `ATLAS_MCP_URL`). Use it ONLY to add best-practice / comparison context for the
  real systems you found — never as the primary content, never to pad the atlas
  with generic nodes. See the `atlas-graph-query` skill for the tool surface.

## 2. When to use

| Trigger phrase | Command |
|----------------|---------|
| scan/inventory my real systems (azure + repos + dirs), map them | `/atlas:discover` |
| mine the real processes in my repos/cloud (CI/CD, IaC, .a5c, cron) | `/atlas:mine-processes` |
| mine the real data stores/models in my cloud + repos | `/atlas:mine-data` |
| collect the real constraints/gotchas of my scanned systems | `/atlas:collect-nuances` |

## 3. The need → real atlas pipeline (core method)

1. **Parse sources** — interpret the stated need into concrete SOURCES: Azure
   subscription(s), git repos, local directories, URLs, plus the output dir. If
   the sources are genuinely ambiguous, run a short interview
   (`AskUserQuestion`). Per repo policy, interview ONLY when truly unclear.
2. **Scan cloud (primary)** — for each Azure source, run read-only `az` and write
   a real cloud inventory citing resource ids/RGs. Skip cleanly (record a reason)
   if no cloud source is in scope — only scan what's named.
3. **Scan local (primary)** — for each repo/dir, scan the filesystem + git
   (structure, submodules, manifests, languages, services, IaC) and write a real
   inventory citing real paths.
4. **Enrich (secondary)** — map the discovered real systems against the Atlas
   graph for comparison context. Clearly secondary; never the headline.
5. **Synthesize** — assemble a real, cross-linked layered atlas (components /
   processes / data / integrations / nuances) where EVERY item cites its real
   source, like `SYSTEMS-ATLAS.md`, plus a machine mirror.
6. **Converge (TDD)** — each phase asserts its own checkable outputs before
   proceeding (see the atlas processes), iterating until the assertions pass.

## 4. How to delegate

For any non-trivial run, hand off to `babysitter:babysit` (via the Skill tool)
naming the matching atlas process:

- `/atlas:discover` → `atlas-systems-discovery`
- `/atlas:mine-processes` → `atlas-process-mining`
- `/atlas:mine-data` → `atlas-data-mining`
- `/atlas:collect-nuances` → `atlas-collect-nuances`

Do not hand-roll orchestration when a process exists.

## 5. Guardrails

- No fallbacks (repo rule). Skipping an out-of-scope source class (e.g. no cloud
  named) is correct scoping and must be recorded with a reason — it is NOT a
  silent fallback to the public graph. If you find yourself writing a real
  fallback, stop and fix the root cause.
- Scan-first: every system/item in the atlas MUST cite a REAL source (an `az`
  resource id / RG, or a file path). Never invent resource ids, regions, SKUs, or
  file paths. Never invent graph node ids either — only reference ids returned by
  the Atlas tools, and keep graph content strictly secondary.
- Read-only scanning only: `az` read verbs, `git` status/remote/log, filesystem
  reads. Never run mutating cloud/git/fs commands and never read secret values.
- Keep breakpoints sparse; use them only when the sources to scan are genuinely
  ambiguous.
- The real scanning is done BY the agent via its `Bash` tool inside the agent
  task prompt. Do not emit `kind: 'shell'` subtasks unless the user explicitly
  asks for a shell-oriented workflow.
