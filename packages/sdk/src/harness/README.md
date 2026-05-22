# Harness Adapters

This directory contains harness adapter implementations and shared support modules
for integrating external AI CLIs (Claude Code, Codex, Cursor, Gemini CLI, GitHub
Copilot, oh-my-pi, Pi, and custom) with the Babysitter runtime.

See `types.ts` for the `HarnessAdapter` interface and `registry.ts` for adapter
registration. SDK-owned discovery lives in `discovery.ts`; harness-only
invocation and TUI orchestration now live in `@a5c-ai/babysitter-agent`.

## Session ID Resolution Contract

All harness adapters MUST resolve the active session ID using the following
precedence, from highest to lowest authority. Violations cause cross-session
bleed when a parent shell has a stale `AGENT_SESSION_ID` export or when
harness-native env files accumulate shadowed lines -- see #130, #100, #107, #75.

### Precedence (highest to lowest)

1. **PID-scoped session marker** -- the authoritative source. A small file
   written at harness session-start, keyed on the live ancestor harness PID
   (e.g. the Claude Code process PID). If the PID is no longer alive, the
   marker is ignored and resolution falls through.
2. **Harness-native env file, LAST match** -- e.g. `.claude/.env`, `.codex/.env`.
   Always take the *last* matching line, not the first. Earlier lines may be
   stale shadowed rebinds left behind by naive writers.
3. **Harness-native env var** -- any harness-specific variable set in the
   current process environment (e.g. `CLAUDE_SESSION_ID`).
4. **`AGENT_SESSION_ID`** -- the generic, inheritable fallback. Lowest
   precedence because it is trivially inherited by child shells and survives
   long past the session it referred to.

### Writing the PID marker at session-start

Adapters wire up the marker in their session-start path:

```ts
import { writeSessionMarker } from './sessionMarker';

await writeSessionMarker('<harness-key>', sessionId);
```

The marker is keyed on both the harness key and the ancestor harness PID, so
concurrent sessions from different harnesses (or different instances of the
same harness) do not collide.

### Harness key slugging rules

The `<harness-key>` passed to `writeSessionMarker` and related helpers MUST be:

- lowercase
- ASCII alphanumerics and hyphens only (`[a-z0-9-]+`)
- kebab-case with a single hyphen between tokens
- stable across releases (keys are persisted on disk)

Canonical keys currently in use: `claude-code`, `codex`, `cursor`, `gemini-cli`,
`github-copilot`, `oh-my-pi`, `pi`, `opencode`.

### `AGENT_TRUST_ENV_SESSION=1` escape hatch

For CI workflows that deliberately export `AGENT_SESSION_ID` and need the
legacy env-first precedence, set `AGENT_TRUST_ENV_SESSION=1` (or `BABYSITTER_TRUST_ENV_SESSION=1`). When this
variable is truthy, the resolution order inverts: `AGENT_SESSION_ID` is
consulted first, and the PID marker / harness-native sources are only used as
fallbacks.

This is an explicit opt-in. Do not enable it in interactive developer sessions;
the env-first precedence is the source of the stale-export cross-session-bleed
class of bugs.

### Debugging

Use `babysitter session:whoami` to print the resolved session ID along with
which source (marker / env file / env var / `AGENT_SESSION_ID`) won the
precedence resolution, plus the live ancestor PID if applicable. The
`/babysitter:doctor` command exposes four session-binding provenance and
liveness checks built on the same resolver.
