---
description: Mine the REAL processes in your sources (CI/CD, npm scripts, IaC, Dockerfiles, .a5c, cron), each cited to its file; Atlas-graph comparison secondary.
argument-hint: The sources to mine (e.g. "this repo and C:/work/ into C:/work/atlas").
allowed-tools: Read, Grep, Write, Task, Bash, Edit, Glob, AskUserQuestion, TodoWrite, Skill, mcp__atlas__atlas_public_search, mcp__atlas__atlas_public_record, mcp__atlas__atlas_public_neighbors, mcp__atlas__atlas_public_kinds, mcp__atlas__atlas_public_clusters, mcp__atlas__atlas_public_wiki_page
---

Invoke the babysitter:babysit skill (using the Skill tool) and follow its instructions (SKILL.md). Run the PRE-AUTHORED atlas process bundled with this plugin — do NOT interview the user or author a new process. Create the run directly from this bundled entry and iterate it to completion:

```
${{{pluginRootEnvVar}}}/processes/atlas-process-mining.mjs#process
```

(e.g. `babysitter run:create --process-id atlas-process-mining --entry "${{{pluginRootEnvVar}}}/processes/atlas-process-mining.mjs#process" --harness <this-harness>`, then iterate.) Pass the user arguments below as the run's stated need / process inputs. Continue executing in this same turn; do not stop after the Skill tool returns.

This process is SCAN-FIRST: it parses the stated sources, then runs READ-ONLY scans (Bash) of the REAL repos/dirs/cloud automation and mines the processes that actually exist — `.github/workflows`, npm scripts, terraform/bicep/helm/k8s, Dockerfiles, babysitter `.a5c` processes, and cron/scheduled jobs — each cited to its real file path. The Atlas knowledge graph (mcp__atlas__atlas_public_*) is used only as SECONDARY comparison. Never invent files or processes; only mine the sources named in the arguments.

User arguments for this command:

$ARGUMENTS
