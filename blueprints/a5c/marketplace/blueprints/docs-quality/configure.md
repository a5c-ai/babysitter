# docs-quality — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `lintPreset` | `default`, `relaxed`, `strict` | `default` | `.markdownlint-cli2.jsonc` |
| `lineLength` | integer | `120` | MD013 `line_length` |
| `allowedHtml` | list of tags | `['br','details','summary','kbd']` | MD033 |
| `linkCheckMode` | `offline`, `online`, `nightly` | `offline`+`nightly` | workflow |
| `linkRetries` | integer | `2` | `lychee.toml` |
| `linkExclude` | regex list | twitter/x/localhost | `lychee.toml` |
| `spellLanguage` | locale | `en-US` | `.cspell.json` |
| `docCoverageMin` | `0`–`100` | `70` | interrogate `fail-under` |
| `includeCodeBlocks` | `true`/`false` | `false` | MD013 `code_blocks` |
| `ignorePaths` | glob list | `[node_modules,dist,.next]` | all tools |
| `ciGate` | `off`, `warn`, `error` | `error` | workflow |

## 2. Adjust Markdownlint Rules

Edit `.markdownlint-cli2.jsonc`:

```jsonc
{
  "config": {
    "default": true,
    "MD013": false,              // disable line length entirely
    "MD034": false,              // allow bare URLs
    "MD036": false,              // allow emphasis as heading
    "MD025": { "level": 1 }      // only one top-level H1
  }
}
```

## 3. Per-Directory Overrides

```jsonc
{
  "globs": ["**/*.md"],
  "ignores": ["CHANGELOG.md", "node_modules/**"],
  "customRules": [],
  "configOverride": {
    "docs/adr/*.md": { "MD025": false }
  }
}
```

## 4. Spell Check Dictionaries

Add project terms:

```bash
echo "babysitter" >> .cspell/project-terms.txt
echo "OpenTelemetry" >> .cspell/project-terms.txt
```

Inline suppression in a doc:

```markdown
<!-- cspell:disable-next-line -->
Some line with a genuine proprietary term.

<!-- cspell:ignore FooBar WidgetCo -->
```

## 5. Link Check Scope

Offline-only fast check (PR):

```bash
lychee --offline '**/*.md'
```

Full online check (nightly):

```bash
lychee --verbose --max-concurrency 8 '**/*.md'
```

Exclude specific domains:

```toml
# lychee.toml
exclude = ["^https://flaky-third-party\\.example\\.com"]
```

## 6. Fail Thresholds

### Markdownlint — warn-only

Remove from CI required checks, or:

```yaml
markdownlint:
  continue-on-error: true
```

### Interrogate — progressive tightening

```toml
[tool.interrogate]
fail-under = 60  # start
# Raise to 70, 80, 90 over time
```

## 7. Configure Writing Style (optional Vale)

```bash
brew install vale
vale init
```

Add Vale to `.github/workflows/docs-quality.yml` for prose style (Microsoft / Google / Proselint packages).

## 8. Inclusive Language Check (optional alex)

```bash
npm install -D alex
```

```json
{ "scripts": { "docs:inclusive": "alex '**/*.md'" } }
```

## 9. Run Docs Improvement Process

```bash
babysitter run:create \
  --process-id docs-improve \
  --entry .a5c/processes/docs-quality/improve.js#process \
  --prompt "Fix all markdownlint violations and add missing JSDoc to top 10 undocumented public symbols" \
  --json
```

## 10. Configure MkDocs / Docusaurus Build Check

If the project uses a doc generator, add a build-check job:

```yaml
docs-build:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v6
    - run: pip install mkdocs-material
    - run: mkdocs build --strict  # fail on warnings
```

This catches broken cross-references and missing pages that markdownlint/lychee miss.
