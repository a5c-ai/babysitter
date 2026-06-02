# Pending Questions -- Responder Answering Skill

## When to Use

Use this skill when the user is acting as a responder and wants to:

- check for pending breakpoints
- monitor for newly routed breakpoints
- draft and submit an answer with project-specific context

## Step 1: Resolve the Responder Identity

Prefer an explicit responder ID from the user. If they do not provide one:

1. inspect `.a5c/responder/` or run `list_responders`
2. match the user to an existing responder profile when possible
3. ask for the responder ID before answering anything

Cache the resolved `responderId` and display name for the rest of the session.

## Step 2: Poll for Pending Breakpoints

Tool: `poll_breakpoints`

```json
{
  "responderId": "security-responder",
  "waitSeconds": 0
}
```

For continuous monitoring, raise `waitSeconds` and repeat the poll after each cycle:

```json
{
  "responderId": "security-responder",
  "waitSeconds": 30
}
```

Summarize the pending breakpoints, then ask which one to answer if there is more than one.

## Step 3: Claim the Breakpoint

Claim the breakpoint before drafting so other responders can see it is being worked:

Tool: `claim_breakpoint`

```json
{
  "breakpointId": "bp_123",
  "responderId": "security-responder"
}
```

If the claim fails, tell the user and let them choose a different breakpoint or continue without claiming when the backend does not support it.

## Step 4: Enrich Context

Before drafting an answer:

- read any referenced files from the workspace
- inspect related code paths and recent changes when they matter
- summarize the constraints, risks, and likely trade-offs

The goal is to give the responder a short, grounded brief before they approve the draft.

## Step 5: Draft the Answer

Prepare a draft that:

1. leads with the recommendation
2. explains the reasoning with repo-specific context
3. calls out caveats or follow-up checks
4. proposes an honest confidence score
5. includes relevant file or doc references

Ask the responder whether to submit, revise, change confidence, or skip.

## Step 6: Submit the Answer

Tool: `answer_breakpoint`

```json
{
  "breakpointId": "bp_123",
  "responderId": "security-responder",
  "responderName": "Sam Rivera",
  "text": "Require SameSite cookies and a CSRF token on the form POST.",
  "confidence": 85,
  "references": [
    "packages/agent-mux/tasks/docs/expert-guide.md",
    "docs/security/csrf.md"
  ]
}
```

If the workflow uses signed answers, include:

- `sign: true`
- `keyFingerprint`

## Step 7: Confirm Recorded State

After submission, confirm what the backend recorded:

Tool: `check_breakpoint_status`

```json
{
  "breakpointId": "bp_123"
}
```

Offer to return to polling for the next breakpoint.

## Continuous Mode

When the user asks you to keep watching:

1. poll with `poll_breakpoints`
2. surface new breakpoints as they appear
3. help draft and submit answers
4. return to polling until the user stops

For terminal-first workflows, `tasks-mux responder-loop --responder <responderId> --once` is the package CLI equivalent of a single poll cycle.
