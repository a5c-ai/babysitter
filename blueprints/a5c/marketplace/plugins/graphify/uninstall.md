# Graphify -- Uninstall Instructions

Reverses everything `install.md` and `configure.md` performed. Safe to run even if some steps were never applied; each step tolerates "not present".

---

## Step 1: Remove the Always-On Graph Hook (if installed)

Run **inside each project directory** where `graphify <platform> install` was run:

| Platform | Command |
|----------|---------|
| Claude Code | `graphify claude uninstall` |
| Codex | `graphify codex uninstall` |
| OpenCode | `graphify opencode uninstall` |
| GitHub Copilot CLI | `graphify copilot uninstall` |
| Aider | `graphify aider uninstall` |
| OpenClaw | `graphify claw uninstall` |
| Factory Droid | `graphify droid uninstall` |
| Trae | `graphify trae uninstall` |
| Trae CN | `graphify trae-cn uninstall` |
| Cursor | `graphify cursor uninstall` |
| Gemini CLI | `graphify gemini uninstall` |

This strips the graphify section from `CLAUDE.md` / `AGENTS.md`, removes `.cursor/rules/graphify.mdc`, and removes the PreToolUse hook entry from the assistant's `settings.json` / `hooks.json` / `.opencode/plugins/` registration.

---

## Step 2: Remove the Skill From the Assistant

```bash
graphify uninstall                       # Claude Code default
graphify uninstall --platform codex      # or whichever platform was installed
```

Repeat per-platform if the skill was installed to multiple assistants.

If the skill files persist because of a partial install, delete them manually:

- Claude Code: `~/.claude/skills/graphify/`
- Codex: `~/.codex/skills/graphify/`
- Gemini CLI: `~/.gemini/skills/graphify/`
- GitHub Copilot CLI: `~/.copilot/skills/graphify/`
- OpenCode: `~/.opencode/skills/graphify/`

---

## Step 3: Uninstall the PyPI Package

```bash
pip uninstall -y graphifyy
```

---

## Step 4: (Optional) Remove Per-Project Graph Output

Graphify writes output under `graphify-out/` in each project. This plugin does NOT delete it automatically -- the graph may be useful evidence. Remove manually if the user wants:

```bash
# run inside each project
rm -rf graphify-out
```

---

## Step 5: Remove From Plugin Registry

```bash
babysitter plugin:remove-from-registry \
  --plugin-name graphify \
  --project --json
```

(Use `--global` if the plugin was installed globally.)
