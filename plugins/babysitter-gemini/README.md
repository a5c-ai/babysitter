# Babysitter for Gemini CLI

Babysitter integrates with Gemini CLI to run SDK-backed orchestration through
Gemini's lifecycle hooks and turn loop.

## Integration Model

Gemini uses hook-driven continuation:

1. A session-start hook prepares session state for the active Gemini session
2. The `/babysitter:*` command surface starts or resumes the active run
3. After each turn, the harness decides whether to allow exit or re-inject the
   next orchestration step
4. The loop ends only when the run emits `completionProof` and the assistant
   returns `<promise>...</promise>`

## Active Process-Library Model

Process discovery should prefer active roots:

1. `.a5c/processes` in the current workspace
2. Repo-local Babysitter plugin roots when present
3. Installed plugin/extension process roots
4. Bundled reference content only as fallback

Do not document bundled snapshot content as the primary library root.

## Commands

Gemini exposes slash commands:

| Command | Description |
|---------|-------------|
| `/babysitter:call [task]` | Start a new orchestration run |
| `/babysitter:resume [run-id]` | Resume an incomplete run |
| `/babysitter:yolo [task]` | Start a fully autonomous run |
| `/babysitter:plan [task]` | Design a process without executing it |
| `/babysitter:doctor [run-id]` | Diagnose run health |
| `/babysitter:observe` | Launch the observer dashboard |
| `/babysitter:assimilate [target]` | Assimilate an external methodology or harness |
| `/babysitter:user-install` | Set up user defaults |
| `/babysitter:project-install` | Set up the current project |
| `/babysitter:retrospect [run-id]` | Analyze a completed run |
| `/babysitter:help [topic]` | Show help |

## Installation

Materialize the repo-local Gemini extension into the active workspace:

```bash
babysitter harness:install-plugin gemini-cli --workspace /path/to/repo
```

## Orchestration Contract

Gemini docs should follow the same active contract as Claude/Codex where
applicable:

- use the Gemini `/babysitter:*` command surface
- perform one orchestration phase per turn
- let the harness hooks and command implementation own the low-level Babysitter runtime mechanics
- finish only with the emitted `completionProof`

## Task Kinds

Current generated-process docs should prefer:

- `agent`
- `skill`
- `shell`
- `breakpoint`
- `sleep`

Do not present `node` as an active generated effect kind for Gemini flows.

## Troubleshooting

Hook not firing:

```text
/babysitter:doctor
```

Run stuck:

```text
/babysitter:status
/babysitter:doctor
```

Low-level hook and CLI orchestration details belong in [GEMINI.md](./GEMINI.md),
not in this user-facing README.

## License

MIT
