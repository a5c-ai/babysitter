---
description: Scan your real systems (Azure + repos + dirs) and map them into a layered, source-cited atlas; enrich against the Atlas graph (secondary).
argument-hint: The sources to scan (e.g. "our azure account, this repo and C:/work/ into C:/work/atlas").
allowed-tools: Read, Grep, Write, Task, Bash, Edit, Glob, AskUserQuestion, TodoWrite, Skill, mcp__atlas__atlas_public_search, mcp__atlas__atlas_public_record, mcp__atlas__atlas_public_neighbors, mcp__atlas__atlas_public_kinds, mcp__atlas__atlas_public_clusters, mcp__atlas__atlas_public_wiki_page
---

Invoke the babysitter:babysit skill (using the Skill tool) and follow its instructions (SKILL.md). Run the PRE-AUTHORED atlas process bundled with this plugin — do NOT interview the user or author a new process. Create the run directly from this bundled entry and iterate it to completion:

```
${{{pluginRootEnvVar}}}/processes/atlas-systems-discovery.mjs#process
```

(e.g. `babysitter run:create --process-id atlas-systems-discovery --entry "${{{pluginRootEnvVar}}}/processes/atlas-systems-discovery.mjs#process" --harness <this-harness>`, then iterate.) Pass the user arguments below as the run's stated need / process inputs. Continue executing in this same turn; do not stop after the Skill tool returns.

This process is SCAN-FIRST: it parses the stated sources, then runs READ-ONLY scans of the user's REAL systems — Azure via `az` (Bash), git repos, and local directories — and synthesizes a cross-linked, source-cited atlas where every item cites a real resource id / RG / file path. The Atlas knowledge graph (mcp__atlas__atlas_public_*) is used only as SECONDARY enrichment/comparison, never as the primary content. Never invent resource ids or file paths; only scan the sources named in the arguments.

User arguments for this command:

$ARGUMENTS
