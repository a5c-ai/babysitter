# @a5c-ai/babysitter-codex

Babysitter integration package for OpenAI Codex CLI.

This package ships a real Codex plugin bundle:

- `.codex-plugin/plugin.json`
- `skills/`
- `hooks.json`
- `hooks/`

It still uses the Babysitter SDK CLI and the shared `~/.a5c` process-library
state. Global install writes the plugin bundle to `~/.agents/plugins/babysitter`
and updates `~/.agents/plugins/marketplace.json` so Codex can load the plugin
through its marketplace surface. Workspace install continues to materialize a
workspace-local Codex surface for team setup.

## Installation

Install the Babysitter CLI once:

```bash
npm install -g @a5c-ai/babysitter
```

Install the Codex plugin through the SDK helper. This is the canonical path used by the installer tests and resolves to `npx --yes @a5c-ai/babysitter-codex install ...` under the hood:

```bash
# Global install
babysitter harness:install-plugin codex

# Workspace install
babysitter harness:install-plugin codex --workspace /path/to/repo
```

You can also run the published package installer directly:

```bash
npx --yes @a5c-ai/babysitter-codex install --global
npx --yes @a5c-ai/babysitter-codex install --workspace /path/to/repo
```

Then open Codex and finish enabling the plugin from the plugin UI:

```text
/plugins
```

Navigate to the `babysitter` entry and select `Install`.

If Codex was already open when you ran `install --global`, start a new thread
after installing from `/plugins` before expecting `babysitter:*` skills such as
`$babysitter:babysit` or `$babysitter:call` to appear in the mention picker.

## Integration Model

The plugin provides:

- `skills/babysit/SKILL.md` as the core entrypoint
- mode wrapper skills such as `$call`, `$plan`, and `$resume`
- plugin-level lifecycle hooks for `SessionStart`, `UserPromptSubmit`, and
  `Stop`

The process library is fetched and bound through the SDK CLI in
`~/.a5c/active/process-library.json`.

## Workspace Output

After `install --workspace`, the important files are:

- `.agents/plugins/babysitter/.codex-plugin/plugin.json`
- `.agents/plugins/babysitter/skills/babysit/SKILL.md`
- `.agents/plugins/babysitter/hooks.json`
- `.codex/skills/`
- `.codex/hooks/`
- `.codex/hooks.json`
- `.agents/plugins/marketplace.json`
- `.codex/config.toml`
- `.a5c/team/install.json`
- `.a5c/team/profile.json`

## Verification

Verify the installed plugin bundle:

```bash
npm ls -g @a5c-ai/babysitter-codex --depth=0
test -f ~/.agents/plugins/babysitter/.codex-plugin/plugin.json
test -f ~/.agents/plugins/babysitter/hooks.json
test -f ~/.agents/plugins/babysitter/hooks/babysitter-proxied-stop.sh
test -f ~/.agents/plugins/babysitter/skills/babysit/SKILL.md
test -f ~/.agents/plugins/marketplace.json
```

Verify the active shared process-library binding:

```bash
babysitter process-library:active --json
```

On native Windows, Codex hooks require **Codex CLI >= 0.119.0** (released
2026-04-10, [openai/codex#17268](https://github.com/openai/codex/pull/17268)).
Older Codex versions silently skipped hook execution on Windows. If hooks do
not fire after install, run `codex --version` and upgrade if needed.

## License

MIT
