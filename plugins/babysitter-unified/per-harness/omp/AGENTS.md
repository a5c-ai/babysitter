# Agent Instructions -- Babysitter Orchestration Plugin for oh-my-pi

This file governs agent behavior when the babysitter-pi plugin is active in an oh-my-pi session. Babysitter is the orchestration layer -- it drives multi-step workflows through process definitions, effects, and an iteration loop.

---

## 1. Session Binding

On OMP lifecycle events, the extension synchronizes the real session ID from
`ExtensionContext` and restores any associated read-only projection. The
transcript remains owned by OMP; no legacy proxied session-start hook is
executed. Loading the extension alone does not initialize a session, create a
run, or resume one. Binding failures are non-fatal and never create a
session-less fallback run.

Create or resume a run only through the corresponding Babysitter command or
skill.

---

## 2. Recognizing Babysitter Commands

The extension registers the following slash-command mappings:

| Commands | Forwarded skill |
|----------|-----------------|
| `/babysit`, `/babysitter` | `/skill:babysit` |
| `/assimilate`, `/babysitter:assimilate` | `/skill:assimilate` |
| `/call`, `/babysitter:call` | `/skill:call` |
| `/cleanup`, `/babysitter:cleanup` | `/skill:cleanup` |
| `/contrib`, `/babysitter:contrib` | `/skill:contrib` |
| `/doctor`, `/babysitter:doctor` | `/skill:doctor` |
| `/forever`, `/babysitter:forever` | `/skill:forever` |
| `/help`, `/babysitter:help` | `/skill:help` |
| `/observe`, `/babysitter:observe` | `/skill:observe` |
| `/plan`, `/babysitter:plan` | `/skill:plan` |
| `/plugins`, `/babysitter:plugins` | `/skill:plugins` |
| `/project-install`, `/babysitter:project-install` | `/skill:project-install` |
| `/resume`, `/babysitter:resume` | `/skill:resume` |
| `/retrospect`, `/babysitter:retrospect` | `/skill:retrospect` |
| `/user-install`, `/babysitter:user-install` | `/skill:user-install` |
| `/yolo`, `/babysitter:yolo` | `/skill:yolo` |

Bare `/babysitter` is an alias for `/babysit`; it does not imply `/call`.

---

## 3. Babysitter Orchestration Protocol

Babysitter effects and oh-my-pi's native task/todo state are separate systems.
Use native todos to track work in the current agent session. Resolve process
effects only through the deterministic Babysitter driver.

The core loop is:

1. **Create or resume a run** through the selected Babysitter skill.
2. **Drive it** by calling `babysitter_drive` with the absolute run directory.
3. **Handle the returned state**:
   - `completed`, `waiting`, or `operator_attention`: report it accurately.
   - `interaction`: obtain the requested human/breakpoint interaction, then call
     `babysitter_breakpoint_respond` with the exact run directory, effect ID,
     invocation key, and approved boolean. The response tool continues the run.
   - `agent`: call oh-my-pi's native `task` tool exactly once with the returned
     `task` payload. Do not rename the owner, change the model, edit the schema,
     split the batch, or dispatch an additional task.
4. The extension claims the native task call, persists its authoritative result,
   posts the effect, and attaches the deterministic continuation to the task
   result. Follow that continuation; invoke `babysitter_drive` again only when
   the returned state requires it.

Shell effects are executed and checkpointed inside `babysitter_drive`. Never
re-run or post them manually.

---

## 4. Effect Types

When babysitter presents pending effects, identify the `kind` field and execute accordingly:

| Kind | Action |
|------|--------|
| `agent` | Dispatch the driver's exact one-item native task payload |
| `skill` | Dispatch the driver's exact one-item native task payload |
| `shell` | Let `babysitter_drive` execute, checkpoint, and post it |
| `breakpoint` | Present the interaction, then call `babysitter_breakpoint_respond` with the exact decision |
| `sleep` | Return the interaction/waiting state reported by the driver |

For PI-family generated-process guidance, treat `agent`, `skill`, `shell`, `breakpoint`, and `sleep` as the active effect kinds. Do not present `node` as a generated PI-family effect kind.

---

## 5. Posting Results And Ownership

The extension is the single writer for execution checkpoints, immutable output,
`task:post`, and the next `run:iterate` call.

Rules:
- Never invoke `task:post` or `run:iterate` for a driver-owned effect.
- For an `agent` state, preserve the exact one-item native task payload. Its
  stable owner, dispatch token, model selector (including reasoning suffix),
  output schema, and strict schema mode are security and recovery boundaries.
- The blocking `babysitter-task` agent yields its final structured value
  normally. The authenticated blocking task result is the only completion path.
- Do not treat a completed execution checkpoint as a resolved effect until the
  Babysitter journal confirms `EFFECT_RESOLVED`.
- An interrupted or lost blocking task result remains unresolved and follows
  the explicit recovery policy; do not invent a second writer or bypass the
  orchestrator.

---

## 6. Native Todos

oh-my-pi's built-in todos remain native session planning state. They are not
intercepted, redirected, or converted into Babysitter effects. Babysitter may
project run progress alongside native todos when the host supports that API, but
projection never mutates canonical todo state.

Use native todos normally for agent work. Use `babysitter_drive` only for
Babysitter process effects.

---

## 7. Run Completion
When the orchestration run completes successfully, the SDK returns a completion proof. You MUST output it in the following format:

```
<promise>PROOF_VALUE</promise>
```

Where `PROOF_VALUE` is the exact proof string returned by the SDK. This signals to the wrapper and any upstream systems that the run finished with a verified result.

---

## 8. Directory Layout Reference

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
          execution.json     # Durable driver checkpoint
          agent-owner.json   # Exclusive native task owner (agent effects)
          output.json        # Immutable driver output
          result.json        # Task result (created after posting)
      state/
        state.json           # Derived replay cache
```

All paths are relative to the repository root.
