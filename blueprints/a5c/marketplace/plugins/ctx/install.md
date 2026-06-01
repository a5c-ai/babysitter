# ctx — Installation Guide

Install the **ctx** intelligent skill and agent recommendation system for Claude Code. ctx maintains a persistent knowledge graph of 1,450+ skills and 427 agents, scans your repo at session start to detect tech stacks, and recommends 10-15 relevant skills per session. Includes mid-session context monitoring, micro-skill pipelines for large skills, and automatic staleness tracking.

**Repository:** https://github.com/stevesolun/ctx

## Prerequisites

- **Python 3.8+** (`python3 --version` or `python --version` on Windows)
- **Git** (for cloning the repository)
- **Claude Code** with `~/.claude/settings.json` accessible

## Step 1 — Clone the repository

Clone ctx to a permanent location. The install script references files from this directory at runtime, so do not delete it after installation.

```bash
# Choose a location — ~/.ctx is recommended
git clone https://github.com/stevesolun/ctx ~/.ctx
```

If `~/.ctx` already exists (prior installation), pull the latest instead:

```bash
cd ~/.ctx && git pull
```

## Step 2 — Run the installer

The `install.sh` script performs all setup steps: extracts the knowledge graph archive, deploys Python helpers, injects hooks into `~/.claude/settings.json`, and generates the skill registry.

```bash
cd ~/.ctx && bash install.sh
```

The installer will:

1. Extract the pre-built knowledge graph (`graph/wiki-graph.tar.gz`, ~9 MB compressed, ~159 MB uncompressed) to `~/.claude/skill-wiki/`
2. Deploy the skill router agent to `~/.claude/agents/skill-router/`
3. Inject PostToolUse and Stop lifecycle hooks into `~/.claude/settings.json`
4. Deploy Python helper scripts (`context-monitor.py`, `usage-tracker.py`, etc.)
5. Generate `~/.claude/skill-registry.json` with metadata for all indexed skills
6. Build entity pages and knowledge graph cross-links

Watch for any errors in the output. The installer uses `python3` by default, falling back to `python` on Windows.

## Step 3 — Verify the installation

Confirm that the key files and directories were created:

```bash
# Knowledge graph wiki
ls ~/.claude/skill-wiki/ | head -5

# Skill router agent
ls ~/.claude/agents/skill-router/

# Skill registry
cat ~/.claude/skill-registry.json | head -20

# Hooks injected
cat ~/.claude/settings.json
```

Verify that `~/.claude/settings.json` now contains PostToolUse and Stop hooks referencing ctx Python scripts. The hooks should point to scripts under `~/.ctx/src/` or `~/.claude/`.

## Step 4 — Add CLAUDE.md integration (optional but recommended)

Append a ctx usage section to your project's `CLAUDE.md` so Claude Code knows how to interact with the skill recommendation system:

```markdown
## ctx — Skill & Agent Recommendations

ctx is installed and provides intelligent skill/agent recommendations.

- At session start, ctx scans the repo and suggests 10-15 relevant skills
- During the session, the context monitor detects intent signals from file edits and may suggest additional skills
- Skills are never loaded without explicit user approval
- Use the skill-router agent for manual skill discovery: ask "what skills are available for [topic]?"
- Skills unused for 30+ days are flagged as stale by the usage tracker

### Key commands

- Skill discovery: the skill-router agent handles queries about available skills
- Manual graph exploration: `python3 ~/.ctx/src/resolve_graph.py`
- Usage statistics: `python3 ~/.ctx/src/usage-tracker.py`
- Add a new skill: `python3 ~/.ctx/src/skill_add.py <path-or-url>`
```

## Step 5 — Register in babysitter plugin registry

```bash
babysitter plugin:update-registry --plugin-name ctx --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Post-Installation Summary

After installation, ctx provides:

| Component | Location | Purpose |
|-----------|----------|---------|
| Knowledge graph | `~/.claude/skill-wiki/` | 1,851 entity pages with cross-links |
| Skill router | `~/.claude/agents/skill-router/` | Agent for manual skill discovery |
| Skill registry | `~/.claude/skill-registry.json` | Metadata index of all known skills |
| Lifecycle hooks | `~/.claude/settings.json` | PostToolUse + Stop hooks for context monitoring |
| Source + helpers | `~/.ctx/` | Python scripts, config, and graph data |
| Micro-skill pipelines | `~/.claude/skill-wiki/` | 844 large skills split into 5-stage gated pipelines |

**How it works at runtime:**

1. **Session start** — `scan_repo.py` detects your tech stack, `resolve_skills.py` scores and ranks skills, you approve which to load (max 15)
2. **Mid-session** — `context-monitor.py` extracts intent signals from file edits, suggests additional skills when relevant
3. **Session end** — `usage-tracker.py` updates statistics, flags skills unused for 30+ days

Start a new Claude Code session to see ctx in action. It will scan your project and present skill recommendations.
