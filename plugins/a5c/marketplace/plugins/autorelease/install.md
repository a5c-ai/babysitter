# autorelease — Install Instructions

Lightweight tag-on-merge release automation: [release-drafter](https://github.com/release-drafter/release-drafter) maintains a draft GitHub Release whose body is continuously regenerated from merged PR titles and labels, and a tag-on-merge workflow promotes the draft to a published Release (and tag) when a maintainer merges a "Release" PR or pushes a matching commit. Much lighter than release-please/changesets — no manifest files, no Conventional Commit enforcement, just PR labels.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Read `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, or equivalent
2. Detect existing release tooling: `release-please-config.json`, `.changeset/`, `release-drafter.yml`
3. Check existing workflows in `.github/workflows/`
4. Check if `labels` already exist: `gh label list`
5. Detect default branch and current highest tag: `git describe --tags --abbrev=0`
6. Summarize findings

### Stage 2: Versioning Strategy

Ask the user:

1. **SemVer by label** — PRs labeled `breaking`/`feature`/`fix`/`chore` drive major/minor/patch (recommended)
2. **Manual version** — Maintainers pick the version when cutting a release (autorelease drafts notes only)
3. **CalVer** — Version is `YYYY.MM.PATCH`, incremented per release

### Stage 3: Release Trigger

Ask:
1. **Tag on push to main** — Every push/merge to `main` creates a tagged release (aggressive)
2. **Manual dispatch** — Maintainer runs "workflow_dispatch" to cut a release (safest)
3. **Release PR** — A PR titled `release: vX.Y.Z` triggers publish on merge
4. **Scheduled** — Weekly/monthly auto-release if any changes since last tag

### Stage 4: Publishing Targets

Ask:
- Publish to npm / PyPI / crates.io / Docker Hub / none? (default: none — GitHub Release only)
- Attach build artifacts to the Release? (default: yes if artifacts exist)
- Sign tags / releases? (default: no; offer `cosign` for container images separately)

### Stage 5: PR Labels

Confirm the label taxonomy:

| Label | Bump | Category |
|-------|------|----------|
| `breaking` | major | Breaking Changes |
| `feature` / `enhancement` | minor | Features |
| `fix` / `bug` | patch | Bug Fixes |
| `perf` | patch | Performance |
| `chore` / `deps` | patch | Maintenance |
| `docs` | patch | Documentation |
| `skip-release` | none | Excluded |

## Step 2: Create Labels

```bash
gh label create breaking --color B60205 --description "Introduces a breaking change"
gh label create feature --color 0E8A16 --description "New feature"
gh label create fix --color FBCA04 --description "Bug fix"
gh label create perf --color 1D76DB --description "Performance improvement"
gh label create chore --color CCCCCC --description "Maintenance / chore"
gh label create deps --color 0366D6 --description "Dependency update"
gh label create docs --color 5319E7 --description "Documentation only"
gh label create skip-release --color EEEEEE --description "Exclude from release notes"
```

## Step 3: Configure release-drafter

Create `.github/release-drafter.yml`:

```yaml
name-template: 'v$RESOLVED_VERSION'
tag-template: 'v$RESOLVED_VERSION'
categories:
  - title: '💥 Breaking Changes'
    labels: ['breaking']
  - title: '🚀 Features'
    labels: ['feature', 'enhancement']
  - title: '🐛 Bug Fixes'
    labels: ['fix', 'bug']
  - title: '⚡ Performance'
    labels: ['perf']
  - title: '📦 Dependencies'
    labels: ['deps']
  - title: '📚 Documentation'
    labels: ['docs']
  - title: '🧹 Maintenance'
    labels: ['chore']

change-template: '- $TITLE (#$NUMBER) by @$AUTHOR'
change-title-escapes: '\<*_&'
exclude-labels:
  - skip-release

version-resolver:
  major:
    labels: ['breaking']
  minor:
    labels: ['feature', 'enhancement']
  patch:
    labels: ['fix', 'bug', 'perf', 'deps', 'chore', 'docs']
  default: patch

template: |
  ## What's Changed

  $CHANGES

  **Full Changelog**: https://github.com/$OWNER/$REPOSITORY/compare/$PREVIOUS_TAG...v$RESOLVED_VERSION
```

## Step 4: Draft Workflow

Create `.github/workflows/release-drafter.yml`:

```yaml
name: release-drafter

on:
  push:
    branches: [main]
  pull_request:
    types: [opened, reopened, synchronize, edited, labeled, unlabeled]

permissions:
  contents: write
  pull-requests: read

jobs:
  update_release_draft:
    runs-on: ubuntu-latest
    steps:
      - uses: release-drafter/release-drafter@v6
        with:
          config-name: release-drafter.yml
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This keeps a GitHub Release draft perpetually in sync with the latest state of `main`.

## Step 5: Publish Workflow

Create `.github/workflows/release.yml`:

```yaml
name: release

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Release version (leave blank to use drafter-resolved)'
        required: false
        type: string

permissions:
  contents: write
  id-token: write

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: 'https://registry.npmjs.org'
          cache: 'npm'

      - run: npm ci
      - run: npm test
      - run: npm run build

      - name: Resolve version
        id: resolve
        run: |
          if [ -n "${{ inputs.version }}" ]; then
            echo "version=${{ inputs.version }}" >> $GITHUB_OUTPUT
          else
            draft_tag=$(gh release list --limit 1 --json name,isDraft --jq '.[] | select(.isDraft==true) | .name')
            echo "version=${draft_tag#v}" >> $GITHUB_OUTPUT
          fi
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Bump package.json version
        run: |
          npm version "${{ steps.resolve.outputs.version }}" --no-git-tag-version
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add package.json package-lock.json
          git commit -m "chore(release): v${{ steps.resolve.outputs.version }}"
          git tag "v${{ steps.resolve.outputs.version }}"
          git push origin HEAD --follow-tags

      - name: Publish draft release
        run: |
          draft_id=$(gh release list --limit 1 --json id,isDraft --jq '.[] | select(.isDraft==true) | .id')
          gh release edit "v${{ steps.resolve.outputs.version }}" --draft=false --tag "v${{ steps.resolve.outputs.version }}" || \
            gh release create "v${{ steps.resolve.outputs.version }}" --generate-notes
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Publish to npm
        if: ${{ hashFiles('package.json') != '' }}
        run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Step 6: (Alternative) Tag-on-Merge Trigger

If you prefer releases to cut automatically when a "release" PR merges rather than via manual dispatch, replace the `on:` block above with:

```yaml
on:
  pull_request:
    types: [closed]
    branches: [main]

jobs:
  publish:
    if: github.event.pull_request.merged == true && startsWith(github.event.pull_request.title, 'release:')
```

Maintainers cut a release by opening an empty PR titled `release: v1.4.0` and merging it.

## Step 7: Configure Branch Protection

- Protect `main`: require PR review + status checks (build/test)
- Allow the `github-actions[bot]` identity to push tags (add to bypass list)
- Optional: require the `release-drafter` status check so PRs without any release-category label are flagged

## Step 8: Add PR Template with Label Hint

Create `.github/pull_request_template.md`:

```markdown
## Summary

## Release Category

Apply one label: `breaking` | `feature` | `fix` | `perf` | `deps` | `chore` | `docs` | `skip-release`

## Test Plan
```

## Step 9: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name autorelease --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 10: Verify Setup

1. Open a PR with a `feature` label → merge → release draft updates with the new entry
2. Run `Actions → release → Run workflow` → draft is promoted, tag created
3. npm package (if configured) appears on the registry
4. PR without any release label is caught by protection
5. `skip-release` PRs are correctly excluded from notes

## Reference

- release-drafter: https://github.com/release-drafter/release-drafter
- Auto-labeler: https://github.com/release-drafter/release-drafter#autolabeler
- GitHub CLI release commands: https://cli.github.com/manual/gh_release
- Keep a Changelog: https://keepachangelog.com/
