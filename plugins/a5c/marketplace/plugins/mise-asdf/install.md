# mise-asdf — Install Instructions

Pin tool versions across developer machines and CI using mise (preferred) or asdf. Generates `.tool-versions` or `.mise.toml` from detected runtimes, wires up CI caching, and installs a pre-commit hook that guarantees every contributor has the exact toolchain the project requires.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Detect runtimes from manifests:
   - Node: `package.json` `engines.node`, `.nvmrc`
   - Python: `pyproject.toml` `requires-python`, `.python-version`
   - Go: `go.mod` `go` directive
   - Rust: `rust-toolchain.toml`, `rust-toolchain`
   - Ruby: `.ruby-version`, `Gemfile`
   - Java: `.java-version`, `pom.xml`
   - Deno / Bun: `deno.json`, `bunfig.toml`
   - Terraform / OpenTofu: `versions.tf`, `.terraform-version`
2. Check for existing toolchain manager: `.tool-versions`, `.mise.toml`, `mise.toml`, `.asdfrc`
3. Check for package manager: `pnpm-lock.yaml` → pin `pnpm`; `uv.lock` → pin `uv`; `poetry.lock` → pin `poetry`
4. Check CI provider: `.github/workflows/`, `.gitlab-ci.yml`, `.circleci/`
5. Check for existing pre-commit framework: `.husky/`, `.pre-commit-config.yaml`, `lefthook.yml`
6. Summarize findings to the user

### Stage 2: Tool Manager Selection

Ask which tool manager to configure:

1. **mise** (recommended) — Fast Rust-based replacement for asdf, compatible with `.tool-versions`, includes env and task management
2. **asdf** — Classic, widely-installed, plugin-based
3. **Both** — Generate a config that works with either (use `.tool-versions`)

### Stage 3: Version Pinning Strategy

Ask:
- Pin to exact versions (`22.12.0`) or minor (`22.x`)? Default: **exact**, reproducibility trumps convenience
- Include dev-only tools (`jq`, `shellcheck`, `gh`, `just`)? Default: **yes**
- Auto-install on shell `cd` into repo? Default: **yes** (mise) / **manual `asdf install`** (asdf)

### Stage 4: CI Integration

Ask:
- Configure CI caching of tool installs? Default: **yes**
- Provider? (GitHub Actions default)
- Fail CI if `.tool-versions` differs from CI runtime? Default: **yes**

### Stage 5: Pre-commit Hook

Ask:
- Install pre-commit hook to verify tool versions match `.tool-versions`? Default: **yes**
- Hook framework: husky (Node), pre-commit (Python/polyglot), lefthook (polyglot), or plain `.git/hooks/pre-commit`

## Step 2: Install mise / asdf Locally (Document in README)

### mise

```bash
# macOS / Linux
curl https://mise.run | sh
# or
brew install mise

# activate in shell (add to ~/.bashrc / ~/.zshrc)
eval "$(mise activate bash)"
```

### asdf

```bash
brew install asdf
# or git install per https://asdf-vm.com/guide/getting-started.html

# activate in shell
. "$HOME/.asdf/asdf.sh"
```

Document the installation command for the user's target platform in `CONTRIBUTING.md`.

## Step 3: Generate `.tool-versions` OR `.mise.toml`

### Cross-compatible `.tool-versions`

```
nodejs 22.12.0
pnpm 9.15.0
python 3.12.7
uv 0.5.10
go 1.23.4
rust 1.83.0
terraform 1.10.2
gh 2.63.2
jq 1.7.1
shellcheck 0.10.0
just 1.38.0
```

Both mise and asdf read this file. The order does not matter. Lines starting with `#` are comments.

### mise-native `.mise.toml` (richer features)

```toml
[tools]
node = "22.12.0"
pnpm = "9.15.0"
python = "3.12.7"
uv = "0.5.10"
go = "1.23.4"
rust = "1.83.0"
terraform = "1.10.2"
gh = "2.63.2"

[env]
NODE_ENV = "development"
PYTHONDONTWRITEBYTECODE = "1"
_.path = ["./node_modules/.bin", "./scripts"]

[tasks.install]
description = "Install project dependencies"
run = "pnpm install --frozen-lockfile"

[tasks.dev]
description = "Run dev server"
run = "pnpm dev"
depends = ["install"]

[settings]
experimental = true
idiomatic_version_file_enable_tools = ["python", "node"]
```

Run `mise trust` once to approve the config:

```bash
mise trust
mise install
```

## Step 4: Install asdf Plugins (asdf only)

```bash
asdf plugin add nodejs
asdf plugin add python
asdf plugin add golang
asdf plugin add rust
asdf plugin add terraform
asdf plugin add github-cli
asdf install
```

mise installs plugins automatically.

## Step 5: CI Integration — GitHub Actions

### mise

```yaml
# .github/workflows/ci.yml (add to existing or new)
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: jdx/mise-action@v2
        with:
          experimental: true
          install: true
          cache: true
      - run: mise run install
      - run: mise run test
```

`jdx/mise-action` caches both the mise install and all tool installs keyed on `.mise.toml` / `.tool-versions`.

### asdf

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: asdf-vm/actions/install@v3
      - run: npm ci
      - run: npm test
```

## Step 6: Pre-commit Hook — Ensure Installed

Create `scripts/check-tool-versions.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
if command -v mise >/dev/null 2>&1; then
  if ! mise doctor >/dev/null 2>&1; then
    echo "mise reports problems; run 'mise install' and 'mise doctor'" >&2
    exit 1
  fi
  mise install
elif command -v asdf >/dev/null 2>&1; then
  asdf install
else
  echo "Neither mise nor asdf found — install one: https://mise.jdx.dev/ or https://asdf-vm.com/" >&2
  exit 1
fi
```

```bash
chmod +x scripts/check-tool-versions.sh
```

### husky

```bash
npx husky add .husky/pre-commit "bash scripts/check-tool-versions.sh"
```

### pre-commit framework

Append to `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: local
    hooks:
      - id: tool-versions
        name: Verify pinned tool versions are installed
        entry: bash scripts/check-tool-versions.sh
        language: system
        pass_filenames: false
        stages: [pre-commit]
```

```bash
pre-commit install
```

### lefthook

```yaml
# lefthook.yml
pre-commit:
  commands:
    tool-versions:
      run: bash scripts/check-tool-versions.sh
```

## Step 7: Editor Integration

Recommend (in `CONTRIBUTING.md`):
- VS Code / Cursor: install `hverlin.mise-vscode` extension
- JetBrains IDEs: the asdf plugin handles `.tool-versions` natively

## Step 8: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name mise-asdf --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 9: Verify

1. `mise current` (or `asdf current`) shows all pinned versions resolved
2. `mise install` (or `asdf install`) completes without error
3. `node --version`, `python --version`, etc. match `.tool-versions`
4. CI job uses cached tool installs on second run (check cache hit in logs)
5. Pre-commit hook blocks commits when a required tool is missing
6. Teammates can bootstrap from clone in one command: `mise install && mise run install`

## Reference

- mise: https://mise.jdx.dev/
- asdf: https://asdf-vm.com/
- jdx/mise-action: https://github.com/jdx/mise-action
- asdf-vm/actions: https://github.com/asdf-vm/actions
- `.tool-versions` spec: https://asdf-vm.com/manage/configuration.html
