# oh-my-pi Harness Integration Diagram

## Phase Flow

```text
Research
  |
  v
Analyze
  |
  v
Scaffold
  |
  v
Assimilate canonical babysit assets
  |
  v
Core harness binding
  |
  v
Takeover: effects, posting, guards
  |
  v
TUI + UX + install docs
  |
  v
Local tests
  |
  v
Real harness runtime validation
  |
  v
Verify score
  |
  +--> below target --> refine --> retest --> rerun runtime validation --> verify again
  |
  +--> at or above target --> done
```

## Runtime Loop

```text
session_start
  -> session:init
  -> baseline state file

user starts /babysitter:call
  -> run:create --harness pi
  -> run:iterate
  -> execute effects
  -> write output.json
  -> task:post
  -> yield

agent_end
  -> evaluate guards
  -> check completion proof state
  -> if more work:
       build continuation prompt
       session.followUp(prompt)
     else:
       allow exit and cleanup

follow-up turn
  -> run:iterate
  -> execute next effects
  -> task:post
  -> yield

completed run
  -> run reports completionProof
  -> assistant emits <promise>PROOF</promise>
  -> cleanup session state
```

## Edge Cases

```text
- stale session state
- re-entrant run binding
- lock contention
- missing run directory
- crash and restart recovery
- completion proof mismatch
- ambiguous breakpoint response
- direct result.json misuse
- upgrade, reinstall, disable, rollback
```
