# Context Management

Project context loading, isolation, and persistent state management across CCPM sessions.

## Capabilities
- Load project context from .claude/ directory structure
- Maintain persistent context across sessions (PRD, epic, task states)
- Isolate agent contexts per work stream
- Context handoff between phases
- Session state recovery

## Context Sources
```
.claude/
  prds/              # PRD documents
  epics/             # Epic and task documents
  agents/            # Agent definitions
  context/           # Project-wide context
  commands/          # Command definitions
  rules/             # Reference rules
```

## Context Flow
1. **Phase 1** (PRD): Loads project description, creates PRD context
2. **Phase 2** (Epic): Loads PRD, creates architecture context
3. **Phase 3** (Tasks): Loads PRD + Epic, creates task context
4. **Phase 4** (Sync): Loads all artifacts, syncs to GitHub
5. **Phase 5** (Exec): Loads stream-specific context per agent

## Isolation
Each parallel agent receives only the context relevant to its stream, preventing context pollution and keeping agents focused.
