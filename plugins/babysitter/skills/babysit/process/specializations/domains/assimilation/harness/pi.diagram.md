# oh-my-pi Harness Integration -- Process Diagram

```
                    ┌──────────────────────────────┐
                    │    PHASE 1: ANALYZE           │
                    │  Detect omp version,          │
                    │  capabilities, existing config │
                    └──────────────┬───────────────┘
                                   │
                         ┌─────────▼─────────┐
                         │  BREAKPOINT:       │
                         │  Review Analysis   │
                         └─────────┬─────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
   ┌────▼─────┐            ┌──────▼──────┐            ┌──────▼──────┐
   │ 2a:      │            │ 2b:         │            │ 2c:         │
   │ Package  │            │ Extension   │            │ Commands    │
   │ scaffold │            │ skeleton    │            │ scaffold    │
   └────┬─────┘            └──────┬──────┘            └──────┬──────┘
        │                          │                          │
        │                   ┌──────▼──────┐                   │
        │                   │ 2d:         │                   │
        │                   │ AGENTS.md   │                   │
        │                   └──────┬──────┘                   │
        └──────────────────────────┼──────────────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
   ┌────▼─────┐            ┌──────▼──────┐            ┌──────▼──────┐
   │ 3a:      │            │ 3b:         │            │ 3c:         │
   │ Install  │            │ Session     │            │ Loop        │
   │ script   │            │ hooks       │            │ driver      │
   └────┬─────┘            └──────┬──────┘            └──────┬──────┘
        │                          │                          │
        └──────────────────────────┼──────────────────────────┘
                                   │
   ┌───────────────┬───────────────┼───────────────┬───────────────┐
   │               │               │               │               │
┌──▼──┐        ┌───▼───┐      ┌───▼───┐      ┌───▼───┐      ┌───▼───┐
│ 3d: │        │ 3e:   │      │ 3f:   │      │ 3g:   │      │       │
│Effect│       │Result │      │Guards │      │Custom │      │       │
│ map  │       │poster │      │       │      │tools  │      │       │
└──┬──┘        └───┬───┘      └───┬───┘      └───┬───┘      └───────┘
   │               │               │               │
   └───────────────┴───────────────┴───────────────┘
                         │
                ┌────────▼────────┐
                │  PHASE 4: TEST  │
                │  14 tests       │
                └────────┬────────┘
                         │
                ┌────────▼────────┐
                │ PHASE 5: VERIFY │
                │ 10 criteria     │
                │ scored 0-100    │
                └────────┬────────┘
                         │
                    ┌────▼────┐
                    │ quality │──── >= target ──── DONE
                    │ check   │
                    └────┬────┘
                         │ < target
                ┌────────▼────────┐
                │ PHASE 6:        │
                │ CONVERGE        │
                │ Fix → Retest →  │
                │ Reverify        │
                └────────┬────────┘
                         │
                    ┌────▼────┐
                    │ loop    │──── converged ──── DONE
                    └─────────┘
```

## Orchestration Loop (Runtime)

```
┌─────────────────────────────────────────────────────┐
│  oh-my-pi Session                                   │
│                                                     │
│  session_start event                                │
│    └─► babysitter session:init                      │
│    └─► Store session state                          │
│                                                     │
│  User: /babysitter:call "build feature X"           │
│    └─► babysitter run:create --harness pi           │
│    └─► babysitter run:iterate (get first effects)   │
│    └─► Agent executes effects                       │
│    └─► babysitter task:post results                 │
│                                                     │
│  agent_end event (LLM finished turn)                │
│    └─► Check guards (max iter, runaway, completion) │
│    └─► babysitter session:check-iteration           │
│    └─► babysitter run:iterate (next effects)        │
│    └─► Build continuation prompt                    │
│    └─► session.followUp(prompt)                     │
│           │                                         │
│           ▼                                         │
│  Agent runs again (processes follow-up)             │
│    └─► Execute next effects                         │
│    └─► Post results                                 │
│    └─► <promise>PROOF</promise> on completion       │
│                                                     │
│  agent_end event                                    │
│    └─► Detect completion proof                      │
│    └─► Cleanup session state                        │
│    └─► Notify: "Run completed!"                     │
└─────────────────────────────────────────────────────┘
```
