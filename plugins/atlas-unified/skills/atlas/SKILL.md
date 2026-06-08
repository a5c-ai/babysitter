---
name: atlas
description: >
  Turn a stated need into a full system design by mining the Atlas knowledge
  graph. Use this skill when asked to design a system from a goal, discover the
  components/processes/data a domain needs, mine processes or data models, or
  collect domain nuances. (atlas, design a system, what does X need, system
  discovery, process mining, data mining, collect nuances, blueprint from a need,
  graph-driven design)
allowed-tools: Read, Grep, Glob, Write, Edit, Task, Bash, AskUserQuestion, TodoWrite, Skill, mcp__atlas__atlas_public_search, mcp__atlas__atlas_public_record, mcp__atlas__atlas_public_neighbors, mcp__atlas__atlas_public_kinds, mcp__atlas__atlas_public_kind, mcp__atlas__atlas_public_clusters, mcp__atlas__atlas_public_stats, mcp__atlas__atlas_public_wiki_page
version: 0.1.0
---

# atlas

This skill turns a stated need into an entire system design by mining the Atlas
knowledge graph. It is the brain of the `atlas` plugin. For non-trivial runs it
delegates orchestration to `babysitter:babysit` using an atlas-specific `.a5c`
process; for simple lookups it queries the graph directly.

## 1. What Atlas is

Atlas is a knowledge graph of agents, processes, data models, capabilities,
workflows, clusters, and wiki pages. You reach it through the
`mcp__atlas__atlas_public_*` MCP tools, which this plugin wires natively into
your harness (see the plugin README "Atlas MCP" section; the server URL is
overridable via `ATLAS_MCP_URL`). Never assume the graph's shape — discover it
through the tools.

## 2. When to use

| Trigger phrase | Command |
|----------------|---------|
| design a system, blueprint from a need, graph-driven design | `/atlas:discover` |
| process mining, what processes does X need | `/atlas:mine-processes` |
| data mining, what data does X need | `/atlas:mine-data` |
| collect nuances, edge cases/constraints for X | `/atlas:collect-nuances` |

## 3. The need → design pipeline (core method)

1. **Frame the need** — restate the goal as a domain + concrete outcomes. If the
   request is ambiguous, run a short interview (`AskUserQuestion`). Per repo
   policy, interview ONLY when requirements are genuinely unclear.
2. **Locate anchors** — `atlas_public_search(q=<need terms>)` to find seed nodes;
   `atlas_public_clusters` / `atlas_public_kinds` to scope the domain.
3. **Expand the graph** — `atlas_public_neighbors(id, depth, edges, kinds)` from
   the anchors to gather the system's parts: components, workflows, processes,
   data models, capabilities.
4. **Read detail** — `atlas_public_record(id, expandNeighbors)` for fields and
   edges; `atlas_public_wiki_page` for narrative context.
5. **Synthesize the design** — assemble the discovered nodes into a layered
   system design (components, processes, data, integrations, nuances) and write a
   design artifact under `.a5c/atlas/<run>/design.md` plus a machine mirror.
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

- No fallbacks (repo rule). If you find yourself writing a fallback, stop and fix
  the root cause.
- Never invent graph node ids — only reference ids returned by Atlas tools.
- Keep breakpoints sparse; use them only when user input is genuinely critical or
  ambiguous.
- Do not emit `kind: 'shell'` subtasks unless the user explicitly asks for a
  shell-oriented workflow.
