# feature-flags — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Audit tooling only** — Keep SDK wiring and flag registry
2. **Everything** — Remove SDK, registry, workflow, scripts
3. **Selective** — Let the user choose which layers to remove

**Warning**: Removing SDK wiring while code still calls `flags.getBooleanValue(...)` will throw at runtime. Replace call sites first or guard with try/catch.

## Step 2: Remove SDK Packages

### OpenFeature

```bash
npm uninstall @openfeature/server-sdk @openfeature/web-sdk \
  @openfeature/launchdarkly-provider @openfeature/unleash-provider
rm -f src/flags/client.ts
```

### LaunchDarkly direct

```bash
npm uninstall launchdarkly-node-server-sdk
```

### Python / Go

```bash
pip uninstall openfeature-sdk openfeature-provider-launchdarkly
# or:
go mod tidy  # after removing imports
```

## Step 3: Remove Flag Registry

Only if you're confident no automation still reads it:

```bash
rm -rf flags/
```

Otherwise keep `flags/flags.yaml` as a historical record.

## Step 4: Remove Audit Scripts

```bash
rm -f scripts/audit-flags.mjs scripts/stale-flags.mjs
```

Remove `flags:audit` from `package.json` scripts.

## Step 5: Remove GitHub Actions Workflow

```bash
rm -f .github/workflows/flags.yml
```

## Step 6: Remove Pre-commit / lint-staged Entries

Edit `package.json` → remove `flags/flags.yaml` entry from `lint-staged`. If this plugin installed husky solely for itself:

```bash
npm uninstall husky lint-staged
rm -rf .husky/
```

Edit `.pre-commit-config.yaml` → remove `check-jsonschema` entry for `flags/flags.yaml`.

## Step 7: Remove Processes

```bash
rm -rf .a5c/processes/feature-flags
```

## Step 8: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name feature-flags --project --json
```

## Notes

- Remote flag data (LaunchDarkly, Unleash) is **not** deleted — clean via each provider's console
- Rotate `LD_SDK_KEY` / `UNLEASH_API_TOKEN` in repo secrets to avoid orphaned credentials
- If your app served traffic that depended on flags, do a staged cleanup: replace calls with the final "rolled-out" behavior first, then uninstall
