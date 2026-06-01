# auto-labeler — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `syncLabels` | `on`, `off` | `on` | `labeler.yml` workflow `sync-labels` |
| `areaLabels` | `on`, `off` | `on` | `.github/labeler.yml` |
| `typeLabels` | `on`, `off` | `on` | `label-type.yml` |
| `releaseLabels` | `on`, `off` | `on` | `label-type.yml` |
| `sizeLabels` | `on`, `off` | `on` | `label-size.yml` (or delegated) |
| `langLabels` | `on`, `off` | `on` | `.github/labeler.yml` |
| `manualOverrideLabel` | string | `manual-label` | workflow `if:` |
| `matchStrategy` | `any-glob-to-any-file`, `all-globs-to-all-files` | `any` | `.github/labeler.yml` |
| `triggerOn` | `opened`, `synchronize`, `edited`, `reopened` | all four | workflow `on.types` |

## 2. Add a New Area Label

Edit `.github/labeler.yml`:

```yaml
area/storage:
  - changed-files:
      - any-glob-to-any-file:
          - 'packages/sdk/src/storage/**/*'
          - 'packages/sdk/src/storage/**/*.test.ts'
```

Seed the label:

```bash
gh label create "area/storage" --color "1d76db" --description "Storage subsystem"
```

## 3. Tighten a Rule (all-globs-to-all-files)

Require that every listed glob matches at least one file (stricter):

```yaml
area/multi:
  - changed-files:
      - all-globs-to-all-files:
          - 'packages/sdk/**/*'
          - '**/*.test.ts'
```

## 4. Exclude Paths

```yaml
area/catalog:
  - changed-files:
      - any-glob-to-any-file: ['packages/catalog/**/*']
      - all-globs-to-all-files: ['!packages/catalog/**/*.md']
```

## 5. Change Release-Label Mapping

Edit `.github/workflows/label-type.yml`:

```yaml
if (type === 'feat') labels.push('release/minor');
if (type === 'fix' || type === 'perf') labels.push('release/patch');
if (breaking) labels.push('release/major');
// Add custom: security fix bumps as minor
if (type === 'security') labels.push('release/minor');
```

## 6. Customize Size Thresholds

Edit `.github/workflows/label-size.yml`:

```yaml
xs_max_size: '5'
s_max_size: '25'
m_max_size: '100'
l_max_size: '300'
fail_if_xl: 'true'
```

## 7. Disable Sync (Don't Remove Stale Labels)

Edit `.github/workflows/labeler.yml`:

```yaml
sync-labels: false
```

Labels once applied stay even if the file paths no longer match — useful when labels signal release intent.

## 8. Skip Specific PRs

Add `manual-label` to any PR to bypass path-based labeling. Useful for backports where path matches would add wrong labels.

## 9. Branch-Scoped Labels

```yaml
area/hotfix:
  - base-branch: ['release/.+']
  - changed-files:
      - any-glob-to-any-file: ['**/*']
```

## 10. Refresh Existing PRs

```bash
gh pr list --state open --json number --jq '.[].number' \
  | xargs -n1 -I{} gh pr edit {} --add-label "refresh-labels"
```

Then run a one-off workflow_dispatch.

## 11. Audit Label Hygiene

```bash
babysitter run:create \
  --process-id auto-labeler-audit \
  --entry .a5c/processes/auto-labeler/audit.js#process \
  --prompt "List all labels in use on closed PRs over the last 90 days and propose a consolidated taxonomy" \
  --json
```
