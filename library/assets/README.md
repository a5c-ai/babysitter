# library/assets

Drop-in configuration files assimilated from the a5c-ai registry. Installed into
target repos by thin orchestration processes under `library/processes/shared/`.

## Assets

| Path | Source | Install process |
|------|--------|-----------------|
| `security/gitleaks.toml` | https://raw.githubusercontent.com/a5c-ai/a5c/main/registry/packages/security/files/gitleaks.toml | `processes/shared/local-dev/install-quality-gates.js` (layer: `gitleaks`) |
| `code-quality/commitlint.config.cjs` | https://raw.githubusercontent.com/a5c-ai/a5c/main/registry/packages/code-quality/files/commitlint.config.cjs | `processes/shared/local-dev/install-quality-gates.js` (layer: `commitlint`) |
| `code-quality/commitlint.lenient.cjs` | https://raw.githubusercontent.com/a5c-ai/a5c/main/registry/packages/code-quality/files/commitlint.lenient.cjs | `processes/shared/local-dev/install-quality-gates.js` (layer: `commitlint`) |
| `code-quality/eslint.config.js` | https://raw.githubusercontent.com/a5c-ai/a5c/main/registry/packages/code-quality/files/eslint.config.js | `processes/shared/local-dev/install-quality-gates.js` (layer: `eslint`) |
| `code-quality/typos.toml` | https://raw.githubusercontent.com/a5c-ai/a5c/main/registry/packages/code-quality/files/typos.toml | `processes/shared/local-dev/install-quality-gates.js` (layer: `typos`) |
| `code-quality/husky/pre-commit` | https://raw.githubusercontent.com/a5c-ai/a5c/main/registry/packages/code-quality/files/.husky/pre-commit | `processes/shared/local-dev/install-quality-gates.js` (layer: `husky`) |
| `release/releaserc.cjs` | a5c-ai/a5c registry/packages/release-management | `processes/shared/release/semantic-release-setup.js` |
