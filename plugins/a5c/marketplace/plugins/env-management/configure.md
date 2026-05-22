# env-management — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `exampleFile` | `.env.example`, `.env.sample` | `.env.example` | repo root |
| `linter` | `dotenv-linter`, `dotenvx`, `none` | `dotenv-linter` | pre-commit hook |
| `secretScan` | `gitleaks`, `trufflehog`, `both`, `off` | `gitleaks` | pre-commit + CI |
| `ciGate` | `warn`, `error` | `error` | workflow `continue-on-error` |
| `missingVarCheck` | `on`, `off` | `on` | `scripts/check-env-vars.mjs` |
| `unusedVarPolicy` | `warn`, `error`, `ignore` | `warn` | script logic |
| `exemptPrefixes` | list (e.g. `NEXT_PUBLIC_`, `VITE_`) | `[]` | script logic |
| `sourceGlobs` | list of globs | stack-specific | script logic |
| `gitignoreRules` | `.env`, `.env.local`, `.env.*.local` | all three | `.gitignore` |

## 2. Change Canonical Example File

Rename `.env.example` → `.env.sample`:

```bash
git mv .env.example .env.sample
```

Update `scripts/check-env-vars.mjs`:

```javascript
const envExample = readFileSync('.env.sample', 'utf8');
```

Update `.gitignore` include rule: `!.env.sample`.

## 3. Adjust Lint Severity

`.dotenv-linter.yaml`:

```yaml
quiet: true            # suppress info-level messages
recursive: false
skip:
  - UnorderedKey       # allow any order
  - EndingBlankLine
schema:
  .env.example:
    required: true
```

Full rule list: https://dotenv-linter.github.io/#/available_checks

## 4. Exempt Prefixes from Secret Scanning

Edit `.gitleaks.toml` at repo root:

```toml
[allowlist]
description = "Public-by-convention prefixes"
regexes = [
  '''(?i)^NEXT_PUBLIC_[A-Z0-9_]+=''',
  '''(?i)^VITE_[A-Z0-9_]+=''',
  '''(?i)^PUBLIC_[A-Z0-9_]+='''
]
paths = [ '''\.env\.example$''' ]
```

## 5. Extend the Missing-Variable Check to More Patterns

Edit `scripts/check-env-vars.mjs`:

```javascript
const patterns = [
  /process\.env\.([A-Z0-9_]+)/g,
  /process\.env\[['"]([A-Z0-9_]+)['"]\]/g,
  /import\.meta\.env\.([A-Z0-9_]+)/g,
  /getEnv\(['"]([A-Z0-9_]+)['"]\)/g,
];
```

## 6. Support Python

Create `scripts/check_env_vars.py`:

```python
#!/usr/bin/env python3
import re, sys, pathlib

declared = set()
for line in pathlib.Path(".env.example").read_text().splitlines():
    line = line.strip()
    if line and not line.startswith("#"):
        declared.add(line.split("=", 1)[0].strip())

patterns = [
    re.compile(r"""os\.environ\[['"]([A-Z0-9_]+)['"]\]"""),
    re.compile(r"""os\.getenv\(['"]([A-Z0-9_]+)['"]"""),
    re.compile(r"""environ\.get\(['"]([A-Z0-9_]+)['"]"""),
]

referenced = set()
for py in pathlib.Path(".").rglob("*.py"):
    if "/.venv/" in str(py) or "/site-packages/" in str(py):
        continue
    src = py.read_text(errors="ignore")
    for p in patterns:
        for m in p.finditer(src):
            referenced.add(m.group(1))

missing = sorted(referenced - declared)
if missing:
    print("Missing from .env.example:", *missing, sep="\n  ")
    sys.exit(1)
```

## 7. Warn-Only Mode During Rollout

Edit `.github/workflows/env.yml`:

```yaml
jobs:
  lint:
    continue-on-error: true   # temporary, flip to false after 2 weeks
```

Track the deadline in a TODO comment in the workflow file.

## 8. Skip Env Check on Doc-Only PRs

```yaml
on:
  pull_request:
    paths-ignore: ['**/*.md', 'docs/**']
```

## 9. Secret Rotation Playbook

Document in `CONTRIBUTING.md`:

1. If a secret is accidentally committed, rotate it immediately at the source
2. Force-push only if the commit has not been merged
3. For merged leaks, rotate at source and leave history as-is — rewriting history of shared branches is worse than accepting the leak in history

## 10. Encrypted `.env.sops` (Optional)

If the project uses sops, add `.env.enc`:

```bash
sops --encrypt --age <recipient> .env > .env.enc
git add .env.enc
```

Update `.gitignore` to allow `.env.enc`:

```
!.env.enc
```

Hook `sops --decrypt .env.enc > .env` into the project's bootstrap script.

## 11. Per-Environment Example Files

For multi-environment projects:

```
.env.example
.env.development.example
.env.staging.example
.env.production.example
```

Update the missing-var check to iterate all `*.example` files and union the declared set.

## 12. Integrate with Doppler / Infisical

These tools replace `.env` at runtime. Document the `doppler run -- npm start` or `infisical run -- npm start` command in `CONTRIBUTING.md`. The linting and CI gate still apply to `.env.example`.
