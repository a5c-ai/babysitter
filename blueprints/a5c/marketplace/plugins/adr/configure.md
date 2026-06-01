# adr — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `tool` | `adr-tools`, `log4brains`, `madr-only` | `adr-tools` | install + workflow |
| `adrDir` | path | `docs/adr` | `.adr-dir` file |
| `template` | `nygard`, `madr`, `y-statement`, `custom` | `nygard` | `template.md` content |
| `filenamePattern` | string | `NNNN-title-kebab.md` | adr-tools default |
| `startNumber` | integer | `0001` | first new ADR |
| `nudgeOnPaths` | glob list | see install | workflow `paths:` |
| `nudgeMode` | `comment`, `off` | `comment` | workflow |
| `blockMerge` | `on`, `off` | `off` (never on) | workflow required-check |
| `statusValues` | csv | `Proposed,Accepted,Deprecated,Superseded` | template |
| `indexAutoRegen` | `on`, `off` | `off` | pre-commit hook |
| `previewOnPR` | `on`, `off` | `off` (log4brains only) | workflow |

## 2. Switch Template to MADR

```bash
curl -sSL https://raw.githubusercontent.com/adr/madr/main/template/adr-template.md \
  -o docs/adr/template.md
```

MADR adds `Deciders`, `Consulted`, `Informed`, `Decision Drivers`, and explicit `Options Considered` sections.

## 3. Switch Template to Y-Statement

Replace `template.md` content with:

```markdown
# NNNN. <title>

Date: YYYY-MM-DD
Status: Accepted

**In the context of** <use case>,
**facing** <concern>,
**we decided for** <option>
**and neglected** <alternatives>,
**to achieve** <benefits>,
**accepting** <downsides>,
**because** <rationale>.
```

Good for projects that want short ADRs that fit in a single paragraph.

## 4. Change Nudge Trigger Paths

Edit `.github/workflows/adr-nudge.yml`:

```yaml
on:
  pull_request:
    paths:
      - 'services/*/Dockerfile'      # per-service infra
      - 'db/migrations/**'           # schema changes
      - 'packages/**/api-schema.json'
```

Be conservative — ADRs are valuable only when rare. Triggering on every infra edit produces noise and trains reviewers to dismiss the nudge.

## 5. Change Nudge Message

Edit the `Comment nudge` step's `message:` block. Keep it short, suggest the command, and explicitly state the nudge is optional.

## 6. Auto-regenerate TOC

Add pre-commit hook (`.pre-commit-config.yaml` or husky):

```yaml
- id: adr-toc
  name: Regenerate ADR TOC
  entry: bash -c 'adr generate toc > docs/adr/README.md && git add docs/adr/README.md'
  language: system
  files: '^docs/adr/[0-9]+-.*\.md$'
  pass_filenames: false
```

## 7. Add Graphviz Supersede Graph

```bash
adr generate graph | dot -Tsvg -o docs/adr/graph.svg
```

Commit `graph.svg` and link from `docs/adr/README.md`. Or use log4brains which renders the graph in-browser.

## 8. Publish log4brains Site

Add workflow `.github/workflows/adr-publish.yml`:

```yaml
on:
  push:
    branches: [main]
    paths: ['docs/adr/**']
jobs:
  build:
    runs-on: ubuntu-latest
    permissions: { contents: write, pages: write, id-token: write }
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npx log4brains build
      - uses: actions/upload-pages-artifact@v3
        with: { path: .log4brains/out }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: github-pages
    steps:
      - uses: actions/deploy-pages@v4
```

## 9. Require Status Field via Linter

```bash
npm install -D markdownlint-cli2
```

Custom rule in `.markdownlint-cli2.yaml`:

```yaml
customRules:
  - ./scripts/adr-status-rule.js
globs:
  - 'docs/adr/[0-9]*.md'
```

Where `adr-status-rule.js` errors if no `## Status` section is present.

## 10. ADR Review in Pull Requests

Add a code owner file entry for the ADR directory:

```
# .github/CODEOWNERS
docs/adr/**  @org/architecture-council
```

This routes ADR PRs to the appropriate reviewers without hard-blocking other changes.

## 11. Integration with Backstage TechDocs

If using Backstage, add to `catalog-info.yaml`:

```yaml
metadata:
  annotations:
    backstage.io/techdocs-ref: dir:.
spec:
  type: documentation
  lifecycle: production
  owner: platform-team
```

ADRs under `docs/adr/` render as a section in the component's TechDocs tab automatically when `mkdocs.yml` includes the directory.
