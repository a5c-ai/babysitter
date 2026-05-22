# nix-flake — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `channel` | `nixos-unstable`, `nixos-24.11`, `nixpkgs-unstable` | `nixos-unstable` | `inputs.nixpkgs.url` |
| `systems` | `x86_64-linux`, `aarch64-linux`, `x86_64-darwin`, `aarch64-darwin` | all four | `flake-utils.lib.eachDefaultSystem` |
| `outputs` | `devShells`, `packages`, `apps`, `checks`, `formatter` | `devShells+checks+formatter` | `outputs` block |
| `direnv` | `on`, `off` | `on` | `.envrc` |
| `ciCacheProvider` | `magic-nix-cache`, `cachix`, `none` | `magic-nix-cache` | workflow |
| `preCommitNix` | `on`, `off` | `off` | `git-hooks.nix` input |
| `overlays` | `rust-overlay`, `fenix`, `nixpkgs-ruby`, custom | stack-specific | `inputs` + `import nixpkgs { overlays = ... }` |

## 2. Pin to a Stable Channel

Edit `flake.nix`:

```nix
inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
```

Then:

```bash
nix flake update
nix flake check
```

## 3. Add a Package to devShell

```nix
devShells.default = pkgs.mkShell {
  packages = with pkgs; [ nodejs_22 pnpm git postgresql_17 ];
};
```

Run `direnv reload` (or exit + re-enter) to pick up changes.

## 4. Add an Overlay

### rust-overlay for Rust projects

```nix
inputs.rust-overlay.url = "github:oxalica/rust-overlay";

# inside outputs:
let
  pkgs = import nixpkgs {
    inherit system;
    overlays = [ rust-overlay.overlays.default ];
  };
  rust = pkgs.rust-bin.stable."1.83.0".default.override {
    extensions = [ "rust-analyzer" "rust-src" ];
  };
in { devShells.default = pkgs.mkShell { packages = [ rust ]; }; }
```

## 5. Define a Buildable Package

```nix
packages.default = pkgs.buildNpmPackage {
  pname = "my-app";
  version = "0.1.0";
  src = ./.;
  npmDepsHash = "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
  npmBuild = "npm run build";
};
```

Build: `nix build .#default`. Update `npmDepsHash` by running the command once, copying the expected hash from the error.

## 6. Define an App

```nix
apps.default = {
  type = "app";
  program = "${self.packages.${system}.default}/bin/my-app";
};
```

Run: `nix run .#default`.

## 7. Add Flake Checks

```nix
checks = {
  lint = pkgs.runCommand "lint" { } ''
    cd ${./.}
    ${pkgs.shellcheck}/bin/shellcheck scripts/*.sh
    touch $out
  '';
  format = pkgs.runCommand "format" { } ''
    ${pkgs.nixpkgs-fmt}/bin/nixpkgs-fmt --check ${./.}
    touch $out
  '';
};
```

Run `nix flake check` locally or in CI.

## 8. Customize shellHook

```nix
shellHook = ''
  export PROJECT_ROOT=$PWD
  export DATABASE_URL=postgres://localhost/devdb
  [ -f .env.local ] && set -a && source .env.local && set +a
  echo "devShell ready — project: $(basename $PROJECT_ROOT)"
'';
```

## 9. Multiple devShells

```nix
devShells = {
  default = pkgs.mkShell { packages = [ pkgs.nodejs_22 ]; };
  python = pkgs.mkShell { packages = [ pkgs.python312 pkgs.uv ]; };
  ops = pkgs.mkShell { packages = [ pkgs.terraform pkgs.awscli2 ]; };
};
```

Enter with: `nix develop .#python`. direnv can select one via `.envrc`: `use flake .#python`.

## 10. Update Inputs

```bash
nix flake update                            # update all inputs
nix flake lock --update-input nixpkgs       # update one input
```

Commit `flake.lock` after any input change.

## 11. Switch CI Cache Provider

### magic-nix-cache (default, GitHub-hosted, free)

```yaml
- uses: DeterminateSystems/magic-nix-cache-action@v8
```

### Cachix

```yaml
- uses: cachix/cachix-action@v15
  with:
    name: your-cache
    authToken: '${{ secrets.CACHIX_AUTH_TOKEN }}'
```

### No cache

Remove the cache step. CI will rebuild from nixpkgs binary cache only.

## 12. Limit Supported Systems

```nix
outputs = { self, nixpkgs, flake-utils }:
  flake-utils.lib.eachSystem [ "x86_64-linux" "aarch64-darwin" ] (system: { ... });
```

Useful when a dependency does not build on Windows/WSL or older macOS.
