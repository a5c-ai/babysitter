# mise-asdf — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `manager` | `mise`, `asdf`, `both` | `mise` | (doc) |
| `versionFile` | `.tool-versions`, `.mise.toml` | `.tool-versions` | repo root |
| `pinningStrategy` | `exact`, `minor`, `major` | `exact` | version strings |
| `includeDevTools` | `on`, `off` | `on` | which tools to pin |
| `autoInstallOnCd` | `on`, `off` | `on` (mise) | `mise.toml` `[settings]` |
| `ciCache` | `on`, `off` | `on` | `jdx/mise-action` / `asdf-vm/actions` |
| `preCommitCheck` | `on`, `off` | `on` | hook framework |
| `experimental` | `on`, `off` | `on` | `[settings] experimental` |
| `idiomaticFiles` | list of tool names | `['python', 'node']` | `[settings] idiomatic_version_file_enable_tools` |

## 2. Upgrade a Tool Version

Edit `.tool-versions`:

```
nodejs 22.14.0
```

Then run:

```bash
mise install   # or: asdf install
```

Commit the file. CI picks up the new version automatically via cache-bust on the file hash.

## 3. Switch to `.mise.toml`

Delete `.tool-versions` and create `.mise.toml`:

```toml
[tools]
node = "22.14.0"
python = "3.12.7"
```

Re-run `mise trust && mise install`.

## 4. Add a New Tool

### mise

```toml
[tools]
terraform = "1.10.2"
```

Or via CLI:

```bash
mise use terraform@1.10.2
```

### asdf

```bash
asdf plugin add terraform
echo "terraform 1.10.2" >> .tool-versions
asdf install
```

## 5. Project-Scoped Environment Variables (mise only)

```toml
[env]
NODE_ENV = "development"
DATABASE_URL = "postgres://localhost/devdb"
_.file = [".env"]       # load additional file
_.path = ["./bin"]      # prepend to PATH
```

Variables activate when you `cd` into the project. They persist for subshells.

## 6. Project Tasks (mise only)

```toml
[tasks.test]
description = "Run the test suite"
run = "pnpm test"
depends = ["install"]

[tasks.install]
run = "pnpm install --frozen-lockfile"
sources = ["package.json", "pnpm-lock.yaml"]
outputs = ["node_modules"]
```

Run: `mise run test`. `sources` / `outputs` enable build-cache skipping.

## 7. Per-Directory Version Overrides

Create a `.tool-versions` in any subdirectory to override the root config within that subtree. Useful in monorepos where `services/legacy` pins an older Node.

## 8. Disable Auto-Install on cd

```toml
[settings]
auto_install = false
```

Contributors must run `mise install` manually after pulling version changes.

## 9. Legacy Version File Support

Enable reading of `.nvmrc`, `.python-version`, `.ruby-version`, etc.:

```toml
[settings]
idiomatic_version_file_enable_tools = ["python", "node", "ruby", "java"]
```

mise will resolve versions from these files even without `.tool-versions`.

## 10. CI Cache Tuning

```yaml
- uses: jdx/mise-action@v2
  with:
    experimental: true
    install: true
    cache: true
    cache_key_prefix: mise-${{ runner.os }}
    log_level: info
```

For matrix builds, use `cache_key_prefix` per matrix dimension so OS variants don't collide.

## 11. Private Plugin Sources (asdf)

```bash
asdf plugin add mycorp-tool https://github.com/mycorp/asdf-mycorp-tool.git
echo "mycorp-tool 1.2.3" >> .tool-versions
```

For mise, use `[tools]` with a URL:

```toml
[tools]
"asdf:mycorp/asdf-mycorp-tool" = "1.2.3"
```

## 12. Disabling a Specific Tool Temporarily

Comment out the line in `.tool-versions` or `.mise.toml`:

```
# nodejs 22.12.0  -- rolled back while investigating issue #4231
nodejs 20.18.1
```

Log the reason in the commit message so the rollback is traceable.
