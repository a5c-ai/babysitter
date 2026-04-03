### 4. Get Effects

```bash
$CLI task:list .a5c/runs/<runId> --pending --json
```

**Output:**
```json
{
  "tasks": [
    {
      "effectId": "effect-abc123",
      "kind": "agent|skill|shell|node|breakpoint",
      "label": "auto",
      "status": "requested"
    }
  ]
}
```

### 5. Perform Effects

Run the effect externally to the SDK (by you, your hook, or another worker).
After execution (by delegation to an agent or skill), post the outcome summary
into the run by calling `task:post`, which:
- Writes the committed result to `tasks/<effectId>/result.json`
- Appends an `EFFECT_RESOLVED` event to the journal
- Updates the state cache

IMPORTANT:
- Delegate using the Task tool if possible.
- If a pending effect is `shell` or legacy `node`, the orchestrating agent must
  execute that work intentionally and then post the result via `task:post`.
  Never assume the SDK or host will auto-run it.
- When delegating substantial work to an agent or skill, pass a generous
  timeout budget and instruct the worker to execute the task fully and return
  the actual result, not a plan.
- Make sure the change was actually performed and not described or implied.
  (for example, if code files were mentioned as created in the summary, make
  sure they were actually created.)
- Include in the instructions to the agent or skill to perform the task in
  full and return only the summary result in the requested schema.
