# ctx — Uninstall Guide

## Step 1 — Remove ctx hooks from settings.json

Open `~/.claude/settings.json` and remove any PostToolUse and Stop hooks that reference ctx or its Python scripts (paths containing `~/.ctx/src/` or ctx-related scripts like `context-monitor.py`, `usage-tracker.py`).

Do **not** remove hooks belonging to other tools. Only remove entries that were added by the ctx installer.

## Step 2 — Remove the knowledge graph wiki

```bash
rm -rf ~/.claude/skill-wiki/
```

This removes all 1,851 entity pages, micro-skill pipelines, and graph data. This is the largest component (~159 MB).

## Step 3 — Remove the skill router agent

```bash
rm -rf ~/.claude/agents/skill-router/
```

## Step 4 — Remove the skill registry

```bash
rm -f ~/.claude/skill-registry.json
```

## Step 5 — Remove the ctx source directory

```bash
rm -rf ~/.ctx/
```

This removes the cloned repository, Python helpers, configuration, and graph archive.

## Step 6 — Remove CLAUDE.md integration

If you added a ctx section to your project's `CLAUDE.md` during installation, remove the `## ctx — Skill & Agent Recommendations` section and its contents.

## Step 7 — Remove from babysitter plugin registry

```bash
babysitter plugin:remove-from-registry --plugin-name ctx --project --json
```

## Post-Uninstall Notes

- Restart Claude Code to pick up the hook changes
- No Python packages were installed system-wide by ctx, so no `pip uninstall` is needed
- Temporary files in `/tmp/` related to ctx profile caching will be cleaned up by the OS
- If other tools depend on `~/.claude/skill-wiki/` (unlikely), do not remove it in Step 2
