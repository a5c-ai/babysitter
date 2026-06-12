---
description: Mine the REAL data stores/models in your sources (cloud DBs via az, schemas/migrations, package types), each cited; Atlas-graph comparison secondary.
argument-hint: The sources to mine for data (e.g. "our azure account and this repo into C:/work/atlas").
allowed-tools: Read, Grep, Write, Task, Bash, Edit, Glob, AskUserQuestion, TodoWrite, Skill, mcp__atlas__atlas_public_search, mcp__atlas__atlas_public_record, mcp__atlas__atlas_public_neighbors, mcp__atlas__atlas_public_kinds, mcp__atlas__atlas_public_clusters, mcp__atlas__atlas_public_wiki_page
---

Invoke the babysitter:babysit skill (using the Skill tool) and follow its instructions (SKILL.md). Run the PRE-AUTHORED atlas process bundled with this plugin — do NOT interview the user or author a new process. Create the run directly from this bundled entry and iterate it to completion:

```
${{{pluginRootEnvVar}}}/processes/atlas-data-mining.mjs#process
```

(e.g. `babysitter run:create --process-id atlas-data-mining --entry "${{{pluginRootEnvVar}}}/processes/atlas-data-mining.mjs#process" --harness <this-harness>`, then iterate.) Pass the user arguments below as the run's stated need / process inputs. Continue executing in this same turn; do not stop after the Skill tool returns.

This process is SCAN-FIRST: it parses the stated sources, then runs READ-ONLY scans to mine the REAL data — cloud databases/storage/AI-Search via `az` (Bash), and schemas/migrations/ORM models/package types in the repos/dirs — binding models to the stores that back them, each cited to its real resource id / file path. The Atlas knowledge graph (mcp__atlas__atlas_public_*) is used only as SECONDARY comparison. Never invent stores or models; only mine the sources named in the arguments. Never read secret values.

User arguments for this command:

$ARGUMENTS
