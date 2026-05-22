---
description: Assimilate an external methodology, harness, or specification into babysitter process definitions with skills and agents.
argument-hint: Target to assimilate (e.g. repo URL, harness name, or spec path)
allowed-tools: Read, Grep, Write, Task, Bash, Edit, Grep, Glob, WebFetch, WebSearch, Search, AskUserQuestion, TodoWrite, TodoRead, Skill, BashOutput, KillShell, MultiEdit, LS
---

Invoke the babysitter:babysit skill (using the Skill tool) and follow its instructions (SKILL.md).

Use the assimilation domain processes from the active process library to convert external sources into well-defined babysitter process definitions with accompanying skills/ and agents/ directories.

If the workspace does not already have an active process-library binding, initialize it first through the shared global SDK binding:

```bash
babysitter process-library:active --json
```

Run the process after formalizing it.

Available assimilation workflows:
- **methodology-assimilation** (`specializations/meta/assimilation/workflows/methodology-assimilation`) - Learns an external methodology from its repo and converts procedural instructions, commands, and manual flows into babysitter processes with refactored skills and agents. Supports output as methodology or specialization.
- **harness integration** (`specializations/meta/assimilation/harness/*`) - Integrates babysitter SDK with a specific AI coding harness (generic, codex, opencode, gemini-cli, openclaw, antigravity).

During the interview phase, determine which assimilation workflow to use based on the user's target:
- If the target is a **repo URL or methodology name** then use the methodology-assimilation workflow.
- If the target is a **harness name** (e.g. codex, opencode, antigravity) then use the matching harness process.
- If the target is a **specification or other source** then adapt the methodology-assimilation workflow for the spec format.
- If unclear, ask the user to clarify the assimilation target and type.

## After Assimilation: Contribute Back

After successfully assimilating a methodology or harness integration, prompt the user to share it with the community. The assimilated process definitions, skills, and agents could benefit other babysitter users:

- **Completed a methodology assimilation**: `/babysitter:contrib library contribution: assimilated [methodology-name] into babysitter process definitions`
- **Completed a harness integration**: `/babysitter:contrib library contribution: [harness-name] harness integration`
- **Hit issues during assimilation** (e.g. unsupported patterns, missing SDK features): `/babysitter:contrib bug report: assimilation of [target] failed because [description]` or `/babysitter:contrib feature request: [what the SDK needs to support]`

Even just reporting that an assimilation didn't work well helps improve babysitter for everyone.
