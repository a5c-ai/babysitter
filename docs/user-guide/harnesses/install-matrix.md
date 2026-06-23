# Harness Install Matrix

**Category:** Harnesses · **Last Updated:** 2026-06-22

---

## In Plain English

**Babysitter v6 runs on a dozen AI coding harnesses. This page lists them all - what to install, how you invoke Babysitter inside each one, and how each one drives the orchestration loop.**

The two most-used harnesses, **Claude Code** and **Codex**, have their own fully-worked pages ([Claude Code](claude-code.md), [Codex](codex.md)). The rest are listed here.

> **These ship now and work today.** Some are newer than others; if you hit a rough edge, try it and tell us - [open an issue](https://github.com/a5c-ai/babysitter/issues). No harness is hidden or "coming soon."

Every harness shares the same first step - install the core CLI:

```bash
npm install -g @a5c-ai/babysitter
```

Then install the per-harness plugin using either the universal SDK helper or the harness's own installer:

```bash
# Universal helper (note: the argument is the HARNESS KEY, not always the harness name)
babysitter harness:install-plugin <harness-key> [--workspace <path>]
```

---

## Fully Supported (own pages)

| Harness | Repo | Harness key | Invocation | Page |
|---------|------|-------------|------------|------|
| Claude Code | `a5c-ai/babysitter-claude` | `claude-code` | `/babysitter:*` | [claude-code.md](claude-code.md) |
| Codex | `a5c-ai/babysitter-codex` | `codex` | `$babysitter:*` (mention picker) | [codex.md](codex.md) |

---

## Matrix Harnesses

Each row below ships now. The **harness key** is the argument to `babysitter harness:install-plugin` and may differ from the harness name.

### Antigravity

- **Repo:** `a5c-ai/babysitter-antigravity` · **Harness key:** `antigravity-cli`
- **Invocation:** `/babysitter:*`
- **Hook model:** SessionStart + AfterAgent (workflow-driven; **no Stop hook**). AfterAgent fires after every turn and re-injects the next iteration until `<promise>COMPLETION_PROOF</promise>`.
- **Install:**
  ```bash
  babysitter harness:install-plugin antigravity-cli [--workspace <path>]
  npx --yes @a5c-ai/babysitter-antigravity install --global
  npx --yes @a5c-ai/babysitter-antigravity install --workspace <path>
  ```

### Cursor

- **Repo:** `a5c-ai/babysitter-cursor` · **Harness key:** `cursor`
- **Invocation:** `$<skill>` (e.g. `$call`, `$plan`)
- **Hook model:** SessionStart + Stop. The `Stop` hook emits `{followup_message: ...}` (Cursor-specific, not `{decision: block}`) to auto-continue while the run is in progress.
- **Install:**
  ```bash
  babysitter harness:install-plugin cursor [--workspace <path>]
  npx --yes @a5c-ai/babysitter-cursor install --global
  npx --yes @a5c-ai/babysitter-cursor install --workspace <path>
  ```
  > Cursor's marketplace add is **UI-only** (via the bundled marketplace manifest); there is no CLI `marketplace add` for Cursor.

### Gemini

- **Repo:** `a5c-ai/babysitter-gemini` · **Harness key:** `gemini-cli`
- **Invocation:** `/babysitter:*`
- **Hook model:** SessionStart + AfterAgent (`gemini-extension.json` manifest; **no Stop hook**). `session-start.sh` installs the SDK and inits state; `after-agent.sh` returns `{decision: block, ...}` to inject the next iteration until completion proof.
- **Install:**
  ```bash
  babysitter harness:install-plugin gemini-cli [--workspace <path>]
  npx --yes @a5c-ai/babysitter-gemini install --global
  npx --yes @a5c-ai/babysitter-gemini install --workspace <path>
  ```

### genty

- **npm package:** `@a5c-ai/babysitter-genty` · **Harness key:** `genty`
- **Invocation:** `/<command>` thin aliases (forward to the genty skill system)
- **Hook model:** genty extension API - a `session_start` proxied hook; continuation is owned by the `babysit` skill and the SDK proxied hooks (no marketplace CLI).
- **Install:**
  ```bash
  babysitter harness:install-plugin genty [--workspace <path>]
  npx --yes @a5c-ai/babysitter-genty install --global
  npx --yes @a5c-ai/babysitter-genty install --workspace <path>
  ```
  > **Install genty from npm only** (`@a5c-ai/babysitter-genty`). There is no separate harness repo to link.

### GitHub Copilot

- **Repo:** `a5c-ai/babysitter-github-copilot` · **Harness key:** `github-copilot`
- **Invocation:** `$<skill>` (Copilot CLI skills) plus a cloud-agent path that installs repo-scoped skills
- **Hook model:** plugin-bundle hooks (SessionStart + SessionEnd + UserPromptSubmitted, where **sessionEnd is the loop driver**) plus a cloud-agent install driven by repo instructions/skills - not a local `hooks.json`.
- **Install:**
  ```bash
  babysitter harness:install-plugin github-copilot [--workspace <path>]
  copilot plugin marketplace add a5c-ai/babysitter-github-copilot && copilot plugin install babysitter
  copilot plugin install a5c-ai/babysitter-github-copilot
  babysitter-github install --cloud-agent --workspace <path>
  ```

### Hermes

- **Repo:** `a5c-ai/babysitter-hermes` · **Harness key:** `hermes`
- **Invocation:** `/<command>` (Hermes skill surface)
- **Hook model:** ACP (Agent Communication Protocol - JSON-RPC over stdio). The SDK owns orchestration; no filesystem Stop hook.
- **Install:**
  ```bash
  babysitter harness:install-plugin hermes [--workspace <path>]
  ```

### oh-my-pi (omp)

- **Repo:** `a5c-ai/babysitter-omp` · **Harness key:** `oh-my-pi`
- **Invocation:** `/<command>` thin aliases forwarding to `/skill:<name>`
- **Hook model:** thin-skill-alias - a `session_start` proxied hook plus `/skill:<name>` forwarding; the loop is SDK-owned.
- **Install:**
  ```bash
  babysitter harness:install-plugin oh-my-pi [--workspace <path>]
  npx --yes @a5c-ai/babysitter-omp install --global
  npx --yes @a5c-ai/babysitter-omp install --workspace <path>
  omp plugin install @a5c-ai/babysitter-omp
  ```

### openclaw

- **Repo:** `a5c-ai/babysitter-openclaw` · **Harness key:** `openclaw`
- **Invocation:** `/<command>` and `/babysitter:*` aliases forwarding to `/skill:<name>`
- **Hook model:** daemon - `session_start` / `before_prompt_build` / `agent_end` (async fire-and-forget) / `session_end`. **No synchronous Stop hook**; `before_prompt_build` injects run state into each turn's prompt.
- **Install:**
  ```bash
  babysitter harness:install-plugin openclaw [--workspace <path>]
  npx --yes @a5c-ai/babysitter-openclaw install --global
  npx --yes @a5c-ai/babysitter-openclaw install --workspace <path>
  ```

### opencode

- **Repo:** `a5c-ai/babysitter-opencode` · **Harness key:** `opencode`
- **Invocation:** `commands/*.md` slash-commands (e.g. `/status`)
- **Hook model:** `session.created` + `session.idle` (non-blocking) + `shell.env` + `tool.execute.before` / `tool.execute.after`. There is **no blocking Stop hook** - the agent runs the full orchestration loop within a single turn by calling `babysitter run:iterate` until completion.
- **Install:**
  ```bash
  babysitter harness:install-plugin opencode [--workspace <path>]
  npx --yes @a5c-ai/babysitter-opencode install --global
  npx --yes @a5c-ai/babysitter-opencode install --workspace <path>
  npx --yes @a5c-ai/babysitter-opencode install --accomplish
  ```

### Pi

- **Repo:** `a5c-ai/babysitter-pi` · **Harness key:** `pi`
- **Invocation:** `/<command>` thin aliases forwarding to `/skill:<name>` (note: `/resume` is reserved by Pi, so use `/babysitter:resume`)
- **Hook model:** thin-skill-alias - `session_start` plus a proxied `stop` hook; active-run detection lives in the SDK stop hook.
- **Install:**
  ```bash
  babysitter harness:install-plugin pi [--workspace <path>]
  npx --yes @a5c-ai/babysitter-pi install --global
  npx --yes @a5c-ai/babysitter-pi install --workspace <path>
  pi install npm:@a5c-ai/babysitter-pi
  pi install -l npm:@a5c-ai/babysitter-pi
  ```

---

## Picking the Right Invocation Token

Because each harness surfaces Babysitter differently, the [Slash Commands and Modes](../reference/slash-commands.md) page maps the canonical commands (`call`, `plan`, `yolo`, `resume`, ...) to each harness's token style. Read that page if you are unsure what to type.

---

## Related Documentation

- [Claude Code](claude-code.md) · [Codex](codex.md) - fully-worked harness pages
- [Adapters](../features/adapters.md) - why Babysitter is harness-agnostic
- [Hooks](../features/hooks.md) - per-harness continuation models
- [Slash Commands and Modes](../reference/slash-commands.md)
- [Installation](../getting-started/installation.md)
