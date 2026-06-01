# adr — Install Instructions

Set up Architecture Decision Records for your project — scaffold `docs/adr/`, install `adr-tools` (or log4brains), seed the standard Michael Nygard template, and add a PR nudge that suggests creating an ADR when architecture-touching paths change.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Check for existing ADRs: `docs/adr/`, `docs/decisions/`, `adr/`, `ARCHITECTURE.md`, `DECISIONS.md`
2. Detect ADR tooling: `.adr-dir`, `log4brains.yml`, `madr/`
3. Detect architecture-touching paths via heuristics: `infra/`, `terraform/`, `Dockerfile`, `docker-compose*`, `k8s/`, `helm/`, `packages/*/tsconfig.json`, `go.mod`, `Cargo.toml`, `pyproject.toml`
4. Check for a `docs/` site: MkDocs, Docusaurus, mdBook, Backstage TechDocs
5. Summarize findings to the user

### Stage 2: Tool Choice

Ask which ADR tool to use:

| Tool | Pros | Cons |
|------|------|------|
| **adr-tools** (npothurst/adr-tools) | Tiny bash, zero deps, widely known | Unmaintained since 2019, basic features |
| **adr-tools-python** | Actively maintained fork | Requires Python |
| **log4brains** | Static site, UI, supersede graph | Node dep, more moving parts |
| **MADR-only** (template only) | No tooling at all; git + Markdown | No numbering or index automation |

Default: **adr-tools** for minimalists, **log4brains** for teams that want a browsable site.

### Stage 3: Template

Ask which template style:

1. **Michael Nygard** (default) — Status / Context / Decision / Consequences
2. **MADR 4.x** — adds deciders, consulted, informed, decision drivers
3. **Y-statement** — single sentence: "In the context of X, facing Y, we decided Z, to achieve W, accepting N"
4. **Custom** — user-provided template

### Stage 4: Nudge Policy

Ask:
- Nudge on PR when architecture paths are touched? (default: yes, comment-only)
- Block PR merge if no ADR added? (default: no — nudge only, never hard-block)
- Paths that trigger nudge:
  ```
  infra/**, terraform/**, docker-compose*.yml, Dockerfile,
  k8s/**, helm/**, packages/*/package.json (deps only),
  packages/*/tsconfig.json, .github/workflows/**, ARCHITECTURE.md
  ```

### Stage 5: Numbering & Location

Ask:
- Directory: `docs/adr/` (default) or `docs/decisions/`
- Filename pattern: `NNNN-title-kebab.md` (default) or `YYYY-MM-DD-title.md`
- Start number: `0001` (default) or continue from existing

## Step 2: Scaffold Directory

```bash
mkdir -p docs/adr
echo "docs/adr" > .adr-dir
```

## Step 3: Seed the Template

### Michael Nygard style

Create `docs/adr/template.md`:

```markdown
# NNNN. <short noun phrase>

Date: YYYY-MM-DD

## Status
<Proposed | Accepted | Deprecated | Superseded by [NNNN](NNNN-...md)>

## Context
What is the issue that we are seeing that is motivating this decision or change?

## Decision
What is the change that we are proposing or have agreed to implement?

## Consequences
What becomes easier or more difficult to do and any risks introduced by this change?
```

### Seed ADR 0001

Create `docs/adr/0001-record-architecture-decisions.md`:

```markdown
# 1. Record architecture decisions

Date: YYYY-MM-DD

## Status
Accepted

## Context
We need to record the architectural decisions made on this project.

## Decision
We will use Architecture Decision Records, as described by Michael Nygard.

## Consequences
See Michael Nygard's article, linked above. For a lightweight ADR toolset, see Nat Pryce's adr-tools.
```

## Step 4: Install the Tool

### Option A — adr-tools (bash)

```bash
# macOS
brew install adr-tools

# Linux
curl -sSL https://github.com/npryce/adr-tools/archive/refs/tags/3.0.0.tar.gz | tar xz
sudo mv adr-tools-3.0.0/src/* /usr/local/bin/

# Verify
adr --help
```

Usage:

```bash
adr new "Adopt PostgreSQL for primary storage"
adr new -s 3 "Migrate from PostgreSQL to CockroachDB"  # supersedes #3
adr list
```

### Option B — log4brains

```bash
npm install -D log4brains
npx log4brains init
```

Produces `.log4brains.yml`, `docs/adr/`, and scaffolds a static-site preview:

```bash
npx log4brains preview  # http://localhost:4004
npx log4brains new      # interactive wizard
npx log4brains build    # static HTML to .log4brains/out/
```

### Option C — MADR template only

```bash
curl -sSL https://raw.githubusercontent.com/adr/madr/main/template/adr-template.md \
  -o docs/adr/template.md
```

No CLI; rely on file conventions + CI checks.

## Step 5: Create the Architecture-Path PR Nudge

Create `.github/workflows/adr-nudge.yml`:

```yaml
name: ADR nudge

on:
  pull_request:
    paths:
      - 'infra/**'
      - 'terraform/**'
      - 'Dockerfile'
      - 'docker-compose*.yml'
      - 'k8s/**'
      - 'helm/**'
      - '**/tsconfig.json'
      - '.github/workflows/**'
      - 'ARCHITECTURE.md'

permissions:
  pull-requests: write
  contents: read

jobs:
  nudge:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
      - name: Check for new ADR
        id: check
        run: |
          base=${{ github.event.pull_request.base.sha }}
          head=${{ github.event.pull_request.head.sha }}
          added=$(git diff --name-only --diff-filter=A "$base" "$head" -- 'docs/adr/*.md' | grep -v template.md || true)
          if [ -z "$added" ]; then
            echo "needs_nudge=true" >> "$GITHUB_OUTPUT"
          else
            echo "needs_nudge=false" >> "$GITHUB_OUTPUT"
          fi
      - name: Comment nudge
        if: steps.check.outputs.needs_nudge == 'true'
        uses: marocchino/sticky-pull-request-comment@v2
        with:
          header: adr-nudge
          message: |
            This PR touches architecture-relevant paths (infra / deploy / cross-cutting config) but no new ADR was added under `docs/adr/`.

            Consider adding one:
            ```bash
            adr new "Title describing the decision"
            # or
            npx log4brains new
            ```
            See [`docs/adr/template.md`](../blob/main/docs/adr/template.md). If this change does not warrant an ADR, you can ignore this nudge.
```

**Note**: This is a nudge, not a block. Never hard-require ADRs in CI; that turns architectural thinking into paperwork-theater.

## Step 6: Add npm / make Shortcuts (Optional)

```json
{
  "scripts": {
    "adr:new": "adr new",
    "adr:list": "adr list",
    "adr:preview": "log4brains preview"
  }
}
```

## Step 7: Link from README

Add to top-level `README.md`:

```markdown
## Architecture decisions
See [`docs/adr/`](./docs/adr/). To record a new decision: `adr new "..."` or `npx log4brains new`.
```

## Step 8: Seed an Index (Optional)

`adr list` generates one on demand. For a static index:

```bash
adr generate toc > docs/adr/README.md
```

For log4brains, the static site provides an index automatically.

## Step 9: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name adr --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 10: Verify Setup

1. `docs/adr/template.md` and `docs/adr/0001-record-architecture-decisions.md` exist
2. `adr new "test"` creates a properly numbered file (then delete it)
3. `.github/workflows/adr-nudge.yml` exists and triggers on architecture paths
4. Nudge comment posts on a test PR that touches `infra/` without adding an ADR
5. README links to `docs/adr/`
6. User understands: ADRs are a nudge, not a gate

## Reference

- Michael Nygard — Documenting architecture decisions: https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
- adr-tools: https://github.com/npryce/adr-tools
- log4brains: https://github.com/thomvaill/log4brains
- MADR: https://adr.github.io/madr/
- ADR GitHub org: https://adr.github.io/
