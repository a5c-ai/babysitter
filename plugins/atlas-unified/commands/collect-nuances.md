---
description: Collect the REAL constraints/gotchas of your scanned systems (IaC drift, orphaned resources, RBAC quirks, region splits), each cited; Atlas-graph comparison secondary.
argument-hint: The sources to inspect for nuances (e.g. "our azure account and this repo into C:/work/atlas").
allowed-tools: Read, Grep, Write, Task, Bash, Edit, Glob, AskUserQuestion, TodoWrite, Skill, mcp__atlas__atlas_public_search, mcp__atlas__atlas_public_record, mcp__atlas__atlas_public_neighbors, mcp__atlas__atlas_public_kinds, mcp__atlas__atlas_public_clusters, mcp__atlas__atlas_public_wiki_page
---

Invoke the babysitter:babysit skill (using the Skill tool) and follow its instructions (SKILL.md). Run the PRE-AUTHORED atlas process bundled with this plugin — do NOT interview the user or author a new process. Create the run directly from this bundled entry and iterate it to completion:

```
${{{pluginRootEnvVar}}}/processes/atlas-collect-nuances.mjs#process
```

(e.g. `babysitter run:create --process-id atlas-collect-nuances --entry "${{{pluginRootEnvVar}}}/processes/atlas-collect-nuances.mjs#process" --harness <this-harness>`, then iterate.) Pass the user arguments below as the run's stated need / process inputs. Continue executing in this same turn; do not stop after the Skill tool returns.

This process is SCAN-FIRST: it parses the stated sources, then runs READ-ONLY scans (Bash `az` + git/fs) of the user's REAL systems to collect actual constraints/gotchas/edge-cases — IaC-as-survey drift, orphaned cloud resources, RBAC/visibility quirks, region splits, tenant/descriptor mismatches, externally-deployed systems with no in-repo pipeline — each cited to its real resource id / RG / file path (or a concrete missing-thing observation). The Atlas knowledge graph (mcp__atlas__atlas_public_*) is used only as SECONDARY comparison. Never invent constraints; only inspect the sources named in the arguments.

User arguments for this command:

$ARGUMENTS
