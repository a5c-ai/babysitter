# Contributing to agent-mux

Thanks for your interest. This doc covers local dev setup and the manual release flow.

## Local development

```bash
npm install
npm run build      # tsc --build across all workspaces
npm test           # vitest unit suite
npm run test:e2e   # end-to-end suite (uses mock-harness; no API keys needed)
npm run lint       # eslint
npm run typecheck  # tsc --build (same as build, no emit difference here)
```

Install git hooks (pre-commit runs build + lint + tests on staged changes):

```bash
npm run hooks:install
```

## Project layout

- `packages/core` — `@a5c-ai/agent-mux-core`
- `packages/adapters` — `@a5c-ai/agent-mux-adapters`
- `packages/cli` — `@a5c-ai/agent-mux-cli` (the `amux` binary)
- `packages/agent-mux` — `@a5c-ai/agent-mux` (meta-package re-exporting the above)
- `packages/harness-mock` — `@a5c-ai/agent-mux-harness-mock`

Specs live in [`docs/`](docs/) (numbered 01–14) and are the source of truth for API shape and behavior.

## Release flow (changesets)

All five packages ship in lock-step (configured as a `fixed` group in `.changeset/config.json`). The preferred flow is changesets; the manual path below is still supported as a fallback.

### Preferred: changesets

1. `npm run changeset` — pick bump type, write a short summary.
2. Commit the generated file under `.changeset/`.
3. On merge to `main`, the `release.yml` workflow opens/updates a "Version Packages" PR. Merging that PR triggers `npm publish --provenance` for every package.

### Fallback: manual bump-and-publish

1. **Decide the new version.** All five packages ship in lock-step at the same version. Follow semver relative to the last release.
2. **Bump every package.**
   - Update `version` in each of `packages/{core,adapters,cli,agent-mux,harness-mock}/package.json`.
   - Update every workspace cross-dependency pin (`@a5c-ai/agent-mux-core`, `-adapters`, `-cli`) to the new version in the packages that depend on them.
3. **Update `CHANGELOG.md`** with a short summary per package (or a single combined entry).
4. **Verify locally.**
   ```bash
   npm install
   npm run build
   npm test
   npm run test:e2e
   npm run lint
   ```
5. **Commit + tag.**
   ```bash
   git commit -am "release: vX.Y.Z"
   git tag vX.Y.Z
   git push && git push --tags
   ```
6. **Publish.** Either:
   - Create a GitHub Release for the tag — the `publish.yml` workflow builds, tests, and runs `npm publish` for every package with `NODE_AUTH_TOKEN` from repo secrets.
   - Or trigger `publish.yml` manually via `workflow_dispatch`.
   - Or publish locally:
     ```bash
     # in each package dir, in dependency order: core → adapters → cli → agent-mux, then harness-mock
     (cd packages/core && npm publish)
     (cd packages/adapters && npm publish)
     (cd packages/cli && npm publish)
     (cd packages/agent-mux && npm publish)
     (cd packages/harness-mock && npm publish)
     ```
     Each package has `"publishConfig": { "access": "public" }` and a `prepublishOnly` that runs the build.

## Release secrets

The `publish.yml` workflow expects an `NPM_TOKEN` secret (an npm automation token with publish access to the `@a5c-ai` scope). It is wired as `NODE_AUTH_TOKEN` via `actions/setup-node`.
