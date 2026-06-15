# Agent Instructions -- Babysitter Orchestration Plugin for genty

This file governs agent behavior when the babysitter-genty plugin is active in a genty session. Babysitter is the orchestration layer -- it drives multi-step workflows through process definitions, effects, and an iteration loop.

---

## 1. Session Start -- Auto-Initialization

Babysitter initializes automatically on every genty session start. The extension:

1. Binds the current genty session to the babysitter state directory (`.a5c/`).
2. Checks for an active run by inspecting `.a5c/runs/` for pending tasks.
3. If an active run exists, resumes from the first pending effect.
4. If no run exists, proceeds with normal session behavior until a babysitter command is issued.

You do not need to initialize babysitter manually -- the extension handles it.

---

## 2. Recognizing Babysitter Commands

When the user types a message starting with `/babysitter:` or `/babysitter`, treat it as a **slash command** and dispatch accordingly:

| Command | Description |
|---------|-------------|
| `/babysitter:call` | Start an orchestration run |
| `/babysitter:plan` | Plan a workflow without executing |
| `/babysitter:resume` | Resume an existing run from where it left off |
| `/babysitter:doctor` | Diagnose run health |
| `/babysitter:yolo` | Start a non-interactive run |
| `/babysitter:status` | Show current run status and pending effects |

Aliases:
- `/babysitter` (bare) = `/babysitter:call`
- `/babysit` = `/babysitter:call`

Load the corresponding skill from `skills/babysitter/SKILL.md` for detailed execution instructions.

---

## 3. Babysitter Orchestration Protocol

The core loop works as follows:

1. **Create a run** -- A process definition (JS file) is loaded and a run is created under `.a5c/runs/<RUN_ID>/`.
2. **Iterate** -- The SDK replays resolved effects, then throws when it encounters an unresolved effect. The iteration returns a list of **pending effects** (tasks to execute).
3. **Execute effects** -- You execute each pending effect using the appropriate tool/action.
4. **Post results** -- Report the outcome back to babysitter via the SDK bridge.
5. **Repeat** -- The loop-driver triggers the next iteration automatically. Do NOT loop independently.

The extension's loop-driver controls iteration flow. Complete one task, post the result, and the driver handles the rest.

---

## 4. Effect Types

When babysitter presents pending effects, identify the `kind` field and execute accordingly:

| Kind | Action |
|------|--------|
| `agent` | Build a prompt from the agent definition and execute as a sub-agent task |
| `skill` | Invoke the named skill with the provided parameters |
| `shell` | Execute the shell command and capture stdout/stderr/exit code |
| `breakpoint` | Pause execution and present the breakpoint message to the user for approval |
| `sleep` | Wait until the specified timestamp (handled by the runtime) |

For genty-family generated-process guidance, treat `agent`, `skill`, `shell`, `breakpoint`, and `sleep` as the active effect kinds. Do not present `node` as a generated genty-family effect kind.

---

## 5. Posting Results

After executing an effect, hand the outcome back to the Babysitter plugin/runtime bridge so the run state, journal, and pending-effect cache stay consistent.

Rules:
- Use the plugin-owned Babysitter bridge/command flow rather than inventing an alternate posting path.
- Complete one orchestration phase per harness turn, then let the loop-driver trigger the next phase.
- Do not abort the entire run on a single task failure -- return the effect outcome and let the orchestrator decide the next step.
- Keep low-level runtime mechanics in the command/extension implementation surface; this file is the behavioral contract for the active agent session.

---

## 6. Run Completion

When the orchestration run completes successfully, the SDK returns a completion proof. You MUST output it in the following format:

```
<promise>PROOF_VALUE</promise>
```

Where `PROOF_VALUE` is the exact proof string returned by the SDK. This signals to the wrapper and any upstream systems that the run finished with a verified result.

---

## 7. Directory Layout Reference

```
.a5c/
  runs/
    <RUN_ID>/
      run.json              # Run metadata
      inputs.json           # Process inputs
      journal/              # Append-only event log
        000001.<ulid>.json
      tasks/
        <EFFECT_ID>/
          task.json          # Task definition (created by orchestrator)
          result.json        # Task result (created after posting)
      state/
        state.json           # Derived replay cache
```

All paths are relative to the repository root.
