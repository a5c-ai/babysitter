[Docs](../index.md) › [Getting Started](./README.md) › Migration

# Migration Guide: Prod (0.0.x) to v6 (5.1.0)

**Category:** Getting Started · **Last Updated:** 2026-06-22

## On this page

- [In Plain English](#in-plain-english)
- [Version Jump](#version-jump)
- [Breaking Changes](#breaking-changes)
- [Deprecated (still works, will be removed)](#deprecated-still-works-will-be-removed)
- [Migration Checklist](#migration-checklist)
- [Related Documentation](#related-documentation)

---

## In Plain English

**v6 is a major upgrade. The biggest change is that Babysitter is now harness-agnostic (via [Adapters](../features/adapters.md)) instead of Claude-only.** Along with that come a few breaking changes: the install package changed, two environment variables were renamed, one flag was removed, and the `plugins/` directory was renamed to `blueprints/`.

This page lists every breaking change and what to do about it. Read it before upgrading from the `0.0.x` series (last prod release: `0.0.175`).

---

## Version Jump

| Surface | Prod | v6 |
|---------|------|-----|
| Core CLI / SDK | `0.0.175` | **5.1.0** |
| Adapters CLI | (did not exist) | **5.1.0** |
| Edition | - | **v6** |

This is a deliberate **semver-major jump**. Treat the upgrade as a breaking change and test your processes after migrating.

---

## Breaking Changes

### 1. Install package changed

The primary install is now **`@a5c-ai/babysitter`** (core CLI), not `@a5c-ai/babysitter-sdk`.

```bash
# Before (prod)
npm install -g @a5c-ai/babysitter-sdk@latest

# v6
npm install -g @a5c-ai/babysitter
npm install -g @a5c-ai/adapters-cli   # new host-side CLI
```

The toolchain is now split across `@a5c-ai/babysitter` (core CLI), `@a5c-ai/babysitter-sdk` (programmatic runtime), and `@a5c-ai/genty-platform`. See [Installation](./installation.md).

### 2. Environment variable renames

| Before (deprecated) | v6 |
|---------------------|-----|
| `BABYSITTER_SESSION_ID` | **`AGENT_SESSION_ID`** |
| `CLAUDE_SESSION_ID` | harness-agnostic session ID (`AGENT_SESSION_ID`) |
| `CLAUDE_PLUGIN_ROOT` | harness-agnostic plugin root |

Session resolution is now **PID-scoped** rather than env-first. If you relied on inheriting a session ID from the environment, set `BABYSITTER_TRUST_ENV_SESSION=1` as an explicit escape hatch. See [Configuration](../reference/configuration.md) and [Run Resumption](../features/run-resumption.md).

### 3. Removed flag: `--plugin-root`

`--plugin-root` is **removed**. Plugin/root resolution is handled by the harness-agnostic runtime. Remove it from any scripts.

### 4. `plugins/` → `blueprints/`

The processes directory was renamed:

| Before | v6 |
|--------|-----|
| `plugins/` | **`blueprints/`** |
| `plugin:*` commands | **`blueprints:*`** (the `plugin:*` aliases are retained for one release and marked deprecated) |

Update any paths and scripts that referenced `plugins/`. See [Process Library](../features/process-library.md).

### 5. Concept and package renames

| Before (deprecated) | v6 |
|---------------------|-----|
| Agent Mux / `-mux` packages | **Adapters** / `-adapter` packages |
| `tula` | **genty** |
| `Krate` | **Kradle** |
| `breakpoints-pro` | **Breakpoints Adapter** (serverless-durable; pluggable backends) |

### 6. Harness model

Babysitter is no longer wired specifically to Claude Code's `Stop` hook. The orchestration runtime is harness-agnostic, and each harness has its own continuation model. If you wrote integration code against the Claude `Stop` loop, see [Adapters](../features/adapters.md) and [Hooks](../features/hooks.md).

---

## Deprecated (still works, will be removed)

- `plugin:*` command aliases (use `blueprints:*`)
- `BABYSITTER_SESSION_ID` (use `AGENT_SESSION_ID`)
- `breakpoints-pro` references (use the Breakpoints Adapter)

These are marked deprecated throughout the docs and will be removed in a future release.

---

## Migration Checklist

1. [ ] Upgrade Node.js to >=20.9.0 (for the Adapters CLI).
2. [ ] Install `@a5c-ai/babysitter` and `@a5c-ai/adapters-cli`.
3. [ ] Replace `BABYSITTER_SESSION_ID` with `AGENT_SESSION_ID` in env/scripts.
4. [ ] Remove `--plugin-root` from any commands.
5. [ ] Rename `plugins/` references to `blueprints/`.
6. [ ] Reinstall your harness plugin from the [Install Matrix](../harnesses/install-matrix.md).
7. [ ] Run `adapters doctor` and a smoke test (`adapters run claude "say hi"`).
8. [ ] Re-run a known process to confirm behavior.

---

## Related Documentation

- [Installation](./installation.md) · [Quickstart](./quickstart.md)
- [Adapters](../features/adapters.md) · [Hooks](../features/hooks.md)
- [Configuration](../reference/configuration.md) · [Glossary](../reference/glossary.md)
- [Install Matrix](../harnesses/install-matrix.md)

---

## Next steps

- **Next:** [Installation](./installation.md) — install the v6 packages
- **Related:** [CLI Reference](../reference/cli-reference.md)
- **Related:** [Adapters CLI](../reference/adapters-cli.md)
