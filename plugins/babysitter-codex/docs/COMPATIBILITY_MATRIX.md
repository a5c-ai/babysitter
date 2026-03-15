# Compatibility Matrix

Version policy for `babysitter-codex`.

## Plugin
- Current: `0.1.4`

## Node.js
- Supported majors: `20`, `22`
- Other versions: best effort, not guaranteed.

## Babysitter SDK
- Minimum required: `0.0.173`
- Tested: `0.0.173`, `0.0.175`

## Codex CLI
- Minimum policy: `current stable` (explicit pin not enforced yet).
- Session env compatibility:
  - Primary: `CODEX_THREAD_ID`
  - Fallback: `CODEX_SESSION_ID`

## Enforcement
- Machine-readable policy file: `config/compatibility-policy.json`
- Local check script: `npm run check:compat`
