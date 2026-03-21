# Compatibility Matrix

Version policy for `babysitter-codex`.

## Plugin
- Current: `0.1.5`

## Node.js
- Supported majors: `20`, `22`
- Other versions: best effort, not guaranteed.

## Babysitter SDK
- Minimum required: `0.0.173`
- Tested: `0.0.173`, `0.0.175`

## Codex CLI
- Minimum policy: `current stable` (explicit pin not enforced yet).
- Session binding:
  - Use an actual session/thread ID only when Codex or the caller provides one.
  - Supported explicit inputs: `BABYSITTER_SESSION_ID`, `CODEX_THREAD_ID`, `CODEX_SESSION_ID`
  - Never fabricate a session ID just to satisfy `session:init`.

## Enforcement
- Machine-readable policy file: `config/compatibility-policy.json`
- Local check script: `npm run check:compat`
