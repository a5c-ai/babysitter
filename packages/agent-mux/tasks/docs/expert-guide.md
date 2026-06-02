# Responder Guide

This guide is for responders who receive and answer breakpoints through `@a5c-ai/agent-mux-tasks`.

## Responder Profile

Responder profiles live under `.a5c/responder/<responderId>.json`.

Example:

```json
{
  "id": "security-responder",
  "name": "Sam Rivera",
  "title": "Application Security Engineer",
  "domains": ["security"],
  "tags": ["oauth", "jwt", "owasp"],
  "availability": true,
  "responseTimeSla": 1800000
}
```

Validate that a profile resolves cleanly:

```bash
agent-mux-tasks responders show security-responder
```

## Receiving Breakpoints

For a one-off check:

```bash
agent-mux-tasks breakpoints pending --responder security-responder
```

For continuous polling:

```bash
agent-mux-tasks responder-loop --responder security-responder
```

Useful options:

- `--interval <seconds>` to change the polling interval
- `--once` to check once and exit

## Answering from the CLI

Answer a breakpoint directly:

```bash
agent-mux-tasks breakpoints answer bp_123 \
  --answer "Require SameSite cookies and a CSRF token on the form POST." \
  --responder security-responder \
  --confidence 85
```

Inspect the current state:

```bash
agent-mux-tasks breakpoints status bp_123
agent-mux-tasks breakpoints poll bp_123 --timeout 300 --interval 5
```

## Answering Through MCP

Responder-side agent flows should use the responder tools directly.

Check for pending work:

Tool: `poll_breakpoints`

```json
{
  "responderId": "security-responder",
  "waitSeconds": 30
}
```

Claim a breakpoint before drafting an answer:

Tool: `claim_breakpoint`

```json
{
  "breakpointId": "bp_123",
  "responderId": "security-responder"
}
```

Submit the final answer:

Tool: `answer_breakpoint`

```json
{
  "breakpointId": "bp_123",
  "responderId": "security-responder",
  "responderName": "Sam Rivera",
  "text": "Require SameSite cookies and a CSRF token on the form POST.",
  "confidence": 85,
  "references": ["docs/security/csrf.md"]
}
```

If the workflow requires signed answers, add `sign: true` and `keyFingerprint`, then validate the result with `verify_breakpoint_answer`.

## Recommended Responder Workflow

1. Poll or list pending breakpoints for your responder ID.
2. Read the referenced files and project context before drafting.
3. Claim the breakpoint if another responder might also pick it up.
4. Answer with a direct recommendation, supporting reasoning, and an honest confidence score.
5. Re-check with `agent-mux-tasks breakpoints status <breakpointId>` or `check_breakpoint_status` when you need to confirm the recorded state.

## Breakpoint Lifecycle

Common statuses you will see:

- `pending`
- `routed`
- `claimed`
- `answered`
- `completed`
- `expired`
- `cancelled`

Treat `routed` and `claimed` as active responder work. Once a breakpoint reaches `completed`, the submitter side has accepted the outcome.
