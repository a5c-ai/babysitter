---
name: assimilate-popular-workflows
description: This skill should be used when the user asks to "find skills in the wild", "assimilate popular workflows", "discover SKILL.md files in repos", "research external skills", "find workflow patterns", "survey the skill landscape", "what skills exist out there", or wants to investigate public repositories for extractable processes, babysitter plugins, and reusable procedural insights. Searches GitHub for SKILL.md files, classifies repos by archetype, and maintains structured research under docs/reference-repos/.
---

# Assimilate Popular Workflows

Search public GitHub repositories for SKILL.md files, classify each repo by archetype, and maintain structured research documents under `docs/reference-repos/[org]/[repo-name]/`. The goal is not to copy skills verbatim but to extract transferable value: processes for the babysitter process library, babysitter marketplace plugin ideas, and implicit procedural knowledge that can be codified into babysitter JS processes.

### Process Library Placement Rules

Extracted processes go into the babysitter process library (`plugins/babysitter/skills/babysit/process/`). Placement depends on scope:

| What it is | Where it goes | Examples |
|------------|---------------|---------|
| Full generic dev methodology (entire workflow paradigm) | `methodologies/<name>/` | agile, gsd, tdd, scrum, kanban, waterfall |
| Common cross-domain pattern (reusable across many specializations) | `specializations/shared/` | audit-pipeline, expert-advisory, progressive-disclosure |
| Domain-specific process | `specializations/<domain>/` | security-compliance, devops-sre-platform, data-science-ml |

**Important**: Do NOT place domain-specific processes in `methodologies/`. Only full, generic development methodologies belong there. A "k8s security audit" is `specializations/security-compliance/`, not a methodology. A "deep research pipeline" is `specializations/shared/` (cross-domain). A "TDD agent workflow" is `methodologies/atdd-tdd/` (full dev methodology).

### Plugin Ideas = Babysitter Marketplace Plugins

A babysitter plugin is a set of natural language instructions (markdown) or deterministic coded processes (JS) that an AI agent reads and executes to install a modular set of capabilities. A plugin contains at minimum `install.md` with instructions the AI agent follows to modify the user's project. See `docs/plugins.md` for the full specification.

When identifying plugin ideas, think about what could be distributed as an installable package:
- An `install.md` that interviews the user about their project, detects their stack, and installs relevant processes/configs/hooks
- A `configure.md` for reconfiguration
- Processes copied from the library into `.a5c/processes/`
- ESLint rules, git hooks, CI/CD templates, tool configs
- Migration files for version upgrades

**Valid plugin use case categories** (derived from the existing marketplace):

| Category | What the plugin installs | Examples |
|----------|-------------------------|----------|
| Security & Sandboxing | Lint rules, git hooks, scanning processes, sandboxing policies | basic-security, agentsh |
| Context & Memory | MCP servers for memory, lifecycle hooks for auto-capture | claude-mem, mempalace |
| Knowledge Management | Wiki systems, knowledge graphs, semantic search engines | llm-wiki, graphify, qmd |
| Developer Experience & UX | Status indicators, session landing pages, skill recommenders | ctx, status-line, welcome |
| Tools Integration | Browser automation, external tool integration, MCP tools for new capabilities | dev-browser, prompt-master |
| CI/CD Integration | GitHub Actions workflows, harness-specific pipeline templates | github-actions-cicd-* |
| DevOps & Infrastructure | IaC templates, deployment configs, cloud provider setup | project-deployment |
| Quality Assurance & Testing | Test frameworks, coverage gates, linting configs, pre-commit hooks | testing-suite |
| Workflow Automation | Rate limit handling, auto-retry logic, lifecycle event hooks | rate-limit-handler |
| Theming & Environment | Sound hooks, design systems, conversational personality, themed assets | themes, sound-hooks |
| Harness Integration | Alternative harness adapters, TUI improvements, orchestration frameworks | opencode-adapter, workflow-orchestration |

**IMPORTANT DISTINCTION**: Do NOT confuse babysitter marketplace plugins with harness assimilation:
- **Babysitter marketplace plugins**: Install INTO user projects via `install.md` to add capabilities
- **Harness assimilation**: Create plugins FOR other harnesses (like hermes-agent) that integrate babysitter INTO those harnesses

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

### Topic-based discovery

Search for repos tagged with relevant GitHub topics. These are high-signal candidates even without SKILL.md files:

```bash
# Search by topic tags (each is a separate query)
for topic in claude-code claude-skills mcp agentic-workflow agent-skills skills agent-harness ai-agents; do
  gh search repos --topic "$topic" --stars=">50" --sort stars --limit 50 --json fullName,stargazersCount,description
done

# Combined keyword + star searches for broader coverage
gh search repos "agent skill" --stars=">50" --sort stars --limit 50 --json fullName,stargazersCount,description
gh search repos "claude code skills" --stars=">100" --sort stars --limit 30 --json fullName,stargazersCount,description
gh search repos "workflow automation skill" --stars=">100" --sort stars --limit 30 --json fullName,stargazersCount,description
```

Topic-tagged repos that lack SKILL.md files may still contain extractable processes or plugin ideas if they implement multi-step workflows, domain pipelines, or tool integrations. Classify and research them using the same Phase 2/3 pipeline.

### Marketplace/registry discovery

Browse public skill and plugin registries for high-download or featured entries. These surface popular repos that may not appear in GitHub search:

- **ClawHub Skills**: https://clawhub.ai/skills?sort=downloads -- browse top skills by download count. Each skill links to a GitHub repo. Extract repo URLs and cross-reference with the tracked set.
- **ClawHub Plugins**: https://clawhub.ai/plugins -- browse plugins by popularity. Each plugin links to a GitHub repo. Extract repo URLs and cross-reference.

Use a browser tool or `curl` to fetch these pages and extract GitHub repo links. For each new repo found, enrich and classify using the standard pipeline.

### Filtering rules

1. Drop any hit from `a5c-ai/babysitter` (this repo).
2. **Handle archived/moved repos.** If a repo is archived, check for a successor/migration notice. If the archive points to a new location (e.g., "moved to org/new-repo"), skip the archived repo and evaluate the new location instead. Only track active, maintained repositories.
3. **Drop repos without a permissive license.** Only track repos with MIT, BSD (2-clause or 3-clause), or Apache-2.0 licenses. Drop repos with GPL, AGPL, CC-NC, CC-SA, proprietary, or no license specified. Check `license.spdx_id` during enrichment.
4. Dedupe by `repository.nameWithOwner`.
5. Group hits by repo -- one repo may contain many SKILL.md files.
6. **Prefer repos with 50+ stars.** Lower-star repos may be included only if they contain exceptionally novel processes not found elsewhere. Use `gh search repos` with `--stars=">50"` to find higher-quality repos.

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
| `other-harness` | Skill is specific to a non-Claude harness (Codex, Cursor, etc.) or focused on harness invocation/CLI orchestration | **Skip** -- not transferable to babysitter processes |
| `claude-plugin` | A Claude Code plugin with skills as part of its offering | Investigate plugin structure, extractable integrations |
| `harness-framework` | Alternative AI coding harness/framework (OpenCode, Antigravity, etc.) or Claude Code orchestration/TUI improvements | Extract for harness assimilation (new adapter + plugin) and/or TUI/orchestration improvements |
| `domain-skill-pack` | Skills focused on a specific domain (e.g., data science, DevOps) | Extract domain processes and patterns |
| `utility-with-skill` | A tool/library that ships a SKILL.md for usage guidance | Extract the usage pattern as a potential shared process |
| `not-a-skill` | Repo uses SKILL.md as generic docs, no Claude Code connection | **Skip** -- no frontmatter, no agent context |

### Classification signals

Read the repo's top-level README, plugin.json (if present), directory structure, and a sample of SKILL.md files. Look for:

- **mega-skill-pack**: `skills/` directory with 5+ subdirectories, no primary application code
- **methodology-repo**: Process/workflow documentation dominates, SKILL.md describes a methodology
- **internal-maintenance**: SKILL.md references only internal paths, CI pipelines, repo-specific tooling
- **other-harness**: Skill is for Codex, Cursor, or another non-Claude harness; or focuses on CLI orchestration / harness invocation patterns
- **claude-plugin**: `.claude-plugin/plugin.json` or `plugin.json` with skill registrations
- **harness-framework**: CLI executable for AI interaction (like `opencode`, `antigravity`), or Claude Code orchestration/TUI/hook improvements (workflow automation, delegation frameworks, status line enhancements)
- **domain-skill-pack**: Skills all relate to one domain; directory structure groups by topic
- **utility-with-skill**: Repo is primarily a library/tool; SKILL.md is usage documentation

## Phase 3 -- Deep Research

For each non-skipped repo, produce a single `research.md` file containing overview, assessment, and extractable value.

**Harness Capability Verification**: For repos classified as `harness-framework`, verify three critical capabilities for babysitter integration:
1. **Custom Tools/MCP**: Can execute custom tools, MCP servers, or bash commands
2. **Stop Hooks**: Has stop-hooks or end-turn hooks to interrupt agent conversation for feedback
3. **Plugin System**: Plugin/extension system with manifests and optionally marketplace

Use WebSearch/WebFetch to research the harness documentation and verify these capabilities. Stop hooks are CRITICAL - without them, babysitter's orchestration loop cannot function (harness must be interruptible between iterations for feedback).

### Directory layout

- **GitHub-sourced repos**: `docs/reference-repos/[org]/[repo-name]/research.md`
- **ClawHub-sourced skills/plugins**: `docs/reference-repos/clawhub/[author]/[skill-name]/research.md`

Each tracked repo gets exactly **one file** (`research.md`) in its directory. Do not split into multiple files (no separate `index.md` or `extractable-value.md`).

### `research.md` -- Unified research document

```markdown
# [org]/[repo-name]

- **Archetype**: mega-skill-pack | methodology-repo | claude-plugin | domain-skill-pack | utility-with-skill
- **Stars**: N
- **Last pushed**: YYYY-MM-DD
- **License**: MIT / Apache-2.0 / BSD-2-Clause / BSD-3-Clause
- **Discovered**: YYYY-MM-DD
- **Source**: gh-search | clawhub-skills | clawhub-plugins | topic:X
- **Skills found**: N

## Summary
<2-3 sentences on what the repo provides and why it's interesting>

## Assessment
<What is transferable? What is repo-specific? Quality of skill design?
Look beyond methodologies -- domain-specific skills (DevOps, security, frontend, data, etc.)
often contain multi-step processes extractable as specializations/<domain>/ entries.
A "kubernetes-specialist" skill may encode a k8s deployment audit process.
A "debugging-wizard" may encode a systematic debugging process.
For harness-framework repos, assess: TUI/orchestration improvements for our internal agent harness,
CLI patterns for new harness adapter creation, and workflow automation patterns.
Assess each skill for procedural content, not just methodology content.>

## Extraction Priority
- High / Medium / Low
- Rationale: <why>

## Skills Inventory

| Skill | Path | Domain | Transferable? | Notes |
|-------|------|--------|---------------|-------|
| skill-name | skills/foo/SKILL.md | DevOps | Yes - pattern | Describes a CI/CD workflow |

## Processes
<Workflows that can be codified as babysitter JS processes.
Domain-specific skills are prime extraction targets -- a "react-expert" skill may contain
a component architecture review process (specializations/frontend/), a "terraform-engineer"
may contain an IaC audit process (specializations/devops-sre-platform/), etc.
Don't dismiss domain skills as "just expert personas" -- read them for procedural content.>
- **Process name**: Description of what it does
  - Source: path/to/SKILL.md (lines N-M)
  - Placement: methodologies/<name> | specializations/shared | specializations/<domain>
  - Inputs/Outputs: ...
  - Complexity: simple | moderate | complex
  - Notes: ...

## Plugin Ideas
<Ideas for babysitter marketplace plugins -- installable packages with install.md
that an AI agent executes to set up capabilities in a user's project>
- **Plugin name**: What it installs and configures
  - What install.md would do: <what the AI agent does during install -- detect stack, interview user, copy processes, set up hooks/configs>
  - Processes it would copy: <which process library entries>
  - Configs/hooks it would create: <ESLint rules, git hooks, CI/CD templates, etc.>
  - Source evidence: <what in the repo inspires this plugin idea>

## Harness Integration Ideas
<For harness-framework repos: ideas for new harness adapters and TUI improvements>
- **Harness Adapter**: New harness integration (like plugins/babysitter-codex for Codex)
  - Adapter implementation: <what would go in packages/sdk/src/harness/adapters/>
  - Plugin structure: <what would go in plugins/babysitter-[harness]/>
  - CLI integration: <command patterns, flag mapping, capability detection>
- **Harness Assimilation**: Plugin FOR the target harness that integrates babysitter (NOT a babysitter marketplace plugin)
  - **Capability Assessment**: Verify the harness supports babysitter's orchestration requirements:
    | Capability | Status | Details |
    |------------|---------|---------|
    | **Custom Tools/MCP** | ✅/⚠️/❌ | Can the harness execute custom tools, MCP servers, or bash commands? |
    | **Stop Hooks** | ✅/⚠️/❌ | Does it have stop-hooks or end-turn hooks to interrupt agent conversation for feedback? |
    | **Plugin System** | ✅/⚠️/❌ | Plugin/extension system with manifests and optionally marketplace? |
  - **Integration Viability**: EXCELLENT/GOOD/PARTIAL/POOR based on capabilities (stop hooks are CRITICAL)
  - Target harness plugin: <plugin that goes into the other harness to bring babysitter capabilities>
  - Babysitter integration: <how the other harness would invoke babysitter processes>
  - Capability bridge: <what babysitter features would be accessible from the target harness>
  - Major limitations: <any critical missing capabilities that would prevent full integration>
- **TUI/Orchestration Improvement**: Enhancement to our internal agent harness
  - Current limitation: <what our harness lacks that this repo provides>
  - Integration approach: <how to incorporate the improvement>
  - Implementation scope: <where in our codebase this would go>

## Implicit Procedural Knowledge
<Procedures that are described narratively in SKILL.md files but should be
codified as deterministic JS processes for the babysitter process library>
- **Procedure name**: What it accomplishes
  - Source: SKILL.md section or description text
  - Placement: methodologies/<name> | specializations/shared | specializations/<domain>
  - Why codify: <what makes this better as a process than a skill>
  - Sketch: <brief outline of phases/tasks>
```

## Phase 4 -- Process Codification

For entries in the "Implicit Procedural Knowledge" section that are high-priority, scaffold a babysitter process file. Use the `process-builder` skill patterns from `.claude/skills/process-builder/SKILL.md`.

Process files go in `.a5c/processes/assimilated/` as staging candidates. After review, they are promoted into the process library at their designated placement path.

```
.a5c/processes/assimilated/
├── [org]-[repo]-[process-name].cjs          # Staged candidate
└── ...

# After review, promoted to process library:
# methodologies/<name>/                       # Full generic dev methodologies only
# specializations/shared/                     # Cross-domain reusable patterns
# specializations/<domain>/                   # Domain-specific processes
```

Use `.cjs` extension because `.a5c/package.json` sets `"type": "module"`.

Each process must:
- Import `defineTask` from `@a5c-ai/babysitter-sdk`
- Export `async function process(inputs, ctx)`
- Include `@references` pointing back to the source SKILL.md
- Include `@process assimilated/[name]` tag
- Include `@placement` tag indicating the target library path (e.g. `@placement specializations/security-compliance/k8s-audit`)
- Honour the source repo's license in the JSDoc header

## Phase 5 -- Maintain indexes and history

Maintain three files in `docs/reference-repos/` alongside the per-repo research directories:

### `README.md` -- Master index of tracked repos

The main index of all repos with extractable value. Only repos that have research docs with at least one extractable process or plugin idea belong here.

```markdown
# Reference Repos

<!-- Generated by .claude/skills/assimilate-popular-workflows. Re-run to refresh. -->

Last refreshed: YYYY-MM-DD
Total repos tracked: N

## By Archetype

### Mega Skill Packs
| Repo | Stars | Skills | Extraction Priority |
|------|-------|--------|---------------------|
| [org/name](org/name/research.md) | N | M | High |

### Methodology Repos
...

### Claude Plugins
...

### Domain Skill Packs
...

### Utilities with Skills
...
```

### `backlog.md` -- Candidate repos to investigate

Repos discovered during Phase 1 that haven't been investigated yet. Append new candidates here during discovery; remove them once classified and either tracked (moved to README.md) or rejected (moved to processed.md).

```markdown
# Candidate Backlog

| Repo | Stars | Source | Notes | Added |
|------|-------|--------|-------|-------|
| org/name | N | gh-search / clawhub / topic:X | Brief note on why it's a candidate | YYYY-MM-DD |
```

### `processed.md` -- History of all evaluated repos

Every repo that has been investigated goes here, regardless of outcome. This prevents re-processing the same repo in future discovery runs. Include the classification result and reason for skipping (if skipped).

```markdown
# Processed Repos

| Repo | Stars | Archetype | Outcome | Date |
|------|-------|-----------|---------|------|
| org/name | N | mega-skill-pack | Tracked -- 3 processes, 2 plugins | YYYY-MM-DD |
| org/other | M | internal-maintenance | Skipped -- no transferable value | YYYY-MM-DD |
| org/another | K | not-a-skill | Skipped -- generic docs, no agent context | YYYY-MM-DD |
```

### Cleanup rules

- **Do NOT keep research directories for skipped repos with no extractable value.** If a repo is classified as `internal-maintenance`, `other-harness`, `not-a-skill`, or otherwise has zero extractable processes and zero plugin ideas, record it in `processed.md` only. Do not create a directory under `docs/reference-repos/`.
- **Only create `research.md`** for repos that have at least one extractable process or plugin idea. Each repo gets exactly one file (`research.md`), not separate index/extractable-value files.
- When re-running discovery, check `processed.md` first to skip already-evaluated repos.
- **License must be verified.** Every `research.md` must include the license field. During enrichment, extract `license.spdx_id` from the GitHub API. If the license is not MIT, BSD, or Apache-2.0, skip the repo and record it in `processed.md` with the reason.

## Notes

- Never copy SKILL.md content wholesale. Extract the *procedural insight*, not the prose.
- Respect source licenses. Include attribution in every extracted process file.
- Skills that are purely prompt-engineering (just a system prompt with no procedure) have no extractable process value -- note them as `not-transferable` in the inventory.
- **Domain-specific skills are extraction targets, not just methodologies.** A "kubernetes-specialist" skill may contain a k8s deployment audit process (`specializations/devops-sre-platform/`). A "react-expert" may contain a component architecture review (`specializations/frontend/`). A "debugging-wizard" may contain a systematic debugging process (`specializations/shared/`). Always read domain skills for multi-step procedural content before dismissing them as "expert personas." The process library has three placement tiers: `methodologies/` (full dev paradigms), `specializations/shared/` (cross-domain patterns), and `specializations/<domain>/` (domain-specific processes). Most extracted value goes into specializations, not methodologies.
- **Skip skill-management processes** (skill-routing, skill-discovery pipelines, skill-validation, skill-metadata checks). These are babysitter-internal concerns, not transferable domain processes. Their associated *plugin ideas* (e.g., a skill-registry-browser plugin) may still be valid.
- **Skip multi-model coordination processes** (multi-model review, heterogeneous AI team orchestration). Babysitter's harness adapter system already handles multi-model dispatch natively. These don't add value as library processes.
- **Skip patterns already covered by the SDK**: human-in-the-loop review cycles (covered by breakpoints), harness CLI invocation/degradation (covered by harness adapters), effect dispatch coordination (covered by the runtime). Only extract processes that add *domain-specific* or *workflow-specific* value beyond what the SDK primitives provide.
- **Memory systems are always plugins, never processes.** Memory management (tiered storage, decay, reflection, promotion) belongs in the Context & Memory plugin category. Do not place memory-related workflows in the process library -- they are plugin-internal logic installed via `install.md`.
- The `internal-maintenance` archetype is the most common. Expect 60-70% of hits to be skipped.
- Rate-limit awareness: `gh search code` is throttled at 30 req/min. Split searches by language qualifier if hitting caps.
- When a repo appears in `processed.md`, skip it unless explicitly asked to re-evaluate. For tracked repos (directory exists under `docs/reference-repos/`), compare `pushedAt` dates to decide if re-investigation is needed -- update in-place rather than recreating.
- For very large skill packs (20+ skills), sample the most-starred or most-recently-updated skills rather than researching all of them in a single pass.
- After completing research, suggest the user run `/babysitter:contrib` for any upstream-worthy process candidates.
- See `references/classification-heuristics.md` for detailed archetype classification examples and edge cases.
