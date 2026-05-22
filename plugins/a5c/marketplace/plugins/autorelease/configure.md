# autorelease — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `versionResolver.major` | labels array | `['breaking']` | `release-drafter.yml` |
| `versionResolver.minor` | labels array | `['feature', 'enhancement']` | `release-drafter.yml` |
| `versionResolver.patch` | labels array | `['fix', 'bug', ...]` | `release-drafter.yml` |
| `versionResolver.default` | `major`, `minor`, `patch` | `patch` | `release-drafter.yml` |
| `nameTemplate` | template string | `v$RESOLVED_VERSION` | `release-drafter.yml` |
| `tagTemplate` | template string | `v$RESOLVED_VERSION` | `release-drafter.yml` |
| `excludeLabels` | labels array | `['skip-release']` | `release-drafter.yml` |
| `releaseTrigger` | `dispatch`, `pr-merge`, `push`, `schedule` | `dispatch` | `.github/workflows/release.yml` on-block |
| `prerelease` | `true`, `false` | `false` | `release-drafter.yml` |
| `sortBy` | `merged_at`, `title` | `merged_at` | `release-drafter.yml` |
| `sortDirection` | `ascending`, `descending` | `descending` | `release-drafter.yml` |

## 2. Change Version Resolver Labels

```yaml
version-resolver:
  major:
    labels: ['breaking', 'semver:major']
  minor:
    labels: ['feature', 'semver:minor']
  patch:
    labels: ['fix', 'chore', 'deps', 'docs']
  default: patch
```

## 3. Switch to CalVer

```yaml
name-template: '$NEXT_PATCH_VERSION'
tag-template: '$NEXT_PATCH_VERSION'
template: |
  Released $DATE

  $CHANGES
```

And in the publish workflow, compute the version from the current date:

```yaml
- name: CalVer
  id: calver
  run: echo "version=$(date +%Y.%m).$(git rev-list --count --since='1 month ago' HEAD)" >> $GITHUB_OUTPUT
```

## 4. Enable Auto-Labeling

Add to `release-drafter.yml`:

```yaml
autolabeler:
  - label: breaking
    title:
      - '/!:/'
      - '/^(\w+)!:/'
    body:
      - '/BREAKING CHANGE:/'
  - label: feature
    title: ['/^feat(\(.+\))?:/']
  - label: fix
    title: ['/^fix(\(.+\))?:/']
  - label: docs
    title: ['/^docs(\(.+\))?:/']
  - label: chore
    title: ['/^chore(\(.+\))?:/']
```

Switches autorelease to inferring labels from Conventional Commit titles.

## 5. Prerelease Channels

```yaml
prerelease: true
prerelease-identifier: next
```

Toggle at release time via workflow input:

```yaml
inputs:
  prerelease:
    type: boolean
    default: false
```

## 6. Release from a Different Branch

```yaml
on:
  push:
    branches: [main, release/*]
  pull_request:
    types: [opened, reopened, synchronize, edited, labeled, unlabeled]
    branches: [main, release/*]
```

Add `filter-by-commitish: true` to `release-drafter.yml` so the draft only considers commits from the target branch.

## 7. Exclude PRs from Notes

### By label

Add label `skip-release` — already in `exclude-labels`.

### By author

```yaml
exclude-contributors:
  - 'dependabot[bot]'
  - 'renovate[bot]'
```

## 8. Change Release Trigger

### Manual only (safest)

Already the default in the install workflow.

### On every push to main

```yaml
on:
  push:
    branches: [main]

jobs:
  publish:
    if: "!contains(github.event.head_commit.message, '[skip release]')"
```

### On "release: vX.Y.Z" PR merge

```yaml
on:
  pull_request:
    types: [closed]
    branches: [main]

jobs:
  publish:
    if: github.event.pull_request.merged == true && startsWith(github.event.pull_request.title, 'release:')
```

## 9. Custom Release Body Template

```yaml
template: |
  # 🚀 Release v$RESOLVED_VERSION

  **Released**: $DATE
  **Previous**: $PREVIOUS_TAG

  $CHANGES

  ## Contributors

  $CONTRIBUTORS

  ## Full Changelog

  https://github.com/$OWNER/$REPOSITORY/compare/$PREVIOUS_TAG...v$RESOLVED_VERSION
```

Available variables: `$CHANGES`, `$CONTRIBUTORS`, `$PREVIOUS_TAG`, `$RESOLVED_VERSION`, `$OWNER`, `$REPOSITORY`, `$DATE`.

## 10. Attach Build Artifacts

In the publish workflow, after the build step:

```yaml
- name: Package artifacts
  run: |
    mkdir -p dist-artifacts
    tar -czf dist-artifacts/app-v${{ steps.resolve.outputs.version }}.tar.gz dist/

- name: Upload to release
  run: gh release upload "v${{ steps.resolve.outputs.version }}" dist-artifacts/*
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 11. Test Draft Locally

```bash
gh workflow run release-drafter.yml
gh run watch
gh release list
```

## 12. Hook into Babysitter Pre-release Checks

```bash
babysitter run:create \
  --process-id release-audit \
  --entry .a5c/processes/release/audit.js#process \
  --prompt "Before cutting the autorelease, audit that every PR merged since the last tag has a release label" \
  --json
```
