# env-management — Install Instructions

Establish discipline around environment variables — maintain a canonical `.env.example` that stays in lockstep with actual usage, lint `.env` files for common mistakes (BOMs, quoting, duplicates), block commits of real secrets, and gate CI on a verification pass that every variable referenced in source code is declared in `.env.example`.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Search for `.env*` files: `.env`, `.env.local`, `.env.example`, `.env.sample`, `.env.production`
2. Detect language(s) for env access patterns:
   - Node: `process.env.FOO`, `import.meta.env.FOO`
   - Python: `os.environ["FOO"]`, `os.getenv("FOO")`, `env("FOO")` (django-environ)
   - Go: `os.Getenv("FOO")`
   - Rust: `std::env::var("FOO")`, `env!("FOO")`
3. Check `.gitignore` for `.env` exclusions
4. Check for existing env-management tooling: `dotenv-linter`, `dotenvx`, `direnv`, `sops`, `vault`
5. Check pre-commit framework presence: `.husky/`, `.pre-commit-config.yaml`, `lefthook.yml`
6. Check CI: `.github/workflows/`
7. Summarize findings to the user — especially call out any real-looking secrets accidentally committed

### Stage 2: Layers to Install

Ask which layers to enable (multi-select):

1. **`.env.example` maintenance** — Canonical list of required variables with placeholder values
2. **dotenv-linter pre-commit** — Lint all `.env*` files on staged changes
3. **Secret scan** — Block commits of strings matching common API-key patterns (trufflehog / gitleaks)
4. **Missing-var CI gate** — Parse source code for env references, fail CI if any reference is not declared in `.env.example`
5. **All** — Install every layer

### Stage 3: Secret Storage Strategy

Ask how real secrets are distributed to developers:

1. **1Password / Bitwarden / Doppler / Infisical** — secret manager (preferred)
2. **sops + age / gpg** — encrypted `.env.sops` committed to the repo
3. **Manual share** — document the process (least preferred)

Record the choice in `CONTRIBUTING.md`; do not attempt to wire up the secret manager here — that is its own plugin.

### Stage 4: Grace Period

Ask:
- Start with warn-only mode? Default: **no** (fail fast)
- Exempt certain prefixes (e.g. `NEXT_PUBLIC_*`) from secret-scan rules? Default: **yes**

## Step 2: Generate or Refresh `.env.example`

Scan source for env references and produce a sorted, deduplicated list. Each entry includes a placeholder value and a comment describing purpose.

```
# .env.example
# Committed to git. Copy to .env and fill in real values.
# NEVER put real secrets in this file.

# ==== Core ====
NODE_ENV=development
PORT=3000

# ==== Database ====
DATABASE_URL=postgres://user:password@localhost:5432/appdb

# ==== Auth ====
SESSION_SECRET=change-me-32-byte-random-hex
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# ==== Third-party APIs ====
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
SENTRY_DSN=

# ==== Feature flags ====
FEATURE_NEW_DASHBOARD=false
```

## Step 3: `.gitignore` Hygiene

Ensure `.gitignore` contains:

```
.env
.env.local
.env.*.local
!.env.example
!.env.*.example
```

Never ignore `.env.example`.

## Step 4: Install dotenv-linter

```bash
# via cargo
cargo install dotenv-linter

# or via Homebrew
brew install dotenv-linter

# or pre-built binary — see https://dotenv-linter.github.io/
```

Create `.dotenv-linter.yaml`:

```yaml
quiet: false
recursive: false
schema:
  .env.example:
    required: true
skip:
  - EndingBlankLine
```

Run baseline:

```bash
dotenv-linter .env.example .env.sample 2>/dev/null
```

## Step 5: Pre-commit Hook — Lint `.env*`

### pre-commit framework

Append to `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/dotenv-linter/dotenv-linter
    rev: v3.3.0
    hooks:
      - id: dotenv-linter
        args: ['--quiet']

  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.21.2
    hooks:
      - id: gitleaks

  - repo: local
    hooks:
      - id: no-commit-env
        name: Refuse to commit real .env files
        entry: bash -c 'for f; do case "$f" in *.env|*.env.local|*.env.*.local) echo "Refusing to commit $f"; exit 1;; esac; done'
        language: system
        files: ^\.env($|\.)
        exclude: '\.env\.example$|\.env\..*\.example$'
```

```bash
pre-commit install
```

### husky + lint-staged (Node projects)

```bash
npm install -D lint-staged
```

`package.json`:

```json
{
  "lint-staged": {
    ".env*": ["dotenv-linter"],
    "*": ["gitleaks protect --staged --redact"]
  }
}
```

`.husky/pre-commit`:

```bash
npx lint-staged
```

## Step 6: Missing-Variable CI Gate

Create `scripts/check-env-vars.mjs` (Node-focused; adapt for Python as needed):

```javascript
#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { globSync } from 'glob';

const envExample = readFileSync('.env.example', 'utf8');
const declared = new Set(
  envExample
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split('=')[0].trim())
);

const sourceGlobs = ['src/**/*.{js,jsx,ts,tsx,mjs,cjs}', 'app/**/*.{js,jsx,ts,tsx}'];
const files = sourceGlobs.flatMap((g) => globSync(g, { ignore: ['**/node_modules/**'] }));

const referenced = new Set();
const patterns = [
  /process\.env\.([A-Z0-9_]+)/g,
  /import\.meta\.env\.([A-Z0-9_]+)/g,
];
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  for (const p of patterns) {
    for (const m of src.matchAll(p)) referenced.add(m[1]);
  }
}

const missing = [...referenced].filter((v) => !declared.has(v)).sort();
const unused = [...declared].filter((v) => !referenced.has(v)).sort();

let failed = false;
if (missing.length) {
  console.error('Missing from .env.example:');
  for (const v of missing) console.error('  ' + v);
  failed = true;
}
if (unused.length) {
  console.warn('Declared but unused (review):');
  for (const v of unused) console.warn('  ' + v);
}
process.exit(failed ? 1 : 0);
```

```bash
chmod +x scripts/check-env-vars.mjs
```

Add to `package.json`:

```json
{
  "scripts": {
    "env:check": "node scripts/check-env-vars.mjs"
  }
}
```

## Step 7: CI Workflow

Create `.github/workflows/env.yml`:

```yaml
name: Env Vars
on:
  pull_request:
    paths: ['.env.example', 'src/**', 'app/**', 'scripts/check-env-vars.mjs']
  push:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'npm' }
      - run: npm ci
      - name: dotenv-linter
        uses: dotenv-linter/action-dotenv-linter@v2
      - name: Missing-variable check
        run: npm run env:check
      - name: Secret scan
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Step 8: Document Rollout

Edit `CONTRIBUTING.md`:

```markdown
## Environment variables

1. Copy `.env.example` to `.env` and fill in real values.
2. Real secrets are distributed via <1Password / sops / Doppler / ...>.
3. Never commit `.env`. The pre-commit hook will block it.
4. Add new variables to `.env.example` in the same PR that introduces them.
5. Run `npm run env:check` before opening a PR.
```

## Step 9: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name env-management --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 10: Verify

1. `dotenv-linter .env.example` passes
2. `npm run env:check` exits 0 with no missing variables
3. `git commit .env` is blocked by the pre-commit hook
4. Gitleaks catches a planted fake key (test with `AKIAIOSFODNN7EXAMPLE` in a commit)
5. CI workflow is green on a clean branch
6. All developers have copied `.env.example` → `.env`

## Reference

- dotenv-linter: https://dotenv-linter.github.io/
- gitleaks: https://github.com/gitleaks/gitleaks
- trufflehog: https://github.com/trufflesecurity/trufflehog
- pre-commit framework: https://pre-commit.com/
