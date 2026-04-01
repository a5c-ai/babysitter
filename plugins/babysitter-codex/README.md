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

clone the repo and install the plugin globally:

```bash
git clone https://github.com/a5c-ai/babysitter.git
cd babysitter
codex

> /plugins
```

then navigate to the 'babysitter' entry and select 'Install'.

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

- `plugins/babysitter/.codex-plugin/plugin.json`
- `plugins/babysitter/skills/babysit/SKILL.md`
- `plugins/babysitter/hooks.json`
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
test -f ~/.codex/plugins/babysitter/.codex-plugin/plugin.json
test -f ~/.codex/plugins/babysitter/hooks.json
test -f ~/.codex/plugins/babysitter/hooks/babysitter-stop-hook.sh
test -f ~/.codex/plugins/babysitter/skills/babysit/SKILL.md
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
