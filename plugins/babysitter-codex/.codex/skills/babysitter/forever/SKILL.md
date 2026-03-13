---
name: babysitter:forever
description: Start a never-ending babysitter run with infinite loops and sleep gates.
argument-hint: Specific instructions for the periodic run
---

# babysitter:forever

Start a **never-ending** babysitter orchestration run. The process runs in an infinite loop with `ctx.sleep()` gates between iterations — ideal for periodic maintenance tasks, monitoring, or continuous improvement workflows.

## Workflow

### 1. Interview Phase

Same as `/babysitter:call` — gather intent, requirements, and scope. Focus on:
- What should happen each cycle?
- How long between cycles? (sleep duration)
- What quality gates should be checked?
- Under what conditions should the loop stop? (manual breakpoint, quality threshold, error count)

### 2. Process Creation

Create a process with an infinite loop pattern:

```javascript
export async function process(inputs, ctx) {
  while (true) {
    // Execute the periodic task
    const result = await ctx.task(periodicTask, { ...inputs });

    // Optional: quality gate
    if (result.shouldStop) break;

    // Sleep until next cycle (e.g., 4 hours)
    await ctx.sleep({ duration: inputs.sleepDuration || '4h' });
  }
  return { completed: true };
}
```

### 3. Run Creation and Loop

Same as `/babysitter:call` — create the run and iterate. Sleep effects are handled by waiting until the specified timestamp before continuing.

The run will only complete when the process logic breaks out of the loop or when manually stopped.
