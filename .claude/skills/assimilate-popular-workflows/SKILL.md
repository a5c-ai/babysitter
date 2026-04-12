---
name: assimilate-popular-workflows
description: This skill should be used when the user asks to "find skills in the wild", "assimilate popular workflows", "discover SKILL.md files in repos", "research external skills", "find workflow patterns", "survey the skill landscape", "what skills exist out there", or wants to investigate public repositories for extractable processes, babysitter plugins, and reusable procedural insights. Searches GitHub for SKILL.md files, classifies repos by archetype, and maintains structured research under docs/reference-repos/.
---

# Assimilate Popular Workflows

Search public GitHub repositories for SKILL.md files, classify each repo by archetype, and maintain structured research documents under `docs/reference-repos/[org]/[repo-name]/`. The goal is not to copy skills verbatim but to extract transferable value: processes, babysitter plugin ideas, reusable patterns, and implicit procedural knowledge that can be codified into babysitter JS processes.

## When to use

- User asks to discover what skills or workflows exist in popular repos.
- User asks to research a specific repo's skill ecosystem.
- User asks to extract processes or patterns from external skills.
- Periodic refresh to track the evolving skill landscape.

## Phase 1 -- Discovery

Search GitHub for repositories containing SKILL.md files. Use multiple search strategies to cast a wide net:

```bash
# Primary: find SKILL.md files in public repos
gh search code "filename:SKILL.md" --json repository,path,url --limit 100

# Supplementary: search for skill frontmatter patterns
gh search code "description:" "filename:SKILL.md" --json repository,path,url --limit 100

# Claude Code plugin skills specifically
gh search code "plugin.json" "skills" --json repository,path,url --limit 100
```

### Filtering rules

1. Drop any hit from `a5c-ai/babysitter` (this repo).
2. Drop archived repos.
3. Dedupe by `repository.nameWithOwner`.
4. Group hits by repo -- one repo may contain many SKILL.md files.

### Enrichment

For each surviving repo:

```bash
gh api repos/<owner>/<name> \
  --jq '{nameWithOwner, description, stargazerCount: .stargazers_count, pushedAt: .pushed_at, topics, license: .license.spdx_id}'
```

Record the list of SKILL.md paths found per repo.

## Phase 2 -- Classification

For each repo, shallow-clone into `.a5c/tmp/skill-discovery/` and investigate the structure. Classify into exactly one archetype:

| Archetype | Description | Action |
|-----------|-------------|--------|
| `mega-skill-pack` | Repo exists to distribute many skills across domains | Deep-dive: catalog all skills, extract patterns |
| `methodology-repo` | Repo represents a specific workflow or methodology | Extract the methodology as a potential babysitter process |
| `internal-maintenance` | Skills exist only for the repo's own CI/dev workflow | **Skip** -- not transferable |
| `claude-plugin` | A Claude Code plugin with skills as part of its offering | Investigate plugin structure, extractable integrations |
| `domain-skill-pack` | Skills focused on a specific domain (e.g., data science, DevOps) | Extract domain processes and patterns |
| `utility-with-skill` | A tool/library that ships a SKILL.md for usage guidance | Extract the usage pattern as a potential shared process |
| `not-a-skill` | Repo uses SKILL.md as generic docs, no Claude Code connection | **Skip** -- no frontmatter, no agent context |

### Classification signals

Read the repo's top-level README, plugin.json (if present), directory structure, and a sample of SKILL.md files. Look for:

- **mega-skill-pack**: `skills/` directory with 5+ subdirectories, no primary application code
- **methodology-repo**: Process/workflow documentation dominates, SKILL.md describes a methodology
- **internal-maintenance**: SKILL.md references only internal paths, CI pipelines, repo-specific tooling
- **claude-plugin**: `.claude-plugin/plugin.json` or `plugin.json` with skill registrations
- **domain-skill-pack**: Skills all relate to one domain; directory structure groups by topic
- **utility-with-skill**: Repo is primarily a library/tool; SKILL.md is usage documentation

## Phase 3 -- Deep Research

For each non-skipped repo, produce research under `docs/reference-repos/[org]/[repo-name]/`. Create these files:

### `index.md` -- Overview and assessment

```markdown
# [org]/[repo-name]

- **Archetype**: mega-skill-pack | methodology-repo | claude-plugin | domain-skill-pack | utility-with-skill
- **Stars**: N
- **Last pushed**: YYYY-MM-DD
- **License**: MIT / Apache-2.0 / ...
- **Discovered**: YYYY-MM-DD
- **Skills found**: N

## Summary
<2-3 sentences on what the repo provides and why it's interesting>

## Assessment
<What is transferable? What is repo-specific? Quality of skill design?>

## Extraction Priority
- High / Medium / Low
- Rationale: <why>
```

### `skills-inventory.md` -- Catalog of all skills found

```markdown
# Skills Inventory: [org]/[repo-name]

| Skill | Path | Domain | Transferable? | Notes |
|-------|------|--------|---------------|-------|
| skill-name | skills/foo/SKILL.md | DevOps | Yes - pattern | Describes a CI/CD workflow |
| ... | ... | ... | ... | ... |
```

### `extractable-value.md` -- The core deliverable

Organized into sections:

```markdown
# Extractable Value: [org]/[repo-name]

## Processes
<Workflows that can be codified as babysitter JS processes>
- **Process name**: Description of what it does
  - Source: path/to/SKILL.md (lines N-M)
  - Inputs/Outputs: ...
  - Complexity: simple | moderate | complex
  - Notes: ...

## Plugin Ideas
<Integrations, harness tools, dev tools that could extend babysitter>
- **Idea name**: What it would do
  - Source evidence: ...
  - Integration surface: hook | command | skill | MCP tool

## Patterns and Wisdoms
<Reusable patterns, anti-patterns, naming conventions, structural insights>
- **Pattern name**: Description
  - Where observed: ...
  - How to apply in babysitter context: ...

## Implicit Procedural Knowledge
<Procedures that are described narratively in SKILL.md files but should be
codified as deterministic JS processes for the babysitter process library>
- **Procedure name**: What it accomplishes
  - Source: SKILL.md section or description text
  - Why codify: <what makes this better as a process than a skill>
  - Sketch: <brief outline of phases/tasks>
```

## Phase 4 -- Process Codification

For entries in the "Implicit Procedural Knowledge" section that are high-priority, scaffold a babysitter process file. Use the `process-builder` skill patterns from `.claude/skills/process-builder/SKILL.md`.

Process files go in `.a5c/processes/assimilated/` (not the main process library -- these are candidates for review). Use `.cjs` extension because `.a5c/package.json` sets `"type": "module"`:

```
.a5c/processes/assimilated/
├── [org]-[repo]-[process-name].cjs
└── ...
```

Each process must:
- Import `defineTask` from `@a5c-ai/babysitter-sdk`
- Export `async function process(inputs, ctx)`
- Include `@references` pointing back to the source SKILL.md
- Include `@process assimilated/[name]` tag
- Honour the source repo's license in the JSDoc header

## Phase 5 -- Maintain the master index

Keep `docs/reference-repos/README.md` as a top-level index:

```markdown
# Reference Repos

<!-- Generated by .claude/skills/assimilate-popular-workflows. Re-run to refresh. -->

Last refreshed: YYYY-MM-DD
Total repos tracked: N
Skipped (internal-maintenance): K

## By Archetype

### Mega Skill Packs
| Repo | Stars | Skills | Extraction Priority |
|------|-------|--------|---------------------|
| [org/name](index.md link) | N | M | High |

### Methodology Repos
...

### Claude Plugins
...

### Domain Skill Packs
...

### Utilities with Skills
...

## Recently Assimilated Processes

| Process | Source Repo | Status |
|---------|------------ |--------|
| [name](.a5c/processes/assimilated/file.cjs) | org/repo | Draft |
```

## Notes

- Never copy SKILL.md content wholesale. Extract the *procedural insight*, not the prose.
- Respect source licenses. Include attribution in every extracted process file.
- Skills that are purely prompt-engineering (just a system prompt with no procedure) have no extractable process value -- note them as `not-transferable` in the inventory.
- The `internal-maintenance` archetype is the most common. Expect 60-70% of hits to be skipped.
- Rate-limit awareness: `gh search code` is throttled at 30 req/min. Split searches by language qualifier if hitting caps.
- When a repo has already been researched (directory exists under `docs/reference-repos/`), update in-place rather than recreating. Compare `pushedAt` dates to decide if re-investigation is needed.
- For very large skill packs (20+ skills), sample the most-starred or most-recently-updated skills rather than researching all of them in a single pass.
- After completing research, suggest the user run `/babysitter:contrib` for any upstream-worthy process candidates.
- See `references/classification-heuristics.md` for detailed archetype classification examples and edge cases.
