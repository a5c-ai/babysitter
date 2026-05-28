---
description: Plan a babysitter run. use this command to plan a complex workflow, without actually running it.
argument-hint: Specific instructions for the run.
allowed-tools: Read, Grep, Write, Task, Bash, Edit, Grep, Glob, WebFetch, WebSearch, Search, AskUserQuestion, TodoWrite, TodoRead, Skill, BashOutput, KillShell, MultiEdit, LS
---

Invoke the babysitter:babysit skill (using the Skill tool) and follow its instructions (SKILL.md). focus on creating the best process possible, but without creating and running the actual run.

If the requested plan touches media, voice, audio, STT, TTS, hands-free, browser capture/playback, or adjacent device-bound paths, include this block in the emitted implementation plan/IMPL.md and fill every row with PASS, FAIL, or SKIP plus one-line evidence:

```markdown
## Device test matrix (REQUIRED for media-touching changes)

For each of the following, mark PASS / FAIL / SKIP with one-line evidence:

- [ ] iPad Safari (PWA install)
- [ ] iPhone Safari (PWA install)
- [ ] macOS Safari (web)
- [ ] Desktop Chrome (web)

If SKIP, justify why (e.g. "non-iOS-Safari path; lint-only change").
```
