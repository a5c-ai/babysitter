# i18n — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Processes and configs only** — Remove babysitter i18n processes but keep lint rules, hooks, workflow, and extraction tooling
2. **Everything** — Remove lint rules, hooks, workflow, extraction packages, and processes (keeps translation files by default)
3. **Selective** — Let the user choose which layers to remove

**Warning**: Translation files in `src/locales/`, `locale/`, `translations/`, etc. are NEVER removed automatically — they represent work product. Confirm explicitly if the user wants them deleted.

## Step 2: Remove Lint Rules

### React / Next.js (i18next)

```bash
npm uninstall eslint-plugin-i18next
```

Edit `eslint.config.mjs` and remove the `i18next` plugin block.

### React (FormatJS)

```bash
npm uninstall eslint-plugin-formatjs
```

### Vue / Nuxt

```bash
npm uninstall @intlify/eslint-plugin-vue-i18n
```

Remove the `vue-i18n` block and `settings['vue-i18n']` entry from the eslint config.

### Angular

Remove the `@angular-eslint/template/i18n` rule from the template override.

### Python

Remove `I18N` from `.flake8` or `INT` from `ruff.toml`.

```bash
pip uninstall flake8-i18n
```

## Step 3: Remove Extraction Tooling

### i18next-parser

```bash
npm uninstall i18next-parser
rm -f i18next-parser.config.mjs
rm -f scripts/check-missing-keys.mjs
```

### FormatJS

```bash
npm uninstall @formatjs/cli
```

### Angular

```bash
npm uninstall ng-extract-i18n-merge
```

Remove the `extract-i18n` builder override from `angular.json`.

### Python

```bash
pip uninstall Babel polib
rm -f scripts/check_po.py
rm -f babel.cfg
```

**Do not remove** Django i18n — it is part of the framework.

## Step 4: Remove Pre-commit Hook Entries

### husky + lint-staged

Edit `package.json` and remove the i18n-specific commands from `lint-staged` globs. Edit `.husky/pre-commit` and remove the `npm run i18n:check-missing` line.

If husky was installed solely for this plugin:

```bash
npm uninstall husky lint-staged
rm -rf .husky/
```

### pre-commit framework

Edit `.pre-commit-config.yaml` and remove the `check-po-completeness` hook.

## Step 5: Remove GitHub Actions Workflow

```bash
rm -f .github/workflows/i18n.yml
```

If the i18n jobs were added to an existing workflow, remove only those jobs.

## Step 6: Remove i18n Scripts

Edit `package.json` and delete:

```json
{
  "scripts": {
    "i18n:extract": "...",
    "i18n:validate": "...",
    "i18n:check-missing": "...",
    "i18n:compile": "..."
  }
}
```

## Step 7: Runtime Library (Optional)

If the user wants to completely remove i18n (not just the plugin tooling):

```bash
# React
npm uninstall react-i18next i18next i18next-browser-languagedetector

# Vue
npm uninstall vue-i18n

# Angular
ng remove @angular/localize

# Python
pip uninstall Flask-Babel
```

**Warning**: Uninstalling the runtime library will break all translated UI. Only do this if the app is being reverted to monolingual. Translation source files (`src/locales/*.json`, `locale/*.po`) are kept.

## Step 8: Remove Processes

```bash
rm -rf .a5c/processes/i18n
```

## Step 9: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name i18n --project --json
```

## Notes

- Translation files (`src/locales/**`, `locale/**`, `translations/**`, `*.po`, `*.xlf`, `*.arb`) are never removed by uninstall. Delete manually if desired — but these are usually valuable, human-translated content.
- If you removed the runtime library, grep for remaining imports (`useTranslation`, `t(`, `$t(`, `i18n.t`, `gettext(`) and replace with plain strings before deploying.
- CI history remains in GitHub Actions run history — no action required.
