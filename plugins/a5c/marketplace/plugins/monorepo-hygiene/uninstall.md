# monorepo-hygiene — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **CI checks only** — Keep configs, remove workflow
2. **Everything** — Remove syncpack, madge, depcruise, turbo, shared base configs
3. **Selective** — Let the user choose which layers to remove

**Warning**: Removing `tsconfig.base.json` or shared `pyproject.toml` will silently drift each package's settings. Copy the base into each package first, or accept that packages now diverge.

## Step 2: Remove Workspace Consistency Checker

```bash
npm uninstall syncpack
rm -f .syncpackrc.json
```

Remove `hygiene:check-deps` / `hygiene:fix-deps` scripts from root `package.json`.

## Step 3: Remove Dep-Graph Tools

```bash
npm uninstall madge dependency-cruiser
rm -f .dependency-cruiser.cjs
```

Remove `hygiene:circular` / `hygiene:graph` scripts.

## Step 4: Remove ESLint Rules

Edit `eslint.config.mjs` and remove the `import/*` rules added by this plugin. If `eslint-plugin-import` isn't used elsewhere:

```bash
npm uninstall eslint-plugin-import
```

## Step 5: Remove turbo

```bash
npm uninstall turbo
rm -f turbo.json
```

Restore direct scripts in root `package.json`:

```json
{ "scripts": { "build": "npm run build --workspaces --if-present" } }
```

## Step 6: Remove Shared Base Configs (Cautious)

If inheriting packages need their own standalone config, copy the base into each package first:

```bash
for p in packages/*/tsconfig.json; do
  # Manually inline the values from tsconfig.base.json before removing extends
  :
done
rm -f tsconfig.base.json
```

Restore root `tsconfig.json` to standalone if it was a solution config.

## Step 7: Remove GitHub Actions Workflow

```bash
rm -f .github/workflows/monorepo-hygiene.yml
```

## Step 8: Remove Pre-commit Entries

Edit `package.json` → `lint-staged` → remove `package.json` entry (if only used by this plugin).

## Step 9: Remove Processes

```bash
rm -rf .a5c/processes/monorepo-hygiene
```

## Step 10: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name monorepo-hygiene --project --json
```

## Notes

- Generated graph images (`deps.svg`) are not removed — delete manually if desired
- If packages relied on transitive hoisting that syncpack prevented, expect fresh install-time surprises — run `npm install` from root
- Version drift will return over time without automation; schedule a manual audit cadence if keeping the policy
