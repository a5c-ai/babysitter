[Docs](../index.md) › [Getting Started](./README.md) › Upgrade to v6

# Upgrade to v6: Uninstall Prod & Reinstall on Any Harness

**Category:** Getting Started · **Last Updated:** 2026-06-25

## On this page

- [In Plain English](#in-plain-english)
- [Step 1 — Uninstall the prod babysitter](#step-1--uninstall-the-prod-babysitter)
- [Step 2 — Install v6 (harness-neutral first)](#step-2--install-v6-harness-neutral-first)
- [Step 3 — Per-harness install (all major harnesses)](#step-3--per-harness-install-all-major-harnesses)
- [Step 4 — Verify](#step-4--verify)
- [Rollback](#rollback)
- [Related Documentation](#related-documentation)
- [Next steps](#next-steps)

---

## In Plain English

**v6 is a deliberate semver-major jump: the prod `0.0.x` series (last release `0.0.175`) becomes v6, shipped as `5.x` packages.** The primary install package changed from `@a5c-ai/babysitter-sdk` to `@a5c-ai/babysitter`, and Babysitter is now harness-agnostic instead of Claude-only. This page is the hands-on uninstall-and-reinstall runbook; for the full list of breaking changes and what each one means, read the conceptual [Migration Guide](./migration.md) first.

---

## Step 1 — Uninstall the prod babysitter

Remove the prod toolchain before installing v6. These steps are grounded in the [Migration Guide](./migration.md); skip any that do not apply to your machine.

Remove the old prod global CLI/SDK:

```bash
npm rm -g @a5c-ai/babysitter-sdk
```

Remove any old per-harness plugin you installed under prod. For Claude Code:

```bash
claude plugin uninstall babysitter@a5c.ai
```

> For any other harness, use that harness's normal plugin-uninstall command — prod uninstall commands for non-Claude harnesses are not in the source-of-truth context, so do not guess.

Remove the global hooks adapter CLI if it is present:

```bash
npm rm -g @a5c-ai/hooks-adapter-cli
```

If the `babysitter` command is on your PATH but broken (for example it exits with `MODULE_NOT_FOUND` from a stale global shim), clear both global packages so v6 can install cleanly:

```bash
npm rm -g @a5c-ai/babysitter @a5c-ai/babysitter-sdk
```

Drop the deprecated/removed environment variables from your shell profile and scripts:

- `BABYSITTER_SESSION_ID` (renamed to `AGENT_SESSION_ID` in v6)
- `CLAUDE_SESSION_ID` (now the harness-agnostic `AGENT_SESSION_ID`)
- `CLAUDE_PLUGIN_ROOT` (now a harness-agnostic plugin root)

Remove the dropped `--plugin-root` flag from any command or script — it is removed in v6, and plugin/root resolution is now handled by the harness-agnostic runtime.

Finally, note the directory rename: prod's `plugins/` directory is `blueprints/` in v6 (and `plugin:*` commands become `blueprints:*`, with the `plugin:*` aliases retained for one release and marked deprecated). Update any paths and scripts that referenced `plugins/`.

---

## Step 2 — Install v6 (harness-neutral first)

Lead with the universal, harness-neutral path. This works for **every** supported harness.

First install the core CLI:

```bash
npm install -g @a5c-ai/babysitter
```

Then install your harness's plugin with the universal SDK helper — the argument is the **harness key** (which may differ from the harness name):

```bash
babysitter harness:install-plugin <harness-key> [--workspace <path>]
```

Also install the new host-side Adapters CLI (per the [Migration Guide](./migration.md)):

```bash
npm install -g @a5c-ai/adapters-cli
```

That is the complete neutral path: core CLI, the per-harness plugin via `babysitter harness:install-plugin <harness-key>`, and the Adapters CLI. Step 3 lists the exact harness keys and any harness-native installers.

---

## Step 3 — Per-harness install (all major harnesses)

Every harness shares the neutral helper from Step 2. Some harnesses also offer a marketplace or `npx` installer; those are shown only where the [Install Matrix](../harnesses/install-matrix.md) lists them. For depth (invocation token, hook/continuation model), follow the linked pages rather than duplicating everything here.

**Claude Code** and **Codex** are the two most mature, fully-worked harnesses — start with these if you have a choice. They each have their own page: [Claude Code](../harnesses/claude-code.md) and [Codex](../harnesses/codex.md).

| Harness | Harness key | Marketplace / native installer? |
|---------|-------------|---------------------------------|
| Claude Code (most proven) | `claude-code` | Yes — see below |
| Codex (most proven) | `codex` | Neutral helper |
| Antigravity | `antigravity-cli` | No marketplace — neutral helper only |
| Cursor | `cursor` | Yes (npx) — see below |
| Gemini | `gemini-cli` | No marketplace — neutral helper only |
| GitHub Copilot | `github-copilot` | Yes — see below |
| Hermes | `hermes` | Neutral helper |
| oh-my-pi | `oh-my-pi` | Yes (npx / omp) — see below |
| openclaw | `openclaw` | Yes (npx) — see below |
| opencode | `opencode` | Yes (npx) — see below |
| Pi | `pi` | Yes (npx / pi) — see below |
| genty | `genty` | No marketplace — neutral helper only |

### Claude Code (most proven)

```bash
claude plugin marketplace add a5c-ai/babysitter-claude
claude plugin install --scope user babysitter@a5c.ai
claude plugin enable --scope user babysitter@a5c.ai
```

Restart Claude Code after installing. Depth: [Claude Code](../harnesses/claude-code.md).

### Codex (most proven)

```bash
babysitter harness:install-plugin codex [--workspace <path>]
```

Depth: [Codex](../harnesses/codex.md).

### Antigravity

Neutral helper only — there is no standalone npm installer for this harness.

```bash
babysitter harness:install-plugin antigravity-cli [--workspace <path>]
```

### Cursor

```bash
babysitter harness:install-plugin cursor [--workspace <path>]
npx --yes @a5c-ai/babysitter-cursor install --global
npx --yes @a5c-ai/babysitter-cursor install --workspace <path>
```

> Cursor's marketplace add is UI-only (via the bundled marketplace manifest); there is no CLI `marketplace add` for Cursor.

### Gemini

Neutral helper only — there is no standalone npm installer for this harness.

```bash
babysitter harness:install-plugin gemini-cli [--workspace <path>]
```

### GitHub Copilot

```bash
babysitter harness:install-plugin github-copilot [--workspace <path>]
copilot plugin marketplace add a5c-ai/babysitter-github-copilot && copilot plugin install babysitter
copilot plugin install a5c-ai/babysitter-github-copilot
babysitter-github install --cloud-agent --workspace <path>
```

### Hermes

```bash
babysitter harness:install-plugin hermes [--workspace <path>]
```

### oh-my-pi

```bash
babysitter harness:install-plugin oh-my-pi [--workspace <path>]
npx --yes @a5c-ai/babysitter-omp install --global
npx --yes @a5c-ai/babysitter-omp install --workspace <path>
omp plugin install @a5c-ai/babysitter-omp
```

### openclaw

```bash
babysitter harness:install-plugin openclaw [--workspace <path>]
npx --yes @a5c-ai/babysitter-openclaw install --global
npx --yes @a5c-ai/babysitter-openclaw install --workspace <path>
```

### opencode

```bash
babysitter harness:install-plugin opencode [--workspace <path>]
npx --yes @a5c-ai/babysitter-opencode install --global
npx --yes @a5c-ai/babysitter-opencode install --workspace <path>
npx --yes @a5c-ai/babysitter-opencode install --accomplish
```

### Pi

```bash
babysitter harness:install-plugin pi [--workspace <path>]
npx --yes @a5c-ai/babysitter-pi install --global
npx --yes @a5c-ai/babysitter-pi install --workspace <path>
pi install npm:@a5c-ai/babysitter-pi
pi install -l npm:@a5c-ai/babysitter-pi
```

> On Pi, `/resume` is reserved by the harness, so use `/babysitter:resume`.

### genty

Neutral helper only — there is no standalone npm plugin package or marketplace repo for genty (it runs on the genty runtime, `@a5c-ai/genty-platform`).

```bash
babysitter harness:install-plugin genty [--workspace <path>]
```

For the full per-harness reference (invocation tokens and hook/continuation models), see the [Install Matrix](../harnesses/install-matrix.md).

---

## Step 4 — Verify

Run the v6 verification checks from the [Migration Guide](./migration.md) checklist.

Check the host-side Adapters CLI health:

```bash
adapters doctor
```

Run a smoke test against an installed harness:

```bash
adapters run claude "say hi"
```

Confirm the core CLI is on the v6 line (expect a `5.x` version, `5.1.0` for this edition):

```bash
babysitter --version
```

Finally, re-run a known process to confirm your workflows still behave as expected.

---

## Rollback

If you need to return to the prod `0.0.x` series, reinstall the prod global CLI/SDK at the last prod release:

```bash
npm install -g @a5c-ai/babysitter-sdk@0.0.175
```

Then reinstall your old harness plugin (for Claude Code, re-add the marketplace and install the plugin as you did under prod).

> **State / journal caveat:** v6 is a deliberate semver-major jump with breaking changes (renamed packages, removed `--plugin-root`, `BABYSITTER_SESSION_ID` → `AGENT_SESSION_ID`, and `plugins/` → `blueprints/`). Runs created or migrated under v6 are not guaranteed to be readable or resumable by the prod `0.0.x` toolchain. Roll back on a clean working tree and expect to re-run, not resume, any in-flight work.

---

## Related Documentation

- [Migration Guide](./migration.md) — the full breaking-changes list
- [Installation](./installation.md) — the standard v6 install guide
- [Install Matrix](../harnesses/install-matrix.md) — every harness key, install command, and hook model
- [Adapters](../features/adapters.md) — why Babysitter is harness-agnostic
- [Hooks](../features/hooks.md) — per-harness continuation models

---

## Next steps

- **Next:** [Quickstart](./quickstart.md) — run your first v6 workflow
- **Related:** [Migration Guide](./migration.md) · [Installation](./installation.md)
- **Related:** [Install Matrix](../harnesses/install-matrix.md) · [Adapters CLI](../reference/adapters-cli.md)
