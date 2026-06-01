# changesets — Install Instructions

Set up [changesets](https://github.com/changesets/changesets) for versioning and changelog management. Contributors declare intent-to-release via `.changeset/*.md` files; a GitHub Action collects them into a "Version Packages" release PR that bumps versions, writes changelogs, and publishes on merge. Excellent for npm/pnpm monorepos, alternative to release-please and semantic-release.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Read `package.json` to confirm this is an npm/pnpm/yarn project
2. Detect monorepo structure:
   - `workspaces` field in root `package.json` → npm/yarn workspaces
   - `pnpm-workspace.yaml` → pnpm workspaces
   - `turbo.json`, `nx.json`, `lerna.json` → likely monorepo
3. Check for existing release tooling: `release-please-config.json`, `.semantic-release.json`, `release-drafter.yml`
4. Check for existing `.changeset/` directory (already installed)
5. Detect package manager: `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`
6. Identify which packages are `private: true` vs publishable
7. Summarize findings to the user

### Stage 2: Repo Shape

Ask the user:

1. **Single package** — Root `package.json` only
2. **Multi-package monorepo** — Packages in `packages/*` (or configured glob)
3. **Mixed** — Root plus subpackages (supported, treat each package independently)

### Stage 3: Version Strategy

Ask:
- **Independent** — Each package versions on its own (default)
- **Fixed** — All packages share a version (use `fixed` array in config)
- **Linked** — Selected packages bump together when any one bumps (use `linked` array)

### Stage 4: Access & Registry

Ask:
- Publish to npmjs.org or a private registry? (default: npmjs.org)
- Default package access: `public` or `restricted`? (default: `public` for scoped open source)
- Use npm 2FA via automation token? (recommended)
- Which branch triggers releases? (default: `main`)

### Stage 5: Prerelease Mode

Ask:
- Will you use `next`/`beta`/`alpha` prerelease channels? (default: no)
- Tag prefix per package (e.g. `@a5c-ai/sdk@1.2.0`)? (default: yes for monorepos)

## Step 2: Install changesets

### npm

```bash
npm install -D @changesets/cli
npx changeset init
```

### pnpm

```bash
pnpm add -Dw @changesets/cli
pnpm changeset init
```

### yarn

```bash
yarn add -DW @changesets/cli
yarn changeset init
```

`init` creates `.changeset/config.json` and `.changeset/README.md`.

## Step 3: Configure `.changeset/config.json`

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": ["@changesets/changelog-github", { "repo": "owner/repo" }],
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

Install the GitHub changelog renderer (adds PR and author links):

```bash
npm install -D @changesets/changelog-github
```

### Fixed vs Linked

```json
{
  "fixed": [["@a5c-ai/sdk", "@a5c-ai/cli"]],
  "linked": [["@a5c-ai/plugin-a", "@a5c-ai/plugin-b"]]
}
```

- `fixed` — always share an identical version
- `linked` — bump together only when one bumps

## Step 4: Add Package Scripts

Add to root `package.json`:

```json
{
  "scripts": {
    "changeset": "changeset",
    "version": "changeset version",
    "release": "changeset publish"
  }
}
```

For monorepos that need a build before publish:

```json
{
  "scripts": {
    "release": "npm run build && changeset publish"
  }
}
```

## Step 5: Teach Contributors

Each feature or fix PR should include a changeset:

```bash
npx changeset
# 1. Select which packages changed (space to toggle)
# 2. Select bump type: major / minor / patch
# 3. Write a summary — this becomes the changelog entry
```

This creates `.changeset/<random-name>.md`:

```markdown
---
"@a5c-ai/sdk": minor
"@a5c-ai/cli": patch
---

Add parallel effect batching and fix CLI race condition.
```

Commit it with the PR. Multiple changesets per PR are allowed.

## Step 6: Add Changeset-Required Check (Optional)

Add `.github/workflows/changeset-check.yml`:

```yaml
name: changeset check

on:
  pull_request:
    branches: [main]

jobs:
  changeset:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - name: Check for changeset
        run: npx changeset status --since=origin/main
```

Escape hatch: contributors can run `npx changeset --empty` for doc-only PRs.

## Step 7: Create the Release Workflow

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    branches: [main]

concurrency: ${{ github.workflow }}-${{ github.ref }}

permissions:
  contents: write
  pull-requests: write
  id-token: write   # for npm provenance

jobs:
  release:
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

      - run: npm run build

      - name: Create Release PR or Publish
        uses: changesets/action@v1
        with:
          version: npm run version
          publish: npm run release
          commit: "chore: version packages"
          title: "chore: version packages"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          NPM_CONFIG_PROVENANCE: true
```

**Flow**:
1. Push to `main` with unreleased changesets → action opens/updates a "Version Packages" PR
2. Merge the PR → action re-runs, finds no pending changesets, runs `changeset publish` to npm and creates GitHub Releases with tags

## Step 8: Prerelease Mode (Optional)

```bash
npx changeset pre enter next
npx changeset       # add changesets as normal
npx changeset version  # bumps to x.y.z-next.0
git commit -am "chore: enter prerelease"
# ...iterate...
npx changeset pre exit
npx changeset version  # graduates to stable
```

Commit `.changeset/pre.json` — it tracks prerelease state.

## Step 9: Configure npm Token

1. npmjs.com → Access Tokens → Generate → Automation (bypasses 2FA)
2. Repo → Settings → Secrets and variables → Actions → New repository secret `NPM_TOKEN`
3. Confirm package visibility with `npm access list packages`

## Step 10: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name changesets --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 11: Verify Setup

1. `npx changeset` produces a valid changeset file
2. Pushing a PR with a changeset triggers the check workflow green
3. Merging the PR to `main` opens a "Version Packages" PR
4. Merging the Version Packages PR publishes to npm and tags the repo
5. `CHANGELOG.md` in each package lists the entries with PR links

## Reference

- changesets: https://github.com/changesets/changesets
- changesets/action: https://github.com/changesets/action
- Common questions: https://github.com/changesets/changesets/blob/main/docs/common-questions.md
- Prereleases: https://github.com/changesets/changesets/blob/main/docs/prereleases.md
- npm provenance: https://docs.npmjs.com/generating-provenance-statements
