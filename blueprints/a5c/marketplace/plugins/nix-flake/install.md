# nix-flake — Install Instructions

Establish hermetic, reproducible development shells and builds using Nix flakes. Generates a `flake.nix` scaffold tailored to the project's stack, wires up direnv for automatic shell activation, adds a CI workflow that uses the Nix binary cache, and documents the bootstrap steps for newcomers.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Detect primary language(s): `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `flake.nix` (pre-existing)
2. Detect package manager: `pnpm-lock.yaml`, `uv.lock`, `poetry.lock`
3. Check for existing Nix setup: `flake.nix`, `flake.lock`, `shell.nix`, `default.nix`, `.envrc`
4. Check for direnv: `.envrc`, `~/.config/direnv/direnvrc`
5. Check for Nix on developer machines (document install via README if not present)
6. Check CI provider: `.github/workflows/`, `.gitlab-ci.yml`
7. Summarize findings to the user

### Stage 2: Flake Scope

Ask what the flake should provide (multi-select):

1. **`devShell`** — interactive development shell with toolchain + utilities (always)
2. **`packages`** — buildable output for the project itself (e.g. `nix build .`)
3. **`apps`** — `nix run .#<app>` entry points
4. **`checks`** — flake-level lint/test runnable by `nix flake check` in CI
5. **`nixosModules` / `homeManagerModules`** — rarely needed in app repos; skip unless requested

### Stage 3: Channel & Systems

Ask:
- Which nixpkgs channel? `nixos-unstable` (fresh), `nixos-24.11` (stable), `nixpkgs-unstable`. Default: **nixos-unstable**
- Which systems to support? `x86_64-linux`, `aarch64-linux`, `x86_64-darwin`, `aarch64-darwin`. Default: **all four**

### Stage 4: direnv

Ask:
- Enable direnv auto-activation via `.envrc`? Default: **yes**
- Use `nix-direnv` for fast caching? Default: **yes**

### Stage 5: CI Caching

Ask:
- Use Cachix or the public Nix binary cache for CI? Default: **public cache** (Cachix if a token is provided)

## Step 2: Install Nix Locally (Document in README)

```bash
# Determinate Nix installer (recommended: supports flakes out of the box)
curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install

# Or the official installer (requires enabling flakes in config)
sh <(curl -L https://nixos.org/nix/install) --daemon
echo 'experimental-features = nix-command flakes' | sudo tee -a /etc/nix/nix.conf
```

## Step 3: Generate `flake.nix`

### Generic polyglot template

```nix
{
  description = "Project development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            # core
            git
            gh
            jq
            just
            # language toolchains (enable as needed)
            nodejs_22
            pnpm
            python312
            uv
            go_1_23
            rustc
            cargo
            # utilities
            shellcheck
            shfmt
            pre-commit
          ];

          shellHook = ''
            echo "Nix devShell ready — $(node --version) / $(python --version) / $(go version | cut -d' ' -f3)"
            export PROJECT_ROOT=$PWD
          '';
        };

        checks.default = pkgs.runCommand "flake-check" { } ''
          echo "Placeholder check — replace with your linter/test command" > $out
        '';

        formatter = pkgs.nixpkgs-fmt;
      });
}
```

### Node-only minimal template

```nix
{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  inputs.flake-utils.url = "github:numtide/flake-utils";
  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = import nixpkgs { inherit system; };
      in {
        devShells.default = pkgs.mkShell {
          packages = [ pkgs.nodejs_22 pkgs.pnpm pkgs.git ];
        };
      });
}
```

### Rust template (using fenix or rust-overlay)

```nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay.url = "github:oxalica/rust-overlay";
  };
  outputs = { self, nixpkgs, flake-utils, rust-overlay }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ rust-overlay.overlays.default ];
        };
        toolchain = pkgs.rust-bin.fromRustupToolchainFile ./rust-toolchain.toml;
      in {
        devShells.default = pkgs.mkShell {
          packages = [ toolchain pkgs.pkg-config pkgs.openssl ];
        };
      });
}
```

## Step 4: Lock and Test

```bash
nix flake lock
nix flake check
nix develop --command bash -c 'node --version && python --version'
```

Commit `flake.nix` and `flake.lock`.

## Step 5: direnv Integration

Install direnv and nix-direnv (document in README):

```bash
# macOS
brew install direnv nix-direnv

# Linux (via Nix profile)
nix profile install nixpkgs#direnv nixpkgs#nix-direnv
```

Add to shell rc: `eval "$(direnv hook bash)"` (or `zsh`).

Create `.envrc`:

```bash
if ! has nix_direnv_version || ! nix_direnv_version 3.0.4; then
  source_url "https://raw.githubusercontent.com/nix-community/nix-direnv/3.0.4/direnvrc" "sha256-DzlYZ33mWF/Gs8DDeyjr8mnVmQGx7ASYqA5WlxwvBG4="
fi
use flake
```

Run once:

```bash
direnv allow
```

From now on, `cd`ing into the project activates the devShell automatically; leaving it deactivates.

Add to `.gitignore`:

```
.direnv/
.envrc.local
result
result-*
```

## Step 6: CI Integration — GitHub Actions

Create `.github/workflows/nix.yml`:

```yaml
name: Nix
on:
  pull_request:
    paths: ['flake.nix', 'flake.lock', '.github/workflows/nix.yml']
  push:
    branches: [main]

jobs:
  flake-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: DeterminateSystems/nix-installer-action@v16
      - uses: DeterminateSystems/magic-nix-cache-action@v8
      - run: nix flake check --all-systems
      - run: nix develop --command bash -c 'echo devShell OK'

  build:
    runs-on: ubuntu-latest
    needs: flake-check
    steps:
      - uses: actions/checkout@v6
      - uses: DeterminateSystems/nix-installer-action@v16
      - uses: DeterminateSystems/magic-nix-cache-action@v8
      - run: nix develop --command bash -c 'pnpm install --frozen-lockfile && pnpm test'
```

If using Cachix, replace `magic-nix-cache-action` with:

```yaml
      - uses: cachix/cachix-action@v15
        with:
          name: your-cache-name
          authToken: '${{ secrets.CACHIX_AUTH_TOKEN }}'
```

## Step 7: Optional — Lorri / Cachix Developer Caches

For teams sharing binaries, set up a Cachix cache:

```bash
cachix authtoken <token>
cachix use your-cache-name
nix build .#devShells.x86_64-linux.default --out-link .cachix-dev
cachix push your-cache-name .cachix-dev
```

Document this in `CONTRIBUTING.md` with a pointer to the cache substituter.

## Step 8: Pre-commit Hooks via Nix (Optional)

Use `git-hooks.nix` (formerly `pre-commit-hooks.nix`):

```nix
# flake.nix
inputs.git-hooks.url = "github:cachix/git-hooks.nix";

# inside outputs' per-system let:
checks.pre-commit = git-hooks.lib.${system}.run {
  src = ./.;
  hooks = {
    nixpkgs-fmt.enable = true;
    shellcheck.enable = true;
    prettier.enable = true;
  };
};
```

Developers can run `nix flake check` to verify.

## Step 9: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name nix-flake --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 10: Verify

1. `nix flake check` passes locally on Linux and macOS
2. `nix develop` enters a shell with all pinned tools
3. `direnv allow` activates the shell automatically on `cd`
4. CI workflow completes within a reasonable time on a warm cache
5. Teammates can bootstrap with: `nix develop` (no Nix-on-their-machine-already requirements beyond Nix itself)

## Reference

- Nix flakes: https://nix.dev/concepts/flakes
- nix-direnv: https://github.com/nix-community/nix-direnv
- DeterminateSystems installer & cache: https://github.com/DeterminateSystems
- Cachix: https://www.cachix.org/
- git-hooks.nix: https://github.com/cachix/git-hooks.nix
