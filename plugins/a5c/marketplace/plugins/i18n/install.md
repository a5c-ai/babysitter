# i18n — Install Instructions

Set up internationalization feedback loops — lint rules that flag hardcoded strings in UI code, extraction and validation tools to detect missing translation keys, pre-commit checks on staged files, and a GitHub Actions workflow that gates untranslated strings from merging. Per-stack recommendations for React, Vue, Angular, plain JS, and Python (gettext / Babel).

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Read `package.json`, `requirements.txt`, `pyproject.toml`, or equivalent
2. Detect UI stack:
   - React / Next.js: check for `react-i18next`, `next-intl`, `react-intl`
   - Vue / Nuxt: `vue-i18n`, `@nuxtjs/i18n`
   - Angular: `@angular/localize`, `@ngx-translate/core`
   - Svelte: `svelte-i18n`
   - Plain JS: `i18next`, `formatjs`, `fluent`
   - Python: `gettext`, `Babel`, `Django i18n`, `Flask-Babel`
3. Check for existing translation files:
   - JSON: `locales/*.json`, `public/locales/**/*.json`, `src/i18n/**/*.json`
   - PO/MO: `locale/*/LC_MESSAGES/*.po`
   - ARB (Flutter): `lib/l10n/*.arb`
   - XLIFF / XMB (Angular): `src/locale/*.xlf`
4. Check for existing extraction tooling: `i18next-parser`, `formatjs`, `pybabel`, `xgettext`
5. Check for existing lint setup: `.eslintrc.*`, `eslint.config.*`
6. Check for existing CI/CD and git hooks
7. Summarize findings to the user

### Stage 2: i18n Layers

Ask the user which layers to set up (multi-select):

1. **Lint rules** — Flag hardcoded user-facing strings in UI source
2. **Extraction & validation tooling** — Extract keys from source, diff against translation files
3. **Pre-commit hook** — Run extraction + missing-key check on staged UI files
4. **GitHub Actions workflow** — Validate all locales on every PR, block merges on missing keys
5. **All** — Install every layer applicable to the stack

### Stage 3: Framework Selection

| Stack | Runtime Library | Lint Plugin | Extraction Tool |
|-------|-----------------|-------------|------------------|
| React | `react-i18next` | `eslint-plugin-i18next` + `eslint-plugin-react/jsx-no-literals` | `i18next-parser` |
| React (FormatJS) | `react-intl` | `eslint-plugin-formatjs` | `@formatjs/cli` |
| Next.js App Router | `next-intl` | `eslint-plugin-i18next` | `i18next-parser` |
| Vue / Nuxt | `vue-i18n` | `@intlify/eslint-plugin-vue-i18n` | `@intlify/vue-i18n-extensions` |
| Angular | `@angular/localize` | `@angular-eslint` + `ng-extract-i18n-merge` | `ng extract-i18n` |
| Svelte | `svelte-i18n` | custom regex rules via `eslint-plugin-regexp` | `svelte-i18n-parser` |
| Plain JS | `i18next` | `eslint-plugin-i18next` | `i18next-parser` |
| Python (Django) | Django i18n | `flake8-django` | `django-admin makemessages` |
| Python (Flask) | `Flask-Babel` | `flake8-i18n` | `pybabel extract` |
| Python (generic) | `gettext` / `Babel` | `flake8-i18n` | `xgettext` / `pybabel` |

### Stage 4: Locales & Strictness

Ask the user:
- What is the source (base) locale? (default: `en`)
- Which target locales to support? (comma-separated, e.g. `es,fr,de,ja`)
- Should CI fail on **missing** keys in target locales? (default: yes for source parity)
- Should CI fail on **unused** keys (present in translations but absent in source)? (default: warn)
- Should CI fail on hardcoded strings in UI source? (default: yes after grace period)
- Grace period before enforcing hard gates? (default: 2 weeks warn-only)

### Stage 5: Git Hooks

Ask:
- Install or extend pre-commit hooks? (default: yes)
- Tool:
  - Node stacks: **husky** + **lint-staged**
  - Python stacks: **pre-commit** framework

## Step 2: Install Runtime Library (if not present)

### React + react-i18next

```bash
npm install react-i18next i18next i18next-browser-languagedetector
```

Bootstrap `src/i18n.ts`:

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import es from './locales/es.json';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, es: { translation: es } },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
```

### Vue + vue-i18n

```bash
npm install vue-i18n@10
```

### Angular + @angular/localize

```bash
ng add @angular/localize
```

### Python + Flask-Babel

```bash
pip install Flask-Babel
```

### Django i18n

Django ships with i18n. Enable in `settings.py`:

```python
USE_I18N = True
LANGUAGE_CODE = 'en'
LANGUAGES = [('en', 'English'), ('es', 'Spanish'), ('fr', 'French')]
LOCALE_PATHS = [BASE_DIR / 'locale']
MIDDLEWARE += ['django.middleware.locale.LocaleMiddleware']
```

## Step 3: Install Lint Rules

### React / Next.js (i18next)

```bash
npm install -D eslint-plugin-i18next
```

Edit `eslint.config.mjs`:

```javascript
import i18next from 'eslint-plugin-i18next';

export default [
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: { i18next },
    rules: {
      'i18next/no-literal-string': ['error', {
        mode: 'jsx-text-only',
        'jsx-attributes': {
          include: ['alt', 'title', 'placeholder', 'label', 'aria-label'],
        },
        callees: { exclude: ['Error', 'console\\..*'] },
        words: { exclude: ['[a-zA-Z]+\\-.*', '\\d+'] },
      }],
    },
  },
  // Test files and scripts are exempt
  {
    files: ['**/*.test.{ts,tsx}', 'scripts/**'],
    rules: { 'i18next/no-literal-string': 'off' },
  },
];
```

### React with FormatJS (react-intl)

```bash
npm install -D eslint-plugin-formatjs
```

```javascript
import formatjs from 'eslint-plugin-formatjs';

export default [
  {
    plugins: { formatjs },
    rules: {
      'formatjs/no-literal-string-in-jsx': 'error',
      'formatjs/enforce-default-message': 'error',
      'formatjs/enforce-description': 'warn',
      'formatjs/no-offset': 'error',
      'formatjs/no-multiple-whitespaces': 'error',
      'formatjs/no-id-named-literal': 'error',
    },
  },
];
```

### Vue / Nuxt (vue-i18n)

```bash
npm install -D @intlify/eslint-plugin-vue-i18n
```

```javascript
import vueI18n from '@intlify/eslint-plugin-vue-i18n';

export default [
  ...vueI18n.configs['flat/recommended'],
  {
    settings: {
      'vue-i18n': {
        localeDir: './src/locales/*.{json,yaml,yml}',
        messageSyntaxVersion: '^10.0.0',
      },
    },
    rules: {
      '@intlify/vue-i18n/no-raw-text': 'error',
      '@intlify/vue-i18n/no-missing-keys': 'error',
      '@intlify/vue-i18n/no-unused-keys': 'warn',
      '@intlify/vue-i18n/key-format-style': ['error', 'kebab-case'],
    },
  },
];
```

### Angular

Angular's `@angular/localize` enforces `i18n` attributes via the compiler. Add lint rules to nudge:

```json
{
  "@angular-eslint/template/i18n": ["error", {
    "checkId": true,
    "checkText": true,
    "checkAttributes": true
  }]
}
```

### Python (Flask / generic)

```bash
pip install flake8-i18n
```

Add to `.flake8`:

```ini
[flake8]
select = I18N
```

Or with ruff (`ruff.toml`):

```toml
[lint]
extend-select = ["INT"]  # gettext rules
```

## Step 4: Install Extraction & Validation Tooling

### i18next-parser (React, Vue, plain JS using i18next)

```bash
npm install -D i18next-parser
```

Create `i18next-parser.config.mjs`:

```javascript
export default {
  locales: ['en', 'es', 'fr', 'de'],
  output: 'src/locales/$LOCALE.json',
  input: ['src/**/*.{js,jsx,ts,tsx,vue}'],
  defaultNamespace: 'translation',
  createOldCatalogs: false,
  keepRemoved: false,
  sort: true,
  verbose: true,
  failOnWarnings: false,
  failOnUpdate: true,  // CI: fail if extraction changes files
};
```

Add scripts to `package.json`:

```json
{
  "scripts": {
    "i18n:extract": "i18next-parser --config i18next-parser.config.mjs",
    "i18n:validate": "i18next-parser --config i18next-parser.config.mjs --fail-on-update",
    "i18n:check-missing": "node scripts/check-missing-keys.mjs"
  }
}
```

Create `scripts/check-missing-keys.mjs`:

```javascript
import fs from 'node:fs';
import path from 'node:path';

const base = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const targets = ['es', 'fr', 'de'];
const flatten = (o, p = '') => Object.entries(o).flatMap(([k, v]) =>
  typeof v === 'object' && v !== null ? flatten(v, `${p}${k}.`) : [`${p}${k}`]
);
const baseKeys = new Set(flatten(base));
let failed = false;
for (const loc of targets) {
  const t = JSON.parse(fs.readFileSync(`src/locales/${loc}.json`, 'utf8'));
  const tKeys = new Set(flatten(t));
  const missing = [...baseKeys].filter((k) => !tKeys.has(k));
  if (missing.length) {
    console.error(`[${loc}] missing ${missing.length} keys:`, missing.slice(0, 20));
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
```

### FormatJS

```bash
npm install -D @formatjs/cli
```

```json
{
  "scripts": {
    "i18n:extract": "formatjs extract 'src/**/*.{ts,tsx}' --out-file src/locales/en.json --id-interpolation-pattern '[sha512:contenthash:base64:6]'",
    "i18n:compile": "formatjs compile src/locales/en.json --out-file src/compiled-lang/en.json"
  }
}
```

### Angular

```bash
ng extract-i18n --output-path src/locale --format xlf2
npm install -D ng-extract-i18n-merge
```

`angular.json` builder config:

```json
{
  "extract-i18n": {
    "builder": "ng-extract-i18n-merge:ng-extract-i18n-merge",
    "options": {
      "format": "xlf2",
      "outputPath": "src/locale",
      "targetFiles": ["messages.es.xlf", "messages.fr.xlf", "messages.de.xlf"]
    }
  }
}
```

### Python (Django)

```bash
python manage.py makemessages -l es -l fr -l de
python manage.py compilemessages
```

Validation script `scripts/check_po.py`:

```python
import polib, sys
failed = False
for loc in ['es', 'fr', 'de']:
    po = polib.pofile(f'locale/{loc}/LC_MESSAGES/django.po')
    untranslated = po.untranslated_entries() + po.fuzzy_entries()
    if untranslated:
        print(f'[{loc}] {len(untranslated)} untranslated/fuzzy entries')
        failed = True
sys.exit(1 if failed else 0)
```

### Python (Flask / Babel)

```bash
pip install Babel polib
pybabel extract -F babel.cfg -o messages.pot .
pybabel update -i messages.pot -d translations
pybabel compile -d translations
```

## Step 5: Set Up Pre-commit Hook

### husky + lint-staged

```bash
npm install -D husky lint-staged
npx husky init
```

`package.json`:

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx,vue}": [
      "eslint --fix --max-warnings=0",
      "i18next-parser --config i18next-parser.config.mjs --fail-on-update"
    ]
  }
}
```

`.husky/pre-commit`:

```bash
npx lint-staged
npm run i18n:check-missing
```

### pre-commit (Python)

`.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.8.0
    hooks:
      - id: ruff
  - repo: local
    hooks:
      - id: check-po-completeness
        name: Check .po completeness
        entry: python scripts/check_po.py
        language: system
        files: \.po$
        pass_filenames: false
```

## Step 6: Create GitHub Actions Workflow

`.github/workflows/i18n.yml`:

```yaml
name: Internationalization

on:
  pull_request:
    branches: [main, staging]
  push:
    branches: [main]

jobs:
  i18n-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - name: Lint for hardcoded strings
        run: npx eslint . --ext .js,.jsx,.ts,.tsx,.vue

  i18n-extract:
    runs-on: ubuntu-latest
    needs: i18n-lint
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - name: Extract translation keys
        run: npm run i18n:extract
      - name: Fail on uncommitted changes
        run: |
          if [ -n "$(git status --porcelain src/locales)" ]; then
            echo "::error::Translation files are out of date. Run 'npm run i18n:extract' locally and commit."
            git diff src/locales
            exit 1
          fi

  i18n-validate:
    runs-on: ubuntu-latest
    needs: i18n-extract
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - name: Check for missing translations
        run: npm run i18n:check-missing
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: i18n-missing-report
          path: i18n-report.json
```

For Python stacks, swap the Node steps for:

```yaml
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install -r requirements.txt polib
      - run: python manage.py makemessages -a --no-location
      - run: python scripts/check_po.py
```

## Step 7: Configure Warn-Only Grace Period (Optional)

If the project has existing hardcoded strings:

1. Set `i18next/no-literal-string` / `vue-i18n/no-raw-text` to `'warn'`
2. Add `continue-on-error: true` to `i18n-lint` workflow job
3. Add TODO with deadline to flip to `'error'` after 2 weeks
4. Track violation count weekly so the user sees the burn-down

## Step 8: Run Initial Baseline

```bash
npm run i18n:extract
npm run i18n:check-missing || true
```

Report to user:

```
=== i18n Baseline ===
Extracted keys: <count>
Missing per locale:
  es: <count>
  fr: <count>
  de: <count>
```

Suggest a babysitter process to seed translations:

```bash
babysitter run:create \
  --process-id i18n-seed-translations \
  --entry .a5c/processes/i18n/seed-translations.js#process \
  --prompt "Translate all missing keys from en.json into es, fr, de using context-aware translation" \
  --json
```

## Step 9: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name i18n --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 10: Verify Setup

1. Lint runs: `npm run lint` — no false positives
2. Extraction runs: `npm run i18n:extract` — writes locale files
3. Missing-key check runs: `npm run i18n:check-missing` — exits non-zero if gaps
4. Pre-commit hook fires on staged UI files
5. GitHub Actions workflow committed at `.github/workflows/i18n.yml`
6. Baseline violation counts recorded

## Reference

- react-i18next: https://react.i18next.com/
- i18next-parser: https://github.com/i18next/i18next-parser
- FormatJS: https://formatjs.io/
- vue-i18n: https://vue-i18n.intlify.dev/
- Angular i18n: https://angular.dev/guide/i18n
- Django translations: https://docs.djangoproject.com/en/5.1/topics/i18n/translation/
- Fluent (Mozilla): https://projectfluent.org/
- ICU MessageFormat: https://unicode-org.github.io/icu/userguide/format_parse/messages/
