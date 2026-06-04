# Agent-Mux Terminology & Structure Gaps

The adapters family has pervasive naming inconsistencies across 42 packages, 8 binaries, and 3,500+ source references. This directory documents every gap and the target naming convention.

## Target Convention

- **Package name**: `@a5c-ai/adapters-<feature>` (e.g., `@a5c-ai/transport-adapter`)
- **Directory**: `packages/adapters/{feature}/` (all under adapters umbrella)
- **Binary**: `adapters-{feature}` (e.g., `adapters-hooks`)
- **Env vars**: `AGENT_MUX_*` (no `AMUX_*`)
- **Code identifiers**: `agentMux*` camelCase (no `adapters*`)
- **No "adapters" anywhere** — it's a bad abbreviation

## Documents

1. [**package-renames.md**](./package-renames.md) — All 42 packages: current → target name + directory
2. [**binary-renames.md**](./binary-renames.md) — All 8 binaries: current → target name
3. [**env-var-renames.md**](./env-var-renames.md) — All AMUX_* → AGENT_MUX_* mappings
4. [**code-identifier-renames.md**](./code-identifier-renames.md) — adapters* → agentMux* in source code
5. [**directory-moves.md**](./directory-moves.md) — Top-level packages to move under adapters/
