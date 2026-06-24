[Docs](../index.md) › [Harnesses](./install-matrix.md) › Claude Code

# Claude Code

**Tier:** Fully supported · **Repo:** `a5c-ai/babysitter-claude` · **Harness key:** `claude-code`

---

## In Plain English

**On Claude Code you get the full Babysitter experience: the `/babysitter:*` slash-commands and the `babysit` skill, driven by Claude Code's session and `Stop` hook.**

Install the [plugin](../reference/glossary.md) once, restart Claude Code, and run `/babysitter:call <your request>`. Babysitter orchestrates the run from inside your Claude Code session - one orchestration phase per turn - and pauses for your approval at breakpoints right in the chat.

**Estimated time to first run:** about 5 minutes. **End state:** you can type `/babysitter:call` in Claude Code and watch a run iterate to a quality target.

---

## On this page

- [Install](#install)
- [Verify](#verify)
- [Command Surface](#command-surface)
- [Hook / Continuation Model](#hook--continuation-model)
- [First Run](#first-run)
- [Related Documentation](#related-documentation)

---

## Install

Install the core CLI, then add the Claude Code plugin from the marketplace:

```bash
# 1. Core CLI (host-side)
npm install -g @a5c-ai/babysitter@latest

# 2. Add the Babysitter marketplace and install the plugin
claude plugin marketplace add a5c-ai/babysitter-claude
claude plugin install --scope user babysitter@a5c.ai
claude plugin enable --scope user babysitter@a5c.ai
```

Then **restart Claude Code** so the plugin loads.

> The marketplace add uses the released default branch - do not pin a `staging` ref. The Claude marketplace publishes its own released `5.x` version; you do not need to (and should not) specify a `-staging.<sha>` build.

**Alternative (SDK helper):** the universal installer wires up the same plugin from the core CLI:

```bash
babysitter harness:install-plugin claude-code [--workspace <path>]
```

---

## Verify

After restarting Claude Code, confirm the skill is available:

```
/skills
```

You should see **`babysit`** (and the `/babysitter:*` commands) in the list. If not, run `claude plugin list` to confirm the plugin is installed and enabled, then restart Claude Code again.

---

## Command Surface

Claude Code exposes Babysitter as first-class `/babysitter:<command>` slash-commands plus the `babysit` skill:

```
/babysitter:call          /babysitter:plan          /babysitter:yolo
/babysitter:forever       /babysitter:resume        /babysitter:doctor
/babysitter:retrospect    /babysitter:assimilate    /babysitter:cleanup
/babysitter:observe       /babysitter:contrib       /babysitter:help
/babysitter:blueprints    /babysitter:user-install  /babysitter:project-install
babysit                   (skill - verify via /skills)
```

See [Slash Commands and Modes](../reference/slash-commands.md) for what each mode does.

---

## Hook / Continuation Model

**Model: SessionStart + Stop (one orchestration phase per turn).**

- **SessionStart** prepares state and environment for the session.
- The assistant performs **one orchestration phase per turn**, posts its effect, and stops.
- The synchronous **`Stop` hook** then decides *block-vs-approve-exit*: it blocks (and injects the next iteration) while the run is in progress, and only allows the session to finish when the completion proof returns as `<promise>...</promise>`.

This `Stop`-hook continuation is **specific to Claude Code**. Other harnesses use different models (AfterAgent, daemon `agent_end`, ACP, session-idle, thin-skill aliases) - see [Hooks](../features/hooks.md) and the [Install Matrix](install-matrix.md). Do not assume the Claude `Stop` model elsewhere.

---

## First Run

```
/babysitter:call build a calculator with add, subtract, multiply, divide using TDD
```

Babysitter creates a run, iterates (write → test → fix) toward your quality target, and pauses for approval at any breakpoints - all inside the chat. Resume an interrupted run with `/babysitter:resume`.

---

## Related Documentation

- [Installation](../getting-started/installation.md) · [Quickstart](../getting-started/quickstart.md)
- [Slash Commands and Modes](../reference/slash-commands.md)
- [Hooks](../features/hooks.md) · [Adapters](../features/adapters.md)
- [Install Matrix](install-matrix.md) - all other supported harnesses
- [Codex](codex.md) - the other fully-supported harness

---

## Next steps

- **Next:** [Codex](./codex.md)
- **Related:** [Install Matrix](./install-matrix.md), [Slash Commands](../reference/slash-commands.md), [Adapters](../features/adapters.md)
