# changesets — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `changelog` | module id or `false` | `@changesets/cli/changelog` | `.changeset/config.json` |
| `commit` | `true`, `false`, module id | `false` | `.changeset/config.json` |
| `access` | `public`, `restricted` | `restricted` | `.changeset/config.json` |
| `baseBranch` | branch name | `main` | `.changeset/config.json` |
| `fixed` | array of glob arrays | `[]` | `.changeset/config.json` |
| `linked` | array of glob arrays | `[]` | `.changeset/config.json` |
| `updateInternalDependencies` | `patch`, `minor` | `patch` | `.changeset/config.json` |
| `ignore` | array of package names/globs | `[]` | `.changeset/config.json` |
| `privatePackages` | object `{ version, tag }` | `{ version: false, tag: false }` | `.changeset/config.json` |
| `bumpVersionsWithWorkspaceProtocolOnly` | `true`, `false` | `false` | pnpm workspaces |
| `snapshot` | object `{ useCalculatedVersion, prereleaseTemplate }` | `{}` | snapshot releases |

## 2. Change Base Branch

```json
{ "baseBranch": "develop" }
```

Update workflow `on.push.branches` to match.

## 3. Switch Changelog Renderer

### GitHub (default recommendation)

```bash
npm install -D @changesets/changelog-github
```

```json
{ "changelog": ["@changesets/changelog-github", { "repo": "owner/repo" }] }
```

### git-log (minimal, no API calls)

```json
{ "changelog": "@changesets/cli/changelog" }
```

### Disable changelog generation

```json
{ "changelog": false }
```

## 4. Ignore Packages from Release

```json
{ "ignore": ["@a5c-ai/internal-fixtures", "@a5c-ai/docs-site"] }
```

Changesets referencing ignored packages will fail `changeset version` unless the package is also `private: true`.

## 5. Version Private Packages

```json
{
  "privatePackages": { "version": true, "tag": true }
}
```

Bumps private packages and creates git tags but does not publish.

## 6. Fixed vs Linked Groups

```json
{
  "fixed": [["@a5c-ai/sdk", "@a5c-ai/cli"]],
  "linked": [["@a5c-ai/plugin-*"]]
}
```

`fixed` forces identical versions; `linked` forces joint bumps but each may carry an independent version if only one has recent changesets.

## 7. Snapshot Releases (Per-PR Previews)

```bash
npx changeset version --snapshot pr-123
npx changeset publish --tag pr-123 --no-git-tag
```

Config tuning:

```json
{
  "snapshot": {
    "useCalculatedVersion": true,
    "prereleaseTemplate": "{tag}-{datetime}"
  }
}
```

Install on consumer side via `npm install @a5c-ai/sdk@pr-123`.

## 8. Enter / Exit Prerelease Mode

```bash
npx changeset pre enter next
# ...commits...
npx changeset version      # produces x.y.z-next.N
npx changeset publish
# when ready to graduate:
npx changeset pre exit
npx changeset version
```

`.changeset/pre.json` is created — commit it; it persists prerelease state across runs.

## 9. Require Changesets on PRs

Use the official action:

```yaml
- uses: dorny/paths-filter@v3
  id: filter
  with:
    filters: |
      src:
        - 'packages/**/src/**'
- name: Require changeset
  if: steps.filter.outputs.src == 'true'
  run: npx changeset status --since=origin/${{ github.base_ref }}
```

Or enforce via GitHub App: [changeset-bot](https://github.com/apps/changeset-bot).

## 10. Publish to Private / Alternate Registry

```json
{ "access": "restricted" }
```

Workflow:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 22
    registry-url: 'https://npm.pkg.github.com'
```

Each package's `package.json` should include:

```json
{ "publishConfig": { "registry": "https://npm.pkg.github.com" } }
```

## 11. Dry-Run a Version Bump Locally

```bash
npx changeset version
# inspect package.json / CHANGELOG.md diffs
git reset --hard
```

## 12. Hook into Babysitter Release Process

Before `changeset publish`:

```bash
babysitter run:create \
  --process-id pre-release-audit \
  --entry .a5c/processes/release/audit.js#process \
  --prompt "Verify no changesets reference removed exports; lint CHANGELOG.md entries" \
  --json
```
