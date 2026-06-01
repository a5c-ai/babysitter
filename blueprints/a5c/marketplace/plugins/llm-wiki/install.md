# LLM Wiki -- Install Instructions

Turn your project (or your global workspace) into a structured knowledge base that your AI agent can ingest into, query from, and maintain -- based on [Andrej Karpathy's LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).

The wiki has three layers:

- **Raw sources** (`raw/`) -- original documents, PDFs, URLs, notes dropped in for processing
- **Wiki pages** (`wiki/`) -- clean, structured markdown distilled from raw sources
- **Schema** (`schema.md`) -- the ontology defining what types of pages exist and how they link

Plus operational files: `index.md` (master table of contents) and `log.md` (changelog of all wiki operations).

---

## Step 1: Interview the User

Before creating anything, gather these preferences through a conversational interview. Ask questions **one at a time**.

### 1.1 Domain and Purpose

Ask:

1. **What domain or topic will this wiki cover?** Examples:
   - A specific project's architecture and decisions
   - A technology area (e.g., "machine learning", "distributed systems")
   - A personal knowledge base (everything you learn)
   - A team's institutional knowledge
   - A research area or literature review
   - Something else (ask what)

2. **What's the primary goal?** Pick or expand:
   - **Reference** -- look things up quickly ("how does X work?", "what did we decide about Y?")
   - **Learning** -- build understanding over time ("teach me about X", accumulate insights)
   - **Decision log** -- capture rationale ("why did we choose X over Y?")
   - **Literature/source tracking** -- organize and summarize external materials
   - **Mixed** -- combination of the above

### 1.2 Scope: Project vs Global

Ask:

1. **Where should the wiki live?**
   - **Project** (`<projectDir>/.a5c/wiki/`) -- scoped to this repository, checked into git (or gitignored -- ask)
   - **Global** (`~/.a5c/wiki/`) -- available across all projects, personal knowledge base
   - **Both** -- a global wiki for general knowledge + a project wiki for project-specific knowledge

2. If project scope: **Should the wiki be committed to git?**
   - Yes (default) -- team can share and contribute
   - No -- add to `.gitignore`, personal workspace only

### 1.3 Schema Design

Ask:

1. **What kinds of pages should exist in your wiki?** Suggest defaults based on their domain, then let them customize. Examples:
   - For a **project wiki**: `concept`, `decision`, `how-to`, `component`, `api`, `glossary`, `troubleshooting`
   - For a **learning wiki**: `concept`, `technique`, `paper-summary`, `comparison`, `mental-model`, `example`
   - For a **research wiki**: `paper`, `concept`, `experiment`, `dataset`, `finding`, `open-question`
   - For a **team wiki**: `process`, `decision`, `onboarding`, `runbook`, `faq`, `meeting-notes`
   - Custom kinds are welcome

2. **What metadata should each page track?** Suggest defaults:
   - `title`, `created`, `updated`, `tags`, `kind` (always included)
   - `source` (URL or file reference)
   - `confidence` (high/medium/low/speculative)
   - `related` (links to other pages)
   - Custom fields

### 1.4 Ingest Preferences

Ask:

1. **How should new material be ingested?**
   - **Interactive** -- agent asks clarifying questions while processing each source ("What aspect of this paper matters most to you?")
   - **Automatic** -- agent processes raw sources silently, creates wiki pages, logs operations
   - **Both** -- auto-ingest by default, interactive for complex or ambiguous sources
   - Default: both

2. **What source types will you commonly ingest?**
   - Markdown files / text documents
   - URLs / web pages
   - PDFs
   - Code files (extract architecture, patterns, decisions)
   - Conversation transcripts / meeting notes
   - Research papers
   - Other (ask what)

### 1.5 Query and Search

Ask:

1. **Do you want the `qmd` search plugin installed for semantic search over wiki pages?**
   - If they already have `qmd` installed, skip this -- just configure it to index the wiki
   - If not, offer to install it alongside (optional dependency, not required)
   - Default: recommend yes if the wiki will grow beyond ~50 pages

2. **Should the agent proactively reference the wiki when answering questions?** (via CLAUDE.md / AGENTS.md instruction)
   - Yes (default) -- agent checks wiki before answering domain questions
   - No -- only query wiki when explicitly asked

### 1.6 Maintenance Preferences

Ask:

1. **Should the agent periodically lint the wiki?** (check for orphan pages, broken links, stale content, schema violations)
   - Yes (default) -- include a `/wiki-lint` skill
   - No

2. **Display preferences for wiki operations:**
   - **Verbose** -- show full details of what was ingested, created, linked
   - **Standard** -- summary of operations performed
   - **Quiet** -- minimal output
   - Default: standard

---

## Step 2: Research the Environment

Before creating the wiki structure, investigate the current environment.

### 2.1 Existing Knowledge Artifacts

```bash
# Check for existing documentation
ls README.md CONTRIBUTING.md ARCHITECTURE.md docs/ wiki/ 2>/dev/null
ls .a5c/wiki/ 2>/dev/null

# Check for existing CLAUDE.md / AGENTS.md
ls CLAUDE.md AGENTS.md GEMINI.md .claude/ .cursor/ 2>/dev/null

# Check for existing skills
ls .a5c/skills/ 2>/dev/null
ls ~/.a5c/skills/ 2>/dev/null
```

### 2.2 Tool Availability

```bash
# Check for qmd (semantic search)
command -v qmd 2>/dev/null && echo "qmd available" || echo "qmd not installed"

# Check for babysitter
command -v babysitter 2>/dev/null && echo "babysitter available" || echo "babysitter not installed"

# Check platform
uname -s 2>/dev/null || echo "Windows"
```

### 2.3 Project Context (if project scope)

```bash
# Detect project type for schema suggestions
ls package.json setup.py Cargo.toml go.mod pom.xml 2>/dev/null
git remote -v 2>/dev/null | head -1
```

### 2.4 Compile and Confirm

Present a summary to the user:

> **Wiki Configuration:**
> - Domain: [from interview]
> - Location: [project / global / both] at [path]
> - Git-tracked: [yes/no]
> - Page kinds: [list]
> - Metadata fields: [list]
> - Ingest mode: [interactive / automatic / both]
> - Search: [qmd / basic grep / none]
> - Proactive referencing: [yes/no]
> - Lint skill: [yes/no]
>
> **Will create:** [list of files and skills]

Get user approval before proceeding.

---

## Step 3: Create Directory Structure

Based on the scope chosen in the interview:

**For project scope:**
```bash
WIKI_ROOT=".a5c/wiki"
mkdir -p "$WIKI_ROOT/raw"
mkdir -p "$WIKI_ROOT/wiki"
```

**For global scope:**
```bash
WIKI_ROOT="$HOME/.a5c/wiki"
mkdir -p "$WIKI_ROOT/raw"
mkdir -p "$WIKI_ROOT/wiki"
```

**For both scopes**, create both directories.

---

## Step 4: Create Schema

Create `$WIKI_ROOT/schema.md` defining the wiki's ontology. **Customize this based on the interview answers** -- do not use a generic template.

Example structure (adapt page kinds, fields, and linking rules to what the user chose):

```markdown
# Wiki Schema

## Page Kinds

### concept
A core idea, pattern, or principle.
Required fields: title, created, tags
Optional fields: source, confidence, related

### decision
A recorded decision with rationale and alternatives considered.
Required fields: title, created, tags, status (proposed|accepted|deprecated)
Optional fields: source, related, supersedes

### how-to
Step-by-step instructions for a specific task.
Required fields: title, created, tags
Optional fields: prerequisites, related

[...additional kinds from interview...]

## Linking Rules

- Every page MUST have a `kind` matching one of the above
- Every page SHOULD link to at least one related page via `related` frontmatter
- Decisions SHOULD reference the concepts they affect
- How-tos SHOULD reference the concepts they implement

## Metadata Format

All pages use YAML frontmatter:

` ``yaml
---
title: Page Title
kind: concept
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [tag1, tag2]
source: https://example.com (optional)
confidence: high (optional)
related: [other-page-slug] (optional)
---
` ``

## Naming Convention

File names use kebab-case slugs: `my-page-title.md`
```

---

## Step 5: Create Index and Log

Create `$WIKI_ROOT/index.md`:

```markdown
# Wiki Index

> Domain: [from interview]
> Created: [date]
> Schema: [./schema.md](schema.md)

## Pages

_No pages yet. Use `/wiki-ingest` to add content._

## By Kind

_Will be populated as pages are added._

## Recent

_Will be populated as pages are added._
```

Create `$WIKI_ROOT/log.md`:

```markdown
# Wiki Operations Log

| Date | Operation | Details |
|------|-----------|---------|
| [today] | init | Wiki created with schema: [list of kinds] |
```

---

## Step 6: Create Skills

Create skills based on the wiki scope. For **project scope**, create in `.a5c/skills/`. For **global scope**, create in `~/.a5c/skills/`.

### 6.1 Wiki Ingest Skill

Create `[skills_dir]/wiki-ingest/SKILL.md`:

```markdown
---
name: wiki-ingest
description: Ingest raw material into the LLM wiki -- processes documents, URLs, code, or notes into structured wiki pages following the schema. Use when the user says "add to wiki", "ingest this", "wiki this", or drops content for knowledge capture.
---

# Wiki Ingest

Process raw material into structured wiki pages.

## Ingest Workflow

1. **Receive source material** -- the user provides text, a file path, a URL, or drops a file into `[WIKI_ROOT]/raw/`
2. **Read the schema** at `[WIKI_ROOT]/schema.md` to understand page kinds and metadata requirements
3. **Analyze the source** -- determine what kind(s) of wiki pages it should produce
4. [IF INTERACTIVE MODE] **Ask the user**: "This looks like it could be a [kind]. What aspects matter most to you? Any specific tags?"
5. **Create wiki page(s)** in `[WIKI_ROOT]/wiki/` with proper YAML frontmatter matching the schema
6. **Update the index** -- add new pages to `[WIKI_ROOT]/index.md` under the appropriate sections
7. **Log the operation** -- append to `[WIKI_ROOT]/log.md`
8. **Link related pages** -- scan existing pages for related content and add `related` links in both directions
9. **Store raw source** -- if the source is a file or captured text, save/move it to `[WIKI_ROOT]/raw/` for provenance

## Page Creation Guidelines

- One concept per page (split multi-topic sources into multiple pages)
- Use the exact frontmatter format from schema.md
- Write in clear, scannable prose -- headers, bullet points, code blocks
- Include source attribution
- Cross-reference related pages using relative markdown links
- File names: kebab-case slug matching the title

## Example

Input: "Add this to the wiki: React Server Components let you render components on the server..."

Output: Creates `[WIKI_ROOT]/wiki/react-server-components.md` with appropriate frontmatter and content.
```

**Customize the skill** based on interview answers:
- Replace `[WIKI_ROOT]` with the actual path
- If ingest mode is "automatic", remove the interactive step
- If ingest mode is "interactive", emphasize the clarification step
- Add source-type-specific handling based on what they said they'd commonly ingest

### 6.2 Wiki Query Skill

Create `[skills_dir]/wiki-query/SKILL.md`:

```markdown
---
name: wiki-query
description: Search and retrieve information from the LLM wiki. Use when the user asks questions that the wiki might answer, says "check the wiki", "what do we know about X", or needs to look up a decision, concept, or how-to.
---

# Wiki Query

Search the LLM wiki for relevant information.

## Query Workflow

1. **Parse the question** -- identify key concepts, entities, or topics
2. **Search strategy**:
   a. Check `[WIKI_ROOT]/index.md` for relevant pages by title/kind
   b. Search page content with grep/ripgrep for keyword matches
   c. [IF QMD AVAILABLE] Use `qmd search "[query]" --collection wiki` for semantic search
3. **Read matching pages** -- load the most relevant pages
4. **Synthesize answer** -- combine information from multiple pages if needed, citing sources
5. **Show provenance** -- reference which wiki pages informed the answer

## Search Tips

- Start with the index for broad queries
- Use kind-specific searches: "find all decisions about X"
- Check `related` links to discover connected pages
- If no results, suggest the user ingest relevant material
```

**Customize**: Replace `[WIKI_ROOT]`, add/remove qmd integration based on interview.

### 6.3 Wiki Lint Skill (if requested)

Create `[skills_dir]/wiki-lint/SKILL.md` only if the user requested it:

```markdown
---
name: wiki-lint
description: Check the LLM wiki for quality issues -- orphan pages, broken links, schema violations, stale content, and missing metadata. Use when the user says "lint the wiki", "check wiki health", or periodically for maintenance.
---

# Wiki Lint

Audit the wiki for structural and content quality issues.

## Lint Checks

1. **Schema compliance** -- every page in `[WIKI_ROOT]/wiki/` has valid frontmatter matching `schema.md`
2. **Orphan detection** -- pages not linked from `index.md` or any other page
3. **Broken links** -- `related` references pointing to non-existent pages
4. **Index sync** -- all pages in `wiki/` are listed in `index.md` and vice versa
5. **Stale content** -- pages not updated in >90 days (flag, don't auto-fix)
6. **Missing metadata** -- required fields from schema that are empty or missing
7. **Naming convention** -- file names match kebab-case slug convention
8. **Duplicate detection** -- pages covering the same topic

## Output

Report issues grouped by severity:
- **Error**: schema violations, broken links, orphans
- **Warning**: stale content, missing optional metadata
- **Info**: suggestions for better linking or organization

Offer to auto-fix what can be fixed (update index, add missing dates, fix naming).
```

---

## Step 7: Configure Agent Instructions

Based on scope, add wiki awareness to the appropriate instruction file.

### For project scope

Read the existing `CLAUDE.md` (or `AGENTS.md` / `GEMINI.md` if those are the primary instruction files). **Merge** the following section -- do not overwrite existing content:

```markdown
## LLM Wiki

This project has a structured knowledge wiki at `.a5c/wiki/`.

- **Schema**: `.a5c/wiki/schema.md` -- defines page kinds and metadata format
- **Index**: `.a5c/wiki/index.md` -- master table of contents
- **Pages**: `.a5c/wiki/wiki/` -- structured markdown pages with YAML frontmatter
- **Raw sources**: `.a5c/wiki/raw/` -- unprocessed source material
- **Log**: `.a5c/wiki/log.md` -- operations changelog

[IF PROACTIVE REFERENCING] When answering questions about [domain], check the wiki first. Use `/wiki-query` to search for relevant pages before relying on general knowledge.

[IF INGEST ENABLED] When the user shares knowledge, documents, or decisions relevant to [domain], offer to ingest them into the wiki with `/wiki-ingest`.
```

### For global scope

Add similar content to `~/.claude/CLAUDE.md` (the user's global instruction file), adjusting paths to `~/.a5c/wiki/`.

---

## Step 8: Configure Search Integration (Optional)

If the user chose qmd integration and qmd is installed:

```bash
# Add wiki as a qmd collection
qmd collection add wiki --path "[WIKI_ROOT]/wiki/" --watch 2>/dev/null || echo "qmd collection setup skipped"
```

If qmd is not installed but the user wants it, suggest installing the `qmd` plugin:
> To enable semantic search over your wiki, install the qmd plugin: `/babysitter:plugins install qmd`

---

## Step 9: Configure Git (if project scope and git-tracked)

If the user chose to track the wiki in git:

```bash
# Ensure the wiki directory is not gitignored
git check-ignore .a5c/wiki/ 2>/dev/null && echo "WARNING: .a5c/wiki/ is gitignored -- remove the ignore rule to track it" || echo "OK: wiki will be tracked by git"
```

If the user chose NOT to track in git:

Add to `.gitignore`:
```
# LLM Wiki (local only)
.a5c/wiki/
```

---

## Step 10: Seed Initial Content (Optional)

If the project has existing documentation, offer to bootstrap the wiki:

1. Scan for `README.md`, `ARCHITECTURE.md`, `docs/`, `CONTRIBUTING.md`, `CHANGELOG.md`
2. Ask the user which documents to ingest as initial wiki pages
3. Process each through the ingest workflow (Step 6.1)
4. Update index and log

This is optional -- if the user declines, the wiki starts empty and grows organically.

---

## Step 11: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name llm-wiki --plugin-version 1.0.0 --marketplace-name babysitter --[project|global] --json
```

Use `--project` or `--global` matching the scope from the interview. If both scopes, register at project level.

---

## Step 12: Verify

Test the installation:

```bash
# Check directory structure
ls [WIKI_ROOT]/
ls [WIKI_ROOT]/raw/
ls [WIKI_ROOT]/wiki/
cat [WIKI_ROOT]/schema.md
cat [WIKI_ROOT]/index.md
cat [WIKI_ROOT]/log.md

# Check skills are discoverable
ls [skills_dir]/wiki-ingest/SKILL.md
ls [skills_dir]/wiki-query/SKILL.md
ls [skills_dir]/wiki-lint/SKILL.md 2>/dev/null  # only if requested

# Check agent instructions
grep -l "LLM Wiki" CLAUDE.md AGENTS.md ~/.claude/CLAUDE.md 2>/dev/null
```

---

## Step 13: Post-Install Summary

Show the user what was installed:

```
LLM Wiki installed successfully.

Wiki location: [WIKI_ROOT]
  schema.md  -- page kinds and metadata ontology
  index.md   -- master table of contents
  log.md     -- operations changelog
  raw/       -- drop raw sources here
  wiki/      -- structured wiki pages

Skills installed:
  /wiki-ingest  -- process material into wiki pages
  /wiki-query   -- search and retrieve from the wiki
  /wiki-lint    -- audit wiki quality (if installed)

Agent instructions updated: [CLAUDE.md / AGENTS.md / etc.]

Quick start:
  - Drop a file into [WIKI_ROOT]/raw/ and run /wiki-ingest
  - Ask a question and it will check the wiki first
  - Run /wiki-lint periodically to maintain quality
  - See /babysitter:plugins configure llm-wiki for options
```
