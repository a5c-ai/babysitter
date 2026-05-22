# i18n — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `sourceLocale` | locale code | `en` | extraction config, CI base |
| `targetLocales` | array of locale codes | `['es','fr','de']` | extraction config, `check-missing` script |
| `missingKeyGate` | `off`, `warn`, `error` | `error` | `i18n-validate` CI job |
| `unusedKeyGate` | `off`, `warn`, `error` | `warn` | `keepRemoved` in parser config |
| `literalStringLint` | `off`, `warn`, `error` | `error` | `i18next/no-literal-string` rule |
| `extractOnCommit` | `on`, `off` | `on` | `.husky/pre-commit` |
| `failOnExtractDrift` | `true`, `false` | `true` | `failOnUpdate` in parser config + CI |
| `keyFormatStyle` | `camelCase`, `kebab-case`, `snake_case`, `PascalCase` | `kebab-case` | lint rule + extraction |
| `interpolationSyntax` | `{{name}}`, `{name}`, `%(name)s` | `{{name}}` | runtime library config |
| `fallbackLocale` | locale code or chain | `en` | runtime library config |
| `pluralRule` | `cldr`, `simple` | `cldr` | ICU / runtime config |
| `reportFormat` | `json`, `html`, `junit` | `json` | workflow artifact |

## 2. Add or Remove Locales

### i18next-parser

Edit `i18next-parser.config.mjs`:

```javascript
export default {
  locales: ['en', 'es', 'fr', 'de', 'ja', 'pt-BR'],  // add ja, pt-BR
  // ...
};
```

Run:

```bash
npm run i18n:extract
```

New locale files will be created as empty stubs. Update `scripts/check-missing-keys.mjs` `targets` array to match.

### Django

```bash
python manage.py makemessages -l ja -l pt_BR
```

### Angular

Add to `angular.json`:

```json
"i18n": {
  "sourceLocale": "en",
  "locales": {
    "es": "src/locale/messages.es.xlf",
    "fr": "src/locale/messages.fr.xlf",
    "ja": "src/locale/messages.ja.xlf"
  }
}
```

## 3. Adjust Lint Severity

### Relax literal-string rule for specific files

```javascript
{
  files: ['src/admin/**', 'src/internal/**'],  // internal tools, English-only
  rules: {
    'i18next/no-literal-string': 'off',
    '@intlify/vue-i18n/no-raw-text': 'off',
  },
},
```

### Exempt specific strings (regex)

```javascript
'i18next/no-literal-string': ['error', {
  words: {
    exclude: [
      '^[A-Z_]+$',           // CONSTANTS
      '^https?://',          // URLs
      '^[0-9\\s\\-+()]+$',   // phone-number-ish
      '^@[\\w-]+',           // mentions
    ],
  },
}],
```

### Allow literals in logs / errors

```javascript
'i18next/no-literal-string': ['error', {
  callees: { exclude: ['console\\.(log|warn|error|info)', 'Error', 'throw'] },
}],
```

## 4. Change Interpolation / Key Format

### Interpolation syntax (i18next)

```typescript
// src/i18n.ts
i18n.init({
  interpolation: {
    prefix: '{',
    suffix: '}',  // now {name} instead of {{name}}
    escapeValue: false,
  },
});
```

### Key format

```javascript
// i18next-parser.config.mjs
keySeparator: '.',
namespaceSeparator: ':',
```

```javascript
// eslint config
'@intlify/vue-i18n/key-format-style': ['error', 'snake_case'],
```

## 5. Change CI Gate Behavior

### Warn-only mode (grace period)

```yaml
i18n-validate:
  continue-on-error: true
i18n-extract:
  continue-on-error: true
```

### Block only on missing keys in specific locales

Edit `scripts/check-missing-keys.mjs`:

```javascript
const blockingLocales = ['es'];           // only ES blocks PRs
const warnOnlyLocales = ['fr', 'de'];
// ...
const failed = missing.some((m) => blockingLocales.includes(m.locale));
```

## 6. Configure Extraction Behavior

### Keep old keys (historical glossary)

```javascript
// i18next-parser.config.mjs
keepRemoved: true,
```

### Mark removed keys instead of deleting

```javascript
keepRemoved: false,
createOldCatalogs: true,  // writes en_old.json with removed keys
```

### Custom namespaces

```javascript
namespaceSeparator: ':',
output: 'src/locales/$LOCALE/$NAMESPACE.json',
```

Use in code:

```typescript
t('auth:login.submit-button');
```

## 7. Switch Translation Library

### react-intl → react-i18next

```bash
npm uninstall react-intl eslint-plugin-formatjs @formatjs/cli
npm install react-i18next i18next
npm install -D eslint-plugin-i18next i18next-parser
```

Rewrite `<FormattedMessage id="..." />` to `{t('...')}` and migrate ICU messages to i18next syntax.

### i18next → FormatJS (ICU MessageFormat)

```bash
npm uninstall react-i18next i18next eslint-plugin-i18next i18next-parser
npm install react-intl
npm install -D eslint-plugin-formatjs @formatjs/cli
```

Use FormatJS for richer plural / gender / select support.

### Adopt Fluent (Mozilla)

```bash
npm install @fluent/react @fluent/bundle @fluent/langneg
```

Fluent is preferred for complex asymmetric plural / gender rules across many locales.

## 8. Set Up Machine-Translation Seeding

Run the babysitter seed process to auto-translate missing keys:

```bash
babysitter run:create \
  --process-id i18n-seed-translations \
  --entry .a5c/processes/i18n/seed-translations.js#process \
  --prompt "Translate all missing keys in es, fr, de using the English source as context. Flag idioms and strings needing human review." \
  --json
```

Review output before committing — machine translations are drafts, not final.

## 9. Add Pseudo-Locale for QA

Pseudo-locales (`[!!Ťéšť ŝťŕíñĝ!!]`) catch truncation, missing translations, and non-Latin rendering bugs.

### i18next

```bash
npm install -D i18next-pseudo
```

```typescript
import Pseudo from 'i18next-pseudo';
i18n.use(new Pseudo({ enabled: process.env.NODE_ENV === 'development' }));
```

### Angular

```bash
ng extract-i18n --output-path src/locale --format xlf2
# Generate pseudo XLF via @locl/cli or custom script
```

## 10. Enforce Descriptions for Translators

### FormatJS

```javascript
'formatjs/enforce-description': 'error',
'formatjs/enforce-default-message': 'error',
```

### i18next

Use inline comments:

```typescript
// t('login.submit', 'Submit — button on the login form')
```

And configure the parser to preserve comments.

## 11. Schedule Weekly Translation Audit

`.github/workflows/i18n-audit.yml`:

```yaml
on:
  schedule:
    - cron: '0 9 * * 1'  # Mon 09:00 UTC
```

Run full extract + missing-key report, open a tracking issue if any locale falls below 95 % coverage.

## 12. Integrate with Translation Management System

### Crowdin / Lokalise / Phrase

These services sync with `src/locales/*.json` via CLI. Example for Crowdin:

```bash
npm install -D @crowdin/cli
# crowdin.yml + API token in CI secrets
crowdin upload sources
crowdin download
```

Gate the `i18n-validate` job on successful Crowdin pull so CI always sees the latest translations.
