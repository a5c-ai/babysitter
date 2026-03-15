# oh-my-pi Harness Integration Process

## Overview

Integrates the babysitter SDK orchestration engine into oh-my-pi (can1357/oh-my-pi), a feature-rich fork of Pi Coding Agent with sub-agents, structured task management, MCP support, model roles, and a plugin system.

## Strategy: Extension + Package

The integration uses Pi's Extension API as the primary integration point, packaged as an installable Pi package.

## Architecture

```
plugins/pi/
  package.json          -- Pi package manifest with pi: { extensions, skills, commands }
  extensions/
    babysitter/
      index.ts          -- Main extension: event hooks + tool registration
      session-state.ts  -- Session state management (read/write/cleanup)
      cli-wrapper.ts    -- Babysitter CLI invocation helper
      effect-executor.ts-- Effect kind -> omp capability mapping
      result-poster.ts  -- task:post integration (never writes result.json directly)
      guards.ts         -- Iteration guards + runaway detection
      types.ts          -- TypeScript type definitions
  commands/
    babysitter-call/    -- /babysitter:call command
    babysitter-resume/  -- /babysitter:resume command
    babysitter-status/  -- /babysitter:status command
    babysitter-doctor/  -- /babysitter:doctor command
  skills/
    babysitter/SKILL.md -- Babysitter orchestration skill
  scripts/
    postinstall.js      -- SDK installation on package install
    preuninstall.js     -- Cleanup on package removal
    setup.sh            -- Full setup script
  test/
    integration.test.js -- Package structure + SDK availability tests
    harness.test.js     -- Extension hook + guard + effect mapping tests
  AGENTS.md             -- LLM context for orchestration protocol
  README.md             -- Documentation
```

## Loop Driver: agent_end + followUp

Unlike Claude Code (which uses a Stop hook to block exit), oh-my-pi fires `agent_end` when the LLM completes a turn. The babysitter extension uses `session.followUp()` to inject the next iteration prompt, creating a continuous orchestration loop:

```
agent_end fires -> check guards -> call run:iterate -> build prompt -> session.followUp(prompt) -> agent runs again
```

## Effect Mapping

| Babysitter Effect | oh-my-pi Execution |
|---|---|
| agent | Sub-agent/task tool (with model role routing) |
| node | bash tool: `node <script>` |
| shell | bash tool: `<command>` |
| breakpoint | ask tool (multi-choice with approve/reject) |
| sleep | setTimeout with timestamp check |
| skill | /skill:<name> command expansion |
| orchestrator_task | Sub-agent with orchestrator prompt |

## Phases

1. **Analyze** -- Detect oh-my-pi version, capabilities (sub-agents, MCP, ask tool, model roles, background jobs, plugin system)
2. **Scaffold** -- Create package.json, extension skeleton, commands, AGENTS.md (parallel)
3. **Implement** -- Install script, session hooks, loop driver, effect mapping, result posting, guards, custom tools (parallel batches)
4. **Test** -- 14 integration + harness tests
5. **Verify** -- 10-criteria quality scoring (100 points)
6. **Converge** -- Fix issues, re-test, re-verify until target quality met
