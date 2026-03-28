# @a5c-ai/babysitter-codex

Babysitter integration package for OpenAI Codex CLI.

This package ships a real Codex plugin bundle:

- `.codex-plugin/plugin.json`
- `skills/`
- `hooks.json`
- `hooks/`

It still uses the Babysitter SDK CLI and the shared `~/.a5c` process-library
state. The installer registers the plugin bundle and also materializes the
active Codex `skills/`, `hooks/`, and `hooks.json` surface at the selected
scope so Codex can execute the Babysitter commands and hook scripts directly.

## Installation

Install the SDK CLI first:

```bash
npm install -g @a5c-ai/babysitter-sdk
```

Install the Codex plugin globally:

```bash
npx @a5c-ai/babysitter-codex install
```

This copies the plugin into `~/.codex/plugins/babysitter-codex`, registers it
in `~/.agents/plugins/marketplace.json`, merges the required global Codex
config into `~/.codex/config.toml`, installs the active global Codex
`skills/`, `hooks/`, and `hooks.json` surface under `~/.codex/`, and ensures
the Babysitter process library is active in `~/.a5c`.

Install the plugin into a specific workspace:

```bash
npx @a5c-ai/babysitter-codex install --workspace /path/to/repo
```

This copies the plugin into `<workspace>/plugins/babysitter-codex`, registers
it in `<workspace>/.agents/plugins/marketplace.json`, merges
`<workspace>/.codex/config.toml`, installs the active workspace Codex
`skills/`, `hooks/`, and `hooks.json` surface under `<workspace>/.codex/`, and
records install metadata under `<workspace>/.a5c/team/`.

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

- `plugins/babysitter-codex/.codex-plugin/plugin.json`
- `plugins/babysitter-codex/skills/babysit/SKILL.md`
- `plugins/babysitter-codex/hooks.json`
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
test -f ~/.codex/plugins/babysitter-codex/.codex-plugin/plugin.json
test -f ~/.codex/plugins/babysitter-codex/hooks.json
test -f ~/.codex/plugins/babysitter-codex/hooks/babysitter-stop-hook.sh
test -f ~/.codex/plugins/babysitter-codex/skills/babysit/SKILL.md
test -f ~/.codex/hooks.json
test -f ~/.codex/hooks/babysitter-stop-hook.sh
test -f ~/.codex/skills/babysit/SKILL.md
test -f ~/.agents/plugins/marketplace.json
```

Verify the active shared process-library binding:

```bash
babysitter process-library:active --json
```

On native Windows, Codex currently does not execute hooks. The plugin still
installs correctly, but the lifecycle hooks will not fire until Codex enables
Windows hook execution.

## License

MIT
