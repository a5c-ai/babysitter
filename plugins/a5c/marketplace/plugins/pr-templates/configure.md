# pr-templates — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `prTemplateMode` | `single`, `multi` | `single` | `.github/pull_request_template.md` vs dir |
| `semanticTitleLint` | `on`, `off` | `on` | `pr-title.yml` |
| `allowedTypes` | conventional types | `feat,fix,docs,...` | `pr-title.yml` `types` |
| `requireScope` | `on`, `off` | `off` | `pr-title.yml` `requireScope` |
| `subjectCase` | `lower`, `sentence`, `any` | `lower` | `subjectPattern` regex |
| `wipAllowed` | `on`, `off` | `on` | `pr-title.yml` `wip` |
| `sizeLabeler` | `on`, `off` | `on` | `pr-size.yml` |
| `sizeXsMax` | integer | `9` | `pr-size.yml` |
| `sizeSMax` | integer | `49` | `pr-size.yml` |
| `sizeMMax` | integer | `199` | `pr-size.yml` |
| `sizeLMax` | integer | `499` | `pr-size.yml` |
| `failIfXl` | `on`, `off` | `off` | `pr-size.yml` |
| `blankIssuesEnabled` | `on`, `off` | `off` | `.github/ISSUE_TEMPLATE/config.yml` |

## 2. Customize the Default PR Template

Edit `.github/pull_request_template.md`. Keep the structure: Summary, Test Plan, Risk & Rollback, Checklist. Add project-specific sections like "Migration notes" or "Observability impact" as appropriate.

## 3. Enable Required Scopes

Edit `.github/workflows/pr-title.yml`:

```yaml
with:
  requireScope: true
  scopes: |
    sdk
    cli
    catalog
    docs
    ci
```

## 4. Adjust Size Thresholds

```yaml
with:
  xs_max_size: '5'
  s_max_size: '30'
  m_max_size: '150'
  l_max_size: '400'
  fail_if_xl: 'true'
  message_if_xl: |
    PR too large. Please split into smaller reviewable pieces.
```

## 5. Exclude More Files from Size Count

```yaml
files_to_ignore: |
  package-lock.json
  pnpm-lock.yaml
  dist/
  build/
  coverage/
  *.generated.ts
  openapi.yaml
```

## 6. Add a New Issue Form

Create `.github/ISSUE_TEMPLATE/regression.yml`:

```yaml
name: Regression
description: Something that used to work is now broken
labels: [bug, regression]
body:
  - type: input
    id: last-working
    attributes: { label: Last working version }
    validations: { required: true }
  - type: input
    id: first-broken
    attributes: { label: First broken version }
    validations: { required: true }
  - type: textarea
    id: steps
    attributes: { label: Reproduction }
    validations: { required: true }
```

## 7. Disable Size Labeler Per Label

Add `skip-size-label` to a PR to skip re-evaluation:

```yaml
- uses: codelytv/pr-size-labeler@v1
  if: "!contains(github.event.pull_request.labels.*.name, 'skip-size-label')"
```

## 8. Integrate with Auto-Labeler

If the `auto-labeler` plugin is installed, path-based labels and size labels coexist. Avoid label collisions by namespacing: `area/*`, `size/*`, `type/*`.

## 9. Change WIP Behavior

```yaml
with:
  wip: false   # Fail WIP titles instead of skipping
```

## 10. Template-Selection Doc in README

```markdown
## Opening a PR

- Feature PRs: `...?template=feature.md`
- Bug fixes: `...?template=bugfix.md`
- Docs-only: `...?template=docs.md`
- Chores: `...?template=chore.md`
```

## 11. Review Template Evolution

```bash
babysitter run:create \
  --process-id pr-template-audit \
  --entry .a5c/processes/pr-templates/audit.js#process \
  --prompt "Audit last 30 days of PRs for fields frequently left blank and propose template improvements" \
  --json
```
