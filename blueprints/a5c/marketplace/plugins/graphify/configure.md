# Graphify -- Configure Instructions

Graphify's behavior is controlled by (a) which platform installer was run, (b) CLI flags at skill-invocation time, and (c) an optional `.graphifyignore` file per project. There is no global config file to edit.

---

## Configuration Options

| Option | Where | Values | Default | Notes |
|--------|-------|--------|---------|-------|
| Target platform | `graphify install --platform <p>` | `claude` (default), `codex`, `opencode`, `cursor`, `gemini`, `copilot`, `aider`, `claw`, `droid`, `trae`, `trae-cn`, `windows` | `claude` | Run once per platform the user wants graphify in. |
| Always-on hook | `graphify <platform> install` inside a project | n/a (toggle) | off | Installs PreToolUse hook + `CLAUDE.md`/`AGENTS.md` section so the graph is consulted automatically before grep/glob. Undo with `graphify <platform> uninstall`. |
| Extraction depth | `/graphify <path> --mode deep` | `default`, `deep` | `default` | `deep` does more aggressive INFERRED edge extraction -- higher token cost. |
| Incremental update | `/graphify <path> --update` | flag | off | Re-extract only changed files and merge into existing graph (SHA256 cache). |
| Directed graph | `/graphify <path> --directed` | flag | off | Preserves edge direction `source→target`. |
| Cluster-only | `/graphify <path> --cluster-only` | flag | off | Reruns Leiden community detection on existing graph without re-extraction. |
| Skip visualization | `/graphify <path> --no-viz` | flag | off | Produces `GRAPH_REPORT.md` + `graph.json` only, no `graph.html`. |
| Obsidian export | `/graphify <path> --obsidian [--obsidian-dir <dir>]` | flag + path | off | Also emit an Obsidian vault from the graph. |
| Ignore patterns | `.graphifyignore` file in project root | gitignore syntax | (none) | Excludes folders/files from the graph. Use for `node_modules/`, `vendor/`, `dist/`, generated files. |
| Codex parallel agents | `~/.codex/config.toml` -> `[features] multi_agent = true` | boolean | false | Required for parallel subagent extraction on Codex. |

---

## Step 1: Change the Installed Platform

If the user originally installed for the wrong assistant, run the correct installer (it is idempotent):

```bash
graphify install --platform <new-platform>
```

Old platform skills can be left in place or removed via `graphify <old-platform> uninstall`.

---

## Step 2: Toggle the Always-On Hook

Run **inside the target project directory**.

Enable:

```bash
graphify <platform> install     # e.g. `graphify claude install`
```

Disable:

```bash
graphify <platform> uninstall
```

---

## Step 3: Adjust Ignore Patterns

Create or edit `.graphifyignore` in the project root. Example:

```
# .graphifyignore
vendor/
node_modules/
dist/
build/
*.generated.py
**/__pycache__/
```

Same syntax as `.gitignore`. Patterns match against file paths relative to the folder graphify is run on.

---

## Step 4: Expose `graph.json` as an MCP Server (optional)

After a graph exists, the assistant can query it via MCP instead of receiving pasted text:

```bash
python -m graphify.serve graphify-out/graph.json
```

This exposes tools: `query_graph`, `get_node`, `get_neighbors`, `shortest_path`. Wire it into the assistant's MCP config per the assistant's normal MCP setup (Claude Code: `~/.claude/mcp.json`; Cursor: project MCP settings; etc.).

---

## Step 5: Verify

From a non-trivial folder:

```bash
graphify . --no-viz
ls graphify-out
```

Expect `GRAPH_REPORT.md` and `graph.json`. Then in the assistant, trigger `/graphify query "..."` and confirm it returns a focused subgraph.
